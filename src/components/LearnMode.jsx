import React, { useState } from 'react';
import CardStage from './CardStage';
import BackButton from './BackButton';
import ArrowIcon from './ArrowIcon';
import { shuffle } from '../utils/shuffle';

// phase: 'practice' -> 'sectionDone' -> (следующий раздел | 'test') -> 'finished'
export default function LearnMode({ deck, isFavorite, onToggleFavorite, onBack }) {
  const sections = deck.sections;
  const [sectionIndex, setSectionIndex] = useState(0);
  const [queue, setQueue] = useState(() => shuffle(sections[0].cards));
  // Номер показа карточки: нужен для key, чтобы та же карточка после ошибки показывалась заново
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('practice');
  const [testQueue, setTestQueue] = useState([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState({ correct: 0, wrong: 0 });

  const currentSection = sections[sectionIndex];

  function startSection(idx) {
    setSectionIndex(idx);
    setQueue(shuffle(sections[idx].cards));
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
    const [head, ...rest] = queue;
    const next = correct ? rest : [...rest, head];
    setQueue(next);
    setStep((s) => s + 1);
    if (next.length > 0) return;
    if (sectionIndex + 1 < sections.length) {
      setPhase('sectionDone');
    } else {
      startTest();
    }
  }

  function answerTest(correct) {
    const next = testIndex + 1;
    setTestScore((s) => ({ ...s, [correct ? 'correct' : 'wrong']: s[correct ? 'correct' : 'wrong'] + 1 }));
    setTestIndex(next);
    if (next >= testQueue.length) setPhase('finished');
  }

  function restartAll() {
    startSection(0);
  }

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <h1>{deck.title}</h1>

      {phase === 'practice' && (
        <>
          <p className="subtitle">
            Раздел {sectionIndex + 1} / {sections.length}: {currentSection.title}
          </p>
          <p className="progress">Осталось в разделе: {queue.length}</p>
          <CardStage
            key={step}
            card={queue[0]}
            kind={deck.type}
            isFavorite={isFavorite(queue[0].id)}
            onToggleFavorite={() => onToggleFavorite(queue[0].id)}
            onAnswer={answerPractice}
          />
        </>
      )}

      {phase === 'sectionDone' && (
        <div className="summary">
          <h2>Раздел «{currentSection.title}» пройден!</h2>
          <button className="btn" onClick={() => startSection(sectionIndex + 1)}>
            <span>Следующий раздел</span>
            <ArrowIcon direction="right" />
          </button>
        </div>
      )}

      {phase === 'test' && (
        <>
          <p className="subtitle">Итоговый тест по всем разделам</p>
          <p className="progress">
            {testIndex + 1} / {testQueue.length}
          </p>
          <CardStage
            key={`test-${testIndex}`}
            card={testQueue[testIndex]}
            kind={deck.type}
            isFavorite={isFavorite(testQueue[testIndex].id)}
            onToggleFavorite={() => onToggleFavorite(testQueue[testIndex].id)}
            onAnswer={answerTest}
          />
        </>
      )}

      {phase === 'finished' && (
        <div className="summary">
          <h2>Тест завершен!</h2>
          <p>
            Правильно: {testScore.correct} · Ошибок: {testScore.wrong} · Всего: {testQueue.length}
          </p>
          <button className="btn" onClick={restartAll}>Пройти обучение заново</button>
        </div>
      )}
    </div>
  );
}
