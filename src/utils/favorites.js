const PREFIX = 'favorites:';

// Ключ localStorage с избранным колоды: favorites:<deckId> -> [id, id, ...]
export function favoritesKey(deckId) {
  return `${PREFIX}${deckId}`;
}

function readIds(storage, key) {
  try {
    const ids = JSON.parse(storage.getItem(key));
    return Array.isArray(ids) ? ids : null;
  } catch (e) {
    return null;
  }
}

// При открытии колоды: убирает из ее избранного ID карточек, которых в колоде больше нет.
// Вызывается до того, как колода попадет в интерфейс, чтобы счетчик сразу был верным.
export function pruneDeckFavorites(deck) {
  try {
    const storage = window.localStorage;
    const key = favoritesKey(deck.id);
    if (storage.getItem(key) === null) return;
    const ids = readIds(storage, key);
    if (!ids) {
      storage.removeItem(key);
      return;
    }
    const cardIds = new Set(deck.sections.flatMap((s) => s.cards.map((c) => c.id)));
    const alive = ids.filter((id) => cardIds.has(id));
    if (alive.length !== ids.length) storage.setItem(key, JSON.stringify(alive));
  } catch (e) {
    // localStorage недоступен (приватный режим и т.п.) — чистить нечего
  }
}

// Удаляет избранное колод, которых больше нет (переименованные встроенные, удаленные свои).
// knownDeckIds — ID всех существующих колод, включая пользовательские.
export function removeOrphanFavorites(knownDeckIds) {
  try {
    const storage = window.localStorage;
    const known = new Set(knownDeckIds.map(favoritesKey));
    const orphans = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(PREFIX) && !known.has(key)) orphans.push(key);
    }
    orphans.forEach((key) => storage.removeItem(key));
  } catch (e) {
    // localStorage недоступен — чистить нечего
  }
}

export function removeDeckFavorites(deckId) {
  try {
    window.localStorage.removeItem(favoritesKey(deckId));
  } catch (e) {
    // localStorage недоступен — удалять нечего
  }
}
