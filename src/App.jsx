import React, { useState } from 'react';
import decks from './data/decks';
import { useLocalStorage } from './hooks/useLocalStorage';
import { favoritesKey } from './utils/favorites';
import DeckSelector from './components/DeckSelector';
import ModeSelector from './components/ModeSelector';
import ShuffleMode from './components/ShuffleMode';
import LearnMode from './components/LearnMode';
import TableMode from './components/TableMode';
import GithubLink from './components/GithubLink';
import './App.css';

function allCardsOf(d) {
  return d.sections.flatMap((s) => s.cards);
}

export default function App() {
  const [deck, setDeck] = useState(null);
  const [mode, setMode] = useState(null);
  // Набор карточек для ShuffleMode фиксируется при входе в режим,
  // чтобы клик по ☆ не перемешивал колоду заново посреди прохода
  const [sessionCards, setSessionCards] = useState([]);

  // Избранное хранится отдельно для каждой колоды: favorites:<deckId> -> [id, id, ...]
  const [favIds, setFavIds] = useLocalStorage(deck ? favoritesKey(deck.id) : null, []);

  function isFavorite(cardId) {
    return favIds.includes(cardId);
  }

  function toggleFavorite(cardId) {
    setFavIds((ids) => (ids.includes(cardId) ? ids.filter((id) => id !== cardId) : [...ids, cardId]));
  }

  function selectMode(m) {
    const all = allCardsOf(deck);
    if (m === 'free') setSessionCards(all);
    if (m === 'favorites') setSessionCards(all.filter((c) => favIds.includes(c.id)));
    setMode(m);
  }

  function goHome() {
    setMode(null);
    setDeck(null);
  }

  return (
    <>
      <header className="app-header">
        <button className="app-logo" onClick={goHome} aria-label="На главную">
          <span>
            by <span className="app-logo-name">Doomsizer</span> with love
          </span>
          <span className="app-logo-heart" aria-hidden="true">❤</span>
        </button>
      </header>
      {renderScreen()}
      <footer className="app-footer">
        <GithubLink />
      </footer>
    </>
  );

  function renderScreen() {
    if (!deck) {
      return <DeckSelector decks={decks} onSelect={(d) => setDeck(d)} />;
    }

    if (!mode) {
      return (
        <ModeSelector
          deck={deck}
          favoritesCount={favIds.length}
          onSelect={selectMode}
          onBack={() => setDeck(null)}
        />
      );
    }

    const back = () => setMode(null);

    if (mode === 'free' || mode === 'favorites') {
      return (
        <ShuffleMode
          title={mode === 'free' ? 'Свободная прогонка' : 'Избранное'}
          cards={sessionCards}
          kind={deck.type}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onBack={back}
        />
      );
    }

    if (mode === 'table') {
      return <TableMode deck={deck} onBack={back} />;
    }

    if (mode === 'learn') {
      return (
        <LearnMode deck={deck} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onBack={back} />
      );
    }

    return null;
  }
}
