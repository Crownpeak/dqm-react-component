/**
 * useAISummary - Hook for generating AI-powered summary of DQM results
 *
 * Handles:
 * - Summary generation using AI engine
 * - Timeout handling
 * - Language change detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { summarizeDqmResults } from '../../utils/webllmTranslation';
import type { UseAISummaryOptions, UseAISummaryReturn, SummaryState, SummaryStats } from './types';
import { fnv1aHash } from '../../utils/translationCache';
import { logger } from '../../utils/logger';

/**
 * Hook for generating AI-powered summary of DQM analysis results.
 *
 * @param options - Configuration options
 * @returns Summary state and control functions
 */
export const useAISummary = (options: UseAISummaryOptions): UseAISummaryReturn => {
  const {
    engine,
    originalData,
    targetLang,
    modelId,
    enabled,
    timeoutMs = 45000,
    translationInProgress = false,
    cache,
  } = options;

  const { t } = useTranslation('sidebar');

  // State
  const [state, setState] = useState<SummaryState>('idle');
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runNonce, setRunNonce] = useState<number>(0);
  const [stats, setStats] = useState<UseAISummaryReturn['stats']>(null);
  const summaryCacheRef = useRef<Map<string, { bullets: string[]; stats: SummaryStats | null }>>(new Map());

  // ALL values as refs to prevent ANY dependency issues
  const abortRef = useRef<AbortController | null>(null);
  const prevTargetLangRef = useRef<string>(targetLang);
  const isGeneratingRef = useRef<boolean>(false);
  const hasRunForAssetRef = useRef<string | null>(null);
  
  // Store ALL options as refs
  const engineRef = useRef(engine);
  const originalDataRef = useRef(originalData);
  const targetLangRef = useRef(targetLang);
  const modelIdRef = useRef(modelId);
  const enabledRef = useRef(enabled);
  const timeoutMsRef = useRef(timeoutMs);
  const translationInProgressRef = useRef(translationInProgress);
  const cacheRef = useRef(cache);
  const tRef = useRef(t);

  // Sync refs in useEffect (React 19 strict mode requires this)
  useEffect(() => {
    engineRef.current = engine;
    originalDataRef.current = originalData;
    targetLangRef.current = targetLang;
    modelIdRef.current = modelId;
    enabledRef.current = enabled;
    timeoutMsRef.current = timeoutMs;
    translationInProgressRef.current = translationInProgress;
    cacheRef.current = cache;
    tRef.current = t;
  });

  /**
   * Restart summary generation.
   */
  const restart = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isGeneratingRef.current = false;
    hasRunForAssetRef.current = null;
    summaryCacheRef.current.clear();
    setError(null);
    setBullets(null);
    setStats(null);
    setState('idle');
    setRunNonce((n) => n + 1);
  }, []);

  // Stable assetId for trigger
  const assetId = originalData?.assetId ?? null;

  /**
   * Reset when language changes.
   */
  useEffect(() => {
    if (prevTargetLangRef.current !== targetLang) {
      prevTargetLangRef.current = targetLang;
      hasRunForAssetRef.current = null; // Allow re-run for new language
      setBullets(null);
      setError(null);
      setStats(null);
      setState('idle');
    }
  }, [targetLang]);

  /**
   * Reset when nonce changes (manual restart).
   */
  useEffect(() => {
    if (runNonce > 0) {
      hasRunForAssetRef.current = null;
    }
  }, [runNonce]);

  /**
   * Main summary generation effect - RUNS ONCE per assetId.
   */
  useEffect(() => {
    // Create unique run key
    const runKey = `${assetId}:${targetLang}:${modelId}`;
    
    // Skip if not enabled
    if (!enabledRef.current) {
      setState('idle');
      return;
    }
    
    // Skip if no data
    if (!assetId) return;
    
    // Skip if translation in progress
    if (translationInProgressRef.current) return;
    
    // Skip if already running
    if (isGeneratingRef.current) return;
    
    // Skip if already ran for this key
    if (hasRunForAssetRef.current === runKey) return;
    
    // Skip if engine not ready
    if (!engineRef.current.isReady || !engineRef.current.client) return;

    const data = originalDataRef.current;
    if (!data) return;

    // Check cache
    const makeCacheKey = (): string => {
      const failed = (data.checkpoints || [])
        .filter((cp) => cp.failed)
        .map((cp) => ({
          id: cp.id ?? '',
          name: cp.name ?? '',
          description: cp.description ?? '',
          category: cp.category ?? '',
          topics: [...(cp.topics ?? [])].sort(),
        }))
        .sort((a, b) => {
          const ka = `${a.id}|${a.category}|${a.name}|${a.description}`;
          const kb = `${b.id}|${b.category}|${b.name}|${b.description}`;
          return ka.localeCompare(kb);
        });
      return fnv1aHash(JSON.stringify({
        modelId: modelIdRef.current,
        targetLang: targetLangRef.current,
        site: data.siteName ?? '',
        totalErrors: data.totalErrors ?? 0,
        failed,
      }));
    };

    const cacheKey = makeCacheKey();
    if (cacheKey && summaryCacheRef.current.has(cacheKey)) {
      const cached = summaryCacheRef.current.get(cacheKey)!;
      setBullets(cached.bullets);
      setStats(cached.stats);
      setState('ready');
      hasRunForAssetRef.current = runKey;
      return;
    }

    // Mark as running BEFORE async work
    hasRunForAssetRef.current = runKey;
    isGeneratingRef.current = true;
    
    // Cancel any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    
    setState('generating');
    setError(null);
    setBullets(null);
    setStats(null);

    const timeoutId = window.setTimeout(() => {
      controller.abort();
      if (isGeneratingRef.current) {
        setState('error');
        setError(tRef.current('summary_timeout'));
        isGeneratingRef.current = false;
      }
    }, timeoutMsRef.current);

    const startTs = Date.now();
    logger.debug('Summary: start (once)');

    const client = engineRef.current.client!;
    const runWithLock = engineRef.current.runWithLock;

    runWithLock(async () => {
      if (client.reset) {
        try {
          await client.reset(true);
        } catch {
          // ignore
        }
      }
      return summarizeDqmResults({
        client,
        data,
        targetLanguage: targetLangRef.current,
        modelId: modelIdRef.current,
        cache: cacheRef.current,
        signal: controller.signal,
      });
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        logger.debug('Summary: ready in', Date.now() - startTs, 'ms');
        setBullets(result.bullets);
        setStats(result.stats ?? null);
        if (cacheKey) {
          summaryCacheRef.current.set(cacheKey, { bullets: result.bullets, stats: result.stats ?? null });
        }
        setState('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        logger.error('Summary: failed', err);
        setState('error');
        setError(err instanceof Error ? err.message : String(err));
        const withStats = (err as { stats?: SummaryStats })?.stats;
        if (withStats) setStats(withStats);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        isGeneratingRef.current = false;
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [assetId, targetLang, modelId, runNonce]); // MINIMAL stable deps only

  return {
    state,
    bullets,
    error,
    stats,
    restart,
  };
};

export default useAISummary;
