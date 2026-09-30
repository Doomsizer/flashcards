import React from 'react';
import { StressChoice, StressAnswer } from '../card/kinds/StressWord';
import { VowelBlank, VowelAnswer, vowelOptions } from '../card/kinds/VowelWord';
import { FormulaText, MathText, TokenLabel } from '../card/kinds/Formula';
import './CardFacesPreview.css';

// Части формулы маленькими кнопками — как в наборе у карточки сборки
export function TokenChips({ tokens }) {
  return (
    <span className="mini-tokens">
      {tokens.map((raw, i) => (
        <span key={i} className="mini-token">
          <TokenLabel raw={raw} />
        </span>
      ))}
    </span>
  );
}

// Мини-карточка с двух сторон: как карточка выглядит до ответа и после
export default function CardFacesPreview({ card, kind }) {
  let front = <span className="mini-card-text">{card.front}</span>;
  let back = <span className="mini-card-text">{card.back}</span>;
  let caption = 'нажми — перевернется';

  if (kind === 'stress') {
    front = <StressChoice word={card.front} hint={card.hint} disabled onChoose={() => {}} />;
    back = <StressAnswer word={card.front} hint={card.hint} stressIndex={card.stressIndex} choice={card.stressIndex} />;
    caption = 'все гласные — кнопки';
  } else if (kind === 'build') {
    // Части в постоянном «перемешанном» порядке (по алфавиту), чтобы пример не менялся
    const scrambled = [...card.tokens].sort();
    front = (
      <span className="mini-build">
        <span className="mini-card-text">{card.front}</span>
        {card.hint && (
          <span className="mini-card-hint">
            <MathText text={card.hint} />
          </span>
        )}
      </span>
    );
    back = (
      <span className="mini-card-text">
        <FormulaText tokens={card.tokens} />
      </span>
    );
    caption = <TokenChips tokens={scrambled} />;
  } else if (kind === 'choice') {
    front = (
      <span className="mini-build">
        <span className="mini-card-text">{card.front}</span>
        {card.hint && <span className="mini-card-hint">{card.hint}</span>}
      </span>
    );
    back = <span className="mini-card-text">{card.back}</span>;
    caption = 'четыре варианта ответа';
  } else if (kind === 'vowel') {
    const letter = card.back[card.blankIndex].toLowerCase();
    front = <VowelBlank card={card} />;
    back = <VowelAnswer card={card} choice={letter} />;
    caption = (
      <span className="mini-options">
        {vowelOptions(letter).map((option) => (
          <span key={option} className="mini-option">
            {option}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="mini-cards">
      <div className="mini-card">
        <span className="mini-card-label">Карточка</span>
        <div className="mini-card-body">{front}</div>
        <span className="mini-card-caption">{caption}</span>
      </div>
      <div className="mini-card mini-card-back">
        <span className="mini-card-label">Ответ</span>
        <div className="mini-card-body">{back}</div>
      </div>
    </div>
  );
}
