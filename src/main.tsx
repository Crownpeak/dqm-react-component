import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import App from './App.tsx';
import { store } from './store';
import { setResolvedLocale } from './store/localeSlice';
import { DEFAULT_LOCALE, loadSavedLocale, resolveLocale } from './locale';
import i18n from './i18n';

if (typeof window !== 'undefined') {
  const detected = resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
  store.dispatch(setResolvedLocale(detected));
  i18n.changeLanguage(detected.locale);

  window.addEventListener('languagechange', () => {
    const state = store.getState().locale;
    if (state.userOverride || state.source === 'url') return;
    const next = resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
    store.dispatch(setResolvedLocale(next));
    i18n.changeLanguage(next.locale);
  });

  store.subscribe(() => {
    const current = store.getState().locale;
    i18n.changeLanguage(current.locale);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Provider>
  </StrictMode>,
);
