import { useReducer } from 'react';
import { GameState, GameAction, ExpressionToken } from '../types/game';
import { generateNumbers, generateTarget, buildTiles } from '../logic/gameSetup';
import { getLiveResult, evaluateExpression } from '../logic/expressionEngine';
import { canSubmit, computeScore } from '../logic/validation';
import { solve } from '../logic/solver';

function createInitialState(): GameState {
  const numbers = generateNumbers();
  return {
    phase: 'playing',
    tiles: buildTiles(numbers),
    target: generateTarget(),
    expression: [],
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
      const newExpression = [...state.expression, token];
      return {
        ...state,
        tiles: state.tiles.map(t => t.id === action.tileId ? { ...t, used: true } : t),
        expression: newExpression,
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
      const newExpression = [...state.expression, token];
      return {
        ...state,
        expression: newExpression,
        result: getLiveResult(newExpression),
      };
    }

    case 'BACKSPACE': {
      if (state.expression.length === 0 || state.phase === 'submitted') return state;
      const last = state.expression[state.expression.length - 1];
      const newExpression = state.expression.slice(0, -1);
      const newTiles = last.type === 'number' && last.tileId
        ? state.tiles.map(t => t.id === last.tileId ? { ...t, used: false } : t)
        : state.tiles;
      return {
        ...state,
        tiles: newTiles,
        expression: newExpression,
        result: getLiveResult(newExpression),
      };
    }

    case 'CLEAR': {
      if (state.phase === 'submitted') return state;
      return {
        ...state,
        tiles: state.tiles.map(t => ({ ...t, used: false })),
        expression: [],
        result: null,
      };
    }

    case 'SUBMIT': {
      if (!canSubmit(state.expression, state.result, state.tiles)) return state;
      const result = evaluateExpression(state.expression);
      if (result === null) return state;
      const score = computeScore(result, state.target);
      const numbers = state.tiles.map(t => t.value);
      const bestSolution = score.label === 'exact'
        ? null
        : solve(numbers, state.target);
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

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  return { state, dispatch };
}
