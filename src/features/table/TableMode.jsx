import React, { useMemo, useState } from 'react';
import BackButton from '../../components/BackButton';
import ArrowIcon from '../../components/ArrowIcon';
import { ColLabel, NOT_EXISTS, displayValue } from './TableParts';
import { shuffle } from '../../utils/shuffle';
import './TableMode.css';

// Число пропусков на уровнях: 1, 2, 3, дальше примерно x1.5, последний уровень — вся таблица
function buildLevels(total) {
  const levels = [];
  let n = 1;
  while (n < total) {
    levels.push(n);
    n = n < 3 ? n + 1 : Math.ceil(n * 1.5);
  }
  levels.push(total);
  return levels;
}

// Числовое значение вида «-√3/2», «1/2», «√3» — для сортировки вариантов ответа.
// Нечисловые значения (например, «-» — не существует) уходят в конец.
function numericValue(s) {
  const m = s.replace(/\s/g, '').match(/^(-)?(\d+)?(?:√(\d+))?(?:\/(\d+))?$/);
  if (!m || (!m[2] && !m[3])) return Infinity;
  const sign = m[1] ? -1 : 1;
  const coef = m[2] ? Number(m[2]) : 1;
  const root = m[3] ? Math.sqrt(Number(m[3])) : 1;
  const den = m[4] ? Number(m[4]) : 1;
  return (sign * coef * root) / den;
}

function compareValues(a, b) {
  const x = numericValue(a);
  const y = numericValue(b);
  if (x === y) return 0;
  if (!Number.isFinite(x)) return 1;
  if (!Number.isFinite(y)) return -1;
  return x - y;
}

// Режим «Таблица»: пропуски в таблице заполняются из вариантов.
// Уровень с ошибкой повторяется, ошибочные клетки гарантированно попадают в повтор.
// phase: 'playing' -> 'levelDone' -> (следующий уровень | повтор) -> 'finished'
export default function TableMode({ deck, onBack }) {
  const { rows, cols, cells } = deck.table;

  const view = useMemo(() => {
    const grid = rows.map((row, r) =>
      cols.map((col, c) => ({ key: `${r}:${c}`, value: cells[r][c], title: `${row} ${col}` }))
    );
    return { rowLabels: rows, colLabels: cols, grid };
  }, [rows, cols, cells]);

  const allCells = useMemo(() => view.grid.flat().filter((cell) => cell.value !== null), [view]);
  const cellByKey = useMemo(() => Object.fromEntries(allCells.map((cell) => [cell.key, cell])), [allCells]);
  const options = useMemo(
    () => [...new Set(allCells.map((cell) => cell.value))].sort(compareValues),
    [allCells]
  );
  const levels = useMemo(() => buildLevels(allCells.length), [allCells]);

  function makeRound(levelIndex, mustInclude = []) {
    const count = levels[levelIndex];
    const must = shuffle(mustInclude).slice(0, count);
    const rest = shuffle(allCells.map((cell) => cell.key).filter((k) => !must.includes(k)));
    const chosen = new Set([...must, ...rest.slice(0, count - must.length)]);
    // Пропуски заполняются в порядке чтения таблицы
    const blanks = allCells.map((cell) => cell.key).filter((k) => chosen.has(k));
    return { levelIndex, blanks, answers: {}, active: blanks[0], phase: 'playing' };
  }

  const [round, setRound] = useState(() => makeRound(0));

  const blankSet = new Set(round.blanks);
  const mistakes = round.blanks.filter((k) => round.answers[k] === false);
  const answeredCount = Object.keys(round.answers).length;
  const isLastLevel = round.levelIndex === levels.length - 1;

  function choose(value) {
    if (round.phase !== 'playing' || !round.active) return;
    const answers = { ...round.answers, [round.active]: value === cellByKey[round.active].value };
    const remaining = round.blanks.filter((k) => !(k in answers));
    const activePos = round.blanks.indexOf(round.active);
    const active = remaining.find((k) => round.blanks.indexOf(k) > activePos) ?? remaining[0] ?? null;

    let phase = 'playing';
    if (remaining.length === 0) {
      const clean = round.blanks.every((k) => answers[k]);
      phase = clean && isLastLevel ? 'finished' : 'levelDone';
    }
    setRound({ ...round, answers, active, phase });
  }

  function continueAfterLevel() {
    if (mistakes.length > 0) {
      setRound(makeRound(round.levelIndex, mistakes));
    } else {
      setRound(makeRound(round.levelIndex + 1));
    }
  }

  function renderCell(cell) {
    if (cell.value === null) return <td key={cell.key} className="table-cell table-cell-none" />;

    if (!blankSet.has(cell.key)) {
      return (
        <td key={cell.key} className="table-cell">
          {displayValue(cell.value)}
        </td>
      );
    }

    if (cell.key in round.answers) {
      const ok = round.answers[cell.key];
      return (
        <td key={cell.key} className={`table-cell ${ok ? 'table-cell-ok' : 'table-cell-wrong'}`}>
          {displayValue(cell.value)}
        </td>
      );
    }

    const isActive = cell.key === round.active;
    return (
      <td key={cell.key} className="table-cell table-cell-blank">
        <button
          className={`table-blank ${isActive ? 'is-active' : ''}`}
          onClick={() => setRound({ ...round, active: cell.key })}
          aria-label={`Пропуск: ${cell.title}`}
        >
          ?
        </button>
      </td>
    );
  }

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <h1>{deck.title}</h1>

      {round.phase === 'finished' ? (
        <p className="subtitle">Вся таблица заполнена</p>
      ) : (
        <>
          <p className="subtitle">
            Уровень {round.levelIndex + 1} / {levels.length}
            {isLastLevel ? ' · вся таблица' : ` · пропусков: ${round.blanks.length}`}
          </p>
          <p className="progress">
            Заполнено: {answeredCount} / {round.blanks.length}
          </p>
        </>
      )}

      <div className="table-wrap">
        <table className="learn-table">
          <thead>
            <tr>
              <th className="table-corner" />
              {view.colLabels.map((label) => (
                <th key={label} className="table-head">
                  <ColLabel label={label} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.grid.map((row, i) => (
              <tr key={view.rowLabels[i]}>
                <th className="table-head table-head-row">{view.rowLabels[i]}</th>
                {row.map(renderCell)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {options.includes(NOT_EXISTS) && <p className="table-legend">— значение не существует</p>}

      {round.phase === 'playing' && round.active && (
        <div className="table-picker">
          <p className="table-question">
            {cellByKey[round.active].title} = <span className="table-question-mark">?</span>
          </p>
          <div className="option-grid">
            {options.map((value) => (
              <button key={value} className="option-btn" onClick={() => choose(value)}>
                {displayValue(value)}
              </button>
            ))}
          </div>
        </div>
      )}

      {round.phase === 'levelDone' && (
        <div className="summary">
          {mistakes.length > 0 ? (
            <>
              <h2>Ошибок: {mistakes.length}</h2>
              <p>Правильные значения отмечены красным. Эти клетки попадутся снова — повторим уровень.</p>
              <button className="btn" onClick={continueAfterLevel}>
                Повторить уровень
              </button>
            </>
          ) : (
            <>
              <h2>Без ошибок!</h2>
              <p>Дальше пропусков станет больше.</p>
              <button className="btn" onClick={continueAfterLevel}>
                <span>Следующий уровень</span>
                <ArrowIcon direction="right" />
              </button>
            </>
          )}
        </div>
      )}

      {round.phase === 'finished' && (
        <div className="summary">
          <h2>Таблица заполнена без ошибок!</h2>
          <button className="btn" onClick={() => setRound(makeRound(0))}>
            Пройти заново
          </button>
        </div>
      )}
    </div>
  );
}
