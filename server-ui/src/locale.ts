export type LocaleSource = 'url' | 'user' | 'navigator' | 'default';

export interface ResolvedLocale {
  locale: string;
  source: LocaleSource;
  userOverride: boolean;
}

const SUPPORTED_LOCALES = ['en', 'de'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_STORAGE_KEY = 'dqm.locale';
export const LOCALE_PARAM_KEY = 'dqmUiLang';

export const normalizeLocale = (input: string | null | undefined): SupportedLocale | null => {
  if (!input) return null;
  const lower = input.toLowerCase();
  const candidate = lower.split('-')[0];
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
  if (urlLocale) return { locale: urlLocale, source: 'url', userOverride: false };

  const saved = normalizeLocale(savedOverride);
  if (saved) return { locale: saved, source: 'user', userOverride: true };

  const nav = normalizeLocale(navigatorLanguage);
  if (nav) return { locale: nav, source: 'navigator', userOverride: false };

  return { locale: defaultLocale, source: 'default', userOverride: false };
};

export const persistLocale = (locale: SupportedLocale | null): void => {
  if (typeof window === 'undefined') return;
  if (locale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } else {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
  }
};

export const loadSavedLocale = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCALE_STORAGE_KEY);
};
