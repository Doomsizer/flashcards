import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import deckIndex from '../data/generated/deckIndex';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useUserDecks } from '../hooks/useUserDecks';
import { favoritesKey, pruneDeckFavorites, removeOrphanFavorites } from '../utils/favorites';
import { downloadText, deckFileName } from '../utils/download';
import { freeModeKind } from '../utils/deckTypes';
import HomeScreen from '../features/catalog/HomeScreen';
import CollectionScreen from '../features/catalog/CollectionScreen';
import ModeSelector from '../features/modes/ModeSelector';
import GithubLink from './GithubLink';
import LoadingScreen from './LoadingScreen';
import LoadErrorBoundary from './LoadErrorBoundary';
import './App.css';

// Экраны режимов грузятся отдельными файлами (JS и свой CSS), только когда нужны.
// Частые (prefetch) браузер скачивает заранее в свободное время, чтобы переход был мгновенным.
const ShuffleMode = lazy(() => import(/* webpackChunkName: "shuffle-mode", webpackPrefetch: true */ '../features/modes/ShuffleMode'));
const LearnMode = lazy(() => import(/* webpackChunkName: "learn-mode", webpackPrefetch: true */ '../features/modes/LearnMode'));
const FavoritesScreen = lazy(() => import(/* webpackChunkName: "favorites", webpackPrefetch: true */ '../features/modes/FavoritesScreen'));
const TableMode = lazy(() => import(/* webpackChunkName: "table-mode" */ '../features/table/TableMode'));
const DeckEditor = lazy(() => import(/* webpackChunkName: "deck-editor" */ '../features/editor/DeckEditor'));

function allCardsOf(d) {
  return d.sections.flatMap((s) => s.cards);
}

export default function App() {
  // Открытая коллекция: null — главный экран, 'builtin' — готовые колоды, 'user' — свои
  const [collection, setCollection] = useState(null);
  const [deck, setDeck] = useState(null);
  const [mode, setMode] = useState(null);
  // Набор карточек для ShuffleMode фиксируется при входе в режим,
  // чтобы клик по ☆ не перемешивал колоду заново посреди прохода
  const [sessionCards, setSessionCards] = useState([]);
  // Редактор своей колоды: null — закрыт, { deckId: null } — новая, { deckId, source } — правка
  const [editor, setEditor] = useState(null);
  // Подгрузка встроенной колоды: какая грузится сейчас и какая не загрузилась
  const [loadingId, setLoadingId] = useState(null);
  const [failedId, setFailedId] = useState(null);
  const openRequest = useRef(0);

  const userDecks = useUserDecks();

  // Избранное хранится отдельно для каждой колоды: favorites:<deckId> -> [id, id, ...]
  const [favIds, setFavIds] = useLocalStorage(deck ? favoritesKey(deck.id) : null, []);

  // Когда известны все колоды (встроенные + свои), чистим избранное удаленных колод.
  // Если хранилище своих колод недоступно, не чистим: иначе пропало бы их избранное.
  useEffect(() => {
    if (userDecks.status !== 'ready') return;
    removeOrphanFavorites([...deckIndex.map((d) => d.id), ...userDecks.records.map((r) => r.id)]);
    // Зависит только от статуса: чистка нужна один раз, сразу после загрузки списка своих колод
  }, [userDecks.status]);

  function isFavorite(cardId) {
    return favIds.includes(cardId);
  }

  function toggleFavorite(cardId) {
    setFavIds((ids) => (ids.includes(cardId) ? ids.filter((id) => id !== cardId) : [...ids, cardId]));
  }

  // «Назад» из колоды ведет в ее коллекцию, даже если колоду нашли поиском на главном экране
  function showDeck(data) {
    pruneDeckFavorites(data);
    setCollection(data.isUser ? 'user' : 'builtin');
    setMode(null);
    setDeck(data);
  }

  // Встроенная колода подгружается отдельным файлом; своя уже в памяти.
  // Если за время загрузки выбрали другую колоду — результат старой загрузки игнорируем.
  async function openDeck(entry) {
    const request = ++openRequest.current;
    setFailedId(null);
    if (entry.isUser) {
      setLoadingId(null);
      showDeck(entry);
      return;
    }
    setLoadingId(entry.id);
    try {
      const data = await entry.load();
      if (request === openRequest.current) showDeck(data);
    } catch (e) {
      if (request === openRequest.current) setFailedId(entry.id);
    } finally {
      if (request === openRequest.current) setLoadingId(null);
    }
  }

  function selectMode(m) {
    if (m === 'free') setSessionCards(allCardsOf(deck));
    setMode(m);
  }

  function startFavoritesRun(cards) {
    setSessionCards(cards);
    setMode('favoritesRun');
  }

  async function saveEditedDeck(source) {
    const saved = await userDecks.save(source, editor.deckId);
    if (!saved) throw new Error('Колода не разобралась после сохранения');
    setEditor(null);
    showDeck(saved);
  }

  async function deleteCurrentDeck() {
    await userDecks.remove(deck.id);
    setMode(null);
    setDeck(null);
  }

  function goHome() {
    openRequest.current++;
    setLoadingId(null);
    setFailedId(null);
    setEditor(null);
    setMode(null);
    setDeck(null);
    setCollection(null);
  }

  function openCollection(kind) {
    setFailedId(null);
    setCollection(kind);
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
      <LoadErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>{renderScreen()}</Suspense>
      </LoadErrorBoundary>
      <footer className="app-footer">
        <GithubLink />
      </footer>
    </>
  );

  function renderScreen() {
    if (editor) {
      return (
        <DeckEditor
          initialSource={editor.source || ''}
          isEdit={Boolean(editor.deckId)}
          onSave={saveEditedDeck}
          onCancel={() => setEditor(null)}
        />
      );
    }

    if (!deck && collection) {
      return (
        <CollectionScreen
          kind={collection}
          decks={collection === 'user' ? userDecks.decks : deckIndex}
          userDecksStatus={userDecks.status}
          loadingId={loadingId}
          failedId={failedId}
          onSelectDeck={openDeck}
          onAdd={() => setEditor({ deckId: null })}
          onBack={goHome}
        />
      );
    }

    if (!deck) {
      return (
        <HomeScreen
          builtinDecks={deckIndex}
          userDecks={userDecks.decks}
          userDecksStatus={userDecks.status}
          loadingId={loadingId}
          failedId={failedId}
          onOpenCollection={openCollection}
          onSelectDeck={openDeck}
        />
      );
    }

    if (!mode) {
      return (
        <ModeSelector
          deck={deck}
          favoritesCount={favIds.length}
          onSelect={selectMode}
          onBack={() => setDeck(null)}
          onEdit={() => setEditor({ deckId: deck.id, source: deck.source })}
          onExport={() => downloadText(deckFileName(deck.title), deck.source)}
          onDelete={deleteCurrentDeck}
        />
      );
    }

    const back = () => setMode(null);

    if (mode === 'favorites') {
      return (
        <FavoritesScreen
          deck={deck}
          favIds={favIds}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onClearAll={() => setFavIds([])}
          onStart={startFavoritesRun}
          onBack={back}
        />
      );
    }

    if (mode === 'free' || mode === 'favoritesRun') {
      return (
        <ShuffleMode
          title={mode === 'free' ? 'Свободная прогонка' : 'Избранное'}
          cards={sessionCards}
          // Формулы и выбор ответа в прогоне — обычные карточки: сборка и варианты только в «Обучении»
          kind={freeModeKind(deck.type)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          // Из прогона избранного возвращаемся к списку избранного
          onBack={mode === 'favoritesRun' ? () => setMode('favorites') : back}
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
