/**
 * Redux Store Slices Tests
 */
import { describe, it, expect } from 'vitest';
import {
  analysisSlice,
  startAnalysis,
  setAssetId,
  analysisCompleted,
  analysisFailed,
  resetAnalysis,
} from '../../store/slices/analysisSlice';
import {
  highlightSlice,
  selectCheckpoint,
  setViewMode,
  nextHighlight,
  previousHighlight,
  closeModal,
} from '../../store/slices/highlightSlice';
import {
  authSlice,
  setCredentials,
  logout,
  setRememberMe,
} from '../../store/slices/authSlice';
import {
  aiSlice,
  setProvider,
  openSettings,
  closeSettings,
  startGeneration,
  generationCompleted,
} from '../../store/slices/aiSlice';
import { createMockCheckpoint } from '../utils';

describe('analysisSlice', () => {
  const reducer = analysisSlice.reducer;
  const initialState = {
    state: 'idle' as const,
    assetId: null,
    data: null,
    error: null,
    isAnalyzing: false,
    startedAt: null,
    completedAt: null,
  };

  it('handles startAnalysis', () => {
    const state = reducer(initialState, startAnalysis());
    expect(state.state).toBe('analyzing');
    expect(state.isAnalyzing).toBe(true);
    expect(state.startedAt).not.toBeNull();
  });

  it('handles setAssetId', () => {
    const state = reducer(initialState, setAssetId('test-asset-123'));
    expect(state.assetId).toBe('test-asset-123');
  });

  it('handles analysisCompleted', () => {
    const mockData = {
      assetId: 'test-123',
      created: new Date().toISOString(),
      siteName: 'Test Site',
      totalCheckpoints: 10,
      totalErrors: 3,
      checkpoints: [createMockCheckpoint()],
    };
    const state = reducer(
      { ...initialState, state: 'analyzing', isAnalyzing: true },
      analysisCompleted(mockData)
    );
    expect(state.state).toBe('completed');
    expect(state.isAnalyzing).toBe(false);
    expect(state.data).toEqual(mockData);
    expect(state.completedAt).not.toBeNull();
  });

  it('handles analysisFailed', () => {
    const state = reducer(
      { ...initialState, state: 'analyzing', isAnalyzing: true },
      analysisFailed('Network error')
    );
    expect(state.state).toBe('error');
    expect(state.isAnalyzing).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('handles resetAnalysis', () => {
    const modifiedState = {
      ...initialState,
      state: 'completed' as const,
      assetId: 'test-123',
      isAnalyzing: false,
    };
    const state = reducer(modifiedState, resetAnalysis());
    expect(state).toEqual(initialState);
  });
});

describe('highlightSlice', () => {
  const reducer = highlightSlice.reducer;
  const initialState = {
    selectedCheckpoint: null,
    viewMode: 'browser' as const,
    showAllHighlights: false,
    currentHighlightIndex: 0,
    totalHighlights: 0,
    visibleHighlightIndex: 0,
    cache: {},
    scrollPositions: {},
    isModalOpen: false,
    isLoading: false,
    error: null,
  };

  it('handles selectCheckpoint', () => {
    const checkpoint = createMockCheckpoint();
    const state = reducer(initialState, selectCheckpoint(checkpoint));
    expect(state.selectedCheckpoint).toEqual(checkpoint);
    expect(state.isModalOpen).toBe(true);
    expect(state.currentHighlightIndex).toBe(0);
  });

  it('handles setViewMode', () => {
    const state = reducer(initialState, setViewMode('source'));
    expect(state.viewMode).toBe('source');
  });

  it('handles nextHighlight', () => {
    const stateWithHighlights = {
      ...initialState,
      totalHighlights: 5,
      currentHighlightIndex: 2,
    };
    const state = reducer(stateWithHighlights, nextHighlight());
    expect(state.currentHighlightIndex).toBe(3);
  });

  it('handles nextHighlight at end', () => {
    const stateWithHighlights = {
      ...initialState,
      totalHighlights: 5,
      currentHighlightIndex: 4,
    };
    const state = reducer(stateWithHighlights, nextHighlight());
    expect(state.currentHighlightIndex).toBe(4); // Should not go beyond
  });

  it('handles previousHighlight', () => {
    const stateWithHighlights = {
      ...initialState,
      currentHighlightIndex: 2,
    };
    const state = reducer(stateWithHighlights, previousHighlight());
    expect(state.currentHighlightIndex).toBe(1);
  });

  it('handles closeModal', () => {
    const openState = {
      ...initialState,
      isModalOpen: true,
      selectedCheckpoint: createMockCheckpoint(),
      showAllHighlights: true,
    };
    const state = reducer(openState, closeModal());
    expect(state.isModalOpen).toBe(false);
    expect(state.selectedCheckpoint).toBeNull();
    expect(state.showAllHighlights).toBe(false);
  });
});

describe('authSlice', () => {
  const reducer = authSlice.reducer;
  const initialState = {
    apiKey: null,
    websiteId: null,
    isAuthenticated: false,
    sessionType: null,
    accessToken: null,
    refreshToken: null,
    rememberMe: false,
    isLoading: false,
    error: null,
    storageWarningAcknowledged: false,
  };

  it('handles setCredentials', () => {
    const state = reducer(
      initialState,
      setCredentials({
        apiKey: 'test-key',
        websiteId: 'test-website',
        rememberMe: true,
      })
    );
    expect(state.apiKey).toBe('test-key');
    expect(state.websiteId).toBe('test-website');
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionType).toBe('direct');
    expect(state.rememberMe).toBe(true);
  });

  it('handles logout', () => {
    const authenticatedState = {
      ...initialState,
      apiKey: 'test-key',
      websiteId: 'test-website',
      isAuthenticated: true,
      sessionType: 'direct' as const,
      rememberMe: true,
    };
    const state = reducer(authenticatedState, logout());
    expect(state.apiKey).toBeNull();
    expect(state.websiteId).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.rememberMe).toBe(true); // Should keep preference
  });

  it('handles setRememberMe', () => {
    const state = reducer(initialState, setRememberMe(true));
    expect(state.rememberMe).toBe(true);
  });
});

describe('aiSlice', () => {
  const reducer = aiSlice.reducer;
  const initialState = {
    settings: {
      provider: 'none' as const,
      openaiApiKey: null,
      openaiModel: 'gpt-4.1-mini',
      enabled: false,
      translationProvider: 'none' as const,
    },
    summaries: {},
    isSettingsOpen: false,
    isGenerating: false,
    generatingFor: null,
    error: null,
  };

  it('handles setProvider', () => {
    const state = reducer(initialState, setProvider('openai'));
    expect(state.settings.provider).toBe('openai');
    expect(state.settings.enabled).toBe(true);
  });

  it('handles openSettings and closeSettings', () => {
    let state = reducer(initialState, openSettings());
    expect(state.isSettingsOpen).toBe(true);
    state = reducer(state, closeSettings());
    expect(state.isSettingsOpen).toBe(false);
  });

  it('handles startGeneration', () => {
    const state = reducer(initialState, startGeneration('checkpoint-123'));
    expect(state.isGenerating).toBe(true);
    expect(state.generatingFor).toBe('checkpoint-123');
    expect(state.error).toBeNull();
  });

  it('handles generationCompleted', () => {
    const generatingState = {
      ...initialState,
      isGenerating: true,
      generatingFor: 'checkpoint-123',
    };
    const state = reducer(
      generatingState,
      generationCompleted({
        checkpointId: 'checkpoint-123',
        summary: 'This is a test summary',
        provider: 'openai',
      })
    );
    expect(state.isGenerating).toBe(false);
    expect(state.generatingFor).toBeNull();
    expect(state.summaries['checkpoint-123']).toBeDefined();
    expect(state.summaries['checkpoint-123'].summary).toBe('This is a test summary');
  });
});
