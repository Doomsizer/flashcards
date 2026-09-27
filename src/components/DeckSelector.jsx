import React from 'react';

export default function DeckSelector({ decks, onSelect }) {
  return (
    <div className="screen">
      <h1>Выбери словарь</h1>
      <div className="deck-list">
        {decks.map((deck) => (
          <button key={deck.id} className="deck-card" onClick={() => onSelect(deck)}>
            <span className="deck-subject">{deck.subject}</span>
            <span className="deck-title">{deck.title}</span>
            <span className="deck-count">
              {deck.sections.reduce((sum, s) => sum + s.cards.length, 0)} карточек
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
