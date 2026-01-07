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

### withErrorBoundary

Higher-Order Component (HOC) to wrap any component with an ErrorBoundary.

```typescript
import { withErrorBoundary } from '@crownpeak/dqm-react-component';

const SafeComponent = withErrorBoundary(MyComponent, {
    resetKeys: ['some-key'],
});
```

#### Signature

```typescript
function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P>;
```

#### Example

```typescript
import { withErrorBoundary } from '@crownpeak/dqm-react-component';

// Wrap a component that might throw errors
const SafeDQMIntegration = withErrorBoundary(DQMIntegration, {
    resetKeys: [userId, pageId],
});

function App() {
    return <SafeDQMIntegration userId={userId} pageId={pageId} />;
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
| `authBackendUrl` | `string` | - | Backend server URL for proxy auth |

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

AI translation configuration.

```typescript
interface TranslationConfig {
    enabledByDefault?: boolean;     // Default: false
    computeBudgetMs?: number;       // Default: 15000
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabledByDefault` | `boolean` | `false` | Enable auto-translation by default (user can toggle at runtime) |
| `computeBudgetMs` | `number` | `15000` | Translation compute budget in milliseconds |

> **Note:** OpenAI API configuration (API key, model, target language) is managed via localStorage keys. See [localStorage Keys](#localstorage-keys) section.

#### Example

```typescript
translation: {
    enabledByDefault: true,
    computeBudgetMs: 30000,
}
```

---

### SummaryConfig

AI summary generation configuration.

```typescript
interface SummaryConfig {
    timeoutMs?: number;             // Default: 45000
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeoutMs` | `number` | `45000` | Summary generation timeout in milliseconds |

> **Note:** OpenAI API configuration (API key, model) is managed via localStorage keys. See [localStorage Keys](#localstorage-keys) section.

#### Example

```typescript
summary: {
    timeoutMs: 60000,
}
```

---

## Hooks

### AI Hooks

The AI hooks are exported from `@crownpeak/dqm-react-component` for advanced usage. They are designed to work together as a composable system.

#### useAIEngine

Hook for managing AI engine initialization and access (OpenAI client).

```typescript
import { useAIEngine } from '@crownpeak/dqm-react-component';
import type { UseAIEngineOptions, UseAIEngineReturn } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const engine = useAIEngine({
        enabled: true,
        openAiApiKey: 'sk-...',
        openAiModel: 'gpt-4.1-mini',        // Optional, default: 'gpt-4.1-mini'
        openAiBaseUrl: 'https://api.openai.com/v1',  // Optional
    });
}
```

##### Options (UseAIEngineOptions)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `enabled` | `boolean` | ✅ | Whether AI features are enabled |
| `openAiApiKey` | `string` | ❌ | OpenAI API key |
| `openAiModel` | `string` | ❌ | OpenAI model name (default: 'gpt-4.1-mini') |
| `openAiBaseUrl` | `string` | ❌ | OpenAI base URL (default: 'https://api.openai.com/v1') |

##### Returns (UseAIEngineReturn)

| Property | Type | Description |
|----------|------|-------------|
| `client` | `JsonChatClient \| null` | The OpenAI client instance |
| `state` | `TranslationState` | Current engine state |
| `loadedModelId` | `string \| null` | Currently loaded model ID |
| `isReady` | `boolean` | True when engine is ready for inference |
| `error` | `string \| null` | Error message if state is 'error' |
| `runWithLock` | `<T>(task: () => Promise<T>) => Promise<T>` | Run task with exclusive access |
| `stop` | `() => void` | Stop any ongoing AI operation |

##### TranslationState

```typescript
type TranslationState = 'disabled' | 'initializing' | 'ready' | 'translating' | 'error';
```

---

#### useAITranslation

Hook for translating DQM analysis results using AI. **Note:** Translation runs automatically when enabled - there is no manual `translate()` function.

```typescript
import { useAITranslation } from '@crownpeak/dqm-react-component';
import type { UseAITranslationOptions, UseAITranslationReturn } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const engine = useAIEngine({ enabled: true, openAiApiKey: '...' });
    const cacheManager = useTranslationCache();
    
    const translation = useAITranslation({
        engine,
        cacheManager,
        originalData: analysisData,
        targetLang: 'de',
        modelId: 'gpt-4.1-mini',
        enabled: true,
        mode: 'fast',
        computeBudgetMs: 15000,
        persistentCache: cacheManager.cache,
    });
    
    // Use translation.translatedData instead of originalData
}
```

##### Options (UseAITranslationOptions)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `engine` | `UseAIEngineReturn` | ✅ | AI engine hook return value |
| `cacheManager` | `UseTranslationCacheReturn` | ✅ | Translation cache hook return value |
| `originalData` | `AnalysisData \| null` | ✅ | Original analysis data |
| `targetLang` | `string` | ✅ | Target language code (e.g., 'de', 'fr') |
| `modelId` | `string` | ✅ | Model ID being used |
| `enabled` | `boolean` | ✅ | Whether translation is enabled |
| `mode` | `TranslationMode` | ✅ | Translation mode ('fast' or 'full') |
| `computeBudgetMs` | `number` | ✅ | Compute budget in milliseconds |
| `persistentCache` | `TranslationCache` | ✅ | IndexedDB translation cache |
| `summaryGenerating` | `boolean` | ❌ | Whether summary is generating (translation waits) |

##### Returns (UseAITranslationReturn)

| Property | Type | Description |
|----------|------|-------------|
| `translatedData` | `AnalysisData \| null` | Translated data (or original if not translated) |
| `progress` | `TranslationProgress \| null` | Translation progress |
| `error` | `string \| null` | Error message |
| `translatingIds` | `Set<string>` | Checkpoint IDs currently being translated |
| `translatedIds` | `Set<string>` | Checkpoint IDs that have been translated |
| `isTranslating` | `boolean` | Whether translation is in progress |
| `restart` | `() => void` | Restart translation (clears cache for current asset) |
| `stop` | `() => void` | Stop ongoing translation |
| `retrySingleCheckpoint` | `(checkpointId: string) => Promise<void>` | Retry single checkpoint |
| `resetToOriginal` | `() => void` | Reset to original data |

##### TranslationProgress

```typescript
interface TranslationProgress {
    translated: number;         // Number of checkpoints translated
    total: number;              // Total checkpoints to translate
    tokens: number;             // Tokens used
    fromCache: number;          // Checkpoints retrieved from cache
    errors: number;             // Number of errors
}
```

##### TranslationMode

```typescript
type TranslationMode = 'fast' | 'full';
```

- `fast` - Budget-limited translation (stops after `computeBudgetMs`)
- `full` - Translate all checkpoints (120s budget)

---

#### useAISummary

Hook for generating AI-powered summary of DQM results. **Note:** Summary generation runs automatically when enabled - there is no manual `generateSummary()` function.

```typescript
import { useAISummary } from '@crownpeak/dqm-react-component';
import type { UseAISummaryOptions, UseAISummaryReturn } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const engine = useAIEngine({ enabled: true, openAiApiKey: '...' });
    const cacheManager = useTranslationCache();
    
    const summary = useAISummary({
        engine,
        originalData: analysisData,
        targetLang: 'de',
        modelId: 'gpt-4.1-mini',
        enabled: true,
        cache: cacheManager.cache,
    });
    
    // Use summary.bullets for the generated summary points
}
```

##### Options (UseAISummaryOptions)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `engine` | `UseAIEngineReturn` | ✅ | AI engine hook return value |
| `originalData` | `AnalysisData \| null` | ✅ | Original analysis data |
| `targetLang` | `string` | ✅ | Target language for summary |
| `modelId` | `string` | ✅ | Model ID being used |
| `enabled` | `boolean` | ✅ | Whether summary is enabled |
| `cache` | `TranslationCache` | ✅ | Translation cache for summary caching |
| `timeoutMs` | `number` | ❌ | Timeout in milliseconds (default: 45000) |
| `translationInProgress` | `boolean` | ❌ | Whether translation is in progress (summary waits) |

##### Returns (UseAISummaryReturn)

| Property | Type | Description |
|----------|------|-------------|
| `state` | `SummaryState` | Current summary state |
| `bullets` | `string[] \| null` | Generated bullet points |
| `error` | `string \| null` | Error message |
| `stats` | `SummaryStats \| null` | Stats for last summary run |
| `restart` | `() => void` | Restart summary generation |

##### SummaryState

```typescript
type SummaryState = 'idle' | 'generating' | 'ready' | 'error';
```

##### SummaryStats

```typescript
interface SummaryStats {
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    cached: boolean;
}
```

---

#### useTranslationCache

Hook for managing translation cache (IndexedDB + in-memory).

```typescript
import { useTranslationCache } from '@crownpeak/dqm-react-component';
import type { UseTranslationCacheReturn } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const cacheManager = useTranslationCache();
    
    // Clear all caches
    await cacheManager.clearAll();
}
```

##### Returns (UseTranslationCacheReturn)

| Property | Type | Description |
|----------|------|-------------|
| `cache` | `TranslationCache` | IndexedDB-backed translation cache |
| `assetCache` | `Map<string, AnalysisData>` | In-memory cache per asset |
| `storagePersisted` | `boolean \| null` | Whether storage survives browser eviction |
| `refreshStorageState` | `() => Promise<void>` | Refresh persistence state |
| `clearAll` | `() => Promise<void>` | Clear all cached translations |
| `clearAssetCache` | `() => void` | Clear in-memory cache only |

---

### AI Context

#### AIProvider

Provider component for AI features configuration. Wrap your app with this to use AI hooks.

```typescript
import { AIProvider } from '@crownpeak/dqm-react-component';
import type { AIProviderProps } from '@crownpeak/dqm-react-component';

function App() {
    return (
        <AIProvider
            translationConfig={{ enabledByDefault: false, computeBudgetMs: 15000 }}
            summaryConfig={{ timeoutMs: 45000 }}
        >
            <MyApp />
        </AIProvider>
    );
}
```

##### Props (AIProviderProps)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | ✅ | Child components |
| `translationConfig` | `TranslationConfig` | ❌ | Translation configuration |
| `summaryConfig` | `SummaryConfig` | ❌ | Summary configuration |

---

#### useAI

Hook to access AI context settings. Must be used within an AIProvider.

```typescript
import { useAI } from '@crownpeak/dqm-react-component';
import type { AIContextValue } from '@crownpeak/dqm-react-component';

function MyComponent() {
    const ai = useAI();
    
    // Toggle translation
    ai.setTranslationEnabled(!ai.translationEnabled);
    
    // Change translation mode
    ai.setTranslationMode('full');
    
    // Update OpenAI settings
    ai.setOpenAiApiKey('sk-...');
    ai.setOpenAiModel('gpt-4o-mini');
}
```

##### Returns (AIContextValue)

| Property | Type | Description |
|----------|------|-------------|
| `translationEnabled` | `boolean` | Translation feature enabled |
| `setTranslationEnabled` | `(value: boolean) => void` | Toggle translation |
| `translationMode` | `TranslationMode` | Current translation mode |
| `setTranslationMode` | `(value: TranslationMode) => void` | Set translation mode |
| `translationDialogOpen` | `boolean` | Translation dialog visibility |
| `setTranslationDialogOpen` | `(value: boolean) => void` | Toggle dialog |
| `summaryEnabled` | `boolean` | Summary feature enabled |
| `setSummaryEnabled` | `(value: boolean) => void` | Toggle summary |
| `openAiApiKey` | `string` | Current OpenAI API key |
| `setOpenAiApiKey` | `(value: string) => void` | Set API key |
| `openAiModel` | `string` | Current OpenAI model |
| `setOpenAiModel` | `(value: string) => void` | Set model |
| `openAiBaseUrl` | `string` | Current OpenAI base URL |
| `setOpenAiBaseUrl` | `(value: string) => void` | Set base URL |
| `targetLang` | `string` | Target language (from i18n) |
| `translationNeeded` | `boolean` | True if target !== 'en' |
| `aiEnabled` | `boolean` | Any AI feature enabled |
| `computeBudgetMs` | `number` | Current compute budget |
| `effectiveModelId` | `string` | Resolved model ID |

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

> **Note:** The Redux store is used internally by the DQM component. These types are documented for advanced users who need to integrate with the store directly. Most users should use the provided hooks instead.

### Store Structure

```typescript
interface RootState {
    locale: LocaleState;
    analysis: AnalysisSliceState;
    highlight: HighlightSliceState;
    auth: AuthSliceState;
    ai: AISliceState;
    dqmApi: RTKQueryState;  // RTK Query cache
}
```

### AnalysisSliceState

```typescript
interface AnalysisSliceState {
    state: AnalysisState;           // 'idle' | 'analyzing' | 'completed' | 'error'
    assetId: string | null;
    data: AnalysisData | null;
    error: string | null;
    isAnalyzing: boolean;
    startedAt: number | null;
    completedAt: number | null;
}
```

### AuthSliceState

```typescript
interface AuthSliceState {
    apiKey: string | null;
    websiteId: string | null;
    isAuthenticated: boolean;
    sessionType: 'direct' | 'backend' | null;
    sessionToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    rememberMe: boolean;
    isLoading: boolean;
    error: string | null;
    storageWarningAcknowledged: boolean;
}
```

### HighlightSliceState

```typescript
interface HighlightSliceState {
    selectedCheckpoint: Checkpoint | null;
    selectedCheckpointId: string | null;
    viewMode: 'browser' | 'source';
    showAllHighlights: boolean;
    currentHighlightIndex: number;    // 1-based
    totalHighlights: number;
    visibleHighlightIndex: number;    // 1-based
    cache: Record<string, HighlightCacheEntry>;
    scrollPositions: Record<string, { browser: number; source: number }>;
    isModalOpen: boolean;
    isLoading: boolean;
    error: string | null;
    highlightedContent: string;
    scriptsDisabled: boolean;
    hasAutoScrolled: boolean;
}
```

### AISliceState

```typescript
interface AISliceState {
    settings: {
        provider: 'openai' | 'none';
        openaiApiKey: string | null;
        openaiModel: string;
        enabled: boolean;
        translationProvider: 'openai' | 'none';
    };
    summaries: Record<string, AISummary>;
    isSettingsOpen: boolean;
    isGenerating: boolean;
    generatingFor: string | null;
    error: string | null;
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

### i18n

The library exports its i18next instance and locale utilities for language management.

```typescript
import { 
  i18n,
  resolveLanguage,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
} from '@crownpeak/dqm-react-component';
import type { SupportedLocale, AvailableLanguage } from '@crownpeak/dqm-react-component';
```

#### Exports

| Export | Type | Description |
|--------|------|-------------|
| `i18n` | `i18n` | i18next instance used by the library |
| `resolveLanguage` | `(locale: string) => AvailableLanguage` | Resolve locale to available language (handles regional variants) |
| `SUPPORTED_LOCALES` | `readonly ['en', 'de', 'es']` | Array of supported locale codes |
| `DEFAULT_LOCALE` | `'en'` | Default fallback locale |
| `normalizeLocale` | `(input: string) => SupportedLocale \| null` | Normalize locale string to supported locale |

#### Changing Language

```typescript
import { i18n } from '@crownpeak/dqm-react-component';

// Change language programmatically
i18n.changeLanguage('de');

// Get current language
const currentLang = i18n.language; // 'de'

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});
```

#### Handling Regional Variants

```typescript
import { resolveLanguage } from '@crownpeak/dqm-react-component';

resolveLanguage('de-AT');  // Returns 'de'
resolveLanguage('es-MX');  // Returns 'es'
resolveLanguage('fr');     // Returns 'en' (fallback)
```

#### Validating Locales

```typescript
import { normalizeLocale, SUPPORTED_LOCALES } from '@crownpeak/dqm-react-component';

normalizeLocale('de');      // 'de'
normalizeLocale('de-AT');   // 'de'
normalizeLocale('fr');      // null (not supported)

// Check if locale is supported
const isSupported = SUPPORTED_LOCALES.includes('de'); // true
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

## localStorage Keys

The DQM component uses localStorage for persisting user preferences and authentication state.

### Authentication Keys

| Key | Type | Description |
|-----|------|-------------|
| `dqm_apiKey` | `string` | DQM API key (direct auth mode) |
| `dqm_websiteID` | `string` | DQM Website ID |
| `dqm_sessionToken` | `string` | Backend session token (backend auth mode) |
| `dqm_sessionType` | `'direct' \| 'backend'` | Current authentication mode |
| `dqm_rememberMe` | `'true' \| 'false'` | Remember credentials preference |
| `dqm_storageWarningAcknowledged` | `'true'` | User acknowledged localStorage security warning |

### AI Feature Keys

| Key | Type | Description |
|-----|------|-------------|
| `dqm_openai_apiKey` | `string` | OpenAI API key for translation/summary |
| `dqm_openai_model` | `string` | OpenAI model (default: 'gpt-4.1-mini') |
| `dqm_target_language` | `string` | Target language for translation (ISO 639-1) |
| `dqm_translate_results_enabled` | `'true' \| 'false'` | Translation feature enabled |
| `dqm_ai_summary_enabled` | `'true' \| 'false'` | AI summary feature enabled |
| `dqm_ai_provider` | `'openai' \| 'none'` | AI provider selection |

### UI State Keys

| Key | Type | Description |
|-----|------|-------------|
| `dqm_locale` | `'en' \| 'de' \| 'es'` | UI language |
| `dqm_debug` | `'true' \| 'false'` | Debug logging enabled |
| `dqm_quality_breakdown_expanded` | `'true' \| 'false'` | Quality breakdown accordion state |

#### Example: Pre-configure AI settings

```typescript
// Set OpenAI configuration before loading DQM
localStorage.setItem('dqm_openai_apiKey', 'sk-...');
localStorage.setItem('dqm_openai_model', 'gpt-4o-mini');
localStorage.setItem('dqm_target_language', 'de');
localStorage.setItem('dqm_translate_results_enabled', 'true');
```

---

## See Also

- **[Examples](./EXAMPLES.md)** - Integration examples with code
- **[AI Features Guide](./AI-FEATURES.md)** - AI translation and summary
- **[Widget Guide](./WIDGET-GUIDE.md)** - Standalone widget usage
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
