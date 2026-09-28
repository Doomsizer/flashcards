import { useState, useEffect, useCallback } from 'react';

function readStorage(key, initialValue) {
  if (!key) return initialValue;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  } catch (e) {
    return initialValue;
  }
}

// Хранит значение в localStorage под ключом key, синхронизируя state <-> storage.
// При смене key значение перечитывается из storage (а не переносится со старого ключа).
// Если key пустой — работает как обычный useState, без записи в storage.
export function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => ({ key, value: readStorage(key, initialValue) }));

  let current = state;
  if (state.key !== key) {
    current = { key, value: readStorage(key, initialValue) };
    setState(current);
  }

  useEffect(() => {
    if (!state.key) return;
    try {
      window.localStorage.setItem(state.key, JSON.stringify(state.value));
    } catch (e) {
      // localStorage недоступен (приватный режим и т.п.) — тихо игнорируем
    }
  }, [state]);

  const setValue = useCallback((update) => {
    setState((s) => ({ key: s.key, value: typeof update === 'function' ? update(s.value) : update }));
  }, []);

  return [current.value, setValue];
}
