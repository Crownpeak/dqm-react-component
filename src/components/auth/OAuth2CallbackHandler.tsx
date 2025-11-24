// OAuth2 Callback Handler - Processes OAuth2 redirects
import React, { useEffect } from 'react';
import type { DQMConfig, SessionType } from '../../types';

interface OAuth2CallbackHandlerProps {
    config: DQMConfig;
    onAuthSuccess: (credentials: { apiKey: string; websiteId: string; sessionToken?: string; sessionType: SessionType }) => void;
    onAuthError: (error: Error) => void;
}

export const OAuth2CallbackHandler: React.FC<OAuth2CallbackHandlerProps> = ({
    config,
    onAuthSuccess,
    onAuthError,
}) => {
    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const error = params.get('error');
            const errorDescription = params.get('error_description');

            // Skip if no OAuth2 parameters present (not a callback)
            if (!code && !error && !state) {
                return;
            }

            // Handle OAuth2 error response
            if (error) {
                onAuthError(new Error(`OAuth2 Error: ${error} - ${errorDescription || 'Unknown error'}`));
                return;
            }

            // Only verify state if we have a code (actual OAuth2 callback)
            if (code) {
                const storedState = sessionStorage.getItem('dqm_oauth_state');
                if (!state || state !== storedState) {
                    onAuthError(new Error('Invalid OAuth2 state - possible CSRF attack'));
                    return;
                }

                // Clear stored state
                sessionStorage.removeItem('dqm_oauth_state');

                // Exchange authorization code for tokens
                if (config.authBackendUrl && config.oauth2Config) {
                    try {
                        const response = await fetch(`${config.authBackendUrl}/auth/oauth2/callback`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                code,
                                redirectUri: config.oauth2Config.redirectUri,
                            }),
                        });

                        if (!response.ok) {
                            throw new Error(`Token exchange failed: ${response.statusText}`);
                        }

                        const data = await response.json();

                        if (!data.sessionToken) {
                            throw new Error('Invalid response from OAuth2 callback - missing session token');
                        }

                        // Store ONLY the session token (OAuth2 always uses backend mode)
                        if (config.useLocalStorage !== false) {
                            localStorage.setItem('dqm_sessionToken', data.sessionToken);
                            localStorage.setItem('dqm_sessionType', 'backend');
                            // Remove any old direct credentials
                            localStorage.removeItem('dqm_apiKey');
                            localStorage.removeItem('dqm_websiteID');
                        }

                        onAuthSuccess({
                            apiKey: 'BACKEND_SESSION', // Placeholder
                            websiteId: data.websiteId || 'BACKEND_SESSION',
                            sessionToken: data.sessionToken,
                            sessionType: 'backend',
                        });

                        // Clean up URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } catch (err) {
                        onAuthError(err instanceof Error ? err : new Error('OAuth2 callback processing failed'));
                    }
                }
            }
        };

        handleCallback();
    }, [config, onAuthSuccess, onAuthError]);

    return null; // This component doesn't render anything
};
