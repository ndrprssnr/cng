import { useReducer, useEffect } from 'react';
import { NumberTileData, ExpressionToken, BestSolution } from '../types/game';
import { ScratchpadState, ScratchpadAction, ScratchLine, ResultTile } from '../types/scratchpad';
import { getLiveResult } from '../logic/expressionEngine';
import { computeScore } from '../logic/validation';
import { solve } from '../logic/solver';
import { buildTiles } from '../logic/gameSetup';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _lineCounter = 0;
let _resultCounter = 0;

function makeLineId(): string { return `line-${_lineCounter++}`; }
function makeResultId(): string { return `res-${_resultCounter++}`; }

function emptyLine(): ScratchLine {
  return { id: makeLineId(), expression: [], cursorPos: 0, result: null, locked: false };
}

/**
 * Rebuild result tiles from scratch based on current line results.
 * Preserves 'used' state and id for lines whose result hasn't changed.
 */
function rebuildResultTiles(lines: ScratchLine[], prev: ResultTile[]): ResultTile[] {
  const prevMap = new Map(prev.map(r => [r.sourceLineId, r]));
  const tiles: ResultTile[] = [];
  for (const line of lines) {
    if (line.result !== null && !line.locked) {
      const existing = prevMap.get(line.id);
      if (existing && existing.value === line.result) {
        tiles.push(existing);
      } else {
        // New result or changed result — create fresh tile, mark not used
        tiles.push({
          id: existing ? existing.id : makeResultId(),
          value: line.result,
          sourceLineId: line.id,
          used: false,
        });
      }
    }
  }
  return tiles;
}

/**
 * Determine which lines are locked by checking whether any result token they
 * reference still matches the current resultTile value.
 */
function applyLocking(lines: ScratchLine[], resultTiles: ResultTile[]): ScratchLine[] {
  const tileById = new Map(resultTiles.map(r => [r.id, r]));
  return lines.map(line => {
    const shouldLock = line.expression.some(tok => {
      if (tok.type !== 'number' || !tok.tileId) return false;
      if (tok.tileId.startsWith('num-')) return false; // original tile, not a result tile
      const rt = tileById.get(tok.tileId);
      if (!rt) return true;                // result tile gone (source line deleted or locked)
      return rt.value !== tok.value;       // value changed
    });
    if (shouldLock === line.locked) return line;
    return { ...line, locked: shouldLock };
  });
}

/**
 * Free all original tiles and result tiles that a given line was using.
 */
function freeTilesForLine(
  line: ScratchLine,
  tiles: NumberTileData[],
  resultTiles: ResultTile[]
): { tiles: NumberTileData[]; resultTiles: ResultTile[] } {
  const usedOriginal = new Set<string>();
  const usedResult = new Set<string>();
  for (const tok of line.expression) {
    if (tok.type === 'number' && tok.tileId) {
      if (tok.tileId.startsWith('num-')) usedOriginal.add(tok.tileId);
      else usedResult.add(tok.tileId);
    }
  }
  return {
    tiles: tiles.map(t => usedOriginal.has(t.id) ? { ...t, used: false } : t),
    resultTiles: resultTiles.map(r => usedResult.has(r.id) ? { ...r, used: false } : r),
  };
}

/**
 * Iteratively rebuild result tiles and apply locking until stable.
 * Each round may lock new lines, which removes their result tiles,
 * which may lock further downstream lines.
 */
function rebuildAndLock(
  lines: ScratchLine[],
  prevResultTiles: ResultTile[]
): { lines: ScratchLine[]; resultTiles: ResultTile[] } {
  let currentLines = lines;
  let currentTiles = prevResultTiles;
  for (let i = 0; i < lines.length; i++) {
    const newTiles = rebuildResultTiles(currentLines, currentTiles);
    const newLines = applyLocking(currentLines, newTiles);
    // Check if anything changed
    const stable =
      newLines.every((l, idx) => l.locked === currentLines[idx].locked) &&
      newTiles.length === currentTiles.length;
    currentLines = newLines;
    currentTiles = newTiles;
    if (stable) break;
  }
  return { lines: currentLines, resultTiles: currentTiles };
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
    return { ...l, expression: newExpr, cursorPos: newCursor, result, locked: false };
  });
}

function createInitialState(tiles: NumberTileData[], target: number): ScratchpadState {
  const firstLine = emptyLine();
  return {
    phase: 'playing',
    solving: true,
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
      if (!activeLine || activeLine.locked) return state;

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
      let lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const tiles = state.tiles.map(t => t.id === action.tileId ? { ...t, used: true } : t);
      const { lines: lockedLines, resultTiles } = rebuildAndLock(lines, state.resultTiles);
      return checkWinAndAutoLine({ ...state, tiles, lines: lockedLines, resultTiles });
    }

    case 'SP_TAP_RESULT': {
      const rt = state.resultTiles.find(r => r.id === action.resultId);
      if (!rt || rt.used) return state;
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine || activeLine.locked) return state;
      // Cannot use the result tile from the active line itself
      if (rt.sourceLineId === state.activeLineId) return state;

      const token: ExpressionToken = {
        type: 'number', display: String(rt.value),
        tileId: rt.id, value: rt.value,
      };
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos),
        token,
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos + 1;
      let lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const markedResultTiles = state.resultTiles.map(r => r.id === action.resultId ? { ...r, used: true } : r);
      const { lines: lockedLines, resultTiles: rebuilt } = rebuildAndLock(lines, markedResultTiles);
      return checkWinAndAutoLine({ ...state, lines: lockedLines, resultTiles: rebuilt });
    }

    case 'SP_TAP_OPERATOR': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine || activeLine.locked) return state;
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
      const { lines: lockedLines, resultTiles } = rebuildAndLock(lines, state.resultTiles);
      return { ...state, lines: lockedLines, resultTiles };
    }

    case 'SP_BACKSPACE': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine || activeLine.locked || activeLine.cursorPos === 0) return state;
      const tokenToRemove = activeLine.expression[activeLine.cursorPos - 1];
      const newExpr = [
        ...activeLine.expression.slice(0, activeLine.cursorPos - 1),
        ...activeLine.expression.slice(activeLine.cursorPos),
      ];
      const newCursor = activeLine.cursorPos - 1;

      let tiles = state.tiles;
      let resultTiles = state.resultTiles;

      if (tokenToRemove?.type === 'number' && tokenToRemove.tileId) {
        if (tokenToRemove.tileId.startsWith('num-')) {
          tiles = tiles.map(t => t.id === tokenToRemove.tileId ? { ...t, used: false } : t);
        } else {
          resultTiles = resultTiles.map(r => r.id === tokenToRemove.tileId ? { ...r, used: false } : r);
        }
      }

      let lines = recomputeLine(state.lines, state.activeLineId, newExpr, newCursor);
      const { lines: lockedLines, resultTiles: rebuilt } = rebuildAndLock(lines, resultTiles);
      return { ...state, tiles, lines: lockedLines, resultTiles: rebuilt };
    }

    case 'SP_CLEAR_LINE': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine) return state;
      const freed = freeTilesForLine(activeLine, state.tiles, state.resultTiles);
      const lines = recomputeLine(state.lines, state.activeLineId, [], 0);
      const { lines: lockedLines, resultTiles: rebuilt } = rebuildAndLock(lines, freed.resultTiles);
      return { ...state, tiles: freed.tiles, lines: lockedLines, resultTiles: rebuilt };
    }

    case 'SP_MOVE_CURSOR': {
      const activeLine = state.lines.find(l => l.id === state.activeLineId);
      if (!activeLine || activeLine.locked) return state;
      const next = activeLine.cursorPos + action.delta;
      if (next < 0 || next > activeLine.expression.length) return state;
      const lines = state.lines.map(l =>
        l.id === state.activeLineId ? { ...l, cursorPos: next } : l
      );
      return { ...state, lines };
    }

    case 'SP_SET_CURSOR': {
      const line = state.lines.find(l => l.id === action.lineId);
      if (!line || line.locked) return state;
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
      if (state.lines.length === 1) return state; // always keep at least one line
      const lineToDelete = state.lines.find(l => l.id === action.lineId);
      if (!lineToDelete) return state;

      const freed = freeTilesForLine(lineToDelete, state.tiles, state.resultTiles);
      const filtered = state.lines.filter(l => l.id !== action.lineId);
      const { lines: lockedLines, resultTiles: rebuilt } = rebuildAndLock(filtered, freed.resultTiles);

      const newActiveId =
        state.activeLineId === action.lineId
          ? (lockedLines[lockedLines.length - 1]?.id ?? lockedLines[0]?.id)
          : state.activeLineId;

      return { ...state, tiles: freed.tiles, lines: lockedLines, resultTiles: rebuilt, activeLineId: newActiveId };
    }

    case 'SP_SUBMIT': {
      // Pick the line closest to target (prefer exact match, then smallest diff)
      const candidateLines = state.lines.filter(l => l.result !== null && !l.locked);
      if (candidateLines.length === 0) return state;
      const bestLine = candidateLines.reduce((best, l) => {
        const bestDiff = Math.abs((best.result as number) - state.target);
        const lDiff = Math.abs((l.result as number) - state.target);
        return lDiff < bestDiff ? l : best;
      });
      const score = computeScore(bestLine.result as number, state.target);
      const pre = state.precomputedSolution;
      let bestSolution: BestSolution | null = null;
      if (pre && pre.result === state.target && bestLine.result === state.target) {
        const numCount = bestLine.expression.filter(t => t.type === 'number').length;
        if (pre.numCount < numCount) bestSolution = pre;
      }
      return { ...state, phase: 'submitted', score, bestSolution };
    }

    case 'SP_NEW_GAME': {
      _lineCounter = 0;
      _resultCounter = 0;
      return createInitialState(action.tiles, action.target);
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
 * 2. If a valid result exists and the last line is non-empty → auto-append new empty line
 */
function checkWinAndAutoLine(state: ScratchpadState): ScratchpadState {
  const activeLine = state.lines.find(l => l.id === state.activeLineId);
  if (!activeLine) return state;

  // Win check
  if (activeLine.result === state.target) {
    const score = computeScore(activeLine.result, state.target);
    const pre = state.precomputedSolution;
    let bestSolution: BestSolution | null = null;
    if (pre && pre.result === state.target) {
      // Count numbers used by the winning line
      const numCount = activeLine.expression.filter(t => t.type === 'number').length;
      if (pre.numCount < numCount) bestSolution = pre;
    }
    return { ...state, phase: 'submitted', score, bestSolution };
  }

  // Auto-append new line when the active line has a result and the last line is not empty.
  // Do NOT change activeLineId — let the user keep editing the current line.
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
      _resultCounter = 0;
      return createInitialState(buildTiles(tiles.map(t => t.value)), target);
    }
  );

  // Run solver async so UI renders first
  useEffect(() => {
    const numbers = tiles.map(t => t.value);
    const t = target;
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
  }, []);

  return { state, dispatch };
}
