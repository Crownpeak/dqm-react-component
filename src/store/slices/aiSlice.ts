/**
 * AI Redux Slice
 *
 * Manages AI feature state including settings, summaries, and translation.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReasoningEffort } from '../../utils/modelCapabilities';

export type AIProvider = 'openai' | 'none';
export type TranslationProvider = 'openai' | 'none';

export interface AISettings {
  /** AI provider for summaries */
  provider: AIProvider;
  /** OpenAI API key (if using OpenAI) */
  openaiApiKey: string | null;
  /** OpenAI model */
  openaiModel: string;
  /** Whether AI features are enabled */
  enabled: boolean;
  /** Translation provider */
  translationProvider: TranslationProvider;
  /** Reasoning effort for GPT-5 models */
  reasoningEffort: ReasoningEffort;
}

export interface AISummary {
  /** Checkpoint ID this summary is for */
  checkpointId: string;
  /** Generated summary text */
  summary: string;
  /** When the summary was generated */
  generatedAt: number;
  /** Provider used to generate */
  provider: AIProvider;
}

export interface AISliceState {
  /** AI settings */
  settings: AISettings;
  /** Cached summaries by checkpoint ID */
  summaries: Record<string, AISummary>;
  /** Whether settings dialog is open */
  isSettingsOpen: boolean;
  /** Whether AI is currently generating */
  isGenerating: boolean;
  /** Current generation target (checkpoint ID) */
  generatingFor: string | null;
  /** Error message if generation failed */
  error: string | null;
}

const initialSettings: AISettings = {
  provider: 'none',
  openaiApiKey: null,
  openaiModel: 'gpt-5.2',
  enabled: false,
  translationProvider: 'none',
  reasoningEffort: 'low',
};

const initialState: AISliceState = {
  settings: initialSettings,
  summaries: {},
  isSettingsOpen: false,
  isGenerating: false,
  generatingFor: null,
  error: null,
};

/** Storage keys for AI settings */
const AI_STORAGE_KEYS = {
  provider: 'dqm_ai_provider',
  openaiApiKey: 'dqm_openai_apiKey',
  openaiModel: 'dqm_openai_model',
  translationProvider: 'dqm_translation_provider',
  reasoningEffort: 'dqm_reasoning_effort',
} as const;

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    /** Update AI settings */
    updateSettings: (state, action: PayloadAction<Partial<AISettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      // Auto-enable if provider is set
      if (action.payload.provider && action.payload.provider !== 'none') {
        state.settings.enabled = true;
      }
    },

    /** Set AI provider */
    setProvider: (state, action: PayloadAction<AIProvider>) => {
      state.settings.provider = action.payload;
      state.settings.enabled = action.payload !== 'none';
    },

    /** Set OpenAI API key */
    setOpenAIApiKey: (state, action: PayloadAction<string | null>) => {
      state.settings.openaiApiKey = action.payload;
    },

    /** Set OpenAI model */
    setOpenAIModel: (state, action: PayloadAction<string>) => {
      state.settings.openaiModel = action.payload;
    },

    /** Set translation provider */
    setTranslationProvider: (state, action: PayloadAction<TranslationProvider>) => {
      state.settings.translationProvider = action.payload;
    },

    /** Set reasoning effort (for GPT-5 models) */
    setReasoningEffort: (state, action: PayloadAction<ReasoningEffort>) => {
      state.settings.reasoningEffort = action.payload;
    },

    /** Open settings dialog */
    openSettings: (state) => {
      state.isSettingsOpen = true;
    },

    /** Close settings dialog */
    closeSettings: (state) => {
      state.isSettingsOpen = false;
    },

    /** Toggle settings dialog */
    toggleSettings: (state) => {
      state.isSettingsOpen = !state.isSettingsOpen;
    },

    /** Start generating summary */
    startGeneration: (state, action: PayloadAction<string>) => {
      state.isGenerating = true;
      state.generatingFor = action.payload;
      state.error = null;
    },

    /** Generation completed successfully */
    generationCompleted: (
      state,
      action: PayloadAction<{
        checkpointId: string;
        summary: string;
        provider: AIProvider;
      }>
    ) => {
      state.isGenerating = false;
      state.generatingFor = null;
      state.summaries[action.payload.checkpointId] = {
        checkpointId: action.payload.checkpointId,
        summary: action.payload.summary,
        generatedAt: Date.now(),
        provider: action.payload.provider,
      };
    },

    /** Generation failed */
    generationFailed: (state, action: PayloadAction<string>) => {
      state.isGenerating = false;
      state.generatingFor = null;
      state.error = action.payload;
    },

    /** Clear error */
    clearError: (state) => {
      state.error = null;
    },

    /** Clear all summaries */
    clearSummaries: (state) => {
      state.summaries = {};
    },

    /** Clear specific summary */
    clearSummary: (state, action: PayloadAction<string>) => {
      delete state.summaries[action.payload];
    },

    /** Reset AI state */
    resetAI: () => initialState,

    /** Hydrate settings from storage */
    hydrateSettings: (
      state,
      action: PayloadAction<{
        provider?: AIProvider;
        openaiApiKey?: string | null;
        openaiModel?: string;
        translationProvider?: TranslationProvider;
        reasoningEffort?: ReasoningEffort;
      }>
    ) => {
      if (action.payload.provider) {
        state.settings.provider = action.payload.provider;
        state.settings.enabled = action.payload.provider !== 'none';
      }
      if (action.payload.openaiApiKey !== undefined) {
        state.settings.openaiApiKey = action.payload.openaiApiKey;
      }
      if (action.payload.openaiModel) {
        state.settings.openaiModel = action.payload.openaiModel;
      }
      if (action.payload.translationProvider) {
        state.settings.translationProvider = action.payload.translationProvider;
      }
      if (action.payload.reasoningEffort) {
        state.settings.reasoningEffort = action.payload.reasoningEffort;
      }
    },
  },
});

export const {
  updateSettings,
  setProvider,
  setOpenAIApiKey,
  setOpenAIModel,
  setTranslationProvider,
  setReasoningEffort,
  openSettings,
  closeSettings,
  toggleSettings,
  startGeneration,
  generationCompleted,
  generationFailed,
  clearError,
  clearSummaries,
  clearSummary,
  resetAI,
  hydrateSettings,
} = aiSlice.actions;

export default aiSlice.reducer;

// Selectors
export const selectAISettings = (state: { ai: AISliceState }) => state.ai.settings;
export const selectAIProvider = (state: { ai: AISliceState }) => state.ai.settings.provider;
export const selectAIEnabled = (state: { ai: AISliceState }) => state.ai.settings.enabled;
export const selectOpenAIApiKey = (state: { ai: AISliceState }) => state.ai.settings.openaiApiKey;
export const selectOpenAIModel = (state: { ai: AISliceState }) => state.ai.settings.openaiModel;
export const selectReasoningEffort = (state: { ai: AISliceState }) => state.ai.settings.reasoningEffort;
export const selectTranslationProvider = (state: { ai: AISliceState }) =>
  state.ai.settings.translationProvider;
export const selectIsSettingsOpen = (state: { ai: AISliceState }) => state.ai.isSettingsOpen;
export const selectIsGenerating = (state: { ai: AISliceState }) => state.ai.isGenerating;
export const selectGeneratingFor = (state: { ai: AISliceState }) => state.ai.generatingFor;
export const selectAIError = (state: { ai: AISliceState }) => state.ai.error;
export const selectAllSummaries = (state: { ai: AISliceState }) => state.ai.summaries;
export const selectSummary = (checkpointId: string) => (state: { ai: AISliceState }) =>
  state.ai.summaries[checkpointId] || null;

// Storage keys export
export { AI_STORAGE_KEYS };
