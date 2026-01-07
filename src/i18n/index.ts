/**
 * i18n Configuration - Combines all translation namespaces
 *
 * Supported languages: en, de, es
 * Fallback chain: de-AT → de → en (regional variants fall back to base language)
 *
 * @see I18N.md for documentation on adding translations
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, type SupportedLocale } from '../locale';

// Import namespaces
import * as common from './common';
import * as sidebar from './sidebar';
import * as auth from './auth';
import * as demo from './demo';

/**
 * Combine translations into i18next resource format
 */
const resources = {
  en: {
    common: common.en,
    sidebar: sidebar.en,
    auth: auth.en,
    demo: demo.en,
  },
  de: {
    common: common.de,
    sidebar: sidebar.de,
    auth: auth.de,
    demo: demo.de,
  },
  es: {
    common: common.es,
    sidebar: sidebar.es,
    auth: auth.es,
    demo: demo.es,
  },
} as const;

export type TranslationResources = typeof resources;
export type AvailableLanguage = keyof TranslationResources;

/**
 * Map regional variants to base languages
 * e.g., de-AT → de, es-MX → es
 */
const REGIONAL_FALLBACKS: Record<string, AvailableLanguage> = {
  'de-AT': 'de',
  'de-CH': 'de',
  'de-DE': 'de',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
};

/**
 * Resolve a locale code to an available language
 * Handles regional variants (de-AT → de) and unknown locales (→ en)
 */
export const resolveLanguage = (locale: string): AvailableLanguage => {
  // Direct match
  if (locale in resources) {
    return locale as AvailableLanguage;
  }

  // Regional variant mapping
  if (locale in REGIONAL_FALLBACKS) {
    return REGIONAL_FALLBACKS[locale];
  }

  // Try base language (de-AT → de)
  const baseLocale = locale.split('-')[0];
  if (baseLocale in resources) {
    return baseLocale as AvailableLanguage;
  }

  // Final fallback to English
  return 'en';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: {
      // Regional variants fall back to their base language, then to English
      'de-AT': ['de', 'en'],
      'de-CH': ['de', 'en'],
      'es-MX': ['es', 'en'],
      'es-AR': ['es', 'en'],
      default: ['en'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    defaultNS: 'common',
    supportedLngs: Object.keys(resources) as SupportedLocale[],
    load: 'languageOnly', // Don't load regional variants separately
  });

export default i18n;

// Re-export types for consumers
export type { CommonTranslationKeys } from './common/en';
export type { SidebarTranslationKeys } from './sidebar/en';
export type { AuthTranslationKeys } from './auth/en';
export type { DemoTranslationKeys } from './demo/en';
