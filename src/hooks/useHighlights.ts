/**
 * useHighlights Hook
 *
 * Manages fetching and caching highlighted error content for browser and source views.
 * Handles view switching, navigation state, and content caching.
 */
import { useCallback, useState } from 'react';
import axios from 'axios';
import type { AnalysisData, SessionType } from '../types';
import { getLocalStorageItem } from '../utils/localStorage';
import { logger } from '../utils/logger';

export interface UseHighlightsConfig {
  /** Session type (direct API or backend proxy) */
  sessionType: SessionType;
  /** Session token for backend mode */
  sessionToken: string | null;
  /** Credentials for direct mode */
  credentials: { apiKey: string; websiteId: string } | null;
  /** Auth backend URL for backend mode */
  authBackendUrl?: string;
  /** Translation function for error messages */
  t: (key: string, options?: object) => string;
}

export interface UseHighlightsReturn {
  /** Current highlighted HTML content */
  highlightedContent: string;
  /** Whether content is loading */
  isLoading: boolean;
  /** Current view mode */
  viewMode: 'browser' | 'source';
  /** Set view mode */
  setViewMode: (mode: 'browser' | 'source') => void;
  /** Whether the highlight modal is open */
  isModalOpen: boolean;
  /** Current checkpoint being displayed */
  currentCheckpoint: AnalysisData['checkpoints'][0] | null;
  /** Current checkpoint ID */
  currentCheckpointId: string | null;
  /** Total number of highlights in current content */
  totalHighlights: number;
  /** Current highlight index (1-based, from navigation) */
  currentHighlight: number;
  /** Visible highlight index (1-based, from scroll tracking) */
  visibleHighlight: number;
  /** Click indicator for triggering scroll */
  clickedIndicator: number;
  /** Whether scripts are disabled in browser view */
  scriptsDisabled: boolean;
  /** Whether auto-scroll to first has occurred */
  hasAutoScrolled: boolean;
  /** Cached content by checkpoint ID */
  cachedContent: Record<string, { browser: string; source: string }>;
  /** Fetch highlighted errors for a checkpoint */
  fetchHighlightedErrors: (assetId: string, checkpointId: string, analysisData: AnalysisData, openTab?: 'browser' | 'source') => Promise<void>;
  /** Navigate to next/prev highlight */
  navigateHighlight: (direction: 'prev' | 'next') => void;
  /** Open the highlight modal */
  openModal: () => void;
  /** Close the highlight modal */
  closeModal: () => void;
  /** Set total highlights (from renderer) */
  setTotalHighlights: (count: number) => void;
  /** Set visible highlight (from scroll tracking) */
  setVisibleHighlight: (index: number) => void;
  /** Toggle scripts in browser view */
  toggleScripts: () => void;
  /** Set has auto-scrolled flag */
  setHasAutoScrolled: (value: boolean) => void;
  /** Restore browser view from cache */
  restoreBrowserView: (assetId: string, checkpointId: string) => Promise<void>;
  /** Fetch source view for checkpoint */
  fetchSourceView: (assetId: string, checkpointId: string) => Promise<void>;
}

export function useHighlights(config: UseHighlightsConfig): UseHighlightsReturn {
  const { sessionType, sessionToken, credentials, authBackendUrl, t } = config;

  // Content state
  const [highlightedContent, setHighlightedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'browser' | 'source'>('browser');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<AnalysisData['checkpoints'][0] | null>(null);
  const [currentCheckpointId, setCurrentCheckpointId] = useState<string | null>(null);

  // Navigation state
  const [totalHighlights, setTotalHighlights] = useState<number>(0);
  const [currentHighlight, setCurrentHighlight] = useState<number>(0);
  const [visibleHighlight, setVisibleHighlight] = useState<number>(0);
  const [clickedIndicator, setClickedIndicator] = useState<number>(0);

  // Settings state
  const [scriptsDisabled, setScriptsDisabled] = useState<boolean>(true);
  const [hasAutoScrolled, setHasAutoScrolled] = useState<boolean>(false);

  // Cache state
  const [cachedContent, setCachedContent] = useState<Record<string, { browser: string; source: string }>>({});

  // Helper functions
  const getApiBaseUrl = useCallback((): string => {
    if (sessionType === 'backend' && authBackendUrl) {
      return authBackendUrl;
    }
    return 'https://api.crownpeak.net/dqm-cms/v1';
  }, [sessionType, authBackendUrl]);

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

  const validateApiKeyEncoding = (apiKey: string): void => {
    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
      throw new Error('API key contains non-ASCII characters');
    }
  };

  // Fetch highlighted errors
  const fetchHighlightedErrors = useCallback(
    async (assetId: string, checkpointId: string, analysisData: AnalysisData, openTab: 'browser' | 'source' = 'browser'): Promise<void> => {
      setHighlightedContent('');
      setIsLoading(true);
      setCurrentCheckpointId(checkpointId);
      setViewMode(openTab);
      setIsModalOpen(true);

      // Reset cached content for new checkpoint
      setCachedContent((prev) => ({
        ...prev,
        [checkpointId]: { browser: '', source: '' },
      }));

      // Find and set current checkpoint
      const checkpoint = analysisData.checkpoints.find((cp) => cp.id === checkpointId) || null;
      setCurrentCheckpoint(checkpoint);

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let browserUrl: string;
        let sourceUrl: string;

        if (sessionType === 'backend') {
          browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=false`;
          sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=true`;
        } else {
          const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
          if (!dqmApiKey) {
            throw new Error('DQM API key not found');
          }
          validateApiKeyEncoding(dqmApiKey);
          const encodedApiKey = encodeURIComponent(dqmApiKey);
          browserUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=false`;
          sourceUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=true`;
        }

        // Fetch both views in parallel
        const [browserResponse, sourceResponse] = await Promise.all([
          checkpoint?.canHighlight.page
            ? axios.get(browserUrl, { headers, timeout: 15000, responseType: 'text' })
            : Promise.resolve(null),
          checkpoint?.canHighlight.source
            ? axios.get(sourceUrl, { headers, timeout: 15000, responseType: 'text' })
            : Promise.resolve(null),
        ]);

        const browserHtml = browserResponse?.data || '<p>No highlighted content available.</p>';
        const sourceHtml = sourceResponse?.data || '<p>No source content available for this checkpoint.</p>';

        // Cache both views
        setCachedContent((prev) => ({
          ...prev,
          [checkpointId]: { browser: browserHtml, source: sourceHtml },
        }));

        // Set initial content based on selected tab
        if (openTab === 'browser' && checkpoint?.canHighlight?.page) {
          setHighlightedContent(browserHtml);
        } else if (openTab === 'source' && checkpoint?.canHighlight?.source) {
          setHighlightedContent(sourceHtml);
        }

        logger.debug('Both views loaded and cached');
      } catch (err) {
        logger.error('Failed to fetch highlighted content:', err);
        setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_highlights')}</p>`);
      } finally {
        setIsLoading(false);
      }
    },
    [getApiBaseUrl, getApiHeaders, sessionType, credentials, t]
  );

  // Restore browser view from cache
  const restoreBrowserView = useCallback(
    async (assetId: string, checkpointId: string): Promise<void> => {
      const cached = cachedContent[checkpointId];
      if (cached?.browser) {
        logger.debug('Using cached browser view for checkpoint:', checkpointId);
        setHighlightedContent(cached.browser);
        return;
      }

      // Fallback: fetch if not cached (shouldn't happen normally)
      logger.warn('Browser view not in cache for checkpoint:', checkpointId);
      setIsLoading(true);

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let browserUrl: string;
        if (sessionType === 'backend') {
          browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=false`;
        } else {
          const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
          if (!dqmApiKey) throw new Error('DQM API key not found');
          validateApiKeyEncoding(dqmApiKey);
          browserUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodeURIComponent(dqmApiKey)}&highlightSource=false`;
        }

        const response = await axios.get(browserUrl, { headers, timeout: 15000, responseType: 'text' });
        const browserHtml = response.data || `<p>${t('sidebar:no_highlighted_content')}</p>`;
        setHighlightedContent(browserHtml);
        setCachedContent((prev) => ({
          ...prev,
          [checkpointId]: { ...prev[checkpointId], browser: browserHtml },
        }));
      } catch (err) {
        logger.error('Failed to restore browser view:', err);
        setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_browser')}</p>`);
      } finally {
        setIsLoading(false);
      }
    },
    [cachedContent, getApiBaseUrl, getApiHeaders, sessionType, credentials, t]
  );

  // Fetch source view
  const fetchSourceView = useCallback(
    async (assetId: string, checkpointId: string): Promise<void> => {
      const cached = cachedContent[checkpointId];
      if (cached?.source) {
        logger.debug('Using cached source view for checkpoint:', checkpointId);
        setHighlightedContent(cached.source);
        return;
      }

      logger.warn('Source view not in cache for checkpoint:', checkpointId);
      setIsLoading(true);

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getApiHeaders();

        let sourceUrl: string;
        if (sessionType === 'backend') {
          sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=true`;
        } else {
          const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
          if (!dqmApiKey) throw new Error('DQM API key not found');
          validateApiKeyEncoding(dqmApiKey);
          sourceUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodeURIComponent(dqmApiKey)}&highlightSource=true`;
        }

        const response = await axios.get(sourceUrl, { headers, timeout: 15000, responseType: 'text' });
        const sourceHtml = response.data || `<p>${t('sidebar:no_highlighted_content')}</p>`;
        setHighlightedContent(sourceHtml);
        setCachedContent((prev) => ({
          ...prev,
          [checkpointId]: { ...prev[checkpointId], source: sourceHtml },
        }));
      } catch (err) {
        logger.error('Failed to fetch source view:', err);
        setHighlightedContent(`<p style="color: #dc3545;">${t('sidebar:failed_load_source')}</p>`);
      } finally {
        setIsLoading(false);
      }
    },
    [cachedContent, getApiBaseUrl, getApiHeaders, sessionType, credentials, t]
  );

  // Navigate highlights
  const navigateHighlight = useCallback(
    (direction: 'next' | 'prev') => {
      if (totalHighlights === 0) return;

      let index = (visibleHighlight || currentHighlight) - 1;

      if (direction === 'next') {
        index = (index + 1) % totalHighlights;
      } else {
        index = index - 1;
        if (index < 0) index = totalHighlights - 1;
      }

      setCurrentHighlight(index + 1);
      setVisibleHighlight(0);
      setClickedIndicator((prev) => prev + 1);
    },
    [currentHighlight, visibleHighlight, totalHighlights]
  );

  // Modal controls
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTotalHighlights(0);
    setCurrentHighlight(0);
    setHasAutoScrolled(false);
  }, []);

  // Toggle scripts
  const toggleScripts = useCallback(() => setScriptsDisabled((prev) => !prev), []);

  return {
    highlightedContent,
    isLoading,
    viewMode,
    setViewMode,
    isModalOpen,
    currentCheckpoint,
    currentCheckpointId,
    totalHighlights,
    currentHighlight,
    visibleHighlight,
    clickedIndicator,
    scriptsDisabled,
    hasAutoScrolled,
    cachedContent,
    fetchHighlightedErrors,
    navigateHighlight,
    openModal,
    closeModal,
    setTotalHighlights,
    setVisibleHighlight,
    toggleScripts,
    setHasAutoScrolled,
    restoreBrowserView,
    fetchSourceView,
  };
}

export default useHighlights;
