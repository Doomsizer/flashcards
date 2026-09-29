// Как показать карточку строкой в списке (ошибки, избранное):
// для ударений и пропущенных гласных — правильное слово и пояснение, для обычных — вопрос и ответ
export function cardText(card, kind) {
  if (kind === 'stress' || kind === 'vowel') return { main: card.back, sub: card.hint };
  return { main: card.front, sub: card.back };
}
