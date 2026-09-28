import React from 'react';

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
