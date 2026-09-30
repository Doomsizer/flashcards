import React from 'react';
import ArrowIcon from '../../components/ArrowIcon';
import './AnswerButtons.css';

// Кнопки всегда занимают место под карточкой, чтобы верстка не прыгала;
// до переворота они скрыты и неактивны.
export default function AnswerButtons({ visible, onAnswer }) {
  return (
    <div className={`answer-buttons ${visible ? '' : 'answer-buttons-hidden'}`} aria-hidden={!visible}>
      <button className="btn btn-wrong" disabled={!visible} onClick={() => onAnswer(false)}>
        Не знал(а)
      </button>
      <button className="btn btn-correct" disabled={!visible} onClick={() => onAnswer(true)}>
        Знал(а)
      </button>
    </div>
  );
}

// «Дальше» у карточек с автоматической проверкой ответа (ударения, гласные, формулы)
export function NextButton({ visible, onClick }) {
  return (
    <div className={`answer-buttons ${visible ? '' : 'answer-buttons-hidden'}`} aria-hidden={!visible}>
      <button className="btn btn-next" disabled={!visible} onClick={onClick}>
        <span>Дальше</span>
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
}
