// Подписи видов колод: в списках колод и в предпросмотре редактора
export const DECK_TYPE_LABELS = {
  basic: 'Обычные карточки',
  stress: 'Ударения',
  vowel: 'Пропущенные гласные',
  build: 'Сборка формул',
};

// «Сборка формул», «Обычные карточки + таблица»
export function deckKindLabel(deck) {
  const base = DECK_TYPE_LABELS[deck.type] || DECK_TYPE_LABELS.basic;
  return deck.table || deck.hasTable ? `${base} + таблица` : base;
}
