import { ExpressionToken, Operator } from '../types/game';
import { evaluateExpression, getLiveResult } from './expressionEngine';

// ── Helpers ──────────────────────────────────────────────────────────────────

let _tileId = 0;
function num(value: number): ExpressionToken {
  return { type: 'number', display: String(value), value, tileId: `t${_tileId++}` };
}
function op(operator: Operator): ExpressionToken {
  return { type: 'operator', display: operator, operator };
}

const ADD  = op('+');
const SUB  = op('-');
const MUL  = op('×');
const DIV  = op('÷');
const LPAR = op('(');
const RPAR = op(')');

beforeEach(() => { _tileId = 0; });

// ── evaluateExpression ────────────────────────────────────────────────────────

describe('evaluateExpression – basic arithmetic', () => {
  test('addition: 3 + 4 = 7', () => {
    expect(evaluateExpression([num(3), ADD, num(4)])).toBe(7);
  });

  test('subtraction: 10 - 6 = 4', () => {
    expect(evaluateExpression([num(10), SUB, num(6)])).toBe(4);
  });

  test('multiplication: 6 × 7 = 42', () => {
    expect(evaluateExpression([num(6), MUL, num(7)])).toBe(42);
  });

  test('division: 12 ÷ 4 = 3', () => {
    expect(evaluateExpression([num(12), DIV, num(4)])).toBe(3);
  });

  test('single number token', () => {
    expect(evaluateExpression([num(99)])).toBe(99);
  });

  test('empty token list returns null', () => {
    expect(evaluateExpression([])).toBeNull();
  });
});

// ── Operator precedence ───────────────────────────────────────────────────────

describe('evaluateExpression – operator precedence', () => {
  // 2 + 3 × 4  →  2 + 12 = 14  (× before +)
  test('multiplication before addition: 2 + 3 × 4 = 14', () => {
    expect(evaluateExpression([num(2), ADD, num(3), MUL, num(4)])).toBe(14);
  });

  // 10 - 2 × 3  →  10 - 6 = 4
  test('multiplication before subtraction: 10 - 2 × 3 = 4', () => {
    expect(evaluateExpression([num(10), SUB, num(2), MUL, num(3)])).toBe(4);
  });

  // 20 ÷ 4 + 3  →  5 + 3 = 8
  test('division before addition: 20 ÷ 4 + 3 = 8', () => {
    expect(evaluateExpression([num(20), DIV, num(4), ADD, num(3)])).toBe(8);
  });

  // 3 + 20 ÷ 4  →  3 + 5 = 8
  test('division before addition (right side): 3 + 20 ÷ 4 = 8', () => {
    expect(evaluateExpression([num(3), ADD, num(20), DIV, num(4)])).toBe(8);
  });

  // left-associativity: 8 - 3 - 2  →  (8-3)-2 = 3
  test('left-associativity of subtraction: 8 - 3 - 2 = 3', () => {
    expect(evaluateExpression([num(8), SUB, num(3), SUB, num(2)])).toBe(3);
  });

  // left-associativity: 24 ÷ 6 ÷ 2  →  (24÷6)÷2 = 2
  test('left-associativity of division: 24 ÷ 6 ÷ 2 = 2', () => {
    expect(evaluateExpression([num(24), DIV, num(6), DIV, num(2)])).toBe(2);
  });
});

// ── Parentheses ───────────────────────────────────────────────────────────────

describe('evaluateExpression – parentheses override precedence', () => {
  // (2 + 3) × 4 = 20
  test('(2 + 3) × 4 = 20', () => {
    expect(evaluateExpression([LPAR, num(2), ADD, num(3), RPAR, MUL, num(4)])).toBe(20);
  });

  // 4 × (2 + 3) = 20
  test('4 × (2 + 3) = 20', () => {
    expect(evaluateExpression([num(4), MUL, LPAR, num(2), ADD, num(3), RPAR])).toBe(20);
  });

  // (10 - 4) ÷ 2 = 3
  test('(10 - 4) ÷ 2 = 3', () => {
    expect(evaluateExpression([LPAR, num(10), SUB, num(4), RPAR, DIV, num(2)])).toBe(3);
  });

  // 100 - (25 + 75) = 0
  test('100 - (25 + 75) = 0', () => {
    expect(evaluateExpression([num(100), SUB, LPAR, num(25), ADD, num(75), RPAR])).toBe(0);
  });

  // 8 - (3 - 2) = 7
  test('8 - (3 - 2) = 3', () => {
    expect(evaluateExpression([num(8), SUB, LPAR, num(3), SUB, num(2), RPAR])).toBe(7);
  });

  // nested: (2 + (3 × 4)) = 14
  test('nested parens: (2 + (3 × 4)) = 14', () => {
    expect(evaluateExpression([
      LPAR, num(2), ADD, LPAR, num(3), MUL, num(4), RPAR, RPAR,
    ])).toBe(14);
  });

  // (2 + 3) × (4 + 1) = 25
  test('(2 + 3) × (4 + 1) = 25', () => {
    expect(evaluateExpression([
      LPAR, num(2), ADD, num(3), RPAR, MUL, LPAR, num(4), ADD, num(1), RPAR,
    ])).toBe(25);
  });
});

// ── Complex multi-operator chains ─────────────────────────────────────────────

describe('evaluateExpression – complex expressions', () => {
  // (75 - 25) × 4 = 200  (classic Countdown-style)
  test('(75 - 25) × 4 = 200', () => {
    expect(evaluateExpression([LPAR, num(75), SUB, num(25), RPAR, MUL, num(4)])).toBe(200);
  });

  // 7 × 8 + 3 × 4 = 56 + 12 = 68
  test('7 × 8 + 3 × 4 = 68', () => {
    expect(evaluateExpression([num(7), MUL, num(8), ADD, num(3), MUL, num(4)])).toBe(68);
  });

  // (7 + 8) × (3 + 4) = 15 × 7 = 105
  test('(7 + 8) × (3 + 4) = 105', () => {
    expect(evaluateExpression([
      LPAR, num(7), ADD, num(8), RPAR, MUL, LPAR, num(3), ADD, num(4), RPAR,
    ])).toBe(105);
  });

  // 100 + 75 ÷ 25 = 100 + 3 = 103
  test('100 + 75 ÷ 25 = 103', () => {
    expect(evaluateExpression([num(100), ADD, num(75), DIV, num(25)])).toBe(103);
  });

  // (100 + 75) ÷ 25 = 175 ÷ 25 = 7
  test('(100 + 75) ÷ 25 = 7', () => {
    expect(evaluateExpression([LPAR, num(100), ADD, num(75), RPAR, DIV, num(25)])).toBe(7);
  });

  // 50 × (7 - 3) + 2 = 50 × 4 + 2 = 202
  test('50 × (7 - 3) + 2 = 202', () => {
    expect(evaluateExpression([
      num(50), MUL, LPAR, num(7), SUB, num(3), RPAR, ADD, num(2),
    ])).toBe(202);
  });
});

// ── Division rules ────────────────────────────────────────────────────────────

describe('evaluateExpression – division constraints', () => {
  test('exact division is allowed: 9 ÷ 3 = 3', () => {
    expect(evaluateExpression([num(9), DIV, num(3)])).toBe(3);
  });

  test('non-exact division returns null: 7 ÷ 2', () => {
    expect(evaluateExpression([num(7), DIV, num(2)])).toBeNull();
  });

  test('division by zero returns null', () => {
    expect(evaluateExpression([num(5), DIV, num(0)])).toBeNull();
  });

  // non-integer intermediate: (1 + 2) ÷ 4  → 3 ÷ 4 = 0.75 → null
  test('non-integer intermediate result returns null: (1 + 2) ÷ 4', () => {
    expect(evaluateExpression([LPAR, num(1), ADD, num(2), RPAR, DIV, num(4)])).toBeNull();
  });

  // 6 ÷ 2 × 5 = (6÷2)×5 = 15 — both integer, should work
  test('division then multiplication (both integer): 6 ÷ 2 × 5 = 15', () => {
    expect(evaluateExpression([num(6), DIV, num(2), MUL, num(5)])).toBe(15);
  });
});

// ── Malformed / invalid expressions ──────────────────────────────────────────

describe('evaluateExpression – malformed expressions return null', () => {
  test('unmatched opening paren', () => {
    expect(evaluateExpression([LPAR, num(3), ADD, num(4)])).toBeNull();
  });

  test('unmatched closing paren', () => {
    expect(evaluateExpression([num(3), ADD, num(4), RPAR])).toBeNull();
  });

  test('operator without left operand (starts with +)', () => {
    // Stack underflow → null
    expect(evaluateExpression([ADD, num(3)])).toBeNull();
  });

  test('trailing operator', () => {
    // Last token is an operator → postfix stack won't have exactly one value
    expect(evaluateExpression([num(3), ADD])).toBeNull();
  });

  test('two operators in a row: 3 + × 4', () => {
    expect(evaluateExpression([num(3), ADD, MUL, num(4)])).toBeNull();
  });
});

// ── getLiveResult ─────────────────────────────────────────────────────────────

describe('getLiveResult – only evaluates syntactically complete expressions', () => {
  test('returns null while expression ends with operator', () => {
    expect(getLiveResult([num(3), ADD])).toBeNull();
  });

  test('returns null with unclosed paren', () => {
    expect(getLiveResult([LPAR, num(3), ADD, num(4)])).toBeNull();
  });

  test('returns result when expression ends with a number', () => {
    expect(getLiveResult([num(3), ADD, num(4)])).toBe(7);
  });

  test('returns result when expression ends with closing paren', () => {
    expect(getLiveResult([LPAR, num(3), ADD, num(4), RPAR])).toBe(7);
  });

  test('single number token returns number', () => {
    expect(getLiveResult([num(42)])).toBe(42);
  });

  test('empty tokens returns null', () => {
    expect(getLiveResult([])).toBeNull();
  });
});

// ── PREFIX notation ───────────────────────────────────────────────────────────

describe('evaluateExpression – prefix notation', () => {
  test('+ 2 3 = 5', () => {
    expect(evaluateExpression([ADD, num(2), num(3)])).toBe(5);
  });

  test('× 3 4 = 12', () => {
    expect(evaluateExpression([MUL, num(3), num(4)])).toBe(12);
  });

  test('- 10 3 = 7', () => {
    expect(evaluateExpression([SUB, num(10), num(3)])).toBe(7);
  });

  test('÷ 12 4 = 3', () => {
    expect(evaluateExpression([DIV, num(12), num(4)])).toBe(3);
  });

  // + (× 2 3) 4 = (2×3) + 4 = 10
  test('+ × 2 3 4 = 10 (nested prefix)', () => {
    expect(evaluateExpression([ADD, MUL, num(2), num(3), num(4)])).toBe(10);
  });

  // × (+ 2 3) (+ 1 4) = 5 × 5 = 25
  test('× + 2 3 + 1 4 = 25', () => {
    expect(evaluateExpression([MUL, ADD, num(2), num(3), ADD, num(1), num(4)])).toBe(25);
  });

  // ÷ (× 2 6) 4 = 12 ÷ 4 = 3
  test('÷ × 2 6 4 = 3', () => {
    expect(evaluateExpression([DIV, MUL, num(2), num(6), num(4)])).toBe(3);
  });

  // ÷ (+ 1 2) 4 = 3 ÷ 4 = null (non-integer)
  test('÷ + 1 2 4 = null (non-integer)', () => {
    expect(evaluateExpression([DIV, ADD, num(1), num(2), num(4)])).toBeNull();
  });

  // paren-wrapped: (+ 2 3) = 5
  test('(+ 2 3) = 5 (paren-wrapped prefix)', () => {
    expect(evaluateExpression([LPAR, ADD, num(2), num(3), RPAR])).toBe(5);
  });

  // grouped sub-expression: + (× 2 3) 6 = 12
  test('+ (× 2 3) 6 = 12 (parens around sub-expression)', () => {
    expect(evaluateExpression([ADD, LPAR, MUL, num(2), num(3), RPAR, num(6)])).toBe(12);
  });

  // extra tokens make it malformed
  test('+ 2 3 4 = null (too many operands)', () => {
    expect(evaluateExpression([ADD, num(2), num(3), num(4)])).toBeNull();
  });

  // single operator, missing operands
  test('+ 2 = null (missing right operand)', () => {
    expect(evaluateExpression([ADD, num(2)])).toBeNull();
  });
});

describe('getLiveResult – prefix completeness', () => {
  test('returns null while only operator entered: +', () => {
    expect(getLiveResult([ADD])).toBeNull();
  });

  test('returns null mid-prefix: + 2', () => {
    expect(getLiveResult([ADD, num(2)])).toBeNull();
  });

  test('returns result for complete prefix: + 2 3', () => {
    expect(getLiveResult([ADD, num(2), num(3)])).toBe(5);
  });

  test('returns result for nested prefix: × + 2 3 + 1 4', () => {
    expect(getLiveResult([MUL, ADD, num(2), num(3), ADD, num(1), num(4)])).toBe(25);
  });
});

// ── POSTFIX notation ──────────────────────────────────────────────────────────

describe('evaluateExpression – postfix notation', () => {
  test('2 3 + = 5', () => {
    expect(evaluateExpression([num(2), num(3), ADD])).toBe(5);
  });

  test('3 4 × = 12', () => {
    expect(evaluateExpression([num(3), num(4), MUL])).toBe(12);
  });

  test('10 3 - = 7', () => {
    expect(evaluateExpression([num(10), num(3), SUB])).toBe(7);
  });

  test('12 4 ÷ = 3', () => {
    expect(evaluateExpression([num(12), num(4), DIV])).toBe(3);
  });

  // 2 3 × 4 + = (2×3) + 4 = 10
  test('2 3 × 4 + = 10', () => {
    expect(evaluateExpression([num(2), num(3), MUL, num(4), ADD])).toBe(10);
  });

  // 2 3 + 1 4 + × = 5 × 5 = 25
  test('2 3 + 1 4 + × = 25', () => {
    expect(evaluateExpression([num(2), num(3), ADD, num(1), num(4), ADD, MUL])).toBe(25);
  });

  // 2 6 × 4 ÷ = 12 ÷ 4 = 3
  test('2 6 × 4 ÷ = 3', () => {
    expect(evaluateExpression([num(2), num(6), MUL, num(4), DIV])).toBe(3);
  });

  // 1 2 + 4 ÷ = 3 ÷ 4 = null (non-integer)
  test('1 2 + 4 ÷ = null (non-integer)', () => {
    expect(evaluateExpression([num(1), num(2), ADD, num(4), DIV])).toBeNull();
  });

  // paren-wrapped: (2 3 +) = 5
  test('(2 3 +) = 5 (paren-wrapped postfix)', () => {
    expect(evaluateExpression([LPAR, num(2), num(3), ADD, RPAR])).toBe(5);
  });

  // missing operand
  test('3 + = null (missing left operand)', () => {
    expect(evaluateExpression([num(3), ADD])).toBeNull();
  });
});

describe('getLiveResult – postfix completeness', () => {
  test('returns null while expression ends with number: 2 3', () => {
    expect(getLiveResult([num(2), num(3)])).toBeNull();
  });

  test('returns result for complete postfix: 2 3 +', () => {
    expect(getLiveResult([num(2), num(3), ADD])).toBe(5);
  });

  test('returns result for longer postfix: 2 3 × 4 +', () => {
    expect(getLiveResult([num(2), num(3), MUL, num(4), ADD])).toBe(10);
  });
});

// ── Mixed notation rejection ───────────────────────────────────────────────────

describe('evaluateExpression – mixed notation returns null', () => {
  // ── operator followed by operator ──
  test('2 + - 6 3 = null (op followed by op)', () => {
    expect(evaluateExpression([num(2), ADD, SUB, num(6), num(3)])).toBeNull();
  });

  test('3 + × 4 = null (two operators in a row)', () => {
    expect(evaluateExpression([num(3), ADD, MUL, num(4)])).toBeNull();
  });

  // ── ( followed by arithmetic operator ──
  test('2 + (- 6 3) = null (open paren followed by op)', () => {
    expect(evaluateExpression([num(2), ADD, LPAR, SUB, num(6), num(3), RPAR])).toBeNull();
  });

  // ── arithmetic operator followed by ) ──
  test('2 × (6 3 -) = null (op followed by close paren)', () => {
    expect(evaluateExpression([num(2), MUL, LPAR, num(6), num(3), SUB, RPAR])).toBeNull();
  });

  // ── paren-wrapped prefix mixed with infix ──
  // (+ 2 3) × 4: strip outer parens → first token is + → routed to prefix;
  // prefix parser consumes + 2 3 but then sees leftover × 4 → returns null
  test('(+ 2 3) × 4 = null (paren-prefix mixed with infix)', () => {
    expect(evaluateExpression([LPAR, ADD, num(2), num(3), RPAR, MUL, num(4)])).toBeNull();
  });

  // ── paren-wrapped postfix inside infix context ──
  // (2 3 +) × 4: strip → last token is 4 (number) → routed to infix;
  // infix preflight sees op(+) before ) inside parens → null
  test('(2 3 +) × 4 = null (postfix inside infix context)', () => {
    expect(evaluateExpression([LPAR, num(2), num(3), ADD, RPAR, MUL, num(4)])).toBeNull();
  });
});
