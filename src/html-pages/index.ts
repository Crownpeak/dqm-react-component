/**
 * DQM Widget - Standalone integration for any website
 * 
 * This module provides utilities to load and initialize the DQM widget.
 * 
 * @packageDocumentation
 */

// Re-export main widget initialization function and types
export { initDQMWidget, DQMWidget } from './DQMWidget';
export type { DQMWidgetConfig } from './DQMWidget';

/**
 * Load the DQM React widget dynamically from a URL.
 * 
 * This is useful for platforms like Shopify where you want to load the widget
 * from a CDN or API route without bundling it into your application.
 * 
 * @param widgetUrl - Primary URL to load the widget from
 * @param fallbackUrl - Fallback URL if primary fails
 * 
 * @example
 * ```js
 * loadDQMWidget(
 *   'https://cdn.example.com/dqm-widget.iife.js',
 *   'https://backup.example.com/dqm-widget.iife.js'
 * );
 * ```
 */
export function loadDQMWidget(widgetUrl: string, fallbackUrl?: string): void {
  console.log('[DQM] Loading widget...');

  // Load fonts (idempotent)
  injectFonts();

  // Load our compiled widget from URL
  console.log(`[DQM] Loading widget from: ${widgetUrl}`);

  const cachedUrl = sessionStorage.getItem('dqm_widget_url');
  const urlToLoad = cachedUrl || widgetUrl;

  if (!cachedUrl) {
    sessionStorage.setItem('dqm_widget_url', widgetUrl);
  }

  loadScript(urlToLoad, true, () => {
    console.log('[DQM] Widget loaded successfully');
  }, () => {
    if (fallbackUrl) {
      console.warn('[DQM] Primary URL failed, trying fallback...');
      loadScript(fallbackUrl, true, () => {
        console.log('[DQM] Widget loaded from fallback successfully');
        sessionStorage.setItem('dqm_widget_url', fallbackUrl);
      }, () => {
        console.error('[DQM] Failed to load widget from both URLs');
      });
    } else {
      console.error('[DQM] Failed to load widget');
    }
  });
}

/**
 * @deprecated Use `loadDQMWidget` instead. This function is kept for backwards compatibility.
 */
export function loadMUIWidget(widgetUrl: string, fallbackUrl: string): void {
  // Fallback modal functions for legacy compatibility
  (window as any).openDQMSidebar = (window as any).openDQMSidebar || function () {
    console.log('[DQM] Modal function not yet loaded, retrying...');
    setTimeout(() => {
      if ((window as any).openDQMSidebar) {
        (window as any).openDQMSidebar();
      }
    }, 1000);
  };

  (window as any).closeDQMSidebar = (window as any).closeDQMSidebar || function () {
    console.log('[DQM] Close modal function not yet loaded');
  };

  loadDQMWidget(widgetUrl, fallbackUrl);
}

/**
 * Inject required Google Fonts into the document head.
 * Safe to call multiple times - will not duplicate links.
 */
function injectFonts(): void {
  if (!document.querySelector('link[href*="fonts.googleapis.com/css"][href*="Roboto"]')) {
    const robotoLink = document.createElement('link');
    robotoLink.rel = 'stylesheet';
    robotoLink.href = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap';
    document.head.appendChild(robotoLink);
  }

  if (!document.querySelector('link[href*="fonts.googleapis.com/icon"]')) {
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(iconsLink);
  }
}

/**
 * Helper to load a script dynamically.
 */
function loadScript(
  src: string | null, 
  module = false, 
  onSuccess: () => void, 
  onError?: (error: string | Event) => void
): void {
  if (!src) {
    onError?.('No URL provided');
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  if (module) {
    script.setAttribute('type', 'module');
  }
  script.onload = onSuccess;
  script.onerror = (error) => {
    console.error('[DQM] Failed to load script:', src, error);
    onError?.(error);
  };
  document.head.appendChild(script);
}