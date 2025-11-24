// Component to render HTML in iframe for full browser view with styles
import React from "react";

export const BrowserViewRenderer: React.FC<{
    html: string;
    currentHighlight?: number;
    onHighlightsFound?: (count: number) => void;
    clickedIndicator: number;
    onVisibleHighlightChange?: (index: number) => void; // Passive: only for display, never triggers scroll
}> = ({html, currentHighlight, onHighlightsFound, onVisibleHighlightChange, clickedIndicator}) => {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const isProgrammaticScrollRef = React.useRef<boolean>(false);

    React.useEffect(() => {
        if (!iframeRef.current) return;

        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) {
            console.warn('[DQM] Could not access iframe document');
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const documentElement = doc.documentElement;

        documentElement.getElementsByTagName('body')[0].style.overflow = 'auto'
        console.log('[DQM] Set iframe body overflow to auto');

        // Write the HTML content to the iframe
        iframeDoc.open();
        iframeDoc.write(documentElement.outerHTML);
        iframeDoc.close(); // Important: close to trigger load event

        // Apply styles to highlighted elements for better visibility
        const style = iframeDoc.createElement('style');
        style.textContent = `
      .astHighlightFull,
      .astHighlightStart,
      .astHighlightMiddle,
      .astHighlightEnd,
      .astError {
          background-color: rgba(255, 0, 0, 0.2) !important;
          outline: 2px solid #dc3545 !important;
          outline-offset: 2px !important;
      }

      .astHighlightFull.animate,
      .astHighlightStart.animate,
      .astHighlightMiddle.animate,
      .astHighlightEnd.animate,
      .astError.animate {
          animation: pulse 0.8s ease-in-out;
      }

      @keyframes pulse {
          0%, 100% {
              background-color: rgba(255, 0, 0, 0.2);
              outline-color: #dc3545;
          }
          50% {
              background-color: rgba(255, 0, 0, 0.5);
              outline-color: #ff6666;
          }
      }
    `;
        iframeDoc.head.appendChild(style);

        // Wait for iframe content to be fully loaded before setting up observer
        const setupHighlightsAndObserver = () => {
            const highlightSelectors = [
                '.astHighlightFull',
                '.astHighlightStart',
                '.astHighlightMiddle',
                '.astHighlightEnd',
                '.astError'
            ];
            const highlights = iframeDoc.querySelectorAll(highlightSelectors.join(', '));

            console.log('[DQM] Browser View - Found highlights:', highlights.length);

            // Count highlights and notify parent
            if (onHighlightsFound) {
                onHighlightsFound(highlights.length);
            }

            // Set up IntersectionObserver to PASSIVELY track visible highlights in iframe
            if (highlights.length > 0 && onVisibleHighlightChange && iframe.contentWindow) {
                const observerOptions: IntersectionObserverInit = {
                    // Use null to observe within the iframe's viewport
                    root: null,
                    rootMargin: '-20% 0px -20% 0px',
                    threshold: [0, 0.25, 0.5, 0.75, 1.0]
                };

                const visibleHighlights = new Map<Element, number>();

                // Create observer in iframe context (cast to any to access IntersectionObserver)
                const iframeWindow = iframe.contentWindow as any
                const IntersectionObserverConstructor = iframeWindow.IntersectionObserver as typeof IntersectionObserver;

                const observer = new IntersectionObserverConstructor((entries: IntersectionObserverEntry[]) => {
                    // Skip if this is a programmatic scroll (button click navigation)
                    if (isProgrammaticScrollRef.current) return;

                    entries.forEach((entry: IntersectionObserverEntry) => {
                        const highlightIndex = Array.from(highlights).indexOf(entry.target);

                        if (entry.isIntersecting && entry.intersectionRatio > 0) {
                            visibleHighlights.set(entry.target, highlightIndex);
                        } else {
                            visibleHighlights.delete(entry.target);
                        }
                    });

                    // Passively report which highlight is visible (ONLY FOR DISPLAY)
                    if (visibleHighlights.size > 0) {
                        const sortedVisible = Array.from(visibleHighlights.entries())
                            .sort((a, b) => a[1] - b[1]);

                        const visibleIndex = sortedVisible[0][1];
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
        };

        // Setup after a short delay to ensure DOM is ready
        const timeoutId = setTimeout(setupHighlightsAndObserver, 100);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [html, onHighlightsFound, onVisibleHighlightChange]);

    // Scroll to current highlight in iframe
    React.useEffect(() => {
        if (!iframeRef.current || !currentHighlight || currentHighlight === 0) return;

        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) return;

        const highlightSelectors = [
            '.astHighlightFull',
            '.astHighlightStart',
            '.astHighlightMiddle',
            '.astHighlightEnd',
            '.astError'
        ];

        const highlights = iframeDoc.querySelectorAll(highlightSelectors.join(', '));

        console.log('[DQM] iFrame scroll - currentHighlight:', currentHighlight, 'total highlights:', highlights.length);

        if (highlights.length === 0) {
            console.warn('[DQM] No highlights found in iframe');
            return;
        }

        const targetElement = highlights[currentHighlight - 1];
        if (targetElement) {
            console.log('[DQM] Scrolling to highlight', currentHighlight, 'in iframe');

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
        } else {
            console.warn('[DQM] Target element not found for highlight', currentHighlight);
        }
    }, [currentHighlight, onVisibleHighlightChange, clickedIndicator]);

    return (
        <>
            <iframe
                ref={iframeRef}
                title="Browser View"
                style={{
                    width: '100%',
                    height: '600px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
            {/*<div dangerouslySetInnerHTML={{__html: html}}></div>*/}
        </>
    );
};