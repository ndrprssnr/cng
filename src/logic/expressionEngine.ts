import { ExpressionToken, Operator } from '../types/game';

const PRECEDENCE: Record<string, number> = {
  '+': 1, '-': 1, '×': 2, '÷': 2,
};

function isArithmeticOperator(op: string): boolean {
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
      if (a % b !== 0) return null; // only exact division
      return a / b;
    default: return null;
  }
}

/**
 * Converts infix token array to postfix (RPN) using shunting-yard.
 * Returns null if the expression is malformed (unbalanced parens, etc.)
 */
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
          if (top.operator === '(') {
            opStack.pop();
            foundOpen = true;
            break;
          }
          output.push(opStack.pop()!);
        }
        if (!foundOpen) return null; // unmatched )
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
    if (top.operator === '(' || top.operator === ')') return null; // unmatched (
    output.push(top);
  }

  return output;
}

/**
 * Evaluates a postfix (RPN) token array.
 * Returns null on any invalid operation (non-integer intermediate, div by zero, etc.)
 */
function evalPostfix(postfix: ExpressionToken[]): number | null {
  const stack: number[] = [];

  for (const token of postfix) {
    if (token.type === 'number') {
      stack.push(token.value!);
    } else if (token.operator && isArithmeticOperator(token.operator)) {
      if (stack.length < 2) return null;
      const b = stack.pop()!;
      const a = stack.pop()!;
      const result = applyOp(token.operator as Operator, a, b);
      if (result === null) return null;
      if (!Number.isInteger(result)) return null;
      stack.push(result);
    }
  }

  if (stack.length !== 1) return null;
  return stack[0];
}

/**
 * Evaluates an infix expression token array.
 * Returns null if the expression is invalid or produces non-integer intermediates.
 */
export function evaluateExpression(tokens: ExpressionToken[]): number | null {
  if (tokens.length === 0) return null;
  const postfix = toPostfix(tokens);
  if (!postfix) return null;
  if (postfix.length === 0) return null;
  return evalPostfix(postfix);
}

/**
 * Returns a live result only if the expression looks syntactically complete.
 * This prevents showing errors while the user is mid-typing.
 */
export function getLiveResult(tokens: ExpressionToken[]): number | null {
  if (tokens.length === 0) return null;

  const last = tokens[tokens.length - 1];
  if (last.type === 'operator' && last.operator !== ')') return null;

  // Check balanced parens
  let depth = 0;
  for (const t of tokens) {
    if (t.operator === '(') depth++;
    if (t.operator === ')') depth--;
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;

  return evaluateExpression(tokens);
}

export function expressionToString(tokens: ExpressionToken[]): string {
  return tokens.map(t => t.display).join(' ');
}
