import React from 'react';

// Какие буквы предлагать для пропущенной гласной: правильная + та, с которой ее обычно путают
const CONFUSABLE = {
  а: 'о',
  о: 'а',
  е: 'и',
  и: 'е',
  э: 'е',
  я: 'е',
  ю: 'у',
  у: 'ю',
  ы: 'и',
};

// Варианты ответа в алфавитном порядке, чтобы положение кнопки не подсказывало ответ
export function vowelOptions(letter) {
  const lower = letter.toLowerCase();
  const pair = CONFUSABLE[lower] || (lower === 'а' ? 'о' : 'а');
  return [lower, pair].sort((a, b) => a.localeCompare(b, 'ru'));
}

function WithHint({ hint, children }) {
  return (
    <span className="stress-block">
      <span className="vowel-word">{children}</span>
      {hint && <span className="stress-hint">{hint}</span>}
    </span>
  );
}

// Лицевая сторона: слово с пустой «ячейкой» на месте пропуска
export function VowelBlank({ card }) {
  const before = card.back.slice(0, card.blankIndex);
  const after = card.back.slice(card.blankIndex + 1);
  return (
    <WithHint hint={card.hint}>
      {before}
      <span className="vowel-slot" aria-label="пропуск" />
      {after}
    </WithHint>
  );
}

// Оборот: целое слово, вставленная буква выделена; при ошибке рядом зачеркнут выбранный вариант
export function VowelAnswer({ card, choice }) {
  const before = card.back.slice(0, card.blankIndex);
  const letter = card.back[card.blankIndex];
  const after = card.back.slice(card.blankIndex + 1);
  const wrong = choice && choice !== letter.toLowerCase();
  return (
    <WithHint hint={card.hint}>
      {before}
      <span className="vowel-letter">{letter}</span>
      {after}
      {wrong && <span className="vowel-wrong-choice">{choice}</span>}
    </WithHint>
  );
}
