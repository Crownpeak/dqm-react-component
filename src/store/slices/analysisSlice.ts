/**
 * Analysis Redux Slice
 *
 * Manages the DQM analysis state including loading states, results, and errors.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AnalysisData, AnalysisState } from '../../types';

export interface AnalysisSliceState {
  /** Current analysis state */
  state: AnalysisState;
  /** Asset ID from the API */
  assetId: string | null;
  /** Analysis data once completed */
  data: AnalysisData | null;
  /** Error message if analysis failed */
  error: string | null;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Timestamp when analysis started */
  startedAt: number | null;
  /** Timestamp when analysis completed */
  completedAt: number | null;
}

const initialState: AnalysisSliceState = {
  state: 'idle',
  assetId: null,
  data: null,
  error: null,
  isAnalyzing: false,
  startedAt: null,
  completedAt: null,
};

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    /** Start a new analysis */
    startAnalysis: (state) => {
      state.state = 'analyzing';
      state.isAnalyzing = true;
      state.error = null;
      state.startedAt = Date.now();
      state.completedAt = null;
    },

    /** Set the asset ID after creation */
    setAssetId: (state, action: PayloadAction<string>) => {
      state.assetId = action.payload;
    },

    /** Analysis completed successfully */
    analysisCompleted: (state, action: PayloadAction<AnalysisData>) => {
      state.state = 'completed';
      state.isAnalyzing = false;
      state.data = action.payload;
      state.completedAt = Date.now();
    },

    /** Analysis failed with error */
    analysisFailed: (state, action: PayloadAction<string>) => {
      state.state = 'error';
      state.isAnalyzing = false;
      state.error = action.payload;
      state.completedAt = Date.now();
    },

    /** Reset analysis state */
    resetAnalysis: (state) => {
      Object.assign(state, initialState);
    },

    /** Update analysis state from API response */
    updateAnalysisState: (state, action: PayloadAction<AnalysisState>) => {
      state.state = action.payload;
      if (action.payload === 'completed' || action.payload === 'error') {
        state.isAnalyzing = false;
        state.completedAt = Date.now();
      }
    },
  },
});

export const {
  startAnalysis,
  setAssetId,
  analysisCompleted,
  analysisFailed,
  resetAnalysis,
  updateAnalysisState,
} = analysisSlice.actions;

export default analysisSlice.reducer;

// Selectors
export const selectAnalysisState = (state: { analysis: AnalysisSliceState }) => state.analysis.state;
export const selectAnalysisData = (state: { analysis: AnalysisSliceState }) => state.analysis.data;
export const selectAssetId = (state: { analysis: AnalysisSliceState }) => state.analysis.assetId;
export const selectIsAnalyzing = (state: { analysis: AnalysisSliceState }) => state.analysis.isAnalyzing;
export const selectAnalysisError = (state: { analysis: AnalysisSliceState }) => state.analysis.error;
export const selectAnalysisDuration = (state: { analysis: AnalysisSliceState }) => {
  if (state.analysis.startedAt && state.analysis.completedAt) {
    return state.analysis.completedAt - state.analysis.startedAt;
  }
  return null;
};
