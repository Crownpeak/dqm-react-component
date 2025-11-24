// DQM Sidebar React Component with MUI
import React, {useCallback, useEffect, useState} from 'react';
import axios from 'axios';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    Chip,
    createTheme,
    CssBaseline,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    Skeleton,
    Tab,
    Tabs,
    ThemeProvider,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    Logout as LogoutIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    Replay as ReplayIcon,
    TaskAlt as TaskAltIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import type {AnalysisData, AnalysisState, DQMSidebarProps, SessionType} from './types';
import {ErrorBoundary} from './ErrorBoundary';
import sortBy from 'lodash.sortby';
import {
    SidebarSkeleton,
    StyledFab,
    StyledDrawer,
    SidebarHeader,
    SidebarContent,
    SidebarFooter
} from "./components/sidebar";
import {QualityOverviewCard, CategoryCard, FailedCheckpointsCard} from "./components/cards";
import {SafeParsedHtml, ShadowDOMRenderer, BrowserViewRenderer} from "./components/renderers";
import {getCategoryColor} from "./utils/colors/GenerateCategoryColors";
import {CircularProgressWithLabel} from "./components/common";
import {DQMLogin, OAuth2CallbackHandler} from "./components/auth";
import {getLocalStorageItem, removeLocalStorageItem} from "./utils/localStorage";

export const DQMSidebar: React.FC<DQMSidebarProps> = ({
                                                          open,
                                                          onClose,
                                                          onOpen,
                                                          config,
                                                          onAuthSuccess,
                                                          onAuthError,
                                                          debugHtml // DEBUG ONLY: custom HTML for testing
                                                      }) => {
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentAssetId, setcurrentAssetId] = useState<string | null>(null);
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
    const [groupedCategories, setGroupedCategories] = useState<[string, AnalysisData['checkpoints']][]>([]);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    
    // Credentials state (for direct mode) and session state (for backend mode)
    const [credentials, setCredentials] = useState<{ apiKey: string; websiteId: string } | null>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [sessionType, setSessionType] = useState<SessionType>('direct'); // 'direct' or 'backend'
    
    const [highlightedContent, setHighlightedContent] = useState<string>('');
    const [currentCheckpointId, setCurrentCheckpointId] = useState<string | null>(null);
    const [currentCheckpoint, setCurrentCheckpoint] = useState<AnalysisData['checkpoints'][0] | null>(null);
    const [loadingHighlight, setLoadingHighlight] = useState<boolean>(false);
    const [highlightViewMode, setHighlightViewMode] = useState<'browser' | 'source'>('browser');
    const [openHighlightModal, setOpenHighlightModal] = useState<boolean>(false);
    const [loadingAllErrors, setLoadingAllErrors] = useState<boolean>(false);
    const [clickedIndicator, setClickedIndicator] = useState<number>(0); // To trigger scroll on indicator click
    const [expanded, setExpanded] = React.useState<boolean>(() => {
        // SSR-safe: Initialize from localStorage only in browser
        if (typeof window === 'undefined') return true;
        return getLocalStorageItem('dqm_quality_breakdown_expanded') !== 'false';
    });

    // Category filter state - tracks which main categories are selected for filtering
    const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<Set<string>>(new Set());

    // Cache for browser and source HTML content - now organized by checkpointId
    // This prevents stale content from being shown when switching between checkpoints
    const [cachedContentByCheckpoint, setCachedContentByCheckpoint] = useState<Record<string, {
        browser: string;
        source: string;
    }>>({});

    // Highlight navigation state - lifted up to integrate into tabs
    const [totalHighlights, setTotalHighlights] = useState<number>(0);
    const [currentHighlight, setCurrentHighlight] = useState<number>(0);

    // Separate state for DISPLAY ONLY - shows which highlight is currently visible (passive tracking)
    const [visibleHighlight, setVisibleHighlight] = useState<number>(0);

    const contentBoxRef = React.useRef<HTMLDivElement>(null);

    // Track if we've already done the initial auto-scroll to first highlight
    const hasAutoScrolledRef = React.useRef<boolean>(false);

    // Track previous view mode to detect actual tab changes
    const previousViewModeRef = React.useRef<'browser' | 'source'>('browser');

    useEffect(() => {
        const params = new URLSearchParams(window?.location?.search);
        const dqmParam = params.get('dqm');

        if (dqmParam === 'true') {
            onOpen();
        }
    }, [window?.location?.search])

    // Initialize authentication on mount
    useEffect(() => {
        const initAuth = () => {
            // Check if DQM is disabled
            if (config?.disabled === true) {
                setIsAuthenticated(false);
                setAuthError('DQM is disabled. Permission denied.');
                setAnalysisState('idle'); // Show login page with error
                return;
            }

            // Priority 1: Props from config (direct credentials - always direct mode)
            if (config?.apiKey && config?.websiteId) {
                setCredentials({
                    apiKey: config.apiKey,
                    websiteId: config.websiteId,
                });
                setSessionType('direct');
                setSessionToken(null);
                setIsAuthenticated(true);
                return;
            }

            // Priority 2: LocalStorage (check session type) - BROWSER ONLY
            // SSR-safe: Check if we're in browser environment
            if (typeof window !== 'undefined' && config?.useLocalStorage !== false) {
                const storedSessionType = getLocalStorageItem('dqm_sessionType') as SessionType | null;
                
                // Backend session mode
                if (storedSessionType === 'backend') {
                    const storedSessionToken = getLocalStorageItem('dqm_sessionToken');
                    if (storedSessionToken) {
                        console.log('[DQM] Restoring backend session from localStorage');
                        setSessionToken(storedSessionToken);
                        setSessionType('backend');
                        setCredentials({
                            apiKey: 'BACKEND_SESSION',
                            websiteId: 'BACKEND_SESSION',
                        });
                        setIsAuthenticated(true);
                        return;
                    }
                }
                
                // Direct mode
                const storedApiKey = getLocalStorageItem('dqm_apiKey');
                const storedWebsiteId = getLocalStorageItem('dqm_websiteID');
                if (storedApiKey && storedWebsiteId) {
                    console.log('[DQM] Restoring direct credentials from localStorage');
                    setCredentials({
                        apiKey: storedApiKey,
                        websiteId: storedWebsiteId,
                    });
                    setSessionType('direct');
                    setSessionToken(null);
                    setIsAuthenticated(true);
                    return;
                }
            }

            // Priority 3: Check if authentication backend is configured
            if (config?.authBackendUrl || config?.oauth2Config) {
                // Show login page with backend options
                setIsAuthenticated(false);
                setAnalysisState('idle');
                return;
            }

            // Priority 4: No configuration available - still show login page
            // but with error message about missing configuration
            setIsAuthenticated(false);
            setAuthError('DQM is not configured. Please provide API credentials via props, localStorage, or configure an authentication backend.');
            setAnalysisState('idle'); // Keep idle so login page shows
        };

        initAuth();
    }, [config]);

    // Auto-start analysis when authenticated with credentials
    useEffect(() => {
        if (isAuthenticated && credentials && analysisState === 'idle') {
            console.log('[DQM] Auto-starting analysis with available credentials');
            startAnalysis();
        }
    }, [isAuthenticated, credentials]);

    // Handle successful authentication
    const handleAuthSuccess = useCallback((creds: { apiKey: string; websiteId: string; sessionToken?: string; sessionType: SessionType }) => {
        setCredentials({
            apiKey: creds.apiKey,
            websiteId: creds.websiteId,
        });
        setSessionToken(creds.sessionToken || null);
        setSessionType(creds.sessionType);
        setIsAuthenticated(true);
        setAuthError(null);
        
        if (onAuthSuccess) {
            onAuthSuccess(creds);
        }
    }, [onAuthSuccess]);

    // Handle authentication error
    const handleAuthenticationError = useCallback((err: Error) => {
        console.error('[DQM] Authentication error:', err);
        setAuthError(err.message);
        setIsAuthenticated(false);
        
        if (onAuthError) {
            onAuthError(err);
        }
    }, [onAuthError]);

    // Helper function to get credentials
    const getCredentials = useCallback(() => {
        if (credentials) {
            return credentials;
        }
        
        // Fallback to localStorage - SSR-safe
        const apiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
        const websiteId = credentials?.websiteId || getLocalStorageItem('dqm_websiteID');

        if (apiKey && websiteId) {
            return { apiKey, websiteId };
        }
        
        return null;
    }, [credentials]);

    // Logout handler
    const handleLogout = useCallback(() => {
        // Clear credentials and session from state
        setCredentials(null);
        setSessionToken(null);
        setSessionType('direct');
        setIsAuthenticated(false);
        
        // Clear localStorage if enabled - SSR-safe
        if (typeof window !== 'undefined' && config?.useLocalStorage !== false) {
            removeLocalStorageItem('dqm_apiKey');
            removeLocalStorageItem('dqm_websiteID');
            removeLocalStorageItem('dqm_sessionToken');
            removeLocalStorageItem('dqm_sessionType');
            console.log('[DQMSidebar] Cleared localStorage on logout');
        }
        
        // Reset analysis state
        setAnalysisState('idle');
        setAnalysisData(null);
        setError(null);
        setcurrentAssetId(null);
        
        // Clear any polling intervals
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
        
        console.log('[DQMSidebar] User logged out');
    }, [config?.useLocalStorage, pollingInterval]);

    // Navigation handler for highlights
    const navigateHighlight = useCallback((direction: 'next' | 'prev') => {
        if (totalHighlights === 0) return;

        // Use visibleHighlight as base if available (user has scrolled), otherwise use currentHighlight
        // Convert to 0-based
        let index = (visibleHighlight || currentHighlight) - 1;

        if (direction === 'next') {
            index = (index + 1) % totalHighlights;
        } else {
            index = index - 1;
            if (index < 0) index = totalHighlights - 1;
        }

        setCurrentHighlight(index + 1); // Convert back to 1-based

        // Reset visibleHighlight so next button click continues from this new position
        // (not from where the user last scrolled)
        setVisibleHighlight(0);

        setClickedIndicator(((prev) => prev + 1)); // Trigger scroll effect)
    }, [currentHighlight, visibleHighlight, totalHighlights]);

    // Reset highlight navigation when modal opens/closes
    useEffect(() => {
        if (!openHighlightModal) {
            setTotalHighlights(0);
            setCurrentHighlight(0);
            hasAutoScrolledRef.current = false;
            // Reset scroll positions when modal closes
        }
    }, [openHighlightModal]);

    // Auto-scroll to first highlight when highlights are found
    useEffect(() => {
        if (totalHighlights > 0 && currentHighlight === 0) {
            console.log('[DQM] Auto-setting currentHighlight to 1 (total highlights:', totalHighlights, ')');
            setCurrentHighlight(1);
        }
    }, [totalHighlights, currentHighlight]);

    // Notify parent (Liquid host) about drawer state so it can toggle pointer-events on iframe/html
    useEffect(() => {
        try {
            window.parent?.postMessage({type: 'DQM_DRAWER_STATE', payload: {open}}, '*');
        } catch { /* ignore */
        }
    }, [open]);

    // Handle authentication errors
    const handleAuthError = useCallback((error: unknown) => {
        console.error('[DQM] API authentication error:', error);
        setIsAuthenticated(false);
        setAuthError('Authentication required. Please refresh the page.');
    }, []);

    const optimizeHtmlForAnalysis = (html: string): string => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extended list of selectors to remove
        // These elements are not relevant for DQM analysis and only increase payload size
        const selectorsToRemove = [
            // DQM-eigene Elemente
            '.MuiDrawer-root',
            '#dqm-widget-host',
            '[data-block-handle="dqm_quality_analysis"]',
            '#dqm-quality-analysis-script',
            '#PBarNextFrameWrapper'
        ];

        // Elemente entfernen
        selectorsToRemove.forEach(selector => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            } catch (e: any) {
                console.warn('[DQM] Could not process selector:', selector, e.message);
            }
        });

        // Optimize HTML string
        const optimized = doc.documentElement.outerHTML;

        // Logging for debugging
        const originalSize = html.length;
        const optimizedSize = optimized.length;
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

        console.log(`[DQM] HTML optimization: ${originalSize} → ${optimizedSize} bytes (${reduction}% reduction)`);

        // Warn when payload is still large
        if (optimizedSize > 1024 * 1024) { // > 1MB
            console.warn(`[DQM] Optimized HTML still large: ${(optimizedSize / 1024 / 1024).toFixed(1)}MB`);
        }

        return optimized;
    };

    // Helper function to get API base URL based on session type
    const getApiBaseUrl = useCallback((): string => {
        if (sessionType === 'backend' && config?.authBackendUrl) {
            return config.authBackendUrl;
        }
        return 'https://api.crownpeak.net/dqm-cms/v1';
    }, [sessionType, config?.authBackendUrl]);

    // Helper function to get API headers based on session type
    const getApiHeaders = useCallback((): Record<string, string> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (sessionType === 'backend') {
            // Backend mode: Use session token
            const token = sessionToken || getLocalStorageItem('dqm_sessionToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } else {
            // Direct mode: Use API key
            const apiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
            if (apiKey) {
                headers['x-api-key'] = apiKey;
            }
        }

        return headers;
    }, [sessionType, sessionToken, credentials]);

    // Validate API key contains only ASCII characters for HTTP headers
    const validateApiKeyEncoding = (apiKey: string): void => {
        if (!/^[\x00-\x7F]*$/.test(apiKey)) {
            throw new Error('API key contains non-ASCII characters and cannot be used in HTTP headers');
        }
    };

    // Function to open page with all errors highlighted in a new tab
    const openPageWithAllErrors = async (): Promise<void> => {
        if (!analysisData) {
            console.error('[DQM] No analysis data available');
            return;
        }

        setLoadingAllErrors(true);

        try {
            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let allErrorsUrl: string;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy
                allErrorsUrl = `${baseUrl}/dqm/assets/${analysisData.assetId}/pagehighlight/all`;
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');

                if (!dqmApiKey) {
                    throw new Error('DQM API key not found');
                }

                // Validate API key encoding
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }

                const encodedApiKey = encodeURIComponent(dqmApiKey);
                allErrorsUrl = `${baseUrl}/assets/${analysisData.assetId}/pagehighlight/all?apiKey=${encodedApiKey}`;
            }

            const response = await axios.get(allErrorsUrl, {
                headers,
                timeout: 30000, // 30 seconds timeout
                responseType: 'text', // Expect HTML text response
            });

            if (response.data) {
                const htmlContent = response.data;

                // Open in new tab
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');

                    const documentElement = doc.documentElement;

                    documentElement.getElementsByTagName('body')[0].style.overflow = 'auto'

                    newWindow.document.open();
                    newWindow.document.write(documentElement.outerHTML);
                    newWindow.document.close();

                    // Add custom styles for better error visibility in the new tab
                    setTimeout(() => {
                        const style = newWindow.document.createElement('style');
                        style.textContent = `
              [data-dqm-id] {
                animation: pulse 1.5s ease-in-out infinite;
              }

              @keyframes pulse {
                0%, 100% {
                  background-color: rgba(255, 255, 0, 0.3);
                  border-color: #dc3545;
                }
                50% {
                  background-color: rgba(255, 255, 0, 0.6);
                  border-color: #ff6666;
                }
              }
            `;
                        newWindow.document.head.appendChild(style);
                    }, 100);
                }
            } else {
                console.warn('[DQM] No content in response');
                alert('Failed to load page with all errors. Please try again.');
            }
        } catch (err) {
            console.error('[DQM] Failed to fetch page with all errors:', err);
            alert('Failed to load page with all errors. Please try again.');
        } finally {
            setLoadingAllErrors(false);
        }
    };

    const pollAnalysisStatus = async (assetId: string, attempt: number = 0): Promise<void> => {
        console.log('[DQM] Polling analysis status, attempt', attempt + 1, 'for assetId:', assetId);

        const maxAttempts = 30;
        const baseDelay = 2000;
        const maxDelay = 10000;

        try {
            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let statusUrl: string;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy
                statusUrl = `${baseUrl}/dqm/assets/${assetId}/status`;
                console.log('[DQM] Polling backend:', statusUrl);
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');

                if (!dqmApiKey) {
                    throw new Error('DQM API key not available for polling');
                }

                // Validate API key encoding
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }

                const encodedApiKey = encodeURIComponent(dqmApiKey);
                statusUrl = `${baseUrl}/assets/${assetId}/status?apiKey=${encodedApiKey}`;
                console.log('[DQM] Polling direct:', statusUrl);
            }

            const response = await axios.get(statusUrl, {
                headers,
                timeout: 10000, // 10 second timeout for polling
            });

            const result = response.data;

            // Check if analysis is completed by comparing checkpoints length with totalCheckpoints
            const hasCheckpoints = result.checkpoints && Array.isArray(result.checkpoints);
            const isComplete = hasCheckpoints && 
                              result.totalCheckpoints !== undefined && 
                              result.checkpoints.length === result.totalCheckpoints;

            if (isComplete) {
                // Stop polling - analysis is done
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }

                setAnalysisData({
                    assetId: result.assetId || result.id,
                    created: result.created,
                    siteName: result.siteName,
                    totalCheckpoints: result.totalCheckpoints,
                    totalErrors: result.totalErrors,
                    checkpoints: result.checkpoints || []
                });

                setGroupedCategories(Object.entries(groupCheckpointsByCategory(result.checkpoints || [])));
                setAnalysisState('completed');
                setcurrentAssetId(null);
                console.log('[DQM] Analysis completed:', result.checkpoints.length, '/', result.totalCheckpoints, 'checkpoints');
            } else if (result.status === 'failed' || result.status === 'error') {
                // Stop polling - analysis failed
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }
                setError(result.error || result.message || 'Analysis failed with unknown error');
                setGroupedCategories([]);
                setAnalysisState('error');
                setcurrentAssetId(null);
                console.log('[DQM] Analysis failed:', result.error || result.message);
            } else {
                // Analysis still in progress
                const currentCount = hasCheckpoints ? result.checkpoints.length : 0;
                const totalCount = result.totalCheckpoints || '?';
                console.log('[DQM] Analysis in progress:', currentCount, '/', totalCount, 'checkpoints');

                // Reset error state if previously set
                if (error) {
                    setError(null);
                }
            }
        } catch (err) {
            console.error('[DQM] Polling failed:', err);

            // Check if this is an authentication error
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                handleAuthError(err);
                return;
            }

            if (attempt < maxAttempts) {
                const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
                setTimeout(() => pollAnalysisStatus(assetId, attempt + 1), delay);
            } else {
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    setPollingInterval(null);
                }
                setError('Analysis polling failed after maximum attempts');
                setGroupedCategories([]);
                setAnalysisState('error');
                setcurrentAssetId(null);
            }
        }
    };

    const startPolling = (assetId: string): void => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        console.log('[DQM] Starting polling for assetId:', assetId);

        // Initial poll
        pollAnalysisStatus(assetId);

        // Set up interval for subsequent polls
        const interval = setInterval(() => {
            // Check if we still have an asset ID (it gets cleared when analysis completes)
            if (currentAssetId) {
                pollAnalysisStatus(assetId);
            } else {
                // Analysis is done, clear the interval
                clearInterval(interval);
                setPollingInterval(null);
            }
        }, 3000);

        setPollingInterval(interval);
    };

    const stopPolling = (): void => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
        setcurrentAssetId(null);
    };

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    useEffect(() => {
        if (open) {
            startAnalysis();
        }
    }, [open])

    const startAnalysis = async (): Promise<void> => {
        setAnalysisState('analyzing');
        setError(null);
        setAuthError(null);
        setAnalysisData(null);

        try {
            // Check authentication based on session type
            if (sessionType === 'backend') {
                const token = sessionToken || getLocalStorageItem('dqm_sessionToken');
                if (!token) {
                    setAnalysisState('idle');
                    console.warn('[DQM] Cannot start analysis: No session token available');
                    return;
                }
                console.log('[DQM] Starting analysis with backend session token:', token.substring(0, 16) + '...');
            } else {
                // Direct mode: Check API key and website ID
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
                const dqmWebsiteId = credentials?.websiteId || getLocalStorageItem('dqm_websiteID');

                if (!dqmApiKey || !dqmWebsiteId) {
                    setAnalysisState('idle');
                    console.warn('[DQM] Cannot start analysis: No credentials available');
                    return;
                }

                // Validate API key encoding (only for direct mode)
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }
                console.log('[DQM] Starting analysis with direct API key');
            }

            // DEBUG MODE: Use debugHtml if provided (for testing only), otherwise use actual page HTML
            let htmlToAnalyze: string;
            if (debugHtml) {
                console.warn('[DQM] DEBUG MODE: Using custom HTML from debugHtml prop');
                htmlToAnalyze = debugHtml;
            } else {
                htmlToAnalyze = document.documentElement.outerHTML;
            }

            const optimizedHtml = optimizeHtmlForAnalysis(htmlToAnalyze);

            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let apiUrl: string;
            let requestData: any;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy
                apiUrl = `${baseUrl}/dqm/assets`;
                requestData = {
                    html: optimizedHtml,
                    url: window.location.href,
                };
                console.log('[DQM] Using backend mode:', apiUrl);
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');
                const dqmWebsiteId = credentials?.websiteId || getLocalStorageItem('dqm_websiteID');
                const encodedApiKey = encodeURIComponent(dqmApiKey!);
                
                apiUrl = `${baseUrl}/assets?apiKey=${encodedApiKey}`;
                requestData = {
                    websiteId: dqmWebsiteId,
                    content: optimizedHtml,
                    contentType: 'text/html; charset=UTF-8',
                    title: document.title,
                    timestamp: new Date().toISOString()
                };
                
                // Override Content-Type for direct mode
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
                console.log('[DQM] Using direct mode:', apiUrl);
            }

            const response = await axios.post(apiUrl, requestData, {
                headers,
                timeout: 30000, // 30 second timeout
            });

            const assetId = response.data?.assetId || response.data?.id;
            
            if (assetId) {
                setcurrentAssetId(assetId);
                startPolling(assetId);
            } else {
                throw new Error('No Asset ID returned from API');
            }
        } catch (err) {
            console.error('[DQM] Analysis failed:', err);

            // Check if this is an authentication error
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                handleAuthError(err);
                setAnalysisState('error');
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
            setAnalysisState('error');
            stopPolling();
        }
    };

    const calculateQualityScore = (data: AnalysisData): number => {
        if (!data.totalCheckpoints || data.totalCheckpoints === 0) return 0;
        return Math.round(((data.totalCheckpoints - data.totalErrors) / data.totalCheckpoints) * 100);
    };

    const groupCheckpointsByCategory = (checkpoints: AnalysisData['checkpoints']) => {
        const categories = checkpoints.reduce((acc, checkpoint) => {
            if (!acc[checkpoint.category]) {
                acc[checkpoint.category] = [];
            }
            acc[checkpoint.category].push(checkpoint);
            return acc;
        }, {} as Record<string, AnalysisData['checkpoints']>);
        // Assign colors to each checkpoint
        Object.entries(categories).forEach(([category, cps]) => {
            cps.forEach((cp) => {
                cp.colors = getCategoryColor(category, Object.keys(categories));
            })
        });
        return categories;
    };

    const fetchHighlightedErrors = async (assetId: string, checkpointId: string, openTab = 'browser'): Promise<void> => {
        setHighlightedContent('');
        setLoadingHighlight(true);
        setCurrentCheckpointId(checkpointId);
        // Start with browser view (navigation arrows only appear in source view)
        setHighlightViewMode(openTab as any);
        setOpenHighlightModal(true);

        // Reset cached content for new checkpoint
        setCachedContentByCheckpoint(prev => ({
            ...prev,
            [checkpointId]: {browser: '', source: ''},
        }));
        previousViewModeRef.current = openTab as any;

        // Find and set the current checkpoint object
        const checkpoint = analysisData?.checkpoints.find(cp => cp.id === checkpointId) || null;
        setCurrentCheckpoint(checkpoint);

        try {
            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let browserUrl: string;
            let sourceUrl: string;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy with highlightSource query param
                browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=false`;
                sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=true`;
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem('dqm_apiKey');

                if (!dqmApiKey) {
                    throw new Error('DQM API key not found');
                }

                // Validate API key encoding
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }

                const encodedApiKey = encodeURIComponent(dqmApiKey);
                browserUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=false`;
                sourceUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=true`;
            }

            // Fire both requests in parallel
            const browserResponse = checkpoint?.canHighlight.page && await axios.get(browserUrl, {
                headers,
                timeout: 15000, // 15 seconds
                responseType: 'text', // Expect HTML text response
            }) || undefined;

            const sourceResponse = checkpoint?.canHighlight.source && await axios.get(sourceUrl, {
                headers,
                timeout: 15000, // 15 seconds
                responseType: 'text', // Expect HTML text response
            }) || undefined;

            // Process browser view
            const browserHtml = browserResponse?.data || '<p>No highlighted content available.</p>';
            const sourceHtml = sourceResponse?.data || '<p>No source content available for this checkpoint.</p>';

            // Cache both views
            setCachedContentByCheckpoint(prev => ({
                ...prev,
                [checkpointId]: {
                    browser: browserHtml,
                    source: sourceHtml,
                },
            }));

            console.log('[DQM] Both views loaded and cached');

            if (openTab === 'browser' && checkpoint?.canHighlight?.page && analysisData) {
                restoreBrowserView(analysisData.assetId, checkpoint.id);
            } else if (openTab === 'source' && checkpoint?.canHighlight?.source && analysisData) {
                fetchSourceViewForCheckpoint(analysisData.assetId, checkpoint.id);
            }
        } catch (err) {
            console.error('[DQM] Failed to fetch highlighted content:', err);
            setHighlightedContent('<p style="color: #dc3545;">Failed to load highlighted content. Please try again.</p>');
        } finally {
            setLoadingHighlight(false);
        }
    };

    // Separate function to fetch source view for a specific checkpoint
    const fetchSourceViewForCheckpoint = async (assetId: string, checkpointId: string): Promise<void> => {
        // Check if source view is already cached for THIS checkpoint
        const cachedForCheckpoint = cachedContentByCheckpoint[checkpointId];
        if (cachedForCheckpoint && cachedForCheckpoint.source) {
            console.log('[DQM] Using cached source view for checkpoint:', checkpointId);
            setHighlightedContent(cachedForCheckpoint.source);
            return;
        }

        // This should never happen since we prefetch both views, but keep as fallback
        console.warn('[DQM] Source view not in cache for checkpoint:', checkpointId, ', fetching...');
        setLoadingHighlight(true);

        try {
            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let sourceUrl: string;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy with highlightSource=true for source view
                sourceUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=true`;
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem("dqm_apiKey");

                if (!dqmApiKey) {
                    throw new Error('DQM API key not found');
                }

                // Validate API key encoding
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }

                // URL-encode the API key for use in query parameters
                const encodedApiKey = encodeURIComponent(dqmApiKey);
                sourceUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=true`;
            }

            const response = await axios.get(sourceUrl, {
                headers,
                timeout: 15000, // 15 seconds
                responseType: 'text', // Expect HTML text response
            });

            if (response.data) {
                const sourceHtml = response.data;
                setHighlightedContent(sourceHtml);
                // Cache source view for this specific checkpoint
                setCachedContentByCheckpoint(prev => ({
                    ...prev,
                    [checkpointId]: {
                        ...prev[checkpointId],
                        source: sourceHtml,
                    },
                }));
            } else {
                console.warn('[DQM] No highlighted content in response');
                setHighlightedContent('<p>No highlighted content available.</p>');
            }
        } catch (err) {
            console.error('[DQM] Failed to fetch source view:', err);
            setHighlightedContent('<p style="color: #dc3545;">Failed to load source view. Please try again.</p>');
        } finally {
            setLoadingHighlight(false);
        }
    };

    // Separate function to restore browser view (use cached content if available)
    const restoreBrowserView = async (assetId: string, checkpointId: string): Promise<void> => {
        // Check if browser view is already cached for THIS checkpoint
        const cachedForCheckpoint = cachedContentByCheckpoint[checkpointId];
        if (cachedForCheckpoint && cachedForCheckpoint.browser) {
            console.log('[DQM] Using cached browser view for checkpoint:', checkpointId);
            setHighlightedContent(cachedForCheckpoint.browser);
            return;
        }

        // This should never happen since we prefetch both views, but keep as fallback
        console.warn('[DQM] Browser view not in cache for checkpoint:', checkpointId, ', fetching...');
        setLoadingHighlight(true);

        try {
            // Get API base URL and headers based on session type
            const baseUrl = getApiBaseUrl();
            const headers = getApiHeaders();

            let browserUrl: string;

            if (sessionType === 'backend') {
                // Backend mode: Call backend proxy with highlightSource=false for browser view
                browserUrl = `${baseUrl}/dqm/assets/${assetId}/pagehighlight/${checkpointId}?highlightSource=false`;
            } else {
                // Direct mode: Call Crownpeak DQM API directly
                const dqmApiKey = credentials?.apiKey || getLocalStorageItem("dqm_apiKey");

                if (!dqmApiKey) {
                    throw new Error('DQM API key not found');
                }

                // Validate API key encoding
                try {
                    validateApiKeyEncoding(dqmApiKey);
                } catch (encodingError) {
                    throw new Error(`Invalid API key: ${encodingError instanceof Error ? encodingError.message : 'encoding error'}`);
                }

                // URL-encode the API key for use in query parameters
                const encodedApiKey = encodeURIComponent(dqmApiKey);
                browserUrl = `${baseUrl}/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=false`;
            }

            const response = await axios.get(browserUrl, {
                headers,
                timeout: 15000, // 15 seconds
                responseType: 'text', // Expect HTML text response
            });

            if (response.data) {
                const browserHtml = response.data;
                setHighlightedContent(browserHtml);
                // Cache browser view for this specific checkpoint
                setCachedContentByCheckpoint(prev => ({
                    ...prev,
                    [checkpointId]: {
                        ...prev[checkpointId],
                        browser: browserHtml,
                    },
                }));
            } else {
                console.warn('[DQM] No highlighted content in response');
                setHighlightedContent('<p>No highlighted content available.</p>');
            }
        } catch (err) {
            console.error('[DQM] Failed to restore browser view:', err);
            setHighlightedContent('<p style="color: #dc3545;">Failed to load browser view. Please try again.</p>');
        } finally {
            setLoadingHighlight(false);
        }
    };

    // Debug logging
    console.log('[DQMSidebar] Render state:', {
        isAuthenticated,
        analysisState,
        authError,
        hasCredentials: !!credentials,
    });

    return (
        <ThemeProvider theme={createTheme({
            palette: {
                primary: {main: '#1976d2', light: '#42a5f5', dark: '#1565c0'},
                secondary: {main: '#f50057'},
                background: {default: '#fafafa'},
            },
            typography: {
                fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
                htmlFontSize: 18, // allow MUI pxToRem to compute sizes when used internally
                fontSize: 18, // larger base
                h6: {fontSize: '22px'},
                h5: {fontSize: '24px'},
                h4: {fontSize: '26px'},
                h3: {fontSize: '28px'},
                h2: {fontSize: '30px'},
                h1: {fontSize: '32px'},
                subtitle2: {fontSize: '19px'},
                subtitle1: {fontSize: '18px'},
                body1: {fontSize: '18px'},
                body2: {fontSize: '17px'},
                button: {fontSize: '17px'},
            },
            shape: {borderRadius: 8},
            components: {
                MuiDialog: {
                    styleOverrides: {root: {zIndex: 999999}},
                },
                MuiPopper: {defaultProps: {disablePortal: true}},
                MuiFab: {styleOverrides: {root: {zIndex: 999999}}},
                MuiBackdrop: {styleOverrides: {root: {zIndex: 999999 - 1}}},
            },
        })}>
            <CssBaseline/>
            <Tooltip title="DQM Quality Analysis" placement="left">
                <StyledFab
                    onClick={() => open ? onClose() : onOpen()}
                    aria-label="DQM Quality Analysis"
                    style={{
                        opacity: open ? 0 : 1,
                        position: 'fixed',
                        zIndex: 1400,
                        transform: open ? 'translateX(80px)' : 'none',
                        transition: 'opacity 0.15s ease-in-out, transform 0.25s ease-in-out',
                        pointerEvents: open ? 'none' : 'auto'
                    }}
                >
                    <TaskAltIcon sx={{fontSize: 22}}/>
                </StyledFab>
            </Tooltip>

            <StyledDrawer
                anchor="right"
                open={open}
                onClose={onClose}
                variant="temporary"
                elevation={16}
                ModalProps={{
                    keepMounted: false,
                    disablePortal: false,
                    disableScrollLock: false,
                    hideBackdrop: false,
                }}
            >
                {/* Show full-screen login overlay if not authenticated */}
                {!isAuthenticated ? (
                    <Box
                        sx={{
                            width: '730px',
                            height: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#f5f5f5',
                            overflow: 'auto',
                        }}
                    >
                        {/* OAuth2 Callback Handler */}
                        {config?.oauth2Config && (
                            <OAuth2CallbackHandler
                                config={config}
                                onAuthSuccess={handleAuthSuccess}
                                onAuthError={handleAuthenticationError}
                            />
                        )}
                        
                        {/* Header with Logo */}
                        <Box
                            sx={{
                                background: 'linear-gradient(135deg, #711bc1 0%, #8e44d6 100%)',
                                color: 'white',
                                py: 4,
                                px: 3,
                                textAlign: 'center',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            }}
                        >
                            <svg
                                style={{ width: 'auto', height: '60px', marginBottom: '1rem' }}
                                aria-label="Crownpeak Digital Quality & Accessibility Analysis"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 500 500"
                            >
                                <path
                                    d="M18.84,250c0-4.39,1.18-8.74,3.39-12.55L125.16,60.82c4.51-7.75,12.92-12.54,21.92-12.54h205.84c9.03,0,17.41,4.79,21.92,12.54l102.92,176.63c2.21,3.8,3.39,8.16,3.39,12.55,0,4.39-1.18,8.74-3.39,12.54l-102.92,176.64c-4.51,7.75-12.92,12.55-21.92,12.55h-205.84c-9.03,0-17.41-4.8-21.92-12.55L22.24,262.55c-2.21-3.8-3.39-8.16-3.39-12.54ZM12.5,250c0,5.41,1.42,10.82,4.25,15.67l102.92,176.64c5.67,9.71,16.11,15.67,27.41,15.67h205.84c11.3,0,21.75-5.96,27.41-15.67l102.92-176.64c2.83-4.85,4.25-10.26,4.25-15.67,0-5.41-1.42-10.82-4.25-15.68l-102.92-176.64c-5.67-9.71-16.11-15.67-27.41-15.67h-205.84c-11.3,0-21.75,5.96-27.41,15.67L16.75,234.33c-2.83,4.85-4.25,10.27-4.25,15.68Z"
                                    style={{ fill: '#fff', stroke: '#fff', strokeMiterlimit: 10, strokeWidth: 3 }}
                                />
                                <path
                                    d="M41.06,250c0-3.97,1.07-7.9,3.07-11.34l93.03-159.66c4.08-7.01,11.68-11.34,19.82-11.34h186.06c8.16,0,15.74,4.33,19.82,11.34l93.03,159.66c2,3.44,3.07,7.37,3.07,11.34s-1.07,7.9-3.07,11.34l-93.03,159.66c-4.08,7.01-11.68,11.34-19.82,11.34h-186.06c-8.16,0-15.74-4.34-19.82-11.34l-93.03-159.66c-2-3.44-3.07-7.37-3.07-11.34Z"
                                    style={{ fill: '#fff', strokeWidth: 0 }}
                                />
                                <g>
                                    <path
                                        d="M347.45,204.4c-2.14-9.18-8.83-8.76-16.53-7.36-20.65,3.73-41.32,7.7-62.16,9.94-4.02.43-10.73,1.04-19.22,1.09,0,.02,0,.04,0,.06-6.08-.08-12.18-.41-18.31-1.07-20.84-2.25-41.51-6.21-62.16-9.94-7.7-1.39-14.39-1.81-16.53,7.36-2,8.6,4.3,11.78,10.98,13.76,7.09,2.11,14.26,4.15,21.54,5.35,17.54,2.88,35.17,5.25,52.85,7.83-4.75,38.47-13.41,74.69-39.48,104.67-2.52,2.9-1.87,11.59.69,15.16,4.35,6.07,10.07,2.47,14.89-1.86,18.01-16.16,28.26-36.83,35.98-62.51,0-.06,0-.12,0-.19,0,.04,0,.07,0,.11,7.71,25.67,17.97,46.35,35.98,62.51,4.82,4.33,10.54,7.93,14.89,1.86,2.57-3.57,3.21-12.27.69-15.16-26.07-29.98-34.72-66.2-39.48-104.67,17.68-2.59,35.31-4.95,52.85-7.83,7.28-1.2,14.45-3.24,21.54-5.35,6.68-1.99,12.98-5.16,10.98-13.76Z"
                                        style={{ fill: '#711bc1', strokeWidth: 0 }}
                                    />
                                    <circle cx="250" cy="171.61" r="26.08" style={{ fill: '#711bc1', strokeWidth: 0 }}/>
                                </g>
                            </svg>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                Crownpeak DQM
                            </Typography>
                            <Typography variant="subtitle1">
                                Digital Quality & Accessibility Analysis
                            </Typography>
                        </Box>

                        {/* Login Content */}
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                overflow: 'auto',
                            }}
                        >
                            <DQMLogin
                                config={config || {}}
                                onAuthSuccess={handleAuthSuccess}
                                onAuthError={handleAuthenticationError}
                                initialError={authError}
                            />
                        </Box>

                        {/* Close Button (top right) */}
                        <IconButton
                            onClick={onClose}
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                },
                            }}
                            aria-label="Close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                ) : (
                    <>
                        {/* Normal Sidebar Content when authenticated */}
                <SidebarHeader>
                    <Box display="flex" alignItems="center" gap={1.5} justifyContent="space-between"
                         width="100%">
                        <Typography variant="h6" component="h1" fontWeight={700}
                                    color="white" flexDirection="row" alignItems="center" display="flex"
                                    gap="0.5rem">
                            <svg style={{width: 'auto', height: '50px', marginRight: '0.5rem'}} id="DQM_Logo"
                                 aria-label="Crownpeak Digial Quality & Accessibilit Analysis"
                                 data-name="Layer 1" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 500 500">
                                <path
                                    d="M18.84,250c0-4.39,1.18-8.74,3.39-12.55L125.16,60.82c4.51-7.75,12.92-12.54,21.92-12.54h205.84c9.03,0,17.41,4.79,21.92,12.54l102.92,176.63c2.21,3.8,3.39,8.16,3.39,12.55,0,4.39-1.18,8.74-3.39,12.54l-102.92,176.64c-4.51,7.75-12.92,12.55-21.92,12.55h-205.84c-9.03,0-17.41-4.8-21.92-12.55L22.24,262.55c-2.21-3.8-3.39-8.16-3.39-12.54ZM12.5,250c0,5.41,1.42,10.82,4.25,15.67l102.92,176.64c5.67,9.71,16.11,15.67,27.41,15.67h205.84c11.3,0,21.75-5.96,27.41-15.67l102.92-176.64c2.83-4.85,4.25-10.26,4.25-15.67,0-5.41-1.42-10.82-4.25-15.68l-102.92-176.64c-5.67-9.71-16.11-15.67-27.41-15.67h-205.84c-11.3,0-21.75,5.96-27.41,15.67L16.75,234.33c-2.83,4.85-4.25,10.27-4.25,15.68Z"
                                    style={{fill: '#711bc1', stroke: '#711bc1', strokeMiterlimit: 10, strokeWidth: 3}}/>
                                <path
                                    d="M41.06,250c0-3.97,1.07-7.9,3.07-11.34l93.03-159.66c4.08-7.01,11.68-11.34,19.82-11.34h186.06c8.16,0,15.74,4.33,19.82,11.34l93.03,159.66c2,3.44,3.07,7.37,3.07,11.34s-1.07,7.9-3.07,11.34l-93.03,159.66c-4.08,7.01-11.68,11.34-19.82,11.34h-186.06c-8.16,0-15.74-4.34-19.82-11.34l-93.03-159.66c-2-3.44-3.07-7.37-3.07-11.34Z"
                                    style={{fill: '#711bc1', strokeWidth: 0}}/>
                                <g>
                                    <path
                                        d="M347.45,204.4c-2.14-9.18-8.83-8.76-16.53-7.36-20.65,3.73-41.32,7.7-62.16,9.94-4.02.43-10.73,1.04-19.22,1.09,0,.02,0,.04,0,.06-6.08-.08-12.18-.41-18.31-1.07-20.84-2.25-41.51-6.21-62.16-9.94-7.7-1.39-14.39-1.81-16.53,7.36-2,8.6,4.3,11.78,10.98,13.76,7.09,2.11,14.26,4.15,21.54,5.35,17.54,2.88,35.17,5.25,52.85,7.83-4.75,38.47-13.41,74.69-39.48,104.67-2.52,2.9-1.87,11.59.69,15.16,4.35,6.07,10.07,2.47,14.89-1.86,18.01-16.16,28.26-36.83,35.98-62.51,0-.06,0-.12,0-.19,0,.04,0,.07,0,.11,7.71,25.67,17.97,46.35,35.98,62.51,4.82,4.33,10.54,7.93,14.89,1.86,2.57-3.57,3.21-12.27.69-15.16-26.07-29.98-34.72-66.2-39.48-104.67,17.68-2.59,35.31-4.95,52.85-7.83,7.28-1.2,14.45-3.24,21.54-5.35,6.68-1.99,12.98-5.16,10.98-13.76Z"
                                        style={{fill: '#fff', strokeWidth: 0}}/>
                                    <circle cx="250" cy="171.61" r="26.08" style={{fill: '#fff', strokeWidth: 0}}/>
                                </g>
                            </svg>
                            Crownpeak Digital Quality and Accessibility
                        </Typography>
                        <Box display="flex" gap={1}>
                            <Tooltip title="Logout">
                                <IconButton
                                    onClick={handleLogout}
                                    sx={{
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                    }}
                                    aria-label="Logout"
                                >
                                    <LogoutIcon/>
                                </IconButton>
                            </Tooltip>
                            <IconButton
                                onClick={onClose}
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                                aria-label="Close sidebar"
                            >
                                <CloseIcon/>
                            </IconButton>
                        </Box>
                    </Box>
                </SidebarHeader>

                <SidebarContent>
                    <ErrorBoundary>
                        {analysisState === 'idle' && isAuthenticated && (
                            <Box p={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
                                <Typography variant="h5" fontWeight={600} gutterBottom color="text.secondary" textAlign="center">
                                    Ready to Analyze
                                </Typography>
                                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 3 }}>
                                    Click "Run Quality Check" to analyze the current page for accessibility and quality issues.
                                </Typography>
                                <Box 
                                    component="svg" 
                                    sx={{ width: '120px', height: '120px', opacity: 0.3 }}
                                    viewBox="0 0 24 24"
                                >
                                    <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                                </Box>
                            </Box>
                        )}
                        
                        {analysisState === 'analyzing' && (
                            <SidebarSkeleton expanded={expanded}/>
                        )}

                        {analysisState === 'error' && authError && (
                            <Box p={2}>
                                <Alert
                                    severity={authError.includes('Permission denied') ? 'warning' : 'error'}
                                >
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        {authError.includes('Permission denied') ? 'Access Denied' : 
                                         authError.includes('not configured') ? 'Configuration Required' : 
                                         'Authentication Error'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {authError}
                                    </Typography>
                                </Alert>
                            </Box>
                        )}

                        {analysisState === 'error' && !authError && (
                            <Box p={2}>
                                <Alert
                                    severity="error"
                                    action={
                                        <Button
                                            color="inherit"
                                            size="small"
                                            onClick={startAnalysis}
                                            startIcon={<RefreshIcon/>}
                                            sx={{textTransform: 'none', fontWeight: 'bolder', fontSize: '1rem'}}
                                        >
                                            Retry
                                        </Button>
                                    }
                                >
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        Analysis Failed
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {error}
                                    </Typography>
                                </Alert>
                            </Box>
                        )}

                        {analysisState === 'completed' && analysisData && (
                            <Box pb={0}>
                                {/* Quality Overview */}
                                <QualityOverviewCard>
                                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        gap: 1,
                                    }}>
                                        Overall Quality
                                    </Typography>
                                    <Box display="flex" alignItems="center" justifyContent="flex-start "
                                         columnGap={'60px'} pt={2}>
                                        <Box display="flex" flexDirection="row" alignItems="center"
                                             justifyContent="center" gap={5}>
                                            <CircularProgressWithLabel value={calculateQualityScore(analysisData)}/>
                                            <Box>
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}
                                                     mb={1}
                                                     flexDirection="column">
                                                    <Typography color="text.primary" fontSize="12px" fontWeight={400}
                                                                sx={{color: 'gray', textAlign: 'center'}}>
                                                        Passed
                                                        <p style={{
                                                            margin: 0,
                                                            fontWeight: 600,
                                                            fontSize: '26px',
                                                            color: '#28a745'
                                                        }}>{analysisData.totalCheckpoints - analysisData.totalErrors}</p>
                                                    </Typography>
                                                </Box>
                                                <hr style={{
                                                    width: '100%',
                                                    border: '1px solid #e0e0e0',
                                                    margin: '10px 0px 10px 0px'
                                                }}/>
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                    <Typography fontSize="12px" fontWeight={400}
                                                                sx={{color: 'gray', textAlign: 'center'}}>
                                                        <p style={{
                                                            margin: 0,
                                                            fontWeight: 600,
                                                            fontSize: '26px',
                                                            color: '#dc3545'
                                                        }}>{analysisData.totalErrors}</p>
                                                        Failed
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        {/* Button to show page with all errors */}
                                        <Box display="flex" justifyContent="center" mt={3}>
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                onClick={openPageWithAllErrors}
                                                disabled={loadingAllErrors}
                                                sx={{
                                                    borderRadius: 2,
                                                    py: 1,
                                                    mb: 3,
                                                    fontSize: '17px',
                                                    textTransform: 'none',
                                                }}
                                            >
                                                {loadingAllErrors ? (
                                                    <CircularProgress size={24} sx={{mr: 1}}/>
                                                ) : null}
                                                Show Page with all Errors
                                            </Button>
                                        </Box>
                                    </Box>
                                </QualityOverviewCard>

                                {/* Quality Breakdown - Accordion with compact collapsed view */}
                                <Accordion expanded={expanded}
                                           onChange={() => {
                                               setExpanded(!expanded)
                                               localStorage.setItem('dqm_quality_breakdown_expanded', (!expanded).toString());
                                           }}
                                           sx={{
                                               borderRadius: '10px !important',
                                               marginBottom: 2,
                                               boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                               '&:before': {display: 'none'},
                                               overflowX: 'visible',
                                           }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon/>}
                                        sx={{
                                            paddingX: 3,
                                            '& .MuiAccordionSummary-content': {
                                                alignItems: 'center',
                                                overflow: 'scroll',
                                                justifyContent: 'flex-start',
                                                paddingY: 2,
                                                marginRight: 3,
                                            },
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight={700} sx={{
                                            flexShrink: 0,
                                        }}>
                                            Quality Breakdown
                                        </Typography>

                                        {/* Collapsed view: Show category circles with tooltips */}
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            gap={1}
                                            mx={2}
                                            px={2.5}
                                            sx={{
                                                '.MuiAccordionSummary-root:not(.Mui-expanded) &': {
                                                    opacity: 1,
                                                    width: groupedCategories.length * 48,
                                                    transition: 'opacity 0.3s ease 300ms, width 0s ease 0s',
                                                },
                                                '.MuiAccordionSummary-root.Mui-expanded &': {
                                                    opacity: 0,
                                                    width: 0,
                                                    pointerEvents: 'none',
                                                    transition: 'opacity 300ms ease 50ms, width 1250ms ease 200ms',
                                                }
                                            }}
                                        >
                                            {sortBy(groupedCategories, [([_, checkpoints]) => (checkpoints.filter(cp => cp.failed).length / checkpoints.length)])
                                                .reverse()
                                                .map(([category, checkpoints]) => {
                                                    const failedCount = checkpoints.filter(cp => cp.failed).length;
                                                    const passedCount = checkpoints.length - failedCount;
                                                    const bg = checkpoints[0]?.colors.bg;
                                                    const percentage = Math.round((passedCount / checkpoints.length) * 100);

                                                    return (
                                                        <Tooltip
                                                            key={category}
                                                            title={
                                                                <Box sx={{p: 0.5}} display="flex" flexDirection="column"
                                                                     alignItems="center">
                                                                    <Typography variant="body2" fontWeight={600}
                                                                                sx={{mb: 0.5}}>
                                                                        {category}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        {percentage}% passed
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        {failedCount === 0
                                                                            ? 'All Passed'
                                                                            : `${passedCount} of ${checkpoints.length} passed`
                                                                        }
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                            placement="top"
                                                            arrow
                                                        >
                                                            <CircularProgress
                                                                variant="determinate"
                                                                enableTrackSlot
                                                                value={percentage}
                                                                size={40}
                                                                thickness={4}
                                                                sx={{
                                                                    color: bg,
                                                                    // position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    );
                                                })}
                                        </Box>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{padding: 3, paddingTop: 0}}>
                                        <CategoryCard>
                                            <Box display="flex" flexDirection="row" flexWrap="wrap" gap={1}>
                                                {/*Sort categories by failure rate (highest first)*/}
                                                {sortBy(groupedCategories, [([_, checkpoints]) => (checkpoints.filter(cp => cp.failed).length / checkpoints.length)])
                                                    .reverse()
                                                    .map(([category, checkpoints]) => {
                                                            const failedCount = checkpoints.filter(cp => cp.failed).length;
                                                            const passedCount = checkpoints.length - failedCount;
                                                            const bg = checkpoints[0]?.colors.bg;

                                                            return (
                                                                <Box
                                                                    key={category}
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    flexDirection="column"
                                                                    gap={1}
                                                                    width="200px"
                                                                >
                                                                    <Box position="relative" display="inline-flex"
                                                                         alignItems="center"
                                                                         justifyContent="center">
                                                                        <CircularProgress
                                                                            enableTrackSlot={true}
                                                                            variant="determinate"
                                                                            value={(passedCount / checkpoints.length) * 100}
                                                                            size={'100px'}
                                                                            thickness={4}
                                                                            sx={{
                                                                                color: bg,
                                                                                '& .MuiCircularProgress-circleNegative': {
                                                                                    stroke: '#e0e0e0',
                                                                                },
                                                                            }}
                                                                        />
                                                                        <Typography variant="h6" component="div" color={bg}
                                                                                    sx={{
                                                                                        position: 'absolute',
                                                                                        top: '50%',
                                                                                        left: '50%',
                                                                                        transform: 'translate(-50%, -50%)',
                                                                                        fontWeight: 700,
                                                                                    }}>
                                                                            {Math.round((passedCount / checkpoints.length) * 100)}%
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography component="div" fontWeight="bold"
                                                                                color={"gray"}
                                                                                sx={{
                                                                                    fontSize: '1rem',
                                                                                    textAlign: 'center',
                                                                                    fontWeight: 600,
                                                                                }}>
                                                                        {category}
                                                                        <Typography component="div" fontWeight="bold"
                                                                                    color={"gray"} pb={4}
                                                                                    sx={{
                                                                                        fontSize: '0.75rem',
                                                                                        textAlign: 'center',
                                                                                        fontWeight: 600,
                                                                                    }}>
                                                                            <Typography
                                                                                component="span"
                                                                                fontWeight={400}
                                                                                color={failedCount > 0 ? '#dc3545' : '#28a745'}
                                                                            >
                                                                                {failedCount === 0 ? 'All Passed' : `${passedCount} of ${checkpoints.length} Passed`}
                                                                            </Typography>
                                                                        </Typography>
                                                                    </Typography>
                                                                </Box>
                                                            )
                                                        }
                                                    )}
                                            </Box>
                                        </CategoryCard>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Failed Checkpoints */}
                                {analysisData.checkpoints.some(cp => cp.failed) && (
                                    <>
                                        <Typography variant="h4" fontWeight={600} gutterBottom sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 2,
                                            pt: 4
                                        }}>
                                            Failed Checkpoints
                                            ({analysisData.checkpoints.filter(cp => cp.failed).length})
                                        </Typography>

                                        {/* Category Filter Chips - Sticky section outside the card */}
                                        <Box sx={{
                                            position: 'sticky',
                                            top: -31,
                                            zIndex: 10,
                                            py: 2,
                                            borderRadius: 0
                                        }}>
                                            <Card sx={{
                                                padding: 2,
                                                pb: 1,
                                                px: '20px',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                            }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center"
                                                     mb={1}>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                        Filter by Category ·
                                                        Showing {selectedCategoryFilters.size > 0 ? selectedCategoryFilters.size : 'all'} of {Object.keys(groupedCategories).length} categories
                                                    </Typography>
                                                    <Button size="small"
                                                            onClick={() => setSelectedCategoryFilters(new Set())}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontWeight: 600,
                                                                opacity: selectedCategoryFilters.size === 0 ? 0 : 1,
                                                                transition: 'opacity 0.2s ease-in-out',
                                                            }}>
                                                        Show All
                                                    </Button>
                                                </Box>
                                                <Box display="flex" gap={1} flexWrap="nowrap"
                                                     sx={{overflowX: 'scroll', pb: 2.5, pt: 1}}>
                                                    {/*Sort categories by failure rate (highest first)*/}
                                                    {sortBy(groupedCategories, [([_, checkpoints]) => (checkpoints.filter(cp => cp.failed).length / checkpoints.length)])
                                                        .filter(([, checkpoints]) => checkpoints.some(cp => cp.failed))
                                                        .reverse()
                                                        .map(([category, checkpoints]) => {
                                                            const failedCount = checkpoints.filter(cp => cp.failed).length;
                                                            const {bg, text} = checkpoints[0]?.colors || {};
                                                            const isSelected = selectedCategoryFilters.has(category);

                                                            return (
                                                                <Chip
                                                                    key={category}
                                                                    label={`${category} (${failedCount})`}
                                                                    onClick={() => {
                                                                        setSelectedCategoryFilters(prev => {
                                                                            const newSet = new Set(prev);
                                                                            if (newSet.has(category)) {
                                                                                newSet.delete(category);
                                                                            } else {
                                                                                newSet.add(category);
                                                                            }
                                                                            return newSet;
                                                                        });
                                                                    }}
                                                                    sx={{
                                                                        backgroundColor: isSelected ? bg : 'transparent',
                                                                        color: isSelected ? text : selectedCategoryFilters.size === 0 ? bg : '#555555',
                                                                        border: `2px solid ${isSelected ? bg : selectedCategoryFilters.size === 0 ? bg : '#B1B1B1'}`,
                                                                        fontWeight: 600,
                                                                        fontSize: '0.875rem',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': {
                                                                            backgroundColor: bg,
                                                                            color: text,
                                                                            transform: 'translateY(-2px)',
                                                                            boxShadow: `0 4px 8px ${bg}40`,
                                                                            border: `2px solid ${bg}`,
                                                                        },
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                </Box>
                                            </Card>
                                        </Box>

                                        <Box sx={{
                                            minHeight: 'calc(100vh - 320px)'
                                        }}>
                                            <FailedCheckpointsCard>
                                                <List sx={{p: 0}}>
                                                    {/*Sort categories by failure rate (highest first)*/}
                                                    {sortBy(groupedCategories, [([_, checkpoints]) => (checkpoints.filter(cp => cp.failed).length / checkpoints.length)])
                                                        .reverse()
                                                        .filter(([category, checkpoints]) => {
                                                            // Apply category filter
                                                            if (selectedCategoryFilters.size === 0) return checkpoints.some(cp => cp.failed);
                                                            return selectedCategoryFilters.has(category) && checkpoints.some(cp => cp.failed);
                                                        })
                                                        .map(([_, checkpoints]) => {
                                                            return (
                                                                <>
                                                                    {
                                                                        checkpoints.filter(({failed}) => failed).map((checkpoint) => {
                                                                            const {bg} = checkpoint.colors;
                                                                            return (
                                                                                <ListItem key={checkpoint.id}
                                                                                          sx={{
                                                                                              px: 0,
                                                                                              py: 1.5,
                                                                                              alignItems: 'flex-start'
                                                                                          }}>
                                                                                    <Box mt={0.5}>
                                                                                        <Typography variant="h5"
                                                                                                    component="div"
                                                                                                    fontWeight={600}
                                                                                                    mb={1.5}>
                                                                                            {checkpoint.name}
                                                                                        </Typography>
                                                                                        <Box display="flex" gap={1} flexWrap="wrap"
                                                                                             mb={2}>
                                                                                            {/* Highlight button - only show if checkpoint supports highlighting */}
                                                                                            {checkpoint?.canHighlight.page && (
                                                                                                <Button
                                                                                                    variant="outlined"
                                                                                                    size="small"
                                                                                                    startIcon={
                                                                                                        <VisibilityIcon/>}
                                                                                                    onClick={() => {
                                                                                                        setCurrentCheckpointId(checkpoint.id)
                                                                                                        fetchHighlightedErrors(analysisData.assetId, checkpoint.id, 'browser')
                                                                                                    }}
                                                                                                    sx={{
                                                                                                        textTransform: 'none',
                                                                                                        borderRadius: 2,
                                                                                                        fontSize: '0.875rem',
                                                                                                    }}
                                                                                                >
                                                                                                    View in Browser
                                                                                                </Button>
                                                                                            )}
                                                                                            {checkpoint?.canHighlight.source && (
                                                                                                <Button
                                                                                                    variant="outlined"
                                                                                                    size="small"
                                                                                                    startIcon={
                                                                                                        <VisibilityIcon/>}
                                                                                                    onClick={() => {
                                                                                                        setCurrentCheckpointId(checkpoint.id)
                                                                                                        fetchHighlightedErrors(analysisData.assetId, checkpoint.id, 'source')
                                                                                                    }}
                                                                                                    sx={{
                                                                                                        textTransform: 'none',
                                                                                                        borderRadius: 2,
                                                                                                        fontSize: '0.875rem',
                                                                                                    }}
                                                                                                >
                                                                                                    View Source
                                                                                                </Button>
                                                                                            )}
                                                                                            <Typography variant="body2"
                                                                                                        color={bg}
                                                                                                        mr={2}
                                                                                                        ml={checkpoint?.canHighlight.source || checkpoint?.canHighlight.page ? 1 : 0}
                                                                                                        sx={{
                                                                                                            fontSize: '0.875rem',
                                                                                                            alignSelf: 'center'
                                                                                                        }}>
                                                                                                {checkpoint.category}
                                                                                            </Typography>
                                                                                            {checkpoint.topics?.map((topic) => (
                                                                                                <Typography
                                                                                                    key={topic}
                                                                                                    variant="body2"
                                                                                                    color="text.secondary"
                                                                                                    mr={2}
                                                                                                    sx={{
                                                                                                        fontSize: '0.875rem',
                                                                                                        alignSelf: 'center'
                                                                                                    }}>
                                                                                                    {topic}
                                                                                                </Typography>
                                                                                            ))}
                                                                                        </Box>

                                                                                        <SafeParsedHtml
                                                                                            html={checkpoint.description || ''}/>
                                                                                    </Box>
                                                                                </ListItem>
                                                                            )
                                                                        })
                                                                    }
                                                                </>
                                                            );
                                                        })}
                                                </List>
                                            </FailedCheckpointsCard>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </ErrorBoundary>
                </SidebarContent>

                <SidebarFooter>
                    <Button
                        // Removed large custom font size to use theme defaults
                        onClick={analysisState === 'completed' ? startAnalysis : startAnalysis}
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={analysisState === 'analyzing' || !isAuthenticated || !!authError}
                        sx={{
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none',
                            background: 'linear-gradient(156deg, #b604d4 0%, #e38ef2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(156deg, #9800b1 0%, #d091db 100%)',
                            },
                            fontSize: '17px',
                            transition: 'background 0.3s ease',
                            '&:disabled': {
                                background: '#e0e0e0',
                                color: '#9e9e9e',
                            },
                        }}
                    >
                        {analysisState === 'analyzing' ? 'Analyzing...' : 'Run Quality Check'}
                    </Button>
                </SidebarFooter>

                {/* Highlighted Errors Modal */}
                <Dialog
                    open={openHighlightModal}
                    onClose={() => setOpenHighlightModal(false)}
                    maxWidth="xl"
                    fullWidth
                    PaperProps={{
                        style: {
                            borderRadius: 12,
                            padding: 24,
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 24px',
                            borderBottom: '1px solid #e0e0e0',
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} color="text.primary">
                            Highlighted Errors
                        </Typography>
                        <IconButton
                            onClick={() => setOpenHighlightModal(false)}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                },
                            }}
                            aria-label="Close"
                        >
                            <CloseIcon/>
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{padding: '16px 24px', borderBottom: 'none'}}>
                        <Box flexDirection="row" display="flex" gap={2}>
                            {/* Checkpoint Information */}
                            {currentCheckpoint && (
                                <Box width="20%" sx={{
                                    maxHeight: 'calc(100vh - 300px)',
                                    height: 'calc(100vh - 300px)',
                                    overflowY: 'auto',
                                }}>
                                    <Typography variant="h6" component="div" fontWeight={600} mb={2}>
                                        {currentCheckpoint.name}
                                    </Typography>
                                    <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                        {currentCheckpoint.colors && (
                                            <Chip
                                                label={currentCheckpoint.category}
                                                size="medium"
                                                sx={{
                                                    backgroundColor: currentCheckpoint.colors.bg,
                                                    color: currentCheckpoint.colors.text,
                                                    fontWeight: 600,
                                                    fontSize: '1rem',
                                                }}
                                            />
                                        )}
                                        {currentCheckpoint.topics?.map((topic) => (
                                            <Chip
                                                key={topic}
                                                label={topic}
                                                size="medium"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '1rem'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Box sx={{fontSize: '0.95rem', lineHeight: 1.6}}>
                                        <SafeParsedHtml html={currentCheckpoint.description || ''}/>
                                    </Box>
                                </Box>
                            )}
                            {loadingHighlight || !highlightedContent ?
                                (
                                    /* Content area skeleton - Right column (80% width) */
                                    <Box
                                        sx={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2,
                                            padding: 2,
                                            pt: 0,
                                            marginTop: 0,
                                            width: '80%',
                                        }}
                                    >
                                        {/* Tabs skeleton with navigation controls */}
                                        <Box
                                            sx={{
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 10,
                                                backgroundColor: '#fff',
                                                borderBottom: 1,
                                                borderColor: 'divider',
                                                mb: 2,
                                                py: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Box display="flex" gap={2} alignItems="center">
                                                <Skeleton variant="rectangular" width={130} height={40}
                                                          sx={{borderRadius: 1}}/>
                                                <Skeleton variant="rectangular" width={120} height={40}
                                                          sx={{borderRadius: 1}}/>
                                            </Box>
                                            <Box display="flex" gap={1} alignItems="center" mr={2}>
                                                <Skeleton variant="rectangular" width={60} height={24}
                                                          sx={{borderRadius: 1}}/>
                                                <Skeleton variant="circular" width={32} height={32}/>
                                                <Skeleton variant="circular" width={32} height={32}/>
                                                <Skeleton variant="circular" width={32} height={32}/>
                                                <Skeleton variant="circular" width={32} height={32}/>
                                            </Box>
                                        </Box>

                                        {/* Content skeleton - simulating both views loading */}
                                        <Box sx={{minHeight: 400}}>
                                            <Box display="flex" alignItems="center" justifyContent="center"
                                                 height={400}>
                                                <Box textAlign="center">
                                                    <CircularProgress size={48} sx={{color: '#c653ff', mb: 2}}/>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Loading both views...
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box
                                        ref={contentBoxRef}
                                        sx={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 2,
                                            padding: 2,
                                            pt: 0,
                                            marginTop: 0,
                                            height: 'calc(100vh - 300px)',
                                            maxHeight: 'calc(100vh - 300px)',
                                            overflow: 'auto',
                                            width: currentCheckpoint ? '80%' : '100%',
                                        }}
                                    >
                                        {/* MUI Tabs for view switching */}
                                        <Box
                                            sx={{
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 10,
                                                backgroundColor: '#fff',
                                                borderBottom: 1,
                                                borderColor: 'divider',
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Tabs
                                                value={highlightViewMode}
                                                onChange={(_, newValue) => {
                                                    setHighlightViewMode(newValue);
                                                    if (newValue === 'browser' && currentCheckpoint?.canHighlight?.page && analysisData) {
                                                        restoreBrowserView(analysisData.assetId, currentCheckpoint.id);
                                                    } else if (newValue === 'source' && currentCheckpoint?.canHighlight?.source && analysisData) {
                                                        fetchSourceViewForCheckpoint(analysisData.assetId, currentCheckpoint.id);
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiTab-root': {
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        fontSize: '0.95rem',
                                                    },
                                                }}
                                            >
                                                <Tab label="Browser View" value="browser" sx={{
                                                    display: currentCheckpoint?.canHighlight.page ? 'inline-flex' : 'none'
                                                }}/>
                                                <Tab label="Source View" value="source" sx={{
                                                    display: currentCheckpoint?.canHighlight.source ? 'inline-flex' : 'none'
                                                }}/>
                                            </Tabs>

                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    mr: 2,
                                                }}
                                            >
                                                {/* Highlight navigation - show for both views */}
                                                {totalHighlights > 0 && (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.secondary',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                                minWidth: '60px',
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {visibleHighlight || currentHighlight || 1} of {totalHighlights}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigateHighlight('prev')}
                                                            disabled={totalHighlights === 0}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                                },
                                                            }}
                                                            aria-label="Previous highlight"
                                                        >
                                                            <ArrowBackIcon fontSize="small"/>
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigateHighlight('next')}
                                                            disabled={totalHighlights === 0}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                                },
                                                            }}
                                                            aria-label="Next highlight"
                                                        >
                                                            <ArrowForwardIcon fontSize="small"/>
                                                        </IconButton>
                                                    </>)}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => fetchHighlightedErrors(analysisData.assetId, currentCheckpointId, highlightViewMode)}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                        },
                                                    }}
                                                    aria-label="Reload highlights"
                                                >
                                                    <ReplayIcon fontSize="small"/>
                                                </IconButton>
                                                {/* Open in new tab button */}
                                                <Tooltip title="Open in new tab" placement="top">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            // Create a new window/tab and write the HTML content to it
                                                            const newWindow = window.open('', '_blank');
                                                            if (newWindow) {
                                                                const parser = new DOMParser();
                                                                const doc = parser.parseFromString(highlightedContent, 'text/html');

                                                                const documentElement = doc.documentElement;

                                                                documentElement.getElementsByTagName('body')[0].style.overflow = 'auto'

                                                                newWindow.document.open();
                                                                newWindow.document.write(documentElement.outerHTML);
                                                                newWindow.document.close();

                                                                // Add scrollIntoView functionality for highlights in the new tab
                                                                // Use a longer timeout to ensure DOM is fully ready
                                                                setTimeout(() => {
                                                                    const highlightSelectors = [
                                                                        '.astHighlightFull',
                                                                        '.astHighlightStart',
                                                                        '.astHighlightMiddle',
                                                                        '.astHighlightEnd',
                                                                        '.astError'
                                                                    ];

                                                                    const highlights = newWindow.document.querySelectorAll(
                                                                        highlightSelectors.join(', ')
                                                                    );

                                                                    console.log('[DQM] Found highlights in new tab:', highlights.length);

                                                                    // Scroll to first highlight if available
                                                                    if (highlights.length > 0) {
                                                                        const firstHighlight = highlights[0] as HTMLElement;
                                                                        console.log('[DQM] Scrolling to first highlight in new tab');

                                                                        firstHighlight.scrollIntoView({
                                                                            behavior: 'smooth',
                                                                            block: 'center'
                                                                        });
                                                                        firstHighlight.classList.add('animate');

                                                                        setTimeout(() => {
                                                                            firstHighlight.classList.remove('animate');
                                                                        }, 800);
                                                                    } else {
                                                                        console.warn('[DQM] No highlights found in new tab');
                                                                    }
                                                                }, 500); // Increased timeout to ensure DOM is ready
                                                            }
                                                        }}
                                                        sx={{
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                            },
                                                        }}
                                                        aria-label="Open in new tab"
                                                    >
                                                        <OpenInNewIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>

                                        {/* Content area */}
                                        <Box sx={{minHeight: 400}}>
                                            {highlightViewMode === 'browser' ? (
                                                <BrowserViewRenderer html={highlightedContent}
                                                                     currentHighlight={currentHighlight}
                                                                     clickedIndicator={clickedIndicator}
                                                                     onHighlightsFound={setTotalHighlights}
                                                                     onVisibleHighlightChange={setVisibleHighlight}/>
                                            ) : (
                                                <ShadowDOMRenderer
                                                    html={highlightedContent}
                                                    onHighlightsFound={setTotalHighlights}
                                                    currentHighlight={currentHighlight}
                                                    shouldAutoScrollToFirst={!hasAutoScrolledRef.current}
                                                    clickedIndicator={clickedIndicator}
                                                    onVisibleHighlightChange={setVisibleHighlight}
                                                    scrollContainerRef={contentBoxRef} // Pass the scrollable container ref
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                )}
                        </Box>
                    </DialogContent>
                </Dialog>
                    </>
                )}
            </StyledDrawer>
        </ThemeProvider>
    );
};

export default DQMSidebar;
