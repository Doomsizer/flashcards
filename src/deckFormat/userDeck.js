import { parseDeckText } from './parseDeck.mjs';

export const DEFAULT_USER_DECK_TITLE = 'Моя колода';

// ID пользовательской колоды не зависит от названия: переименование не сбрасывает избранное,
// а префикс user- не пересекается с ID встроенных колод (deck-...)
export function newUserDeckId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `user-${Date.now().toString(36)}-${random}`;
}

// Проверка текста колоды для редактора. Возвращает { deck, warnings, error }:
// error — почему колоду нельзя сохранить (нет карточек, несколько колод в одном тексте)
export function analyzeUserDeckSource(source, deckId = 'user-preview') {
  const { decks, warnings } = parseDeckText(source, { deckId, defaultTitle: DEFAULT_USER_DECK_TITLE });
  let error = null;
  if (decks.length === 0) error = 'Пока не найдено ни одной карточки.';
  else if (decks.length > 1) error = `В тексте ${decks.length} колоды (несколько строк «# Deck:»). Добавляй их по одной.`;
  return { deck: decks[0] || null, warnings, error };
}

// Колода из записи базы; null, если текст больше не разбирается
export function deckFromRecord(record) {
  const { deck, error } = analyzeUserDeckSource(record.source, record.id);
  if (error) return null;
  return {
    ...deck,
    isUser: true,
    source: record.source,
    createdAt: record.createdAt,
    cardCount: countCards(deck),
  };
}

export function countCards(deck) {
  return deck.sections.reduce((sum, s) => sum + s.cards.length, 0);
}
