/**
 * useTranslationCache - Hook for managing translation cache (IndexedDB + in-memory)
 *
 * Handles:
 * - IndexedDB-based persistent cache via TranslationCache
 * - In-memory asset cache for translated AnalysisData
 * - Storage persistence state checking
 */

import { useState, useCallback, useMemo } from 'react';
import { createTranslationCache, type TranslationCache } from '../../utils/translationCache';
import type { AnalysisData } from '../../types';
import type { UseTranslationCacheReturn } from './types';

/**
 * Hook for managing translation caches (both IndexedDB and in-memory).
 *
 * @returns Cache management functions and state
 */
export const useTranslationCache = (): UseTranslationCacheReturn => {
  // IndexedDB-backed persistent cache
  const cache = useMemo(() => createTranslationCache(), []);

  // In-memory cache for translated analysis data per asset
  // Key format: `${assetId}:${targetLang}:${backend}:${modelId}`
  const assetCache = useMemo<Map<string, AnalysisData>>(() => new Map(), []);

  // Storage persistence state
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);

  /**
   * Check if storage is persisted (survives browser eviction).
   */
  const refreshStorageState = useCallback(async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).storage?.persisted) {
      setStoragePersisted(null);
      return;
    }
    try {
      const persisted = await (navigator as any).storage.persisted();
      setStoragePersisted(typeof persisted === 'boolean' ? persisted : null);
    } catch {
      setStoragePersisted(null);
    }
  }, []);

  /**
   * Clear all caches (both IndexedDB and in-memory).
   */
  const clearAll = useCallback(async () => {
    await cache.clearAll();
    assetCache.clear();
  }, [assetCache, cache]);

  /**
   * Clear only the in-memory asset cache.
   */
  const clearAssetCache = useCallback(() => {
    assetCache.clear();
  }, [assetCache]);

  return {
    cache,
    assetCache,
    storagePersisted,
    refreshStorageState,
    clearAll,
    clearAssetCache,
  };
};

export default useTranslationCache;
