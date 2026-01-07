import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  DEFAULT_LOCALE,
  loadSavedLocale,
  persistLocale,
  resolveLocale,
  type ResolvedLocale,
  type SupportedLocale,
} from '../locale';
import i18n from '../i18n';

export interface LocaleState extends ResolvedLocale {}

const detectInitial = (): ResolvedLocale => {
  if (typeof window === 'undefined') {
    return { locale: DEFAULT_LOCALE, source: 'default', userOverride: false };
  }
  return resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
};

const initialState: LocaleState = detectInitial();

// Sync i18n with initial state
if (typeof window !== 'undefined' && i18n.language !== initialState.locale) {
  i18n.changeLanguage(initialState.locale);
}

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setResolvedLocale: (state, action: PayloadAction<ResolvedLocale>) => {
      const next = action.payload;
      state.locale = next.locale;
      state.source = next.source;
      state.userOverride = next.userOverride;
      if (next.userOverride) {
        persistLocale(next.locale as SupportedLocale);
      } else if (next.source !== 'user') {
        persistLocale(null);
      }
      // Sync i18n language
      if (i18n.language !== next.locale) {
        i18n.changeLanguage(next.locale);
      }
    },
    setUserLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      state.source = 'user';
      state.userOverride = true;
      persistLocale(action.payload);
      // Sync i18n language
      if (i18n.language !== action.payload) {
        i18n.changeLanguage(action.payload);
      }
    },
    applyNavigatorLocale: (state) => {
      if (typeof window === 'undefined') return;
      if (state.userOverride || state.source === 'url') return;
      const next = resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
      state.locale = next.locale;
      state.source = next.source;
      state.userOverride = next.userOverride;
      if (next.userOverride) {
        persistLocale(next.locale as SupportedLocale);
      } else {
        persistLocale(null);
      }
      // Sync i18n language
      if (i18n.language !== next.locale) {
        i18n.changeLanguage(next.locale);
      }
    },
    resetLocale: (state) => {
      if (typeof window === 'undefined') return;
      persistLocale(null);
      const next = resolveLocale(window.location.search, null, navigator.language, DEFAULT_LOCALE);
      state.locale = next.locale;
      state.source = next.source;
      state.userOverride = next.userOverride;
      // Sync i18n language
      if (i18n.language !== next.locale) {
        i18n.changeLanguage(next.locale);
      }
    },
  },
});

export const { setResolvedLocale, setUserLocale, applyNavigatorLocale, resetLocale } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;
