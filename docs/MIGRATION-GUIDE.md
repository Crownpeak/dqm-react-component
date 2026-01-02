# Migration Guide

This guide helps you upgrade from v1.0.x to v1.1.x of `@crownpeak/dqm-react-component`.

## Table of Contents
- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Migration Steps](#migration-steps)
- [New Features](#new-features)
- [localStorage Key Changes](#localstorage-key-changes)
- [TypeScript Type Changes](#typescript-type-changes)
- [Code Examples](#code-examples)

## Overview

**Version 1.1.0** introduces significant new features and architectural changes:

- ✨ **AI-Powered Translation** (OpenAI + WebLLM)
- ✨ **AI Summary Generation** (OpenAI)
- 🌍 **Internationalization** (i18n with en, de, es)
- 🔄 **Redux Store** for state management
- 📦 **Improved Widget Bundles** (IIFE + ESM)
- 🔧 **Centralized Logging** with debug mode

**Upgrade Time:** ~15-30 minutes for typical projects

**Breaking Changes:** Yes (i18n namespaces, Redux store, DQMConfig)

## Breaking Changes

### 1. i18n Namespace Restructuring

**Impact:** HIGH - Affects all custom translations

**v1.0.x (Old):**
```typescript
// Single 'common' namespace
i18n.t('common:sidebar.title')
i18n.t('common:auth.login')
i18n.t('common:errors.network')
```

**v1.1.x (New):**
```typescript
// Granular namespaces
i18n.t('sidebar:title')        // 'common' → 'sidebar'
i18n.t('auth:login')            // 'common' → 'auth'
i18n.t('errors:network')        // 'common' → 'errors'
```

**Migration Required:** If you provide custom translations via `DQMConfig.i18n`.

**Why Changed:** Improves bundle splitting, reduces memory usage, aligns with i18next best practices.

---

### 2. Redux Store Introduction

**Impact:** MEDIUM - Internal change, but affects advanced users

**v1.0.x (Old):**
```typescript
// Component-level state with useState/useReducer
const [authState, setAuthState] = useState({ ... });
const [aiState, setAiState] = useState({ ... });
```

**v1.1.x (New):**
```typescript
// Centralized Redux store
import { store } from '@crownpeak/dqm-react-component';

// Available slices:
// - authSlice: Authentication state
// - aiSlice: AI translation/summary state
// - highlightSlice: Error highlight navigation state
// - localeSlice: i18n language state
```

**Migration Required:** Only if you directly access component internals (not recommended).

**Why Changed:** Better state management, improved debugging, enables advanced features like AI progress tracking.

---

### 3. DQMConfig.translation Property

**Impact:** MEDIUM - New optional property for AI features

**v1.0.x (Old):**
```typescript
interface DQMConfig {
    websiteId: string;
    apiKey: string;
    overlayConfig?: { ... };
}
```

**v1.1.x (New):**
```typescript
interface DQMConfig {
    websiteId: string;
    apiKey: string;
    overlayConfig?: { ... };
    
    // NEW: AI Translation
    translation?: {
        enabled: boolean;
        backend: 'openai' | 'webllm';
        apiKey?: string;
        model?: string;
        targetLanguage?: string;
        mode?: 'fast' | 'full';
    };
    
    // NEW: AI Summary
    summary?: {
        enabled: boolean;
        backend: 'openai';
        apiKey?: string;
        model?: string;
    };
}
```

**Migration Required:** No (backward compatible - translation is optional).

**Why Changed:** Enables AI features without breaking existing configurations.

---

### 4. localStorage Key Renames

**Impact:** LOW - Automatic migration via migration script

| v1.0.x Key | v1.1.x Key | Type |
|------------|------------|------|
| `dqm_quality_breakdown_expanded` | (unchanged) | boolean |
| N/A | `dqm_translate_results_enabled` | boolean |
| N/A | `dqm_ai_backend` | 'openai' \| 'webllm' |
| N/A | `dqm_target_language` | string |
| N/A | `dqm_ai_summary_enabled` | boolean |
| N/A | `dqm_webllm_model` | string |
| N/A | `dqm_translation_mode` | 'fast' \| 'full' |
| N/A | `dqm_openai_api_key` | string |
| N/A | `dqm_openai_model` | string |
| N/A | `dqm_openai_summary_model` | string |
| N/A | `dqm_locale` | 'en' \| 'de' \| 'es' |

**Migration Required:** Run migration script to preserve user settings (if applicable).

---

## Migration Steps

### Step 1: Update Package

```bash
npm install @crownpeak/dqm-react-component@latest
```

Or with Yarn:

```bash
yarn upgrade @crownpeak/dqm-react-component@latest
```

### Step 2: Update i18n Translations (If Custom)

If you provide custom translations, update namespace references:

**Before (v1.0.x):**
```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

<DQMSidebar
    open={open}
    onClose={onClose}
    onOpen={onOpen}
    config={{
        websiteId: '...',
        apiKey: '...',
        i18n: {
            resources: {
                en: {
                    common: {
                        sidebar: {
                            title: 'My Custom Title',
                        },
                        auth: {
                            login: 'My Custom Login',
                        },
                    },
                },
            },
        },
    }}
/>
```

**After (v1.1.x):**
```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

<DQMSidebar
    open={open}
    onClose={onClose}
    onOpen={onOpen}
    config={{
        websiteId: '...',
        apiKey: '...',
        i18n: {
            resources: {
                en: {
                    sidebar: {  // 'common' → 'sidebar'
                        title: 'My Custom Title',
                    },
                    auth: {     // 'common' → 'auth'
                        login: 'My Custom Login',
                    },
                },
            },
        },
    }}
/>
```

**Available Namespaces in v1.1.x:**
- `sidebar` - Sidebar UI strings
- `auth` - Authentication-related strings
- `errors` - Error messages
- `ai` - AI feature strings (translation, summary)

### Step 3: Enable AI Features (Optional)

Add AI configuration to leverage new translation and summary features:

```typescript
<DQMSidebar
    open={open}
    onClose={onClose}
    onOpen={onOpen}
    config={{
        websiteId: '...',
        apiKey: '...',
        
        // NEW: Enable AI Translation
        translation: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
            targetLanguage: 'de',
            mode: 'fast',
        },
        
        // NEW: Enable AI Summary
        summary: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
        },
    }}
/>
```

See **[AI Features Guide](./AI-FEATURES.md)** for complete documentation.

### Step 4: Run localStorage Migration (If Needed)

If your users have existing localStorage data from v1.0.x, run this migration script on first load:

```typescript
/**
 * Migrate localStorage from v1.0.x to v1.1.x
 * Run this once on app initialization after upgrading
 */
function migrateDQMLocalStorage() {
    const version = localStorage.getItem('dqm_version');
    
    if (version === '1.1.0') {
        return; // Already migrated
    }
    
    // v1.0.x had minimal localStorage - nothing to migrate
    // v1.1.x introduces new AI-related keys with defaults
    
    // Set defaults for new keys (if not already set by user)
    if (!localStorage.getItem('dqm_translate_results_enabled')) {
        localStorage.setItem('dqm_translate_results_enabled', 'false');
    }
    
    if (!localStorage.getItem('dqm_ai_backend')) {
        localStorage.setItem('dqm_ai_backend', 'openai');
    }
    
    if (!localStorage.getItem('dqm_target_language')) {
        localStorage.setItem('dqm_target_language', 'en');
    }
    
    if (!localStorage.getItem('dqm_ai_summary_enabled')) {
        localStorage.setItem('dqm_ai_summary_enabled', 'false');
    }
    
    if (!localStorage.getItem('dqm_locale')) {
        localStorage.setItem('dqm_locale', 'en');
    }
    
    // Mark migration as complete
    localStorage.setItem('dqm_version', '1.1.0');
    
    console.log('DQM localStorage migrated to v1.1.0');
}

// Run on app initialization
migrateDQMLocalStorage();
```

### Step 5: Update TypeScript Types (If Using)

Import new types for AI features:

```typescript
import type {
    DQMSidebarProps,
    DQMConfig,
    TranslationConfig,     // NEW
    SummaryConfig,         // NEW
    TranslationProgress,   // NEW
    SummaryStats,          // NEW
} from '@crownpeak/dqm-react-component';
```

### Step 6: Test & Verify

1. **Build:** Ensure no TypeScript errors
   ```bash
   npm run build
   ```

2. **Test:** Verify sidebar loads correctly
   ```bash
   npm run dev
   ```

3. **Check Console:** Look for migration messages or warnings

4. **Test AI Features:** If enabled, verify translation and summary work

## New Features

### AI-Powered Translation

Translate checkpoint descriptions into any language:

```typescript
<DQMSidebar
    open={open}
    onClose={onClose}
    onOpen={onOpen}
    config={{
        websiteId: '...',
        apiKey: '...',
        translation: {
            enabled: true,
            backend: 'openai',      // or 'webllm' for local inference
            apiKey: 'sk-...',       // OpenAI API key (if backend: 'openai')
            model: 'gpt-4o-mini',   // or 'gpt-4o', 'gpt-4.1'
            targetLanguage: 'de',   // Target language (ISO 639-1)
            mode: 'fast',           // 'fast' (15s timeout) or 'full' (120s)
        },
    }}
/>
```

**Key Features:**
- **Backends:** OpenAI (cloud, fast) or WebLLM (local, private)
- **Caching:** Automatic IndexedDB + In-Memory caching
- **Modes:** Fast (15s timeout, fails gracefully) or Full (120s timeout, complete translation)
- **Performance:** ~2-5s for 50 checkpoints (OpenAI) or ~30-120s (WebLLM)

See **[AI Features Guide](./AI-FEATURES.md)** for complete documentation.

### AI Summary Generation

Generate concise bullet-point summaries of analysis results:

```typescript
<DQMSidebar
    open={open}
    onClose={onClose}
    onOpen={onOpen}
    config={{
        websiteId: '...',
        apiKey: '...',
        summary: {
            enabled: true,
            backend: 'openai',      // Only OpenAI supported
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',   // or 'gpt-4o', 'gpt-4.1'
        },
    }}
/>
```

**Key Features:**
- **Chunking:** Automatic chunking based on checkpoint count (single/chunk/tiny strategies)
- **Caching:** Persistent IndexedDB cache
- **Output:** 3-7 bullet points highlighting key issues
- **Performance:** ~3-8s for 50 checkpoints

### Internationalization (i18n)

Switch languages dynamically:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
    const { i18n } = useTranslation();
    
    return (
        <button onClick={() => i18n.changeLanguage('de')}>
            Deutsch
        </button>
    );
}
```

**Supported Languages:**
- `en` - English
- `de` - German (Deutsch)
- `es` - Spanish (Español)

**Storage:** Language preference saved to `localStorage.getItem('dqm_locale')`.

### Centralized Logging

Enable debug logging for troubleshooting:

```typescript
import { logger } from '@crownpeak/dqm-react-component';

// Enable debug mode
logger.setDebugMode(true);

// All internal logs will now appear in console
// Format: [DQM] [DEBUG] Message
```

**Log Levels:**
- `logger.debug()` - Debug information (only in debug mode)
- `logger.warn()` - Warnings (always shown)
- `logger.error()` - Errors (always shown)

**localStorage Control:**
```typescript
// Enable debug mode via localStorage
localStorage.setItem('dqm_debug', 'true');

// Reload page to activate debug logging
```

## localStorage Key Changes

Complete list of localStorage keys in v1.1.x:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dqm_apiKey` | string | - | DQM API key |
| `dqm_websiteID` | string | - | DQM Website ID |
| `dqm_quality_breakdown_expanded` | boolean | true | Quality breakdown accordion state |
| `dqm_translate_results_enabled` | boolean | false | Toggle translation on/off |
| `dqm_ai_backend` | 'openai'\|'webllm' | 'openai' | AI backend selection |
| `dqm_target_language` | string | 'en' | Target language (ISO 639-1) |
| `dqm_ai_summary_enabled` | boolean | false | Toggle summary on/off |
| `dqm_webllm_model` | string | 'Llama-3.2-1B-...' | WebLLM model selection |
| `dqm_translation_mode` | 'fast'\|'full' | 'fast' | Translation timeout mode |
| `dqm_openai_api_key` | string | - | OpenAI API key (if provided via UI) |
| `dqm_openai_model` | string | 'gpt-4o-mini' | OpenAI translation model |
| `dqm_openai_summary_model` | string | 'gpt-4o-mini' | OpenAI summary model |
| `dqm_locale` | 'en'\|'de'\|'es' | 'en' | UI language |
| `dqm_debug` | boolean | false | Enable debug logging |

**Migration:** v1.0.x keys are preserved. New keys are added with defaults.

## TypeScript Type Changes

### New Types

```typescript
// AI Translation Configuration
interface TranslationConfig {
    enabled: boolean;
    backend: 'openai' | 'webllm';
    apiKey?: string;
    model?: string;
    targetLanguage?: string;
    mode?: 'fast' | 'full';
}

// AI Summary Configuration
interface SummaryConfig {
    enabled: boolean;
    backend: 'openai';
    apiKey?: string;
    model?: string;
}

// Translation Progress Tracking
interface TranslationProgress {
    isTranslating: boolean;
    progress: number;           // 0-100
    translated: number;         // Number of checkpoints translated
    total: number;              // Total checkpoints
    mode: 'fast' | 'full';
    backend: 'openai' | 'webllm';
}

// Summary Generation Stats
interface SummaryStats {
    isGenerating: boolean;
    summaryText?: string;       // Generated summary (3-7 bullet points)
    chunkingStrategy: 'single' | 'chunk' | 'tiny';
    tokensUsed?: number;
    estimatedCost?: number;     // USD
}

// Redux Store State
interface RootState {
    auth: AuthState;
    ai: AIState;
    highlight: HighlightState;
    locale: LocaleState;
}
```

### Updated Types

```typescript
// DQMConfig (v1.1.x)
interface DQMConfig {
    websiteId: string;
    apiKey: string;
    overlayConfig?: OverlayConfig;
    translation?: TranslationConfig;  // NEW
    summary?: SummaryConfig;          // NEW
}

// DQMSidebarProps (unchanged, but config updated)
interface DQMSidebarProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
    config?: DQMConfig;
    debugHtml?: string;
}
```

## Code Examples

### Before & After: Basic Usage

**v1.0.x:**
```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
    const [open, setOpen] = useState(false);
    
    React.useEffect(() => {
        localStorage.setItem('dqm_apiKey', 'your-api-key');
        localStorage.setItem('dqm_websiteID', 'your-website-id');
    }, []);
    
    return (
        <DQMSidebar
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        />
    );
}
```

**v1.1.x (Backward Compatible):**
```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
    const [open, setOpen] = useState(false);
    
    // Same as v1.0.x - no changes required
    React.useEffect(() => {
        localStorage.setItem('dqm_apiKey', 'your-api-key');
        localStorage.setItem('dqm_websiteID', 'your-website-id');
    }, []);
    
    return (
        <DQMSidebar
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
        />
    );
}
```

### Before & After: With AI Features

**v1.0.x (No AI):**
```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
/>
```

**v1.1.x (With AI):**
```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        websiteId: 'your-website-id',
        apiKey: 'your-dqm-api-key',
        
        // NEW: AI Translation
        translation: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
            targetLanguage: 'de',
            mode: 'fast',
        },
        
        // NEW: AI Summary
        summary: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
        },
    }}
/>
```

### Before & After: Custom i18n

**v1.0.x:**
```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        i18n: {
            resources: {
                en: {
                    common: {  // Single namespace
                        sidebar: { title: 'Quality Analysis' },
                        auth: { login: 'Login' },
                        errors: { network: 'Network error' },
                    },
                },
            },
        },
    }}
/>
```

**v1.1.x:**
```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        i18n: {
            resources: {
                en: {
                    sidebar: { title: 'Quality Analysis' },  // Separate namespace
                    auth: { login: 'Login' },                // Separate namespace
                    errors: { network: 'Network error' },    // Separate namespace
                },
            },
        },
    }}
/>
```

## Troubleshooting

### Issue: "Namespace 'common' not found" error

**Cause:** Using old `common` namespace in custom translations.

**Solution:** Split translations into granular namespaces (`sidebar`, `auth`, `errors`).

```typescript
// Before
resources: { en: { common: { ... } } }

// After
resources: { en: { sidebar: { ... }, auth: { ... }, errors: { ... } } }
```

---

### Issue: Translation not working after upgrade

**Cause:** Missing `translation.enabled` or invalid API key.

**Solution:** Verify configuration:

```typescript
config={{
    translation: {
        enabled: true,          // Must be true
        backend: 'openai',
        apiKey: 'sk-...',       // Valid OpenAI API key
        model: 'gpt-4o-mini',
        targetLanguage: 'de',
        mode: 'fast',
    },
}}
```

---

### Issue: localStorage keys not migrating

**Cause:** Migration script not run.

**Solution:** Run migration script (see Step 4 above).

---

### Issue: TypeScript errors after upgrade

**Cause:** Type definitions changed.

**Solution:** Update imports:

```typescript
// Add new types
import type {
    DQMSidebarProps,
    DQMConfig,
    TranslationConfig,
    SummaryConfig,
} from '@crownpeak/dqm-react-component';
```

---

## See Also

- **[AI Features Guide](./AI-FEATURES.md)** - Complete AI documentation
- **[API Reference](./API-REFERENCE.md)** - Full TypeScript API
- **[Examples](./EXAMPLES.md)** - Integration examples with AI
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[CHANGELOG](./CHANGELOG.md)** - Detailed release notes
