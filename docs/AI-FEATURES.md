The Crownpeak DQM React Component includes powerful AI-driven features to enhance the analysis experience through **automatic translation** and **intelligent summaries**.

## Table of Contents

- [Overview](#overview)
- [AI Translation](#ai-translation)
  - [Translation Flow](#translation-flow)
  - [OpenAI Backend](#openai-backend)
  - [Translation Modes](#translation-modes)
  - [Caching Strategy](#caching-strategy)
- [AI Summary](#ai-summary)
  - [Summary Generation Flow](#summary-generation-flow)
  - [Chunking Strategy](#chunking-strategy)
- [Configuration](#configuration)
- [localStorage Keys](#localstorage-keys)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## Overview

The AI features provide two main capabilities:

1. **🌐 Translation**: Automatically translate DQM analysis results (checkpoints, categories, topics) into the user's preferred language
2. **📝 Summary**: Generate AI-powered bullet-point summaries of the most critical quality issues

Both features use **OpenAI** (cloud-based) for fast, high-quality results.

| Feature | Capabilities |
|---------|--------------|
| **Translation** | ✅ Supported |
| **Summary** | ✅ Supported |
| **Speed** | ⚡ Fast (~2-5s) |
| **Browser Support** | All modern browsers |
| **Concurrent Requests** | ✅ Parallel (3 batches) |

---

## AI Translation

### Translation Flow

```mermaid
flowchart TD
    A[Analysis Completed] --> B{Translation Enabled?}
    B -->|No| Z[Display Original English]
    B -->|Yes| C[Detect Target Language]
    C --> D[Check Cache]
    D --> E{Cache Hit?}
    E -->|Yes| F[Use Cached Translation]
    E -->|No| G[Group by Category]
    G --> H[Parallel Batch Translation]
    H --> K[Merge Results]
    K --> L[Store in Cache]
    L --> M[Update UI]
    F --> M
    M --> Z
```

**Key Steps**:
1. **Analysis Completed**: DQM API returns English results
2. **Target Language Detection**: From i18n context (`en`, `de`, `es`)
3. **Cache Check**: IndexedDB lookup by checkpoint hash
4. **Translation**: Batch processing with progress tracking
5. **Cache Storage**: Persist to IndexedDB for future use
6. **UI Update**: Replace English text with translations

### OpenAI Backend

**Models Supported**:

| Model | Context Window | Recommended For |
|-------|----------------|-----------------|
| `gpt-5.2` | 1M tokens | 🌟 Default – Best performance & quality |
| `gpt-4.1-mini` | 1M tokens | Cost-effective alternative |
| `gpt-4.1` | 1M tokens | High quality GPT-4 |
| `gpt-4o-mini` | 128K tokens | Fast & cheap (legacy) |
| `gpt-4o` | 128K tokens | Higher quality (legacy) |

> **🚀 GPT-5.2** is the new default model with 1M token context window, enabling much larger translation batches and better quality.

#### GPT-5 vs GPT-4 Differences

The component automatically adapts to API differences between GPT-5 and GPT-4 models:

| Feature | GPT-5.x | GPT-4.x |
|---------|---------|---------|
| Token Parameter | `max_completion_tokens` | `max_tokens` |
| Structured Output | `json_schema` | `json_object` |
| System Role | `developer` | `system` |
| Reasoning Effort | ✅ Supported | ❌ Not available |
| Context Budget | 50,000 tokens | 12,000 tokens |

#### Reasoning Effort (GPT-5 Only)

GPT-5 models support a **Reasoning Effort** parameter that controls how deeply the model analyzes translations:

| Level | Description | Best For |
|-------|-------------|----------|
| `low` | Fast, straightforward translations | Simple content, high volume |
| `medium` | Balanced analysis (default) | Most use cases |
| `high` | Deep reasoning, highest accuracy | Technical content, quality-critical |

Configure via the **AI Settings** dialog or localStorage:

```typescript
localStorage.setItem('dqm_reasoning_effort', 'medium'); // 'low' | 'medium' | 'high'
```

> **Note:** Reasoning Effort is only visible in the UI when a GPT-5 model is selected.

**Setup**:

```typescript
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  return (
    <DQMSidebar
      open={true}
      onClose={() => {}}
      onOpen={() => {}}
      config={{
        apiKey: 'your-dqm-api-key',
        websiteId: 'your-website-id',
        translation: {
          enabledByDefault: true,
          computeBudgetMs: 15000, // 15 seconds timeout
        },
      }}
    />
  );
}
```

**API Key Configuration**:

```typescript
// Option 1: Via localStorage (before component mount)
localStorage.setItem('dqm_openai_apiKey', 'sk-...');

// Option 2: Via AISettingsDialog component (user enters key in UI)
// Users can configure via settings modal
```

**Environment Variables** (for build-time injection):

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_BASE_URL=https://api.openai.com/v1  # Optional, for custom endpoints
```

**Features**:
- ✅ JSON Mode with structured output (type-safe responses)
- ✅ Parallel batch translation (3 concurrent requests, 12 items per batch)
- ✅ Fast mode (~5s) and Full mode (~30s)
- ✅ Automatic retry with exponential backoff
- ✅ Rate limit handling (429 errors)

### Translation Modes

#### Fast Mode (Default)
- **Timeout**: 15 seconds (configurable via `computeBudgetMs`)
- **Behavior**: Partial results allowed
- **Use Case**: Quick translations, user doesn't want to wait
- **Result**: Most checkpoints translated, some may be skipped

```typescript
translation: {
  enabledByDefault: true,
  computeBudgetMs: 15000, // 15s
}
```

#### Full Mode
- **Timeout**: 120 seconds
- **Behavior**: Translate all checkpoints or fail
- **Use Case**: Comprehensive translations, accuracy > speed
- **Result**: All checkpoints translated or error shown

```typescript
translation: {
  enabledByDefault: true,
  computeBudgetMs: 120000, // 120s
}
```

**User Control**:
Users can switch between modes via the AI Settings dialog:
- Fast Mode: ⚡ Quick Translation (partial results OK)
- Full Mode: 🎯 Complete Translation (all or nothing)

### Caching Strategy

```mermaid
flowchart LR
    A[Checkpoint] --> B{In-Memory Cache?}
    B -->|Hit| C[Return Cached]
    B -->|Miss| D{IndexedDB Cache?}
    D -->|Hit| E[Load to Memory]
    D -->|Miss| F[Translate via AI]
    F --> G[Store in IndexedDB]
    G --> H[Store in Memory]
    E --> C
    H --> C
```

**Cache Layers**:

1. **In-Memory Cache** (Fastest)
   - Lifetime: Current session only
   - Scope: Per `assetId`
   - Storage: Redux store (`translatedData`)
   - Cleared: On page reload or logout

2. **IndexedDB Cache** (Persistent)
   - Database: `DQMTranslationCache`
   - Stores:
     - `checkpoints`: Translated checkpoint objects (key: `${hash}-${lang}`)
     - `labels`: Category/Topic labels (key: `label-${text}-${lang}`)
   - Hash Algorithm: FNV-1a (fast, deterministic)
   - Lifetime: Permanent (until manually cleared)
   - Size: ~10MB typical, can grow to 50MB+

**Cache Key Format**:
```typescript
// Checkpoint cache key
`${fnv1aHash(checkpoint.topic + checkpoint.description)}-${targetLanguage}`
// Example: "a1b2c3d4-de"

// Label cache key
`label-${originalText}-${targetLanguage}`
// Example: "label-Performance-de"
```

**Cache Management**:

```typescript
// Clear all translation cache
localStorage.removeItem('dqm_translation_cache_checkpoints');
localStorage.removeItem('dqm_translation_cache_labels');

// Or via IndexedDB API
indexedDB.deleteDatabase('DQMTranslationCache');
```

**Deduplication**:
- Identical checkpoints (same hash) across multiple analyses → translated once, reused
- Reduces API calls and improves speed
- Example: "Image missing alt attribute" appears in 10 analyses → cached once

---

## AI Summary

### Summary Generation Flow

```mermaid
flowchart TD
    A[Analysis Completed] --> B{Summary Enabled?}
    B -->|No| Z[Skip Summary]
    B -->|Yes| C[Extract Failed Checkpoints]
    C --> D{Count Failed?}
    D -->|< 5| E[Single Prompt]
    D -->|5-20| F[Chunk by Category]
    D -->|> 20| G[Chunk by Priority]
    E --> H[Call OpenAI API]
    F --> I[Call OpenAI API per Chunk]
    G --> I
    H --> J{Response OK?}
    I --> J
    J -->|Yes| K[Parse Bullet Points]
    J -->|No| L[Retry with Fallback]
    L --> M{Fallback Level?}
    M -->|1| O[Try Tiny Subset]
    M -->|2| N[Try Single Item]
    M -->|3| P[Fail Gracefully]
    N --> J
    O --> J
    K --> Q[Cache Summary]
    Q --> R[Display in Card]
    P --> S[Show Error Message]
```

**Key Steps**:
1. **Extract Failed Checkpoints**: Filter to `checkpoint.failed === true`
2. **Count & Chunk**: Divide into manageable chunks (5-20 per chunk)
3. **OpenAI API Call**: Use `gpt-4o-mini` with JSON mode
4. **Retry Logic**: Exponential backoff with fallback strategies
5. **Parse Results**: Extract `<li>` bullet points
6. **Cache**: Store in-memory per `assetId`
7. **Display**: Show in AISummaryCard component

### Chunking Strategy

```mermaid
graph TD
    A[Failed Checkpoints] --> B{Total Count?}
    B -->|< 5| C[Strategy: Single]
    B -->|5-20| D[Strategy: Chunk by Category]
    B -->|20-50| E[Strategy: Chunk by Priority]
    B -->|> 50| F[Strategy: Tiny Subset]
    
    C --> G[Prompt: All in one]
    D --> H[Prompt: Per category]
    E --> I[Prompt: Top 20 only]
    F --> J[Prompt: Top 5 critical]
    
    G --> K[OpenAI API]
    H --> K
    I --> K
    J --> K
```

**Chunking Sizes**:
- **Single**: 1-4 checkpoints → One prompt
- **Chunk**: 5-20 checkpoints → Split by category (max 8 per chunk)
- **Tiny**: 20+ checkpoints → Top 5 most critical only
- **Fail**: > 50 checkpoints → Skip summary (too large)

> **💡 GPT-5 Advantage**: With GPT-5.2's 1M token context window, the component uses a 50,000 token context budget (vs 12,000 for GPT-4o), enabling larger batches and fewer API calls.

**Prompt Template**:

```typescript
const prompt = `Summarize the following web quality issues in ${targetLanguage}. 
Provide 3-5 bullet points highlighting the most critical problems.
Format each point as an HTML <li> element.

Issues:
${checkpoints.map(cp => `- ${cp.topic}: ${cp.description}`).join('\n')}`;
```

**Response Format** (JSON Mode):

```json
{
  "bullets": [
    "<li>Missing alt text on 23 images impacts accessibility</li>",
    "<li>5 broken links found, affecting user navigation</li>",
    "<li>Performance issues: 3 images exceed 1MB</li>"
  ]
}
```

**Stats Tracking**:

```typescript
interface SummaryStats {
  chunked: boolean;           // Was chunking used?
  chunkCount: number;         // Number of chunks (1-5)
  totalFailed: number;        // Total failed checkpoints
  attempts: number;           // API call attempts (incl. retries)
  emptyResponses: number;     // Empty API responses
  fallbackUsed: 'none' | 'chunk' | 'single' | 'tiny' | 'fail';
  durationMs: number;         // Total generation time
}
```

**Configuration**:

```typescript
summary: {
  timeoutMs: 45000,           // 45 seconds timeout
}
```

> **Note:** Summary is enabled/disabled via the AI Settings dialog or localStorage (`dqm_ai_summary_enabled`).

---

## Configuration

### DQMConfig Interface

```typescript
interface DQMConfig {
  // ... other config options
  
  /** AI Translation Configuration */
  translation?: {
    /** Enable translation by default */
    enabledByDefault?: boolean;      // Default: false
    
    /** Compute budget in milliseconds (timeout) */
    computeBudgetMs?: number;        // Default: 15000 (Fast mode)
  };
  
  /** AI Summary Configuration */
  summary?: {
    /** Summary generation timeout in milliseconds */
    timeoutMs?: number;              // Default: 45000
  };
}
```

> **Note:** The OpenAI model is configured via localStorage (`dqm_openai_model`) or the AI Settings dialog, not via `DQMConfig`. See [localStorage Keys](#localstorage-keys).

**Example: Full AI Configuration**

```typescript
<DQMSidebar
  open={true}
  onClose={() => {}}
  onOpen={() => {}}
  config={{
    apiKey: 'your-dqm-api-key',
    websiteId: 'your-website-id',
    
    // AI Translation
    translation: {
      enabledByDefault: true,
      computeBudgetMs: 30000,  // 30s for Full mode
    },
    
    // AI Summary
    summary: {
      timeoutMs: 60000,  // 60s for complex analyses
    },
  }}
/>
```

---

## localStorage Keys

The AI features store configuration in `localStorage`:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dqm_translate_results_enabled` | `'true' \| 'false'` | `'false'` | Translation toggle |
| `dqm_translate_results_mode` | `'fast' \| 'full'` | `'fast'` | Translation mode |
| `dqm_ai_summary_enabled` | `'true' \| 'false'` | `'true'` | Summary toggle |
| `dqm_openai_apiKey` | `string` | `null` | OpenAI API key |
| `dqm_openai_model` | `string` | `'gpt-5.2'` | OpenAI model name |
| `dqm_reasoning_effort` | `'low' \| 'medium' \| 'high'` | `'medium'` | GPT-5 reasoning depth |
| `dqm_openai_baseUrl` | `string` | `'https://api.openai.com/v1'` | OpenAI base URL |

**Access Pattern**:

```typescript
import { getLocalStorageItem, setLocalStorageItem } from './utils/localStorage';

// Get translation setting
const translationEnabled = getLocalStorageItem('dqm_translate_results_enabled') === 'true';

// Set OpenAI API key
setLocalStorageItem('dqm_openai_apiKey', 'sk-...');
```

---

## Performance

### Translation Speed

| Checkpoint Count | Time (Fast Mode) | Time (Full Mode) |
|------------------|------------------|------------------|
| 10 | ~2-3s | ~5-8s |
| 50 | ~5-8s | ~15-25s |
| 100 | ~10-15s | ~30-60s |

**Notes**:
- Times assume good network connection (50ms latency)
- Cached checkpoints: instant (0ms)

### Summary Speed

| Checkpoint Count | Time (OpenAI) | Fallback Attempts |
|------------------|---------------|-------------------|
| 5 | ~1-2s | 0 (single prompt) |
| 20 | ~3-5s | 0-1 (chunked) |
| 50 | ~8-12s | 1-2 (tiny subset) |
| 100+ | N/A | Fails (too large) |

### Cost Estimation (OpenAI)

#### GPT-5.2 (Default)

Based on `gpt-5.2` pricing (~$0.10/1M input tokens, ~$0.40/1M output tokens):

| Operation | Average Tokens | Cost per Call |
|-----------|----------------|---------------|
| Translate 1 checkpoint | ~200 input, ~100 output | ~$0.00006 |
| Translate 50 checkpoints | ~10k input, ~5k output | ~$0.003 |
| Summary (5 issues) | ~500 input, ~200 output | ~$0.00013 |
| Summary (20 issues) | ~2k input, ~500 output | ~$0.0004 |

**Monthly costs** (assuming 1000 analyses/month with 20 checkpoints each):
- Translation only: ~$3.00/month
- Summary only: ~$0.40/month
- Both: ~$3.40/month

#### GPT-4o-mini (Legacy)

Based on `gpt-4o-mini` pricing (~$0.15/1M input tokens, ~$0.60/1M output tokens):

| Operation | Average Tokens | Cost per Call |
|-----------|----------------|---------------|
| Translate 1 checkpoint | ~200 input, ~100 output | ~$0.00009 |
| Translate 50 checkpoints | ~10k input, ~5k output | ~$0.0045 |
| Summary (5 issues) | ~500 input, ~200 output | ~$0.0002 |
| Summary (20 issues) | ~2k input, ~500 output | ~$0.0006 |

**Monthly costs** (assuming 1000 analyses/month with 20 checkpoints each):
- Translation only: ~$4.50/month
- Summary only: ~$0.60/month
- Both: ~$5.10/month

---

## Troubleshooting

### Translation Not Working

**Problem**: Translation toggle enabled but results still in English

**Solutions**:
1. **Check OpenAI API Key**:
   ```typescript
   const apiKey = localStorage.getItem('dqm_openai_apiKey');
   console.log('API Key set:', !!apiKey);
   ```
   - Missing key → Add via `AISettingsDialog` or `localStorage.setItem()`
   - Invalid key → Check OpenAI dashboard for correct key

2. **Check Translation Enabled**:
   ```typescript
   const enabled = localStorage.getItem('dqm_translate_results_enabled');
   console.log('Translation enabled:', enabled === 'true');
   ```

3. **Check Console for Errors**:
   ```bash
   # Enable debug logging
   logger.setDebugMode(true);
   ```

### Translation Timeout

**Problem**: "Translation timeout" error after 15 seconds

**Solutions**:

1. **Increase Timeout** (Fast → Full mode):
   ```typescript
   translation: {
     computeBudgetMs: 120000, // 2 minutes
   }
   ```

2. **Reduce Checkpoint Count**:
   - Fewer categories → faster translation
   - Or use Fast mode and accept partial results

3. **Check Network**:
   ```bash
   # Test OpenAI API connectivity
   curl https://api.openai.com/v1/models -H "Authorization: Bearer sk-..."
   ```

### Summary Generation Failed

**Problem**: "Summary generation failed" error

**Solutions**:

1. **Check OpenAI API Quota**:
   - Visit OpenAI dashboard → Usage
   - Error 429 (rate limit) → Wait or upgrade plan
   - Error 401 (invalid key) → Check API key

2. **Check Too Many Checkpoints**:
   - > 50 failed checkpoints may fail
   - Solution: Summary auto-switches to "tiny subset" (top 5)

3. **Increase Timeout**:
   ```typescript
   summary: {
     timeoutMs: 90000, // 90 seconds
   }
   ```

4. **Check Console Logs**:
   ```typescript
   logger.setDebugMode(true);
   // Look for "Summary: failed" messages
   ```

### OpenAI API Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Invalid API key | Check key in localStorage or OpenAI dashboard |
| 429 | Rate limit exceeded | Wait or upgrade OpenAI plan |
| 500 | OpenAI server error | Retry later, or check OpenAI status page |
| 503 | Service unavailable | Temporary outage, retry in 5 minutes |

---

## Advanced Topics

### Custom Model Configuration

**OpenAI Custom Model** (via localStorage):

```typescript
// Set model via localStorage before component mounts
localStorage.setItem('dqm_openai_model', 'gpt-4o');  // Higher quality than gpt-4.1-mini

// Or users can configure via the AI Settings dialog in the UI
```

### Translation Cache Clearing

**Clear all AI caches**:

```typescript
// Clear translation cache
indexedDB.deleteDatabase('DQMTranslationCache');

// Clear localStorage settings
localStorage.removeItem('dqm_translate_results_enabled');
localStorage.removeItem('dqm_openai_apiKey');
// ... (see localStorage Keys table)
```

### Custom Summary Formatting

The summary generates HTML `<li>` elements. To customize styling:

```css
/* Target summary bullet points */
.dqm-summary-card li {
  color: #333;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.6;
}

/* Highlight critical issues */
.dqm-summary-card li:first-child {
  font-weight: bold;
  color: #d32f2f;
}
```

---

## Related Documentation

- [API Reference](API-REFERENCE.md) - Full TypeScript API documentation
- [Examples](EXAMPLES.md) - Code examples with AI features
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [GitHub Wiki](https://github.com/Crownpeak/dqm-react-component/wiki/AI-Features) - Interactive documentation

---

## Need Help?

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Crownpeak/dqm-react-component/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Crownpeak/dqm-react-component/discussions)
- 📧 **Email**: support@crownpeak.com
- 📚 **Full Docs**: [GitHub Wiki](https://github.com/Crownpeak/dqm-react-component/wiki)
