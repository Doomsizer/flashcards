import { readScript, tokenizeFormula, GREEK_LETTERS } from '../deckFormat/parseDeck.mjs';

// Нестрогая проверка собранной формулы: порядок множителей и слагаемых не важен,
// стороны равенства можно поменять местами (S = πr² ≡ S = r²π ≡ πr² = S).
// Обе записи разбираются в выражения и сравниваются численно на случайных значениях переменных.
// Если эталонную формулу разобрать не удается (химия, неравенства, ±), остается строгий порядок.

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tg: Math.tan,
  tan: Math.tan,
  ctg: (x) => 1 / Math.tan(x),
  cot: (x) => 1 / Math.tan(x),
  arcsin: Math.asin,
  arccos: Math.acos,
  arctg: Math.atan,
  arctan: Math.atan,
  arcctg: (x) => Math.PI / 2 - Math.atan(x),
  log: Math.log10,
  lg: Math.log10,
  ln: Math.log,
  exp: Math.exp,
  sqrt: Math.sqrt,
  '√': Math.sqrt,
};
const FRACTIONS = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅕': 1 / 5, '⅙': 1 / 6, '⅛': 1 / 8 };
const PLUS = new Set(['+']);
const MINUS = new Set(['-', '−']);
const TIMES = new Set(['·', '×']);
const DIVIDE = new Set(['/', ':']);

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const inCodeRange = (ch, from, to) => ch.charCodeAt(0) >= from && ch.charCodeAt(0) <= to;
const isSup = (t) => typeof t === 'string' && t.length > 1 && t[0] === '^';
const isSub = (t) => typeof t === 'string' && t.length > 1 && t[0] === '_';

// Часть, взятая в колоде в квадратные скобки ([2α], [(α+β)/2]), — целое выражение, например аргумент
// функции: sin [2α] = sin(2α). Возвращает ее части или null, если это обычная часть
function groupParts(t) {
  if (typeof t !== 'string') return null;
  const parts = tokenizeFormula(t);
  return parts.length === 1 && parts[0] === t ? null : parts;
}

// Переменная: латинская буква, греческая буква (символом или именем), русское слово
function isVariable(t) {
  if (/^[A-Za-z]$/.test(t) || has(GREEK_LETTERS, t)) return true;
  if (t.length === 1 && inCodeRange(t, 0x0370, 0x03ff)) return true;
  return [...t].every((ch) => inCodeRange(ch, 0x0400, 0x04ff));
}

class ParseError extends Error {}

// Разбор последовательности частей в выражения. Возвращает стороны равенства: [expr] или [left, right].
// Функции (sin, √) применяются к одному следующему множителю со степенью: sin α, √3, √(a² + b²), sin [2α].
function parseTokens(tokens) {
  let pos = 0;
  let absDepth = 0;
  const peek = () => tokens[pos];
  const fail = () => {
    throw new ParseError();
  };

  // Может ли с этой части начаться множитель (для неявного умножения: 2πr, p(p − a))
  function startsFactor(t) {
    if (t === undefined) return false;
    if (t === '|') return absDepth === 0;
    return t === '(' || has(FUNCTIONS, t) || has(FRACTIONS, t) || /^[0-9]/.test(t) || isVariable(t) || groupParts(t) !== null;
  }

  function exponent(raw) {
    const sides = parseTokens(tokenizeFormula(readScript(raw, 1).value));
    if (sides.length !== 1) fail();
    return sides[0];
  }

  function primary() {
    const t = tokens[pos++];
    if (t === undefined) fail();
    const group = groupParts(t);
    if (group) {
      const sides = parseTokens(group);
      if (sides.length !== 1) fail();
      return sides[0];
    }
    if (t === '(') {
      const inner = expression();
      if (tokens[pos++] !== ')') fail();
      return inner;
    }
    if (t === '|' && absDepth === 0) {
      absDepth++;
      const inner = expression();
      if (tokens[pos++] !== '|') fail();
      absDepth--;
      return { op: 'abs', a: inner };
    }
    if (has(FUNCTIONS, t)) {
      // sin²α: степень сразу после имени функции относится к ее значению
      const powers = [];
      while (isSup(peek())) powers.push(exponent(tokens[pos++]));
      let node = { op: 'fn', f: FUNCTIONS[t], a: power() };
      powers.forEach((b) => {
        node = { op: 'pow', a: node, b };
      });
      return node;
    }
    if (has(FRACTIONS, t)) return { op: 'num', v: FRACTIONS[t] };
    if (/^[0-9]/.test(t)) return { op: 'num', v: parseFloat(t.replace(',', '.')) };
    if (isVariable(t)) {
      let name = t;
      while (isSub(peek())) name += tokens[pos++];
      return { op: 'var', name };
    }
    return fail();
  }

  function power() {
    let node = primary();
    while (isSup(peek())) node = { op: 'pow', a: node, b: exponent(tokens[pos++]) };
    return node;
  }

  function unary() {
    if (MINUS.has(peek())) {
      pos++;
      return { op: 'neg', a: unary() };
    }
    return power();
  }

  function term() {
    let node = unary();
    for (;;) {
      const t = peek();
      if (TIMES.has(t)) {
        pos++;
        node = { op: 'mul', a: node, b: unary() };
      } else if (DIVIDE.has(t)) {
        pos++;
        node = { op: 'div', a: node, b: unary() };
      } else if (startsFactor(t)) {
        node = { op: 'mul', a: node, b: unary() };
      } else {
        return node;
      }
    }
  }

  function expression() {
    if (PLUS.has(peek())) pos++;
    let node = term();
    while (PLUS.has(peek()) || MINUS.has(peek())) {
      const op = tokens[pos++];
      node = { op: PLUS.has(op) ? 'add' : 'sub', a: node, b: term() };
    }
    return node;
  }

  const sides = [expression()];
  while (peek() === '=') {
    pos++;
    sides.push(expression());
  }
  if (pos !== tokens.length || sides.length > 2) fail();
  return sides;
}

function tryParse(tokens) {
  try {
    return parseTokens(tokens);
  } catch (e) {
    if (e instanceof ParseError) return null;
    throw e;
  }
}

function evaluate(node, vars) {
  switch (node.op) {
    case 'num':
      return node.v;
    case 'var':
      return vars[node.name];
    case 'add':
      return evaluate(node.a, vars) + evaluate(node.b, vars);
    case 'sub':
      return evaluate(node.a, vars) - evaluate(node.b, vars);
    case 'mul':
      return evaluate(node.a, vars) * evaluate(node.b, vars);
    case 'div':
      return evaluate(node.a, vars) / evaluate(node.b, vars);
    case 'pow':
      return Math.pow(evaluate(node.a, vars), evaluate(node.b, vars));
    case 'neg':
      return -evaluate(node.a, vars);
    case 'abs':
      return Math.abs(evaluate(node.a, vars));
    default:
      return node.f(evaluate(node.a, vars));
  }
}

function collectVariables(node, names) {
  if (node.op === 'var') names.add(node.name);
  if (node.a) collectVariables(node.a, names);
  if (node.b) collectVariables(node.b, names);
}

const TRIALS = 24;
const close = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));

// Та же ли формула собрана (с точностью до порядка множителей, слагаемых и сторон равенства)
export function sameFormula(userTokens, correctTokens) {
  if (userTokens.length === correctTokens.length && userTokens.every((t, i) => t === correctTokens[i])) return true;
  const correct = tryParse(correctTokens);
  if (!correct) return false;
  const user = tryParse(userTokens);
  if (!user || user.length !== correct.length) return false;

  const names = new Set();
  [...correct, ...user].forEach((side) => collectVariables(side, names));

  let direct = true;
  let swapped = correct.length === 2;
  let valid = 0;
  for (let i = 0; i < TRIALS; i++) {
    const vars = {};
    names.forEach((name) => {
      vars[name] = 0.5 + Math.random() * 2;
    });
    const c = correct.map((side) => evaluate(side, vars));
    const u = user.map((side) => evaluate(side, vars));
    // Точки вне области определения (корень из отрицательного и т. п.) пропускаем
    if (![...c, ...u].every(Number.isFinite)) continue;
    valid++;
    if (!c.every((value, k) => close(value, u[k]))) direct = false;
    if (swapped && !(close(c[0], u[1]) && close(c[1], u[0]))) swapped = false;
  }
  return valid >= 3 && (direct || swapped);
}
