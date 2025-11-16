// Storage utility using IndexedDB for large HTML content
// IndexedDB has ~50% of available disk space limit (far exceeds localStorage's ~5-10MB)

const DB_NAME = 'DQMTestStorage';
const DB_VERSION = 1;
const STORE_NAME = 'htmlContent';

interface StorageDB extends IDBDatabase {
  // Type helper
}

/**
 * Opens or creates the IndexedDB database
 */
const openDB = (): Promise<StorageDB> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as StorageDB);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

/**
 * Save HTML content to IndexedDB
 * @param key Storage key
 * @param value HTML string to store
 */
export const saveHtmlToStorage = async (key: string, value: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save HTML to IndexedDB:', error);
    throw error;
  }
};

/**
 * Load HTML content from IndexedDB
 * @param key Storage key
 * @returns HTML string or null if not found
 */
export const loadHtmlFromStorage = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load HTML from IndexedDB:', error);
    return null;
  }
};

/**
 * Delete HTML content from IndexedDB
 * @param key Storage key
 */
export const deleteHtmlFromStorage = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete HTML from IndexedDB:', error);
    throw error;
  }
};

/**
 * Get the approximate size of stored HTML content
 * @param key Storage key
 * @returns Size in bytes, or 0 if not found
 */
export const getStorageSize = async (key: string): Promise<number> => {
  const html = await loadHtmlFromStorage(key);
  if (!html) return 0;

  // Calculate approximate byte size (UTF-16 encoding)
  return new Blob([html]).size;
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

