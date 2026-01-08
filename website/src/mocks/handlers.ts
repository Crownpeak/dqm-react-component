import { http, HttpResponse, delay } from 'msw';

// Globale Asset-ID für konsistente Referenzen (32 Zeichen Hex wie echte DQM)
let currentAssetId = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

// Mock DQM API Checkpoints im echten DQM-Format
const mockCheckpoints = [
  // Content presentation (Category 1)
  {
    id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    name: 'All pages should contain headings',
    description: 'Using HTML heading tags to indicate page structure is helpful for users of assistive technologies and for SEO. See WCAG 2.0, 1.3.1.',
    category: 'Content presentation',
    categoryNumber: 1,
    number: 1,
    reference: '1.1',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'SEO'],
    canHighlight: { page: true, source: true },
    checkpointType: {
      name: 'Standard',
      modifiedBy: 'System',
      modified: '2024-01-15T10:00:00Z'
    },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    name: 'Headings should be hierarchical',
    description: 'Heading levels should only increase by one. For example, an H4 should not follow an H2. See WCAG 2.0, 1.3.1.',
    category: 'Content presentation',
    categoryNumber: 1,
    number: 2,
    reference: '1.2',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    name: 'Pages should have a single H1 heading',
    description: 'Best practice recommends that each page has exactly one H1 heading that describes the main content.',
    category: 'Content presentation',
    categoryNumber: 1,
    number: 3,
    reference: '1.3',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['SEO', 'Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Navigation (Category 2)
  {
    id: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    name: 'Skip navigation link should be present',
    description: 'A skip link allows keyboard users to bypass repetitive navigation. See WCAG 2.0, 2.4.1.',
    category: 'Navigation',
    categoryNumber: 2,
    number: 1,
    reference: '2.1',
    priority: true,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    name: 'Navigation should be consistent',
    description: 'Navigation mechanisms that are repeated on multiple pages should occur in the same relative order. See WCAG 2.0, 3.2.3.',
    category: 'Navigation',
    categoryNumber: 2,
    number: 2,
    reference: '2.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'Usability'],
    canHighlight: { page: false, source: false },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Images & Media (Category 3)
  {
    id: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    name: 'Images should have alt text',
    description: 'All images must have alternative text that describes their content or function. See WCAG 2.0, 1.1.1.',
    category: 'Images & Media',
    categoryNumber: 3,
    number: 1,
    reference: '3.1',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'SEO'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    name: 'Alt text should not be too long',
    description: 'Alternative text should be concise (under 125 characters). Longer descriptions should use longdesc or aria-describedby.',
    category: 'Images & Media',
    categoryNumber: 3,
    number: 2,
    reference: '3.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
    name: 'Decorative images should have empty alt',
    description: 'Images that are purely decorative should have alt="" to be ignored by screen readers.',
    category: 'Images & Media',
    categoryNumber: 3,
    number: 3,
    reference: '3.3',
    priority: false,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Forms (Category 4)
  {
    id: 'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    name: 'Form inputs should have labels',
    description: 'All form inputs must have associated label elements or aria-label attributes. See WCAG 2.0, 1.3.1.',
    category: 'Forms',
    categoryNumber: 4,
    number: 1,
    reference: '4.1',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    name: 'Required fields should be indicated',
    description: 'Required form fields should be clearly indicated both visually and programmatically.',
    category: 'Forms',
    categoryNumber: 4,
    number: 2,
    reference: '4.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'Usability'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Links (Category 5)
  {
    id: 'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    name: 'Link text should be descriptive',
    description: 'Links should have descriptive text that makes sense out of context. Avoid "click here" or "read more". See WCAG 2.0, 2.4.4.',
    category: 'Links',
    categoryNumber: 5,
    number: 1,
    reference: '5.1',
    priority: true,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Accessibility', 'SEO'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    name: 'Links should not open in new windows without warning',
    description: 'If a link opens in a new window/tab, users should be warned (e.g., "opens in new window").',
    category: 'Links',
    categoryNumber: 5,
    number: 2,
    reference: '5.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'Usability'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    name: 'No broken internal links',
    description: 'All internal links should resolve to valid pages.',
    category: 'Links',
    categoryNumber: 5,
    number: 3,
    reference: '5.3',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['SEO', 'Usability'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Color & Contrast (Category 6)
  {
    id: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    name: 'Text should have sufficient color contrast',
    description: 'Text must have a contrast ratio of at least 4.5:1 against its background. See WCAG 2.0, 1.4.3.',
    category: 'Color & Contrast',
    categoryNumber: 6,
    number: 1,
    reference: '6.1',
    priority: true,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: false },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    name: 'Color should not be the only means of conveying information',
    description: 'Information conveyed by color should also be available through other means. See WCAG 2.0, 1.4.1.',
    category: 'Color & Contrast',
    categoryNumber: 6,
    number: 2,
    reference: '6.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: false, source: false },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Keyboard (Category 7)
  {
    id: 'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    name: 'All functionality should be keyboard accessible',
    description: 'All interactive elements must be operable via keyboard. See WCAG 2.0, 2.1.1.',
    category: 'Keyboard',
    categoryNumber: 7,
    number: 1,
    reference: '7.1',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    name: 'Focus indicator should be visible',
    description: 'Interactive elements must have a visible focus indicator. See WCAG 2.0, 2.4.7.',
    category: 'Keyboard',
    categoryNumber: 7,
    number: 2,
    reference: '7.2',
    priority: true,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    name: 'Focus order should be logical',
    description: 'Tab order should follow a logical sequence. See WCAG 2.0, 2.4.3.',
    category: 'Keyboard',
    categoryNumber: 7,
    number: 3,
    reference: '7.3',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Accessibility'],
    canHighlight: { page: false, source: false },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // SEO (Category 8)
  {
    id: 'a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    name: 'Page should have a title',
    description: 'Every page must have a descriptive title element in the head section.',
    category: 'SEO',
    categoryNumber: 8,
    number: 1,
    reference: '8.1',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['SEO', 'Accessibility'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    name: 'Meta description should be present',
    description: 'A meta description helps search engines understand page content and improves click-through rates.',
    category: 'SEO',
    categoryNumber: 8,
    number: 2,
    reference: '8.2',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['SEO'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    name: 'Canonical URL should be specified',
    description: 'A canonical URL prevents duplicate content issues and consolidates page authority.',
    category: 'SEO',
    categoryNumber: 8,
    number: 3,
    reference: '8.3',
    priority: false,
    failed: true, // FEHLER
    restricted: false,
    topics: ['SEO'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'd2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    name: 'Open Graph tags should be present',
    description: 'Open Graph meta tags improve how content appears when shared on social media.',
    category: 'SEO',
    categoryNumber: 8,
    number: 4,
    reference: '8.4',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['SEO'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // Performance (Category 9)
  {
    id: 'e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    name: 'Images should be optimized',
    description: 'Images should be compressed and use modern formats like WebP where supported.',
    category: 'Performance',
    categoryNumber: 9,
    number: 1,
    reference: '9.1',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Performance'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    name: 'Lazy loading should be used for below-fold images',
    description: 'Images below the initial viewport should use loading="lazy" to improve page load time.',
    category: 'Performance',
    categoryNumber: 9,
    number: 2,
    reference: '9.2',
    priority: false,
    failed: true, // FEHLER
    restricted: false,
    topics: ['Performance'],
    canHighlight: { page: true, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },

  // HTML Quality (Category 10)
  {
    id: 'a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    name: 'HTML should be valid',
    description: 'The page should pass W3C HTML validation without critical errors.',
    category: 'HTML Quality',
    categoryNumber: 10,
    number: 1,
    reference: '10.1',
    priority: false,
    failed: false,
    restricted: false,
    topics: ['Quality'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
  {
    id: 'b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    name: 'Language attribute should be specified',
    description: 'The html element should have a lang attribute specifying the page language.',
    category: 'HTML Quality',
    categoryNumber: 10,
    number: 2,
    reference: '10.2',
    priority: true,
    failed: false,
    restricted: false,
    topics: ['Accessibility', 'Quality'],
    canHighlight: { page: false, source: true },
    checkpointType: { name: 'Standard', modifiedBy: 'System', modified: '2024-01-15T10:00:00Z' },
    created: '2023-01-01T00:00:00Z',
    modified: '2024-06-15T12:00:00Z'
  },
];

// Berechne Statistiken im echten DQM-Format
const calculateStats = () => {
  const totalErrors = mockCheckpoints.filter(c => c.failed).length;
  const totalCheckpoints = mockCheckpoints.length;
  
  return { totalCheckpoints, totalErrors };
};

export const handlers = [
  // ============================================
  // Auth Endpoints
  // ============================================
  
  http.post('*/auth/login', async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      sessionToken: 'mock-session-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }),

  http.get('*/auth/status', async () => {
    await delay(200);
    return HttpResponse.json({
      authenticated: true,
      sessionType: 'mock',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }),

  http.post('*/auth/logout', async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  http.get('*/auth/session', async () => {
    await delay(200);
    return HttpResponse.json({
      valid: true,
      websiteId: 'demo-website-id',
      sessionType: 'backend',
    });
  }),

  // ============================================
  // DQM Assets API - Echtes Format
  // ============================================

  // POST /dqm/assets - Create Asset
  http.post('*/dqm/assets', async () => {
    await delay(500);
    
    // 32 Zeichen Hex ID wie echte DQM
    currentAssetId = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return HttpResponse.json({
      assetId: currentAssetId,
      analysisState: 'analyzing',
    });
  }),

  // GET /dqm/assets/:assetId/status - Echtes DQM Response Format
  http.get('*/dqm/assets/:assetId/status', async () => {
    await delay(1000);
    
    const stats = calculateStats();
    
    return HttpResponse.json({
      assetId: currentAssetId,
      created: new Date().toISOString(),
      siteName: 'Demo Website',
      totalCheckpoints: stats.totalCheckpoints,
      totalErrors: stats.totalErrors,
      checkpoints: mockCheckpoints,
    });
  }),

  // GET /dqm/assets/:assetId/pagehighlight/all
  http.get('*/dqm/assets/:assetId/pagehighlight/all', async () => {
    await delay(300);
    
    return HttpResponse.text(`<!DOCTYPE html>
<html lang="de">
<head>
  <title>Demo Page - DQM Analysis</title>
  <style>
    .dqm-error { outline: 3px solid #ef4444 !important; background: rgba(239,68,68,0.1) !important; }
  </style>
</head>
<body>
  <header><h1>Demo-Seite</h1></header>
  <main>
    <p>Beispielinhalt für DQM-Analyse.</p>
    <a href="#" class="dqm-error" data-checkpoint="e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6">Klick hier</a>
    <button class="dqm-error" data-checkpoint="e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2">Button</button>
  </main>
</body>
</html>`);
  }),

  // GET /dqm/assets/:assetId/pagehighlight/:checkpointId
  http.get('*/dqm/assets/:assetId/pagehighlight/:checkpointId', async ({ params }) => {
    await delay(200);
    const checkpointId = params.checkpointId as string;
    const checkpoint = mockCheckpoints.find(c => c.id === checkpointId);
    
    return HttpResponse.text(`<!DOCTYPE html>
<html lang="de">
<head><title>${checkpoint?.name || 'Checkpoint'}</title></head>
<body>
  <div class="dqm-highlight" data-checkpoint="${checkpointId}">
    ${checkpoint?.description || 'Element'}
  </div>
</body>
</html>`);
  }),

  // ============================================
  // Crownpeak DQM API Direct
  // ============================================

  // GET /assets - für initiale Asset-Abfrage mit Query-Parametern
  http.get('https://api.crownpeak.net/dqm-cms/v1/assets', async () => {
    await delay(500);
    currentAssetId = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return HttpResponse.json({
      assetId: currentAssetId,
      analysisState: 'analyzing',
    });
  }),

  http.post('https://api.crownpeak.net/dqm-cms/v1/assets', async () => {
    await delay(500);
    currentAssetId = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return HttpResponse.json({
      assetId: currentAssetId,
      analysisState: 'analyzing',
    });
  }),

  http.get('https://api.crownpeak.net/dqm-cms/v1/assets/:assetId/status', async () => {
    await delay(800);
    const stats = calculateStats();
    return HttpResponse.json({
      assetId: currentAssetId,
      created: new Date().toISOString(),
      siteName: 'Demo Website',
      totalCheckpoints: stats.totalCheckpoints,
      totalErrors: stats.totalErrors,
      checkpoints: mockCheckpoints,
    });
  }),

  http.get('https://api.crownpeak.net/dqm-cms/v1/assets/:assetId/pagehighlight/*', async () => {
    await delay(200);
    return HttpResponse.text(`<!DOCTYPE html><html><body>Highlighted</body></html>`);
  }),

  http.all('https://api.crownpeak.net/dqm-cms/v1/*', async () => {
    await delay(300);
    const stats = calculateStats();
    return HttpResponse.json({
      assetId: currentAssetId,
      created: new Date().toISOString(),
      siteName: 'Demo Website',
      totalCheckpoints: stats.totalCheckpoints,
      totalErrors: stats.totalErrors,
      checkpoints: mockCheckpoints,
    });
  }),

  // Fallback
  http.all('*/dqm/*', async () => {
    await delay(300);
    const stats = calculateStats();
    return HttpResponse.json({
      assetId: currentAssetId,
      created: new Date().toISOString(),
      siteName: 'Demo Website',
      totalCheckpoints: stats.totalCheckpoints,
      totalErrors: stats.totalErrors,
      checkpoints: mockCheckpoints,
    });
  }),
];
