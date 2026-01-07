export type TranslationCacheKey = string;

export type CachedCheckpointTranslation = {
  key: TranslationCacheKey;
  modelId: string;
  lang: string;
  checkpointId: string;
  sourceHash: string;
  translated: {
    name: string;
    description: string;
    category: string;
    topics: string[];
  };
  updatedAt: number;
};

export type LabelType = 'category' | 'topic';

export type CachedLabelTranslation = {
  key: TranslationCacheKey;
  modelId: string;
  lang: string;
  type: LabelType;
  source: string;
  sourceHash: string;
  translated: string;
  updatedAt: number;
};

type DbSchema = {
  checkpoint: CachedCheckpointTranslation;
  label: CachedLabelTranslation;
};

const DB_NAME = 'dqm.ai.translationCache';
const DB_VERSION = 1;

const hasIndexedDb = (): boolean => typeof indexedDB !== 'undefined';

const deleteDb = (): Promise<void> => new Promise((resolve, reject) => {
  if (!hasIndexedDb()) {
    resolve();
    return;
  }
  const request = indexedDB.deleteDatabase(DB_NAME);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB'));
  request.onblocked = () => reject(new Error('IndexedDB deletion blocked by open connections'));
});

const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('checkpoint')) {
      db.createObjectStore('checkpoint', { keyPath: 'key' });
    }
    if (!db.objectStoreNames.contains('label')) {
      db.createObjectStore('label', { keyPath: 'key' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
});

const withStore = async <T>(
  storeName: keyof DbSchema,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const db = await openDb();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName as string, mode);
    const store = tx.objectStore(storeName as string);
    fn(store).then(resolve).catch(reject);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
      db.close();
    };
  });
};

const requestToPromise = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });

export const fnv1aHash = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const makeCheckpointKey = (modelId: string, lang: string, sourceHash: string): TranslationCacheKey =>
  `checkpoint|${modelId}|${lang}|${sourceHash}`;

export const computeCheckpointSourceHash = (checkpoint: {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  topics?: string[] | null;
}): string => fnv1aHash(JSON.stringify({
  name: checkpoint?.name ?? '',
  description: checkpoint?.description ?? '',
  category: checkpoint?.category ?? '',
  topics: checkpoint?.topics ?? [],
}));

export const makeLabelKey = (modelId: string, lang: string, type: LabelType, sourceHash: string): TranslationCacheKey =>
  `label|${modelId}|${lang}|${type}|${sourceHash}`;

export interface TranslationCache {
  getCheckpointMany: (keys: TranslationCacheKey[]) => Promise<Map<TranslationCacheKey, CachedCheckpointTranslation>>;
  putCheckpointMany: (items: CachedCheckpointTranslation[]) => Promise<void>;
  deleteCheckpointMany: (keys: TranslationCacheKey[]) => Promise<void>;
  getLabelMany: (keys: TranslationCacheKey[]) => Promise<Map<TranslationCacheKey, CachedLabelTranslation>>;
  putLabelMany: (items: CachedLabelTranslation[]) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const createTranslationCache = (): TranslationCache => {
  if (!hasIndexedDb()) {
    return {
      getCheckpointMany: async () => new Map(),
      putCheckpointMany: async () => undefined,
      deleteCheckpointMany: async () => undefined,
      getLabelMany: async () => new Map(),
      putLabelMany: async () => undefined,
      clearAll: async () => undefined,
    };
  }

  return {
    getCheckpointMany: async (keys) => {
      if (keys.length === 0) return new Map();
      return await withStore('checkpoint', 'readonly', async (store) => {
        const pairs = await Promise.all(keys.map(async (key) => {
          const value = await requestToPromise(store.get(key)) as CachedCheckpointTranslation | undefined;
          return value ? ([key, value] as const) : null;
        }));
        return new Map(pairs.filter((p): p is readonly [string, CachedCheckpointTranslation] => p !== null));
      });
    },
    putCheckpointMany: async (items) => {
      if (items.length === 0) return;
      await withStore('checkpoint', 'readwrite', async (store) => {
        await Promise.all(items.map((item) => requestToPromise(store.put(item))));
      });
    },
    deleteCheckpointMany: async (keys) => {
      if (keys.length === 0) return;
      await withStore('checkpoint', 'readwrite', async (store) => {
        await Promise.all(keys.map((key) => requestToPromise(store.delete(key))));
      });
    },
    getLabelMany: async (keys) => {
      if (keys.length === 0) return new Map();
      return await withStore('label', 'readonly', async (store) => {
        const pairs = await Promise.all(keys.map(async (key) => {
          const value = await requestToPromise(store.get(key)) as CachedLabelTranslation | undefined;
          return value ? ([key, value] as const) : null;
        }));
        return new Map(pairs.filter((p): p is readonly [string, CachedLabelTranslation] => p !== null));
      });
    },
    putLabelMany: async (items) => {
      if (items.length === 0) return;
      await withStore('label', 'readwrite', async (store) => {
        await Promise.all(items.map((item) => requestToPromise(store.put(item))));
      });
    },
    clearAll: async () => {
      try {
        await deleteDb();
      } catch {
        // Fallback: clear stores if deletion is blocked (e.g., open tabs)
        await withStore('checkpoint', 'readwrite', async (store) => {
          await requestToPromise(store.clear());
        });
        await withStore('label', 'readwrite', async (store) => {
          await requestToPromise(store.clear());
        });
      }
    },
  };
};
