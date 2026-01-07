/**
 * AI Context - Central configuration and settings for AI features
 *
 * Manages:
 * - Translation settings (enabled, mode)
 * - Summary settings
 * - OpenAI credentials
 * - localStorage synchronization
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import type {
  AIContextValue,
  AIProviderProps,
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
  // OpenAI Settings
  // ============================================================================

  const [openAiApiKey, setOpenAiApiKeyState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return getLocalStorageItem('dqm_openai_apiKey') ?? '';
  });

  const [openAiModel, setOpenAiModelState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'gpt-4.1-mini';
    return getLocalStorageItem('dqm_openai_model') ?? 'gpt-4.1-mini';
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

  const setSummaryEnabled = useCallback((value: boolean) => {
    setSummaryEnabledState(value);
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
    setLocalStorageItem('dqm_ai_summary_enabled', summaryEnabled ? 'true' : 'false');
  }, [summaryEnabled]);

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

  const computeBudgetMs = useMemo(() => {
    const baseBudget = translationConfig?.computeBudgetMs ?? 15_000;
    return translationMode === 'full' ? 120_000 : baseBudget;
  }, [translationConfig?.computeBudgetMs, translationMode]);

  // Effective model ID for OpenAI
  const effectiveModelId = useMemo(
    () => openAiModel.trim() || 'gpt-4.1-mini',
    [openAiModel]
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

    // Summary Settings
    summaryEnabled,
    setSummaryEnabled,

    // OpenAI Settings
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
    computeBudgetMs,
    effectiveModelId,

    // Config
    translationConfig,
    summaryConfig,
  }), [
    translationEnabled,
    setTranslationEnabled,
    translationMode,
    setTranslationMode,
    translationDialogOpen,
    summaryEnabled,
    setSummaryEnabled,
    openAiApiKey,
    setOpenAiApiKey,
    openAiModel,
    setOpenAiModel,
    openAiBaseUrl,
    setOpenAiBaseUrl,
    targetLang,
    translationNeeded,
    aiEnabled,
    computeBudgetMs,
    effectiveModelId,
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
