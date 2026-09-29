// Русское склонение по числу: plural(5, ['карточка', 'карточки', 'карточек']) -> '5 карточек'
export function plural(n, [one, few, many]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = many;
  if (mod10 === 1 && mod100 !== 11) word = one;
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = few;
  return `${n} ${word}`;
}

export function cardCountLabel(n) {
  return plural(n, ['карточка', 'карточки', 'карточек']);
}

export function deckCountLabel(n) {
  return plural(n, ['колода', 'колоды', 'колод']);
}
