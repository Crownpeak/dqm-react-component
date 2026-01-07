// Main entry point for the Crownpeak DQM React Component library
export { default as DQMSidebar } from './DQMSidebar';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// i18n exports - for language switching and custom translations
export { default as i18n, resolveLanguage } from './i18n';
export type { AvailableLanguage, TranslationResources } from './i18n';

// Locale utilities
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, normalizeLocale } from './locale';
export type { SupportedLocale } from './locale';

// Type exports
export type { 
  DQMSidebarProps,
  ErrorBoundaryProps,
  AnalysisData, 
  AnalysisState, 
  Checkpoint,
  DQMConfig,
  AuthMode,
  OverlayConfig,
  OverlayOffsetPosition,
  TranslationConfig,
} from './types';

// Overlay hook exports (for advanced usage)
export { useOverlayResistant } from './utils/useDomPresence';
export type { 
  OverlayInfo, 
  OverlayPosition,
  UseOverlayResistantConfig 
} from './utils/useDomPresence';

// AI Context exports (for advanced usage and custom integrations)
export {
  AIProvider,
  useAI,
  useTranslationCache,
  useAIEngine,
  useAITranslation,
  useAISummary,
} from './context/ai';
export type {
  AIContextValue,
  AIProviderProps,
  TranslationMode,
  TranslationState,
  SummaryState,
  UseTranslationCacheReturn,
  UseAIEngineOptions,
  UseAIEngineReturn,
  UseAITranslationOptions,
  UseAITranslationReturn,
  UseAISummaryOptions,
  UseAISummaryReturn,
  SummaryStats,
} from './context/ai';
