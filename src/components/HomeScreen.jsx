import React, { useState } from 'react';
import { DeckGroups, SearchInput, matchDeck } from './DeckList';
import { deckCountLabel } from '../utils/plural';

function CollectionCard({ title, meta, description, onClick }) {
  return (
    <button className="collection-card" onClick={onClick}>
      <span className="collection-title">{title}</span>
      <span className="collection-meta">{meta}</span>
      {description && <span className="collection-desc">{description}</span>}
    </button>
  );
}

function subjectsOf(decks) {
  return [...new Set(decks.map((d) => d.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
}

// Главный экран: две коллекции (готовые колоды и свои) и поиск сразу по всем колодам
export default function HomeScreen({
  builtinDecks,
  userDecks,
  userDecksStatus,
  loadingId,
  failedId,
  onOpenCollection,
  onSelectDeck,
}) {
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const found = searching ? [...builtinDecks, ...userDecks].filter((deck) => matchDeck(deck, query)) : [];

  let userMeta = userDecks.length ? deckCountLabel(userDecks.length) : 'Пока пусто';
  if (userDecksStatus === 'error') userMeta = 'Недоступно в этом браузере';

  // screen-top: при вводе в поиск поле остается на месте, а не прыгает вместе с центрированием
  return (
    <div className="screen screen-top">
      <h1>Выбери колоду</h1>
      <SearchInput value={query} onChange={setQuery} />

      {searching ? (
        found.length ? (
          <DeckGroups decks={found} loadingId={loadingId} onSelect={onSelectDeck} />
        ) : (
          <p className="fav-empty">Ничего не найдено</p>
        )
      ) : (
        <div className="collection-list">
          <CollectionCard
            title="Готовые колоды"
            meta={deckCountLabel(builtinDecks.length)}
            description={subjectsOf(builtinDecks).join(' · ')}
            onClick={() => onOpenCollection('builtin')}
          />
          <CollectionCard
            title="Мои колоды"
            meta={userMeta}
            description={
              userDecks.length ? subjectsOf(userDecks).join(' · ') : 'Свои колоды из текста: вставь — и готово'
            }
            onClick={() => onOpenCollection('user')}
          />
        </div>
      )}

      {failedId && (
        <p className="notice notice-error">Не получилось загрузить колоду. Проверь интернет и попробуй еще раз.</p>
      )}
    </div>
  );
}
