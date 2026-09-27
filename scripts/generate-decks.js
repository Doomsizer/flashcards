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
    
    // Set для отслеживания дубликатов ID внутри одной колоды
    let usedCardIds = new Set(); 

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
        decks.push(currentDeck);
        currentDeck = null;
        tempCards = [];
    };

    lines.forEach(line => {
        if (line.startsWith('# Deck:')) {
            finalizeDeck();
            const title = line.replace('# Deck:', '').trim();
            currentDeck = { 
                id: generateDeckId(title), 
                title, 
                subject: '', 
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

        if (line.includes('->') && currentDeck) {
            const [front, back] = line.split('->').map(s => s.trim());
            if (front && back) {
                // 🛡️ ГЕНЕРАЦИЯ СТАБИЛЬНОГО ID
                const baseCardId = `${currentDeck.id}--${slugify(front)}`;
                let finalCardId = baseCardId;
                let counter = 1;
                
                // Если такой ID уже есть в этой колоде, добавляем цифру в конец
                while (usedCardIds.has(finalCardId)) {
                    finalCardId = `${baseCardId}-${counter}`;
                    counter++;
                }
                usedCardIds.add(finalCardId);

                tempCards.push({ 
                    id: finalCardId, 
                    front, 
                    back 
                });
            }
        }
    });
    
    finalizeDeck();
});

const jsContent = `// ⚠️ Этот файл сгенерирован автоматически из папки /txt.
// НЕ РЕДАКТИРУЙТЕ ЕГО ВРУЧНУЮ! 
// ID карточек генерируются на основе текста, чтобы сохраняться при обновлении.
const decks = ${JSON.stringify(decks, null, 2)};

export default decks;
`;

fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
console.log(`✅ Успешно сгенерировано ${decks.length} колод в ${OUTPUT_FILE}`);