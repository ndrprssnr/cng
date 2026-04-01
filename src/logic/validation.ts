import { ExpressionToken, NumberTileData } from '../types/game';

/**
 * Ensures no tile is used more than once in the expression.
 */
export function validateNumberUsage(tokens: ExpressionToken[]): boolean {
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token.type === 'number' && token.tileId) {
      if (seen.has(token.tileId)) return false;
      seen.add(token.tileId);
    }
  }
  return true;
}

/**
 * Returns true if the expression is ready to submit.
 */
export function canSubmit(
  tokens: ExpressionToken[],
  result: number | null,
  tiles: NumberTileData[]
): boolean {
  if (tokens.length === 0) return false;
  if (result === null) return false;
  if (!validateNumberUsage(tokens)) return false;
  void tiles; // tiles used via UI guard; kept as param for future use
  return true;
}

/**
 * Computes score label from the difference between result and target.
 */
export function computeScore(result: number, target: number) {
  const diff = Math.abs(result - target);
  const label: 'exact' | 'close' | 'off' =
    diff === 0 ? 'exact' : diff <= 10 ? 'close' : 'off';
  return { diff, label };
}
