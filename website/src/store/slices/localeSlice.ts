import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SupportedLocale } from '@/i18n/config';
import * as CookieConsent from 'vanilla-cookieconsent';

interface LocaleState {
  locale: SupportedLocale;
}

const initialState: LocaleState = {
  locale: 'en',
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      CookieConsent.setLanguage(action.payload);
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
