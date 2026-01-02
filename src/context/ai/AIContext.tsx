/**
 * AI Context - Central configuration and settings for AI features
 *
 * Manages:
 * - Translation settings (enabled, mode, model preset)
 * - Summary settings
 * - Backend selection (local WebLLM vs OpenAI)
 * - OpenAI credentials
 * - localStorage synchronization
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import type {
  AIContextValue,
  AIProviderProps,
  AiBackend,
  AiModelPreset,
  TranslationMode,
} from './types';

const AIContext = createContext<AIContextValue | null>(null);

/**
 * Hook to access AI context. Must be used within an AIProvider.
 */
export const useAI = (): AIContextValue => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

/**
 * Provider component for AI features configuration.
 */
export const AIProvider: React.FC<AIProviderProps> = ({
  children,
  translationConfig,
  summaryConfig,
}) => {
  const { i18n } = useTranslation();

  // ============================================================================
  // Translation Settings
  // ============================================================================

  const [translationEnabled, setTranslationEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return translationConfig?.enabledByDefault === true;
    const stored = getLocalStorageItem('dqm_translate_results_enabled');
    if (stored == null) return translationConfig?.enabledByDefault === true;
    return stored === 'true';
  });

  const [translationMode, setTranslationModeState] = useState<TranslationMode>(() => {
    if (typeof window === 'undefined') return 'fast';
    const stored = getLocalStorageItem('dqm_translate_results_mode');
    return stored === 'full' ? 'full' : 'fast';
  });

  const [translationDialogOpen, setTranslationDialogOpen] = useState<boolean>(false);

  // ============================================================================
  // Model Settings
  // ============================================================================

  const [aiModelPreset, setAiModelPresetState] = useState<AiModelPreset>(() => {
    if (typeof window === 'undefined') return 'fast';
    const stored = getLocalStorageItem('dqm_ai_model_preset') as AiModelPreset | null;
    if (stored === 'simple' || stored === 'reliable' || stored === 'accurate' || stored === 'fast') {
      return stored;
    }
    return 'fast';
  });

  const presetToModelId = useMemo<Record<AiModelPreset, string>>(() => ({
    fast: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    simple: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    reliable: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    accurate: 'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
  }), []);

  // ============================================================================
  // Summary Settings
  // ============================================================================

  const [summaryEnabled, setSummaryEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = getLocalStorageItem('dqm_ai_summary_enabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return true;
  });

  // ============================================================================
  // Backend Settings
  // ============================================================================

  const [aiBackend, setAiBackendState] = useState<AiBackend>(() => {
    if (typeof window === 'undefined') return 'openai';
    const stored = getLocalStorageItem('dqm_ai_backend');
    if (stored === 'openai' || stored === 'local') return stored;
    return 'openai';
  });

  const [openAiApiKey, setOpenAiApiKeyState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return getLocalStorageItem('dqm_openai_apiKey') ?? '';
  });

  const [openAiModel, setOpenAiModelState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'gpt-4o-mini';
    return getLocalStorageItem('dqm_openai_model') ?? 'gpt-4o-mini';
  });

  const [openAiBaseUrl, setOpenAiBaseUrlState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'https://api.openai.com/v1';
    return getLocalStorageItem('dqm_openai_baseUrl') ?? 'https://api.openai.com/v1';
  });

  // ============================================================================
  // Setters with localStorage sync
  // ============================================================================

  const setTranslationEnabled = useCallback((value: boolean) => {
    setTranslationEnabledState(value);
  }, []);

  const setTranslationMode = useCallback((value: TranslationMode) => {
    setTranslationModeState(value);
  }, []);

  const setAiModelPreset = useCallback((value: AiModelPreset) => {
    setAiModelPresetState(value);
  }, []);

  const setSummaryEnabled = useCallback((value: boolean) => {
    setSummaryEnabledState(value);
  }, []);

  const setAiBackend = useCallback((value: AiBackend) => {
    setAiBackendState(value);
  }, []);

  const setOpenAiApiKey = useCallback((value: string) => {
    setOpenAiApiKeyState(value);
  }, []);

  const setOpenAiModel = useCallback((value: string) => {
    setOpenAiModelState(value);
  }, []);

  const setOpenAiBaseUrl = useCallback((value: string) => {
    setOpenAiBaseUrlState(value);
  }, []);

  // ============================================================================
  // localStorage Synchronization Effects
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_translate_results_enabled', translationEnabled ? 'true' : 'false');
  }, [translationEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_translate_results_mode', translationMode);
  }, [translationMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_ai_model_preset', aiModelPreset);
  }, [aiModelPreset]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_ai_summary_enabled', summaryEnabled ? 'true' : 'false');
  }, [summaryEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_ai_backend', aiBackend);
  }, [aiBackend]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_openai_apiKey', openAiApiKey);
  }, [openAiApiKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_openai_model', openAiModel);
  }, [openAiModel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLocalStorageItem('dqm_openai_baseUrl', openAiBaseUrl);
  }, [openAiBaseUrl]);

  // ============================================================================
  // Derived Values
  // ============================================================================

  const targetLang = useMemo(
    () => (i18n.language || 'en').split('-')[0],
    [i18n.language]
  );

  const translationNeeded = targetLang !== 'en';

  const aiEnabled = summaryEnabled || translationEnabled || targetLang === 'en';

  const desiredModelId = translationConfig?.modelId ?? presetToModelId[aiModelPreset];

  const computeBudgetMs = useMemo(() => {
    const baseBudget = translationConfig?.computeBudgetMs ?? 15_000;
    return translationMode === 'full' ? 120_000 : baseBudget;
  }, [translationConfig?.computeBudgetMs, translationMode]);

  // Effective model ID depends on backend
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const effectiveModelId = useMemo(
    () => aiBackend === 'openai'
      ? (openAiModel.trim() || 'gpt-4o-mini')
      : (loadedModelId ?? desiredModelId),
    [aiBackend, desiredModelId, openAiModel, loadedModelId]
  );

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo<AIContextValue>(() => ({
    // Translation Settings
    translationEnabled,
    setTranslationEnabled,
    translationMode,
    setTranslationMode,
    translationDialogOpen,
    setTranslationDialogOpen,

    // Model Settings
    aiModelPreset,
    setAiModelPreset,

    // Summary Settings
    summaryEnabled,
    setSummaryEnabled,

    // Backend Settings
    aiBackend,
    setAiBackend,
    openAiApiKey,
    setOpenAiApiKey,
    openAiModel,
    setOpenAiModel,
    openAiBaseUrl,
    setOpenAiBaseUrl,

    // Derived Values
    targetLang,
    translationNeeded,
    aiEnabled,
    desiredModelId,
    computeBudgetMs,
    effectiveModelId,

    // Model Presets
    presetToModelId,

    // Config
    translationConfig,
    summaryConfig,
  }), [
    translationEnabled,
    setTranslationEnabled,
    translationMode,
    setTranslationMode,
    translationDialogOpen,
    aiModelPreset,
    setAiModelPreset,
    summaryEnabled,
    setSummaryEnabled,
    aiBackend,
    setAiBackend,
    openAiApiKey,
    setOpenAiApiKey,
    openAiModel,
    setOpenAiModel,
    openAiBaseUrl,
    setOpenAiBaseUrl,
    targetLang,
    translationNeeded,
    aiEnabled,
    desiredModelId,
    computeBudgetMs,
    effectiveModelId,
    presetToModelId,
    translationConfig,
    summaryConfig,
  ]);

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

export default AIContext;
