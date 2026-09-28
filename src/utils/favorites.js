const PREFIX = 'favorites:';

// Ключ localStorage с избранным колоды: favorites:<deckId> -> [id, id, ...]
export function favoritesKey(deckId) {
  return `${PREFIX}${deckId}`;
}

// Чистка избранного при запуске: убирает id карточек, которых больше нет в колоде,
// и целиком удаляет записи колод, которых больше нет.
export function cleanupFavorites(decks) {
  try {
    const storage = window.localStorage;
    const cardIdsByKey = new Map(
      decks.map((deck) => [favoritesKey(deck.id), new Set(deck.sections.flatMap((s) => s.cards.map((c) => c.id)))])
    );

    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }

    keys.forEach((key) => {
      const cardIds = cardIdsByKey.get(key);
      if (!cardIds) {
        storage.removeItem(key);
        return;
      }
      let ids;
      try {
        ids = JSON.parse(storage.getItem(key));
      } catch (e) {
        ids = null;
      }
      if (!Array.isArray(ids)) {
        storage.removeItem(key);
        return;
      }
      const alive = ids.filter((id) => cardIds.has(id));
      if (alive.length !== ids.length) storage.setItem(key, JSON.stringify(alive));
    });
  } catch (e) {
    // localStorage недоступен (приватный режим и т.п.) — чистить нечего
  }
}
