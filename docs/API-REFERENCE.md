# API Reference

Complete TypeScript API documentation for `@crownpeak/dqm-react-component`.

## Table of Contents
- [Components](#components)
- [Configuration](#configuration)
- [Hooks](#hooks)
- [Types](#types)
- [Redux Store](#redux-store)
- [Utilities](#utilities)

## Components

### DQMSidebar

Main component for displaying DQM quality analysis in a sidebar.

```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

interface DQMSidebarProps {
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    config?: DQMConfig;
    onAuthSuccess?: (credentials: AuthCredentials) => void;
    onAuthError?: (error: Error) => void;
    debugHtml?: string; // DEBUG ONLY
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls sidebar visibility |
| `onOpen` | `() => void` | ✅ | Callback when sidebar opens |
| `onClose` | `() => void` | ✅ | Callback when sidebar closes |
| `config` | `DQMConfig` | ❌ | Configuration options (auth, AI, overlay) |
| `onAuthSuccess` | `(credentials) => void` | ❌ | Callback on successful authentication |
| `onAuthError` | `(error) => void` | ❌ | Callback on authentication error |
| `debugHtml` | `string` | ❌ | Custom HTML for testing (dev only) |

#### AuthCredentials

```typescript
interface AuthCredentials {
    apiKey: string;
    websiteId: string;
    sessionToken?: string;
    sessionType: 'direct' | 'backend';
}
```

#### Example

```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
    const [open, setOpen] = useState(false);

    return (
        <DQMSidebar
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            config={{
                websiteId: 'your-website-id',
                apiKey: 'your-api-key',
            }}
            onAuthSuccess={(credentials) => {
                console.log('Authenticated:', credentials.sessionType);
            }}
            onAuthError={(error) => {
                console.error('Auth failed:', error.message);
            }}
        />
    );
}
```

---

### ErrorBoundary

React Error Boundary for catching and displaying component errors.

```typescript
import { ErrorBoundary } from '@crownpeak/dqm-react-component';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    resetKeys?: unknown[];
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | ✅ | Child components to wrap |
| `resetKeys` | `unknown[]` | ❌ | Array of values - boundary resets when any value changes |

#### Example

```typescript
import { ErrorBoundary, DQMSidebar } from '@crownpeak/dqm-react-component';
import { useLocation } from 'react-router-dom';

function App() {
    const location = useLocation();

    return (
        <ErrorBoundary resetKeys={[location.pathname]}>
            <DQMSidebar
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            />
        </ErrorBoundary>
    );
}
```

---

## Configuration

### DQMConfig

Root configuration interface for DQM component.

```typescript
interface DQMConfig {
    // Authentication
    apiKey?: string;
    websiteId?: string;
    authBackendUrl?: string;
    oauth2Config?: OAuth2Config;
    
    // Storage & Behavior
    useLocalStorage?: boolean;      // Default: true
    disabled?: boolean;             // Default: false
    disableLogout?: boolean;        // Default: false
    apiEndpoint?: string;           // Default: Crownpeak API
    shadowDomMode?: boolean;        // Default: false
    
    // Features
    overlayConfig?: OverlayConfig;
    translation?: TranslationConfig;
    summary?: SummaryConfig;
}
```

#### Authentication Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `apiKey` | `string` | - | DQM API key (direct auth, highest priority) |
| `websiteId` | `string` | - | DQM Website ID (direct auth) |
| `authBackendUrl` | `string` | - | Backend server URL for OAuth2 or proxy auth |
| `oauth2Config` | `OAuth2Config` | - | OAuth2 configuration object |

#### Storage & Behavior Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `useLocalStorage` | `boolean` | `true` | Store credentials in localStorage |
| `disabled` | `boolean` | `false` | Disable DQM completely (shows "Permission Denied") |
| `disableLogout` | `boolean` | `false` | Hide logout button (host app manages session) |
| `apiEndpoint` | `string` | Crownpeak | Custom DQM API endpoint |
| `shadowDomMode` | `boolean` | `false` | Disable React portals for Shadow DOM compatibility |

#### Feature Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `overlayConfig` | `OverlayConfig` | - | Overlay/toolbar detection configuration |
| `translation` | `TranslationConfig` | - | AI translation configuration |
| `summary` | `SummaryConfig` | - | AI summary configuration |

---

### OverlayConfig

Configuration for adapting sidebar position to overlays (toolbars, preview bars).

```typescript
interface OverlayConfig {
    selector?: string | null;
    validateIframe?: boolean;
    pollMs?: number;
    manualOffset?: {
        position: 'top' | 'bottom' | 'left' | 'right';
        pixels: number;
    };
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selector` | `string \| null` | - | CSS selector for overlay element |
| `validateIframe` | `boolean` | `true` | Check if iFrame.contentWindow exists |
| `pollMs` | `number` | `1000` | Polling interval for cross-origin iFrames (0 = disable) |
| `manualOffset` | `object` | - | Manual offset (overrides auto-detection) |

#### Example

```typescript
// Auto-detect toolbar
overlayConfig: {
    selector: '.admin-toolbar',
    validateIframe: true,
    pollMs: 1000,
}

// Manual offset
overlayConfig: {
    manualOffset: {
        position: 'top',
        pixels: 50,
    }
}
```

---

### TranslationConfig

AI translation configuration (OpenAI or WebLLM).

```typescript
interface TranslationConfig {
    enabled: boolean;
    backend: 'openai' | 'webllm';
    apiKey?: string;                // Required for OpenAI
    model?: string;
    targetLanguage?: string;        // ISO 639-1 code (e.g., 'de', 'es', 'fr')
    mode?: 'fast' | 'full';
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | - | Enable AI translation (required) |
| `backend` | `'openai' \| 'webllm'` | - | Translation backend (required) |
| `apiKey` | `string` | - | OpenAI API key (required if backend: 'openai') |
| `model` | `string` | `'gpt-4o-mini'` (OpenAI) / `'Llama-3.2-1B-Instruct-q4f16_1-MLC'` (WebLLM) | Model identifier |
| `targetLanguage` | `string` | `'en'` | Target language (ISO 639-1 code) |
| `mode` | `'fast' \| 'full'` | `'fast'` | Translation timeout mode (fast: 15s, full: 120s) |

#### OpenAI Models

- `gpt-4o-mini` - Fast, cost-effective (recommended)
- `gpt-4o` - Better quality, higher cost
- `gpt-4.1` - Latest model, highest quality

#### WebLLM Models

- `Llama-3.2-1B-Instruct-q4f16_1-MLC` - Fast, 1.5GB download
- `Llama-3.2-3B-Instruct-q4f32_1-MLC` - Better quality, 3GB download
- `SmolLM2-360M-Instruct-q4f16_1-MLC` - Ultra-fast, 500MB download
- `Phi-3.5-mini-instruct-q4f16_1-MLC` - Balanced, 2GB download

#### Example

```typescript
// OpenAI Translation
translation: {
    enabled: true,
    backend: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
    targetLanguage: 'de',
    mode: 'fast',
}

// WebLLM Translation (Local)
translation: {
    enabled: true,
    backend: 'webllm',
    model: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    targetLanguage: 'de',
    mode: 'full',
}
```

---

### SummaryConfig

AI summary generation configuration (OpenAI only).

```typescript
interface SummaryConfig {
    enabled: boolean;
    backend: 'openai';
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | - | Enable AI summary (required) |
| `backend` | `'openai'` | - | Summary backend (only OpenAI supported) |
| `apiKey` | `string` | - | OpenAI API key |
| `model` | `string` | `'gpt-4o-mini'` | OpenAI model |
| `timeoutMs` | `number` | `45000` | Summary generation timeout (ms) |

#### Example

```typescript
summary: {
    enabled: true,
    backend: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
    timeoutMs: 45000,
}
```

---

### OAuth2Config

OAuth2 authentication configuration for backend server integration.

```typescript
interface OAuth2Config {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `authUrl` | `string` | ✅ | Authorization endpoint URL |
| `tokenUrl` | `string` | ✅ | Token exchange endpoint URL |
| `clientId` | `string` | ✅ | OAuth2 client ID |
| `redirectUri` | `string` | ✅ | Callback URL after authorization |
| `scope` | `string` | ❌ | OAuth2 scope (e.g., 'openid profile') |

#### Example

```typescript
oauth2Config: {
    authUrl: 'https://auth.example.com/oauth/authorize',
    tokenUrl: 'https://auth.example.com/oauth/token',
    clientId: 'your-client-id',
    redirectUri: 'https://yourapp.com/callback',
    scope: 'openid profile',
}
```

---

## Hooks

### AI Hooks

#### useAIEngine

Hook for accessing AI engine state (translation + summary).

```typescript
import { useAIEngine } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        backend,                    // 'openai' | 'webllm'
        isReady,                    // boolean
        initialize,                 // (backend: AIBackend) => Promise<void>
        cleanup,                    // () => Promise<void>
    } = useAIEngine();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `backend` | `'openai' \| 'webllm'` | Current AI backend |
| `isReady` | `boolean` | True when engine is initialized |
| `initialize` | `(backend) => Promise<void>` | Initialize AI engine |
| `cleanup` | `() => Promise<void>` | Cleanup AI resources |

---

#### useAITranslation

Hook for AI-powered translation of checkpoints.

```typescript
import { useAITranslation } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        translate,                  // (checkpoints, targetLang, mode) => Promise<Checkpoint[]>
        isTranslating,              // boolean
        progress,                   // TranslationProgress
        error,                      // Error | null
        cancelTranslation,          // () => void
    } = useAITranslation();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `translate` | `(checkpoints, targetLang, mode) => Promise<Checkpoint[]>` | Translate checkpoints |
| `isTranslating` | `boolean` | True during translation |
| `progress` | `TranslationProgress` | Translation progress state |
| `error` | `Error \| null` | Translation error |
| `cancelTranslation` | `() => void` | Cancel in-progress translation |

##### TranslationProgress

```typescript
interface TranslationProgress {
    isTranslating: boolean;
    progress: number;           // 0-100
    translated: number;         // Number of checkpoints translated
    total: number;              // Total checkpoints
    mode: 'fast' | 'full';
    backend: 'openai' | 'webllm';
}
```

##### Example

```typescript
const { translate, isTranslating, progress } = useAITranslation();

const handleTranslate = async () => {
    const translated = await translate(checkpoints, 'de', 'fast');
    console.log('Translated:', translated);
};

// Show progress
{isTranslating && (
    <div>
        Translating: {progress.translated}/{progress.total} ({progress.progress}%)
    </div>
)}
```

---

#### useAISummary

Hook for AI-powered summary generation.

```typescript
import { useAISummary } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        generateSummary,            // (checkpoints) => Promise<string>
        isGenerating,               // boolean
        stats,                      // SummaryStats
        error,                      // Error | null
    } = useAISummary();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `generateSummary` | `(checkpoints) => Promise<string>` | Generate summary |
| `isGenerating` | `boolean` | True during summary generation |
| `stats` | `SummaryStats` | Summary generation stats |
| `error` | `Error \| null` | Summary generation error |

##### SummaryStats

```typescript
interface SummaryStats {
    isGenerating: boolean;
    summaryText?: string;
    chunkingStrategy: 'single' | 'chunk' | 'tiny';
    tokensUsed?: number;
    estimatedCost?: number;     // USD
}
```

##### Example

```typescript
const { generateSummary, isGenerating, stats } = useAISummary();

const handleGenerateSummary = async () => {
    const summary = await generateSummary(checkpoints);
    console.log('Summary:', summary);
};

// Show summary
{stats.summaryText && (
    <div>
        <h3>AI Summary</h3>
        <ul>
            {stats.summaryText.split('\n').map((line, i) => (
                <li key={i}>{line}</li>
            ))}
        </ul>
        <small>Tokens: {stats.tokensUsed}, Cost: ${stats.estimatedCost}</small>
    </div>
)}
```

---

### Core Hooks

#### useAnalysis

Hook for DQM analysis state management.

```typescript
import { useAnalysis } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        analysisState,              // 'idle' | 'analyzing' | 'completed' | 'error'
        analysisData,               // AnalysisData | null
        assetId,                    // string | null
        startAnalysis,              // (html: string) => Promise<void>
        resetAnalysis,              // () => void
    } = useAnalysis();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `analysisState` | `AnalysisState` | Current analysis state |
| `analysisData` | `AnalysisData \| null` | Analysis results |
| `assetId` | `string \| null` | DQM asset ID |
| `startAnalysis` | `(html) => Promise<void>` | Start new analysis |
| `resetAnalysis` | `() => void` | Reset analysis state |

---

#### useAuthentication

Hook for authentication state management.

```typescript
import { useAuthentication } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        isAuthenticated,            // boolean
        sessionType,                // 'direct' | 'backend'
        login,                      // (apiKey, websiteId) => Promise<void>
        logout,                     // () => Promise<void>
    } = useAuthentication();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isAuthenticated` | `boolean` | True when authenticated |
| `sessionType` | `'direct' \| 'backend'` | Current session type |
| `login` | `(apiKey, websiteId) => Promise<void>` | Login with credentials |
| `logout` | `() => Promise<void>` | Logout and clear session |

---

#### useHighlights

Hook for error highlight navigation.

```typescript
import { useHighlights } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const {
        currentHighlight,           // number | null
        visibleHighlight,           // number | null
        totalHighlights,            // number
        navigateToHighlight,        // (index: number) => void
        nextHighlight,              // () => void
        previousHighlight,          // () => void
    } = useHighlights();
}
```

##### Returns

| Property | Type | Description |
|----------|------|-------------|
| `currentHighlight` | `number \| null` | Current highlight index (user-navigated) |
| `visibleHighlight` | `number \| null` | Visible highlight index (scroll-detected) |
| `totalHighlights` | `number` | Total number of highlights |
| `navigateToHighlight` | `(index) => void` | Navigate to specific highlight |
| `nextHighlight` | `() => void` | Navigate to next highlight |
| `previousHighlight` | `() => void` | Navigate to previous highlight |

---

### Utility Hooks

#### useOverlayResistant

Hook for detecting overlays and calculating content offsets.

```typescript
import { useOverlayResistant } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const overlay = useOverlayResistant({
        selector: '.admin-toolbar',
        validateIframe: true,
        pollMs: 1000,
    });
}
```

##### Returns

```typescript
interface OverlayInfo {
    present: boolean;
    height: number;
    width: number;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center' | null;
    contentOffset: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    isManualOffset: boolean;
}
```

##### Example

```typescript
const overlay = useOverlayResistant({ selector: '.toolbar' });

<div style={{
    marginTop: overlay.present ? `${overlay.contentOffset.top}px` : 0
}}>
    Content adjusted for toolbar
</div>
```

---

## Types

### Core Types

#### AnalysisState

```typescript
type AnalysisState = 'idle' | 'analyzing' | 'completed' | 'error';
```

---

#### SessionType

```typescript
type SessionType = 'direct' | 'backend';
```

- `direct` - Direct API calls to Crownpeak DQM
- `backend` - Proxy API calls through backend server

---

#### Checkpoint

```typescript
interface Checkpoint {
    colors: { bg: string; text: string };
    id: string;
    name: string;
    description?: string;
    reference: string;
    number: number;
    categoryNumber: number;
    category: string;
    priority: boolean;
    failed: boolean;
    topics: string[];
    canHighlight: {
        page: boolean;
        source: boolean;
    };
    restricted: boolean;
    checkpointType?: {
        name: string;
        modifiedBy: string;
        modified: string;
    };
    created: string;
    modified: string;
}
```

---

#### AnalysisData

```typescript
interface AnalysisData {
    assetId: string;
    created: string;
    siteName: string;
    totalCheckpoints: number;
    totalErrors: number;
    checkpoints: Checkpoint[];
}
```

---

## Redux Store

### Store Structure

```typescript
interface RootState {
    auth: AuthState;
    ai: AIState;
    highlight: HighlightState;
    locale: LocaleState;
}
```

### AuthState

```typescript
interface AuthState {
    isAuthenticated: boolean;
    sessionType: 'direct' | 'backend';
    apiKey?: string;
    websiteId?: string;
    sessionToken?: string;
}
```

### AIState

```typescript
interface AIState {
    backend: 'openai' | 'webllm';
    isReady: boolean;
    translation: {
        isTranslating: boolean;
        progress: TranslationProgress;
        error: Error | null;
    };
    summary: {
        isGenerating: boolean;
        stats: SummaryStats;
        error: Error | null;
    };
}
```

### HighlightState

```typescript
interface HighlightState {
    currentHighlight: number | null;
    visibleHighlight: number | null;
    totalHighlights: number;
}
```

### LocaleState

```typescript
interface LocaleState {
    locale: 'en' | 'de' | 'es';
}
```

---

## Utilities

### logger

Centralized logging utility with debug mode.

```typescript
import { logger } from '@crownpeak/dqm-react-component';

// Enable debug mode
logger.setDebugMode(true);

// Log messages
logger.debug('Debug message');
logger.warn('Warning message');
logger.error('Error message');
```

#### Methods

| Method | Description |
|--------|-------------|
| `setDebugMode(enabled: boolean)` | Enable/disable debug logging |
| `debug(...args: any[])` | Log debug message (only in debug mode) |
| `warn(...args: any[])` | Log warning message (always shown) |
| `error(...args: any[])` | Log error message (always shown) |

#### localStorage Control

```typescript
// Enable debug mode via localStorage
localStorage.setItem('dqm_debug', 'true');

// Reload page to activate
```

---

### loadDQMWidget (IIFE/ESM Only)

Load DQM widget in standalone mode (for IIFE/ESM bundles).

```typescript
interface DQMWidget {
    loadDQMWidget(options: {
        config: DQMConfig;
        containerId?: string;
        open?: boolean;
    }): () => void;
    
    version: string;
}
```

#### Example (IIFE)

```html
<script src="https://unpkg.com/@crownpeak/dqm-react-component/dist/dqm-widget.iife.js"></script>
<script>
    const cleanup = window.DQMWidget.loadDQMWidget({
        open: true,
        config: {
            websiteId: 'your-website-id',
            apiKey: 'your-api-key',
        }
    });
    
    // Later: cleanup() to remove widget
</script>
```

#### Example (ESM)

```html
<script type="module">
    import { loadDQMWidget } from 'https://unpkg.com/@crownpeak/dqm-react-component/dist/dqm-widget.esm.js';
    
    const cleanup = loadDQMWidget({
        config: {
            websiteId: 'your-website-id',
            apiKey: 'your-api-key',
        }
    });
</script>
```

---

## See Also

- **[Examples](./EXAMPLES.md)** - Integration examples with code
- **[AI Features Guide](./AI-FEATURES.md)** - AI translation and summary
- **[Widget Guide](./WIDGET-GUIDE.md)** - Standalone widget usage
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
