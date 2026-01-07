/**
 * Auth Redux Slice
 *
 * Manages authentication state including API keys and session storage preferences.
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';
import type { SessionType, DQMConfig } from '../../types';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../../utils/localStorage';

// Extended session type for internal Redux state
export type AuthSessionType = SessionType;

export interface AuthSliceState {
  /** API key for DQM service */
  apiKey: string | null;
  /** Website ID for DQM */
  websiteId: string | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Session type (direct or backend) */
  sessionType: AuthSessionType | null;
  /** Backend session token */
  sessionToken: string | null;
  /** Access token for backend authentication */
  accessToken: string | null;
  /** Refresh token for backend authentication */
  refreshToken: string | null;
  /** Whether to remember credentials */
  rememberMe: boolean;
  /** Whether auth is loading */
  isLoading: boolean;
  /** Auth error message */
  error: string | null;
  /** User was warned about localStorage risks */
  storageWarningAcknowledged: boolean;
}

const initialState: AuthSliceState = {
  apiKey: null,
  websiteId: null,
  isAuthenticated: false,
  sessionType: null,
  sessionToken: null,
  accessToken: null,
  refreshToken: null,
  rememberMe: false,
  isLoading: false,
  error: null,
  storageWarningAcknowledged: false,
};

/** Storage keys */
const STORAGE_KEYS = {
  apiKey: 'dqm_apiKey',
  websiteId: 'dqm_websiteID',
  rememberMe: 'dqm_rememberMe',
  storageWarning: 'dqm_storageWarningAcknowledged',
  sessionToken: 'dqm_sessionToken',
  sessionType: 'dqm_sessionType',
} as const;

/**
 * Async thunk: Initialize auth from config and localStorage
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (config: DQMConfig | undefined, { dispatch }) => {
    // Check if DQM is disabled
    if (config?.disabled === true) {
      return { isAuthenticated: false, error: 'DQM is disabled' };
    }

    // Priority 1: Props from config (direct credentials)
    if (config?.apiKey && config?.websiteId) {
      return {
        apiKey: config.apiKey,
        websiteId: config.websiteId,
        sessionType: 'direct' as const,
        isAuthenticated: true,
      };
    }

    // Priority 2: LocalStorage (check session type)
    if (typeof window !== 'undefined' && config?.useLocalStorage !== false) {
      const storedSessionType = getLocalStorageItem('dqm_sessionType') as SessionType | null;

      // Backend session mode
      if (storedSessionType === 'backend') {
        const storedSessionToken = getLocalStorageItem('dqm_sessionToken');
        if (storedSessionToken) {
          logger.debug('Restoring backend session from localStorage');
          return {
            accessToken: storedSessionToken,
            sessionType: 'backend' as const,
            isAuthenticated: true,
          };
        }
      }

      // Direct mode
      const storedApiKey = getLocalStorageItem('dqm_apiKey');
      const storedWebsiteId = getLocalStorageItem('dqm_websiteID');
      if (storedApiKey && storedWebsiteId) {
        logger.debug('Restoring direct credentials from localStorage');
        return {
          apiKey: storedApiKey,
          websiteId: storedWebsiteId,
          sessionType: 'direct' as const,
          isAuthenticated: true,
        };
      }
    }

    // Priority 3: Auth backend configured but no credentials yet
    if (config?.authBackendUrl) {
      return { isAuthenticated: false };
    }

    // Priority 4: No configuration available
    return { isAuthenticated: false, error: 'DQM not configured' };
  }
);

/**
 * Async thunk: Login with credentials
 */
export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async (
    payload: {
      apiKey: string;
      websiteId: string;
      sessionToken?: string;
      sessionType: SessionType;
      rememberMe?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      // Validate API key encoding for direct mode
      if (payload.sessionType === 'direct') {
        if (!/^[\x00-\x7F]*$/.test(payload.apiKey)) {
          throw new Error('API key contains non-ASCII characters');
        }
      }

      // Save to localStorage if rememberMe
      if (payload.rememberMe !== false && typeof window !== 'undefined') {
        if (payload.sessionType === 'backend' && payload.sessionToken) {
          setLocalStorageItem(STORAGE_KEYS.sessionToken, payload.sessionToken);
          setLocalStorageItem(STORAGE_KEYS.sessionType, 'backend');
        } else {
          setLocalStorageItem(STORAGE_KEYS.apiKey, payload.apiKey);
          setLocalStorageItem(STORAGE_KEYS.websiteId, payload.websiteId);
          setLocalStorageItem(STORAGE_KEYS.sessionType, 'direct');
        }
      }

      return payload;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

/**
 * Async thunk: Logout
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (clearStorage: boolean = true) => {
    if (clearStorage && typeof window !== 'undefined') {
      removeLocalStorageItem(STORAGE_KEYS.apiKey);
      removeLocalStorageItem(STORAGE_KEYS.websiteId);
      removeLocalStorageItem(STORAGE_KEYS.sessionToken);
      removeLocalStorageItem(STORAGE_KEYS.sessionType);
      logger.debug('Cleared localStorage on logout');
    }
    return true;
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set API key */
    setApiKey: (state, action: PayloadAction<string | null>) => {
      state.apiKey = action.payload;
      state.isAuthenticated = !!(action.payload && state.websiteId);
      if (action.payload) {
        state.sessionType = 'direct';
      }
    },

    /** Set website ID */
    setWebsiteId: (state, action: PayloadAction<string | null>) => {
      state.websiteId = action.payload;
      state.isAuthenticated = !!(state.apiKey && action.payload);
    },

    /** Set credentials (API key + website ID) */
    setCredentials: (
      state,
      action: PayloadAction<{
        apiKey: string;
        websiteId: string;
        rememberMe?: boolean;
      }>
    ) => {
      state.apiKey = action.payload.apiKey;
      state.websiteId = action.payload.websiteId;
      state.isAuthenticated = true;
      state.sessionType = 'direct';
      if (action.payload.rememberMe !== undefined) {
        state.rememberMe = action.payload.rememberMe;
      }
    },

    /** Set session token for backend authentication */
    setSessionToken: (
      state,
      action: PayloadAction<{ accessToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.sessionType = 'backend';
      state.isAuthenticated = true;
    },

    /** Set remember me preference */
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },

    /** Acknowledge storage warning */
    acknowledgeStorageWarning: (state) => {
      state.storageWarningAcknowledged = true;
    },

    /** Set loading state */
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /** Set auth error */
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /** Clear credentials and log out */
    logout: (state) => {
      state.apiKey = null;
      state.websiteId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.sessionType = null;
      state.error = null;
      // Keep rememberMe and storageWarningAcknowledged
    },

    /** Reset all auth state */
    resetAuth: () => initialState,

    /** Hydrate state from storage */
    hydrateFromStorage: (
      state,
      action: PayloadAction<{
        apiKey?: string | null;
        websiteId?: string | null;
        rememberMe?: boolean;
        storageWarningAcknowledged?: boolean;
      }>
    ) => {
      if (action.payload.apiKey) {
        state.apiKey = action.payload.apiKey;
      }
      if (action.payload.websiteId) {
        state.websiteId = action.payload.websiteId;
      }
      if (action.payload.rememberMe !== undefined) {
        state.rememberMe = action.payload.rememberMe;
      }
      if (action.payload.storageWarningAcknowledged !== undefined) {
        state.storageWarningAcknowledged = action.payload.storageWarningAcknowledged;
      }
      state.isAuthenticated = !!(state.apiKey && state.websiteId);
      if (state.isAuthenticated) {
        state.sessionType = 'direct';
      }
    },
  },
  extraReducers: (builder) => {
    // initializeAuth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.apiKey) state.apiKey = action.payload.apiKey;
        if (action.payload.websiteId) state.websiteId = action.payload.websiteId;
        if (action.payload.accessToken) state.accessToken = action.payload.accessToken;
        if (action.payload.sessionType) state.sessionType = action.payload.sessionType;
        if (action.payload.isAuthenticated !== undefined) {
          state.isAuthenticated = action.payload.isAuthenticated;
        }
        if (action.payload.error) state.error = action.payload.error;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Authentication initialization failed';
      });

    // loginWithCredentials
    builder
      .addCase(loginWithCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.apiKey = action.payload.apiKey;
        state.websiteId = action.payload.websiteId;
        state.sessionType = action.payload.sessionType;
        state.isAuthenticated = true;
        if (action.payload.sessionToken) {
          state.accessToken = action.payload.sessionToken;
        }
        if (action.payload.rememberMe !== undefined) {
          state.rememberMe = action.payload.rememberMe;
        }
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Login failed';
      });

    // logoutThunk
    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.apiKey = null;
        state.websiteId = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.sessionType = null;
        state.error = null;
      });
  },
});

export const {
  setApiKey,
  setWebsiteId,
  setCredentials,
  setSessionToken,
  setRememberMe,
  acknowledgeStorageWarning,
  setAuthLoading,
  setAuthError,
  logout,
  resetAuth,
  hydrateFromStorage,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectApiKey = (state: { auth: AuthSliceState }) => state.auth.apiKey;
export const selectWebsiteId = (state: { auth: AuthSliceState }) => state.auth.websiteId;
export const selectIsAuthenticated = (state: { auth: AuthSliceState }) => state.auth.isAuthenticated;
export const selectSessionType = (state: { auth: AuthSliceState }) => state.auth.sessionType;
export const selectAccessToken = (state: { auth: AuthSliceState }) => state.auth.accessToken;
export const selectRememberMe = (state: { auth: AuthSliceState }) => state.auth.rememberMe;
export const selectAuthLoading = (state: { auth: AuthSliceState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthSliceState }) => state.auth.error;
export const selectStorageWarningAcknowledged = (state: { auth: AuthSliceState }) =>
  state.auth.storageWarningAcknowledged;

// Composite selectors
export const selectCredentials = (state: { auth: AuthSliceState }) => {
  const { apiKey, websiteId } = state.auth;
  if (!apiKey || !websiteId) return null;
  return { apiKey, websiteId };
};

export const selectSessionToken = (state: { auth: AuthSliceState }) => state.auth.accessToken;

// Storage keys export for use in secureStorage
export { STORAGE_KEYS };
