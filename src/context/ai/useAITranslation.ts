/**
 * useAITranslation - Hook for translating DQM analysis results
 *
 * Handles:
 * - Translation of analysis data using AI engine
 * - Progress tracking and partial results
 * - Cache management (in-memory + IndexedDB)
 * - Retry and cancellation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  translateDqmResults,
  type TranslationProgress,
} from '../../utils/translationUtils';
import { computeCheckpointSourceHash, makeCheckpointKey } from '../../utils/translationCache';
import type { AnalysisData } from '../../types';
import type { UseAITranslationOptions, UseAITranslationReturn } from './types';
import { logger } from '../../utils/logger';

/**
 * Hook for translating DQM analysis results using AI.
 *
 * @param options - Configuration options
 * @returns Translation state and control functions
 */
export const useAITranslation = (options: UseAITranslationOptions): UseAITranslationReturn => {
  const {
    engine,
    cacheManager,
    originalData,
    targetLang,
    modelId,
    enabled,
    mode,
    computeBudgetMs,
    persistentCache,
    summaryGenerating = false,
  } = options;

  const { t } = useTranslation('sidebar');

  // State
  const [translatedData, setTranslatedData] = useState<AnalysisData | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());
  const [translatedIds, setTranslatedIds] = useState<Set<string>>(new Set());
  const [runNonce, setRunNonce] = useState<number>(0);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const hasRunForKeyRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSummaryGeneratingRef = useRef(summaryGenerating);

  // Callbacks for data changes
  const onDataChangeRef = useRef<UseAITranslationReturn['onDataChange']>(undefined);

  // ALL options as refs to prevent dependency issues
  const engineRef = useRef(engine);
  const cacheManagerRef = useRef(cacheManager);
  const originalDataRef = useRef(originalData);
  const targetLangRef = useRef(targetLang);
  const modelIdRef = useRef(modelId);
  const enabledRef = useRef(enabled);
  const modeRef = useRef(mode);
  const computeBudgetMsRef = useRef(computeBudgetMs);
  const persistentCacheRef = useRef(persistentCache);
  const summaryGeneratingRef = useRef(summaryGenerating);
  const tRef = useRef(t);

  // Sync refs in useEffect (React 19 strict mode requires this)
  useEffect(() => {
    engineRef.current = engine;
    cacheManagerRef.current = cacheManager;
    originalDataRef.current = originalData;
    targetLangRef.current = targetLang;
    modelIdRef.current = modelId;
    enabledRef.current = enabled;
    modeRef.current = mode;
    computeBudgetMsRef.current = computeBudgetMs;
    persistentCacheRef.current = persistentCache;
    summaryGeneratingRef.current = summaryGenerating;
    tRef.current = t;
  });

  // Stable values for dependencies
  const assetId = originalData?.assetId ?? null;
  const translationNeeded = targetLang !== 'en';
  const isTranslating = translatingIds.size > 0;
  const engineIsReady = engine.isReady;

  // Reset hasRunForKeyRef when summary stops blocking (allows retry)
  useEffect(() => {
    if (prevSummaryGeneratingRef.current && !summaryGenerating) {
      // Summary just finished - reset to allow translation to run
      logger.debug('Translation: summary finished, resetting hasRunForKeyRef for retry');
      hasRunForKeyRef.current = null;
    }
    prevSummaryGeneratingRef.current = summaryGenerating;
  }, [summaryGenerating]);

  /**
   * Stop ongoing translation.
   */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  /**
   * Reset to original data and clear filters.
   */
  const resetToOriginal = useCallback(() => {
    setTranslatedData(originalDataRef.current);
    setTranslatingIds(new Set());
    setTranslatedIds(new Set());
  }, []);

  /**
   * Generate cache key for current asset/settings.
   */
  const makeCacheKey = useCallback(() => {
    const data = originalDataRef.current;
    if (!data) return '';
    return `${data.assetId}:${targetLangRef.current}:${modelIdRef.current}`;
  }, []);

  /**
   * Restart translation (clears cache for current asset).
   */
  const restart = useCallback(() => {
    const data = originalDataRef.current;
    if (!data) return;
    if (targetLangRef.current === 'en') {
      setError(tRef.current('translation_not_needed'));
      resetToOriginal();
      return;
    }
    const cacheKey = makeCacheKey();
    cacheManagerRef.current.assetCache.delete(cacheKey);
    hasRunForKeyRef.current = null;
    isRunningRef.current = false;
    resetToOriginal();
    stop();
    setError(null);
    setProgress(null);
    setTranslatedData(null);
    setTranslatingIds(new Set());
    setTranslatedIds(new Set());
    setRunNonce((n) => n + 1);
  }, [makeCacheKey, resetToOriginal, stop]);

  /**
   * Retry translation for a single checkpoint.
   */
  const retrySingleCheckpoint = useCallback(async (checkpointId: string) => {
    const data = originalDataRef.current;
    if (!data) return;
    if (!enabledRef.current) return;
    const checkpoint = data.checkpoints.find((cp) => cp.id === checkpointId);
    if (!checkpoint) return;

    // Clear from in-memory cache
    const cacheKey = makeCacheKey();
    cacheManagerRef.current.assetCache.delete(cacheKey);

    // Update tracking sets
    setTranslatedIds((prev) => {
      const next = new Set(prev);
      next.delete(checkpointId);
      return next;
    });
    setTranslatingIds((prev) => {
      const next = new Set(prev);
      next.delete(checkpointId);
      return next;
    });

    // Remove from persistent cache
    try {
      const sourceHash = computeCheckpointSourceHash(checkpoint);
      const key = makeCheckpointKey(modelIdRef.current, targetLangRef.current, sourceHash);
      await persistentCacheRef.current.deleteCheckpointMany([key]);
    } catch {
      // Ignore deletion failures
    }

    hasRunForKeyRef.current = null;
    setRunNonce((n) => n + 1);
  }, [makeCacheKey]);

  /**
   * Main translation effect - RUNS ONCE per unique key.
   * Uses debounce to prevent API spam when dependencies change rapidly.
   */
  useEffect(() => {
    const runKey = `${assetId}:${targetLang}:${modelId}:${mode}`;

    // Cleanup debounce timer on any change
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Skip if not enabled
    if (!enabled) {
      setTranslatedData(null);
      setProgress(null);
      setError(null);
      setTranslatingIds(new Set());
      setTranslatedIds(new Set());
      return;
    }

    // Skip if no data
    if (!assetId) return;

    // Skip if summary generating (now reactive!)
    if (summaryGenerating) {
      logger.debug('Translation: waiting for summary to complete');
      return;
    }

    // Skip if not needed
    if (!translationNeeded) {
      setProgress(null);
      setError(tRef.current('translation_not_needed'));
      setTranslatedData(originalDataRef.current);
      return;
    }

    // Skip if already running
    if (isRunningRef.current) return;

    // Skip if already ran for this key
    if (hasRunForKeyRef.current === runKey) return;

    // Skip if engine not ready (now reactive!)
    if (!engineIsReady || !engineRef.current.client) {
      logger.debug('Translation: engine not ready yet');
      return;
    }

    const data = originalDataRef.current;
    if (!data) return;

    // Check cache first (no debounce needed for cache hit)
    const cacheKey = makeCacheKey();
    const cached = cacheManagerRef.current.assetCache.get(cacheKey);
    if (cached) {
      setError(null);
      setProgress({
        translatedCheckpoints: cached.checkpoints.length,
        totalCheckpoints: cached.checkpoints.length,
        isPartial: false,
      });
      setTranslatedData(cached);
      hasRunForKeyRef.current = runKey;
      return;
    }

    // Debounce: wait 300ms before starting translation
    // This prevents API spam when multiple dependencies change rapidly
    logger.debug('Translation: scheduling with 300ms debounce');
    
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      
      // Re-check ALL conditions after debounce (they may have changed)
      if (!enabledRef.current) {
        logger.debug('Translation: cancelled after debounce - disabled');
        return;
      }
      if (summaryGeneratingRef.current) {
        logger.debug('Translation: cancelled after debounce - summary running');
        return;
      }
      if (isRunningRef.current) {
        logger.debug('Translation: cancelled after debounce - already running');
        return;
      }
      if (hasRunForKeyRef.current === runKey) {
        logger.debug('Translation: cancelled after debounce - already ran for key');
        return;
      }
      if (!engineRef.current.isReady || !engineRef.current.client) {
        logger.debug('Translation: cancelled after debounce - engine not ready');
        return;
      }

      const currentData = originalDataRef.current;
      if (!currentData) return;

      // Mark as running BEFORE async work
      hasRunForKeyRef.current = runKey;
      isRunningRef.current = true;

      stop();
      const controller = new AbortController();
      abortRef.current = controller;

      setTranslatingIds(new Set());
      setTranslatedIds(new Set());
      setError(null);
      setProgress(null);

      logger.debug('Translation: starting API call');

      const client = engineRef.current.client!;
      const runWithLock = engineRef.current.runWithLock;

      runWithLock(async () => translateDqmResults({
        client,
        data: currentData,
        targetLanguage: targetLangRef.current,
        modelId: modelIdRef.current,
        maxConcurrentBatches: 3,
        maxItemsPerBatch: 12,
        forceSerial: false,
        cache: persistentCacheRef.current,
        computeBudgetMs: computeBudgetMsRef.current,
        signal: controller.signal,
        onProgress: (prog) => setProgress(prog),
        onBatchStatus: () => {
          // Batch status tracking not needed for API backend
        },
        onPartialResult: () => {
          // Partial results not needed for API backend
        },
      }))
        .then(({ data: translated, progress: finalProgress }) => {
          if (controller.signal.aborted) return;
          logger.debug('Translation: done');
          cacheManagerRef.current.assetCache.set(cacheKey, translated);
          setTranslatedData(translated);
          if (finalProgress.isPartial) {
            setError(
              modeRef.current === 'full'
                ? tRef.current('translation_incomplete')
                : tRef.current('translation_partial'),
            );
          }
          setTranslatingIds(new Set());
          setTranslatedIds(new Set());
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          logger.error('Translation: failed', err);
          setError(err instanceof Error ? err.message : String(err));
          setTranslatedData(currentData);
          setTranslatingIds(new Set());
          setTranslatedIds(new Set());
        })
        .finally(() => {
          isRunningRef.current = false;
        });
    }, 300); // 300ms debounce to prevent API spam

    return () => {
      // Cleanup: cancel debounce timer and abort any running request
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      abortRef.current?.abort();
    };
  }, [assetId, targetLang, modelId, mode, enabled, translationNeeded, runNonce, makeCacheKey, stop, summaryGenerating, engineIsReady]);

  return {
    translatedData,
    progress,
    error,
    translatingIds,
    translatedIds,
    isTranslating,
    restart,
    stop,
    retrySingleCheckpoint,
    resetToOriginal,
    onDataChange: onDataChangeRef.current,
  };
};

export default useAITranslation;
