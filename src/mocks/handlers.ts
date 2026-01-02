/**
 * MSW Handlers for DQM API
 *
 * Mock Service Worker handlers for testing DQM API interactions.
 */
import { http, HttpResponse, delay } from 'msw';
import type { Checkpoint } from '../types';

const DEFAULT_API_ENDPOINT = 'https://api.crownpeak.net/dqm-cms/v1';

/** Mock checkpoint data */
export const mockCheckpoints: Checkpoint[] = [
  {
    colors: { bg: '#fee2e2', text: '#dc2626' },
    id: 'ck-001',
    name: 'Missing Alt Text',
    description: 'Images should have alternative text for accessibility.',
    reference: 'https://www.w3.org/WAI/tutorials/images/',
    number: 1,
    categoryNumber: 1,
    category: 'Accessibility',
    priority: true,
    failed: true,
    topics: ['accessibility', 'images'],
    canHighlight: { page: true, source: true },
    restricted: false,
    checkpointType: {
      name: 'accessibility',
      modifiedBy: 'system',
      modified: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  },
  {
    colors: { bg: '#fef3c7', text: '#d97706' },
    id: 'ck-002',
    name: 'Missing Page Title',
    description: 'Every page should have a unique and descriptive title.',
    reference: 'https://www.w3.org/WAI/WCAG21/quickref/#page-titled',
    number: 2,
    categoryNumber: 2,
    category: 'SEO',
    priority: false,
    failed: true,
    topics: ['seo', 'metadata'],
    canHighlight: { page: true, source: true },
    restricted: false,
    checkpointType: {
      name: 'seo',
      modifiedBy: 'system',
      modified: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  },
  {
    colors: { bg: '#dbeafe', text: '#2563eb' },
    id: 'ck-003',
    name: 'Low Contrast Text',
    description: 'Text should have sufficient contrast against its background.',
    reference: 'https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum',
    number: 3,
    categoryNumber: 1,
    category: 'Accessibility',
    priority: true,
    failed: true,
    topics: ['accessibility', 'design'],
    canHighlight: { page: true, source: false },
    restricted: false,
    checkpointType: {
      name: 'accessibility',
      modifiedBy: 'system',
      modified: new Date().toISOString(),
    },
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  },
];

/** Mock asset IDs for tracking analysis state */
const analysisStates = new Map<string, { state: 'analyzing' | 'completed' | 'error'; pollCount: number }>();

/** Generate a random asset ID */
function generateAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * MSW handlers for DQM API endpoints
 */
export const handlers = [
  /**
   * POST /assets - Create new asset for analysis
   */
  http.post(`${DEFAULT_API_ENDPOINT}/assets`, async ({ request }) => {
    await delay(500); // Simulate network delay

    // Check for API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return HttpResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as { html?: string; websiteId?: string };
    if (!body.html || !body.websiteId) {
      return HttpResponse.json(
        { error: 'Missing required fields: html, websiteId' },
        { status: 400 }
      );
    }

    // Generate asset ID and track analysis state
    const assetId = generateAssetId();
    analysisStates.set(assetId, { state: 'analyzing', pollCount: 0 });

    return HttpResponse.json({ assetId });
  }),

  /**
   * GET /assets/:assetId - Get asset analysis status
   */
  http.get(`${DEFAULT_API_ENDPOINT}/assets/:assetId`, async ({ params }) => {
    await delay(300);

    const { assetId } = params;
    const state = analysisStates.get(assetId as string);

    if (!state) {
      return HttpResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Simulate analysis completing after 3 polls
    state.pollCount++;
    if (state.pollCount >= 3) {
      state.state = 'completed';
    }

    // Return response based on state
    if (state.state === 'completed') {
      return HttpResponse.json({
        assetId,
        analysisState: 'completed',
        created: new Date().toISOString(),
        siteName: 'Test Site',
        totalCheckpoints: 10,
        totalErrors: mockCheckpoints.length,
        checkpoints: mockCheckpoints,
      });
    }

    return HttpResponse.json({
      assetId,
      analysisState: state.state,
      created: new Date().toISOString(),
      siteName: 'Test Site',
      totalCheckpoints: 0,
      totalErrors: 0,
      checkpoints: [],
    });
  }),

  /**
   * GET /assets/:assetId/pagehighlight/:checkpointId - Get highlight for specific checkpoint
   */
  http.get(
    `${DEFAULT_API_ENDPOINT}/assets/:assetId/pagehighlight/:checkpointId`,
    async ({ params }) => {
      await delay(200);

      const { checkpointId } = params;

      // Generate mock highlighted HTML
      const highlightedHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Page</title></head>
        <body>
          <div class="astHighlightFull" data-checkpoint-id="${checkpointId}">
            <p>This is highlighted content for checkpoint ${checkpointId}</p>
          </div>
          <div class="astHighlightStart">Start of error</div>
          <div class="astHighlightMiddle">Middle content</div>
          <div class="astHighlightEnd">End of error</div>
        </body>
        </html>
      `;

      return HttpResponse.json({ html: highlightedHtml });
    }
  ),

  /**
   * GET /assets/:assetId/pagehighlight/all - Get all highlights
   */
  http.get(
    `${DEFAULT_API_ENDPOINT}/assets/:assetId/pagehighlight/all`,
    async () => {
      await delay(200);

      // Generate mock highlighted HTML with all errors
      const highlightedHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Page</title></head>
        <body>
          ${mockCheckpoints.map((cp) => `
            <div class="astHighlightFull astError" data-checkpoint-id="${cp.id}">
              <p>Error: ${cp.name}</p>
            </div>
          `).join('\n')}
        </body>
        </html>
      `;

      return HttpResponse.json({ html: highlightedHtml });
    }
  ),
];

/**
 * Error simulation handlers (import separately for error testing)
 */
export const errorHandlers = [
  http.post(`${DEFAULT_API_ENDPOINT}/assets`, async () => {
    await delay(500);
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${DEFAULT_API_ENDPOINT}/assets/:assetId`, async () => {
    await delay(300);
    return HttpResponse.json(
      { error: 'Analysis failed', analysisState: 'error' },
      { status: 500 }
    );
  }),
];

/**
 * Network failure handlers (import separately for offline testing)
 */
export const networkErrorHandlers = [
  http.post(`${DEFAULT_API_ENDPOINT}/assets`, () => {
    return HttpResponse.error();
  }),

  http.get(`${DEFAULT_API_ENDPOINT}/assets/:assetId`, () => {
    return HttpResponse.error();
  }),
];

/**
 * Slow response handlers (import separately for timeout testing)
 */
export const slowHandlers = [
  http.post(`${DEFAULT_API_ENDPOINT}/assets`, async () => {
    await delay(30000); // 30 second delay
    return HttpResponse.json({ assetId: generateAssetId() });
  }),
];

/**
 * Reset mock state (call between tests)
 */
export function resetMockState(): void {
  analysisStates.clear();
}

/**
 * Helper to simulate immediate analysis completion
 */
export function simulateImmediateCompletion(assetId: string): void {
  analysisStates.set(assetId, { state: 'completed', pollCount: 99 });
}

/**
 * Helper to simulate analysis error
 */
export function simulateError(assetId: string): void {
  analysisStates.set(assetId, { state: 'error', pollCount: 0 });
}
