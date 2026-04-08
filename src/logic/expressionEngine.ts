import { ExpressionToken, Operator } from '../types/game';

// ── Shared helpers ────────────────────────────────────────────────────────────

const PRECEDENCE: Record<string, number> = {
  '+': 1, '-': 1, '×': 2, '÷': 2,
};

function isArithmeticOperator(op: string): op is Operator {
  return op in PRECEDENCE;
}

function isOperator(op: string): op is Operator {
  return op in PRECEDENCE || op === '(' || op === ')';
}

function applyOp(op: Operator, a: number, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷':
      if (b === 0) return null;
      if (a % b !== 0) return null;
      return a / b;
    default: return null;
  }
}

function isBalanced(tokens: ExpressionToken[]): boolean {
  let depth = 0;
  for (const t of tokens) {
    if (t.operator === '(') depth++;
    if (t.operator === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

// ── Notation detection ────────────────────────────────────────────────────────

/**
 * If the entire token list is wrapped in a matching outer pair of parens,
 * returns the inner slice. Otherwise returns the original list.
 * e.g. (+ 2 3) → [+, 2, 3];  (2+3)×4 → unchanged (the ( does not wrap all).
 */
function stripOuterParens(tokens: ExpressionToken[]): ExpressionToken[] {
  if (tokens.length < 2) return tokens;
  if (tokens[0].operator !== '(' || tokens[tokens.length - 1].operator !== ')') return tokens;
  // Walk to check the opening paren actually closes at the last token
  let depth = 0;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].operator === '(') depth++;
    if (tokens[i].operator === ')') depth--;
    if (depth === 0) return tokens; // closed before the end — not a full wrapper
  }
  return tokens.slice(1, tokens.length - 1);
}

type Notation = 'infix' | 'prefix' | 'postfix';

function detectNotation(tokens: ExpressionToken[]): Notation {
  const inner = stripOuterParens(tokens);
  const first = inner[0];
  if (first && first.type === 'operator' && isArithmeticOperator(first.operator!)) {
    return 'prefix';
  }
  const last = inner[inner.length - 1];
  if (last && last.type === 'operator' && isArithmeticOperator(last.operator!)) {
    return 'postfix';
  }
  return 'infix';
}

// ── Infix evaluator (shunting-yard) ──────────────────────────────────────────

function toPostfix(tokens: ExpressionToken[]): ExpressionToken[] | null {
  const output: ExpressionToken[] = [];
  const opStack: ExpressionToken[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
    } else if (token.operator && isOperator(token.operator)) {
      const op = token.operator;
      if (op === '(') {
        opStack.push(token);
      } else if (op === ')') {
        let foundOpen = false;
        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (top.operator === '(') { opStack.pop(); foundOpen = true; break; }
          output.push(opStack.pop()!);
        }
        if (!foundOpen) return null;
      } else {
        const prec = PRECEDENCE[op];
        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (
            top.operator &&
            top.operator !== '(' &&
            isArithmeticOperator(top.operator) &&
            PRECEDENCE[top.operator] >= prec
          ) {
            output.push(opStack.pop()!);
          } else {
            break;
          }
        }
        opStack.push(token);
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.operator === '(' || top.operator === ')') return null;
    output.push(top);
  }

  return output;
}

function evalRPN(postfix: ExpressionToken[]): number | null {
  const stack: number[] = [];
  for (const token of postfix) {
    if (token.type === 'number') {
      stack.push(token.value!);
    } else if (token.operator && isArithmeticOperator(token.operator)) {
      if (stack.length < 2) return null;
      const b = stack.pop()!;
      const a = stack.pop()!;
      const result = applyOp(token.operator, a, b);
      if (result === null || !Number.isInteger(result)) return null;
      stack.push(result);
    }
  }
  return stack.length === 1 ? stack[0] : null;
}

/**
 * Preflight heuristic for infix: reject token pairs that indicate accidental
 * prefix/postfix mixed into an infix expression.
 *   - ( followed by arithmetic operator  →  prefix sub-expression leaking in
 *   - arithmetic operator followed by )  →  postfix sub-expression leaking in
 *   - arithmetic operator followed by arithmetic operator  →  either notation mixed
 */
function isValidInfix(tokens: ExpressionToken[]): boolean {
  for (let i = 0; i < tokens.length - 1; i++) {
    const cur  = tokens[i];
    const next = tokens[i + 1];
    const curIsArith  = cur.operator  !== undefined && isArithmeticOperator(cur.operator);
    const nextIsArith = next.operator !== undefined && isArithmeticOperator(next.operator);

    if (cur.operator === '(' && nextIsArith) return false;  // ( followed by operator
    if (curIsArith && next.operator === ')') return false;  // operator followed by )
    if (curIsArith && nextIsArith)           return false;  // operator followed by operator
  }
  return true;
}

function evaluateInfix(tokens: ExpressionToken[]): number | null {
  if (!isValidInfix(tokens)) return null;
  const postfix = toPostfix(tokens);
  if (!postfix || postfix.length === 0) return null;
  return evalRPN(postfix);
}

// ── Postfix evaluator (direct RPN stack) ─────────────────────────────────────

function evaluatePostfix(tokens: ExpressionToken[]): number | null {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(token.value!);
    } else if (token.operator === '(' || token.operator === ')') {
      // parens are structural hints only; skip in postfix
      continue;
    } else if (token.operator && isArithmeticOperator(token.operator)) {
      if (stack.length < 2) return null;
      const b = stack.pop()!;
      const a = stack.pop()!;
      const result = applyOp(token.operator, a, b);
      if (result === null || !Number.isInteger(result)) return null;
      stack.push(result);
    }
  }
  return stack.length === 1 ? stack[0] : null;
}

// ── Prefix evaluator (recursive descent) ─────────────────────────────────────

function evaluatePrefix(tokens: ExpressionToken[]): number | null {
  let pos = 0;

  function parse(): number | null {
    if (pos >= tokens.length) return null;
    const token = tokens[pos];

    if (token.operator === '(') {
      pos++; // consume '('
      const result = parse();
      if (result === null) return null;
      if (pos >= tokens.length || tokens[pos].operator !== ')') return null;
      pos++; // consume ')'
      return result;
    }

    if (token.type === 'number') {
      pos++;
      return token.value!;
    }

    if (token.operator && isArithmeticOperator(token.operator)) {
      pos++; // consume operator
      const left = parse();
      if (left === null) return null;
      const right = parse();
      if (right === null) return null;
      const result = applyOp(token.operator, left, right);
      if (result === null || !Number.isInteger(result)) return null;
      return result;
    }

    return null;
  }

  const result = parse();
  // All tokens must be consumed for a well-formed prefix expression
  if (pos !== tokens.length) return null;
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evaluates an expression token array. Automatically detects whether the
 * expression is in prefix, infix, or postfix notation and dispatches to the
 * appropriate evaluator. Returns null for invalid or mixed-notation expressions.
 */
export function evaluateExpression(tokens: ExpressionToken[]): number | null {
  if (tokens.length === 0) return null;
  const notation = detectNotation(tokens);
  switch (notation) {
    case 'prefix':  return evaluatePrefix(tokens);
    case 'postfix': return evaluatePostfix(tokens);
    case 'infix':   return evaluateInfix(tokens);
  }
}

/**
 * Returns a live result only if the expression looks syntactically complete
 * for its detected notation. Prevents showing errors while the user is mid-typing.
 */
export function getLiveResult(tokens: ExpressionToken[]): number | null {
  if (tokens.length === 0) return null;
  if (!tokens.some(t => t.type === 'operator' && t.operator !== '(' && t.operator !== ')')) return null;
  if (!isBalanced(tokens)) return null;

  const notation = detectNotation(tokens);
  const inner = stripOuterParens(tokens);

  if (notation === 'infix') {
    // Complete when last token is a number or closing paren
    const last = tokens[tokens.length - 1];
    if (last.type === 'operator' && last.operator !== ')') return null;
  } else if (notation === 'postfix') {
    // Complete when inner last token is an arithmetic operator
    const last = inner[inner.length - 1];
    if (!last || last.type !== 'operator' || !isArithmeticOperator(last.operator!)) return null;
  } else {
    // prefix: complete when inner first token is an arithmetic operator
    // (detectNotation already guarantees this, guard for clarity)
    const first = inner[0];
    if (!first || first.type !== 'operator' || !isArithmeticOperator(first.operator!)) return null;
  }

  return evaluateExpression(tokens);
}

export function expressionToString(tokens: ExpressionToken[]): string {
  return tokens.map(t => t.display).join(' ');
}
