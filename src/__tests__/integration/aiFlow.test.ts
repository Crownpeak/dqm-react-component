/**
 * Integration Tests for AI Summary → Translation Flow
 *
 * Tests the coordination between summary and translation:
 * - Translation waits for summary to complete
 * - Translation automatically starts after summary finishes
 * - API is not called multiple times (cost protection)
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

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { translateDqmResults } from '../../utils/translationUtils';
const mockTranslateDqmResults = vi.mocked(translateDqmResults);

// Helpers (same as unit tests)
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

describe('AI Summary → Translation Flow Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTranslateDqmResults.mockReset();
    mockTranslateDqmResults.mockResolvedValue({
      data: createMockAnalysisData(),
      progress: { translatedCheckpoints: 1, totalCheckpoints: 1, isPartial: false },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Summary → Translation Sequence', () => {
    it('should wait for summary then start translation automatically', async () => {
      // Start with summary generating
      const options = createDefaultOptions({ summaryGenerating: true });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Phase 1: Summary is running - translation should not start
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Phase 2: Summary finishes
      rerender({ ...options, summaryGenerating: false });

      // Phase 3: Translation should start after debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should only call API once for complete summary→translation flow', async () => {
      const options = createDefaultOptions({ summaryGenerating: true });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Summary phase (simulate multiple renders during summary)
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      rerender({ ...options, summaryGenerating: true }); // Still running
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      rerender({ ...options, summaryGenerating: true }); // Still running
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Summary finishes
      rerender({ ...options, summaryGenerating: false });

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });

      // Should only be called once despite multiple renders
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);

      // Additional renders should not trigger more calls
      rerender({ ...options, summaryGenerating: false });
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Still only 1 call
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Cost Protection', () => {
    it('should not spam API when toggling between summary states rapidly', async () => {
      const options = createDefaultOptions({ summaryGenerating: false });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Rapid toggles (simulating unstable state)
      for (let i = 0; i < 10; i++) {
        rerender({ ...options, summaryGenerating: true });
        await act(async () => {
          vi.advanceTimersByTime(50);
        });
        rerender({ ...options, summaryGenerating: false });
        await act(async () => {
          vi.advanceTimersByTime(50);
        });
      }

      // Wait for final debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });

      // Should only have been called once (debounce + deduplication)
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should respect debounce even with engine ready state changes', async () => {
      const engineNotReady = createMockEngine({ isReady: false, client: null });
      const engineReady = createMockEngine({ isReady: true });
      const options = createDefaultOptions({ engine: engineNotReady });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Engine not ready
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Engine becomes ready
      rerender({ ...options, engine: engineReady });

      // Should wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Complete debounce
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);
    });

    it('should abort pending translation when summary starts again', async () => {
      const options = createDefaultOptions({ summaryGenerating: false });

      const { rerender, result } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options }
      );

      // Start translation (wait less than debounce)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // Summary starts again (should cancel pending translation)
      rerender({ ...options, summaryGenerating: true });

      // Even after long wait, translation should not start
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      expect(mockTranslateDqmResults).not.toHaveBeenCalled();

      // The result should not have errors from cancelled operations
      expect(result.current.error).toBeNull();
    });
  });

  describe('Multiple Asset Handling', () => {
    it('should translate different assets independently', async () => {
      const asset1Data = createMockAnalysisData({ assetId: 'asset-1' });
      const asset2Data = createMockAnalysisData({ assetId: 'asset-2' });

      const options1 = createDefaultOptions({ originalData: asset1Data });

      const { rerender } = renderHook(
        (props: UseAITranslationOptions) => useAITranslation(props),
        { initialProps: options1 }
      );

      // First asset translation
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(1);

      // Switch to second asset
      const options2 = createDefaultOptions({ originalData: asset2Data });
      rerender(options2);

      // Second asset should trigger new translation
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });
      expect(mockTranslateDqmResults).toHaveBeenCalledTimes(2);
    });
  });
});
