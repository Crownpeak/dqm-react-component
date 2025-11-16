// Global type declarations for DQM Widget integration
declare global {
  interface Window {
    DQM_CONFIG?: {
      apiUrl: string;
      enableInPreviewOnly: boolean;
      buttonPosition: string;
    };
    openDQMSidebar?: () => void;
    closeDQMSidebar?: () => void;
    Shopify?: {
      theme?: {
        theme_store_id?: string | null;
      };
    };
  }
}

// SVG imports as React components (Vite specific)
declare module '*.svg?react' {
  import React from 'react';
  const SVGComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

// SVG imports as URLs
declare module '*.svg' {
  const content: string;
  export default content;
}

// Analysis state type for the DQM analysis workflow
export type AnalysisState = 'analyzing' | 'completed' | 'error';

// DQM Modal Props Interface
export interface DQMSidebarProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
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

// Ensure this file is treated as a module
export {};
