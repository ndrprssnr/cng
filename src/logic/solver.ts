/**
 * Solver for the Countdown Numbers Game.
 *
 * Strategy: recursive search over all subsets and orderings of the available
 * numbers. At each step we pick two numbers from the current pool, apply one
 * of the four operations to produce a new number, replace the pair with the
 * result, and recurse. We track the expression string alongside each value.
 *
 * This mirrors how a human solves the puzzle and naturally produces the
 * simplest (fewest-numbers) expression first because we try smaller subsets
 * before larger ones.
 */

export interface SolverResult {
  expression: string;
  result: number;
}

type Pool = Array<{ value: number; expr: string }>;
type BestRef = { diff: number; result: { value: number; expression: string } | null };

const OPS = ['+', '-', '×', '÷'] as const;
type Op = typeof OPS[number];

function applyOp(op: Op, a: number, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-':
      // Skip a - b when b >= a to avoid negatives/zero (not useful)
      if (b >= a) return null;
      return a - b;
    case '×':
      // Multiplying by 1 produces nothing new
      if (a === 1 || b === 1) return null;
      return a * b;
    case '÷':
      if (b === 0 || b === 1) return null;
      if (a % b !== 0) return null;
      return a / b;
  }
}

function needsParens(expr: string): boolean {
  // Wrap in parens if the expression contains a lower-precedence operator
  // at the top level (i.e., + or - not already parenthesised)
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-')) return true;
  }
  return false;
}

function formatExpr(a: string, op: Op, b: string): string {
  let left = a;
  let right = b;

  if (op === '×' || op === '÷') {
    if (needsParens(a)) left = `(${a})`;
    if (needsParens(b)) right = `(${b})`;
  }

  return `${left} ${op} ${right}`;
}

/**
 * Recursively searches the pool for a result matching target.
 * Updates bestRef whenever a closer result is found.
 */
function search(
  pool: Pool,
  target: number,
  bestRef: BestRef
): void {
  // Check every number currently in the pool as a candidate result
  for (const item of pool) {
    const diff = Math.abs(item.value - target);
    if (diff < bestRef.diff) {
      bestRef.diff = diff;
      bestRef.result = { value: item.value, expression: item.expr };
    }
    if (bestRef.diff === 0) return; // exact — stop searching
  }

  if (pool.length < 2) return;

  // Try every pair (i, j) with i < j, all 4 ops, both orderings a op b and b op a
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i];
      const b = pool[j];
      const rest = pool.filter((_, idx) => idx !== i && idx !== j);

      for (const op of OPS) {
        // Try a op b
        const val1 = applyOp(op, a.value, b.value);
        if (val1 !== null && val1 > 0) {
          const expr1 = formatExpr(a.expr, op, b.expr);
          search([...rest, { value: val1, expr: expr1 }], target, bestRef);
          if (bestRef.diff === 0) return;
        }

        // Try b op a (only meaningful for - and ÷ where order matters)
        if (op === '-' || op === '÷') {
          const val2 = applyOp(op, b.value, a.value);
          if (val2 !== null && val2 > 0) {
            const expr2 = formatExpr(b.expr, op, a.expr);
            search([...rest, { value: val2, expr: expr2 }], target, bestRef);
            if (bestRef.diff === 0) return;
          }
        }
      }
    }
  }
}

/**
 * Finds the best solution for the given numbers and target.
 * Returns the expression and result closest to the target,
 * preferring exact matches and simpler (fewer-number) expressions.
 */
export function solve(numbers: number[], target: number): SolverResult | null {
  if (numbers.length === 0) return null;

  const pool: Pool = numbers.map(n => ({ value: n, expr: String(n) }));
  const bestRef: BestRef = { diff: Infinity, result: null };

  search(pool, target, bestRef);

  if (!bestRef.result) return null;
  return { expression: bestRef.result.expression, result: bestRef.result.value };
}
