/**
 * useHighlightActions Hook
 *
 * Provides async actions for highlight functionality with Redux integration.
 * Handles fetching highlighted content, caching, and navigation.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { logger } from '../utils/logger';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectCheckpoint,
  setViewMode,
  setLoading,
  setError,
  setHighlightedContent,
  cacheHighlight,
  setTotalHighlights,
  setCurrentHighlightIndex,
  setVisibleHighlightIndex,
  setHasAutoScrolled,
  incrementClickIndicator,
  closeModal,
  openModal,
  navigateHighlight,
  toggleScripts,
  setCurrentAssetId,
  selectSelectedCheckpoint,
  selectSelectedCheckpointId,
  selectViewMode,
  selectIsModalOpen,
  selectIsHighlightLoading,
  selectHighlightedContent,
  selectTotalHighlights,
  selectCurrentHighlightIndex,
  selectVisibleHighlightIndex,
  selectClickedIndicator,
  selectScriptsDisabled,
  selectHasAutoScrolled,
  selectHighlightCache,
  selectCurrentAssetId,
  type ViewMode,
} from '../store/slices/highlightSlice';
import {
  selectApiKey,
  selectWebsiteId,
  selectSessionType,
  selectAccessToken,
} from '../store/slices/authSlice';
import type { AnalysisData, Checkpoint, DQMConfig } from '../types';
import { getLocalStorageItem } from '../utils/localStorage';

export interface UseHighlightActionsConfig {
  /** Backend URL for proxy mode */
  authBackendUrl?: string;
}

export interface UseHighlightActionsReturn {
  // State (from Redux)
  checkpoint: Checkpoint | null;
  checkpointId: string | null;
  viewMode: ViewMode;
  isModalOpen: boolean;
  isLoading: boolean;
  highlightedContent: string;
  totalHighlights: number;
  currentHighlight: number;
  visibleHighlight: number;
  clickedIndicator: number;
  scriptsDisabled: boolean;
  hasAutoScrolled: boolean;
  currentAssetId: string | null;

  // Actions
  fetchHighlightedErrors: (
    assetId: string,
    checkpointId: string,
    analysisData: AnalysisData,
    openTab?: 'browser' | 'source'
  ) => Promise<void>;
  fetchSourceView: (assetId: string, checkpointId: string) => Promise<void>;
  restoreBrowserView: (assetId: string, checkpointId: string) => Promise<void>;
  openAllErrorsInNewTab: (analysisData: AnalysisData) => Promise<void>;
  navigate: (direction: 'next' | 'prev') => void;
  setViewMode: (mode: ViewMode) => void;
  openModal: () => void;
  closeModal: () => void;
  toggleScripts: () => void;
  setTotalHighlights: (count: number) => void;
  setVisibleHighlight: (index: number) => void;
  setHasAutoScrolled: (value: boolean) => void;
  setCurrentAssetId: (assetId: string | null) => void;
}

export function useHighlightActions(
  config?: UseHighlightActionsConfig
): UseHighlightActionsReturn {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(['sidebar']);

  // Redux state selectors
  const checkpoint = useAppSelector(selectSelectedCheckpoint);
  const checkpointId = useAppSelector(selectSelectedCheckpointId);
  const viewMode = useAppSelector(selectViewMode);
  const isModalOpen = useAppSelector(selectIsModalOpen);
  const isLoading = useAppSelector(selectIsHighlightLoading);
  const highlightedContent = useAppSelector(selectHighlightedContent);
  const totalHighlights = useAppSelector(selectTotalHighlights);
  const currentHighlight = useAppSelector(selectCurrentHighlightIndex);
  const visibleHighlight = useAppSelector(selectVisibleHighlightIndex);
  const clickedIndicator = useAppSelector(selectClickedIndicator);
  const scriptsDisabled = useAppSelector(selectScriptsDisabled);
  const hasAutoScrolled = useAppSelector(selectHasAutoScrolled);
  const cache = useAppSelector(selectHighlightCache);
  const currentAssetId = useAppSelector(selectCurrentAssetId);

  // Auth state
  const apiKey = useAppSelector(selectApiKey);
  const websiteId = useAppSelector(selectWebsiteId);
  const sessionType = useAppSelector(selectSessionType);
  const accessToken = useAppSelector(selectAccessToken);

  // Helper: Get API base URL
  const getApiBaseUrl = useCallback((): string => {
    if (sessionType === 'backend' && config?.authBackendUrl) {
      return config.authBackendUrl;
    }
    return 'https://api.crownpeak.net/dqm-cms/v1';
  }, [sessionType, config?.authBackendUrl]);

  // Helper: Get API headers
  const getApiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (sessionType === 'backend') {
      const token = accessToken || getLocalStorageItem('dqm_sessionToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      const key = apiKey || getLocalStorageItem('dqm_apiKey');
      if (key) {
        headers['x-api-key'] = key;
      }
    }

    return headers;
  }, [sessionType, accessToken, apiKey]);

  // Validate API key encoding
  const validateApiKeyEncoding = (key: string): void => {
    if (!/^[\x00-\x7F]*$/.test(key)) {
      throw new Error('API key contains non-ASCII characters');
    }
  };

  /**
   * Fetch highlighted errors for a checkpoint
   */
  const fetchHighlightedErrors = useCallback(
    async (
      assetId: string,
      cpId: string,
      analysisData: AnalysisData,
      openTab: 'browser' | 'source' = 'browser'
    ): Promise<void> => {
      dispatch(setHighlightedContent(''));
      dispatch(setLoading(true));
      dispatch(setViewMode(openTab));
      dispatch(openModal());
      dispatch(setCurrentAssetId(assetId));

      // Find and select the checkpoint
      const cp = analysisData.checkpoints.find((c) => c.id === cpId) || null;
      dispatch(selectCheckpoint(cp));

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let browserUrl: string;
        let sourceUrl: string;

        if (sessionType === 'backend') {
          browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${cpId}?highlightSource=false`;
          sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${cpId}?highlightSource=true`;
        } else {
          const key = apiKey || getLocalStorageItem('dqm_apiKey');
          if (!key) throw new Error('DQM API key not found');
          validateApiKeyEncoding(key);
          const encodedKey = encodeURIComponent(key);
          browserUrl = `${baseUrl}/assets/${assetId}/errors/${cpId}?apiKey=${encodedKey}&highlightSource=false`;
          sourceUrl = `${baseUrl}/assets/${assetId}/errors/${cpId}?apiKey=${encodedKey}&highlightSource=true`;
        }

        // Fetch both views in parallel
        const [browserResponse, sourceResponse] = await Promise.all([
          cp?.canHighlight?.page
            ? axios.get(browserUrl, { headers, timeout: 15000, responseType: 'text' })
            : Promise.resolve(null),
          cp?.canHighlight?.source
            ? axios.get(sourceUrl, { headers, timeout: 15000, responseType: 'text' })
            : Promise.resolve(null),
        ]);

        const browserHtml = browserResponse?.data || '<p>No highlighted content available.</p>';
        const sourceHtml = sourceResponse?.data || '<p>No source content available.</p>';

        // Cache both views
        dispatch(cacheHighlight({ checkpointId: cpId, content: browserHtml, type: 'browser' }));
        dispatch(cacheHighlight({ checkpointId: cpId, content: sourceHtml, type: 'source' }));

        // Set the appropriate content based on openTab
        if (openTab === 'browser' && cp?.canHighlight?.page) {
          dispatch(setHighlightedContent(browserHtml));
        } else if (openTab === 'source' && cp?.canHighlight?.source) {
          dispatch(setHighlightedContent(sourceHtml));
        }

        logger.debug('Both views loaded and cached');
      } catch (err) {
        logger.error('Failed to fetch highlighted content:', err);
        dispatch(setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_highlights')}</p>`));
        dispatch(setError(err instanceof Error ? err.message : 'Failed to load highlights'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, getApiBaseUrl, getApiHeaders, sessionType, apiKey, t]
  );

  /**
   * Fetch source view for a checkpoint (uses cache if available)
   */
  const fetchSourceView = useCallback(
    async (assetId: string, cpId: string): Promise<void> => {
      // Check cache first
      const cached = cache[cpId];
      if (cached?.source) {
        logger.debug('Using cached source view');
        dispatch(setHighlightedContent(cached.source));
        return;
      }

      dispatch(setLoading(true));

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let sourceUrl: string;
        if (sessionType === 'backend') {
          sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${cpId}?highlightSource=true`;
        } else {
          const key = apiKey || getLocalStorageItem('dqm_apiKey');
          if (!key) throw new Error('DQM API key not found');
          validateApiKeyEncoding(key);
          const encodedKey = encodeURIComponent(key);
          sourceUrl = `${baseUrl}/assets/${assetId}/errors/${cpId}?apiKey=${encodedKey}&highlightSource=true`;
        }

        const response = await axios.get(sourceUrl, {
          headers,
          timeout: 15000,
          responseType: 'text',
        });

        const sourceHtml = response.data || `<p>${t('sidebar:no_highlighted_content')}</p>`;
        dispatch(setHighlightedContent(sourceHtml));
        dispatch(cacheHighlight({ checkpointId: cpId, content: sourceHtml, type: 'source' }));
      } catch (err) {
        logger.error('Failed to fetch source view:', err);
        dispatch(setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_source')}</p>`));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, cache, getApiBaseUrl, getApiHeaders, sessionType, apiKey, t]
  );

  /**
   * Restore browser view for a checkpoint (uses cache if available)
   */
  const restoreBrowserView = useCallback(
    async (assetId: string, cpId: string): Promise<void> => {
      // Check cache first
      const cached = cache[cpId];
      if (cached?.browser) {
        logger.debug('Using cached browser view');
        dispatch(setHighlightedContent(cached.browser));
        return;
      }

      dispatch(setLoading(true));

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let browserUrl: string;
        if (sessionType === 'backend') {
          browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${cpId}?highlightSource=false`;
        } else {
          const key = apiKey || getLocalStorageItem('dqm_apiKey');
          if (!key) throw new Error('DQM API key not found');
          validateApiKeyEncoding(key);
          const encodedKey = encodeURIComponent(key);
          browserUrl = `${baseUrl}/assets/${assetId}/errors/${cpId}?apiKey=${encodedKey}&highlightSource=false`;
        }

        const response = await axios.get(browserUrl, {
          headers,
          timeout: 15000,
          responseType: 'text',
        });

        const browserHtml = response.data || `<p>${t('sidebar:no_highlighted_content')}</p>`;
        dispatch(setHighlightedContent(browserHtml));
        dispatch(cacheHighlight({ checkpointId: cpId, content: browserHtml, type: 'browser' }));
      } catch (err) {
        logger.error('Failed to restore browser view:', err);
        dispatch(setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_browser')}</p>`));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, cache, getApiBaseUrl, getApiHeaders, sessionType, apiKey, t]
  );

  /**
   * Open page with all errors highlighted in a new tab
   */
  const openAllErrorsInNewTab = useCallback(
    async (analysisData: AnalysisData): Promise<void> => {
      dispatch(setLoading(true));

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let allErrorsUrl: string;
        if (sessionType === 'backend') {
          allErrorsUrl = `${baseUrl}/dqm/assets/${analysisData.assetId}/pagehighlight/all`;
        } else {
          const key = apiKey || getLocalStorageItem('dqm_apiKey');
          if (!key) throw new Error('DQM API key not found');
          validateApiKeyEncoding(key);
          const encodedKey = encodeURIComponent(key);
          allErrorsUrl = `${baseUrl}/assets/${analysisData.assetId}/pagehighlight/all?apiKey=${encodedKey}`;
        }

        const response = await axios.get(allErrorsUrl, {
          headers,
          timeout: 30000,
          responseType: 'text',
        });

        if (response.data) {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            try {
              newWindow.opener = null;
            } catch {
              // ignore
            }
            newWindow.document.open();
            newWindow.document.write(response.data);
            newWindow.document.close();

            // Add highlight animation styles
            setTimeout(() => {
              const style = newWindow.document.createElement('style');
              style.textContent = `
                [data-dqm-id] {
                  animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                  0%, 100% { background-color: rgba(255, 255, 0, 0.3); }
                  50% { background-color: rgba(255, 255, 0, 0.6); }
                }
              `;
              newWindow.document.head.appendChild(style);
            }, 100);
          }
        }
      } catch (err) {
        logger.error('Failed to fetch all errors:', err);
        alert(t('sidebar:failed_load_all_errors'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, getApiBaseUrl, getApiHeaders, sessionType, apiKey, t]
  );

  return {
    // State
    checkpoint,
    checkpointId,
    viewMode,
    isModalOpen,
    isLoading,
    highlightedContent,
    totalHighlights,
    currentHighlight,
    visibleHighlight,
    clickedIndicator,
    scriptsDisabled,
    hasAutoScrolled,
    currentAssetId,

    // Actions
    fetchHighlightedErrors,
    fetchSourceView,
    restoreBrowserView,
    openAllErrorsInNewTab,
    navigate: (direction) => dispatch(navigateHighlight(direction)),
    setViewMode: (mode) => dispatch(setViewMode(mode)),
    openModal: () => dispatch(openModal()),
    closeModal: () => dispatch(closeModal()),
    toggleScripts: () => dispatch(toggleScripts()),
    setTotalHighlights: (count) => dispatch(setTotalHighlights(count)),
    setVisibleHighlight: (index) => dispatch(setVisibleHighlightIndex(index)),
    setHasAutoScrolled: (value) => dispatch(setHasAutoScrolled(value)),
    setCurrentAssetId: (assetId) => dispatch(setCurrentAssetId(assetId)),
  };
}

export default useHighlightActions;
