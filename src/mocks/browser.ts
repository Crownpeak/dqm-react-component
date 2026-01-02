/**
 * MSW Browser Setup
 *
 * Initialize MSW for browser-based testing and development.
 * Import and call `startMSW()` in your app entry point when mocking is needed.
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW worker instance for browser
 */
export const worker = setupWorker(...handlers);

/**
 * Start MSW in the browser
 *
 * @example
 * ```tsx
 * // In main.tsx or App.tsx for development
 * if (import.meta.env.DEV) {
 *   const { startMSW } = await import('./mocks/browser');
 *   await startMSW();
 * }
 * ```
 */
export async function startMSW(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
  console.info('[MSW] Mock Service Worker started');
}

/**
 * Stop MSW
 */
export function stopMSW(): void {
  worker.stop();
  console.info('[MSW] Mock Service Worker stopped');
}

export default worker;
