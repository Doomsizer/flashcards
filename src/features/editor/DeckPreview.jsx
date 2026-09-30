import React, { useMemo, useState } from 'react';
import CardStage from '../card/CardStage';
import { CardRowContent } from '../card/CardRow';
import TablePreview from './TablePreview';
import { cardCountLabel } from '../../utils/plural';
import { deckKindLabel } from '../../utils/deckTypes';
// Копия карточки колоды — со стилями из списка колод
import '../catalog/DeckList.css';
import './DeckPreview.css';

const HOW_IT_WORKS = {
  choice:
    'Так выглядит «Обучение»: четыре варианта ответа, один из них верный. В свободном режиме — обычные карточки с переворотом.',
  basic: 'Нажми на карточку — она перевернется и покажет ответ.',
  stress: 'Все гласные в слове — кнопки: нажми на ту, что под ударением.',
  vowel: 'Выбери букву под карточкой.',
  build:
    'Так формула собирается в «Обучении»: нажимай на части и потом «Проверить» (порядок множителей и слагаемых не важен). В свободном режиме — обычные карточки: название → формула.',
};

const MAX_WARNINGS_SHOWN = 10;
const MAX_CARDS_LISTED = 100;

// Настоящая карточка колоды, на которую можно ответить прямо в редакторе.
// После ответа показывается следующая карточка (по кругу).
function DemoCard({ cards, kind, answerPool }) {
  const [step, setStep] = useState(0);
  const position = step % cards.length;
  const card = cards[position];
  return (
    <div className="demo-card">
      <CardStage key={`${step}-${card.id}`} card={card} kind={kind} answerPool={answerPool} onAnswer={() => setStep((s) => s + 1)} />
      <p className="preview-note">
        Карточка {position + 1} из {cards.length}
        {cards.length > 1 && ' — ответь, чтобы увидеть следующую'}
      </p>
    </div>
  );
}

// Живой предпросмотр колоды в редакторе: как она будет выглядеть, еще до сохранения
export default function DeckPreview({ deck, warnings, error, isEmpty }) {
  const cards = useMemo(() => (deck ? deck.sections.flatMap((s) => s.cards) : []), [deck]);

  return (
    <section className={`preview ${error ? 'preview-empty' : ''}`} aria-live="polite">
      <h2 className="preview-title">Предпросмотр</h2>

      {error ? (
        <p className="preview-error">
          {isEmpty ? 'Здесь появится колода: вставь текст или возьми пример из памятки выше.' : error}
        </p>
      ) : (
        <>
          <div className="preview-block">
            <span className="preview-label">В «Моих колодах», раздел «{deck.subject || 'Без предмета'}»</span>
            <div className="deck-card deck-card-user deck-card-static">
              <span className="deck-subject">
                {deckKindLabel(deck)}
                <span className="deck-badge">моя</span>
              </span>
              <span className="deck-title">{deck.title}</span>
              <span className="deck-count">{cardCountLabel(cards.length)}</span>
            </div>
          </div>

          <div className="preview-block">
            <span className="preview-label">Карточка — попробуй ответить</span>
            <p className="preview-hint">{HOW_IT_WORKS[deck.type]}</p>
            {/* Другая колода (новое название или тип) — пробная карточка начинается сначала */}
            <DemoCard key={`${deck.type}|${deck.title}`} cards={cards} kind={deck.type} answerPool={deck.answerPool} />
          </div>

          {deck.table && (
            <div className="preview-block">
              <span className="preview-label">Режим «Таблица»</span>
              <p className="preview-hint">
                Колода соберется в такую таблицу. Клетки с «?» — пропуски: их нужно заполнять из вариантов ответа.
              </p>
              <TablePreview table={deck.table} />
            </div>
          )}

          <details className="preview-block preview-all">
            <summary>Все карточки ({cards.length})</summary>
            <ul className="card-list">
              {cards.slice(0, MAX_CARDS_LISTED).map((card) => (
                <li key={card.id} className="card-row">
                  <CardRowContent card={card} kind={deck.type} />
                </li>
              ))}
            </ul>
            {cards.length > MAX_CARDS_LISTED && (
              <p className="preview-note">...и еще {cards.length - MAX_CARDS_LISTED}</p>
            )}
          </details>
        </>
      )}

      {warnings.length > 0 && (
        <div className="preview-warnings">
          <p className="preview-warnings-title">Замечания: {warnings.length}</p>
          <ul>
            {warnings.slice(0, MAX_WARNINGS_SHOWN).map((w, i) => (
              <li key={i}>
                <span className="preview-line">строка {w.line}</span>
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
          {warnings.length > MAX_WARNINGS_SHOWN && (
            <p className="preview-note">...и еще {warnings.length - MAX_WARNINGS_SHOWN}</p>
          )}
        </div>
      )}
    </section>
  );
}
