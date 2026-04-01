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
  tiles: NumberTileData[];
  target: number;
  expression: ExpressionToken[];
  result: number | null; // live-evaluated value, recomputed in reducer
  score: ScoreResult | null;
  bestSolution: BestSolution | null; // filled after submit
}

export type GameAction =
  | { type: 'TAP_TILE'; tileId: string }
  | { type: 'TAP_OPERATOR'; operator: Operator }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR' }
  | { type: 'SUBMIT' }
  | { type: 'NEW_GAME' };
