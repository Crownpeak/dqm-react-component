import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Browser Service Worker für API-Mocking
export const worker = setupWorker(...handlers);
