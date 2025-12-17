/**
 * TypeScript declarations for the DQM Widget standalone bundle.
 * 
 * This file provides type definitions for consumers using the widget bundle
 * (dqm-widget.iife.js or dqm-widget.esm.js) in TypeScript projects.
 */

import type { DQMConfig } from '../types';

/**
 * Widget configuration interface for standalone usage.
 * Extends DQMConfig with widget-specific options.
 */
export interface DQMWidgetConfig extends DQMConfig {
  /** 
   * Initial open state of the sidebar. 
   * Default: false (or true if ?dqm=true is present in the URL)
   */
  initialOpen?: boolean;
}

/**
 * Initialize the DQM Widget on the page.
 * 
 * Creates a Shadow DOM container and renders the DQM sidebar component.
 * Safe to call multiple times - subsequent calls are ignored.
 * 
 * @param config - Optional configuration object. Merged with window.DQM_CONFIG.
 * @param container - Optional custom container element to mount into.
 * 
 * @example
 * ```typescript
 * // ESM import
 * import { initDQMWidget } from '@crownpeak/dqm-react-component/widget';
 * 
 * initDQMWidget({
 *   apiKey: 'your-api-key',
 *   websiteId: 'your-website-id',
 *   initialOpen: true,
 * });
 * ```
 * 
 * @example
 * ```html
 * <!-- IIFE via script tag -->
 * <script>
 *   window.DQM_CONFIG = {
 *     apiKey: 'your-api-key',
 *     websiteId: 'your-website-id',
 *   };
 * </script>
 * <script src="dqm-widget.iife.js"></script>
 * ```
 */
export declare function initDQMWidget(config?: DQMWidgetConfig, container?: HTMLElement): void;

/**
 * Load the DQM widget dynamically from a URL.
 * 
 * Useful for lazy-loading the widget or loading from a CDN.
 * 
 * @param widgetUrl - Primary URL to load the widget from
 * @param fallbackUrl - Optional fallback URL if primary fails
 */
export declare function loadDQMWidget(widgetUrl: string, fallbackUrl?: string): void;

/**
 * @deprecated Use `loadDQMWidget` instead.
 */
export declare function loadMUIWidget(widgetUrl: string, fallbackUrl: string): void;

/**
 * Global CrownpeakDQM API exposed on window object when using IIFE bundle.
 */
export interface CrownpeakDQMGlobal {
  /** Initialize the widget */
  init: typeof initDQMWidget;
  /** Widget version */
  version: string;
}

// Augment global Window interface
declare global {
  interface Window {
    /** 
     * Global DQM configuration object.
     * Set this before loading the widget script to configure it.
     */
    DQM_CONFIG?: DQMWidgetConfig;
    
    /** 
     * Set to true before loading the widget to prevent auto-initialization.
     * Useful when you want to call initDQMWidget() manually.
     */
    DQM_MANUAL_INIT?: boolean;
    
    /** 
     * Global API for the DQM widget (available after IIFE script loads).
     */
    CrownpeakDQM?: CrownpeakDQMGlobal;
    
    /** @internal */
    __DQM_WIDGET_INITIALIZED?: boolean;
  }
}

export {};
