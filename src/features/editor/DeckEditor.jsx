import React, { useMemo, useRef, useState } from 'react';
import BackButton from '../../components/BackButton';
// Предпросмотр (с настоящей карточкой) — раньше памятки: тогда стили карточки подключаются в том же
// порядке, что и в режимах, и webpack может собрать их в один общий файл без конфликта порядка
import DeckPreview from './DeckPreview';
import DeckGuide from './DeckGuide';
import { analyzeUserDeckSource } from '../../deckFormat/userDeck';
import './DeckEditor.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Экран добавления / редактирования своей колоды: памятка, текст в формате txt, живой предпросмотр
export default function DeckEditor({ initialSource = '', isEdit = false, onSave, onCancel }) {
  const [source, setSource] = useState(initialSource);
  const [pendingText, setPendingText] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInput = useRef(null);

  const { deck, warnings, error } = useMemo(() => analyzeUserDeckSource(source), [source]);
  const dirty = source !== initialSource;

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

      <DeckGuide open={!isEdit} onInsert={replaceText} />

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
