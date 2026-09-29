const fs = require('fs');
const path = require('path');

console.log('🚀 [ГЕНЕРАТОР] Скрипт запущен, начинаю читать файлы...');

const TXT_DIR = path.join(__dirname, '../txt');
const OUTPUT_FILE = path.join(__dirname, '../src/data/decks.js');

const CARDS_PER_SECTION = 10; 

if (!fs.existsSync(TXT_DIR)) fs.mkdirSync(TXT_DIR, { recursive: true });
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Функция для создания чистого ID из текста (slugify)
function slugify(text) {
    return text.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '');
}

// Буква е с точками задана кодом символа, чтобы не писать ее в коде
const YO = String.fromCharCode(0x451);
// Гласные для колод с ударениями
const VOWELS = 'аеиоуыэюя' + YO;

function isVowel(ch) {
    return VOWELS.includes(ch.toLowerCase());
}

// Разбор слова для колоды ударений: ударная гласная записана заглавной (звонИт).
// Если заглавных гласных нет, ударной считается буква е с точками (она всегда ударная).
// Возвращает { word, stressIndex } или null, если ударение указано некорректно.
function parseStressWord(raw) {
    const chars = [...raw];
    const upper = chars
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

// Таблица для режима «Таблица» (строка `Mode: table` в txt).
// Вопрос карточки делится по первому пробелу на строку и столбец: «sin 30°» -> sin / 30°.
function buildTable(cards, file) {
    const rows = [];
    const cols = [];
    const values = new Map();
    cards.forEach((card) => {
        const match = card.front.match(/^(\S+)\s+(.+)$/);
        if (!match) {
            console.warn(`⚠️ [${file}] «${card.front}» не попадет в таблицу: ожидается «строка столбец».`);
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

// Функция для генерации ID колоды
function generateDeckId(title) {
    return `deck-${slugify(title)}`;
}

const decks = [];
const files = fs.readdirSync(TXT_DIR).filter(f => f.endsWith('.txt'));

files.forEach(file => {
    const content = fs.readFileSync(path.join(TXT_DIR, file), 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    let currentDeck = null;
    let tempCards = [];
    let tableMode = false;
    
    // Set для отслеживания дубликатов ID внутри одной колоды
    let usedCardIds = new Set();

    // 🛡️ ГЕНЕРАЦИЯ СТАБИЛЬНОГО ID: из текста карточки,
    // при совпадении внутри колоды добавляем цифру в конец
    // Уточнение в скобках не влияет на ID: «sin 30° (π/6)» -> тот же ID, что у «sin 30°»,
    // чтобы избранное не сбрасывалось при добавлении пояснений
    const makeCardId = (text) => {
        const baseCardId = `${currentDeck.id}--${slugify(text.replace(/\s*\([^)]*\)/g, ''))}`;
        let finalCardId = baseCardId;
        let counter = 1;
        while (usedCardIds.has(finalCardId)) {
            finalCardId = `${baseCardId}-${counter}`;
            counter++;
        }
        usedCardIds.add(finalCardId);
        return finalCardId;
    };

    const finalizeDeck = () => {
        if (!currentDeck) return;
        const sections = [];
        
        for (let i = 0; i < tempCards.length; i += CARDS_PER_SECTION) {
            const chunk = tempCards.slice(i, i + CARDS_PER_SECTION);
            const sectionIndex = Math.floor(i / CARDS_PER_SECTION) + 1;
            sections.push({
                id: `${currentDeck.id}-sec-${sectionIndex}`,
                title: `Раздел ${sectionIndex}`,
                cards: chunk
            });
        }
        
        currentDeck.sections = sections;
        if (tableMode) currentDeck.table = buildTable(tempCards, file);
        decks.push(currentDeck);
        currentDeck = null;
        tempCards = [];
        tableMode = false;
    };

    lines.forEach(line => {
        // Строки-комментарии (например, заголовки частей речи) пропускаем
        if (line.startsWith('//')) return;

        if (line.startsWith('# Deck:')) {
            finalizeDeck();
            const title = line.replace('# Deck:', '').trim();
            currentDeck = { 
                id: generateDeckId(title), 
                title, 
                subject: '',
                type: 'basic',
                sections: []
            };
            tempCards = [];
            usedCardIds = new Set(); // Сбрасываем дубликаты для новой колоды
            return;
        }

        if (line.startsWith('Subject:') && currentDeck) {
            currentDeck.subject = line.replace('Subject:', '').trim();
            return;
        }

        if (line.startsWith('Mode:') && currentDeck) {
            tableMode = line.replace('Mode:', '').trim() === 'table';
            return;
        }

        if (line.startsWith('Type:') && currentDeck) {
            currentDeck.type = line.replace('Type:', '').trim();
            return;
        }

        if (!currentDeck) return;

        if (currentDeck.type === 'stress') {
            // «слово (пояснение)» — пояснение показывается под словом, например для омографов
            const [, rawWord, hint] = line.match(/^(.*?)\s*(?:\((.+)\))?$/);
            const parsed = parseStressWord(rawWord);
            if (!parsed) {
                console.warn(`⚠️ [${file}] Пропущено «${line}»: нужна ровно одна заглавная ударная гласная.`);
                return;
            }
            tempCards.push({
                id: makeCardId(parsed.word),
                front: parsed.word,
                back: rawWord,
                stressIndex: parsed.stressIndex,
                ...(hint ? { hint } : {})
            });
            return;
        }

        if (currentDeck.type === 'vowel') {
            // «к(?)мпания (друзей) -> компания»: (?) — пропуск, в скобках — необязательное пояснение
            const [rawFront, back] = line.split('->').map(s => s.trim());
            if (!rawFront || !back) return;
            const [, front, hint] = rawFront.match(/^(.*?)\s*(?:\((?!\?\))([^)]+)\))?$/);
            const blankIndex = front.indexOf('(?)');
            const letter = back[blankIndex];
            if (blankIndex === -1 || !letter || front.replace('(?)', letter).toLowerCase() !== back.toLowerCase()) {
                console.warn(`⚠️ [${file}] Пропущено «${line}»: вопрос с (?) не сходится с ответом.`);
                return;
            }
            tempCards.push({
                id: makeCardId(front),
                front,
                back,
                blankIndex,
                ...(hint ? { hint } : {})
            });
            return;
        }

        if (line.includes('->')) {
            const [front, back] = line.split('->').map(s => s.trim());
            if (front && back) {
                tempCards.push({
                    id: makeCardId(front),
                    front,
                    back
                });
            }
        }
    });
    
    finalizeDeck();
});

// Не затираем существующий decks.js пустым массивом, если исходников нет
if (decks.length === 0) {
    console.warn(`⚠️ В ${TXT_DIR} не найдено ни одной колоды — ${OUTPUT_FILE} оставлен без изменений.`);
    process.exit(0);
}

const jsContent = `// ⚠️ Этот файл сгенерирован автоматически из папки /txt.
// НЕ РЕДАКТИРУЙТЕ ЕГО ВРУЧНУЮ! 
// ID карточек генерируются на основе текста, чтобы сохраняться при обновлении.
const decks = ${JSON.stringify(decks, null, 2)};

export default decks;
`;

fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
console.log(`✅ Успешно сгенерировано ${decks.length} колод в ${OUTPUT_FILE}`);