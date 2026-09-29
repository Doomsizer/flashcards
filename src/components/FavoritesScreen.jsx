import React, { useState } from 'react';
import BackButton from './BackButton';
import FavButton from './FavButton';
import { cardText } from '../utils/cardText';

// Экран избранного: список с поиском, снятие звезд, очистка и запуск прогона.
// Список фиксируется при открытии экрана: карточка со снятой звездой остается видна
// (полупрозрачной), чтобы случайное нажатие можно было отменить.
export default function FavoritesScreen({ deck, favIds, isFavorite, onToggleFavorite, onClearAll, onStart, onBack }) {
  const allCards = deck.sections.flatMap((s) => s.cards);
  const [shownIds] = useState(() => new Set(favIds));
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const shownCards = allCards.filter((card) => shownIds.has(card.id));
  const activeCards = allCards.filter((card) => isFavorite(card.id));

  const q = query.trim().toLowerCase();
  const visibleCards = q
    ? shownCards.filter((card) => `${card.front} ${card.back} ${card.hint || ''}`.toLowerCase().includes(q))
    : shownCards;

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <h1>Избранное</h1>
      <p className="subtitle">{deck.title}</p>

      <div className="fav-screen">
        <button className="btn btn-primary" disabled={activeCards.length === 0} onClick={() => onStart(activeCards)}>
          Прогнать избранное ({activeCards.length})
        </button>

        {shownCards.length === 0 ? (
          <p className="fav-empty">Здесь пока пусто. Добавляй карточки в избранное значком ☆ в других режимах.</p>
        ) : (
          <>
            <input
              className="search-input"
              type="search"
              placeholder="Поиск по карточкам"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {visibleCards.length === 0 ? (
              <p className="fav-empty">Ничего не найдено</p>
            ) : (
              <ul className="card-list">
                {visibleCards.map((card) => {
                  const { main, sub } = cardText(card, deck.type);
                  const active = isFavorite(card.id);
                  return (
                    <li key={card.id} className={`card-row ${active ? '' : 'card-row-removed'}`}>
                      <div className="card-row-text">
                        <span className="card-row-main">{main}</span>
                        {sub && <span className="card-row-sub">{sub}</span>}
                      </div>
                      <FavButton isFavorite={active} onToggle={() => onToggleFavorite(card.id)} />
                    </li>
                  );
                })}
              </ul>
            )}

            {activeCards.length > 0 && (
              <div className="clear-zone">
                {confirmClear ? (
                  <>
                    <p>Убрать из избранного все карточки ({activeCards.length})?</p>
                    <button
                      className="link-btn link-btn-danger"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                    >
                      Да, очистить
                    </button>
                    <button className="link-btn" onClick={() => setConfirmClear(false)}>
                      Отмена
                    </button>
                  </>
                ) : (
                  <button className="link-btn link-btn-danger" onClick={() => setConfirmClear(true)}>
                    Очистить избранное
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
