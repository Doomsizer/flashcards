import React, { useState } from 'react';
import BackButton from '../../components/BackButton';
import './ModeSelector.css';

export default function ModeSelector({ deck, favoritesCount, onSelect, onBack, onEdit, onExport, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  // У колод формул сборка — в «Обучении», а в свободном режиме обычные карточки
  const isBuild = deck.type === 'build';
  // У колод с выбором ответа варианты — в «Обучении», а в свободном режиме обычные карточки
  const isChoice = deck.type === 'choice';

  async function handleDelete() {
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await onDelete();
    } catch (e) {
      setDeleting(false);
      setDeleteFailed(true);
    }
  }

  return (
    <div className="screen">
      <BackButton onClick={onBack}>К колодам</BackButton>
      <h1>{deck.title}</h1>
      <p className="subtitle">Выбери режим</p>
      <div className="mode-list">
        {deck.table && (
          <button className="mode-card mode-card-special" onClick={() => onSelect('table')}>
            <span className="mode-title">Таблица</span>
            <span className="mode-desc">Заполняй пропуски: сначала один, в конце вся таблица</span>
          </button>
        )}
        <button className="mode-card" onClick={() => onSelect('free')}>
          <span className="mode-title">Свободный режим</span>
          <span className="mode-desc">
            {isBuild
              ? 'Все формулы вразброс: вспомни и переверни карточку'
              : isChoice
                ? 'Все карточки вразброс: вспомни ответ и переверни карточку'
                : 'Все карточки в разброс, без повторов'}
          </span>
        </button>
        <button className="mode-card" onClick={() => onSelect('favorites')}>
          <span className="mode-title">Избранное ({favoritesCount})</span>
          <span className="mode-desc">Список отмеченных карточек: поиск, чистка и прогон</span>
        </button>
        <button className="mode-card" onClick={() => onSelect('learn')}>
          <span className="mode-title">Обучение</span>
          <span className="mode-desc">
            {isBuild
              ? 'Собираешь формулы из частей по разделам, с повтором ошибок и тестом в конце'
              : isChoice
                ? 'Выбираешь ответ из четырех вариантов по разделам, с повтором ошибок и тестом в конце'
                : 'По разделам, с повтором ошибок и тестом в конце'}
          </span>
        </button>
      </div>

      {deck.isUser && (
        <div className="deck-tools">
          {confirmDelete ? (
            <>
              <p>Удалить колоду «{deck.title}» вместе с избранным? Вернуть ее не получится.</p>
              <button className="link-btn link-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаляю...' : 'Да, удалить'}
              </button>
              <button className="link-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Отмена
              </button>
            </>
          ) : (
            <>
              <button className="link-btn" onClick={onEdit}>
                Редактировать
              </button>
              <button className="link-btn" onClick={onExport}>
                Скачать .txt
              </button>
              <button className="link-btn link-btn-danger" onClick={() => setConfirmDelete(true)}>
                Удалить
              </button>
            </>
          )}
          {deleteFailed && <p className="notice notice-error">Не получилось удалить колоду. Попробуй еще раз.</p>}
        </div>
      )}
    </div>
  );
}
