// Server UI Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { LoginPage } from './LoginPage';
import { CallbackPage } from './CallbackPage';
import { serverUiStore } from './store';
import { setResolvedLocale } from './store/localeSlice';
import { DEFAULT_LOCALE, loadSavedLocale, resolveLocale } from './locale';
import i18n from './i18n';

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#115293',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Determine which page to render based on path
const App: React.FC = () => {
  const path = window.location.pathname;

  if (path === '/auth/callback') {
    return <CallbackPage />;
  }

  return <LoginPage />;
};

if (typeof window !== 'undefined') {
  const detected = resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
  serverUiStore.dispatch(setResolvedLocale(detected));
  i18n.changeLanguage(detected.locale);

  window.addEventListener('languagechange', () => {
    const state = serverUiStore.getState().locale;
    if (state.userOverride || state.source === 'url') return;
    const next = resolveLocale(window.location.search, loadSavedLocale(), navigator.language, DEFAULT_LOCALE);
    serverUiStore.dispatch(setResolvedLocale(next));
    i18n.changeLanguage(next.locale);
  });

  serverUiStore.subscribe(() => {
    const current = serverUiStore.getState().locale;
    i18n.changeLanguage(current.locale);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={serverUiStore}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  </React.StrictMode>
);
