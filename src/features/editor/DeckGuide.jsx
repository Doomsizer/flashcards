import React, { useState } from 'react';
import CardFacesPreview, { TokenChips } from './CardFacesPreview';
import TablePreview from './TablePreview';
import { analyzeUserDeckSource } from '../../deckFormat/userDeck';
import { tokenizeFormula } from '../../deckFormat/parseDeck.mjs';
import './DeckGuide.css';

// Схема формата: какая строка за что отвечает
const FORMAT_LINES = [
  { code: '# Deck: Название', text: 'название колоды — первой строкой' },
  { code: 'Subject: Предмет', text: 'предмет, можно не писать' },
  { code: 'вопрос -> ответ', text: 'карточка — по одной на строку' },
  { code: 'Type: build', text: 'тип карточек: stress — ударения, vowel — пропущенные гласные, build — сборка формул, choice — выбор ответа из вариантов' },
  { code: 'Mode: table', text: 'добавить колоде режим «Таблица»' },
  { code: '(пояснение)', text: 'текст в скобках в конце строки — подсказка к карточке' },
  { code: '// комментарий', text: 'строка для себя, в колоду не попадет' },
];

// Виды колод с примерами. Пример разбирается тем же разборщиком, что и текст из поля,
// поэтому мини-карточка рядом с ним — ровно то, что получится.
const EXAMPLES = [
  {
    tab: 'Обычные',
    description: (
      <>
        <p>
          Каждая строка — одна карточка: <code>вопрос -&gt; ответ</code>.
        </p>
        <p>Нажатие на карточку переворачивает ее и показывает ответ, дальше — «Знал» или «Не знал».</p>
      </>
    ),
    text: `# Deck: Столицы
Subject: География

Франция -> Париж
Япония -> Токио
Канада -> Оттава`,
  },
  {
    tab: 'Ударения',
    description: (
      <>
        <p>
          Добавь строку <code>Type: stress</code> и пиши по одному слову на строку, ударную гласную — заглавной
          буквой.
        </p>
        <p>
          В карточке <strong>все гласные слова становятся кнопками</strong> — нужно нажать на ту, что под ударением.
          Карточка перевернется и покажет, верно ли.
        </p>
      </>
    ),
    text: `# Deck: Мои ударения
Subject: Русский язык
Type: stress

звонИт
тОрты
Отзыв (о книге)`,
  },
  {
    tab: 'Гласные',
    description: (
      <>
        <p>
          Добавь строку <code>Type: vowel</code>. Слева от стрелки — слово с <code>(?)</code> на месте пропущенной
          гласной, справа — слово целиком.
        </p>
        <p>Под карточкой появятся две буквы на выбор, например «е» и «и».</p>
      </>
    ),
    text: `# Deck: Словарные слова
Subject: Русский язык
Type: vowel

аб(?)туриент -> абитуриент
к(?)мпания (друзей) -> компания`,
  },
  {
    tab: 'Формулы',
    description: (
      <>
        <p>
          Добавь строку <code>Type: build</code>. Слева от стрелки — название, справа — формула. Формула сама
          разобьется на кнопки-части: в «Обучении» из них нужно собрать формулу и нажать «Проверить», а в свободном
          режиме будут обычные карточки «название → формула».
        </p>
        <p>
          Порядок нестрогий: множители и слагаемые можно ставить в любом порядке, стороны равенства — менять местами.
        </p>
        <p>
          В скобках после названия можно пояснить, что означают буквы, — пояснение появится под названием.
        </p>
        <p className="guide-parse">
          <code>S = 2*pi*r^2</code> → <TokenChips tokens={tokenizeFormula('S = 2*pi*r^2')} />
        </p>
        <ul className="guide-list">
          <li>
            <code>*</code> — умножение без знака: разделяет части, но в формуле не виден
          </li>
          <li>
            <code>^2</code> — степень, <code>_0</code> — нижний индекс, <code>pi</code>, <code>alpha</code> — греческие
            буквы
          </li>
          <li>
            латинские буквы подряд — отдельные части (<code>mgh</code> → m, g, h), а <code>sin</code>,{' '}
            <code>cos</code>, <code>log</code> — целиком
          </li>
          <li>
            чтобы кусок стал одной частью, возьми его в квадратные скобки: <code>[2H₂O]</code>, аргумент функции —{' '}
            <code>sin [2α]</code>
          </li>
        </ul>
      </>
    ),
    text: `# Deck: Формулы геометрии
Subject: Математика
Type: build

Площадь круга (r — радиус) -> S = pi*r^2
Длина окружности (r — радиус) -> C = 2*pi*r
Площадь трапеции (a, b — основания, h — высота) -> S = ½(a + b)h`,
  },
  {
    tab: 'Варианты',
    description: (
      <>
        <p>
          Добавь строку <code>Type: choice</code> и пиши карточки как обычно: <code>вопрос -&gt; ответ</code>. В
          «Обучении» под карточкой будут четыре варианта: верный ответ и три других ответа из этой же колоды. В
          свободном режиме — обычные карточки.
        </p>
        <p>
          Подходит, когда ответов немного и они повторяются: разряды, части речи, века, падежи. Если вопрос без
          контекста двусмысленный, добавь пример в скобках — он появится под вопросом.
        </p>
      </>
    ),
    text: `# Deck: Разряды местоимений
Subject: Русский язык
Type: choice

мы -> Личное
себя -> Возвратное
наш -> Притяжательное
кто (Кто пришел?) -> Вопросительное
кто (Я знаю, кто пришел.) -> Относительное`,
  },
  {
    tab: 'Таблица',
    description: (
      <>
        <p>
          Для того, что удобно учить таблицей: синусы по углам, квадраты чисел. Добавь строку <code>Mode: table</code>{' '}
          и пиши вопрос как «строка столбец» — первое слово станет строкой таблицы, остальное — столбцом:
        </p>
        <p className="guide-parse">
          <code>квадрат 3 -&gt; 9</code> → строка «квадрат», столбец «3», в клетке 9
        </p>
        <p>
          У колоды появится режим «Таблица»: часть клеток будет пустой, их нужно заполнять из вариантов. Обычные
          режимы тоже останутся.
        </p>
      </>
    ),
    text: `# Deck: Квадраты и кубы
Subject: Математика
Mode: table

квадрат 2 -> 4
квадрат 3 -> 9
квадрат 4 -> 16
куб 2 -> 8
куб 3 -> 27
куб 4 -> 64`,
  },
].map((example) => ({ ...example, deck: analyzeUserDeckSource(example.text).deck }));

// Памятка в редакторе: схема формата и вкладки с видами колод — пример текста и мини-карточка.
// onInsert(text) — вставить пример в поле редактора
export default function DeckGuide({ open, onInsert }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = EXAMPLES[exampleIndex];

  return (
    <details className="guide" open={open}>
      <summary>Как записать колоду</summary>

      <dl className="guide-format">
        {FORMAT_LINES.map((line) => (
          <div key={line.code} className="guide-format-row">
            <dt>
              <code>{line.code}</code>
            </dt>
            <dd>{line.text}</dd>
          </div>
        ))}
      </dl>

      <div className="guide-tabs" role="tablist" aria-label="Виды колод">
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.tab}
            role="tab"
            aria-selected={i === exampleIndex}
            className={`guide-tab ${i === exampleIndex ? 'is-active' : ''}`}
            onClick={() => setExampleIndex(i)}
          >
            {ex.tab}
          </button>
        ))}
      </div>

      <div className="guide-example" role="tabpanel">
        <div className="guide-example-desc">{example.description}</div>
        <div className="guide-example-body">
          <div className="guide-example-col">
            <span className="preview-label">Текст</span>
            <pre className="code-sample">{example.text}</pre>
          </div>
          <div className="guide-example-col">
            <span className="preview-label">Как будет выглядеть</span>
            {example.deck.table ? (
              <TablePreview table={example.deck.table} />
            ) : (
              <CardFacesPreview card={example.deck.sections[0].cards[0]} kind={example.deck.type} />
            )}
          </div>
        </div>
        <button className="btn btn-ghost guide-insert" onClick={() => onInsert(example.text)}>
          Вставить этот пример в поле
        </button>
      </div>
    </details>
  );
}
