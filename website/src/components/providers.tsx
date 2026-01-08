'use client';

import { useEffect, useState, useRef } from 'react';
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

function MSWProvider({ children }: { children: React.ReactNode }) {
  const [isMswReady, setIsMswReady] = useState(false);
  const workerRef = useRef<Awaited<typeof import('@/mocks/browser')>['worker'] | null>(null);

  useEffect(() => {
    async function initMSW() {
      if (typeof window === 'undefined') {
        setIsMswReady(true);
        return;
      }

      const basePath = getBasePath();
      const serviceWorkerUrl = `${basePath}mockServiceWorker.js`;
      const scope = basePath || '/';

      try {
        // Prüfe ob Service Worker bereits registriert ist
        const existingRegistration = await navigator.serviceWorker.getRegistration(serviceWorkerUrl);
        
        if (existingRegistration?.active) {
          console.log('[MSW] Service Worker bereits aktiv, verwende bestehende Registrierung');
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
          
          setIsMswReady(true);
          return;
        }

        // Neue Registrierung
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

        setIsMswReady(true);
        console.log('[MSW] Mock Service Worker gestartet');
      } catch (error) {
        console.error('[MSW] Fehler beim Starten des Mock Service Workers:', error);
        // Bei Fehler trotzdem rendern, damit die App nicht blockiert
        setIsMswReady(true);
      }
    }

    initMSW();

    // Cleanup nur bei echtem Page-Unload, nicht bei Hot-Reload
    const handleBeforeUnload = () => {
      workerRef.current?.stop();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Blockiere Rendering bis MSW bereit ist
  if (!isMswReady) {
    return null;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          {children}
        </I18nextProvider>
      </Provider>
    </MSWProvider>
  );
}
