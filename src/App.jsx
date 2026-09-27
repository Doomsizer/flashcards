import React, { useState } from 'react';
import decks from './data/decks';
import { useLocalStorage } from './hooks/useLocalStorage';
import DeckSelector from './components/DeckSelector';
import ModeSelector from './components/ModeSelector';
import ShuffleMode from './components/ShuffleMode';
import LearnMode from './components/LearnMode';
import './App.css';

export default function App() {
  const [deck, setDeck] = useState(null);
  const [mode, setMode] = useState(null);

  // Избранное хранится отдельно для каждой колоды: favorites:<deckId> -> [id, id, ...]
  const [favIds, setFavIds] = useLocalStorage(deck ? `favorites:${deck.id}` : 'favorites:none', []);

  function isFavorite(cardId) {
    return favIds.includes(cardId);
  }

  function toggleFavorite(cardId) {
    setFavIds((ids) => (ids.includes(cardId) ? ids.filter((id) => id !== cardId) : [...ids, cardId]));
  }

  function allCardsOf(d) {
    return d.sections.flatMap((s) => s.cards);
  }

  if (!deck) {
    return <DeckSelector decks={decks} onSelect={(d) => setDeck(d)} />;
  }

  if (!mode) {
    return (
      <ModeSelector
        deck={deck}
        favoritesCount={favIds.length}
        onSelect={(m) => setMode(m)}
        onBack={() => setDeck(null)}
      />
    );
  }

  const back = () => setMode(null);

  if (mode === 'free') {
    return (
      <ShuffleMode
        title="Свободная прогонка"
        cards={allCardsOf(deck)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onBack={back}
      />
    );
  }

  if (mode === 'favorites') {
    const favCards = allCardsOf(deck).filter((c) => favIds.includes(c.id));
    return (
      <ShuffleMode
        title="Избранное"
        cards={favCards}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onBack={back}
      />
    );
  }

  if (mode === 'learn') {
    return (
      <LearnMode deck={deck} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} onBack={back} />
    );
  }

  return null;
}
