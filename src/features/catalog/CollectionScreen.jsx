import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import SearchInput from '../../components/SearchInput';
import { DeckGroups, matchDeck } from './DeckList';

// Одна коллекция (готовые колоды или свои): поиск и колоды, сгруппированные по предметам
export default function CollectionScreen({
  kind,
  decks,
  userDecksStatus,
  loadingId,
  failedId,
  onSelectDeck,
  onAdd,
  onBack,
}) {
  const [query, setQuery] = useState('');
  const isUser = kind === 'user';
  const found = decks.filter((deck) => matchDeck(deck, query));

  return (
    <div className="screen screen-top">
      <BackButton onClick={onBack} />
      <h1>{isUser ? 'Мои колоды' : 'Готовые колоды'}</h1>
      {decks.length > 1 && <SearchInput value={query} onChange={setQuery} />}

      {isUser &&
        (userDecksStatus === 'error' ? (
          <p className="notice">
            Хранилище браузера недоступно (например, в режиме инкогнито), поэтому свои колоды здесь не сохранятся.
          </p>
        ) : (
          <button className="deck-card deck-card-add" onClick={onAdd}>
            <span className="deck-add-plus" aria-hidden="true">+</span>
            <span className="deck-title">Добавить свою колоду</span>
            <span className="deck-count">Вставь текст — и он станет карточками</span>
          </button>
        ))}

      {found.length > 0 && <DeckGroups decks={found} loadingId={loadingId} onSelect={onSelectDeck} />}
      {decks.length > 0 && found.length === 0 && <p className="fav-empty">Ничего не найдено</p>}
      {isUser && decks.length === 0 && userDecksStatus !== 'error' && (
        <p className="fav-empty">Здесь пока пусто — добавь первую колоду.</p>
      )}

      {failedId && (
        <p className="notice notice-error">Не получилось загрузить колоду. Проверь интернет и попробуй еще раз.</p>
      )}
    </div>
  );
}
