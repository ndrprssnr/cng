import { BestSolution, ExpressionToken, NumberTileData, Operator, ScoreResult } from './game';

/** A result tile produced by a completed scratch line. */
export interface ResultTile {
  id: string;           // "res-0", "res-1", …
  value: number;
  sourceLineId: string; // which ScratchLine produced this
  used: boolean;        // true when consumed by another line's token
}

/** One row of the scratchpad. */
export interface ScratchLine {
  id: string;           // "line-0", "line-1", …
  expression: ExpressionToken[];
  cursorPos: number;
  result: number | null;
}

/** A snapshot of the user's working state, saved mid-game for later restoration. */
export interface ScratchpadSnapshot {
  lines: ScratchLine[];
  tiles: NumberTileData[];
  activeLineId: string;
  resultTiles: ResultTile[];
  bestResult: number | null;
}

export interface ScratchpadState {
  phase: 'playing' | 'submitted';
  gameId: number;                      // increments on each new game, used to re-run solver
  tiles: NumberTileData[];
  target: number;
  exactSolvable: boolean | null;
  precomputedSolution: BestSolution | null;
  lines: ScratchLine[];
  activeLineId: string;
  resultTiles: ResultTile[];          // one entry per line that has a non-null result
  score: ScoreResult | null;
  bestSolution: BestSolution | null;
  snapshot: ScratchpadSnapshot | null;
}

export type ScratchpadAction =
  | { type: 'SP_TAP_TILE'; tileId: string }
  | { type: 'SP_TAP_RESULT'; resultId: string }
  | { type: 'SP_TAP_OPERATOR'; operator: Operator }
  | { type: 'SP_BACKSPACE' }
  | { type: 'SP_CLEAR_LINE' }
  | { type: 'SP_RESET' }
  | { type: 'SP_MOVE_CURSOR'; delta: -1 | 1 }
  | { type: 'SP_SET_CURSOR'; lineId: string; pos: number }
  | { type: 'SP_SET_ACTIVE_LINE'; lineId: string }
  | { type: 'SP_ADD_LINE' }
  | { type: 'SP_DELETE_LINE'; lineId: string }
  | { type: 'SP_SUBMIT' }
  | { type: 'SP_NEW_GAME' }
  | { type: 'SP_SOLUTION_READY'; solution: BestSolution | null; exactSolvable: boolean }
  | { type: 'SP_SAVE_SNAPSHOT' }
  | { type: 'SP_RESTORE_SNAPSHOT' };
