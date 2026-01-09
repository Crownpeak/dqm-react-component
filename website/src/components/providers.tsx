'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

// Dynamischer Base Path für GitHub Pages
const getBasePath = () => {
  if (typeof window === 'undefined') return '';
  // Auf GitHub Pages: /dqm-react-component/, lokal: /
  const path = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return path.endsWith('/') ? path : `${path}/`;
};

/**
 * Hook to control MSW lifecycle based on sidebar open state.
 * MSW starts when sidebar opens, and resets completely when sidebar closes.
 */
export function useMSW(isOpen: boolean) {
  const [isMswReady, setIsMswReady] = useState(false);
  const workerRef = useRef<Awaited<typeof import('@/mocks/browser')>['worker'] | null>(null);
  const isInitializedRef = useRef(false);

  const startMSW = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsMswReady(true);
      return;
    }

    const basePath = getBasePath();
    const serviceWorkerUrl = `${basePath}mockServiceWorker.js`;
    const scope = basePath || '/';

    try {
      const { worker } = await import('@/mocks/browser');
      workerRef.current = worker;

      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
        serviceWorker: {
          url: serviceWorkerUrl,
          options: {
            scope: scope,
          },
        },
        findWorker: (scriptURL) => scriptURL.includes('mockServiceWorker'),
      });

      isInitializedRef.current = true;
      setIsMswReady(true);
      console.log('[MSW] Mock Service Worker gestartet');
    } catch (error) {
      console.error('[MSW] Fehler beim Starten des Mock Service Workers:', error);
      // Bei Fehler trotzdem bereit melden
      setIsMswReady(true);
    }
  }, []);

  const stopMSW = useCallback(async () => {
    if (workerRef.current && isInitializedRef.current) {
      try {
        workerRef.current.stop();
        workerRef.current = null;
        isInitializedRef.current = false;
        setIsMswReady(false);
        console.log('[MSW] Mock Service Worker gestoppt und zurückgesetzt');
      } catch (error) {
        console.error('[MSW] Fehler beim Stoppen des Mock Service Workers:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isInitializedRef.current) {
      // Sidebar wird geöffnet -> MSW starten
      startMSW();
    } else if (!isOpen && isInitializedRef.current) {
      // Sidebar wird geschlossen -> MSW komplett stoppen und zurücksetzen
      stopMSW();
    }
  }, [isOpen, startMSW, stopMSW]);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.stop();
      }
    };
  }, []);

  return { isMswReady, isInitialized: isInitializedRef.current };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </Provider>
  );
}
