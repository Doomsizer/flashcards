import React from 'react';
import { cardCountLabel } from '../utils/plural';
import { deckKindLabel } from '../utils/deckTypes';

const NO_SUBJECT = 'Без предмета';

export function DeckCard({ deck, loading, onSelect }) {
  return (
    <button
      className={`deck-card ${deck.isUser ? 'deck-card-user' : ''} ${loading ? 'is-loading' : ''}`}
      onClick={() => onSelect(deck)}
      aria-busy={loading}
    >
      <span className="deck-subject">
        {deckKindLabel(deck)}
        {deck.isUser && <span className="deck-badge">моя</span>}
      </span>
      <span className="deck-title">{deck.title}</span>
      <span className="deck-count">{cardCountLabel(deck.cardCount)}</span>
      {loading && <span className="spinner spinner-small deck-spinner" aria-hidden="true" />}
    </button>
  );
}

// Поиск по названию и предмету, без учета регистра
export function matchDeck(deck, query) {
  const q = query.trim().toLowerCase();
  return !q || `${deck.title} ${deck.subject || ''}`.toLowerCase().includes(q);
}

// Колоды по предметам: предметы по алфавиту («Без предмета» в конце), внутри — по названию
export function groupBySubject(decks) {
  const groups = new Map();
  decks.forEach((deck) => {
    const subject = deck.subject || NO_SUBJECT;
    if (!groups.has(subject)) groups.set(subject, []);
    groups.get(subject).push(deck);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a === NO_SUBJECT) - (b === NO_SUBJECT) || a.localeCompare(b, 'ru'))
    .map(([subject, list]) => ({
      subject,
      decks: [...list].sort((x, y) => x.title.localeCompare(y.title, 'ru')),
    }));
}

export function DeckGroups({ decks, loadingId, onSelect }) {
  return groupBySubject(decks).map(({ subject, decks: list }) => (
    <section key={subject} className="deck-group">
      <h2 className="section-title">{subject}</h2>
      <div className="deck-list">
        {list.map((deck) => (
          <DeckCard key={deck.id} deck={deck} loading={loadingId === deck.id} onSelect={onSelect} />
        ))}
      </div>
    </section>
  ));
}

export function SearchInput({ value, onChange, placeholder = 'Найти колоду: название или предмет' }) {
  return (
    <input
      className="search-input"
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
