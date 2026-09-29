import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getUserDeckRecords,
  putUserDeckRecord,
  deleteUserDeckRecord,
  requestPersistentStorage,
} from '../storage/userDecksDb';
import { deckFromRecord, newUserDeckId } from '../deckFormat/userDeck';
import { removeDeckFavorites } from '../utils/favorites';

// Пользовательские колоды из IndexedDB.
// status: 'loading' | 'ready' | 'error' (хранилище недоступно — свои колоды не сохранятся)
export function useUserDecks() {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let alive = true;
    getUserDeckRecords()
      .then((list) => {
        if (!alive) return;
        setRecords(list);
        setStatus('ready');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  const decks = useMemo(
    () =>
      records
        .map(deckFromRecord)
        .filter(Boolean)
        .sort((a, b) => a.createdAt - b.createdAt),
    [records]
  );

  // Сохраняет новую (existingId не задан) или измененную колоду, возвращает готовую колоду
  const save = useCallback(
    async (source, existingId) => {
      const now = Date.now();
      const existing = records.find((r) => r.id === existingId);
      const record = {
        id: existing ? existing.id : newUserDeckId(),
        source,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      };
      await putUserDeckRecord(record);
      setRecords((list) => [...list.filter((r) => r.id !== record.id), record]);
      requestPersistentStorage();
      return deckFromRecord(record);
    },
    [records]
  );

  const remove = useCallback(async (id) => {
    await deleteUserDeckRecord(id);
    setRecords((list) => list.filter((r) => r.id !== id));
    removeDeckFavorites(id);
  }, []);

  return { decks, records, status, save, remove };
}
