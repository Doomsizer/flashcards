import React, { useState } from 'react';
import Flashcard from './Flashcard';
import AnswerButtons from './AnswerButtons';
import ArrowIcon from './ArrowIcon';
import { StressChoice, StressAnswer } from './StressWord';
import { VowelBlank, VowelAnswer, vowelOptions } from './VowelWord';

// Карточка + кнопки ответа. Хранит состояние одного показа (перевернута / выбранный ответ),
// поэтому родитель должен задавать новый key на каждый показ.
// kind: 'basic'  — «знал / не знал» после переворота;
//       'stress' — выбор ударной гласной в слове;
//       'vowel'  — выбор пропущенной гласной из вариантов под карточкой.
export default function CardStage({ card, kind = 'basic', isFavorite, onToggleFavorite, onAnswer }) {
  const [flipped, setFlipped] = useState(false);
  const [choice, setChoice] = useState(null);

  function choose(value) {
    setChoice(value);
    setFlipped(true);
  }

  function renderNext(correct) {
    return (
      <div className={`answer-buttons ${flipped ? '' : 'answer-buttons-hidden'}`} aria-hidden={!flipped}>
        <button className="btn btn-next" disabled={!flipped} onClick={() => onAnswer(correct)}>
          <span>Дальше</span>
          <ArrowIcon direction="right" />
        </button>
      </div>
    );
  }

  // Общие свойства карточек с автоматической проверкой ответа
  function checkedCardProps(correct) {
    return {
      backLabel: correct ? 'Верно!' : 'Неверно',
      backClassName: correct ? 'flashcard-face-correct' : 'flashcard-face-wrong',
      flipped,
      isFavorite,
      onToggleFavorite,
    };
  }

  if (kind === 'stress') {
    const correct = choice === card.stressIndex;
    return (
      <>
        <Flashcard
          front={<StressChoice word={card.front} hint={card.hint} disabled={flipped} onChoose={choose} />}
          back={<StressAnswer word={card.front} hint={card.hint} stressIndex={card.stressIndex} choice={choice} />}
          hint="выбери ударную гласную"
          {...checkedCardProps(correct)}
        />
        {renderNext(correct)}
      </>
    );
  }

  if (kind === 'vowel') {
    const letter = card.back[card.blankIndex].toLowerCase();
    const correct = choice === letter;
    return (
      <>
        <Flashcard
          front={<VowelBlank card={card} />}
          back={<VowelAnswer card={card} choice={choice} />}
          hint="какая буква пропущена?"
          {...checkedCardProps(correct)}
        />
        {flipped ? (
          renderNext(correct)
        ) : (
          <div className="answer-buttons">
            {vowelOptions(letter).map((option) => (
              <button key={option} className="btn btn-option" onClick={() => choose(option)}>
                {option}
              </button>
            ))}
          </div>
        )}
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
