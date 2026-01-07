/**
 * useAIEngine - Hook for managing AI engine initialization and access
 *
 * Handles:
 * - OpenAI client creation
 * - Concurrent access prevention via queue
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createOpenAIJsonClient } from '../../utils/openaiJsonClient';
import type { JsonChatClient } from '../../utils/aiJsonClient';
import type { UseAIEngineOptions, UseAIEngineReturn, TranslationState } from './types';

/**
 * Hook for managing AI engine (OpenAI) initialization and access.
 *
 * @param options - Configuration options
 * @returns Engine state and control functions
 */
export const useAIEngine = (options: UseAIEngineOptions): UseAIEngineReturn => {
  const {
    enabled,
    openAiApiKey,
    openAiModel = 'gpt-4.1-mini',
    openAiBaseUrl = 'https://api.openai.com/v1',
  } = options;

  const { t } = useTranslation('sidebar');

  // State
  const [state, setState] = useState<TranslationState>(enabled ? 'initializing' : 'disabled');
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const clientRef = useRef<JsonChatClient | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  /**
   * Stop any ongoing AI operation.
   */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clientRef.current?.interrupt?.();
  }, []);

  /**
   * Run a task with exclusive engine access.
   * Prevents concurrent calls.
   */
  const runWithLock = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    const prev = queueRef.current.catch(() => undefined);
    let release: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    queueRef.current = prev.then(() => next);
    await prev;
    try {
      return await task();
    } finally {
      release();
    }
  }, []);

  /**
   * Initialize or update the AI engine based on options.
   */
  useEffect(() => {
    // If AI is disabled, clean up
    if (!enabled) {
      stop();
      clientRef.current = null;
      setState('disabled');
      setError(null);
      setIsReady(false);
      setLoadedModelId(null);
      return;
    }

    // Validate API key
    if (!openAiApiKey || openAiApiKey.trim().length === 0) {
      setState('error');
      setError(t('openai_missing_key'));
      setIsReady(false);
      clientRef.current = null;
      return;
    }

    // Create OpenAI client
    const model = openAiModel.trim() || 'gpt-4.1-mini';
    clientRef.current = createOpenAIJsonClient({
      apiKey: openAiApiKey.trim(),
      model,
      baseUrl: openAiBaseUrl.trim() || 'https://api.openai.com/v1',
    });
    setState('ready');
    setIsReady(true);
    setError(null);
    setLoadedModelId(model);
  }, [
    enabled,
    openAiApiKey,
    openAiBaseUrl,
    openAiModel,
    t,
    stop,
  ]);

  return {
    client: clientRef.current,
    state,
    loadedModelId,
    isReady,
    error,
    runWithLock,
    stop,
  };
};

export default useAIEngine;
