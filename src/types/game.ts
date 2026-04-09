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
  stale?: boolean;   // true when a result-tile reference whose source no longer exists
}

export interface ScoreResult {
  diff: number;
  label: 'exact' | 'close' | 'off'; // exact=0, close=1-10, off=11+
}

export interface BestSolution {
  expression: string;
  result: number;
  numCount: number;
}
