import React, { useState } from 'react';
import FavButton from '../card/FavButton';
import { CardRowContent } from '../card/CardRow';
import './SessionSummary.css';

// Итоги прохода: статистика, список ошибок с добавлением в избранное, повтор ошибок
export default function SessionSummary({ kind, correct, mistakes, isFavorite, onToggleFavorite, onRetryMistakes, onRestart }) {
  const [showMistakes, setShowMistakes] = useState(false);
  const total = correct + mistakes.length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const notFavorite = mistakes.filter((card) => !isFavorite(card.id));

  function addAllToFavorites() {
    notFavorite.forEach((card) => onToggleFavorite(card.id));
  }

  return (
    <div className="summary">
      <h2>{mistakes.length === 0 ? 'Без единой ошибки!' : 'Готово!'}</h2>

      <div className="stats">
        <div className="stat stat-correct">
          <span className="stat-value">{correct}</span>
          <span className="stat-label">правильно</span>
        </div>
        <div className="stat stat-wrong">
          <span className="stat-value">{mistakes.length}</span>
          <span className="stat-label">ошибок</span>
        </div>
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">точность</span>
        </div>
      </div>

      <div className="stats-bar" aria-hidden="true">
        <span className="stats-bar-correct" style={{ width: `${accuracy}%` }} />
      </div>

      {mistakes.length > 0 && (
        <>
          <button className="btn btn-ghost" onClick={() => setShowMistakes((v) => !v)}>
            {showMistakes ? 'Скрыть ошибки' : `Мои ошибки (${mistakes.length})`}
          </button>

          {showMistakes && (
            <div className="mistakes">
              <ul className="card-list">
                {mistakes.map((card) => (
                  <li key={card.id} className="card-row card-row-wrong">
                    <CardRowContent card={card} kind={kind} />
                    <FavButton isFavorite={isFavorite(card.id)} onToggle={() => onToggleFavorite(card.id)} />
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost" onClick={addAllToFavorites} disabled={notFavorite.length === 0}>
                {notFavorite.length === 0 ? 'Все ошибки в избранном' : 'Все в избранное'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="summary-actions">
        {mistakes.length > 0 && (
          <button className="btn" onClick={onRetryMistakes}>
            Прогнать только ошибки
          </button>
        )}
        <button className={`btn ${mistakes.length > 0 ? 'btn-ghost' : ''}`} onClick={onRestart}>
          Пройти еще раз
        </button>
      </div>
    </div>
  );
}
