/**
 * @fileoverview DOM Presence Observer Hooks
 *
 * Provides React hooks for observing DOM element presence and extracting
 * layout information. Handles dynamic content injection, iFrames, and
 * provides resilient observation through multiple strategies:
 *
 * - ResizeObserver-like behavior via resize events
 * - Optional polling fallback for edge cases (e.g., cross-origin iFrames)
 * - Window load event for late-injected content
 *
 * @module useDomPresence
 */
import React from "react";

/**
 * Describes the position of an overlay element relative to the viewport.
 *
 * - `'top'`: Element is anchored to the top edge (e.g., preview bars, toolbars)
 * - `'bottom'`: Element is anchored to the bottom edge (e.g., cookie banners)
 * - `'left'`: Element is anchored to the left edge (e.g., navigation sidebars)
 * - `'right'`: Element is anchored to the right edge (e.g., chat widgets)
 * - `'center'`: Element is floating in the center (e.g., modals)
 * - `null`: No element present or position cannot be determined
 */
export type OverlayPosition = 'top' | 'bottom' | 'left' | 'right' | 'center' | null;

/**
 * Represents the bounding rectangle of a DOM element.
 * All values are in pixels relative to the viewport.
 *
 * @interface ElementRect
 * @property {number} height - The height of the element in pixels
 * @property {number} width - The width of the element in pixels
 * @property {number} top - Distance from the top of the viewport to the element's top edge
 * @property {number} bottom - Distance from the top of the viewport to the element's bottom edge
 * @property {number} left - Distance from the left of the viewport to the element's left edge
 * @property {number} right - Distance from the left of the viewport to the element's right edge
 */
export interface ElementRect {
    height: number;
    width: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/**
 * Configuration options for the useDomPresence hook.
 *
 * @interface DomPresenceOptions
 * @property {ParentNode | Document} [root] - The root element to search within. Defaults to `document`.
 *   Useful for searching within Shadow DOM or specific containers.
 * @property {(el: Element | null) => boolean} [check] - Custom validation function to determine
 *   if the found element should be considered "present". Receives the element (or null if not found).
 *   Return `true` to consider the element present, `false` otherwise.
 *   Useful for validating iFrame readiness (e.g., checking `contentWindow`).
 * @property {number} [pollMs=0] - Polling interval in milliseconds as a fallback mechanism.
 *   Set to a positive value (e.g., 1000) for resilience against edge cases where
 *   MutationObserver might miss changes (e.g., cross-origin iFrame state changes).
 *   Default is 0 (polling disabled).
 */
interface DomPresenceOptions {
    root?: ParentNode | Document;
    check?: (el: Element | null) => boolean;
    pollMs?: number;
}

/**
 * Result object returned by the useDomPresence hook.
 *
 * @interface DomPresenceResult
 * @property {boolean} present - Whether the element is currently present in the DOM
 *   and passes the optional validation check
 * @property {ElementRect | null} rect - The element's bounding rectangle, or null if not present.
 *   Updated on DOM mutations, window resize, and polling (if enabled).
 * @property {OverlayPosition} position - The detected position of the element relative to
 *   the viewport edges. Useful for determining how to adjust other UI elements.
 * @property {Object} contentOffset - Calculated offsets indicating where main content
 *   should begin to avoid being obscured by the overlay element.
 * @property {number} contentOffset.top - Pixels to offset from the top
 * @property {number} contentOffset.bottom - Pixels to offset from the bottom
 * @property {number} contentOffset.left - Pixels to offset from the left
 * @property {number} contentOffset.right - Pixels to offset from the right
 */
export interface DomPresenceResult {
    present: boolean;
    rect: ElementRect | null;
    position: OverlayPosition;
    contentOffset: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

/**
 * Default result returned when no element is present.
 * @internal
 */
const DEFAULT_RESULT: DomPresenceResult = {
    present: false,
    rect: null,
    position: null,
    contentOffset: {top: 0, bottom: 0, left: 0, right: 0},
};

/**
 * Determines the position of an element on screen based on its bounding rect.
 *
 * The algorithm prioritizes edge detection:
 * 1. For full-width elements (≥90% viewport width): checks top/bottom edges
 * 2. For full-height elements (≥90% viewport height): checks left/right edges
 * 3. For smaller elements: checks proximity to any edge (within 10px threshold)
 * 4. Falls back to 'center' if not near any edge
 *
 * @param {DOMRect} rect - The element's bounding client rect
 * @returns {OverlayPosition} The detected position ('top', 'bottom', 'left', 'right', 'center')
 *
 * @example
 * // Full-width bar at top of page
 * determinePosition({ top: 0, bottom: 50, left: 0, right: 1920, width: 1920, height: 50 })
 * // Returns: 'top'
 *
 * @internal
 */
function determinePosition(rect: DOMRect): OverlayPosition {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if element spans full width (likely top or bottom bar)
    const isFullWidth = rect.width >= viewportWidth * 0.9;
    // Check if element spans full height (likely left or right sidebar)
    const isFullHeight = rect.height >= viewportHeight * 0.9;

    if (isFullWidth) {
        if (rect.top <= 10) return 'top';
        if (rect.bottom >= viewportHeight - 10) return 'bottom';
    }

    if (isFullHeight) {
        if (rect.left <= 10) return 'left';
        if (rect.right >= viewportWidth - 10) return 'right';
    }

    // Check edges for smaller elements
    if (rect.top <= 10) return 'top';
    if (rect.bottom >= viewportHeight - 10) return 'bottom';
    if (rect.left <= 10) return 'left';
    if (rect.right >= viewportWidth - 10) return 'right';

    return 'center';
}

/**
 * Calculates the content offset based on the overlay's position and dimensions.
 *
 * The content offset represents the space that should be reserved for the overlay,
 * allowing other UI elements to position themselves without being obscured.
 *
 * @param {DOMRect} rect - The element's bounding client rect
 * @param {OverlayPosition} position - The detected position of the overlay
 * @returns {DomPresenceResult['contentOffset']} Object with top/bottom/left/right offsets in pixels
 *
 * @example
 * // Top bar with 50px height
 * calculateContentOffset({ height: 50, ... }, 'top')
 * // Returns: { top: 50, bottom: 0, left: 0, right: 0 }
 *
 * @internal
 */
function calculateContentOffset(
    rect: DOMRect,
    position: OverlayPosition,
): DomPresenceResult['contentOffset'] {
    const offset = {top: 0, bottom: 0, left: 0, right: 0};

    switch (position) {
        case 'top':
            offset.top = rect.height;
            break;
        case 'bottom':
            offset.bottom = rect.height;
            break;
        case 'left':
            offset.left = rect.width;
            break;
        case 'right':
            offset.right = rect.width;
            break;
    }

    return offset;
}

/**
 * Deep comparison for DomPresenceResult to avoid unnecessary re-renders.
 *
 * Compares all properties including nested rect and contentOffset values selector,
 *
 * @param {DomPresenceResult} a - First result to compare
 * @param {DomPresenceResult} b - Second result to compare
 * @returns {boolean} True if results are equal, false otherwise
 *
 * @internal
 */
function resultsEqual(a: DomPresenceResult, b: DomPresenceResult): boolean {
    if (a.present !== b.present || a.position !== b.position) return false;
    if (a.rect === null && b.rect === null) return true;
    if (a.rect === null || b.rect === null) return false;
    return (
        a.rect.height === b.rect.height &&
        a.rect.width === b.rect.width &&
        a.rect.top === b.rect.top &&
        a.rect.bottom === b.rect.bottom &&
        a.rect.left === b.rect.left &&
        a.rect.right === b.rect.right &&
        a.contentOffset.top === b.contentOffset.top &&
        a.contentOffset.bottom === b.contentOffset.bottom &&
        a.contentOffset.left === b.contentOffset.left &&
        a.contentOffset.right === b.contentOffset.right
    );
}

/**
 * React hook that observes DOM changes and returns comprehensive presence information.
 *
 * This hook provides a robust solution for tracking DOM elements that may be:
 * - Dynamically injected (e.g., third-party scripts, lazy-loaded content)
 * - iFrames that need validation (e.g., checking contentWindow availability)
 * - Elements that change size/position (e.g., responsive overlays)
 *
 * ## Observation Strategies
 *
 * The hook employs multiple observation strategies for maximum reliability:
 *
 * 1. **MutationObserver**: Watches for DOM tree changes (additions, removals, attribute changes)
 * 2. **Window load event**: Catches elements injected after initial render but before full page load
 * 3. **Window resize event**: Updates rect/position when viewport changes
 * 4. **Polling fallback**: Optional interval-based checking for edge cases
 *
 * ## Performance Considerations
 *
 * - Updates are batched using `requestAnimationFrame` to prevent layout thrashing
 * - Deep equality comparison prevents unnecessary re-renders
 * - Cleanup is handled automatically on unmount
 *
 * @param {string} selector - CSS selector to find the target element
 * @param {DomPresenceOptions} [options] - Configuration options
 * @param {ParentNode | Document} [options.root] - Root element to search within (default: document)
 * @param {(el: Element | null) => boolean} [options.check] - Custom validation function
 * @param {number} [options.pollMs=0] - Polling interval in ms (0 = disabled)
 *
 * @returns {DomPresenceResult} Object containing presence state, rect, position, and content offset
 *
 * @example
 * // Basic usage - detect if an element exists
 * function MyComponent() {
 *   const { present } = useDomPresence('.my-element');
 *   return <div>{present ? 'Element found!' : 'Not found'}</div>;
 * }
 *
 * @example
 * // With iFrame validation - ensure contentWindow is available
 * function IFrameAwareComponent() {
 *   const result = useDomPresence('iframe#my-frame', {
 *     check: (el) => {
 *       const iframe = el as HTMLIFrameElement | null;
 *       return !!(iframe && iframe.contentWindow);
 *     },
 *     pollMs: 1000, // Poll every second for cross-origin iFrames
 *   });
 *
 *   if (result.present) {
 *     console.log(`iFrame is ${result.position}, offset top: ${result.contentOffset.top}px`);
 *   }
 * }
 *
 * @example
 * // Adjust UI based on overlay position
 * function AdaptiveLayout() {
 *   const overlay = useDomPresence('.toolbar');

 *   return (
 *     <main style={{
 *       paddingTop: overlay.contentOffset.top,
 *       paddingBottom: overlay.contentOffset.bottom,
 *     }}>
 *       Content that avoids the toolbar
 *     </main>
 *   );
 * }
 */
function useDomPresence(
    selector: string,
    options?: DomPresenceOptions,
): DomPresenceResult {
    const {root, check, pollMs = 0} = options || {};

    const compute = React.useCallback((): DomPresenceResult => {
        const scope: ParentNode | Document = root ?? document;
        const el = (scope as Document | ParentNode).querySelector?.(selector) ?? null;

        // Check if element passes validation
        const isValid = check ? check(el) : !!el;
        if (!isValid || !el) {
            return DEFAULT_RESULT;
        }

        const domRect = el.getBoundingClientRect();
        const position = determinePosition(domRect);
        const contentOffset = calculateContentOffset(domRect, position);

        return {
            present: true,
            rect: {
                height: domRect.height,
                width: domRect.width,
                top: domRect.top,
                bottom: domRect.bottom,
                left: domRect.left,
                right: domRect.right,
            },
            position,
            contentOffset,
        };
    }, [root, selector, check]);

    const [result, setResult] = React.useState<DomPresenceResult>(() => compute());

    React.useEffect(() => {
        let rafId: number | null = null;

        /**
         * Schedules a recomputation on the next animation frame.
         * Cancels any pending computation to prevent stacking.
         */
        const schedule = () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const next = compute();
                setResult((prev) => (resultsEqual(prev, next) ? prev : next));
            });
        };

        // Set up MutationObserver on the target root
        const target: Node = (root as Node) ?? document.documentElement;
        const observer = new MutationObserver(schedule);
        observer.observe(target, {childList: true, subtree: true, attributes: true});

        // Initial check and window load (covers late injections)
        schedule();
        window.addEventListener('load', schedule);
        window.addEventListener('resize', schedule);

        // Optional polling fallback (for DOM changes outside MutationObserver scope)
        let pollId: number | null = null;
        if (pollMs && pollMs > 0) {
            pollId = window.setInterval(schedule, pollMs);
        }

        return () => {
            observer.disconnect();
            if (rafId != null) cancelAnimationFrame(rafId);
            if (pollId != null) clearInterval(pollId);
            window.removeEventListener('load', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [compute, root, pollMs]);

    return result;
}

/**
 * Configuration options for the useOverlayResistant hook.
 * Matches the OverlayConfig interface from types.ts.
 *
 * @interface UseOverlayResistantConfig
 */
export interface UseOverlayResistantConfig {
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
        position: 'top' | 'bottom' | 'left' | 'right';

        /**
         * The offset value in pixels.
         */
        pixels: number;
    };
}

/**
 * Result object returned by the useOverlayResistant hook.
 *
 * This interface provides a simplified view focused on overlay dimensions
 * and positioning for generic overlay/toolbars.
 *
 * @interface OverlayInfo
 * @property {boolean} present - Whether the overlay element is currently visible
 * @property {number} height - Height of the overlay in pixels (0 if not present)
 * @property {number} width - Width of the overlay in pixels (0 if not present)
 * @property {OverlayPosition} position - Position of the overlay ('top', 'bottom', etc.)
 * @property {Object} contentOffset - Space to reserve for the overlay
 * @property {number} contentOffset.top - Offset from top in pixels
 * @property {number} contentOffset.bottom - Offset from bottom in pixels
 * @property {number} contentOffset.left - Offset from left in pixels
 * @property {number} contentOffset.right - Offset from right in pixels
 * @property {boolean} isManualOffset - Whether the offset is from manual configuration
 */
export interface OverlayInfo {
    present: boolean;
    height: number;
    width: number;
    position: OverlayPosition;
    contentOffset: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    /** True if the offset is from manual configuration rather than auto-detection */
    isManualOffset: boolean;
}

/**
 * React hook that detects and tracks overlay elements (e.g., preview bars, toolbars).
 *
 * This hook is designed for handling overlays like preview bars or admin toolbars.
 * It provides information about the overlay's presence, dimensions, and position
 * to allow UI components to adjust their layout accordingly.
 *
 * ## Features
 *
 * - **Configurable Selector**: Detect any overlay element via CSS selector
 * - **iFrame Validation**: Optionally validates iFrame's `contentWindow` availability
 * - **Resilient Polling**: Configurable polling interval for cross-origin iFrames
 * - **Position Detection**: Automatically detects overlay position (top/bottom/left/right)
 * - **Manual Override**: Supports manual offset for cases where auto-detection fails
 * - **Content Offset Calculation**: Provides ready-to-use offset values
 *
 * ## Manual Offset
 *
 * For cross-origin iFrames that fill the entire viewport but have smaller internal
 * content (e.g., a 50px toolbar inside a full-screen iFrame), use `manualOffset`.
 *
 * **Important**: The `manualOffset` is only applied when the element matching the
 * `selector` is actually present in the DOM. The hook always observes the selector
 * via MutationObserver, so the offset will automatically appear/disappear when
 * the element is added/removed.
 *
 * ```tsx
 * // Applies 50px offset only when the element matching the selector exists
 * useOverlayResistant({
 *   selector: 'iframe#my-overlay',
 *   manualOffset: { position: 'top', pixels: 50 }
 * })
 * ```
 *
 * @param {UseOverlayResistantConfig} [config] - Configuration options
 * @returns {OverlayInfo} Object with presence, dimensions, position, and content offset
 *
 * @example
 * // Custom selector
 * const toolbar = useOverlayResistant({
 *   selector: '.admin-toolbar',
 *   validateIframe: false
 * });
 *
 * @example
 * // Manual offset for cross-origin iFrame with 50px internal toolbar
 * const overlay = useOverlayResistant({
 *   manualOffset: { position: 'top', pixels: 50 }
 * });
 *
 * @example
 * // Disable overlay detection entirely
 * const noOverlay = useOverlayResistant({ selector: null });
 *
 * @example
 * // Full sidebar positioning with config
 * function DQMSidebarContainer({ overlayConfig }) {
 *   const overlay = useOverlayResistant(overlayConfig);
 *
 *   return (
 *     <aside
 *       style={{
 *         position: 'fixed',
 *         top: overlay.contentOffset.top,
 *         right: 0,
 *         bottom: overlay.contentOffset.bottom,
 *         height: `calc(100vh - ${overlay.contentOffset.top + overlay.contentOffset.bottom}px)`,
 *       }}
 *     >
 *       <DQMSidebar />
 *     </aside>
 *   );
 * }
 */
export const useOverlayResistant = (config?: UseOverlayResistantConfig): OverlayInfo => {
    const {
        selector,
        validateIframe = true,
        pollMs = 1000,
        manualOffset,
    } = config || {};

    // Determine if we should observe the DOM (valid selector provided)
    const shouldObserve = selector != null && selector !== '';

    // Build check function for iFrame validation
    const checkFn = React.useCallback((el: Element | null): boolean => {
        if (!el) return false;
        // If validateIframe is enabled and element is an iframe, check contentWindow
        if (validateIframe && el.tagName.toLowerCase() === 'iframe') {
            const ifr = el as HTMLIFrameElement;
            return !!(ifr.contentWindow);
        }
        return true;
    }, [validateIframe]);

    // Always observe the DOM if we have a valid selector (even with manualOffset)
    const domResult = useDomPresence(
        shouldObserve ? selector! : '__disabled__',
        shouldObserve ? {check: checkFn, pollMs} : {pollMs: 0}
    );

    // If observation is disabled (no selector), return default "not present" state
    if (!shouldObserve) {
        return {
            present: false,
            height: 0,
            width: 0,
            position: null,
            contentOffset: {top: 0, bottom: 0, left: 0, right: 0},
            isManualOffset: false,
        };
    }

    // If element is not present, return "not present" regardless of manualOffset
    if (!domResult.present) {
        return {
            present: false,
            height: 0,
            width: 0,
            position: null,
            contentOffset: {top: 0, bottom: 0, left: 0, right: 0},
            isManualOffset: false,
        };
    }

    // Element is present - if manualOffset is configured, use it for offsets
    if (manualOffset) {
        const contentOffset = {top: 0, bottom: 0, left: 0, right: 0};
        contentOffset[manualOffset.position] = manualOffset.pixels;

        return {
            present: true,
            height: manualOffset.position === 'top' || manualOffset.position === 'bottom' ? manualOffset.pixels : 0,
            width: manualOffset.position === 'left' || manualOffset.position === 'right' ? manualOffset.pixels : 0,
            position: manualOffset.position,
            contentOffset,
            isManualOffset: true,
        };
    }

    // Return auto-detected result
    return {
        present: domResult.present,
        height: domResult.rect?.height ?? 0,
        width: domResult.rect?.width ?? 0,
        position: domResult.position,
        contentOffset: domResult.contentOffset,
        isManualOffset: false,
    };
};