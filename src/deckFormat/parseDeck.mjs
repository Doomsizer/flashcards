// Разбор текстового формата колод. Общий для сборки (scripts/generate-decks.mjs)
// и для сайта (пользовательские колоды), поэтому без зависимостей и без Node API.
//
// Формат:
//   # Deck: Название        — начало колоды
//   Subject: Предмет         — необязательно
//   Type: stress | vowel | build | choice — тип карточек, по умолчанию обычные
//   Mode: table              — дополнительный режим «Таблица» (для обычных карточек)
//   // комментарий
//   вопрос -> ответ          — обычная карточка
//   звонИт (пояснение)       — ударение (Type: stress)
//   к(?)т -> кот             — пропущенная гласная (Type: vowel)
//   Площадь круга -> S = pi*r^2 — сборка формулы из частей (Type: build)
//   кто (Кто пришел?) -> Вопросительное — выбор ответа из вариантов (Type: choice):
//                                варианты — другие ответы этой же колоды
//
// ID колод и карточек строятся из текста, чтобы избранное переживало перегенерацию.
// Менять правила построения ID нельзя — сбросится избранное у всех пользователей.

export const CARDS_PER_SECTION = 10;
export const DECK_TYPES = ['basic', 'stress', 'vowel', 'build', 'choice'];

// Буква е с точками задана кодом символа, чтобы не писать ее в коде
const YO = String.fromCharCode(0x451);
const BOM = 0xfeff;

export const VOWELS = 'аеиоуыэюя' + YO;

export function isVowel(ch) {
  return VOWELS.includes(ch.toLowerCase());
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '');
}

function generateDeckId(title) {
  return `deck-${slugify(title)}`;
}

// Ударная гласная записана заглавной (звонИт). Если заглавных гласных нет,
// ударной считается буква е с точками (она всегда ударная).
function parseStressWord(raw) {
  const upper = [...raw]
    .map((ch, i) => (isVowel(ch) && ch !== ch.toLowerCase() ? i : -1))
    .filter((i) => i !== -1);
  const word = raw.toLowerCase();

  if (upper.length === 1) return { word, stressIndex: upper[0] };
  if (upper.length === 0) {
    const yoIndex = [...word].indexOf(YO);
    if (yoIndex !== -1) return { word, stressIndex: yoIndex };
  }
  return null;
}

// --- Формулы для сборки (Type: build) ---
// Формула делится на части-кнопки: S = 2*pi*r^2 -> [S] [=] [2] [pi] [r] [^2]
//   * и пробелы только разделяют части (умножение без знака);
//   ^x, ^(…) — степень, _x, _(…) — индекс, отдельной частью;
//   латинские буквы подряд — отдельные части (mgh -> m g h), кроме имен функций и греческих букв;
//   [кусок] — принудительно одна часть (например, [2H₂O]).

export const GREEK_LETTERS = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', eta: 'η', theta: 'θ',
  lambda: 'λ', mu: 'μ', nu: 'ν', pi: 'π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ',
  omega: 'ω', Omega: 'Ω',
};

export const FUNCTION_NAMES = [
  'sin', 'cos', 'tg', 'ctg', 'tan', 'cot', 'arcsin', 'arccos', 'arctg', 'arcctg', 'arctan',
  'log', 'ln', 'lg', 'lim', 'max', 'min', 'exp', 'sqrt', 'const',
];

// Длинные имена проверяются первыми: arcctg раньше arctg
const LATIN_NAMES = [...FUNCTION_NAMES, ...Object.keys(GREEK_LETTERS)].sort((a, b) => b.length - a.length);
const FORMULA_OPERATORS = ['<=', '>=', '!=', '=', '+', '-', '−', '±', '<', '>', '≤', '≥', '≈', '≠', '·', '×', '/', ':', '(', ')', '√', ',', '→', '!'];
// Классы символов проверяются по кодам, а не через \p{…} в регулярках:
// Babel разворачивает \p{…} для старых браузеров в огромные списки символов (+15 КБ к бандлу)
const DIGIT = /[0-9]/;
const LATIN = /[A-Za-z]/;
const SPACE = /\s/;
const inCodeRange = (ch, from, to) => ch.charCodeAt(0) >= from && ch.charCodeAt(0) <= to;
const CYRILLIC = { test: (ch) => inCodeRange(ch, 0x0400, 0x04ff) };
const GREEK = { test: (ch) => inCodeRange(ch, 0x0370, 0x03ff) };
const LETTER_OR_DIGIT = { test: (ch) => DIGIT.test(ch) || LATIN.test(ch) || CYRILLIC.test(ch) || GREEK.test(ch) };

// Содержимое степени или индекса, начиная с позиции start (сразу после ^ или _):
// «(n+1)» целиком (без внешних скобок) или слитный кусок букв и цифр, можно с минусом: ^-1, _max.
export function readScript(text, start) {
  let i = start;
  while (text[i] === ' ') i++;
  if (text[i] === '(') {
    let depth = 0;
    for (let j = i; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')' && --depth === 0) return { value: text.slice(i + 1, j), end: j + 1 };
    }
    return { value: text.slice(i + 1), end: text.length };
  }
  const from = i;
  if (text[i] === '-' || text[i] === '−') i++;
  while (i < text.length && LETTER_OR_DIGIT.test(text[i])) i++;
  if (i === from) i = Math.min(from + 1, text.length);
  return { value: text.slice(from, i), end: i };
}

function splitLatin(run) {
  const parts = [];
  let i = 0;
  while (i < run.length) {
    const name = LATIN_NAMES.find((n) => run.startsWith(n, i));
    parts.push(name || run[i]);
    i += name ? name.length : 1;
  }
  return parts;
}

export function tokenizeFormula(formula) {
  const tokens = [];
  let i = 0;
  while (i < formula.length) {
    const ch = formula[i];
    if (SPACE.test(ch) || ch === '*') {
      i++;
    } else if (ch === '[') {
      const close = formula.indexOf(']', i + 1);
      const end = close === -1 ? formula.length : close;
      const group = formula.slice(i + 1, end).trim();
      if (group) tokens.push(group);
      i = end + 1;
    } else if ((ch === '^' || ch === '_') && i + 1 < formula.length) {
      const { end } = readScript(formula, i + 1);
      // Пробелы убираются только между ^ и степенью: внутри скобок они разделяют части (^(log_a b))
      tokens.push(formula.slice(i, end).replace(/^([\^_])\s+/, '$1'));
      i = end;
    } else {
      const op = FORMULA_OPERATORS.find((o) => formula.startsWith(o, i));
      let j = i + 1;
      if (op) {
        j = i + op.length;
      } else if (DIGIT.test(ch)) {
        // Число: 12, 9.8, 3,14, можно с ° или %
        while (j < formula.length && (DIGIT.test(formula[j]) || (/[.,]/.test(formula[j]) && DIGIT.test(formula[j + 1] || '')))) j++;
        while (j < formula.length && /[°%]/.test(formula[j])) j++;
      } else if (LATIN.test(ch)) {
        while (j < formula.length && LATIN.test(formula[j])) j++;
        tokens.push(...splitLatin(formula.slice(i, j)));
        i = j;
        continue;
      } else if (CYRILLIC.test(ch)) {
        while (j < formula.length && CYRILLIC.test(formula[j])) j++;
      }
      // Иначе — один символ: греческая буква, прочий знак
      tokens.push(formula.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

// «Название (пояснение)» -> { text: 'Название', hint: 'пояснение' }.
// Берутся последние скобки в конце строки, скобки внутри пояснения допустимы.
function splitTrailingHint(text) {
  if (!text.endsWith(')')) return { text, hint: null };
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === ')') depth++;
    else if (text[i] === '(' && --depth === 0) {
      const title = text.slice(0, i).trim();
      const hint = text.slice(i + 1, -1).trim();
      return title && hint ? { text: title, hint } : { text, hint: null };
    }
  }
  return { text, hint: null };
}

// Делит строку по первой стрелке: «вопрос -> ответ»
function splitArrow(line) {
  const at = line.indexOf('->');
  if (at === -1) return null;
  return [line.slice(0, at).trim(), line.slice(at + 2).trim()];
}

// Заголовочная строка «Ключ: значение» (регистр ключа не важен)
function matchHeader(line, key) {
  const m = line.match(new RegExp(`^${key}\\s*:(.*)$`, 'i'));
  return m ? m[1].trim() : null;
}

// Разбирает текст колод.
// options.deckId — фиксированный ID первой колоды (для пользовательских колод: ID не зависит
//   от названия, поэтому переименование не сбрасывает избранное).
// options.defaultTitle — название, если карточки идут без строки «# Deck:»; без него такие
//   строки пропускаются.
// Возвращает { decks, warnings }, warnings — [{ line, message }], line — номер строки с 1.
export function parseDeckText(text, options = {}) {
  const { deckId, defaultTitle } = options;
  const source = text.charCodeAt(0) === BOM ? text.slice(1) : text;

  const decks = [];
  const warnings = [];
  let deck = null;
  let cards = [];
  let cardLines = new Map();
  let usedIds = new Set();
  let seenCards = new Set();
  let tableMode = false;
  let lineNo = 0;

  function warn(message, line = lineNo) {
    warnings.push({ line, message });
  }

  // Уточнение в скобках не влияет на ID: «sin 30° (π/6)» -> тот же ID, что у «sin 30°».
  // При совпадении внутри колоды добавляется цифра в конец.
  function makeCardId(text) {
    const base = `${deck.id}--${slugify(text.replace(/\s*\([^)]*\)/g, ''))}`;
    let id = base;
    for (let n = 1; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  }

  // key — карточки с одинаковым ключом считаются повтором (у ударений регистр важен: Отзыв ≠ отзЫв)
  function addCard(card, key) {
    if (seenCards.has(key)) {
      warn(`Повтор карточки «${card.front}» — пропущена.`);
      return;
    }
    seenCards.add(key);
    card.id = makeCardId(card.idSource);
    delete card.idSource;
    cards.push(card);
    cardLines.set(card.id, lineNo);
  }

  function finishDeck() {
    if (!deck) return;
    if (cards.length === 0) {
      warn(`В колоде «${deck.title}» нет ни одной карточки — она пропущена.`, deck.line);
    } else {
      for (let i = 0; i < cards.length; i += CARDS_PER_SECTION) {
        const n = i / CARDS_PER_SECTION + 1;
        deck.sections.push({
          id: `${deck.id}-sec-${n}`,
          title: `Раздел ${n}`,
          cards: cards.slice(i, i + CARDS_PER_SECTION),
        });
      }
      if (tableMode) deck.table = buildTable();
      if (deck.type === 'choice') {
        // Все разные ответы колоды: из них берутся неверные варианты
        deck.answerPool = [...new Set(cards.map((card) => card.back))];
        if (deck.answerPool.length < 2) {
          warn(`В колоде «${deck.title}» все ответы одинаковые — не из чего составить варианты.`, deck.line);
        }
      }
      delete deck.line;
      decks.push(deck);
    }
    deck = null;
  }

  function startDeck(title) {
    finishDeck();
    deck = {
      id: deckId && decks.length === 0 ? deckId : generateDeckId(title),
      title,
      subject: '',
      type: 'basic',
      sections: [],
      line: lineNo,
    };
    cards = [];
    cardLines = new Map();
    usedIds = new Set();
    seenCards = new Set();
    tableMode = false;
  }

  // Таблица для режима «Таблица»: вопрос делится по первому пробелу на строку и столбец,
  // «sin 30°» -> строка sin, столбец 30°
  function buildTable() {
    const rows = [];
    const cols = [];
    const values = new Map();
    cards.forEach((card) => {
      const match = card.front.match(/^(\S+)\s+(.+)$/);
      if (!match) {
        warn(`«${card.front}» не попадет в таблицу: нужно «строка столбец», например «sin 30°».`, cardLines.get(card.id));
        return;
      }
      const [, row, col] = match;
      if (!rows.includes(row)) rows.push(row);
      if (!cols.includes(col)) cols.push(col);
      values.set(`${row}|${col}`, card.back);
    });
    const cells = rows.map((row) => cols.map((col) => values.get(`${row}|${col}`) ?? null));
    return { rows, cols, cells };
  }

  function parseStressLine(line) {
    // «слово (пояснение)» — пояснение показывается под словом, например для омографов
    const [, rawWord, hint] = line.match(/^(.*?)\s*(?:\((.+)\))?$/);
    const parsed = parseStressWord(rawWord);
    if (!parsed) {
      warn(`«${line}» пропущено: нужна ровно одна заглавная ударная гласная, например «звонИт».`);
      return;
    }
    addCard(
      { idSource: parsed.word, front: parsed.word, back: rawWord, stressIndex: parsed.stressIndex, ...(hint ? { hint } : {}) },
      `${rawWord}|${hint || ''}`
    );
  }

  function parseVowelLine(line) {
    // «к(?)мпания (друзей) -> компания»: (?) — пропуск, в скобках — необязательное пояснение
    const parts = splitArrow(line);
    if (!parts || !parts[0] || !parts[1]) {
      warn(`«${line}» пропущено: нужно «сл(?)во -> слово».`);
      return;
    }
    const [rawFront, back] = parts;
    const [, front, hint] = rawFront.match(/^(.*?)\s*(?:\((?!\?\))([^)]+)\))?$/);
    const blankIndex = front.indexOf('(?)');
    const letter = back[blankIndex];
    if (blankIndex === -1 || !letter || front.replace('(?)', letter).toLowerCase() !== back.toLowerCase()) {
      warn(`«${line}» пропущено: слово с (?) не сходится с ответом.`);
      return;
    }
    if (!isVowel(letter)) {
      warn(`«${line}» пропущено: на месте (?) должна быть гласная, а там «${letter}».`);
      return;
    }
    addCard({ idSource: front, front, back, blankIndex, ...(hint ? { hint } : {}) }, `${back}|${hint || ''}`.toLowerCase());
  }

  function parseBuildLine(line) {
    // «Площадь трапеции (a, b — основания, h — высота) -> S = ½(a + b)h»
    const parts = splitArrow(line);
    if (!parts || !parts[0] || !parts[1]) {
      warn(`«${line}» пропущено: нужно «название -> формула».`);
      return;
    }
    const { text: front, hint } = splitTrailingHint(parts[0]);
    const back = parts[1];
    const tokens = tokenizeFormula(back);
    if (tokens.length < 2) {
      warn(`«${line}» пропущено: формула должна разбиться хотя бы на две части.`);
      return;
    }
    addCard(
      { idSource: front, front, back, tokens, ...(hint ? { hint } : {}) },
      `${front}->${back}`.toLowerCase()
    );
  }

  function parseChoiceLine(line) {
    // «кто (Кто пришел?) -> Вопросительное»: в скобках — пример или пояснение, показывается под вопросом
    const parts = splitArrow(line);
    if (!parts || !parts[0] || !parts[1]) {
      warn(`«${line}» пропущено: нужно «вопрос -> ответ».`);
      return;
    }
    const { text: front, hint } = splitTrailingHint(parts[0]);
    const back = parts[1];
    addCard({ idSource: front, front, back, ...(hint ? { hint } : {}) }, `${front}|${hint || ''}->${back}`.toLowerCase());
  }

  function parseBasicLine(line) {
    const parts = splitArrow(line);
    if (!parts || !parts[0] || !parts[1]) {
      warn(`«${line}» пропущено: нужно «вопрос -> ответ».`);
      return;
    }
    const [front, back] = parts;
    addCard({ idSource: front, front, back }, `${front}->${back}`.toLowerCase());
  }

  const lines = source.split('\n');
  lines.forEach((rawLine, index) => {
    lineNo = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) return;

    const title = matchHeader(line, '#\\s*deck');
    if (title !== null) {
      startDeck(title || defaultTitle || 'Без названия');
      return;
    }

    // Строки до первого «# Deck:» относятся к колоде по умолчанию, если она задана
    if (!deck) {
      if (!defaultTitle) return;
      startDeck(defaultTitle);
    }

    const subject = matchHeader(line, 'subject');
    if (subject !== null) {
      deck.subject = subject;
      return;
    }

    const type = matchHeader(line, 'type');
    if (type !== null) {
      const value = type.toLowerCase();
      if (DECK_TYPES.includes(value)) deck.type = value;
      else warn(`Неизвестный тип «${type}»: бывают stress, vowel, build и choice. Колода будет с обычными карточками.`);
      return;
    }

    const mode = matchHeader(line, 'mode');
    if (mode !== null) {
      if (mode.toLowerCase() === 'table') tableMode = true;
      else warn(`Неизвестный режим «${mode}»: есть только table.`);
      return;
    }

    if (deck.type === 'stress') parseStressLine(line);
    else if (deck.type === 'vowel') parseVowelLine(line);
    else if (deck.type === 'build') parseBuildLine(line);
    else if (deck.type === 'choice') parseChoiceLine(line);
    else parseBasicLine(line);
  });
  lineNo = lines.length;
  finishDeck();

  return { decks, warnings };
}
