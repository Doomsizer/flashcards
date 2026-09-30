import React from 'react';
import './TableParts.css';

// Общие части таблицы колоды: для режима «Таблица» и для мини-таблицы в редакторе (editor/TablePreview)

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
