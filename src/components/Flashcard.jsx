import React, { useState } from 'react';

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
  // Счетчик для перезапуска анимации «поп» при каждом добавлении в избранное
  const [popCount, setPopCount] = useState(0);

  function handleFavorite(e) {
    e.stopPropagation();
    if (!isFavorite) setPopCount((n) => n + 1);
    onToggleFavorite();
  }

  // Звезда рисуется на каждой стороне отдельно, чтобы переворачиваться вместе с карточкой.
  // Кнопка на невидимой стороне убирается из фокуса.
  function renderFavButton(faceVisible) {
    if (!onToggleFavorite) return null;
    return (
      <button
        className={`fav-btn ${isFavorite ? 'fav-btn-active' : ''}`}
        onClick={handleFavorite}
        tabIndex={faceVisible ? 0 : -1}
        aria-hidden={!faceVisible}
        aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
        aria-pressed={isFavorite}
      >
        <span key={popCount} className={`fav-star ${popCount > 0 && isFavorite ? 'fav-star-pop' : ''}`}>
          {isFavorite ? '★' : '☆'}
        </span>
      </button>
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
