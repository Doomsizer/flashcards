import React, { useState } from 'react';
import Flashcard from './Flashcard';
import { shuffle } from '../utils/shuffle';

// phase: 'practice' -> 'sectionDone' -> (следующий раздел | 'test') -> 'finished'
export default function LearnMode({ deck, isFavorite, onToggleFavorite, onBack }) {
  const sections = deck.sections;
  const [sectionIndex, setSectionIndex] = useState(0);
  const [queue, setQueue] = useState(() => shuffle(sections[0].cards));
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState('practice');
  const [testQueue, setTestQueue] = useState([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState({ correct: 0, wrong: 0 });

  const currentSection = sections[sectionIndex];

  function startSection(idx) {
    setSectionIndex(idx);
    setQueue(shuffle(sections[idx].cards));
    setFlipped(false);
    setPhase('practice');
  }

  function startTest() {
    const all = sections.flatMap((s) => s.cards);
    setTestQueue(shuffle(all));
    setTestIndex(0);
    setTestScore({ correct: 0, wrong: 0 });
    setPhase('test');
  }

  function answerPractice(correct) {
    setFlipped(false);
    setQueue((q) => {
      const [head, ...rest] = q;
      const next = correct ? rest : [...rest, head];
      if (next.length === 0) {
        if (sectionIndex + 1 < sections.length) {
          setPhase('sectionDone');
        } else {
          startTest();
        }
      }
      return next;
    });
  }

  function answerTest(correct) {
    setTestScore((s) => ({ ...s, [correct ? 'correct' : 'wrong']: s[correct ? 'correct' : 'wrong'] + 1 }));
    setFlipped(false);
    setTestIndex((i) => {
      const next = i + 1;
      if (next >= testQueue.length) setPhase('finished');
      return next;
    });
  }

  function restartAll() {
    startSection(0);
  }

  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Назад</button>
      <h1>{deck.title}</h1>

      {phase === 'practice' && (
        <>
          <p className="subtitle">
            Раздел {sectionIndex + 1} / {sections.length}: {currentSection.title}
          </p>
          <p className="progress">Осталось в разделе: {queue.length}</p>
          <Flashcard
            front={queue[0].front}
            back={queue[0].back}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            isFavorite={isFavorite(queue[0].id)}
            onToggleFavorite={() => onToggleFavorite(queue[0].id)}
          />
          {flipped && (
            <div className="answer-buttons">
              <button className="btn btn-wrong" onClick={() => answerPractice(false)}>Не знал(а)</button>
              <button className="btn btn-correct" onClick={() => answerPractice(true)}>Знал(а)</button>
            </div>
          )}
        </>
      )}

      {phase === 'sectionDone' && (
        <div className="summary">
          <h2>Раздел «{currentSection.title}» пройден!</h2>
          <button className="btn" onClick={() => startSection(sectionIndex + 1)}>
            Следующий раздел →
          </button>
        </div>
      )}

      {phase === 'test' && (
        <>
          <p className="subtitle">Итоговый тест по всем разделам</p>
          <p className="progress">
            {testIndex + 1} / {testQueue.length}
          </p>
          <Flashcard
            front={testQueue[testIndex].front}
            back={testQueue[testIndex].back}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            isFavorite={isFavorite(testQueue[testIndex].id)}
            onToggleFavorite={() => onToggleFavorite(testQueue[testIndex].id)}
          />
          {flipped && (
            <div className="answer-buttons">
              <button className="btn btn-wrong" onClick={() => answerTest(false)}>Не знал(а)</button>
              <button className="btn btn-correct" onClick={() => answerTest(true)}>Знал(а)</button>
            </div>
          )}
        </>
      )}

      {phase === 'finished' && (
        <div className="summary">
          <h2>Тест завершён!</h2>
          <p>
            Правильно: {testScore.correct} · Ошибок: {testScore.wrong} · Всего: {testQueue.length}
          </p>
          <button className="btn" onClick={restartAll}>Пройти обучение заново</button>
        </div>
      )}
    </div>
  );
}
