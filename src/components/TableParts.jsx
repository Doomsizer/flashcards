import React from 'react';

// «-» в ответе таблицы означает «значение не существует» (например, tg 90°)
export const NOT_EXISTS = '-';

export function displayValue(v) {
  return v === NOT_EXISTS ? '—' : v;
}

// Заголовок столбца «30° (π/6)» рисуется в две строки: градусы сверху, пояснение снизу
export function ColLabel({ label }) {
  const m = label.match(/^(.*?)\s*\((.+)\)$/);
  if (!m) return label;
  return (
    <>
      <span className="table-head-main">{m[1]}</span>
      <span className="table-head-sub">{m[2]}</span>
    </>
  );
}

// Мини-таблица для предпросмотра: как в режиме «Таблица», часть клеток пустая («?»).
// Большие таблицы обрезаются до первых строк и столбцов.
export function TablePreview({ table, maxRows = 5, maxCols = 6 }) {
  const rows = table.rows.slice(0, maxRows);
  const cols = table.cols.slice(0, maxCols);
  const cut = table.rows.length > rows.length || table.cols.length > cols.length;

  return (
    <div className="table-preview">
      <div className="table-wrap">
        <table className="learn-table">
          <thead>
            <tr>
              <th className="table-corner" />
              {cols.map((col) => (
                <th key={col} className="table-head">
                  <ColLabel label={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row}>
                <th className="table-head table-head-row">{row}</th>
                {cols.map((col, c) => {
                  const value = table.cells[r][c];
                  if (value === null) return <td key={col} className="table-cell table-cell-none" />;
                  // Каждая третья клетка — пустая: так выглядят пропуски в режиме «Таблица»
                  const hole = (r + c) % 3 === 1;
                  return (
                    <td key={col} className={`table-cell ${hole ? 'table-cell-hole' : ''}`}>
                      {hole ? '?' : displayValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cut && <p className="preview-note">Показано начало таблицы — первые строки и столбцы.</p>}
    </div>
  );
}
