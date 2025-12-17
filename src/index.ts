// Main entry point for the Crownpeak DQM React Component library
export { default as DQMSidebar } from './DQMSidebar';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Type exports
export type { 
  DQMSidebarProps,
  ErrorBoundaryProps,
  AnalysisData, 
  AnalysisState, 
  Checkpoint,
  DQMConfig,
  OAuth2Config,
  AuthMode,
  OverlayConfig,
  OverlayOffsetPosition
} from './types';

// Overlay hook exports (for advanced usage)
export { useOverlayResistant } from './utils/useDomPresence';
export type { 
  OverlayInfo, 
  OverlayPosition,
  UseOverlayResistantConfig 
} from './utils/useDomPresence';
