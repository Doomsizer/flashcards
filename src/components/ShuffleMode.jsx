import React, { useMemo, useState } from 'react';
import CardStage from './CardStage';
import BackButton from './BackButton';
import { shuffle } from '../utils/shuffle';

// Используется и для "Свободной прогонки", и для "Избранного" —
// один проход по перемешанным карточкам, без повтора ошибок.
export default function ShuffleMode({ cards, kind, title, isFavorite, onToggleFavorite, onBack }) {
  const queue = useMemo(() => shuffle(cards), [cards]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  if (cards.length === 0) {
    return (
      <div className="screen">
        <BackButton onClick={onBack} />
        <h1>{title}</h1>
        <p>Здесь пока пусто. Добавляй карточки в избранное значком ☆ в других режимах.</p>
      </div>
    );
  }

  const finished = index >= queue.length;
  const current = !finished ? queue[index] : null;

  function answer(correct) {
    setScore((s) => ({ ...s, [correct ? 'correct' : 'wrong']: s[correct ? 'correct' : 'wrong'] + 1 }));
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setScore({ correct: 0, wrong: 0 });
  }

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <h1>{title}</h1>

      {!finished ? (
        <>
          <p className="progress">
            {index + 1} / {queue.length}
          </p>
          <CardStage
            key={`${index}-${current.id}`}
            card={current}
            kind={kind}
            isFavorite={isFavorite(current.id)}
            onToggleFavorite={() => onToggleFavorite(current.id)}
            onAnswer={answer}
          />
        </>
      ) : (
        <div className="summary">
          <h2>Готово!</h2>
          <p>
            Правильно: {score.correct} · Ошибок: {score.wrong}
          </p>
          <button className="btn" onClick={restart}>Пройти еще раз</button>
        </div>
      )}
    </div>
  );
}
