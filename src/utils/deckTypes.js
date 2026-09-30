// Подписи видов колод: в списках колод и в предпросмотре редактора
export const DECK_TYPE_LABELS = {
  basic: 'Обычные карточки',
  stress: 'Ударения',
  vowel: 'Пропущенные гласные',
  build: 'Сборка формул',
  choice: 'Выбор ответа',
};

// «Сборка формул», «Обычные карточки + таблица»
export function deckKindLabel(deck) {
  const base = DECK_TYPE_LABELS[deck.type] || DECK_TYPE_LABELS.basic;
  return deck.table || deck.hasTable ? `${base} + таблица` : base;
}

// Вид карточек в свободном режиме и прогоне избранного. Сборка формул и выбор из вариантов —
// только в «Обучении», а в свободном режиме обычные карточки с переворотом, чтобы быстро повторять.
export function freeModeKind(type) {
  if (type === 'build') return 'formula';
  if (type === 'choice') return 'choice-flip';
  return type;
}
