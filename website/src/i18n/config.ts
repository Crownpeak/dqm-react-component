import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import * as CookieConsent from "vanilla-cookieconsent";

// Import translations
import enCommon from '@/locales/en/common.json';
import deCommon from '@/locales/de/common.json';
import esCommon from '@/locales/es/common.json';

// Supported languages must match DQM component: 'en', 'de', 'es'
export const SUPPORTED_LOCALES = ['en', 'de', 'es'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Language detector configuration
const languageDetectorOptions = {
  // Order of detection methods
  order: [
    'querystring',    // ?lng=de
    'localStorage',   // localStorage.getItem('i18nextLng')
    'navigator',      // Browser language
    'htmlTag',        // <html lang="...">
  ],
  
  // Keys to look for in localStorage
  lookupQuerystring: 'lng',
  lookupLocalStorage: 'i18nextLng',
  
  // Cache user language preference
  caches: ['localStorage'],
  
  // Don't cache if this language doesn't exist
  excludeCacheFor: ['cimode'],
};

// Normalize locale to supported format (e.g., de-AT -> de)
export function normalizeLocale(locale: string): SupportedLocale | null {
  const normalized = locale.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(normalized as SupportedLocale)
    ? (normalized as SupportedLocale)
    : null;
}

// Resolve browser language to supported locale
export function resolveLanguage(browserLang: string): SupportedLocale {
  const normalized = normalizeLocale(browserLang);
  return normalized || DEFAULT_LOCALE;
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        common: enCommon,
      },
      de: {
        common: deCommon,
      },
      es: {
        common: esCommon,
      },
    },
    
    // Default language
    fallbackLng: DEFAULT_LOCALE,
    
    // Supported languages
    supportedLngs: SUPPORTED_LOCALES,
    
    // Default namespace
    defaultNS: 'common',
    ns: ['common'],
    
    // Language detector options
    detection: languageDetectorOptions,
    
    // Debugging
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  });

// Listen for language changes and sync with DQM component
i18n.on('languageChanged', (lng) => {
  const locale = resolveLanguage(lng);
  
  // Sync with DQM component via localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('dqm_locale', locale);

    CookieConsent.setLanguage(locale);
    
    // Import DQM's i18n instance and sync
    import('@crownpeak/dqm-react-component').then(({ i18n: dqmI18n }) => {
      if (dqmI18n && dqmI18n.language !== locale) {
        dqmI18n.changeLanguage(locale);
        i18n.changeLanguage(locale);
      }
    });
  }
});

export default i18n;
