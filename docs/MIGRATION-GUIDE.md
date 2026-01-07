This guide helps you upgrade between versions of `@crownpeak/dqm-react-component`.

## Table of Contents

- [v1.1.0 → v1.2.0](#v110--v120)
- [v1.0.x → v1.1.0](#v10x--v110)

---

## v1.1.0 → v1.2.0

**Release Date:** January 7, 2026

**Upgrade Time:** ~5 minutes (no breaking changes)

**Breaking Changes:** None ✅

### Overview*

Version 1.2.0 introduces powerful new features while maintaining full backward compatibility:

- ✨ **AI-Powered Translation** - Translate checkpoint descriptions via OpenAI
- ✨ **AI Summary Generation** - Generate concise bullet-point summaries
- 🌍 **Internationalization (i18n)** - UI in English, German, Spanish
- 🔄 **Redux Store** - Centralized state management (internal)
- 🔧 **Centralized Logging** - Debug mode for troubleshooting

### Step 1: Update Package

```bash
npm install @crownpeak/dqm-react-component@1.2.0
```

Or with Yarn:

```bash
yarn upgrade @crownpeak/dqm-react-component@1.2.0
```

### Step 2: Verify (No Changes Required)

Your existing code continues to work without modifications:

```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

// This works exactly as before
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
/>
```

### New Features (Optional)

#### AI-Powered Translation

Translate checkpoint descriptions into any language:

```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        websiteId: '...',
        apiKey: '...',
        translation: {
            enabled: true,
            apiKey: 'sk-...',       // OpenAI API key
            model: 'gpt-4o-mini',   // or 'gpt-4o', 'gpt-4.1'
            targetLanguage: 'de',   // Target language (ISO 639-1)
            mode: 'fast',           // 'fast' (15s) or 'full' (120s)
        },
    }}
/>
```

**Key Features:**
- Automatic IndexedDB + In-Memory caching
- Fast mode (15s timeout, fails gracefully) or Full mode (120s)
- ~2-5s for 50 checkpoints

See **[AI Features Guide](./AI-FEATURES.md)** for complete documentation.

#### AI Summary Generation

Generate concise summaries of analysis results:

```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        websiteId: '...',
        apiKey: '...',
        summary: {
            enabled: true,
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
        },
    }}
/>
```

**Key Features:**
- Automatic chunking based on checkpoint count
- Persistent IndexedDB cache
- 3-7 bullet points highlighting key issues

#### Internationalization (i18n)

The UI now supports multiple languages:

- `en` - English (default)
- `de` - German (Deutsch)
- `es` - Spanish (Español)

Language preference is saved to `localStorage.getItem('dqm_locale')`.

#### Debug Logging

Enable debug logging for troubleshooting:

```typescript
// Via localStorage
localStorage.setItem('dqm_debug', 'true');

// Or programmatically
import { logger } from '@crownpeak/dqm-react-component';
logger.setDebugMode(true);
```

### New TypeScript Types

```typescript
import type {
    // Existing types (unchanged)
    DQMSidebarProps,
    DQMConfig,
    OverlayConfig,
    
    // NEW in v1.2.0
    TranslationConfig,
    SummaryConfig,
    TranslationProgress,
    SummaryStats,
} from '@crownpeak/dqm-react-component';
```

### New localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dqm_translate_results_enabled` | boolean | false | Toggle translation |
| `dqm_target_language` | string | 'en' | Target language (ISO 639-1) |
| `dqm_ai_summary_enabled` | boolean | false | Toggle summary |
| `dqm_translation_mode` | 'fast'\|'full' | 'fast' | Translation mode |
| `dqm_openai_apiKey` | string | - | OpenAI API key |
| `dqm_openai_model` | string | 'gpt-4o-mini' | OpenAI model |
| `dqm_locale` | 'en'\|'de'\|'es' | 'en' | UI language |
| `dqm_debug` | boolean | false | Debug logging |

---

## v1.0.x → v1.1.0

**Release Date:** December 17, 2025

**Upgrade Time:** ~5 minutes (no breaking changes)

**Breaking Changes:** None ✅

### Overview

Version 1.1.0 adds new features while maintaining full backward compatibility:

- ✨ **Overlay Configuration** - Customize toolbar/overlay detection
- ✨ **Standalone Widget Bundle** - IIFE + ESM bundles for embedding
- ✨ **Enhanced `useDomPresence` Hook** - Better element position detection
- ✨ **`disableLogout` Config Option** - Hide logout when managed externally

### Step 1: Update Package

```bash
npm install @crownpeak/dqm-react-component@1.1.0
```

Or with Yarn:

```bash
yarn upgrade @crownpeak/dqm-react-component@1.1.0
```

### Step 2: Verify (No Changes Required)

Your existing code continues to work without modifications:

```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

// This works exactly as before
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
/>
```

### New Features (Optional)

#### Overlay Configuration

If you have toolbars or overlays that interfere with sidebar positioning:

```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        websiteId: '...',
        apiKey: '...',
        overlayConfig: {
            selector: '.my-toolbar',        // CSS selector for overlay
            validateIframe: true,           // Check iFrame contentWindow
            pollMs: 1000,                   // Polling interval (ms)
            manualOffset: {                 // Manual offset override
                position: 'top',
                pixels: 50,
            },
        },
    }}
/>
```

#### Disable Logout Button

If your app manages authentication externally:

```typescript
<DQMSidebar
    open={open}
    onClose={() => setOpen(false)}
    onOpen={() => setOpen(true)}
    config={{
        websiteId: '...',
        apiKey: '...',
        disableLogout: true,  // Hides the logout button
    }}
/>
```

#### Standalone Widget Bundle

For embedding on external sites without React:

```html
<!-- IIFE Bundle -->
<script src="https://unpkg.com/@crownpeak/dqm-react-component/dist/dqm-widget.iife.js"></script>
<script>
    window.initDQMWidget({
        websiteId: 'your-website-id',
        apiKey: 'your-api-key',
    });
</script>
```

See **[Widget Bundle Guide](./WIDGET-GUIDE.md)** for complete documentation.

### New TypeScript Types

```typescript
import type {
    // Existing types (unchanged)
    DQMSidebarProps,
    DQMConfig,
    
    // NEW in v1.1.0
    OverlayConfig,
    OverlayOffsetPosition,
    OverlayInfo,
    OverlayPosition,
} from '@crownpeak/dqm-react-component';
```

### New Hooks

```typescript
import { useOverlayResistant } from '@crownpeak/dqm-react-component';

// Returns overlay information for custom positioning
const overlayInfo = useOverlayResistant({
    selector: '.my-toolbar',
    validateIframe: true,
});
// overlayInfo.present: boolean
// overlayInfo.height: number
// overlayInfo.position: 'top' | 'bottom' | 'left' | 'right' | 'center'
// overlayInfo.contentOffset: { top, bottom, left, right }
```

---

## Troubleshooting

### Issue: Overlay not detected correctly

**Cause:** Cross-origin iFrame or complex DOM structure.

**Solution:** Use `manualOffset` configuration:

```typescript
overlayConfig: {
    selector: '.my-overlay',
    manualOffset: {
        position: 'top',
        pixels: 60,
    },
}
```

### Issue: Translation not working

**Cause:** Missing `translation.enabled` or invalid API key.

**Solution:** Verify configuration:

```typescript
config={{
    translation: {
        enabled: true,          // Must be true
        apiKey: 'sk-...',       // Valid OpenAI API key
        model: 'gpt-4o-mini',
        targetLanguage: 'de',
    },
}}
```

### Issue: TypeScript errors after upgrade

**Cause:** Missing type imports.

**Solution:** Update imports:

```typescript
import type {
    DQMSidebarProps,
    DQMConfig,
    OverlayConfig,       // v1.1.0+
    TranslationConfig,   // v1.2.0+
    SummaryConfig,       // v1.2.0+
} from '@crownpeak/dqm-react-component';
```

---

## See Also

- **[AI Features Guide](./AI-FEATURES.md)** - Complete AI documentation (v1.2.0+)
- **[Widget Bundle Guide](./WIDGET-GUIDE.md)** - Standalone widget documentation (v1.1.0+)
- **[Quick Start Guide](./QUICKSTART.md)** - Getting started
- **[API Reference](./API-REFERENCE.md)** - Full TypeScript API
- **[Examples](./EXAMPLES.md)** - Integration examples
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
