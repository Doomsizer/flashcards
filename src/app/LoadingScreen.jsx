import React from 'react';

// Заглушка на время подгрузки экрана или колоды
export default function LoadingScreen() {
  return (
    <div className="screen">
      <span className="spinner" role="status" aria-label="Загрузка" />
    </div>
  );
}
