import React from 'react';

export default function Flashcard({ front, back, flipped, onFlip, isFavorite, onToggleFavorite }) {
  return (
    <div className="flashcard" onClick={onFlip}>
      {onToggleFavorite && (
        <button
          className={`fav-btn ${isFavorite ? 'fav-btn-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label="В избранное"
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
      <div className="flashcard-content">
        {!flipped ? (
          <p className="flashcard-front">{front}</p>
        ) : (
          <p className="flashcard-back">{back}</p>
        )}
      </div>
      <p className="flashcard-hint">{flipped ? '' : 'нажми, чтобы увидеть ответ'}</p>
    </div>
  );
}
