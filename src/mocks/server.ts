/**
 * MSW Server Setup
 *
 * Initialize MSW for Node.js testing (Vitest, Jest, etc.).
 * Import and use in test setup files.
 */
import { setupServer } from 'msw/node';
import { handlers, resetMockState } from './handlers';

/**
 * MSW server instance for Node.js tests
 */
export const server = setupServer(...handlers);

/**
 * Setup helpers for test frameworks
 *
 * @example
 * ```ts
 * // In vitest.setup.ts or jest.setup.ts
 * import { server } from './src/mocks/server';
 *
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 * afterEach(() => {
 *   server.resetHandlers();
 *   resetMockState();
 * });
 * afterAll(() => server.close());
 * ```
 */

export { resetMockState };
export default server;
