import React from 'react';
import { FormulaText } from './kinds/Formula';
import './CardRow.css';

// Слово с выделенной буквой: ударной (заглавной) или вставленной на место пропуска
function MarkedWord({ word, index, upper = false }) {
  const letter = word[index];
  return (
    <>
      {word.slice(0, index)}
      <span className="letter-mark">{upper ? letter.toUpperCase() : letter}</span>
      {word.slice(index + 1)}
    </>
  );
}

// Карточка строкой в списке (ошибки, избранное, предпросмотр колоды):
// ударения и пропущенные гласные — слово с выделенной буквой и пояснение,
// формулы — название и формула, обычные — вопрос и ответ
export function CardRowContent({ card, kind }) {
  let main = card.front;
  let sub = card.back;
  if (kind === 'stress') {
    main = <MarkedWord word={card.front} index={card.stressIndex} upper />;
    sub = card.hint;
  } else if (kind === 'vowel') {
    main = <MarkedWord word={card.back} index={card.blankIndex} />;
    sub = card.hint;
  } else if (kind === 'build' || kind === 'formula') {
    sub = <FormulaText tokens={card.tokens} />;
  } else if (kind === 'choice' || kind === 'choice-flip') {
    sub = card.hint ? `${card.back} — ${card.hint}` : card.back;
  }
  return (
    <div className="card-row-text">
      <span className="card-row-main">{main}</span>
      {sub && <span className="card-row-sub">{sub}</span>}
    </div>
  );
}
