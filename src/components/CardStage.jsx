import React, { useState } from 'react';
import Flashcard from './Flashcard';
import AnswerButtons, { NextButton } from './AnswerButtons';
import BuildCard from './BuildCard';
import ChoiceCard, { ChoiceQuestion, ChoiceAnswer } from './ChoiceCard';
import { FormulaQuestion, FormulaAnswer } from './Formula';
import { StressChoice, StressAnswer } from './StressWord';
import { VowelBlank, VowelAnswer, vowelOptions } from './VowelWord';

// Карточка + кнопки ответа. Хранит состояние одного показа (перевернута / выбранный ответ),
// поэтому родитель должен задавать новый key на каждый показ.
// kind: 'basic'  — «знал / не знал» после переворота;
//       'stress' — выбор ударной гласной в слове;
//       'vowel'  — выбор пропущенной гласной из вариантов под карточкой;
//       'build'  — сборка формулы из перемешанных частей (режим «Обучение»);
//       'formula' — карточка формулы без сборки: название -> переворот -> формула (свободный режим);
//       'choice' — выбор ответа из четырех вариантов (answerPool — все ответы колоды, режим «Обучение»);
//       'choice-flip' — карточка с выбором ответа без вариантов: вопрос с примером -> переворот (свободный режим).
export default function CardStage({ card, kind = 'basic', answerPool, isFavorite, onToggleFavorite, onAnswer }) {
  const [flipped, setFlipped] = useState(false);
  const [choice, setChoice] = useState(null);

  function choose(value) {
    setChoice(value);
    setFlipped(true);
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

  if (kind === 'build') {
    return <BuildCard card={card} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} onAnswer={onAnswer} />;
  }

  if (kind === 'choice') {
    return (
      <ChoiceCard
        card={card}
        answerPool={answerPool}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        onAnswer={onAnswer}
      />
    );
  }

  if (kind === 'choice-flip') {
    return (
      <>
        <Flashcard
          front={<ChoiceQuestion card={card} />}
          back={<ChoiceAnswer card={card} />}
          hint="вспомни ответ и нажми, чтобы проверить"
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <AnswerButtons visible={flipped} onAnswer={onAnswer} />
      </>
    );
  }

  if (kind === 'formula') {
    return (
      <>
        <Flashcard
          front={<FormulaQuestion card={card} />}
          back={<FormulaAnswer card={card} />}
          hint="вспомни формулу и нажми, чтобы проверить"
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <AnswerButtons visible={flipped} onAnswer={onAnswer} />
      </>
    );
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
        <NextButton visible={flipped} onClick={() => onAnswer(correct)} />
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
          <NextButton visible onClick={() => onAnswer(correct)} />
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
