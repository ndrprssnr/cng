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
  numCount: number;
}

type Pool = Array<{ value: number; expr: string; numCount: number }>;
type BestRef = {
  diff: number;
  numCount: number;
  result: { value: number; expression: string } | null
};

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
  // True if the expression contains a + or - at the top level (outside parens)
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-')) return true;
  }
  return false;
}

function hasAnyOperator(expr: string): boolean {
  // True if the expression contains any operator at the top level
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-' || ch === '×' || ch === '÷')) return true;
  }
  return false;
}

function formatExpr(a: { expr: string; numCount: number }, op: Op, b: { expr: string; numCount: number }): { expr: string; numCount: number } {
  let left = a.expr;
  let right = b.expr;

  if (op === '×' || op === '÷') {
    // Both operands need parens if they contain lower-precedence ops
    if (needsParens(a.expr)) left = `(${a.expr})`;
    if (needsParens(b.expr)) right = `(${b.expr})`;
    // Right operand of ÷ also needs parens if it contains × or ÷
    if (op === '÷' && hasAnyOperator(b.expr)) right = `(${b.expr})`;
  } else if (op === '-') {
    // Right operand of - needs parens if it contains + or - (e.g. a-(b+c))
    if (needsParens(b.expr)) right = `(${b.expr})`;
  }

  return {
    expr: `${left} ${op} ${right}`,
    numCount: a.numCount + b.numCount,
  };
}

/**
 * Returns true if candidate (diff, numCount) is better than current best.
 * Priority: smallest diff → fewest numbers.
 */
function isBetter(
  diff: number, numCount: number,
  best: BestRef
): boolean {
  if (diff !== best.diff) return diff < best.diff;
  return numCount < best.numCount;
}

/**
 * Recursively searches the pool for a result matching target.
 * Updates bestRef whenever a better result is found.
 */
function search(
  pool: Pool,
  target: number,
  bestRef: BestRef
): void {
  // Check every number currently in the pool as a candidate result
  for (const item of pool) {
    const diff = Math.abs(item.value - target);
    if (isBetter(diff, item.numCount, bestRef)) {
      bestRef.diff = diff;
      bestRef.numCount = item.numCount;
      bestRef.result = { value: item.value, expression: item.expr };
    }
    if (bestRef.diff === 0 && bestRef.numCount === 1) return; // single-number exact — can't do simpler
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
          const fmt1 = formatExpr(a, op, b);
          search([...rest, { value: val1, ...fmt1 }], target, bestRef);
        }

        // Try b op a (only meaningful for - and ÷ where order matters)
        if (op === '-' || op === '÷') {
          const val2 = applyOp(op, b.value, a.value);
          if (val2 !== null && val2 > 0) {
            const fmt2 = formatExpr(b, op, a);
            search([...rest, { value: val2, ...fmt2 }], target, bestRef);
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

  const pool: Pool = numbers.map(n => ({ value: n, expr: String(n), numCount: 1 }));
  const bestRef: BestRef = { diff: Infinity, numCount: Infinity, result: null };

  search(pool, target, bestRef);

  if (!bestRef.result) return null;
  return {
    expression: bestRef.result.expression,
    result: bestRef.result.value,
    numCount: bestRef.numCount,
  };
}

/**
 * Async version of solve that yields the JS event loop between each top-level
 * pair iteration. This keeps the countdown timer and other UI updates responsive
 * while the brute-force search runs.
 */
export async function solveAsync(
  numbers: number[],
  target: number,
  cancelRef: { cancelled: boolean }
): Promise<SolverResult | null> {
  if (numbers.length === 0) return null;

  const pool: Pool = numbers.map(n => ({ value: n, expr: String(n), numCount: 1 }));
  const bestRef: BestRef = { diff: Infinity, numCount: Infinity, result: null };

  // Check each raw number in the pool as a candidate first
  for (const item of pool) {
    const diff = Math.abs(item.value - target);
    if (isBetter(diff, item.numCount, bestRef)) {
      bestRef.diff = diff;
      bestRef.numCount = item.numCount;
      bestRef.result = { value: item.value, expression: item.expr };
    }
    if (bestRef.diff === 0 && bestRef.numCount === 1) break;
  }

  // Iterate top-level pairs, yielding to the event loop between each one
  outer: for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      if (cancelRef.cancelled) break outer;
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (cancelRef.cancelled) break outer;

      const a = pool[i];
      const b = pool[j];
      const rest = pool.filter((_, idx) => idx !== i && idx !== j);

      for (const op of OPS) {
        const val1 = applyOp(op, a.value, b.value);
        if (val1 !== null && val1 > 0) {
          const fmt1 = formatExpr(a, op, b);
          search([...rest, { value: val1, ...fmt1 }], target, bestRef);
        }

        if (op === '-' || op === '÷') {
          const val2 = applyOp(op, b.value, a.value);
          if (val2 !== null && val2 > 0) {
            const fmt2 = formatExpr(b, op, a);
            search([...rest, { value: val2, ...fmt2 }], target, bestRef);
          }
        }
      }
    }
  }

  if (!bestRef.result) return null;
  return {
    expression: bestRef.result.expression,
    result: bestRef.result.value,
    numCount: bestRef.numCount,
  };
}
