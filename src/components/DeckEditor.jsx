import React, { useMemo, useRef, useState } from 'react';
import BackButton from './BackButton';
import DeckPreview from './DeckPreview';
import { CardFacesPreview, TokenChips } from './CardPreview';
import { TablePreview } from './TableParts';
import { analyzeUserDeckSource } from '../deckFormat/userDeck';
import { tokenizeFormula } from '../deckFormat/parseDeck.mjs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Схема формата: какая строка за что отвечает
const FORMAT_LINES = [
  { code: '# Deck: Название', text: 'название колоды — первой строкой' },
  { code: 'Subject: Предмет', text: 'предмет, можно не писать' },
  { code: 'вопрос -> ответ', text: 'карточка — по одной на строку' },
  { code: 'Type: build', text: 'тип карточек: stress — ударения, vowel — пропущенные гласные, build — сборка формул' },
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
            чтобы кусок стал одной частью, возьми его в квадратные скобки: <code>[2H₂O]</code>
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

// Экран добавления / редактирования своей колоды: памятка, текст в формате txt, живой предпросмотр
export default function DeckEditor({ initialSource = '', isEdit = false, onSave, onCancel }) {
  const [source, setSource] = useState(initialSource);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [pendingText, setPendingText] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInput = useRef(null);

  const { deck, warnings, error } = useMemo(() => analyzeUserDeckSource(source), [source]);
  const dirty = source !== initialSource;
  const example = EXAMPLES[exampleIndex];

  // Замена текста (пример или файл): если в поле уже что-то есть — сначала спрашиваем
  function replaceText(text) {
    setMessage(null);
    if (!source.trim() || source === text) setSource(text);
    else setPendingText(text);
  }

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setMessage('Файл слишком большой: колода должна быть меньше 5 МБ.');
      return;
    }
    try {
      replaceText(await file.text());
    } catch (err) {
      setMessage('Не получилось прочитать файл.');
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await onSave(source);
    } catch (err) {
      setSaving(false);
      setMessage('Не получилось сохранить: хранилище браузера недоступно или переполнено.');
    }
  }

  function handleLeave() {
    if (dirty) setConfirmLeave(true);
    else onCancel();
  }

  return (
    <div className="screen screen-top">
      <BackButton onClick={handleLeave}>{isEdit ? 'К колоде' : 'К словарям'}</BackButton>
      <h1>{isEdit ? 'Редактирование колоды' : 'Новая колода'}</h1>
      <p className="subtitle">
        Вставь текст колоды — ниже сразу появится предпросмотр. Колода сохранится только в этом браузере: чтобы
        перенести ее, скачай .txt и загрузи на другом устройстве.
      </p>

      <details className="guide" open={!isEdit}>
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
          <button className="btn btn-ghost guide-insert" onClick={() => replaceText(example.text)}>
            Вставить этот пример в поле
          </button>
        </div>
      </details>

      <div className="editor">
        <div className="editor-toolbar">
          <span className="editor-label">Текст колоды</span>
          <button className="link-btn" onClick={() => fileInput.current && fileInput.current.click()}>
            Загрузить .txt
          </button>
          <input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={handleFile} />
        </div>

        {pendingText !== null && (
          <div className="confirm-bar">
            <p>Заменить текущий текст?</p>
            <button
              className="link-btn link-btn-danger"
              onClick={() => {
                setSource(pendingText);
                setPendingText(null);
              }}
            >
              Заменить
            </button>
            <button className="link-btn" onClick={() => setPendingText(null)}>
              Отмена
            </button>
          </div>
        )}

        <textarea
          className="editor-textarea"
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setMessage(null);
          }}
          placeholder={`# Deck: Название колоды
Subject: Предмет

вопрос -> ответ`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={12}
        />
      </div>

      <DeckPreview deck={deck} warnings={warnings} error={error} isEmpty={!source.trim()} />

      {message && <p className="notice notice-error">{message}</p>}

      {confirmLeave ? (
        <div className="confirm-bar">
          <p>Выйти без сохранения? Изменения пропадут.</p>
          <button className="link-btn link-btn-danger" onClick={onCancel}>
            Выйти
          </button>
          <button className="link-btn" onClick={() => setConfirmLeave(false)}>
            Остаться
          </button>
        </div>
      ) : (
        <div className="editor-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={Boolean(error) || saving || (isEdit && !dirty)}>
            {saving ? 'Сохраняю...' : isEdit ? 'Сохранить изменения' : 'Сохранить колоду'}
          </button>
          <button className="btn btn-ghost" onClick={handleLeave} disabled={saving}>
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
