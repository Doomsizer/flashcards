import { useState, useEffect } from 'react';

// Хранит значение в localStorage под ключом key, синхронизируя state <-> storage
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // localStorage недоступен (приватный режим и т.п.) — тихо игнорируем
    }
  }, [key, value]);

  return [value, setValue];
}
