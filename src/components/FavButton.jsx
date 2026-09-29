import React, { useState } from 'react';

// Звезда избранного с анимацией «поп» при добавлении
export default function FavButton({ isFavorite, onToggle, className = '', hidden = false }) {
  // Счетчик для перезапуска анимации при каждом добавлении в избранное
  const [popCount, setPopCount] = useState(0);

  function handleClick(e) {
    e.stopPropagation();
    if (!isFavorite) setPopCount((n) => n + 1);
    onToggle();
  }

  return (
    <button
      className={`fav-btn ${isFavorite ? 'fav-btn-active' : ''} ${className}`}
      onClick={handleClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
      aria-pressed={isFavorite}
    >
      <span key={popCount} className={`fav-star ${popCount > 0 && isFavorite ? 'fav-star-pop' : ''}`}>
        {isFavorite ? '★' : '☆'}
      </span>
    </button>
  );
}
