/**
 * Secure Storage Utility
 *
 * Provides secure credential storage with options for:
 * - sessionStorage (default, cleared on browser close)
 * - localStorage (opt-in with "Remember me", persists across sessions)
 *
 * Security considerations:
 * - sessionStorage is preferred as credentials are cleared when browser closes
 * - localStorage should only be used with explicit user consent ("Remember me")
 * - Users should be warned about the risks of storing credentials in localStorage
 */

/** Storage keys for DQM credentials */
export const SECURE_STORAGE_KEYS = {
  apiKey: 'dqm_apiKey',
  websiteId: 'dqm_websiteID',
  rememberMe: 'dqm_rememberMe',
  storageWarningAcknowledged: 'dqm_storageWarningAcknowledged',
} as const;

export type SecureStorageKey = keyof typeof SECURE_STORAGE_KEYS;

/**
 * Check if "Remember me" is enabled
 */
export function isRememberMeEnabled(): boolean {
  // Check localStorage first (since that's where we store the preference)
  const remember = localStorage.getItem(SECURE_STORAGE_KEYS.rememberMe);
  return remember === 'true';
}

/**
 * Get the appropriate storage based on "Remember me" setting
 */
function getStorage(): Storage {
  return isRememberMeEnabled() ? localStorage : sessionStorage;
}

/**
 * Get a value from secure storage
 * Checks sessionStorage first, then localStorage if Remember me is enabled
 */
export function getSecureItem(key: SecureStorageKey): string | null {
  const storageKey = SECURE_STORAGE_KEYS[key];

  // Always check sessionStorage first (current session)
  const sessionValue = sessionStorage.getItem(storageKey);
  if (sessionValue) {
    return sessionValue;
  }

  // Check localStorage only if Remember me is enabled
  if (isRememberMeEnabled()) {
    return localStorage.getItem(storageKey);
  }

  return null;
}

/**
 * Set a value in secure storage
 * Uses sessionStorage by default, localStorage if Remember me is enabled
 */
export function setSecureItem(key: SecureStorageKey, value: string): void {
  const storageKey = SECURE_STORAGE_KEYS[key];

  if (isRememberMeEnabled()) {
    // Store in localStorage for persistence
    localStorage.setItem(storageKey, value);
    // Also keep in sessionStorage for quick access
    sessionStorage.setItem(storageKey, value);
  } else {
    // Session only - store in sessionStorage
    sessionStorage.setItem(storageKey, value);
    // Remove from localStorage if it exists (user disabled Remember me)
    localStorage.removeItem(storageKey);
  }
}

/**
 * Remove a value from both storages
 */
export function removeSecureItem(key: SecureStorageKey): void {
  const storageKey = SECURE_STORAGE_KEYS[key];
  sessionStorage.removeItem(storageKey);
  localStorage.removeItem(storageKey);
}

/**
 * Set the Remember me preference
 * When disabling, clears credentials from localStorage
 */
export function setRememberMe(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
    // Move current session credentials to localStorage
    const apiKey = sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey);
    const websiteId = sessionStorage.getItem(SECURE_STORAGE_KEYS.websiteId);
    if (apiKey) localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, apiKey);
    if (websiteId) localStorage.setItem(SECURE_STORAGE_KEYS.websiteId, websiteId);
  } else {
    localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'false');
    // Clear credentials from localStorage (keep in session only)
    localStorage.removeItem(SECURE_STORAGE_KEYS.apiKey);
    localStorage.removeItem(SECURE_STORAGE_KEYS.websiteId);
  }
}

/**
 * Check if user has acknowledged the storage warning
 */
export function hasAcknowledgedStorageWarning(): boolean {
  return localStorage.getItem(SECURE_STORAGE_KEYS.storageWarningAcknowledged) === 'true';
}

/**
 * Set that user has acknowledged the storage warning
 */
export function acknowledgeStorageWarning(): void {
  localStorage.setItem(SECURE_STORAGE_KEYS.storageWarningAcknowledged, 'true');
}

/**
 * Clear all DQM credentials from both storages
 */
export function clearAllCredentials(): void {
  removeSecureItem('apiKey');
  removeSecureItem('websiteId');
}

/**
 * Migrate credentials from localStorage to sessionStorage
 * Call this when user disables "Remember me"
 */
export function migrateToSessionOnly(): void {
  const apiKey = localStorage.getItem(SECURE_STORAGE_KEYS.apiKey);
  const websiteId = localStorage.getItem(SECURE_STORAGE_KEYS.websiteId);

  // Move to sessionStorage
  if (apiKey) sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, apiKey);
  if (websiteId) sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, websiteId);

  // Clear from localStorage
  localStorage.removeItem(SECURE_STORAGE_KEYS.apiKey);
  localStorage.removeItem(SECURE_STORAGE_KEYS.websiteId);
}

/**
 * Get all stored credentials
 * Returns null for each missing credential
 */
export function getCredentials(): { apiKey: string | null; websiteId: string | null } {
  return {
    apiKey: getSecureItem('apiKey'),
    websiteId: getSecureItem('websiteId'),
  };
}

/**
 * Set all credentials at once
 */
export function setCredentials(apiKey: string, websiteId: string): void {
  setSecureItem('apiKey', apiKey);
  setSecureItem('websiteId', websiteId);
}

/**
 * Validate that credentials exist and are non-empty
 */
export function hasValidCredentials(): boolean {
  const { apiKey, websiteId } = getCredentials();
  return !!(apiKey && apiKey.trim() && websiteId && websiteId.trim());
}

/**
 * Validate API key encoding (ASCII-only for HTTP headers)
 */
export function validateApiKeyEncoding(apiKey: string): boolean {
  // Check if all characters are ASCII (0-127)
  return /^[\x00-\x7F]*$/.test(apiKey);
}

/**
 * Storage warning message for users
 */
export const STORAGE_WARNING_MESSAGE = `
Storing credentials in browser storage has security risks:
• Other scripts on the page could potentially access stored data
• Credentials persist until manually cleared
• Consider using "Session Only" for sensitive environments

Only enable "Remember me" if you trust this browser and device.
`.trim();

/**
 * Hook to initialize storage from existing localStorage/sessionStorage
 * Returns credentials if found
 */
export function hydrateCredentials(): {
  apiKey: string | null;
  websiteId: string | null;
  rememberMe: boolean;
  storageWarningAcknowledged: boolean;
} {
  return {
    apiKey: getSecureItem('apiKey'),
    websiteId: getSecureItem('websiteId'),
    rememberMe: isRememberMeEnabled(),
    storageWarningAcknowledged: hasAcknowledgedStorageWarning(),
  };
}
