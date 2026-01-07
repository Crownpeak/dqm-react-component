import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { localeReducer } from './localeSlice';
import { dqmApi } from './api/dqmApi';
import { analysisSlice } from './slices/analysisSlice';
import { highlightSlice } from './slices/highlightSlice';
import { authSlice } from './slices/authSlice';
import { aiSlice } from './slices/aiSlice';

export const store = configureStore({
  reducer: {
    locale: localeReducer,
    analysis: analysisSlice.reducer,
    highlight: highlightSlice.reducer,
    auth: authSlice.reducer,
    ai: aiSlice.reducer,
    [dqmApi.reducerPath]: dqmApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(dqmApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Re-export everything from slices and api for convenience
export * from './slices';
export * from './api';
export { localeReducer } from './localeSlice';
