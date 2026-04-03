export type Operator = '+' | '-' | '×' | '÷' | '(' | ')';

export interface NumberTileData {
  id: string;      // "num-0" … "num-5"
  value: number;
  used: boolean;
}

export interface ExpressionToken {
  type: 'number' | 'operator';
  display: string;
  tileId?: string;   // links number token back to its tile (type === 'number')
  value?: number;    // set when type === 'number'
  operator?: Operator; // set when type === 'operator'
}

export interface ScoreResult {
  diff: number;
  label: 'exact' | 'close' | 'off'; // exact=0, close=1-10, off=11+
}

export interface BestSolution {
  expression: string;
  result: number;
}

export interface GameState {
  phase: 'playing' | 'submitted';
  solving: boolean;                            // true while solver is running in the background
  tiles: NumberTileData[];
  target: number;
  exactSolvable: boolean | null;               // null until solver completes
  precomputedSolution: BestSolution | null;    // solver result computed at game start
  expression: ExpressionToken[];
  cursorPos: number;     // insertion point: 0 = before first token, expression.length = end
  result: number | null; // live-evaluated value, recomputed in reducer
  score: ScoreResult | null;
  bestSolution: BestSolution | null; // filled after submit
}

export type GameAction =
  | { type: 'TAP_TILE'; tileId: string }
  | { type: 'TAP_OPERATOR'; operator: Operator }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR' }
  | { type: 'MOVE_CURSOR'; delta: -1 | 1 }
  | { type: 'SET_CURSOR'; pos: number }
  | { type: 'SUBMIT' }
  | { type: 'NEW_GAME' }
  | { type: 'SOLUTION_READY'; solution: BestSolution | null; exactSolvable: boolean };
