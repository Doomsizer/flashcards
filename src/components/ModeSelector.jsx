import React from 'react';

export default function ModeSelector({ deck, favoritesCount, onSelect, onBack }) {
  return (
    <div className="screen">
      <button className="back-btn" onClick={onBack}>← Сменить словарь</button>
      <h1>{deck.title}</h1>
      <p className="subtitle">Выбери режим</p>
      <div className="mode-list">
        <button className="mode-card" onClick={() => onSelect('free')}>
          <span className="mode-title">Свободная прогонка</span>
          <span className="mode-desc">Все карточки в разброс, без повторов</span>
        </button>
        <button className="mode-card" onClick={() => onSelect('favorites')}>
          <span className="mode-title">Избранное ({favoritesCount})</span>
          <span className="mode-desc">Только карточки, добавленные в избранное</span>
        </button>
        <button className="mode-card" onClick={() => onSelect('learn')}>
          <span className="mode-title">Обучение</span>
          <span className="mode-desc">По разделам, с повтором ошибок и тестом в конце</span>
        </button>
      </div>
    </div>
  );
}
