/**
 * Test Utilities
 *
 * Common utilities for testing React components with Redux and i18n.
 */
import React, { type ReactElement, type PropsWithChildren } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import i18n from '../i18n';
import { localeReducer } from '../store/localeSlice';
import { analysisSlice } from '../store/slices/analysisSlice';
import { highlightSlice } from '../store/slices/highlightSlice';
import { authSlice } from '../store/slices/authSlice';
import { aiSlice } from '../store/slices/aiSlice';
import { dqmApi } from '../store/api/dqmApi';

// MUI Theme for tests
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Combined reducer for test store
const rootReducer = combineReducers({
  locale: localeReducer,
  analysis: analysisSlice.reducer,
  highlight: highlightSlice.reducer,
  auth: authSlice.reducer,
  ai: aiSlice.reducer,
  dqmApi: dqmApi.reducer,
});

export type TestRootState = ReturnType<typeof rootReducer>;

/**
 * Create a test store with optional preloaded state.
 * Uses same configuration as the main store.
 */
export function createTestStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Disable serializable check for tests
        serializableCheck: false,
      }).concat(dqmApi.middleware),
  });
}

export type AppStore = ReturnType<typeof createTestStore>;

/**
 * Wrapper component that provides all required providers
 */
interface WrapperProps {
  store?: ReturnType<typeof createTestStore>;
}

function AllTheProviders({
  children,
  store = createTestStore(),
}: PropsWithChildren<WrapperProps>) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}

/**
 * Custom render that includes all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<TestRootState>;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { store: ReturnType<typeof createTestStore> } {
  function Wrapper({ children }: PropsWithChildren) {
    return <AllTheProviders store={store}>{children}</AllTheProviders>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Create mock credentials for testing
 */
export function createMockCredentials(overrides?: Partial<{ apiKey: string; websiteId: string }>) {
  return {
    apiKey: 'test-api-key-12345',
    websiteId: 'test-website-id',
    ...overrides,
  };
}

/**
 * Create mock analysis data for testing
 */
export function createMockAnalysisData(overrides?: Partial<TestRootState['analysis']>) {
  return {
    state: 'idle' as const,
    assetId: null,
    data: null,
    error: null,
    isAnalyzing: false,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

/**
 * Create mock checkpoint for testing
 */
export function createMockCheckpoint(overrides?: Partial<import('../types').Checkpoint>) {
  return {
    colors: { bg: '#fee2e2', text: '#dc2626' },
    id: 'test-checkpoint-1',
    name: 'Test Checkpoint',
    description: 'Test checkpoint description',
    reference: 'https://example.com/reference',
    number: 1,
    categoryNumber: 1,
    category: 'Accessibility',
    priority: true, // high priority
    failed: true,
    topics: ['accessibility'],
    canHighlight: { page: true, source: true },
    restricted: false,
    checkpointType: {
      name: 'accessibility',
      modifiedBy: 'system',
      modified: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    ...overrides,
  } satisfies import('../types').Checkpoint;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  { timeout = 5000, interval = 100 } = {}
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timed out');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
