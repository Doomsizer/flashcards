import React, { useState } from 'react';
import Flashcard from './Flashcard';
import AnswerButtons from './AnswerButtons';
import ArrowIcon from './ArrowIcon';
import { StressChoice, StressAnswer } from './StressWord';

// Карточка + кнопки ответа. Хранит состояние одного показа (перевернута / выбранная гласная),
// поэтому родитель должен задавать новый key на каждый показ.
// kind: 'basic' — «знал / не знал» после переворота; 'stress' — выбор ударной гласной.
export default function CardStage({ card, kind = 'basic', isFavorite, onToggleFavorite, onAnswer }) {
  const [flipped, setFlipped] = useState(false);
  const [choice, setChoice] = useState(null);

  if (kind === 'stress') {
    const correct = choice === card.stressIndex;
    return (
      <>
        <Flashcard
          front={
            <StressChoice
              word={card.front}
              hint={card.hint}
              disabled={flipped}
              onChoose={(i) => {
                setChoice(i);
                setFlipped(true);
              }}
            />
          }
          back={<StressAnswer word={card.front} hint={card.hint} stressIndex={card.stressIndex} choice={choice} />}
          hint="выбери ударную гласную"
          backLabel={correct ? 'Верно!' : 'Неверно'}
          backClassName={correct ? 'flashcard-face-correct' : 'flashcard-face-wrong'}
          flipped={flipped}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <div className={`answer-buttons ${flipped ? '' : 'answer-buttons-hidden'}`} aria-hidden={!flipped}>
          <button className="btn btn-next" disabled={!flipped} onClick={() => onAnswer(correct)}>
            <span>Дальше</span>
            <ArrowIcon direction="right" />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Flashcard
        front={card.front}
        back={card.back}
        hint="нажми, чтобы увидеть ответ"
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
      <AnswerButtons visible={flipped} onAnswer={onAnswer} />
    </>
  );
}
