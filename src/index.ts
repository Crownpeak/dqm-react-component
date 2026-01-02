// Main entry point for the Crownpeak DQM React Component library
export { default as DQMSidebar } from './DQMSidebar';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Type exports
export type { 
  DQMSidebarProps,
  ErrorBoundaryProps,
  AnalysisData, 
  AnalysisState, 
  Checkpoint,
  DQMConfig,
  OAuth2Config,
  AuthMode,
  OverlayConfig,
  OverlayOffsetPosition,
  WebLLMTranslationConfig,
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
  AiBackend,
  AiModelPreset,
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
