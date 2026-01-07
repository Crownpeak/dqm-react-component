/**
 * useAuthentication Hook
 *
 * Manages authentication state: credentials, session tokens, and login/logout.
 */
import { useCallback, useEffect, useState } from 'react';
import type { DQMConfig, SessionType } from '../types';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from '../utils/localStorage';
import { logger } from '../utils/logger';

export interface UseAuthenticationConfig {
  /** DQM configuration */
  config?: DQMConfig;
  /** Translation function for error messages */
  t: (key: string, options?: object) => string;
  /** Callback when auth succeeds */
  onAuthSuccess?: (creds: {
    apiKey: string;
    websiteId: string;
    sessionToken?: string;
    sessionType: SessionType;
  }) => void;
  /** Callback when auth error occurs */
  onAuthError?: (error: Error) => void;
}

export interface UseAuthenticationReturn {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current credentials */
  credentials: { apiKey: string; websiteId: string } | null;
  /** Current session token (for backend mode) */
  sessionToken: string | null;
  /** Current session type */
  sessionType: SessionType;
  /** Authentication error message */
  authError: string | null;
  /** Handle successful authentication */
  handleAuthSuccess: (creds: {
    apiKey: string;
    websiteId: string;
    sessionToken?: string;
    sessionType: SessionType;
  }) => void;
  /** Handle authentication error */
  handleAuthError: (error: Error) => void;
  /** Handle logout */
  handleLogout: () => void;
  /** Set auth error manually */
  setAuthError: (error: string | null) => void;
  /** Set is authenticated manually */
  setIsAuthenticated: (value: boolean) => void;
}

export function useAuthentication(config: UseAuthenticationConfig): UseAuthenticationReturn {
  const { config: dqmConfig, t, onAuthSuccess, onAuthError } = config;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<{ apiKey: string; websiteId: string } | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('direct');
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = () => {
      // Check if DQM is disabled
      if (dqmConfig?.disabled === true) {
        setIsAuthenticated(false);
        setAuthError(t('sidebar:dqm_disabled'));
        return;
      }

      // Priority 1: Props from config (direct credentials)
      if (dqmConfig?.apiKey && dqmConfig?.websiteId) {
        setCredentials({
          apiKey: dqmConfig.apiKey,
          websiteId: dqmConfig.websiteId,
        });
        setSessionType('direct');
        setSessionToken(null);
        setIsAuthenticated(true);
        return;
      }

      // Priority 2: LocalStorage (check session type) - BROWSER ONLY
      if (typeof window !== 'undefined' && dqmConfig?.useLocalStorage !== false) {
        const storedSessionType = getLocalStorageItem('dqm_sessionType') as SessionType | null;

        // Backend session mode
        if (storedSessionType === 'backend') {
          const storedSessionToken = getLocalStorageItem('dqm_sessionToken');
          if (storedSessionToken) {
            logger.debug('Restoring backend session from localStorage');
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
          logger.debug('Restoring direct credentials from localStorage');
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
      if (dqmConfig?.authBackendUrl) {
        setIsAuthenticated(false);
        return;
      }

      // Priority 4: No configuration available
      setIsAuthenticated(false);
      setAuthError(t('sidebar:dqm_not_configured'));
    };

    initAuth();
  }, [dqmConfig, t]);

  // Handle successful authentication
  const handleAuthSuccess = useCallback(
    (creds: {
      apiKey: string;
      websiteId: string;
      sessionToken?: string;
      sessionType: SessionType;
    }) => {
      setCredentials({
        apiKey: creds.apiKey,
        websiteId: creds.websiteId,
      });
      setSessionToken(creds.sessionToken || null);
      setSessionType(creds.sessionType);
      setIsAuthenticated(true);
      setAuthError(null);

      onAuthSuccess?.(creds);
    },
    [onAuthSuccess]
  );

  // Handle authentication error
  const handleAuthError = useCallback(
    (err: Error) => {
      logger.error('Authentication error:', err);
      setAuthError(err.message);
      setIsAuthenticated(false);

      onAuthError?.(err);
    },
    [onAuthError]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear credentials and session from state
    setCredentials(null);
    setSessionToken(null);
    setSessionType('direct');
    setIsAuthenticated(false);

    // Clear localStorage if enabled - SSR-safe
    if (typeof window !== 'undefined' && dqmConfig?.useLocalStorage !== false) {
      removeLocalStorageItem('dqm_apiKey');
      removeLocalStorageItem('dqm_websiteID');
      removeLocalStorageItem('dqm_sessionToken');
      removeLocalStorageItem('dqm_sessionType');
      logger.debug('Cleared localStorage on logout');
    }

    logger.debug('User logged out');
  }, [dqmConfig?.useLocalStorage]);

  return {
    isAuthenticated,
    credentials,
    sessionToken,
    sessionType,
    authError,
    handleAuthSuccess,
    handleAuthError,
    handleLogout,
    setAuthError,
    setIsAuthenticated,
  };
}

export default useAuthentication;
