/**
 * Unit Tests for useAITranslation hook
 *
 * Tests cover:
 * - Debounce behavior to prevent API spam
 * - Summary blocking translation
 * - Automatic restart after summary completes
 * - Cache usage
 * - Abort on unmount
 * - Engine ready state reactivity
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAITranslation } from '../../context/ai/useAITranslation';
import type {
  UseAITranslationOptions,
  UseAIEngineReturn,
  UseTranslationCacheReturn,
} from '../../context/ai/types';
import type { AnalysisData, Checkpoint } from '../../types';
import type { TranslationCache } from '../../utils/translationCache';

// Mock the translation utility
vi.mock('../../utils/translationUtils', () => ({
  translateDqmResults: vi.fn(),
}));

// Mock logger to prevent console noise
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Get the mocked function for assertions
import { translateDqmResults } from '../../utils/translationUtils';
const mockTranslateDqmResults = vi.mocked(translateDqmResults);

// Helper to create mock checkpoint
function createMockCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: 'checkpoint-1',
    name: 'Test Checkpoint',
    description: 'Test description',
    reference: 'https://example.com',
    number: 1,
    categoryNumber: 1,
    category: 'Accessibility',
    priority: true,
    failed: true,
    topics: ['accessibility'],
    canHighlight: { page: true, source: true },
    restricted: false,
    checkpointType: {
      name: 'accessibility',
      modifiedBy: 'system',
      modified: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    colors: { bg: '#fee2e2', text: '#dc2626' },
    ...overrides,
  };
}

// Helper to create mock analysis data
function createMockAnalysisData(overrides: Partial<AnalysisData> = {}): AnalysisData {
  return {
    assetId: 'test-asset-123',
    created: new Date().toISOString(),
    siteName: 'Test Site',
    totalCheckpoints: 50,
    totalErrors: 5,
    checkpoints: [createMockCheckpoint()],
    ...overrides,
  };
}

// Helper to create mock engine
function createMockEngine(overrides: Partial<UseAIEngineReturn> = {}): UseAIEngineReturn {
  return {
    client: {
      send: vi.fn(),
      interrupt: vi.fn(),
    } as unknown as UseAIEngineReturn['client'],
    state: 'ready',
    loadedModelId: 'gpt-4.1-mini',
    isReady: true,
    error: null,
    runWithLock: vi.fn((task) => task()),
    stop: vi.fn(),
    ...overrides,
  };
}

// Helper to create mock cache manager
function createMockCacheManager(overrides: Partial<UseTranslationCacheReturn> = {}): UseTranslationCacheReturn {
  return {
    cache: {
      getCheckpointMany: vi.fn().mockResolvedValue([]),
      putCheckpointMany: vi.fn().mockResolvedValue(undefined),
      deleteCheckpointMany: vi.fn().mockResolvedValue(undefined),
      getSummary: vi.fn().mockResolvedValue(null),
      putSummary: vi.fn().mockResolvedValue(undefined),
      clearAll: vi.fn().mockResolvedValue(undefined),
    } as unknown as TranslationCache,
    assetCache: new Map(),
    storagePersisted: true,
    refreshStorageState: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    clearAssetCache: vi.fn(),
    ...overrides,
  };
}

// Helper to create mock persistent cache
function createMockPersistentCache(): TranslationCache {
  return {
    getCheckpointMany: vi.fn().mockResolvedValue([]),
    putCheckpointMany: vi.fn().mockResolvedValue(undefined),
    deleteCheckpointMany: vi.fn().mockResolvedValue(undefined),
    getSummary: vi.fn().mockResolvedValue(null),
    putSummary: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  } as unknown as TranslationCache;
}

// Helper to create default options
function createDefaultOptions(overrides: Partial<UseAITranslationOptions> = {}): UseAITranslationOptions {
  return {
    engine: createMockEngine(),
    cacheManager: createMockCacheManager(),
    originalData: createMockAnalysisData(),
    targetLang: 'de',
    modelId: 'gpt-4.1-mini',
    enabled: true,
    mode: 'full',
    computeBudgetMs: 30000,
    persistentCache: createMockPersistentCache(),
    summaryGenerating: false,
    ...overrides,
  };
}

describe('useAITranslation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTranslateDqmResults.mockReset();
    // Default successful translation
    mockTranslateDqmResults.mockResolvedValue({
      data: createMockAnalysisData(),
      progress: { translatedCheckpoints: 1, totalCheckpoints: 1, isPartial: false },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Debounce Behavior', () => {
    it('should debounce translation start by 300ms', async () => {
      const options = createDefaultOptions();

      const { result } = renderHook(() => useAITranslation(options));

      // Initially not translating
      expect(result.current.isTranslating).toBe(false);
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Advance timer by 299ms - should not have started yet
      await act(async () => {
        vi.advanceTimersByTime(299);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Advance by 1 more ms to reach 300ms - should start now
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer when dependencies change rapidly', async () => {
      const options = createDefaultOptions();

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Advance 200ms
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Change target language - should reset timer
      rerender({ ...options, targetLang: 'fr' });

      // Advance another 200ms (400ms total, but only 200ms since last change)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Advance to complete the new 300ms debounce
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should cancel debounce timer on unmount', async () => {
      const options = createDefaultOptions();

      const { unmount } = renderHook(() => useAITranslation(options));

      // Advance 200ms
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Unmount before debounce completes
      unmount();

      // Advance past debounce time
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should NOT have been called because component unmounted
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
    });
  });

  describe('Summary Blocking', () => {
    it('should not start translation while summary is generating', async () => {
      const options = createDefaultOptions({ summaryGenerating: true });

      renderHook(() => useAITranslation(options));

      // Advance well past debounce time
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should NOT have been called because summary is generating
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
    });

    it('should allow translation to start when summary is false', async () => {
      const options = createDefaultOptions({ summaryGenerating: false });

      renderHook(() => useAITranslation(options));

      // Advance past debounce time
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should retry translation when summaryGenerating changes from true to false', async () => {
      const options = createDefaultOptions({ summaryGenerating: true });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Advance past debounce - translation should not start
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Summary finishes
      rerender({ ...options, summaryGenerating: false });

      // Advance past debounce for new attempt
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Now translation should have been called
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('Engine Ready Reactivity', () => {
    it('should not start translation when engine is not ready', async () => {
      const engine = createMockEngine({ isReady: false, client: null });
      const options = createDefaultOptions({ engine });

      renderHook(() => useAITranslation(options));

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
    });

    it('should start translation when engine becomes ready', async () => {
      const engine = createMockEngine({ isReady: false, client: null });
      const options = createDefaultOptions({ engine });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Advance past debounce - should not start
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Engine becomes ready
      const readyEngine = createMockEngine({ isReady: true });
      rerender({ ...options, engine: readyEngine });

      // Advance past debounce for new attempt
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Usage', () => {
    it('should use cached data and skip API call', async () => {
      const cachedData = createMockAnalysisData({ totalErrors: 10 });
      const assetCache = new Map([['test-asset-123:de:gpt-4.1-mini', cachedData]]);
      const cacheManager = createMockCacheManager({ assetCache });
      const options = createDefaultOptions({ cacheManager });

      const { result } = renderHook(() => useAITranslation(options));

      // Advance timer - cache hit should be immediate (no debounce for cache)
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Should have used cached data
      expect(result.current.translatedData).toEqual(cachedData);
      expect(result.current.progress?.translatedCheckpoints).toBe(1);

      // API should NOT have been called
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should not translate when disabled', async () => {
      const options = createDefaultOptions({ enabled: false });

      const { result } = renderHook(() => useAITranslation(options));

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
      expect(result.current.translatedData).toBeNull();
    });

    it('should not translate when target language is English', async () => {
      const options = createDefaultOptions({ targetLang: 'en' });

      const { result } = renderHook(() => useAITranslation(options));

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockTranslateDqmResults).not.toHaveBeenCalled();
      // Should have set original data
      expect(result.current.translatedData).not.toBeNull();
    });
  });

  describe('No Duplicate API Calls', () => {
    it('should not call API twice for same runKey', async () => {
      const options = createDefaultOptions();

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // First run
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);

      // Wait for completion
      await act(async () => {
        await Promise.resolve();
      });

      // Rerender with same props
      rerender(options);

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should still be only 1 call (deduplication via hasRunForKeyRef)
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('Restart Functionality', () => {
    it('should allow restart after completion', async () => {
      const options = createDefaultOptions();

      const { result } = renderHook(() => useAITranslation(options));

      // Complete first run
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);

      // Call restart
      await act(async () => {
        result.current.restart();
      });

      // Advance past debounce for new run
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should have been called again
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(2);
    });
  });
});
