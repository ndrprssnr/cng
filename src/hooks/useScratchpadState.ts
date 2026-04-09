import { useReducer, useEffect } from 'react';
import { NumberTileData, ExpressionToken, BestSolution } from '../types/game';
import { ScratchpadState, ScratchpadAction, ScratchLine, ResultTile } from '../types/scratchpad';
import { getLiveResult } from '../logic/expressionEngine';
import { computeScore } from '../logic/validation';
import { solve } from '../logic/solver';
import { buildTiles } from '../logic/gameSetup';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _lineCounter = 0;

function makeLineId(): string { return `line-${_lineCounter++}`; }

function emptyLine(): ScratchLine {
  return { id: makeLineId(), expression: [], cursorPos: 0, result: null };
}

/**
 * A result tile's id equals its source line's id — permanently stable.
 * Rebuild from the current set of lines that have a non-null result.
 * The 'used' flag is derived from whether any token in any line references this tile.
 */
function buildResultTiles(lines: ScratchLine[]): ResultTile[] {
  // Which tile ids are actively referenced (non-stale) across all lines
  const referencedIds = new Set<string>();
  for (const line of lines) {
    for (const tok of line.expression) {
      if (tok.type === 'number' && tok.tileId && !tok.tileId.startsWith('num-') && !tok.stale) {
        referencedIds.add(tok.tileId);
      }
    }
  }
  return lines
    .filter(l => l.result !== null)
    .map(l => ({ id: l.id, value: l.result as number, sourceLineId: l.id, used: referencedIds.has(l.id) }));
}

/**
 * Propagate result-tile changes through all consuming lines.
 *
 * Because tile id === source line id, tileById.get(tok.tileId) always resolves correctly
 * regardless of whether the source result was temporarily null between passes.
 *
 * Per-token logic:
 *   - Source has result and value matches → clear stale if set
 *   - Source has result and value differs  → update value/display, clear stale
 *   - Source has no result (not in tileById) → mark stale
 *
 * Iterates until stable to handle chains A→B→C.
 */
function propagateUpdates(lines: ScratchLine[]): { lines: ScratchLine[]; resultTiles: ResultTile[] } {
  let currentLines = lines;

  for (let pass = 0; pass < currentLines.length + 1; pass++) {
    // Build a map of lineId → current result value for all lines with a result
    const resultById = new Map<string, number>();
    for (const l of currentLines) {
      if (l.result !== null) resultById.set(l.id, l.result);
    }

    let anyChange = false;
    const updatedLines = currentLines.map(line => {
      let changed = false;
      const newExpr = line.expression.map(tok => {
        if (tok.type !== 'number' || !tok.tileId || tok.tileId.startsWith('num-')) return tok;
        const currentVal = resultById.get(tok.tileId);
        if (currentVal === undefined) {
          // Source line has no result → mark stale
          if (!tok.stale) { changed = true; return { ...tok, stale: true }; }
          return tok;
        }
        if (currentVal !== tok.value || tok.stale) {
          // Source result changed or recovering from stale → update
          changed = true;
          return { ...tok, value: currentVal, display: String(currentVal), stale: false };
        }
        return tok;
      });

      if (!changed) return line;
      anyChange = true;
      const result = getLiveResult(newExpr);
      return { ...line, expression: newExpr, result };
    });

    currentLines = updatedLines;
    if (!anyChange) break;
  }

  return { lines: currentLines, resultTiles: buildResultTiles(currentLines) };
}

/**
 * When a line is deleted, remove any tokens referencing it from all other lines,
 * and free the original number tiles those tokens were using.
 */
function removeReferencesToLine(
  deletedLineId: string,
  lines: ScratchLine[],
  tiles: NumberTileData[]
): { lines: ScratchLine[]; tiles: NumberTileData[] } {
  let updatedTiles = tiles;
  const updatedLines = lines.map(line => {
    const refsToRemove = line.expression.filter(
      tok => tok.type === 'number' && tok.tileId === deletedLineId
    );
    if (refsToRemove.length === 0) return line;

    // Free any original tiles used within the same expression that the removed token depended on
    // (the removed token itself is a result-tile reference, not an original tile — nothing to free
    //  for the result tile since that line is being deleted; but we must adjust cursor)
    const newExpr = line.expression.filter(tok => !(tok.type === 'number' && tok.tileId === deletedLineId));
    const removedBeforeCursor = refsToRemove.filter(
      (_, i) => line.expression.indexOf(refsToRemove[i]) < line.cursorPos
    ).length;
    const newCursor = Math.max(0, line.cursorPos - removedBeforeCursor);
    const result = getLiveResult(newExpr);
    return { ...line, expression: newExpr, cursorPos: newCursor, result };
  });
  return { lines: updatedLines, tiles: updatedTiles };
}

/**
 * Free original tiles and result-tile references that a given line was using.
 * Stale tokens reference no live result tile — nothing to unmark for them.
 */
function freeTilesForLine(
  line: ScratchLine,
  tiles: NumberTileData[]
): NumberTileData[] {
  const usedOriginal = new Set<string>();
  for (const tok of line.expression) {
    if (tok.type === 'number' && tok.tileId && !tok.stale && tok.tileId.startsWith('num-')) {
      usedOriginal.add(tok.tileId);
    }
  }
  return tiles.map(t => usedOriginal.has(t.id) ? { ...t, used: false } : t);
}

function recomputeLine(
  lines: ScratchLine[],
  lineId: string,
  newExpr: ExpressionToken[],
  newCursor: number
): ScratchLine[] {
  return lines.map(l => {
    if (l.id !== lineId) return l;
    const result = getLiveResult(newExpr);
    return { ...l, expression: newExpr, cursorPos: newCursor, result };
  });
}

function createInitialState(tiles: NumberTileData[], target: number, gameId: number): ScratchpadState {
  const firstLine = emptyLine();
  return {
    phase: 'playing',
    solving: true,
    gameId,
    tiles: tiles.map(t => ({ ...t, used: false })),
    target,
    exactSolvable: null,
    precomputedSolution: null,
    lines: [firstLine],
    activeLineId: firstLine.id,
    resultTiles: [],
    score: null,
    bestSolution: null,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: ScratchpadState, action: ScratchpadAction): ScratchpadState {
  if (state.phase === 'submitted' &&
      action.type !== 'SP_NEW_GAME' &&
      action.type !== 'SP_SOLUTION_READY' &&
      action.type !== 'SP_SUBMIT') {
    return state;
  }

  switch (action.type) {

    case 'SP_TAP_TILE': {
      const tile = state.tiles.find(t => t.id === action.tileId);
      if (!tile || tile.used) return state;
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;

      const token: ExpressionToken = {
        type: 'number', display: String(tile.value),
        tileId: tile.id, value: tile.value,
      };
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos),
        token,
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos + 1;
      const lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const tiles = state.tiles.map(t => t.id === action.tileId ? { ...t, used: true } : t);
      const { lines: updated, resultTiles } = propagateUpdates(lines);
      return checkWinAndAutoLine({ ...state, tiles, lines: updated, resultTiles });
    }

    case 'SP_TAP_RESULT': {
      const rt = state.resultTiles.find(r => r.id === action.resultId);
      if (!rt || rt.used) return state;
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;
      // Cannot use the result tile from the active line itself
      if (rt.sourceLineId === state.activeLineId) return state;

      // tileId for a result-tile token = the source line's id
      const token: ExpressionToken = {
        type: 'number', display: String(rt.value),
        tileId: rt.sourceLineId, value: rt.value,
      };
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos),
        token,
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos + 1;
      const lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const { lines: updated, resultTiles } = propagateUpdates(lines);
      return checkWinAndAutoLine({ ...state, lines: updated, resultTiles });
    }

    case 'SP_TAP_OPERATOR': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;
      const token: ExpressionToken = {
        type: 'operator', display: action.operator, operator: action.operator,
      };
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos),
        token,
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos + 1;
      const lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const { lines: updated, resultTiles } = propagateUpdates(lines);
      return { ...state, lines: updated, resultTiles };
    }

    case 'SP_BACKSPACE': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine || activeLine.cursorPos === 0) return state;
      const tokenToRemove = activeLine.expression[activeLine.cursorPos - 1];
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos - 1),
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos - 1;

      let tiles = state.tiles;
      // Only free original number tiles; result-tile references are tracked by propagateUpdates
      if (tokenToRemove?.type === 'number' && tokenToRemove.tileId?.startsWith('num-') && !tokenToRemove.stale) {
        tiles = tiles.map(t => t.id === tokenToRemove.tileId ? { ...t, used: false } : t);
      }

      const lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const { lines: updated, resultTiles } = propagateUpdates(lines);
      return { ...state, tiles, lines: updated, resultTiles };
    }

    case 'SP_CLEAR_LINE': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;
      const tiles = freeTilesForLine(activeLine, state.tiles);
      const lines = recomputeLine(state.lines, state.activeLineId, [], 0);
      const { lines: updated, resultTiles } = propagateUpdates(lines);
      return { ...state, tiles, lines: updated, resultTiles };
    }

    case 'SP_MOVE_CURSOR': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;
      const next = activeLine.cursorPos + action.delta;
      if (next < 0 || next > activeLine.expression.length) return state;
      const lines = state.lines.map(l =>
        l.id === state.activeLineId ? { ...l, cursorPos: next } : l
      );
      return { ...state, lines };
    }

    case 'SP_SET_CURSOR': {
      const line = state.lines.find(l => l.id === action.lineId);
      if (!line) return state;
      const pos = Math.max(0, Math.min(action.pos, line.expression.length));
      const lines = state.lines.map(l =>
        l.id === action.lineId ? { ...l, cursorPos: pos } : l
      );
      return { ...state, lines, activeLineId: action.lineId };
    }

    case 'SP_SET_ACTIVE_LINE': {
      const line = state.lines.find(l => l.id === action.lineId);
      if (!line) return state;
      return { ...state, activeLineId: action.lineId };
    }

    case 'SP_ADD_LINE': {
      const newLine = emptyLine();
      return { ...state, lines: [...state.lines, newLine], activeLineId: newLine.id };
    }

    case 'SP_DELETE_LINE': {
      if (state.lines.length === 1) return state;
      const lineToDelete = state.lines.find(l => l.id === action.lineId);
      if (!lineToDelete) return state;

      // Free original tiles used by the deleted line
      let tiles = freeTilesForLine(lineToDelete, state.tiles);

      // Remove references to the deleted line's result from all other lines,
      // freeing any original tiles those sub-expressions used
      const filtered = state.lines.filter(l => l.id !== action.lineId);
      const { lines: cleaned, tiles: tiles2 } = removeReferencesToLine(action.lineId, filtered, tiles);
      tiles = tiles2;

      // Also free original tiles used by tokens that referenced the deleted line's result
      // (those tokens were in other lines and are now removed — their original tile deps stay)
      // Note: removeReferencesToLine only removes the result-tile token itself, not original
      // tiles in the same expression. Those remain until the user explicitly removes them.

      const { lines: updated, resultTiles } = propagateUpdates(cleaned);

      const newActiveId =
        state.activeLineId === action.lineId
          ? (updated[updated.length - 1]?.id ?? updated[0]?.id)
          : state.activeLineId;

      return { ...state, tiles, lines: updated, resultTiles, activeLineId: newActiveId };
    }

    case 'SP_SUBMIT': {
      const candidateLines = state.lines.filter(l => l.result !== null);
      if (candidateLines.length === 0) return state;
      const bestLine = candidateLines.reduce((best, l) => {
        const bestDiff = Math.abs((best.result as number) - state.target);
        const lDiff = Math.abs((l.result as number) - state.target);
        return lDiff < bestDiff ? l : best;
      });
      const userResult = bestLine.result as number;
      const score = computeScore(userResult, state.target);
      const pre = state.precomputedSolution;
      let bestSolution: BestSolution | null = null;
      if (pre) {
        if (userResult === state.target && pre.result === state.target) {
          const numCount = bestLine.expression.filter(t => t.type === 'number').length;
          if (pre.numCount < numCount) bestSolution = pre;
        } else if (userResult !== state.target) {
          bestSolution = pre;
        }
      }
      return { ...state, phase: 'submitted', score, bestSolution };
    }

    case 'SP_NEW_GAME': {
      _lineCounter = 0;
      return createInitialState(action.tiles, action.target, state.gameId + 1);
    }

    case 'SP_SOLUTION_READY': {
      return {
        ...state,
        solving: false,
        exactSolvable: action.exactSolvable,
        precomputedSolution: action.solution,
      };
    }

    default:
      return state;
  }
}

/**
 * After any expression change on the active line, check:
 * 1. If target hit → auto-submit
 * 2. If a valid result exists and the active line is the last non-empty one → auto-append
 */
function checkWinAndAutoLine(state: ScratchpadState): ScratchpadState {
  const activeLine = state.lines.find(l => l.id === state.activeLineId);
  if (!activeLine) return state;

  if (activeLine.result === state.target) {
    const score = computeScore(activeLine.result, state.target);
    const pre = state.precomputedSolution;
    let bestSolution: BestSolution | null = null;
    if (pre && pre.result === state.target) {
      const numCount = activeLine.expression.filter(t => t.type === 'number').length;
      if (pre.numCount < numCount) bestSolution = pre;
    }
    return { ...state, phase: 'submitted', score, bestSolution };
  }

  const lastLine = state.lines[state.lines.length - 1];
  if (
    activeLine.result !== null &&
    activeLine.id === lastLine.id &&
    lastLine.expression.length > 0
  ) {
    const newLine = emptyLine();
    return { ...state, lines: [...state.lines, newLine] };
  }

  return state;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScratchpadState(tiles: NumberTileData[], target: number) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => {
      _lineCounter = 0;
      return createInitialState(buildTiles(tiles.map(t => t.value)), target, 0);
    }
  );

  // Run solver async so UI renders first; re-runs on each new game via state.gameId
  useEffect(() => {
    const numbers = state.tiles.map(t => t.value);
    const t = state.target;
    const timer = setTimeout(() => {
      const solution = solve(numbers, t);
      dispatch({
        type: 'SP_SOLUTION_READY',
        solution: solution ? {
          expression: solution.expression,
          result: solution.result,
          numCount: solution.numCount,
        } : null,
        exactSolvable: solution !== null && solution.result === t,
      });
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameId]);

  return { state, dispatch };
}
