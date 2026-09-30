import React, { useState } from 'react';
import Flashcard from './Flashcard';
import { NextButton } from './AnswerButtons';
import { shuffle } from '../utils/shuffle';

const OPTION_COUNT = 4;

// Варианты ответа: правильный + случайные другие ответы колоды, в случайном порядке
function pickOptions(answer, answerPool = []) {
  const others = shuffle(answerPool.filter((a) => a !== answer)).slice(0, OPTION_COUNT - 1);
  return shuffle([answer, ...others]);
}

// Лицевая сторона: вопрос и пример или пояснение под ним
export function ChoiceQuestion({ card }) {
  return (
    <span className="build-block">
      <span className="choice-question">{card.front}</span>
      {card.hint && <span className="build-hint">{card.hint}</span>}
    </span>
  );
}

// Оборот: ответ, под ним вопрос с примером — чтобы было видно, к чему ответ
export function ChoiceAnswer({ card }) {
  return (
    <span className="build-block">
      <span className="choice-question">{card.back}</span>
      <span className="build-hint">
        {card.front}
        {card.hint && ` — ${card.hint}`}
      </span>
    </span>
  );
}

// Карточка выбора ответа (Type: choice, режим «Обучение»): под карточкой четыре варианта.
// После выбора карточка переворачивается, правильный вариант подсвечивается зеленым, ошибочный — красным.
// Состояние одного показа — родитель задает новый key на каждый показ.
export default function ChoiceCard({ card, answerPool, isFavorite, onToggleFavorite, onAnswer }) {
  const [options] = useState(() => pickOptions(card.back, answerPool));
  const [choice, setChoice] = useState(null);
  const answered = choice !== null;
  const correct = choice === card.back;

  function optionState(option) {
    if (!answered) return '';
    if (option === card.back) return 'is-ok';
    return option === choice ? 'is-bad' : 'is-dim';
  }

  return (
    <>
      <Flashcard
        front={<ChoiceQuestion card={card} />}
        back={<ChoiceAnswer card={card} />}
        hint="выбери ответ ниже"
        backLabel={correct ? 'Верно!' : 'Неверно'}
        backClassName={correct ? 'flashcard-face-correct' : 'flashcard-face-wrong'}
        flipped={answered}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
      <div className="choice-grid">
        {options.map((option) => (
          <button
            key={option}
            className={`btn btn-choice ${optionState(option)}`}
            disabled={answered}
            onClick={() => setChoice(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <NextButton visible={answered} onClick={() => onAnswer(correct)} />
    </>
  );
}
