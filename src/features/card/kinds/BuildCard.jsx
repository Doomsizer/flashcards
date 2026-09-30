import React, { useState } from 'react';
import Flashcard from '../Flashcard';
import { NextButton } from '../AnswerButtons';
import { FormulaQuestion, FormulaAnswer, TokenLabel, tokenAriaLabel, tokenView } from './Formula';
import { sameFormula } from '../../../utils/formulaCheck';
import { shuffle } from '../../../utils/shuffle';
import './BuildCard.css';

// Порядок частей в наборе: перемешанный, но не совпадающий с правильным
function scrambledOrder(tokens) {
  const indices = tokens.map((_, i) => i);
  const solved = (order) => order.every((ti, pos) => tokens[ti] === tokens[pos]);
  let order = shuffle(indices);
  for (let tries = 0; new Set(tokens).size > 1 && solved(order) && tries < 20; tries++) order = shuffle(indices);
  return order;
}

// Карточка сборки (Type: build, режим «Обучение»): части формулы перемешаны, их нужно нажимать по порядку.
// Порядок нестрогий: засчитывается любая равносильная запись (см. utils/formulaCheck).
// Нажатие на часть в строке сборки возвращает ее обратно в набор.
// Состояние одного показа — родитель задает новый key на каждый показ.
export default function BuildCard({ card, isFavorite, onToggleFavorite, onAnswer }) {
  const [pool] = useState(() => scrambledOrder(card.tokens));
  const [placed, setPlaced] = useState([]);
  // Результат проверки: { correct, exact } — считается один раз при нажатии «Проверить»
  const [result, setResult] = useState(null);

  const checked = result !== null;
  const placedSet = new Set(placed);
  const complete = placed.length === card.tokens.length;

  function check() {
    const userTokens = placed.map((ti) => card.tokens[ti]);
    const exact = userTokens.every((t, pos) => t === card.tokens[pos]);
    setResult({ exact, correct: exact || sameFormula(userTokens, card.tokens) });
  }

  // Степень в строке сборки стоит выше, индекс — ниже, как в записанной формуле
  function tokenClass(raw) {
    const { kind } = tokenView(raw);
    return kind === 'sup' || kind === 'sub' ? `build-token-script build-token-${kind}` : '';
  }

  // После проверки: верный ответ — все части зеленые; неверный — сравнение с эталоном по местам
  function tokenState(raw, pos) {
    if (!checked) return '';
    if (result.correct) return 'is-ok';
    return raw === card.tokens[pos] ? 'is-ok' : 'is-bad';
  }

  return (
    <>
      <Flashcard
        front={<FormulaQuestion card={card} />}
        back={<FormulaAnswer card={card} />}
        hint="собери формулу из частей ниже"
        backLabel={checked && result.correct ? 'Верно!' : 'Неверно'}
        backClassName={checked && result.correct ? 'flashcard-face-correct' : 'flashcard-face-wrong'}
        flipped={checked}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="build-area">
        <div
          className={`build-line ${checked ? (result.correct ? 'is-correct' : 'is-wrong') : ''}`}
          aria-label="Собранная формула"
        >
          {placed.length === 0 ? (
            <span className="build-placeholder">Нажимай на части по порядку</span>
          ) : (
            placed.map((ti, pos) => {
              const raw = card.tokens[ti];
              return (
                <button
                  key={ti}
                  className={`build-token build-token-placed ${tokenClass(raw)} ${tokenState(raw, pos)}`}
                  onClick={() => setPlaced(placed.filter((_, p) => p !== pos))}
                  disabled={checked}
                  aria-label={`${tokenAriaLabel(raw)} — убрать`}
                >
                  <TokenLabel raw={raw} bare />
                </button>
              );
            })
          )}
        </div>
        {checked && result.correct && !result.exact && (
          <p className="build-note">Порядок другой, но формула та же — засчитано</p>
        )}

        {!checked && (
          <div className="build-pool">
            {pool.map((ti) =>
              placedSet.has(ti) ? (
                // Место взятой части остается пустым, чтобы остальные кнопки не прыгали
                <span key={ti} className="build-token build-token-used" aria-hidden="true">
                  <TokenLabel raw={card.tokens[ti]} />
                </span>
              ) : (
                <button
                  key={ti}
                  className="build-token"
                  onClick={() => setPlaced([...placed, ti])}
                  aria-label={tokenAriaLabel(card.tokens[ti])}
                >
                  <TokenLabel raw={card.tokens[ti]} />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {checked ? (
        <NextButton visible onClick={() => onAnswer(result.correct)} />
      ) : (
        <div className="answer-buttons">
          <button className="btn btn-ghost" onClick={() => setPlaced([])} disabled={placed.length === 0}>
            Сбросить
          </button>
          <button className="btn btn-next" onClick={check} disabled={!complete}>
            Проверить
          </button>
        </div>
      )}
    </>
  );
}
