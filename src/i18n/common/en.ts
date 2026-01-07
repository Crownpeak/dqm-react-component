/**
 * Common translations - English (Fallback)
 * @see I18N.md for documentation
 */
export const common = {
  language: 'Language',
  language_switch_label: 'Language',
  language_en: 'English',
  language_de: 'German',
  language_es: 'Spanish',
  source_url: 'URL overridden',
  source_user: 'Custom selected',
  source_navigator: 'Browser setting',
  source_default: 'Default locale',
  reset: 'Reset',
  logout: 'Logout',
} as const;

export type CommonTranslationKeys = keyof typeof common;
