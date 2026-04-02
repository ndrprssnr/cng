import { useReducer, useEffect } from 'react';
import { GameState, GameAction, ExpressionToken } from '../types/game';
import { generateNumbers, generateTarget, buildTiles } from '../logic/gameSetup';
import { getLiveResult, evaluateExpression } from '../logic/expressionEngine';
import { canSubmit, computeScore } from '../logic/validation';
import { solve } from '../logic/solver';

function createInitialState(): GameState {
  const numbers = generateNumbers();
  return {
    phase: 'playing',
    solving: true,
    tiles: buildTiles(numbers),
    target: generateTarget(),
    exactSolvable: null,
    precomputedSolution: null,
    expression: [],
    cursorPos: 0,
    result: null,
    score: null,
    bestSolution: null,
  };
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TAP_TILE': {
      const tile = state.tiles.find(t => t.id === action.tileId);
      if (!tile || tile.used || state.phase === 'submitted') return state;

      const token: ExpressionToken = {
        type: 'number',
        display: String(tile.value),
        tileId: tile.id,
        value: tile.value,
      };
      const newExpression = [
        ...state.expression.slice(0, state.cursorPos),
        token,
        ...state.expression.slice(state.cursorPos),
      ];
      const newCursor = state.cursorPos + 1;
      return {
        ...state,
        tiles: state.tiles.map(t => t.id === action.tileId ? { ...t, used: true } : t),
        expression: newExpression,
        cursorPos: newCursor,
        result: getLiveResult(newExpression),
      };
    }

    case 'TAP_OPERATOR': {
      if (state.phase === 'submitted') return state;
      const token: ExpressionToken = {
        type: 'operator',
        display: action.operator,
        operator: action.operator,
      };
      const newExpression = [
        ...state.expression.slice(0, state.cursorPos),
        token,
        ...state.expression.slice(state.cursorPos),
      ];
      const newCursor = state.cursorPos + 1;
      return {
        ...state,
        expression: newExpression,
        cursorPos: newCursor,
        result: getLiveResult(newExpression),
      };
    }

    case 'BACKSPACE': {
      if (state.cursorPos === 0 || state.phase === 'submitted') return state;
      const tokenToRemove = state.expression[state.cursorPos - 1];
      const newExpression = [
        ...state.expression.slice(0, state.cursorPos - 1),
        ...state.expression.slice(state.cursorPos),
      ];
      const newTiles = tokenToRemove.type === 'number' && tokenToRemove.tileId
        ? state.tiles.map(t => t.id === tokenToRemove.tileId ? { ...t, used: false } : t)
        : state.tiles;
      return {
        ...state,
        tiles: newTiles,
        expression: newExpression,
        cursorPos: state.cursorPos - 1,
        result: getLiveResult(newExpression),
      };
    }

    case 'CLEAR': {
      if (state.phase === 'submitted') return state;
      return {
        ...state,
        tiles: state.tiles.map(t => ({ ...t, used: false })),
        expression: [],
        cursorPos: 0,
        result: null,
      };
    }

    case 'MOVE_CURSOR': {
      if (state.phase === 'submitted') return state;
      const next = state.cursorPos + action.delta;
      if (next < 0 || next > state.expression.length) return state;
      return { ...state, cursorPos: next };
    }

    case 'SUBMIT': {
      if (!canSubmit(state.expression, state.result, state.tiles)) return state;
      const result = evaluateExpression(state.expression);
      if (result === null) return state;
      const score = computeScore(result, state.target);
      const bestSolution = score.label === 'exact' ? null : state.precomputedSolution;
      return {
        ...state,
        phase: 'submitted',
        result,
        score,
        bestSolution,
      };
    }

    case 'NEW_GAME': {
      return createInitialState();
    }

    case 'SOLUTION_READY': {
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

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Run the solver asynchronously so the UI renders before the heavy computation.
  useEffect(() => {
    const numbers = state.tiles.map(t => t.value);
    const target = state.target;
    const timer = setTimeout(() => {
      const solution = solve(numbers, target);
      dispatch({
        type: 'SOLUTION_READY',
        solution: solution ? { expression: solution.expression, result: solution.result } : null,
        exactSolvable: solution !== null && solution.result === target,
      });
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === 'playing' && state.solving]);

  return { state, dispatch };
}
