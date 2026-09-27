import React, { useMemo, useState } from 'react';
import Flashcard from './Flashcard';
import { shuffle } from '../utils/shuffle';

// Используется и для "Свободной прогонки", и для "Избранного" —
// один проход по перемешанным карточкам, без повтора ошибок.
export default function ShuffleMode({ cards, title, isFavorite, onToggleFavorite, onBack }) {
  const queue = useMemo(() => shuffle(cards), [cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  if (cards.length === 0) {
    return (
      <div className="screen">
        <button className="back-btn" onClick={onBack}>← Назад</button>
        <h1>{title}</h1>
        <p>Здесь пока пусто. Добавляй карточки в избранное значком ☆ в других режимах.</p>
      </div>
    );
  }

  const finished = index >= queue.length;
  const current = !finished ? queue[index] : null;

  function answer(correct) {
    setScore((s) => ({ ...s, [correct ? 'correct' : 'wrong']: s[correct ? 'correct' : 'wrong'] + 1 }));
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setScore({ correct: 0, wrong: 0 });
  }

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Назад</button>
      <h1>{title}</h1>

      {!finished ? (
        <>
          <p className="progress">
            {index + 1} / {queue.length}
          </p>
          <Flashcard
            front={current.front}
            back={current.back}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            isFavorite={isFavorite(current.id)}
            onToggleFavorite={() => onToggleFavorite(current.id)}
          />
          {flipped && (
            <div className="answer-buttons">
              <button className="btn btn-wrong" onClick={() => answer(false)}>Не знал(а)</button>
              <button className="btn btn-correct" onClick={() => answer(true)}>Знал(а)</button>
            </div>
          )}
        </>
      ) : (
        <div className="summary">
          <h2>Готово!</h2>
          <p>
            Правильно: {score.correct} · Ошибок: {score.wrong}
          </p>
          <button className="btn" onClick={restart}>Пройти ещё раз</button>
        </div>
      )}
    </div>
  );
}
