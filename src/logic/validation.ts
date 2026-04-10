/**
 * Computes score label from the difference between result and target.
 */
export function computeScore(result: number, target: number) {
  const diff = Math.abs(result - target);
  const label: 'exact' | 'close' | 'off' =
    diff === 0 ? 'exact' : diff <= 10 ? 'close' : 'off';
  return { diff, label };
}
