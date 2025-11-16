// Type definitions for Crownpeak DQM React Component
import React from 'react';

// Analysis state type for the DQM analysis workflow
export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'error';

// Authentication modes
export type AuthMode = 'props' | 'localStorage' | 'backend';

// Session type - determines how API calls are made
export type SessionType = 'direct' | 'backend'; // 'direct' = direct to DQM API, 'backend' = via proxy

// OAuth2 Configuration
export interface OAuth2Config {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}

// DQM Configuration
export interface DQMConfig {
  // Direct authentication (highest priority)
  apiKey?: string;
  websiteId?: string;
  
  // Backend authentication (OAuth2 or custom)
  authBackendUrl?: string;
  oauth2Config?: OAuth2Config;
  
  // Storage preference
  useLocalStorage?: boolean; // Default: true
  
  // Disable DQM completely (shows "Permission Denied")
  disabled?: boolean; // Default: false
  
  // Custom API endpoint (optional, defaults to Crownpeak)
  apiEndpoint?: string;
}

// DQM Modal Props Interface
export interface DQMSidebarProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  
  // Configuration options
  config?: DQMConfig;
  
  // Callbacks
  onAuthSuccess?: (credentials: { apiKey: string; websiteId: string; sessionToken?: string; sessionType: SessionType }) => void;
  onAuthError?: (error: Error) => void;
  
  debugHtml?: string; // DEBUG ONLY: custom HTML for testing, not for production
}

// ErrorBoundary Props Interface
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** When any value in this array changes, the boundary resets (e.g. route changes). */
  resetKeys?: unknown[];
}

// Checkpoint interface matching the actual API response
export interface Checkpoint {
  colors: { bg: string; text: string };
  id: string;
  name: string;
  description?: string;
  reference: string;
  number: number;
  categoryNumber: number;
  category: string;
  priority: boolean;
  failed: boolean;
  topics: string[];
  canHighlight: {
    page: boolean;
    source: boolean;
  };
  restricted: boolean;
  checkpointType?: {
    name: string;
    modifiedBy: string;
    modified: string;
  };
  created: string;
  modified: string;
}

// Analysis Data Structure matching the actual API response
export interface AnalysisData {
  assetId: string;
  created: string;
  siteName: string;
  totalCheckpoints: number;
  totalErrors: number;
  checkpoints: Checkpoint[];
}
