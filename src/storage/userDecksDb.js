// Пользовательские колоды в IndexedDB браузера.
// Запись: { id, source, createdAt, updatedAt }; source — текст колоды в формате txt,
// он разбирается при загрузке тем же разборщиком, что и встроенные колоды.

const DB_NAME = 'ege-flashcards';
const DB_VERSION = 1;
const STORE = 'userDecks';

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB недоступен'));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        // Если сайт открыт в другой вкладке с новой версией базы — отдаем ей соединение
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
    // После ошибки даем попробовать снова при следующем обращении
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

// Выполняет одну операцию в транзакции; результат отдается после ее завершения,
// чтобы запись точно была на диске
function run(mode, operation) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = operation(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export function getUserDeckRecords() {
  return run('readonly', (store) => store.getAll());
}

export function putUserDeckRecord(record) {
  return run('readwrite', (store) => store.put(record));
}

export function deleteUserDeckRecord(id) {
  return run('readwrite', (store) => store.delete(id));
}

// Просим браузер не удалять данные сайта при нехватке места.
// Chrome решает сам, Firefox может спросить разрешение у пользователя.
export function requestPersistentStorage() {
  const storage = navigator.storage;
  if (!storage || !storage.persist || !storage.persisted) return;
  storage
    .persisted()
    .then((persisted) => (persisted ? null : storage.persist()))
    .catch(() => {});
}
