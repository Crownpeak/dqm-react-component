/**
 * useAnalysis Hook
 *
 * Manages the DQM analysis lifecycle: starting analysis, polling for results,
 * and handling errors and authentication.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { AnalysisData, AnalysisState, SessionType } from '../types';
import { getLocalStorageItem } from '../utils/localStorage';
import { getCategoryColor } from '../utils/colors/GenerateCategoryColors';
import { logger } from '../utils/logger';

export interface UseAnalysisConfig {
  /** Session type (direct API or backend proxy) */
  sessionType: SessionType;
  /** Session token for backend mode */
  sessionToken: string | null;
  /** Credentials for direct mode */
  credentials: { apiKey: string; websiteId: string } | null;
  /** Auth backend URL for backend mode */
  authBackendUrl?: string;
  /** Debug HTML for testing (bypasses actual page HTML) */
  debugHtml?: string;
  /** Callback when auth error occurs */
  onAuthError?: (error: unknown) => void;
}

export interface UseAnalysisReturn {
  /** Current analysis state */
  state: AnalysisState;
  /** Analysis data when completed */
  data: AnalysisData | null;
  /** Original analysis data (before translation) */
  originalData: AnalysisData | null;
  /** Error message if analysis failed */
  error: string | null;
  /** Current asset ID being polled */
  assetId: string | null;
  /** Grouped checkpoints by category */
  groupedCategories: [string, AnalysisData['checkpoints']][];
  /** Start a new analysis */
  startAnalysis: () => Promise<void>;
  /** Reset analysis state */
  resetAnalysis: () => void;
  /** Set analysis data (for translation updates) */
  setData: (data: AnalysisData | null) => void;
  /** Stop polling */
  stopPolling: () => void;
}

export function useAnalysis(config: UseAnalysisConfig): UseAnalysisReturn {
  const {
    sessionType,
    sessionToken,
    credentials,
    authBackendUrl,
    debugHtml,
    onAuthError,
  } = config;

  const [state, setState] = useState<AnalysisState>('idle');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [originalData, setOriginalData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [groupedCategories, setGroupedCategories] = useState<[string, AnalysisData['checkpoints']][]>([]);

  const assetIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to update asset ID with ref sync
  const updateAssetId = useCallback((id: string | null) => {
    assetIdRef.current = id;
    setAssetId(id);
  }, []);

  // Get API base URL based on session type
  const getApiBaseUrl = useCallback((): string => {
    if (sessionType === 'backend' && authBackendUrl) {
      return authBackendUrl;
    }
    return 'https://api.crownpeak.net/dqm-cms/v1';
  }, [sessionType, authBackendUrl]);

  // Get API headers based on session type
  const getApiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (sessionType === 'backend') {
      const token = sessionToken || getLocalStorageItem('dqm_sessionToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      const apiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
    }

    return headers;
  }, [sessionType, sessionToken, credentials]);

  // Validate API key contains only ASCII characters
  const validateApiKeyEncoding = (apiKey: string): void => {
    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
      throw new Error('API key contains non-ASCII characters and cannot be used in HTTP headers');
    }
  };

  // Optimize HTML for analysis
  const optimizeHtmlForAnalysis = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const selectorsToRemove = [
      '.MuiDrawer-root',
      '#dqm-widget-host',
      '[data-block-handle="dqm_quality_analysis"]',
      '#dqm-quality-analysis-script',
      '#PBarNextFrameWrapper',
    ];

    selectorsToRemove.forEach((selector) => {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      } catch (e: unknown) {
        logger.warn('Could not process selector:', selector, (e as Error).message);
      }
    });

    const optimized = doc.documentElement.outerHTML;
    const originalSize = html.length;
    const optimizedSize = optimized.length;
    const reduction = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

    logger.debug(`HTML optimization: ${originalSize} → ${optimizedSize} bytes (${reduction}% reduction)`);

    if (optimizedSize > 1024 * 1024) {
      logger.warn(`Optimized HTML still large: ${(optimizedSize / 1024 / 1024).toFixed(1)}MB`);
    }

    return optimized;
  };

  // Group checkpoints by category and assign colors
  const groupCheckpointsByCategory = useCallback((checkpoints: AnalysisData['checkpoints']) => {
    const categories = checkpoints.reduce(
      (acc, checkpoint) => {
        if (!acc[checkpoint.category]) {
          acc[checkpoint.category] = [];
        }
        acc[checkpoint.category].push(checkpoint);
        return acc;
      },
      {} as Record<string, AnalysisData['checkpoints']>
    );

    Object.entries(categories).forEach(([category, cps]) => {
      cps.forEach((cp) => {
        cp.colors = getCategoryColor(category, Object.keys(categories));
      });
    });

    return categories;
  }, []);

  // Poll analysis status
  const pollAnalysisStatus = useCallback(
    async (currentAssetId: string, attempt: number = 0): Promise<void> => {
      logger.debug('Polling analysis status, attempt', attempt + 1, 'for assetId:', currentAssetId);

      const maxAttempts = 30;
      const baseDelay = 2000;
      const maxDelay = 10000;

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let statusUrl: string;

        if (sessionType === 'backend') {
          statusUrl = `${baseUrl}/dqm/assets/${currentAssetId}/status`;
        } else {
          const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
          if (!dqmApiKey) {
            throw new Error('DQM API key not available for polling');
          }
          validateApiKeyEncoding(dqmApiKey);
          const encodedApiKey = encodeURIComponent(dqmApiKey);
          statusUrl = `${baseUrl}/assets/${currentAssetId}/status?apiKey=${encodedApiKey}`;
        }

        const response = await axios.get(statusUrl, {
          headers,
          timeout: 10000,
        });

        const result = response.data;

        const hasCheckpoints = result.checkpoints && Array.isArray(result.checkpoints);
        const isComplete =
          hasCheckpoints &&
          result.totalCheckpoints !== undefined &&
          result.checkpoints.length === result.totalCheckpoints;

        if (isComplete) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          const nextData: AnalysisData = {
            assetId: result.assetId || result.id,
            created: result.created,
            siteName: result.siteName,
            totalCheckpoints: result.totalCheckpoints,
            totalErrors: result.totalErrors,
            checkpoints: result.checkpoints || [],
          };

          setOriginalData(nextData);
          setData(nextData);
          setGroupedCategories(Object.entries(groupCheckpointsByCategory(result.checkpoints || [])));
          setState('completed');
          updateAssetId(null);
          logger.debug('Analysis completed:', result.checkpoints.length, '/', result.totalCheckpoints, 'checkpoints');
        } else if (result.status === 'failed' || result.status === 'error') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError(result.error || result.message || 'Analysis failed with unknown error');
          setGroupedCategories([]);
          setState('error');
          updateAssetId(null);
        } else {
          const currentCount = hasCheckpoints ? result.checkpoints.length : 0;
          const totalCount = result.totalCheckpoints || '?';
          logger.debug('Analysis in progress:', currentCount, '/', totalCount, 'checkpoints');

          if (error) {
            setError(null);
          }
        }
      } catch (err) {
        logger.error('Polling failed:', err);

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          onAuthError?.(err);
          return;
        }

        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
          setTimeout(() => pollAnalysisStatus(currentAssetId, attempt + 1), delay);
        } else {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError('Analysis polling failed after maximum attempts');
          setGroupedCategories([]);
          setState('error');
          updateAssetId(null);
        }
      }
    },
    [getApiBaseUrl, getApiHeaders, sessionType, credentials, error, onAuthError, updateAssetId, groupCheckpointsByCategory]
  );

  // Start polling
  const startPolling = useCallback(
    (newAssetId: string): void => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      logger.debug('Starting polling for assetId:', newAssetId);

      pollAnalysisStatus(newAssetId);

      const interval = setInterval(() => {
        if (assetIdRef.current) {
          pollAnalysisStatus(newAssetId);
        } else {
          clearInterval(interval);
          if (pollingIntervalRef.current === interval) {
            pollingIntervalRef.current = null;
          }
        }
      }, 3000);

      pollingIntervalRef.current = interval;
    },
    [pollAnalysisStatus]
  );

  // Stop polling
  const stopPolling = useCallback((): void => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    updateAssetId(null);
  }, [updateAssetId]);

  // Start analysis
  const startAnalysis = useCallback(async (): Promise<void> => {
    setState('analyzing');
    setError(null);
    setData(null);
    setOriginalData(null);

    try {
      if (sessionType === 'backend') {
        const token = sessionToken || getLocalStorageItem('dqm_sessionToken');
        if (!token) {
          setState('idle');
          logger.warn('Cannot start analysis: No session token available');
          return;
        }
      } else {
        const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
        const dqmWebsiteId = credentials?.websiteId || getLocalStorageItem('dqm_websiteID');

        if (!dqmApiKey || !dqmWebsiteId) {
          setState('idle');
          logger.warn('Cannot start analysis: No credentials available');
          return;
        }

        validateApiKeyEncoding(dqmApiKey);
      }

      let htmlToAnalyze: string;
      if (debugHtml) {
        logger.warn('DEBUG MODE: Using custom HTML from debugHtml prop');
        htmlToAnalyze = debugHtml;
      } else {
        htmlToAnalyze = document.documentElement.outerHTML;
      }

      const optimizedHtml = optimizeHtmlForAnalysis(htmlToAnalyze);

      const baseUrl = getApiBaseUrl();
      const headers = getApiHeaders();

      let apiUrl: string;
      let requestData: unknown;

      if (sessionType === 'backend') {
        apiUrl = `${baseUrl}/dqm/assets`;
        requestData = {
          html: optimizedHtml,
          url: window.location.href,
        };
      } else {
        const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
        const dqmWebsiteId = credentials?.websiteId || getLocalStorageItem('dqm_websiteID');
        const encodedApiKey = encodeURIComponent(dqmApiKey!);

        apiUrl = `${baseUrl}/assets?apiKey=${encodedApiKey}`;
        requestData = {
          websiteId: dqmWebsiteId,
          content: optimizedHtml,
          contentType: 'text/html; charset=UTF-8',
          title: document.title,
          timestamp: new Date().toISOString(),
        };

        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response = await axios.post(apiUrl, requestData, {
        headers,
        timeout: 30000,
      });

      const newAssetId = response.data?.assetId || response.data?.id;

      if (newAssetId) {
        updateAssetId(newAssetId);
        startPolling(newAssetId);
      } else {
        throw new Error('No Asset ID returned from API');
      }
    } catch (err) {
      logger.error('Analysis failed:', err);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        onAuthError?.(err);
        setState('error');
        return;
      }

      let errorMessage = 'Unknown error occurred';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || 'API request failed';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setGroupedCategories([]);
      setState('error');
      stopPolling();
    }
  }, [sessionType, sessionToken, credentials, debugHtml, getApiBaseUrl, getApiHeaders, onAuthError, startPolling, stopPolling, updateAssetId]);

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setState('idle');
    setData(null);
    setOriginalData(null);
    setError(null);
    setGroupedCategories([]);
    stopPolling();
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Update grouped categories when data changes
  useEffect(() => {
    if (!data) {
      setGroupedCategories([]);
      return;
    }
    setGroupedCategories(Object.entries(groupCheckpointsByCategory(data.checkpoints || [])));
  }, [data, groupCheckpointsByCategory]);

  return {
    state,
    data,
    originalData,
    error,
    assetId,
    groupedCategories,
    startAnalysis,
    resetAnalysis,
    setData,
    stopPolling,
  };
}

export default useAnalysis;
