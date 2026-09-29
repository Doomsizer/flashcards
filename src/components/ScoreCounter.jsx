import React from 'react';

// Живой счетчик ответов: зеленый — правильные, красный — ошибки.
// key={значение} перезапускает анимацию «подпрыгивания» при каждом изменении числа.
export default function ScoreCounter({ correct, wrong }) {
  return (
    <div className="score-counter">
      <span className="score-pill score-pill-correct" aria-label={`Правильно: ${correct}`}>
        <span key={correct} className="score-value">{correct}</span>
      </span>
      <span className="score-pill score-pill-wrong" aria-label={`Ошибок: ${wrong}`}>
        <span key={wrong} className="score-value">{wrong}</span>
      </span>
    </div>
  );
}
