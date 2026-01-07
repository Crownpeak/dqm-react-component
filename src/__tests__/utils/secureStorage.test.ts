/**
 * Secure Storage Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  setRememberMe,
  isRememberMeEnabled,
  hasValidCredentials,
  validateApiKeyEncoding,
  getCredentials,
  setCredentials,
  clearAllCredentials,
  hydrateCredentials,
  SECURE_STORAGE_KEYS,
} from '../../utils/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    // Clear both storages before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('isRememberMeEnabled', () => {
    it('returns false by default', () => {
      expect(isRememberMeEnabled()).toBe(false);
    });

    it('returns true when remember me is enabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
      expect(isRememberMeEnabled()).toBe(true);
    });

    it('returns false when remember me is disabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'false');
      expect(isRememberMeEnabled()).toBe(false);
    });
  });

  describe('getSecureItem', () => {
    it('returns null when nothing is stored', () => {
      expect(getSecureItem('apiKey')).toBeNull();
    });

    it('returns sessionStorage value', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'session-key');
      expect(getSecureItem('apiKey')).toBe('session-key');
    });

    it('prefers sessionStorage over localStorage', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'session-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'local-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
      expect(getSecureItem('apiKey')).toBe('session-key');
    });

    it('falls back to localStorage when remember me is enabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'local-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
      expect(getSecureItem('apiKey')).toBe('local-key');
    });

    it('does not use localStorage when remember me is disabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'local-key');
      expect(getSecureItem('apiKey')).toBeNull();
    });
  });

  describe('setSecureItem', () => {
    it('stores in sessionStorage by default', () => {
      setSecureItem('apiKey', 'test-key');
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBe('test-key');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
    });

    it('stores in both storages when remember me is enabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
      setSecureItem('apiKey', 'test-key');
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBe('test-key');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBe('test-key');
    });

    it('removes from localStorage when remember me is disabled', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'old-key');
      setSecureItem('apiKey', 'new-key');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
    });
  });

  describe('removeSecureItem', () => {
    it('removes from both storages', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'session-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'local-key');
      removeSecureItem('apiKey');
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
    });
  });

  describe('setRememberMe', () => {
    it('enables remember me and migrates credentials', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      setRememberMe(true);
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.rememberMe)).toBe('true');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBe('test-key');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.websiteId)).toBe('test-id');
    });

    it('disables remember me and clears localStorage credentials', () => {
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      setRememberMe(false);
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.rememberMe)).toBe('false');
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.websiteId)).toBeNull();
    });
  });

  describe('validateApiKeyEncoding', () => {
    it('returns true for ASCII-only keys', () => {
      expect(validateApiKeyEncoding('abc123-ABC_xyz')).toBe(true);
    });

    it('returns false for non-ASCII keys', () => {
      expect(validateApiKeyEncoding('key-with-émoji')).toBe(false);
      expect(validateApiKeyEncoding('key-with-日本語')).toBe(false);
    });
  });

  describe('hasValidCredentials', () => {
    it('returns false when no credentials exist', () => {
      expect(hasValidCredentials()).toBe(false);
    });

    it('returns false when only apiKey exists', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      expect(hasValidCredentials()).toBe(false);
    });

    it('returns false when only websiteId exists', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      expect(hasValidCredentials()).toBe(false);
    });

    it('returns true when both credentials exist', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      expect(hasValidCredentials()).toBe(true);
    });

    it('returns false for empty strings', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, '');
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      expect(hasValidCredentials()).toBe(false);
    });
  });

  describe('getCredentials', () => {
    it('returns both credentials', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      expect(getCredentials()).toEqual({
        apiKey: 'test-key',
        websiteId: 'test-id',
      });
    });
  });

  describe('setCredentials', () => {
    it('sets both credentials', () => {
      setCredentials('new-key', 'new-id');
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBe('new-key');
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.websiteId)).toBe('new-id');
    });
  });

  describe('clearAllCredentials', () => {
    it('clears all credentials from both storages', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'session-key');
      localStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'local-key');
      clearAllCredentials();
      expect(sessionStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
      expect(localStorage.getItem(SECURE_STORAGE_KEYS.apiKey)).toBeNull();
    });
  });

  describe('hydrateCredentials', () => {
    it('returns all credential state', () => {
      sessionStorage.setItem(SECURE_STORAGE_KEYS.apiKey, 'test-key');
      sessionStorage.setItem(SECURE_STORAGE_KEYS.websiteId, 'test-id');
      localStorage.setItem(SECURE_STORAGE_KEYS.rememberMe, 'true');
      localStorage.setItem(SECURE_STORAGE_KEYS.storageWarningAcknowledged, 'true');

      expect(hydrateCredentials()).toEqual({
        apiKey: 'test-key',
        websiteId: 'test-id',
        rememberMe: true,
        storageWarningAcknowledged: true,
      });
    });
  });
});
