// DQM Widget Entry Point - Injects React component into any website via Shadow DOM
import React from 'react';
import {createRoot} from 'react-dom/client';
import type {Theme} from '@mui/material/styles';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {ErrorBoundary} from "../ErrorBoundary.tsx";
// Emotion cache + provider for Shadow DOM style scoping
import createCache from '@emotion/cache';
import {CacheProvider} from '@emotion/react';
import DQMSidebar from "../DQMSidebar.tsx";
import type {DQMConfig} from "../types.ts";

// Re-export types for consumers
export type {DQMConfig} from "../types.ts";

/**
 * Widget configuration interface for standalone usage.
 * Can be provided via window.DQM_CONFIG or passed to initDQMWidget().
 */
export interface DQMWidgetConfig extends DQMConfig {
    /** Initial open state of the sidebar. Default: false (or true if ?dqm=true in URL) */
    initialOpen?: boolean;
}

// Constants to avoid magic numbers
const Z_INDEX_BASE = 999999;
const HOST_ELEMENT_ID = 'dqm-widget-host';
const LEGACY_CONTAINER_ID = 'dqm-react-root';
const EMOTION_STYLE_CONTAINER_ID = 'dqm-emotion-style-container';
const PORTAL_CONTAINER_ID = 'dqm-portal-root';
const BASE_FONT_SIZE = 18; // stabilize widget scaling across varying Shopify theme root sizes

// Create MUI theme optimized for Shopify integration
// Removed early theme creation – we must know the portal container first.

// Factor out theme factory so we can inject portal container for all portal-based components.
// Added htmlFontSize parameter to normalize scaling vs Shopify theme root adjustments.
function buildTheme(portalContainer: HTMLElement, htmlFontSize: number): Theme {
    // Build base theme first
    return createTheme({
        palette: {
            primary: {main: '#1976d2', light: '#42a5f5', dark: '#1565c0'},
            secondary: {main: '#f50057'},
            background: {default: '#fafafa'},
        },
        typography: {
            fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            htmlFontSize, // allow MUI pxToRem to compute sizes when used internally
            fontSize: 18, // larger base
            h6: {fontSize: '22px'},
            h5: {fontSize: '24px'},
            h4: {fontSize: '26px'},
            h3: {fontSize: '28px'},
            h2: {fontSize: '30px'},
            h1: {fontSize: '32px'},
            subtitle2: {fontSize: '19px'},
            subtitle1: {fontSize: '18px'},
            body1: {fontSize: '18px'},
            body2: {fontSize: '17px'},
            button: {fontSize: '17px'},
        },
        shape: {borderRadius: 8},
        components: {
            MuiDialog: {
                styleOverrides: {root: {zIndex: Z_INDEX_BASE}},
                defaultProps: {container: portalContainer},
            },
            // CRITICAL: For Shadow DOM to work correctly, we must disable portals
            // so that all components render within the React tree where the Emotion
            // CacheProvider context is available. Otherwise styles won't be injected
            // into the Shadow DOM style container.
            MuiDrawer: {
                defaultProps: {
                    ModalProps: {
                        container: portalContainer,
                        disablePortal: true, // Keep within React tree for Shadow DOM styles
                    },
                },
            },
            MuiModal: {
                defaultProps: {
                    container: portalContainer,
                    disablePortal: true, // Keep within React tree for Shadow DOM styles
                },
            },
            MuiPopover: {
                defaultProps: {
                    container: portalContainer,
                    disablePortal: true,
                },
            },
            MuiPopper: {defaultProps: {disablePortal: true}},
            MuiFab: {styleOverrides: {root: {zIndex: Z_INDEX_BASE}}},
            MuiBackdrop: {styleOverrides: {root: {zIndex: Z_INDEX_BASE - 1}}},
        },
    });
}

// Determine current document root font size (kept for potential diagnostics if needed)
function detectHtmlFontSize(): number {
    const computed = getComputedStyle(document.documentElement).fontSize;
    const value = parseFloat(computed || String(BASE_FONT_SIZE));
    if (!isFinite(value) || value <= 0) return BASE_FONT_SIZE;
    return value;
}

// We now force a stable base font size for consistent rendering. Set to undefined to re-enable adaptive mode.
const FORCE_BASE_FONT_SIZE: number | undefined = BASE_FONT_SIZE;

// Global widget configuration (merged with initDQMWidget parameter)
let globalWidgetConfig: DQMWidgetConfig = {};

/**
 * Internal setter for widget config - called by initDQMWidget
 */
function setGlobalWidgetConfig(config: DQMWidgetConfig): void {
    globalWidgetConfig = config;
}

export const DQMWidget: React.FC<{ theme: Theme }> = ({theme}) => {
    // Merge config sources: window.DQM_CONFIG < globalWidgetConfig (from initDQMWidget)
    // IMPORTANT: Always enable shadowDomMode for standalone widget to ensure styles work
    const config: DQMWidgetConfig = {
        ...(typeof window !== 'undefined' ? (window as any).DQM_CONFIG : {}),
        ...globalWidgetConfig,
        shadowDomMode: true, // Force Shadow DOM mode for standalone widget
    };
    
    // Initial open state: URL param > config > false
    const urlParam = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search).get('dqm') === 'true'
        : false;
    const initialOpen = urlParam || config.initialOpen || false;
    
    const [modalOpen, setModalOpen] = React.useState(initialOpen);

    const onOpen = React.useCallback(() => setModalOpen(true), [setModalOpen]);
    const onClose = React.useCallback(() => setModalOpen(false), [setModalOpen]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <ErrorBoundary>
                <DQMSidebar
                    open={modalOpen}
                    onOpen={onOpen}
                    onClose={onClose}
                    config={config}
                />
            </ErrorBoundary>
        </ThemeProvider>
    );
};

// Helper to inject external font/icon styles into the shadow root (idempotent)
function injectExternalStyles(shadow: ShadowRoot): void {
    const ensureLink = (id: string, href: string) => {
        if (shadow.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        shadow.appendChild(link);
    };
    // Roboto font weights & Material Icons (Google CDN). If privacy concerns: switch to @fontsource packages.
    ensureLink('dqm-font-roboto', 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap');
    ensureLink('dqm-font-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons');
}

// Helper to inject base isolation styles into the shadow root (idempotent)
function injectBaseIsolation(shadow: ShadowRoot): void {
    if (shadow.getElementById('dqm-base-style')) return;
    const style = document.createElement('style');
    style.id = 'dqm-base-style';
    style.textContent = `
  /* Typography Isolation Layer - Force consistent font rendering across all shops */
  :host {
    /* Establish independent font context */
    all: initial;
    display: block;
    position: relative;
    z-index: ${Z_INDEX_BASE};
    /* Force base typography */
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
    font-size: ${BASE_FONT_SIZE}px !important;
    font-weight: 400 !important;
    line-height: 1.5 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
    /* Ensure quality rendering */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Reset typography for ALL elements inside shadow DOM */
  *, *::before, *::after {
    /* Inherit from :host, not from document */
    font-family: inherit !important;
    font-size: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
    letter-spacing: inherit !important;
    text-transform: inherit !important;
    /* Basic box model for consistency */
    box-sizing: border-box;
  }

  /* Re-establish semantic typography hierarchy */
  #${LEGACY_CONTAINER_ID}, #${PORTAL_CONTAINER_ID} {
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
    font-size: ${BASE_FONT_SIZE}px !important;
    line-height: 1.5 !important;
  }

  /* Headings - explicit sizes to prevent shop theme interference */
  h1 { font-size: 32px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }
  h2 { font-size: 30px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }
  h3 { font-size: 28px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }
  h4 { font-size: 26px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }
  h5 { font-size: 24px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }
  h6 { font-size: 22px !important; font-weight: 500 !important; line-height: 1.2 !important; margin: 0; }

  /* Body text */
  p, div, span {
    font-size: ${BASE_FONT_SIZE}px !important;
    line-height: 1.5 !important;
    margin: 0;
  }

  /* Links - no color override, let MUI handle it */
  a {
    text-decoration: none;
    cursor: pointer;
  }

  /* Buttons */
  button {
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
    cursor: pointer;
  }

  /* Lists */
  ul, ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* Force MUI components to use our typography */
  .MuiTypography-root {
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
  }

  .MuiTypography-h1 { font-size: 32px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-h2 { font-size: 30px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-h3 { font-size: 28px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-h4 { font-size: 26px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-h5 { font-size: 24px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-h6 { font-size: 22px !important; font-weight: 500 !important; line-height: 1.2 !important; }
  .MuiTypography-body1 { font-size: 18px !important; line-height: 1.5 !important; }
  .MuiTypography-body2 { font-size: 17px !important; line-height: 1.5 !important; }
  .MuiTypography-subtitle1 { font-size: 18px !important; line-height: 1.5 !important; }
  .MuiTypography-subtitle2 { font-size: 19px !important; line-height: 1.5 !important; }
  .MuiTypography-button { font-size: 17px !important; font-weight: 600 !important; }

  /* Force all MUI components */
  .MuiButton-root,
  .MuiChip-root,
  .MuiIconButton-root,
  .MuiTab-root,
  .MuiMenuItem-root,
  .MuiListItem-root,
  .MuiListItemText-root {
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
  }

  /* Input fields */
  input, textarea, select {
    font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
    font-size: ${BASE_FONT_SIZE}px !important;
  }

  /* Prevent text-transform inheritance from shop */
  * {
    text-transform: none !important;
    letter-spacing: normal !important;
  }

  /* Allow specific MUI components to set their own text-transform */
  .MuiButton-root,
  .MuiTab-root,
  .MuiChip-label {
    text-transform: none !important;
  }

  /* Normalize text rendering across browsers */
  * {
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  `;
    shadow.prepend(style);
}

// Helper: create (or reuse) Shadow DOM host + containers
function ensureShadowDom(): {
    shadowRoot: ShadowRoot;
    reactMount: HTMLElement;
    cache: any;
    portalContainer: HTMLElement
} {
    // Reuse existing host if present
    let host = document.getElementById(HOST_ELEMENT_ID) as HTMLElement | null;
    if (!host) {
        host = document.createElement('div');
        host.id = HOST_ELEMENT_ID;
        // Avoid overly aggressive reset; only isolate stacking context & layout.
        host.style.position = 'relative';
        host.style.zIndex = String(Z_INDEX_BASE);
        host.style.display = 'block';
        host.style.fontSize = BASE_FONT_SIZE + 'px'; // ensure rem root inside shadow is consistent
        host.style.lineHeight = '1.5';
        document.body.appendChild(host);
    }

    let shadow = host.shadowRoot;
    if (!shadow) {
        shadow = host.attachShadow({mode: 'open'});
    }

    // Inject isolation + externals first
    injectBaseIsolation(shadow);
    injectExternalStyles(shadow);

    // Style container for Emotion
    let styleContainer = shadow.getElementById(EMOTION_STYLE_CONTAINER_ID) as HTMLElement | null;
    if (!styleContainer) {
        styleContainer = document.createElement('div');
        styleContainer.id = EMOTION_STYLE_CONTAINER_ID;
        shadow.appendChild(styleContainer);
    }

    // Portal container (for Dialog / Popover / Tooltip etc.)
    let portalContainer = shadow.getElementById(PORTAL_CONTAINER_ID) as HTMLElement | null;
    if (!portalContainer) {
        portalContainer = document.createElement('div');
        portalContainer.id = PORTAL_CONTAINER_ID;
        shadow.appendChild(portalContainer);
    }

    // React mount container inside shadow root
    let reactMount = shadow.getElementById(LEGACY_CONTAINER_ID) as HTMLElement | null;
    if (!reactMount) {
        reactMount = document.createElement('div');
        reactMount.id = LEGACY_CONTAINER_ID;
        shadow.appendChild(reactMount);
    }

    // Create (or reuse) a dedicated Emotion cache bound to shadow root via style container
    // BUG EXPLANATION: Using `insertionPoint` inside shadowRoot without specifying a matching container
    // caused Emotion to default to `document.head` and attempt `insertBefore` with a node not
    // belonging to that parent, raising NotFoundError. FIX: Provide a container element inside the
    // shadow root and let Emotion manage style tags there (no insertionPoint needed).
    let cache = (host as any).__dqmEmotionCache;
    if (!cache) {
        cache = createCache({
            key: 'dqm',
            container: styleContainer, // ensure styles live inside shadow DOM
            prepend: true,
        });
        (host as any).__dqmEmotionCache = cache;
    }

    return {shadowRoot: shadow, reactMount, cache, portalContainer};
}

/**
 * Initialize the DQM Widget.
 * 
 * @param config - Optional configuration object. Merged with window.DQM_CONFIG.
 * @param providedContainer - Optional custom container element to mount into.
 * 
 * @example
 * // Via global config (before script load)
 * window.DQM_CONFIG = { apiKey: 'xxx', websiteId: 'yyy' };
 * 
 * @example  
 * // Via function call (ESM import)
 * import { initDQMWidget } from '@crownpeak/dqm-react-component/widget';
 * initDQMWidget({ apiKey: 'xxx', websiteId: 'yyy' });
 * 
 * @example
 * // Via IIFE global
 * window.CrownpeakDQM.init({ apiKey: 'xxx', websiteId: 'yyy' });
 */
export const initDQMWidget = (config?: DQMWidgetConfig, providedContainer?: HTMLElement): void => {
    // Guard against double initialization (idempotent)
    if ((window as any).__DQM_WIDGET_INITIALIZED) {
        console.warn('[DQM] Widget already initialized – skipping duplicate call');
        return;
    }

    // Merge config with window.DQM_CONFIG
    const mergedConfig: DQMWidgetConfig = {
        ...(typeof window !== 'undefined' ? (window as any).DQM_CONFIG : {}),
        ...config,
    };
    setGlobalWidgetConfig(mergedConfig);
    
    console.log('[DQM] Initializing widget...', mergedConfig.disabled ? '(disabled)' : '');

    let reactContainer: HTMLElement;
    let cache: any | undefined;

    if (providedContainer && providedContainer.shadowRoot) {
        // If a custom container with its own shadow root is provided, mount there
        const shadow = providedContainer.shadowRoot;
        let styleContainer = shadow.getElementById(EMOTION_STYLE_CONTAINER_ID) as HTMLElement | null;
        if (!styleContainer) {
            styleContainer = document.createElement('div');
            styleContainer.id = EMOTION_STYLE_CONTAINER_ID;
            shadow.appendChild(styleContainer);
        }
        let portalContainer = shadow.getElementById(PORTAL_CONTAINER_ID) as HTMLElement | null;
        if (!portalContainer) {
            portalContainer = document.createElement('div');
            portalContainer.id = PORTAL_CONTAINER_ID;
            shadow.appendChild(portalContainer);
        }
        injectExternalStyles(shadow);
        injectBaseIsolation(shadow);
        reactContainer = shadow.getElementById(LEGACY_CONTAINER_ID) as HTMLElement | null || document.createElement('div');
        if (!reactContainer.parentElement) shadow.appendChild(reactContainer);
        cache = createCache({key: 'dqm', container: styleContainer, prepend: true});
        const theme = buildTheme(portalContainer, FORCE_BASE_FONT_SIZE ?? detectHtmlFontSize());
        // Render React app with Emotion CacheProvider so MUI styles live in Shadow DOM
        const root = createRoot(reactContainer);
        root.render(
            <CacheProvider value={cache}>
                <DQMWidget theme={theme}/>
            </CacheProvider>
        );
    } else if (providedContainer) {
        // Provided container without shadow root (legacy scenario)
        reactContainer = providedContainer;
        cache = createCache({key: 'dqm', prepend: true});
        const theme = buildTheme(reactContainer, FORCE_BASE_FONT_SIZE ?? detectHtmlFontSize()); // fallback: use same container
        const root = createRoot(reactContainer);
        root.render(
            <CacheProvider value={cache}>
                <DQMWidget theme={theme}/>
            </CacheProvider>
        );
    } else {
        // Default: create / use our managed Shadow DOM
        const shadowSetup = ensureShadowDom();
        reactContainer = shadowSetup.reactMount;
        cache = shadowSetup.cache;
        const theme = buildTheme(shadowSetup.portalContainer, FORCE_BASE_FONT_SIZE ?? detectHtmlFontSize());
        const root = createRoot(reactContainer);
        root.render(
            <CacheProvider value={cache}>
                <DQMWidget theme={theme}/>
            </CacheProvider>
        );
    }

    // Stop duplicate rendering path below
    (window as any).__DQM_WIDGET_INITIALIZED = true;
};

// Expose global API for IIFE usage
if (typeof window !== 'undefined') {
    (window as any).CrownpeakDQM = {
        init: initDQMWidget,
        version: '1.0.0',
    };
}

// Auto-initialize when script loads (unless manual init is requested)
// Set window.DQM_MANUAL_INIT = true before loading the script to prevent auto-init
if (typeof window !== 'undefined' && !(window as any).DQM_MANUAL_INIT) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initDQMWidget());
    } else {
        initDQMWidget();
    }
}
