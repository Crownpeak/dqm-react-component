import { configureStore } from '@reduxjs/toolkit';
import { localeReducer } from './localeSlice';

export const serverUiStore = configureStore({
  reducer: {
    locale: localeReducer,
  },
});

export type ServerUiState = ReturnType<typeof serverUiStore.getState>;
export type ServerUiDispatch = typeof serverUiStore.dispatch;
