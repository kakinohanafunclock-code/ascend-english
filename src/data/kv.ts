/**
 * Minimal async key-value store with three backends:
 *   - IndexedDB (preferred, persistent, large capacity)
 *   - localStorage (fallback when IndexedDB is unavailable)
 *   - in-memory (tests / SSR)
 * The repository layer is written against this interface so backends are swappable.
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

const DB_NAME = 'ascend';
const STORE_NAME = 'kv';

function idbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

export function createIdbStore(dbName = DB_NAME, storeName = STORE_NAME): KeyValueStore {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function openDB(): Promise<IDBDatabase> {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(storeName)) {
            req.result.createObjectStore(storeName);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await openDB();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const req = run(transaction.objectStore(storeName));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }

  return {
    get: <T>(key: string) => tx<T | undefined>('readonly', (s) => s.get(key)),
    set: (key, value) => tx<void>('readwrite', (s) => s.put(value, key)).then(() => undefined),
    delete: (key) => tx<void>('readwrite', (s) => s.delete(key)).then(() => undefined),
    keys: () => tx<string[]>('readonly', (s) => s.getAllKeys() as IDBRequest<string[]>),
    clear: () => tx<void>('readwrite', (s) => s.clear()).then(() => undefined),
  };
}

export function createLocalStore(prefix = 'ascend:'): KeyValueStore {
  const k = (key: string) => prefix + key;
  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(k(key));
      return raw == null ? undefined : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T) {
      localStorage.setItem(k(key), JSON.stringify(value));
    },
    async delete(key: string) {
      localStorage.removeItem(k(key));
    },
    async keys() {
      const out: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const full = localStorage.key(i);
        if (full && full.startsWith(prefix)) out.push(full.slice(prefix.length));
      }
      return out;
    },
    async clear() {
      for (const key of await this.keys()) localStorage.removeItem(k(key));
    },
  };
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return map.has(key) ? (structuredClone(map.get(key)) as T) : undefined;
    },
    async set<T>(key: string, value: T) {
      map.set(key, structuredClone(value));
    },
    async delete(key: string) {
      map.delete(key);
    },
    async keys() {
      return [...map.keys()];
    },
    async clear() {
      map.clear();
    },
  };
}

/** Pick the best available backend for the current environment. */
export function createStore(): KeyValueStore {
  if (idbAvailable()) return createIdbStore();
  if (typeof localStorage !== 'undefined') return createLocalStore();
  return createMemoryStore();
}
