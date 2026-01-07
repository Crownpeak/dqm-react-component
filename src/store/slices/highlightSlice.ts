/**
 * Highlight Redux Slice
 *
 * Manages the error highlight state including current selection, view mode, and cached content.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Checkpoint } from '../../types';

export type ViewMode = 'browser' | 'source';

export interface HighlightCacheEntry {
  browser?: string;
  source?: string;
  timestamp: number;
}

export interface HighlightSliceState {
  /** Currently selected checkpoint for highlighting */
  selectedCheckpoint: Checkpoint | null;
  /** Currently selected checkpoint ID */
  selectedCheckpointId: string | null;
  /** Current view mode (browser or source) */
  viewMode: ViewMode;
  /** Whether to show all highlights or just selected */
  showAllHighlights: boolean;
  /** Index of currently visible highlight (for navigation) - 1-based */
  currentHighlightIndex: number;
  /** Total number of highlights on current page */
  totalHighlights: number;
  /** Index of highlight visible via scroll observation - 1-based */
  visibleHighlightIndex: number;
  /** Cached highlight content by checkpoint ID */
  cache: Record<string, HighlightCacheEntry>;
  /** Scroll positions by checkpoint ID */
  scrollPositions: Record<string, { browser: number; source: number }>;
  /** Whether highlight modal is open */
  isModalOpen: boolean;
  /** Loading state for highlight content */
  isLoading: boolean;
  /** Error message if highlight loading failed */
  error: string | null;
  /** Current highlighted HTML content to display */
  highlightedContent: string;
  /** Whether scripts are disabled in browser view */
  scriptsDisabled: boolean;
  /** Whether auto-scroll to first highlight has occurred */
  hasAutoScrolled: boolean;
  /** Click indicator to trigger scroll (incremented on nav button click) */
  clickedIndicator: number;
  /** Asset ID for the current analysis */
  currentAssetId: string | null;
}

const initialState: HighlightSliceState = {
  selectedCheckpoint: null,
  selectedCheckpointId: null,
  viewMode: 'browser',
  showAllHighlights: false,
  currentHighlightIndex: 0,
  totalHighlights: 0,
  visibleHighlightIndex: 0,
  cache: {},
  scrollPositions: {},
  isModalOpen: false,
  isLoading: false,
  error: null,
  highlightedContent: '',
  scriptsDisabled: true,
  hasAutoScrolled: false,
  clickedIndicator: 0,
  currentAssetId: null,
};

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;

export const highlightSlice = createSlice({
  name: 'highlight',
  initialState,
  reducers: {
    /** Select a checkpoint for highlighting */
    selectCheckpoint: (state, action: PayloadAction<Checkpoint | null>) => {
      state.selectedCheckpoint = action.payload;
      state.selectedCheckpointId = action.payload?.id || null;
      state.currentHighlightIndex = 0;
      state.visibleHighlightIndex = 0;
      state.hasAutoScrolled = false;
      if (action.payload) {
        state.isModalOpen = true;
      }
    },

    /** Set checkpoint ID without full checkpoint object */
    setSelectedCheckpointId: (state, action: PayloadAction<string | null>) => {
      state.selectedCheckpointId = action.payload;
      if (!action.payload) {
        state.selectedCheckpoint = null;
      }
    },

    /** Toggle between browser and source view */
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },

    /** Toggle showing all highlights vs selected */
    toggleShowAllHighlights: (state) => {
      state.showAllHighlights = !state.showAllHighlights;
      state.selectedCheckpoint = null;
    },

    /** Set show all highlights explicitly */
    setShowAllHighlights: (state, action: PayloadAction<boolean>) => {
      state.showAllHighlights = action.payload;
      if (action.payload) {
        state.selectedCheckpoint = null;
      }
    },

    /** Navigate to specific highlight */
    setCurrentHighlightIndex: (state, action: PayloadAction<number>) => {
      state.currentHighlightIndex = action.payload;
    },

    /** Navigate to next highlight */
    nextHighlight: (state) => {
      if (state.currentHighlightIndex < state.totalHighlights - 1) {
        state.currentHighlightIndex += 1;
      }
    },

    /** Navigate to previous highlight */
    previousHighlight: (state) => {
      if (state.currentHighlightIndex > 0) {
        state.currentHighlightIndex -= 1;
      }
    },

    /** Set total highlights count */
    setTotalHighlights: (state, action: PayloadAction<number>) => {
      state.totalHighlights = action.payload;
    },

    /** Update visible highlight from scroll observation */
    setVisibleHighlightIndex: (state, action: PayloadAction<number>) => {
      state.visibleHighlightIndex = action.payload;
    },

    /** Cache highlight content */
    cacheHighlight: (
      state,
      action: PayloadAction<{
        checkpointId: string;
        content: string;
        type: 'browser' | 'source';
      }>
    ) => {
      const { checkpointId, content, type } = action.payload;
      if (!state.cache[checkpointId]) {
        state.cache[checkpointId] = { timestamp: Date.now() };
      }
      state.cache[checkpointId][type] = content;
      state.cache[checkpointId].timestamp = Date.now();
    },

    /** Get cached content if valid */
    clearExpiredCache: (state) => {
      const now = Date.now();
      Object.keys(state.cache).forEach((key) => {
        if (now - state.cache[key].timestamp > CACHE_TTL) {
          delete state.cache[key];
        }
      });
    },

    /** Clear all cache */
    clearCache: (state) => {
      state.cache = {};
    },

    /** Save scroll position for checkpoint */
    saveScrollPosition: (
      state,
      action: PayloadAction<{
        checkpointId: string;
        position: { browser?: number; source?: number };
      }>
    ) => {
      const { checkpointId, position } = action.payload;
      if (!state.scrollPositions[checkpointId]) {
        state.scrollPositions[checkpointId] = { browser: 0, source: 0 };
      }
      if (position.browser !== undefined) {
        state.scrollPositions[checkpointId].browser = position.browser;
      }
      if (position.source !== undefined) {
        state.scrollPositions[checkpointId].source = position.source;
      }
    },

    /** Open highlight modal */
    openModal: (state) => {
      state.isModalOpen = true;
    },

    /** Close highlight modal */
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedCheckpoint = null;
      state.selectedCheckpointId = null;
      state.showAllHighlights = false;
      state.hasAutoScrolled = false;
      state.totalHighlights = 0;
      state.currentHighlightIndex = 0;
      state.highlightedContent = '';
    },

    /** Set highlighted content */
    setHighlightedContent: (state, action: PayloadAction<string>) => {
      state.highlightedContent = action.payload;
    },

    /** Toggle scripts in browser view */
    toggleScripts: (state) => {
      state.scriptsDisabled = !state.scriptsDisabled;
    },

    /** Set scripts disabled state */
    setScriptsDisabled: (state, action: PayloadAction<boolean>) => {
      state.scriptsDisabled = action.payload;
    },

    /** Set has auto scrolled flag */
    setHasAutoScrolled: (state, action: PayloadAction<boolean>) => {
      state.hasAutoScrolled = action.payload;
    },

    /** Increment click indicator to trigger scroll */
    incrementClickIndicator: (state) => {
      state.clickedIndicator += 1;
    },

    /** Set current asset ID */
    setCurrentAssetId: (state, action: PayloadAction<string | null>) => {
      state.currentAssetId = action.payload;
    },

    /** Navigate highlight with wrap-around */
    navigateHighlight: (state, action: PayloadAction<'next' | 'prev'>) => {
      if (state.totalHighlights === 0) return;
      
      // Use visibleHighlight as base if available, otherwise currentHighlight
      let index = (state.visibleHighlightIndex || state.currentHighlightIndex) - 1;
      
      if (action.payload === 'next') {
        index = (index + 1) % state.totalHighlights;
      } else {
        index = index - 1;
        if (index < 0) index = state.totalHighlights - 1;
      }
      
      state.currentHighlightIndex = index + 1; // Convert back to 1-based
      state.visibleHighlightIndex = 0; // Reset so next click continues from new position
      state.clickedIndicator += 1; // Trigger scroll
    },

    /** Set loading state */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /** Set error state */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /** Reset highlight state */
    resetHighlight: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  selectCheckpoint,
  setSelectedCheckpointId,
  setViewMode,
  toggleShowAllHighlights,
  setShowAllHighlights,
  setCurrentHighlightIndex,
  nextHighlight,
  previousHighlight,
  setTotalHighlights,
  setVisibleHighlightIndex,
  cacheHighlight,
  clearExpiredCache,
  clearCache,
  saveScrollPosition,
  openModal,
  closeModal,
  setLoading,
  setError,
  resetHighlight,
  setHighlightedContent,
  toggleScripts,
  setScriptsDisabled,
  setHasAutoScrolled,
  incrementClickIndicator,
  setCurrentAssetId,
  navigateHighlight,
} = highlightSlice.actions;

export default highlightSlice.reducer;

// Selectors
export const selectSelectedCheckpoint = (state: { highlight: HighlightSliceState }) =>
  state.highlight.selectedCheckpoint;
export const selectSelectedCheckpointId = (state: { highlight: HighlightSliceState }) =>
  state.highlight.selectedCheckpointId;
export const selectViewMode = (state: { highlight: HighlightSliceState }) =>
  state.highlight.viewMode;
export const selectShowAllHighlights = (state: { highlight: HighlightSliceState }) =>
  state.highlight.showAllHighlights;
export const selectCurrentHighlightIndex = (state: { highlight: HighlightSliceState }) =>
  state.highlight.currentHighlightIndex;
export const selectTotalHighlights = (state: { highlight: HighlightSliceState }) =>
  state.highlight.totalHighlights;
export const selectVisibleHighlightIndex = (state: { highlight: HighlightSliceState }) =>
  state.highlight.visibleHighlightIndex;
export const selectHighlightCache = (state: { highlight: HighlightSliceState }) =>
  state.highlight.cache;
export const selectScrollPositions = (state: { highlight: HighlightSliceState }) =>
  state.highlight.scrollPositions;
export const selectIsModalOpen = (state: { highlight: HighlightSliceState }) =>
  state.highlight.isModalOpen;
export const selectIsHighlightLoading = (state: { highlight: HighlightSliceState }) =>
  state.highlight.isLoading;
export const selectHighlightError = (state: { highlight: HighlightSliceState }) =>
  state.highlight.error;
export const selectHighlightedContent = (state: { highlight: HighlightSliceState }) =>
  state.highlight.highlightedContent;
export const selectScriptsDisabled = (state: { highlight: HighlightSliceState }) =>
  state.highlight.scriptsDisabled;
export const selectHasAutoScrolled = (state: { highlight: HighlightSliceState }) =>
  state.highlight.hasAutoScrolled;
export const selectClickedIndicator = (state: { highlight: HighlightSliceState }) =>
  state.highlight.clickedIndicator;
export const selectCurrentAssetId = (state: { highlight: HighlightSliceState }) =>
  state.highlight.currentAssetId;

// Derived selectors
export const selectCachedContent = (checkpointId: string, type: 'browser' | 'source') =>
  (state: { highlight: HighlightSliceState }) => {
    const entry = state.highlight.cache[checkpointId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry[type] || null;
  };

export const selectScrollPosition = (checkpointId: string) =>
  (state: { highlight: HighlightSliceState }) =>
    state.highlight.scrollPositions[checkpointId] || { browser: 0, source: 0 };
