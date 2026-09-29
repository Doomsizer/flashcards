import React, { useState } from 'react';
import CardStage from './CardStage';
import BackButton from './BackButton';
import ScoreCounter from './ScoreCounter';
import SessionSummary from './SessionSummary';
import { shuffle } from '../utils/shuffle';

// Используется и для "Свободной прогонки", и для "Избранного" —
// один проход по перемешанным карточкам, без повтора ошибок.
// В конце — статистика и список ошибок (можно добавить в избранное или прогнать заново).
export default function ShuffleMode({ cards, kind, title, isFavorite, onToggleFavorite, onBack }) {
  const [queue, setQueue] = useState(() => shuffle(cards));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState([]);

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

  function answer(isCorrect) {
    if (isCorrect) setCorrect((n) => n + 1);
    else setMistakes((list) => [...list, current]);
    setIndex((i) => i + 1);
  }

  function startRun(runCards) {
    setQueue(shuffle(runCards));
    setIndex(0);
    setCorrect(0);
    setMistakes([]);
  }

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <h1>{title}</h1>

      {!finished ? (
        <>
          <div className="session-bar">
            <p className="progress">
              {index + 1} / {queue.length}
            </p>
            <ScoreCounter correct={correct} wrong={mistakes.length} />
          </div>
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
        <SessionSummary
          kind={kind}
          correct={correct}
          mistakes={mistakes}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onRetryMistakes={() => startRun(mistakes)}
          onRestart={() => startRun(cards)}
        />
      )}
    </div>
  );
}
