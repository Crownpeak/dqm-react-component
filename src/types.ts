// Type definitions for Crownpeak DQM React Component
import React from 'react';

// Analysis state type for the DQM analysis workflow
export type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'error';

// Authentication modes
export type AuthMode = 'props' | 'localStorage' | 'backend';

// Session type - determines how API calls are made
export type SessionType = 'direct' | 'backend'; // 'direct' = direct to DQM API, 'backend' = via proxy

/**
 * Position for manual overlay offset configuration.
 * Specifies from which edge the offset should be applied.
 */
export type OverlayOffsetPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Configuration for overlay/toolbar detection and offset handling.
 * 
 * Use this to configure how the DQM sidebar adapts to overlays like
 * toolbars or other fixed elements on the page.
 * 
 * @example
 * // Manual offset for a 50px toolbar at the top
 * overlayConfig: {
 *   manualOffset: {
 *     position: 'top',
 *     pixels: 50
 *   }
 * }
 * 
 * @example
 * // Custom selector with iFrame content validation
 * overlayConfig: {
 *   selector: 'iframe.my-toolbar',
 *   validateIframe: true
 * }
 */
export interface OverlayConfig {
  /**
   * CSS selector for the overlay element to detect.
   *
   * Set to `null` or empty string to disable auto-detection.
   */
  selector?: string | null;
  
  /**
   * Whether to validate iFrame elements by checking if contentWindow exists.
   * Only applies when the detected element is an iFrame.
   * Default: true
   */
  validateIframe?: boolean;
  
  /**
   * Polling interval in milliseconds for detecting overlay changes.
   * Useful for cross-origin iFrames where MutationObserver can't detect internal changes.
   * Set to 0 to disable polling.
   * Default: 1000
   */
  pollMs?: number;
  
  /**
   * Manual offset configuration. Use this when auto-detection doesn't work,
   * e.g., for iFrames that fill the whole screen but have smaller internal content.
   * 
   * When set, this takes precedence over auto-detected values.
   */
  manualOffset?: {
    /**
     * The edge from which to apply the offset.
     */
    position: OverlayOffsetPosition;
    
    /**
     * The offset value in pixels.
     */
    pixels: number;
  };
}

// Translation configuration
export interface TranslationConfig {
  /**
   * Enable auto-translation by default (user can still toggle at runtime).
   * Default: false
   */
  enabledByDefault?: boolean;

  /**
   * Translation compute budget in milliseconds.
   * Default: 15000
   */
  computeBudgetMs?: number;
}

// DQM Configuration
export interface DQMConfig {
  // Direct authentication (highest priority)
  apiKey?: string;
  websiteId?: string;
  
  // Backend authentication
  authBackendUrl?: string;
  
  // Storage preference
  useLocalStorage?: boolean; // Default: true
  
  // Disable DQM completely (shows "Permission Denied")
  disabled?: boolean; // Default: false

  // Hide the logout control (use when the host app manages session lifecycle)
  disableLogout?: boolean; // Default: false
  
  // Custom API endpoint (optional, defaults to Crownpeak)
  apiEndpoint?: string;
  
  // Shadow DOM mode - disables portals so styles work inside Shadow DOM
  // Set to true when embedding widget in Shadow DOM (e.g., standalone widget)
  shadowDomMode?: boolean; // Default: false
  
  /**
   * Configuration for overlay detection and offset handling.
   * 
   * Use this to adapt the sidebar position to fixed overlays like
   * preview bars, admin toolbars, or other fixed-position elements.
   * 
   * @example
   * // Disable overlay detection
   * overlayConfig: { selector: null }
   * 
   * @example
   * // Manual 50px offset from top
   * overlayConfig: { manualOffset: { position: 'top', pixels: 50 } }
   * 
   * @see OverlayConfig for all available options
   */
  overlayConfig?: OverlayConfig;

  /**
   * Optional translation configuration for DQM API results.
   */
  translation?: TranslationConfig;

  /**
   * Optional AI summary configuration.
   */
  summary?: {
    /**
     * Timeout in milliseconds for summary generation.
     * Default: 45000
     */
    timeoutMs?: number;
  };
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

// Grouped categories with checkpoints (used for filtering and display)
export type GroupedCategories = Record<string, Checkpoint[]>;
