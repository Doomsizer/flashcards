import React from 'react';
import FavButton from './FavButton';
import './Flashcard.css';

// Оболочка карточки: обе стороны рендерятся всегда и переворачиваются через CSS 3D.
// front/back — любое содержимое. Если onFlip не передан, клик по карточке ее не переворачивает.
// Родитель передает key, уникальный для каждого показа карточки, чтобы новая карточка
// монтировалась сразу лицом вверх (иначе при обратном перевороте мелькнул бы следующий ответ).
export default function Flashcard({
  front,
  back,
  hint,
  backLabel = 'Ответ',
  backClassName = '',
  flipped,
  onFlip,
  isFavorite,
  onToggleFavorite,
}) {
  // Звезда рисуется на каждой стороне отдельно, чтобы переворачиваться вместе с карточкой.
  // Кнопка на невидимой стороне убирается из фокуса.
  function renderFavButton(faceVisible) {
    if (!onToggleFavorite) return null;
    return (
      <FavButton
        className="fav-btn-corner"
        isFavorite={isFavorite}
        onToggle={onToggleFavorite}
        hidden={!faceVisible}
      />
    );
  }

  return (
    <div className={`flashcard ${onFlip ? '' : 'flashcard-static'}`} onClick={onFlip}>
      <div className={`flashcard-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="flashcard-face flashcard-face-front">
          {renderFavButton(!flipped)}
          <div className="flashcard-text">{front}</div>
          {hint && <p className="flashcard-hint">{hint}</p>}
        </div>
        <div className={`flashcard-face flashcard-face-back ${backClassName}`}>
          {renderFavButton(flipped)}
          <p className="flashcard-label">{backLabel}</p>
          <div className="flashcard-text flashcard-text-back">{back}</div>
        </div>
      </div>
    </div>
  );
}
