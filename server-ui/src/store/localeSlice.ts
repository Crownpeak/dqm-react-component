import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_LOCALE, loadSavedLocale, persistLocale, resolveLocale, ResolvedLocale, SupportedLocale } from '../locale';

export interface LocaleState extends ResolvedLocale {}

const detectInitial = (): ResolvedLocale => {
  if (typeof window === 'undefined') {
    return { locale: DEFAULT_LOCALE, source: 'default', userOverride: false };
  }
  return resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
};

const initialState: LocaleState = detectInitial();

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
    },
    setUserLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      state.source = 'user';
      state.userOverride = true;
      persistLocale(action.payload);
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
    },
    resetLocale: (state) => {
      if (typeof window === 'undefined') return;
      persistLocale(null);
      const next = resolveLocale(window.location.search, null, navigator.language, DEFAULT_LOCALE);
      state.locale = next.locale;
      state.source = next.source;
      state.userOverride = next.userOverride;
    },
  },
});

export const { setResolvedLocale, setUserLocale, applyNavigatorLocale, resetLocale } = localeSlice.actions;
export const localeReducer = localeSlice.reducer;
