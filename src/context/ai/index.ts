/**
 * AI Context - Re-exports
 *
 * Central module for all AI-related functionality.
 */

// Context & Provider
export { AIProvider, useAI, default as AIContext } from './AIContext';

// Hooks
export { useTranslationCache } from './useTranslationCache';
export { useAIEngine } from './useAIEngine';
export { useAITranslation } from './useAITranslation';
export { useAISummary } from './useAISummary';

// Types
export type {
  // Backend & Model Types
  AiBackend,
  AiModelPreset,
  TranslationMode,
  TranslationState,
  SummaryState,
  // Hook Options & Returns
  UseTranslationCacheReturn,
  UseAIEngineOptions,
  UseAIEngineReturn,
  UseAITranslationOptions,
  UseAITranslationReturn,
  UseAISummaryOptions,
  UseAISummaryReturn,
  SummaryStats,
  // Context Types
  AIContextValue,
  AIProviderProps,
} from './types';
