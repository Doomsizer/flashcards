import React from 'react';
import { isVowel } from '../deckFormat/parseDeck.mjs';

// Слово + необязательное пояснение под ним (например, для омографов: «отзыв (посла из страны)»)
function WithHint({ hint, children }) {
  return (
    <span className="stress-block">
      <span className="stress-word">{children}</span>
      {hint && <span className="stress-hint">{hint}</span>}
    </span>
  );
}

// Лицевая сторона: все гласные заглавные и кликабельные
export function StressChoice({ word, hint, disabled, onChoose }) {
  return (
    <WithHint hint={hint}>
      {[...word].map((ch, i) =>
        isVowel(ch) ? (
          <button
            key={i}
            className="stress-vowel"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onChoose(i);
            }}
          >
            {ch.toUpperCase()}
          </button>
        ) : (
          <span key={i}>{ch}</span>
        )
      )}
    </WithHint>
  );
}

// Оборот: заглавная только правильная ударная гласная; ошибочный выбор зачеркнут
export function StressAnswer({ word, hint, stressIndex, choice }) {
  return (
    <WithHint hint={hint}>
      {[...word].map((ch, i) => {
        if (i === stressIndex) return <span key={i} className="stress-correct">{ch.toUpperCase()}</span>;
        if (i === choice) return <span key={i} className="stress-wrong-choice">{ch}</span>;
        return <span key={i}>{ch}</span>;
      })}
    </WithHint>
  );
}
