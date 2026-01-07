/**
 * Types for AI Context and Hooks
 */

import type { AnalysisData } from '../../types';
import type { TranslationProgress, SummaryStats } from '../../utils/translationUtils';
import type { JsonChatClient } from '../../utils/aiJsonClient';
import type { TranslationCache } from '../../utils/translationCache';

// ============================================================================
// AI Backend & Model Types
// ============================================================================

export type AiBackend = 'openai';
export type TranslationMode = 'fast' | 'full';
export type TranslationState = 'disabled' | 'initializing' | 'ready' | 'translating' | 'error';
export type SummaryState = 'idle' | 'generating' | 'ready' | 'error';

// ============================================================================
// Translation Cache Hook Types
// ============================================================================

export interface UseTranslationCacheReturn {
  /** The IndexedDB-backed translation cache instance */
  cache: TranslationCache;
  /** In-memory cache for translated analysis data per asset */
  assetCache: Map<string, AnalysisData>;
  /** Whether storage is persisted (survives browser eviction) */
  storagePersisted: boolean | null;
  /** Refresh the storage persistence state */
  refreshStorageState: () => Promise<void>;
  /** Clear all cached translations (both IndexedDB and in-memory) */
  clearAll: () => Promise<void>;
  /** Clear in-memory asset cache only */
  clearAssetCache: () => void;
}

// ============================================================================
// AI Engine Hook Types
// ============================================================================

export interface UseAIEngineOptions {
  /** Whether AI features are enabled */
  enabled: boolean;
  /** OpenAI API key (required) */
  openAiApiKey?: string;
  /** OpenAI model name */
  openAiModel?: string;
  /** OpenAI base URL */
  openAiBaseUrl?: string;
}

export interface UseAIEngineReturn {
  /** The AI client (OpenAI) */
  client: JsonChatClient | null;
  /** Current engine state */
  state: TranslationState;
  /** Currently loaded model ID */
  loadedModelId: string | null;
  /** Whether the engine is ready for inference */
  isReady: boolean;
  /** Error message if state is 'error' */
  error: string | null;
  /** Run a task with exclusive engine access (prevents concurrent calls) */
  runWithLock: <T>(task: () => Promise<T>) => Promise<T>;
  /** Stop any ongoing AI operation */
  stop: () => void;
}

// ============================================================================
// AI Translation Hook Types
// ============================================================================

export interface UseAITranslationOptions {
  /** AI engine hook return value */
  engine: UseAIEngineReturn;
  /** Translation cache hook return value */
  cacheManager: UseTranslationCacheReturn;
  /** Original (untranslated) analysis data */
  originalData: AnalysisData | null;
  /** Target language code (e.g., 'de', 'fr') */
  targetLang: string;
  /** Model ID being used */
  modelId: string;
  /** Whether translation is enabled */
  enabled: boolean;
  /** Translation mode (fast = budget limited, full = complete) */
  mode: TranslationMode;
  /** Compute budget in milliseconds */
  computeBudgetMs: number;
  /** IndexedDB translation cache */
  persistentCache: TranslationCache;
  /** Whether summary is currently generating (translation waits) */
  summaryGenerating?: boolean;
}

export interface UseAITranslationReturn {
  /** Translated analysis data (or original if not translated) */
  translatedData: AnalysisData | null;
  /** Translation progress */
  progress: TranslationProgress | null;
  /** Error message */
  error: string | null;
  /** Set of checkpoint IDs currently being translated */
  translatingIds: Set<string>;
  /** Set of checkpoint IDs that have been translated */
  translatedIds: Set<string>;
  /** Whether translation is in progress */
  isTranslating: boolean;
  /** Restart translation (clears cache for current asset) */
  restart: () => void;
  /** Stop ongoing translation */
  stop: () => void;
  /** Retry translation for a single checkpoint */
  retrySingleCheckpoint: (checkpointId: string) => Promise<void>;
  /** Reset to original data and clear filters */
  resetToOriginal: () => void;
  /** Callback to update analysis data (for parent component) */
  onDataChange?: (data: AnalysisData | null, categories: [string, AnalysisData['checkpoints']][]) => void;
}

// ============================================================================
// AI Summary Hook Types
// ============================================================================

export interface UseAISummaryOptions {
  /** AI engine hook return value */
  engine: UseAIEngineReturn;
  /** Original analysis data */
  originalData: AnalysisData | null;
  /** Target language for summary */
  targetLang: string;
  /** Model ID being used */
  modelId: string;
  /** Whether summary is enabled */
  enabled: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Whether translation is currently in progress */
  translationInProgress?: boolean;
  /** Translation cache for summary caching */
  cache: TranslationCache;
}

export interface UseAISummaryReturn {
  /** Current summary state */
  state: SummaryState;
  /** Generated bullet points */
  bullets: string[] | null;
  /** Error message */
  error: string | null;
  /** Stats for last summary run */
  stats: SummaryStats | null;
  /** Restart summary generation */
  restart: () => void;
}

export type { SummaryStats } from '../../utils/translationUtils';

// ============================================================================
// AI Context Types
// ============================================================================

export interface AIContextValue {
  // Translation Settings
  translationEnabled: boolean;
  setTranslationEnabled: (value: boolean) => void;
  translationMode: TranslationMode;
  setTranslationMode: (value: TranslationMode) => void;
  translationDialogOpen: boolean;
  setTranslationDialogOpen: (value: boolean) => void;

  // Summary Settings
  summaryEnabled: boolean;
  setSummaryEnabled: (value: boolean) => void;

  // OpenAI Settings
  openAiApiKey: string;
  setOpenAiApiKey: (value: string) => void;
  openAiModel: string;
  setOpenAiModel: (value: string) => void;
  openAiBaseUrl: string;
  setOpenAiBaseUrl: (value: string) => void;

  // Derived Values
  targetLang: string;
  translationNeeded: boolean;
  aiEnabled: boolean;
  computeBudgetMs: number;
  effectiveModelId: string;

  // Config (from props)
  translationConfig?: {
    enabledByDefault?: boolean;
    computeBudgetMs?: number;
  };
  summaryConfig?: {
    timeoutMs?: number;
  };
}

export interface AIProviderProps {
  children: React.ReactNode;
  /** Translation configuration from DQMConfig */
  translationConfig?: AIContextValue['translationConfig'];
  /** Summary configuration */
  summaryConfig?: AIContextValue['summaryConfig'];
}
