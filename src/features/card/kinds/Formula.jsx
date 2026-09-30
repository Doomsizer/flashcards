import React from 'react';
import { GREEK_LETTERS, FUNCTION_NAMES, readScript } from '../../../deckFormat/parseDeck.mjs';
import './cardText.css';
import './Formula.css';

// Отображение формул для карточек сборки (Type: build).
// Части формулы хранятся как в тексте колоды (pi, ^2, _0, <=), здесь они превращаются в π, ², ₀, ≤.

const NAMES = { ...GREEK_LETTERS, sqrt: '√' };
const OPERATOR_VIEW = { '-': '−', '<=': '≤', '>=': '≥', '!=': '≠' };
// Знаки, вокруг которых в формуле нужен пробел
const SPACED_OPERATORS = new Set(['=', '+', '-', '−', '±', '<', '>', '<=', '>=', '!=', '≤', '≥', '≈', '≠', '·', '×', '→', ':']);

// Имена греческих букв целыми словами -> символы: pi -> π, 2pi -> 2π
function nameView(text) {
  return text.replace(/[A-Za-z]+/g, (word) => NAMES[word] || word);
}

const isGreekChar = (ch) => ch.charCodeAt(0) >= 0x0370 && ch.charCodeAt(0) <= 0x03ff;

// Греческие буквы — отдельным шрифтом (с засечками, курсив, как в учебниках):
// в основном шрифте α почти не отличается от латинской a
function withGreek(text, keyPrefix) {
  const parts = [];
  let plain = '';
  for (const ch of text) {
    if (isGreekChar(ch)) {
      if (plain) parts.push(plain);
      plain = '';
      parts.push(
        <span key={`${keyPrefix}-${parts.length}`} className="greek">
          {ch}
        </span>
      );
    } else {
      plain += ch;
    }
  }
  if (plain) parts.push(plain);
  return parts;
}

// Что за часть формулы и как ее показать
export function tokenView(raw) {
  if (raw.length > 1 && (raw[0] === '^' || raw[0] === '_')) {
    return { kind: raw[0] === '^' ? 'sup' : 'sub', text: readScript(raw, 1).value };
  }
  if (SPACED_OPERATORS.has(raw)) return { kind: 'op', text: OPERATOR_VIEW[raw] || raw };
  if (raw !== 'sqrt' && FUNCTION_NAMES.includes(raw)) return { kind: 'fn', text: raw };
  if (/^[0-9]/.test(raw)) return { kind: 'number', text: raw };
  return { kind: 'plain', text: raw };
}

// Текст со степенями и индексами внутри: «mc^2» -> mc², «v_0» -> v₀
export function MathText({ text }) {
  const parts = [];
  let buffer = '';
  const flush = () => {
    if (buffer) parts.push(...withGreek(nameView(buffer), `t${parts.length}`));
    buffer = '';
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if ((ch === '^' || ch === '_') && i + 1 < text.length) {
      flush();
      const { value, end } = readScript(text, i + 1);
      const Tag = ch === '^' ? 'sup' : 'sub';
      parts.push(
        <Tag key={parts.length}>
          <MathText text={value} />
        </Tag>
      );
      i = end;
    } else {
      buffer += ch;
      i++;
    }
  }
  flush();
  return <>{parts}</>;
}

function TokenView({ view, className = '' }) {
  if (view.kind === 'sup') return <sup><MathText text={view.text} /></sup>;
  if (view.kind === 'sub') return <sub><MathText text={view.text} /></sub>;
  if (view.kind === 'op') return <span className="formula-op">{view.text}</span>;
  if (view.kind === 'fn') return <span className={`formula-fn ${className}`}>{view.text}</span>;
  return <MathText text={view.text} />;
}

// Имя функции отделяется от соседей пробелом («ab sin γ»), но не от степени и скобки
// («sin²x», «sin(x)», в том числе части в скобках целиком: «sin(α+β)»)
function functionGaps(views, i) {
  const prev = views[i - 1];
  const next = views[i + 1];
  const before = prev && prev.kind !== 'op' && prev.text !== '(';
  const after = next && next.kind !== 'sup' && next.kind !== 'sub' && next.kind !== 'op' && !next.text.startsWith('(');
  return `${before ? 'formula-gap-before' : ''} ${after ? 'formula-gap-after' : ''}`;
}

// Формула целиком: S = πr²
export function FormulaText({ tokens }) {
  const views = tokens.map(tokenView);
  return (
    <span className="formula">
      {views.map((view, i) => (
        <React.Fragment key={i}>
          {/* Два числа подряд (2*3) без знака слились бы в одно — показываем точку умножения */}
          {i > 0 && view.kind === 'number' && views[i - 1].kind === 'number' && <span className="formula-op">·</span>}
          <TokenView view={view} className={view.kind === 'fn' ? functionGaps(views, i) : ''} />
          {/* Длинная формула переносится только после знака (=, +, −), а не посреди sin или числа */}
          {view.kind === 'op' && <wbr />}
        </React.Fragment>
      ))}
    </span>
  );
}

function FormulaHint({ card }) {
  if (!card.hint) return null;
  return (
    <span className="build-hint">
      <MathText text={card.hint} />
    </span>
  );
}

// Лицевая сторона карточки формулы: название и пояснение (что означают буквы)
export function FormulaQuestion({ card }) {
  return (
    <span className="build-block">
      <span className="build-question">{card.front}</span>
      <FormulaHint card={card} />
    </span>
  );
}

// Оборот карточки формулы: сама формула и то же пояснение
export function FormulaAnswer({ card }) {
  return (
    <span className="build-block">
      <FormulaText tokens={card.tokens} />
      <FormulaHint card={card} />
    </span>
  );
}

// Надпись на кнопке-части. Степень и индекс на отдельной кнопке показываются с пустым
// квадратиком (◻²), чтобы было понятно, что это степень; в строке сборки (bare) — без него.
export function TokenLabel({ raw, bare = false }) {
  const view = tokenView(raw);
  const script = view.kind === 'sup' || view.kind === 'sub';
  if (script && bare) return <MathText text={view.text} />;
  if (script) {
    // Обертка нужна, чтобы степень встала вверху, а индекс внизу: у flex-кнопки
    // прямые дочерние элементы не выравниваются по вертикали как текст
    return (
      <span className="token-label">
        <span className="token-box" aria-hidden="true" />
        <TokenView view={view} />
      </span>
    );
  }
  return <TokenView view={view} />;
}

// Подпись для экранного диктора
export function tokenAriaLabel(raw) {
  const view = tokenView(raw);
  if (view.kind === 'sup') return `степень ${view.text}`;
  if (view.kind === 'sub') return `индекс ${view.text}`;
  return nameView(view.text);
}
