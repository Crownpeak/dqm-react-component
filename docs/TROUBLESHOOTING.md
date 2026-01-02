# Troubleshooting Guide

Solutions for common issues with `@crownpeak/dqm-react-component`.

## Table of Contents
- [FAQ](#faq)
- [Error Messages](#error-messages)
- [AI Features Issues](#ai-features-issues)
- [Browser Compatibility](#browser-compatibility)
- [Performance Issues](#performance-issues)
- [Debugging Tools](#debugging-tools)

## FAQ

### General

#### Q: Sidebar not showing after installation?

**A:** Check these common issues:

1. **Authentication**: Verify `apiKey` and `websiteId` are set
2. **Component State**: Ensure `open` prop is set to `true` or FAB button is clicked
3. **CSS Conflicts**: Check if global styles hide or break sidebar
4. **Browser Console**: Look for errors in console

```typescript
// Verify authentication
console.log('API Key:', localStorage.getItem('dqm_apiKey'));
console.log('Website ID:', localStorage.getItem('dqm_websiteID'));

// Force open sidebar
<DQMSidebar
    open={true}  // Force open for testing
    onOpen={...}
    onClose={...}
/>
```

---

#### Q: How do I know which authentication mode is active?

**A:** Use `onAuthSuccess` callback to inspect session type:

```typescript
<DQMSidebar
    open={open}
    onOpen={() => setOpen(true)}
    onClose={() => setOpen(false)}
    onAuthSuccess={(credentials) => {
        console.log('Session Type:', credentials.sessionType);
        // 'direct' = Direct DQM API calls
        // 'backend' = Proxy via backend server
    }}
/>
```

---

#### Q: Can I use DQM without React?

**A:** Yes! Use the standalone widget bundle (IIFE or ESM):

```html
<script src="https://unpkg.com/@crownpeak/dqm-react-component/dist/dqm-widget.iife.js"></script>
<script>
    window.DQMWidget.loadDQMWidget({
        config: {
            websiteId: 'your-website-id',
            apiKey: 'your-api-key',
        }
    });
</script>
```

See **[Widget Guide](./WIDGET-GUIDE.md)** for details.

---

#### Q: How do I disable DQM in production?

**A:** Use the `disabled` config property:

```typescript
<DQMSidebar
    open={open}
    onOpen={...}
    onClose={...}
    config={{
        disabled: process.env.NODE_ENV === 'production',
    }}
/>
```

Or conditionally render:

```typescript
{process.env.NODE_ENV === 'development' && (
    <DQMSidebar open={open} onOpen={...} onClose={...} />
)}
```

---

#### Q: Can I customize sidebar styles?

**A:** No, the sidebar uses Shadow DOM for style isolation. Styles are bundled and cannot be overridden. This ensures consistent rendering across all environments.

---

### AI Features

#### Q: Why is translation not working?

**A:** Check these requirements:

1. **Enabled**: `translation.enabled` must be `true`
2. **Backend**: Verify backend configuration
   - **OpenAI**: Valid `translation.apiKey` (starts with `sk-`)
   - **WebLLM**: WebGPU support required (Chrome 113+)
3. **Model**: Check model name is correct
4. **Target Language**: Valid ISO 639-1 code (e.g., `'de'`, `'es'`, `'fr'`)

```typescript
config={{
    translation: {
        enabled: true,              // MUST be true
        backend: 'openai',
        apiKey: 'sk-...',           // Valid OpenAI API key
        model: 'gpt-4o-mini',       // Correct model name
        targetLanguage: 'de',       // ISO 639-1 code
        mode: 'fast',
    },
}}
```

**Debug:**
```typescript
// Check localStorage settings
console.log('Translation Enabled:', localStorage.getItem('dqm_translate_results_enabled'));
console.log('AI Backend:', localStorage.getItem('dqm_ai_backend'));
console.log('Target Language:', localStorage.getItem('dqm_target_language'));
```

---

#### Q: WebLLM not loading?

**A:** WebLLM requires:

1. **WebGPU Support**: Chrome 113+ or Edge 113+
2. **GPU Memory**: 4GB+ recommended for larger models
3. **HTTPS**: WebGPU requires secure context (localhost or HTTPS)

**Check WebGPU Support:**
```javascript
if ('gpu' in navigator) {
    console.log('WebGPU supported!');
} else {
    console.error('WebGPU not supported. Use OpenAI backend instead.');
}
```

**Fallback to OpenAI:**
```typescript
const hasWebGPU = 'gpu' in navigator;

config={{
    translation: {
        enabled: true,
        backend: hasWebGPU ? 'webllm' : 'openai',  // Auto-fallback
        apiKey: !hasWebGPU ? 'sk-...' : undefined,
        model: hasWebGPU 
            ? 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
            : 'gpt-4o-mini',
        targetLanguage: 'de',
        mode: 'fast',
    },
}}
```

---

#### Q: Translation taking too long?

**A:** Try these optimizations:

1. **Switch to Fast Mode**: `mode: 'fast'` (15s timeout vs 120s for `'full'`)
2. **Use OpenAI Backend**: Much faster than WebLLM (~2-5s vs 30-120s)
3. **Smaller WebLLM Model**: Use `SmolLM2-360M-Instruct-q4f16_1-MLC` (fastest local model)

```typescript
// Optimize for speed
translation: {
    enabled: true,
    backend: 'openai',          // Fastest
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',       // Fast + cheap
    targetLanguage: 'de',
    mode: 'fast',               // 15s timeout
}
```

---

#### Q: Summary generation failing?

**A:** Check these:

1. **OpenAI API Key**: Summary requires valid OpenAI key (WebLLM not supported)
2. **Model**: Ensure model supports JSON mode (`gpt-4o-mini`, `gpt-4o`, `gpt-4.1`)
3. **Timeout**: Increase timeout if analysis has many checkpoints

```typescript
config={{
    summary: {
        enabled: true,
        backend: 'openai',          // Only OpenAI supported
        apiKey: 'sk-...',           // Valid key
        model: 'gpt-4o-mini',       // Supported model
        timeoutMs: 60000,           // Increase timeout for large analyses
    },
}}
```

---

#### Q: How do I clear AI cache?

**A:** Clear IndexedDB cache:

```javascript
// Clear translation cache
indexedDB.deleteDatabase('DQMTranslationCache');

// Reload page
window.location.reload();
```

Or use browser DevTools:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "IndexedDB" → "DQMTranslationCache"
4. Right-click → "Delete database"

---

### Internationalization

#### Q: How do I change sidebar language?

**A:** Set `dqm_locale` in localStorage:

```typescript
// Change to German
localStorage.setItem('dqm_locale', 'de');

// Reload to apply
window.location.reload();
```

Or use i18next directly:

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

**Supported Languages:** `en`, `de`, `es`

---

#### Q: How do I add custom translations?

**A:** Provide custom `i18n.resources` in config:

```typescript
<DQMSidebar
    open={open}
    onOpen={...}
    onClose={...}
    config={{
        i18n: {
            resources: {
                de: {
                    sidebar: {
                        title: 'Meine benutzerdefinierte Übersetzung',
                    },
                },
            },
        },
    }}
/>
```

**Available Namespaces:**
- `sidebar` - Sidebar UI strings
- `auth` - Authentication strings
- `errors` - Error messages
- `ai` - AI feature strings

---

## Error Messages

### Authentication Errors

#### `AUTH_001: Invalid API Key`

**Cause:** API key is invalid or expired.

**Solution:**
1. Verify API key is correct (check for typos)
2. Check API key hasn't been revoked in Crownpeak DQM admin
3. Ensure API key has access to specified website ID

```typescript
// Verify credentials
console.log('API Key:', localStorage.getItem('dqm_apiKey'));
console.log('Website ID:', localStorage.getItem('dqm_websiteID'));
```

---

#### `AUTH_002: Website ID Not Found`

**Cause:** Website ID doesn't exist or API key doesn't have access.

**Solution:**
1. Verify website ID is correct
2. Check API key has permission for this website
3. Contact Crownpeak support if issue persists

---

#### `AUTH_003: Backend Server Unreachable`

**Cause:** Backend server (OAuth2 proxy) is down or URL is incorrect.

**Solution:**
1. Verify `authBackendUrl` is correct
2. Check backend server is running
3. Check CORS configuration on backend

```typescript
// Test backend connectivity
fetch('https://your-backend.com/api/auth/session')
    .then(res => res.json())
    .then(data => console.log('Backend reachable:', data))
    .catch(err => console.error('Backend unreachable:', err));
```

---

### Translation Errors

#### `TRANSLATION_001: OpenAI API Key Invalid`

**Cause:** OpenAI API key is invalid or quota exceeded.

**Solution:**
1. Verify API key is correct (starts with `sk-`)
2. Check OpenAI account has credits
3. Verify API key hasn't been revoked

```typescript
// Test OpenAI API key
fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer sk-...` }
})
    .then(res => res.json())
    .then(data => console.log('OpenAI API working:', data))
    .catch(err => console.error('OpenAI API error:', err));
```

---

#### `TRANSLATION_002: WebLLM Model Download Failed`

**Cause:** Network error or insufficient storage for model download.

**Solution:**
1. Check internet connection
2. Ensure 1-3GB free storage (depending on model)
3. Try smaller model (`SmolLM2-360M-Instruct-q4f16_1-MLC`)

```typescript
// Use smaller model
translation: {
    backend: 'webllm',
    model: 'SmolLM2-360M-Instruct-q4f16_1-MLC',  // Only 500MB
    targetLanguage: 'de',
}
```

---

#### `TRANSLATION_003: Translation Timeout`

**Cause:** Translation took longer than configured timeout.

**Solution:**
1. Switch from `'full'` to `'fast'` mode
2. Use OpenAI backend (faster than WebLLM)
3. Reduce number of checkpoints (if applicable)

```typescript
// Optimize for speed
translation: {
    backend: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
    targetLanguage: 'de',
    mode: 'fast',  // 15s timeout instead of 120s
}
```

---

### Summary Errors

#### `SUMMARY_001: OpenAI API Error`

**Cause:** OpenAI API request failed (rate limit, quota, network).

**Solution:**
1. Check OpenAI account credits
2. Verify API key permissions
3. Check rate limits (tier-based)

---

#### `SUMMARY_002: Chunking Strategy Failed`

**Cause:** Too many checkpoints, chunking strategy couldn't complete.

**Solution:**
1. Increase timeout: `summary.timeoutMs: 90000`
2. Reduce checkpoint count (filter failed only)
3. Use simpler model (`gpt-4o-mini` instead of `gpt-4o`)

---

### Analysis Errors

#### `ANALYSIS_001: DQM API Timeout`

**Cause:** DQM API took too long to analyze HTML.

**Solution:**
1. Reduce HTML complexity (remove unnecessary elements)
2. Check HTML size (<1MB recommended)
3. Try again (transient error)

---

#### `ANALYSIS_002: Invalid HTML`

**Cause:** HTML contains syntax errors preventing analysis.

**Solution:**
1. Validate HTML with W3C Validator
2. Check for unclosed tags
3. Remove invalid characters

---

## AI Features Issues

### Performance Comparison

| Issue | OpenAI Backend | WebLLM Backend | Solution |
|-------|----------------|----------------|----------|
| Slow translation | 2-5s (50 checkpoints) | 30-120s (50 checkpoints) | Use OpenAI for speed, WebLLM for privacy |
| High cost | ~$0.001-0.003 per checkpoint | Free | Use WebLLM to eliminate API costs |
| Privacy concerns | Data sent to OpenAI | 100% local | Use WebLLM for sensitive data |
| Offline support | ❌ Requires internet | ✅ Works offline (after model download) | Use WebLLM for offline scenarios |
| Model quality | Very high (GPT-4o) | Good (Llama-3.2) | Use OpenAI for best quality |

### Caching Issues

#### Cache Not Working?

**Symptoms:** Translation re-runs every time even with same checkpoints.

**Cause:** IndexedDB cache disabled or cleared.

**Solution:**
1. Verify IndexedDB works in browser
2. Check browser storage quota
3. Enable IndexedDB cache in config

```typescript
// Check IndexedDB support
if ('indexedDB' in window) {
    console.log('IndexedDB supported');
} else {
    console.error('IndexedDB not supported - caching disabled');
}
```

---

#### Cache Taking Too Much Space?

**Symptoms:** Browser storage quota exceeded.

**Solution:** Clear old cache entries:

```javascript
// Clear translation cache
indexedDB.deleteDatabase('DQMTranslationCache');

// Cache will rebuild on next translation
```

---

## Browser Compatibility

### WebGPU Support Matrix

| Browser | Version | WebGPU Support | WebLLM Compatible |
|---------|---------|----------------|-------------------|
| Chrome | 113+ | ✅ Yes | ✅ Yes |
| Edge | 113+ | ✅ Yes | ✅ Yes |
| Brave | 1.50+ | ✅ Yes | ✅ Yes |
| Firefox | ❌ No | ❌ No (experimental flag) | ❌ No |
| Safari | ❌ No | ❌ No (in development) | ❌ No |

**Recommendation:** Use OpenAI backend for Firefox/Safari, WebLLM for Chrome/Edge/Brave.

---

### React Version Compatibility

| React Version | Compatible | Notes |
|---------------|------------|-------|
| 18.x | ✅ Yes | Recommended |
| 17.x | ⚠️ Partial | Some features may not work |
| 16.x | ❌ No | Not supported |

---

### Material-UI Version Compatibility

| MUI Version | Compatible | Notes |
|-------------|------------|-------|
| 5.x | ✅ Yes | Recommended |
| 4.x | ❌ No | Not supported |

---

## Performance Issues

### Sidebar Loading Slowly?

**Symptoms:** Sidebar takes 5+ seconds to open.

**Possible Causes:**
1. Large HTML document (>1MB)
2. Slow DQM API response
3. AI features enabled with slow backend

**Solutions:**

```typescript
// 1. Optimize HTML before analysis
const optimizedHtml = document.documentElement.outerHTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');    // Remove styles

// 2. Disable AI features for faster loading
<DQMSidebar
    open={open}
    onOpen={...}
    onClose={...}
    config={{
        websiteId: '...',
        apiKey: '...',
        // translation: { enabled: false },  // Disable for faster loading
        // summary: { enabled: false },
    }}
/>

// 3. Use fast mode for AI translation
translation: {
    enabled: true,
    backend: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
    targetLanguage: 'de',
    mode: 'fast',  // 15s timeout instead of 120s
}
```

---

### High Memory Usage?

**Symptoms:** Browser tab uses 1GB+ memory.

**Possible Causes:**
1. WebLLM model loaded in memory (1-3GB)
2. Large IndexedDB cache
3. Many cached highlight renderings

**Solutions:**

```typescript
// 1. Use smaller WebLLM model
translation: {
    backend: 'webllm',
    model: 'SmolLM2-360M-Instruct-q4f16_1-MLC',  // 500MB vs 1.5GB
    targetLanguage: 'de',
}

// 2. Clear cache periodically
indexedDB.deleteDatabase('DQMTranslationCache');

// 3. Use OpenAI backend (no local model)
translation: {
    backend: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
    targetLanguage: 'de',
}
```

---

## Debugging Tools

### Enable Debug Logging

```typescript
// Method 1: Via localStorage
localStorage.setItem('dqm_debug', 'true');
window.location.reload();

// Method 2: Via logger (if using library export)
import { logger } from '@crownpeak/dqm-react-component';
logger.setDebugMode(true);
```

**Log Format:**
```
[DQM] [DEBUG] Analysis started
[DQM] [WARN] Translation timeout (15s)
[DQM] [ERROR] API request failed: 401 Unauthorized
```

---

### Inspect localStorage

```javascript
// View all DQM settings
Object.keys(localStorage)
    .filter(key => key.startsWith('dqm_'))
    .forEach(key => {
        console.log(key, '=', localStorage.getItem(key));
    });
```

**Expected Keys:**
- `dqm_apiKey` - DQM API key
- `dqm_websiteID` - Website ID
- `dqm_translate_results_enabled` - Translation toggle
- `dqm_ai_backend` - AI backend ('openai' | 'webllm')
- `dqm_target_language` - Target language
- `dqm_ai_summary_enabled` - Summary toggle
- `dqm_locale` - UI language
- `dqm_debug` - Debug mode

---

### Inspect IndexedDB

1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "IndexedDB" → "DQMTranslationCache"
4. View cached translations

**Cache Structure:**
```javascript
{
    key: 'fnv1a_hash_of_checkpoint',
    value: {
        originalText: 'Original checkpoint description',
        translatedText: 'Übersetzter Checkpoint-Text',
        targetLanguage: 'de',
        timestamp: 1234567890,
    }
}
```

---

### Network Inspection

**DQM API Calls:**
1. Open DevTools (F12) → "Network" tab
2. Filter by "dqm" or "api.crownpeak.net"
3. Check request/response:
   - **POST /assets**: HTML analysis request
   - **GET /assets/{id}**: Poll for analysis result
   - **GET /assets/{id}/pagehighlight/{checkpointId}**: Fetch highlighted HTML

**OpenAI API Calls:**
1. Filter by "api.openai.com"
2. Check requests:
   - **POST /v1/chat/completions**: Translation or summary request
   - Response should have `choices[0].message.content`

---

### Redux DevTools

Install Redux DevTools Extension:
- [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

**Inspect State:**
1. Open DevTools → "Redux" tab
2. View state tree:
   - `auth` - Authentication state
   - `ai` - AI translation/summary state
   - `highlight` - Error highlight navigation
   - `locale` - UI language

---

### React DevTools

Install React DevTools Extension:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Inspect Components:**
1. Open DevTools → "Components" tab
2. Find `DQMSidebar` component
3. View props and state

---

## Getting Help

### Before Opening an Issue

1. **Enable Debug Logging**: `localStorage.setItem('dqm_debug', 'true')`
2. **Check Browser Console**: Look for error messages
3. **Inspect Network Tab**: Verify API calls are successful
4. **Review localStorage**: Ensure credentials are set
5. **Test in Incognito**: Rule out extension conflicts

### Include in Bug Reports

- **Browser**: Chrome 120.0.6099.109
- **React Version**: 18.2.0
- **MUI Version**: 5.14.0
- **Component Version**: 1.1.0
- **Error Message**: Full error from console
- **Steps to Reproduce**: Minimal code example
- **Expected vs Actual**: What you expected vs what happened

---

## See Also

- **[Examples](./EXAMPLES.md)** - Integration examples
- **[AI Features Guide](./AI-FEATURES.md)** - AI documentation
- **[API Reference](./API-REFERENCE.md)** - TypeScript API
- **[Migration Guide](./MIGRATION-GUIDE.md)** - Upgrade from v1.0 to v1.1
- **[GitHub Issues](https://github.com/e-Spirit/crownpeak-dqm-react-component/issues)** - Report bugs
