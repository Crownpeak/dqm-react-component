import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from './utils/localStorage';

export type LocaleSource = 'url' | 'user' | 'navigator' | 'default';

export interface ResolvedLocale {
  locale: string;
  source: LocaleSource;
  userOverride: boolean;
}

/**
 * Supported UI languages
 * - en: English (fallback)
 * - de: German
 * - es: Spanish
 *
 * Regional variants (de-AT, es-MX) fall back to their base language.
 * @see I18N.md for adding new languages
 */
export const SUPPORTED_LOCALES = ['en', 'de', 'es'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_STORAGE_KEY = 'dqm.locale';
export const LOCALE_PARAM_KEY = 'dqmUiLang';

export const normalizeLocale = (input: string | null | undefined): SupportedLocale | null => {
  if (!input) return null;
  const value = input.toLowerCase();
  const candidate = value.split('-')[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate) ? (candidate as SupportedLocale) : null;
};

export const resolveLocale = (
  search: string,
  savedOverride: string | null,
  navigatorLanguage: string | undefined,
  defaultLocale: SupportedLocale = DEFAULT_LOCALE,
): ResolvedLocale => {
  const params = new URLSearchParams(search || '');
  const urlLocale = normalizeLocale(params.get(LOCALE_PARAM_KEY));
  if (urlLocale) {
    return { locale: urlLocale, source: 'url', userOverride: false };
  }

  const savedLocale = normalizeLocale(savedOverride);
  if (savedLocale) {
    return { locale: savedLocale, source: 'user', userOverride: true };
  }

  const navigatorLocale = normalizeLocale(navigatorLanguage);
  if (navigatorLocale) {
    return { locale: navigatorLocale, source: 'navigator', userOverride: false };
  }

  return { locale: defaultLocale, source: 'default', userOverride: false };
};

export const persistLocale = (locale: SupportedLocale | null): void => {
  if (locale) {
    setLocalStorageItem(LOCALE_STORAGE_KEY, locale);
  } else {
    removeLocalStorageItem(LOCALE_STORAGE_KEY);
  }
};

export const loadSavedLocale = (): string | null => getLocalStorageItem(LOCALE_STORAGE_KEY);
