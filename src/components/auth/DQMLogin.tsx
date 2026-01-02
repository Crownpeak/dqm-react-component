// DQM Login Component - Handles authentication flows
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Link,
} from '@mui/material';
import { Lock as LockIcon, Login as LoginIcon } from '@mui/icons-material';
import type { DQMConfig, SessionType } from '../../types';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';

// SSR-safe localStorage helpers
const getLocalStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
};

const setLocalStorageItem = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
};

const removeLocalStorageItem = (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
};

interface DQMLoginProps {
    config: DQMConfig;
    onAuthSuccess: (credentials: { apiKey: string; websiteId: string; sessionToken?: string; sessionType: SessionType }) => void;
    onAuthError: (error: Error) => void;
    initialError?: string | null; // Initial error from parent
}

export const DQMLogin: React.FC<DQMLoginProps> = ({
    config,
    onAuthSuccess,
    onAuthError,
    initialError,
}) => {
    const { t } = useTranslation(['auth', 'common']);
    const [apiKey, setApiKey] = useState('');
    const [websiteId, setWebsiteId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);

    // Check authentication options
    const hasBackendAuth = !!config.authBackendUrl;
    const showDirectCredentials = !hasBackendAuth; // Only show direct input if NO backend
    const showBackendLogin = hasBackendAuth; // Show backend login button if backend configured

    // Debug: Log when component renders
    logger.debug('[DQMLogin] Component rendered', { 
        config, 
        initialError, 
        error,
        hasBackendAuth,
        showDirectCredentials,
        showBackendLogin
    });

    // Check for session token in URL (after redirect from login page)
    useEffect(() => {
        if (!config.authBackendUrl) return;

        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('sessionToken');
        const websiteId = urlParams.get('websiteId');

        if (sessionToken && websiteId) {
            logger.debug('[DQMLogin] 🎉 Found session token in URL, processing redirect');
            
            // Store session token
            if (typeof window !== 'undefined' && config.useLocalStorage !== false) {
                setLocalStorageItem('dqm_sessionToken', sessionToken);
                setLocalStorageItem('dqm_websiteID', websiteId);
                setLocalStorageItem('dqm_sessionType', 'backend');
                removeLocalStorageItem('dqm_apiKey');
                logger.debug('[DQMLogin] Backend session saved to localStorage');
            }

            // Clean URL (remove query params)
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Notify parent component
            onAuthSuccess({
                apiKey: 'BACKEND_SESSION',
                websiteId: websiteId,
                sessionToken,
                sessionType: 'backend',
            });
        }
    }, [config.authBackendUrl, config.useLocalStorage, onAuthSuccess]);

    // Handle direct credential input
    const handleDirectLogin = async () => {
        if (!apiKey || !websiteId) {
            setError(t('auth:errors.missing_fields'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Validate API key encoding
            if (!/^[\x00-\x7F]*$/.test(apiKey)) {
                throw new Error(t('auth:errors.non_ascii_key'));
            }

            // MODE 1: Backend Authentication - Send credentials to backend, get session token
            if (config.authBackendUrl) {
                const response = await fetch(`${config.authBackendUrl}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        apiKey,
                        websiteId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Authentication failed: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.sessionToken) {
                    throw new Error('Invalid response from authentication backend - missing session token');
                }

                // Store ONLY the session token (not real credentials)
                // SSR-safe: Only access localStorage in browser
                if (typeof window !== 'undefined' && config.useLocalStorage !== false) {
                    setLocalStorageItem('dqm_sessionToken', data.sessionToken);
                    setLocalStorageItem('dqm_sessionType', 'backend');
                    // Remove any old direct credentials
                    removeLocalStorageItem('dqm_apiKey');
                    removeLocalStorageItem('dqm_websiteID');
                    logger.debug('[DQMLogin] Backend session saved to localStorage');
                }

                // Return dummy credentials + session token
                // Real API Key and Website ID are never exposed to client
                onAuthSuccess({
                    apiKey: 'BACKEND_SESSION', // Placeholder
                    websiteId: data.websiteId || 'BACKEND_SESSION', // May return websiteId for display
                    sessionToken: data.sessionToken,
                    sessionType: 'backend',
                });
            } 
            // MODE 2: Direct Authentication - Store credentials, communicate directly with DQM API
            else {
                // Store credentials if localStorage is enabled
                // SSR-safe: Only access localStorage in browser
                if (typeof window !== 'undefined' && config.useLocalStorage !== false) {
                    setLocalStorageItem('dqm_apiKey', apiKey);
                    setLocalStorageItem('dqm_websiteID', websiteId);
                    setLocalStorageItem('dqm_sessionType', 'direct');
                    // Remove any old session token
                    removeLocalStorageItem('dqm_sessionToken');
                    logger.debug('[DQMLogin] Direct credentials saved to localStorage');
                }

                onAuthSuccess({ 
                    apiKey, 
                    websiteId,
                    sessionType: 'direct',
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
            onAuthError(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            setLoading(false);
        }
    };

    // Handle OAuth2 login - Redirect to backend login page
    const handleOAuth2Login = () => {
        if (!config.authBackendUrl) {
            setError(t('auth:errors.backend_missing'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Save current URL for redirect back
            const returnUrl = window.location.href;
            if (typeof window !== 'undefined' && config.useLocalStorage !== false) {
                setLocalStorageItem('dqm_return_url', returnUrl);
            }

            logger.debug('[DQMLogin] 🔄 Redirecting to login page');
            logger.debug('[DQMLogin] Return URL:', returnUrl);

            // Redirect to login page with return URL
            const loginUrl = new URL(`${config.authBackendUrl}/auth/login`);
            loginUrl.searchParams.set('returnUrl', returnUrl);

            import("@webcontainer/env").then(({isWebContainer}) => {
                if (isWebContainer) {
                    window.open(loginUrl.toString(), '_blank');
                } else {
                    window.location.href = loginUrl.toString();
                }
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('auth:errors.failed_redirect');
            setError(errorMessage);
            onAuthError(err instanceof Error ? err : new Error(errorMessage));
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                p: 3,
                width: '100%',
            }}
        >
            {/* Header */}
            <Box sx={{ textAlign: 'center' }}>
                <LockIcon sx={{ fontSize: 50, color: '#711bc1', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight={700}>
                    {t('auth:heading')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('auth:subheading')}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Direct Credential Input - only if no backend configured */}
            {showDirectCredentials && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('auth:enter_credentials')}
                    </Typography>
                    
                    <TextField
                        label={t('auth:website_id')}
                        // make it a username field for password managers to fill it in correctly
                        autoComplete="username"
                        value={websiteId}
                        onChange={(e) => setWebsiteId(e.target.value)}
                        disabled={loading}
                        fullWidth
                        required
                        helperText={t('auth:website_id_helper')}
                    />

                    <TextField
                        label={t('auth:api_key')}
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={loading}
                        fullWidth
                        required
                        helperText={t('auth:api_key_helper')}
                    />
                    
                    <Button
                        variant="outlined"
                        onClick={handleDirectLogin}
                        disabled={loading || !apiKey || !websiteId}
                        fullWidth
                        size="large"
                    >
                        {loading ? <CircularProgress size={24} /> : t('auth:continue')}
                    </Button>
                </Box>
            )}

            {/* Divider - only show if we have both backend AND direct credentials */}
            {showBackendLogin && showDirectCredentials && (
                <Divider>{t('auth:or')}</Divider>
            )}

            {/* Backend Login Button - Opens login page in popup */}
            {showBackendLogin && (
                <Button
                    variant="contained"
                    startIcon={<LoginIcon />}
                    onClick={handleOAuth2Login}
                    disabled={loading}
                    fullWidth
                    size="large"
                    sx={{
                        background: 'linear-gradient(135deg, #711bc1 0%, #8e44d6 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a0f9a 0%, #7339b8 100%)',
                        },
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('auth:login_backend')}
                </Button>
            )}

            {/* Help Text */}
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('auth:no_credentials')}{' '}
                <Link href="https://www.crownpeak.com/firstspirit/products/digital-accessibility/digital-accessibility-and-quality-management-dqm/" target="_blank">
                    {t('auth:get_started')}
                </Link>
            </Typography>
        </Box>
    );
};
