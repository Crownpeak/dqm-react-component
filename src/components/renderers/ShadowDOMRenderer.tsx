// Component to render HTML in Shadow DOM for style isolation
import React from "react";
import { logger } from "../../utils/logger";

export const ShadowDOMRenderer: React.FC<{
    html: string;
    onHighlightsFound?: (total: number) => void;
    currentHighlight?: number;
    shouldAutoScrollToFirst?: boolean;
    clickedIndicator: number;
    onVisibleHighlightChange?: (index: number) => void; // Passive: only for display, never triggers scroll
    scrollContainerRef?: React.RefObject<HTMLDivElement>; // The actual scrollable container
}> = ({
          html,
          onHighlightsFound,
          currentHighlight,
          shouldAutoScrollToFirst = false,
          onVisibleHighlightChange,
          clickedIndicator,
          scrollContainerRef
      }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const shadowRootRef = React.useRef<ShadowRoot | null>(null);
    const isProgrammaticScrollRef = React.useRef<boolean>(false);

    React.useEffect(() => {
        if (!containerRef.current) return;

        // Create shadow root if it doesn't exist
        if (!shadowRootRef.current) {
            try {
                shadowRootRef.current = containerRef.current.attachShadow({mode: 'open'});
            } catch (e) {
                logger.warn('Could not attach shadow DOM, falling back to regular DOM', e);
                // Fallback: render directly in container
                containerRef.current.innerHTML = html;
                return;
            }
        }

        // Render HTML in shadow DOM
        if (shadowRootRef.current) {
            shadowRootRef.current.innerHTML = html;

            // Find all highlighted elements (DQM uses these classes for error highlighting)
            const highlightSelectors = [
                '.astHighlightFull',
                '.astHighlightStart',
                '.astHighlightMiddle',
                '.astHighlightEnd',
                '.astError'
            ];

            const highlights = shadowRootRef.current.querySelectorAll(
                highlightSelectors.join(', ')
            );

            // Notify parent about total highlights
            if (onHighlightsFound) {
                onHighlightsFound(highlights.length);
            }

            // Set up Intersection Observer to PASSIVELY track visible highlights (NEVER triggers scrolling)
            if (highlights.length > 0 && onVisibleHighlightChange) {
                // Use the provided scroll container ref (contentBoxRef from parent)
                const scrollContainer = scrollContainerRef?.current;

                if (scrollContainer) {
                    const observerOptions = {
                        root: scrollContainer, // Now uses the actual scrollable container!
                        rootMargin: '-20% 0px -20% 0px', // Central 60% area of viewport
                        threshold: [0, 0.25, 0.5, 0.75, 1.0]
                    };

                    const visibleHighlights = new Map<Element, number>();

                    const observer = new IntersectionObserver((entries) => {
                        // Skip if this is a programmatic scroll (button click navigation)
                        if (isProgrammaticScrollRef.current) return;

                        entries.forEach((entry) => {
                            const highlightIndex = Array.from(highlights).indexOf(entry.target);

                            if (entry.isIntersecting && entry.intersectionRatio > 0) {
                                visibleHighlights.set(entry.target, highlightIndex);
                            } else {
                                visibleHighlights.delete(entry.target);
                            }
                        });

                        // Passively report which highlight is visible (ONLY FOR DISPLAY - does NOT change navigation state)
                        if (visibleHighlights.size > 0) {
                            const sortedVisible = Array.from(visibleHighlights.entries())
                                .sort((a, b) => a[1] - b[1]); // Sort by index

                            // Always report first visible element
                            const visibleIndex = sortedVisible[0][1];

                            // Passively report visible highlight (does NOT trigger navigation, only updates display)
                            onVisibleHighlightChange(visibleIndex + 1); // Convert to 1-based
                        }
                    }, observerOptions);

                    // Observe all highlights
                    highlights.forEach((highlight) => observer.observe(highlight));

                    // Cleanup observer
                    return () => {
                        observer.disconnect();
                    };
                }
            }
        }
    }, [html, onHighlightsFound, shouldAutoScrollToFirst, onVisibleHighlightChange, scrollContainerRef]);

    // Scroll to highlight when currentHighlight changes (user navigation via buttons)
    React.useEffect(() => {
        if (!shadowRootRef.current || !currentHighlight || currentHighlight === 0) return;

        const highlightSelectors = [
            '.astHighlightFull',
            '.astHighlightStart',
            '.astHighlightMiddle',
            '.astHighlightEnd',
            '.astError'
        ];

        const highlights = shadowRootRef.current.querySelectorAll(
            highlightSelectors.join(', ')
        );

        if (highlights.length === 0) return;

        const targetElement = highlights[currentHighlight - 1];
        if (targetElement) {
            // Disable observer during programmatic scroll
            isProgrammaticScrollRef.current = true;

            targetElement.scrollIntoView({behavior: 'smooth', block: 'center'});
            targetElement.classList.add('animate');

            setTimeout(() => {
                targetElement.classList.remove('animate');
            }, 800);

            // Re-enable observer after scroll animation completes AND update visibleHighlight
            setTimeout(() => {
                isProgrammaticScrollRef.current = false;

                // Immediately notify parent that this element is now visible
                // (sync visibleHighlight with currentHighlight after button navigation)
                if (onVisibleHighlightChange) {
                    onVisibleHighlightChange(currentHighlight);
                }
            }, 1000); // Wait for smooth scroll animation to complete
        }
    }, [currentHighlight, onVisibleHighlightChange, clickedIndicator]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                minHeight: '100px',
            }}
        />
    );
};