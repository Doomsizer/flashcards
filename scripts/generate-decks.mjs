// Собирает колоды из txt/*.txt в src/data/generated/:
//   deck-N.json   — полные данные колоды (грузятся лениво, отдельным файлом при выборе колоды)
//   deckIndex.js  — список колод: названия, число карточек и функции подгрузки
// Сам разбор формата — в src/deckFormat/parseDeck.mjs (он же используется на сайте).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeckText } from '../src/deckFormat/parseDeck.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TXT_DIR = path.join(ROOT, 'txt');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'generated');

console.log('🚀 [ГЕНЕРАТОР] Скрипт запущен, начинаю читать файлы...');

const files = fs.existsSync(TXT_DIR)
  ? fs.readdirSync(TXT_DIR).filter((f) => f.endsWith('.txt')).sort()
  : [];

const decks = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(TXT_DIR, file), 'utf-8');
  const { decks: parsed, warnings } = parseDeckText(text);
  warnings.forEach(({ line, message }) => console.warn(`⚠️ [${file}:${line}] ${message}`));
  decks.push(...parsed);
}

const ids = new Set();
for (const deck of decks) {
  if (ids.has(deck.id)) console.warn(`⚠️ Две колоды с одинаковым названием «${deck.title}» — у них совпадет избранное.`);
  ids.add(deck.id);
}

// Не затираем готовые данные пустыми, если исходников нет
if (decks.length === 0) {
  console.warn(`⚠️ В ${TXT_DIR} не найдено ни одной колоды — ${OUT_DIR} оставлен без изменений.`);
  process.exit(0);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const entries = decks.map((deck, i) => {
  const file = `deck-${i + 1}`;
  fs.writeFileSync(path.join(OUT_DIR, `${file}.json`), JSON.stringify(deck), 'utf-8');
  const meta = {
    id: deck.id,
    title: deck.title,
    subject: deck.subject,
    type: deck.type,
    hasTable: Boolean(deck.table),
    cardCount: deck.sections.reduce((sum, s) => sum + s.cards.length, 0),
  };
  const fields = Object.entries(meta)
    .map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`)
    .join('\n');
  return `  {
${fields}
    load: () => import(/* webpackChunkName: "${file}" */ './${file}.json').then((m) => m.default),
  },`;
});

const indexContent = `// ⚠️ Этот файл сгенерирован автоматически из папки /txt (scripts/generate-decks.mjs).
// НЕ РЕДАКТИРУЙТЕ ЕГО ВРУЧНУЮ!
// Данные колод лежат в отдельных JSON и подгружаются только при выборе колоды.
const deckIndex = [
${entries.join('\n')}
];

export default deckIndex;
`;

fs.writeFileSync(path.join(OUT_DIR, 'deckIndex.js'), indexContent, 'utf-8');
console.log(`✅ Успешно сгенерировано ${decks.length} колод в ${OUT_DIR}`);
