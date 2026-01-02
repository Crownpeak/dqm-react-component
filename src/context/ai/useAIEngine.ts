/**
 * useAIEngine - Hook for managing AI engine initialization and access
 *
 * Handles:
 * - WebLLM engine initialization and lifecycle
 * - OpenAI client creation
 * - Model loading/unloading
 * - Concurrent access prevention via queue
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createWebLLMEngine,
  createWebLLMJsonClient,
  isWebGPUSupported,
  type WebLLMEngine,
  type WebLLMInitProgress,
} from '../../utils/webllmTranslation';
import { createOpenAIJsonClient } from '../../utils/openaiJsonClient';
import type { JsonChatClient } from '../../utils/aiJsonClient';
import type { UseAIEngineOptions, UseAIEngineReturn, TranslationState } from './types';

/**
 * Hook for managing AI engine (WebLLM or OpenAI) initialization and access.
 *
 * @param options - Configuration options
 * @returns Engine state and control functions
 */
export const useAIEngine = (options: UseAIEngineOptions): UseAIEngineReturn => {
  const {
    backend,
    enabled,
    modelId,
    useIndexedDBCache = true,
    openAiApiKey,
    openAiModel = 'gpt-4o-mini',
    openAiBaseUrl = 'https://api.openai.com/v1',
    onStorageStateChange,
  } = options;

  const { t } = useTranslation('sidebar');

  // State
  const [state, setState] = useState<TranslationState>(enabled ? 'initializing' : 'disabled');
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [initProgress, setInitProgress] = useState<WebLLMInitProgress | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const engineRef = useRef<WebLLMEngine | null>(null);
  const clientRef = useRef<JsonChatClient | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  /**
   * Stop any ongoing AI operation.
   */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (engineRef.current) {
      engineRef.current.interruptGenerate?.();
    }
  }, []);

  /**
   * Run a task with exclusive engine access.
   * Prevents concurrent calls which can cause issues with WebLLM.
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
      if (engineRef.current) {
        engineRef.current.unload?.().catch(() => undefined);
        engineRef.current.terminate?.();
        engineRef.current = null;
      }
      clientRef.current = null;
      setState('disabled');
      setInitProgress(null);
      setError(null);
      setIsReady(false);
      setLoadedModelId(null);
      return;
    }

    // OpenAI backend
    if (backend === 'openai') {
      // Clean up any existing WebLLM engine
      if (engineRef.current) {
        stop();
        engineRef.current.unload?.().catch(() => undefined);
        engineRef.current.terminate?.();
        engineRef.current = null;
        setLoadedModelId(null);
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
      clientRef.current = createOpenAIJsonClient({
        apiKey: openAiApiKey.trim(),
        model: openAiModel.trim() || 'gpt-4o-mini',
        baseUrl: openAiBaseUrl.trim() || 'https://api.openai.com/v1',
      });
      setState('ready');
      setIsReady(true);
      setError(null);
      return;
    }

    // Local WebLLM backend
    if (!isWebGPUSupported()) {
      setState('error');
      setError(t('translation_webgpu_required', { defaultValue: 'Translation requires a WebGPU-capable browser.' }));
      setIsReady(false);
      return;
    }

    // Check if engine is already loaded with correct model
    if (engineRef.current && loadedModelId === modelId) {
      setState('ready');
      setIsReady(true);
      clientRef.current = createWebLLMJsonClient(engineRef.current);
      return;
    }

    // Model changed: unload and re-init
    if (engineRef.current && loadedModelId && loadedModelId !== modelId) {
      stop();
      engineRef.current.unload?.().catch(() => undefined);
      engineRef.current.terminate?.();
      engineRef.current = null;
      setIsReady(false);
      setLoadedModelId(null);
    }

    // Initialize WebLLM engine
    let canceled = false;
    (async () => {
      try {
        setError(null);
        setInitProgress(null);
        setState('initializing');

        const { engine, modelId: loadedId } = await createWebLLMEngine({
          modelId,
          useIndexedDBCache,
          useWebWorker: true,
          webllmCdnUrl: 'https://esm.run/@mlc-ai/web-llm',
          onInitProgress: (report: WebLLMInitProgress) => {
            if (canceled) return;
            setInitProgress(report);
          },
        });

        if (canceled) return;

        engineRef.current = engine;
        setLoadedModelId(loadedId);
        setState('ready');
        setIsReady(true);
        clientRef.current = createWebLLMJsonClient(engine);

        // Notify about storage state change for persistence check
        onStorageStateChange?.();
      } catch (err) {
        if (canceled) return;
        setState('error');
        setError(err instanceof Error ? err.message : String(err));
        setIsReady(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [
    backend,
    enabled,
    loadedModelId,
    modelId,
    onStorageStateChange,
    openAiApiKey,
    openAiBaseUrl,
    openAiModel,
    t,
    useIndexedDBCache,
  ]);

  return {
    client: clientRef.current,
    state,
    loadedModelId,
    initProgress,
    isReady,
    error,
    runWithLock,
    stop,
  };
};

export default useAIEngine;
