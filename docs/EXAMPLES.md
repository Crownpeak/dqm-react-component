# Example Usage

This directory contains example implementations of the `@crownpeak/dqm-react-component`.

## Basic React App Example

```tsx
import React, {useState} from 'react';
import {DQMSidebar} from '@crownpeak/dqm-react-component';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Set DQM credentials (e.g., from environment variables)
    React.useEffect(() => {
        localStorage.setItem('dqm_apiKey', process.env.REACT_APP_DQM_API_KEY);
        localStorage.setItem('dqm_websiteID', process.env.REACT_APP_DQM_WEBSITE_ID);
    }, []);

    return (
        <div>
            <h1>My Application with DQM</h1>
            <p>This page is monitored by Crownpeak DQM for quality assurance.</p>

            <DQMSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpen={() => setSidebarOpen(true)}
            />
        </div>
    );
}

export default App;
```

## Next.js Example

```tsx
// pages/_app.tsx
import type {AppProps} from 'next/app';
import {useEffect, useState} from 'react';
import {DQMSidebar} from '@crownpeak/dqm-react-component';
import {createTheme} from '@mui/material/styles';

const theme = createTheme();

function MyApp({Component, pageProps}: AppProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dqm_apiKey', process.env.NEXT_PUBLIC_DQM_API_KEY!);
            localStorage.setItem('dqm_websiteID', process.env.NEXT_PUBLIC_DQM_WEBSITE_ID!);
        }
    }, []);

    return (
        <>
            <Component {...pageProps} />
            <DQMSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpen={() => setSidebarOpen(true)}
            />
        </>
    );
}

export default MyApp;
```

## TypeScript Example with Custom Configuration

```tsx
import React, { useState, useCallback } from 'react';
import { DQMSidebar, ErrorBoundary } from '@crownpeak/dqm-react-component';
import type { DQMSidebarProps } from '@crownpeak/dqm-react-component';

interface DQMConfig {
  apiKey: string;
  websiteId: string;
  enabled: boolean;
}

const config: DQMConfig = {
  apiKey: process.env.REACT_APP_DQM_API_KEY!,
  websiteId: process.env.REACT_APP_DQM_WEBSITE_ID!,
  enabled: process.env.NODE_ENV === 'production'
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (config.enabled) {
      localStorage.setItem('dqm_apiKey', config.apiKey);
      localStorage.setItem('dqm_websiteID', config.websiteId);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (!config.enabled) {
    return <div>DQM is disabled in this environment</div>;
  }

  return (
    <ErrorBoundary>
      <div>
        <h1>App with DQM Quality Monitoring</h1>
        <DQMSidebar
          open={sidebarOpen}
          onClose={handleClose}
          onOpen={handleOpen}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
```

## Conditional Rendering (Development Only)

```tsx
import React from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div>
      <h1>My App</h1>
      
      {/* Only show DQM in development */}
      {isDevelopment && (
        <DQMSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
}
```

## With Custom Button Trigger

```tsx
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { Button } from '@mui/material';
import { Assessment } from '@mui/icons-material';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <header>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => setSidebarOpen(true)}
        >
          Quality Check
        </Button>
      </header>

      <main>
        <h1>Content</h1>
      </main>

      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
    </div>
  );
}
```

## With Overlay/Toolbar Configuration

Use `overlayConfig` to offset the sidebar when toolbars or overlays are present.

### Auto-Detection (Toolbar Selector)

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DQMSidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      onOpen={() => setSidebarOpen(true)}
      config={{
        overlayConfig: {
          // Example toolbar anchored to the top edge
          selector: '.preview-toolbar',
          validateIframe: false
        }
      }}
    />
  );
}
```
### Auto-Detection (Custom Selector)

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        overlayConfig: {
          selector: 'iframe#my-overlay',
        }
      }}
    />
  );
}
```

### Custom Selector

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        overlayConfig: {
          // Custom selector for your admin toolbar
          selector: '.admin-toolbar-header',
          // Disable iFrame validation for non-iFrame elements
          validateIframe: false,
        }
      }}
    />
  );
}
```

### Manual Offset (for Cross-Origin iFrames)

When the overlay is a cross-origin iFrame that fills the entire screen but has
a smaller internal toolbar, auto-detection won't work. Use manual offset:

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        overlayConfig: {
          // Manual offset: 50px from the top
          manualOffset: {
            position: 'top',
            pixels: 50
          }
        }
      }}
    />
  );
}
```

### Disable Overlay Detection

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        overlayConfig: {
          // Disable all overlay detection
          selector: null
        }
      }}
    />
  );
}
```

### Disable Logout Button

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        // Host app controls session lifecycle; hide logout control in the sidebar
        disableLogout: true,
      }}
    />
  );
}
```

### Advanced: Using the Hook Directly

For custom UI components that need overlay information:

```tsx
import { useOverlayResistant } from '@crownpeak/dqm-react-component';
import type { OverlayInfo } from '@crownpeak/dqm-react-component';

function MyFloatingButton() {
  const overlay: OverlayInfo = useOverlayResistant({
    selector: '...',
    validateIframe: true,
    pollMs: 1000,
  });

  return (
    <button
      style={{
        position: 'fixed',
        top: overlay.present 
          ? `${overlay.contentOffset.top + 16}px` 
          : '16px',
        right: '16px',
        zIndex: 9999,
      }}
    >
      {overlay.present 
        ? `Toolbar at ${overlay.position} (${overlay.height}px)` 
        : 'No toolbar detected'}
    </button>
  );
}
```

---

## AI Features Examples

### Example 6: AI Translation with OpenAI

Translate checkpoint descriptions into any language using OpenAI's GPT models.

```typescript
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <h1>DQM with AI Translation (OpenAI)</h1>
      
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          websiteId: 'your-website-id',
          apiKey: 'your-dqm-api-key',
          
          // AI Translation Configuration
          translation: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...', // Your OpenAI API key
            model: 'gpt-4o-mini', // or 'gpt-4o' for better quality
            targetLanguage: 'de', // Target language (ISO 639-1 code)
            mode: 'fast', // 'fast' (15s timeout) or 'full' (120s timeout)
          }
        }}
      />
    </div>
  );
}

export default App;
```

**Key Features:**
- **Backend:** OpenAI (gpt-4o-mini, gpt-4o, gpt-4.1)
- **Performance:** ~2-5s for 50 checkpoints (batch processing with 3 concurrent requests)
- **Caching:** Automatic IndexedDB + In-Memory caching (FNV-1a hash-based)
- **Mode:** `fast` (15s timeout, fails gracefully) or `full` (120s timeout, complete translation)
- **Cost:** ~$0.001-0.003 per checkpoint (gpt-4o-mini)

### Example 7: AI Translation with WebLLM (Local, Privacy-Focused)

Run translation entirely in the browser without external API calls.

```typescript
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <h1>DQM with AI Translation (WebLLM - Local)</h1>
      <p>Translation runs locally in your browser using WebGPU</p>
      
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          websiteId: 'your-website-id',
          apiKey: 'your-dqm-api-key',
          
          // AI Translation with WebLLM (Local Inference)
          translation: {
            enabled: true,
            backend: 'webllm',
            // No API key needed - runs locally!
            model: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', // or 'Llama-3.2-3B-Instruct-q4f32_1-MLC'
            targetLanguage: 'de',
            mode: 'full', // WebLLM typically needs full mode
          }
        }}
      />
    </div>
  );
}

export default App;
```

**Key Features:**
- **Backend:** WebLLM (Llama-3.2, SmolLM2, Phi-3.5 models)
- **Performance:** ~30-120s for 50 checkpoints (local GPU inference via WebGPU)
- **Privacy:** 100% local, no data sent to external servers
- **Model Download:** First run downloads ~1-3GB model (cached in browser)
- **Requirements:** Chrome/Edge 113+, WebGPU support, 4GB+ GPU memory
- **Cost:** Free (no API costs)

**Available Models:**
- `Llama-3.2-1B-Instruct-q4f16_1-MLC` - Fastest, 1.5GB download
- `Llama-3.2-3B-Instruct-q4f32_1-MLC` - Better quality, 3GB download
- `SmolLM2-360M-Instruct-q4f16_1-MLC` - Ultra-fast, 500MB download
- `Phi-3.5-mini-instruct-q4f16_1-MLC` - Balanced, 2GB download

### Example 8: AI Summary Generation

Generate concise bullet-point summaries of analysis results.

```typescript
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <h1>DQM with AI Summary</h1>
      
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          websiteId: 'your-website-id',
          apiKey: 'your-dqm-api-key',
          
          // AI Summary Configuration
          summary: {
            enabled: true,
            backend: 'openai', // Only OpenAI supported for summary
            apiKey: 'sk-...', // Your OpenAI API key
            model: 'gpt-4o-mini', // or 'gpt-4o' for better summaries
          }
        }}
      />
    </div>
  );
}

export default App;
```

**Key Features:**
- **Backend:** OpenAI only (gpt-4o-mini, gpt-4o, gpt-4.1)
- **Performance:** ~3-8s for 50 checkpoints
- **Chunking:** Automatic chunking based on token count (single/chunk/tiny strategies)
- **Caching:** Persistent IndexedDB cache (reuses summaries across sessions)
- **Output:** 3-7 bullet points highlighting key issues
- **Cost:** ~$0.002-0.005 per summary

**Chunking Strategies:**
- **Single:** All checkpoints in one request (<100 items)
- **Chunk:** Split into 3 batches (100-300 items)
- **Tiny:** Individual summaries per checkpoint, merged (300+ items)

### Example 9: Combined AI Features (Translation + Summary)

Use both translation and summary generation together.

```typescript
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <h1>DQM with Full AI Features</h1>
      
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          websiteId: 'your-website-id',
          apiKey: 'your-dqm-api-key',
          
          // Translation (OpenAI for speed, or WebLLM for privacy)
          translation: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
            targetLanguage: 'de',
            mode: 'fast',
          },
          
          // Summary (OpenAI only)
          summary: {
            enabled: true,
            backend: 'openai',
            apiKey: 'sk-...', // Can be same as translation
            model: 'gpt-4o-mini',
          }
        }}
      />
    </div>
  );
}

export default App;
```

**Processing Order:**
1. **Analysis:** DQM API analyzes HTML (1-5s)
2. **Translation:** Checkpoints translated to target language (2-5s OpenAI / 30-120s WebLLM)
3. **Summary:** AI generates bullet-point summary (3-8s)
4. **Display:** Sidebar shows translated checkpoints + summary

**Performance Tips:**
- Use `mode: 'fast'` for translation if you prioritize speed over completeness
- Enable caching to avoid re-translation on subsequent analyses
- Use gpt-4o-mini for cost efficiency, gpt-4o for best quality
- Consider WebLLM for privacy-sensitive environments (healthcare, finance)

### Example 10: AI Settings UI (Advanced)

Allow users to configure AI settings via UI instead of hardcoding in config.

```typescript
import React, { useState, useEffect } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Read AI settings from localStorage (persisted by sidebar)
  const [aiConfig, setAiConfig] = useState({
    translationEnabled: localStorage.getItem('dqm_translate_results_enabled') === 'true',
    translationBackend: localStorage.getItem('dqm_ai_backend') || 'openai',
    targetLanguage: localStorage.getItem('dqm_target_language') || 'en',
    summaryEnabled: localStorage.getItem('dqm_ai_summary_enabled') === 'true',
  });

  // Listen for AI setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      setAiConfig({
        translationEnabled: localStorage.getItem('dqm_translate_results_enabled') === 'true',
        translationBackend: localStorage.getItem('dqm_ai_backend') || 'openai',
        targetLanguage: localStorage.getItem('dqm_target_language') || 'en',
        summaryEnabled: localStorage.getItem('dqm_ai_summary_enabled') === 'true',
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div>
      <h1>DQM with User-Controlled AI Settings</h1>
      
      {/* Display current AI settings */}
      <div style={{ padding: '16px', background: '#f5f5f5', marginBottom: '16px' }}>
        <h3>Current AI Settings</h3>
        <p>Translation: {aiConfig.translationEnabled ? 'ON' : 'OFF'}</p>
        <p>Backend: {aiConfig.translationBackend}</p>
        <p>Target Language: {aiConfig.targetLanguage}</p>
        <p>Summary: {aiConfig.summaryEnabled ? 'ON' : 'OFF'}</p>
      </div>
      
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          websiteId: 'your-website-id',
          apiKey: 'your-dqm-api-key',
          
          // Provide API keys, but let users toggle features via UI
          translation: {
            enabled: true, // Users can toggle in sidebar
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
            targetLanguage: 'de',
            mode: 'fast',
          },
          summary: {
            enabled: true, // Users can toggle in sidebar
            backend: 'openai',
            apiKey: 'sk-...',
            model: 'gpt-4o-mini',
          }
        }}
      />
    </div>
  );
}

export default App;
```

**localStorage Keys Used by Sidebar:**
- `dqm_translate_results_enabled` - Toggle translation on/off
- `dqm_ai_backend` - Backend selection ('openai' | 'webllm')
- `dqm_target_language` - Target language (ISO 639-1 code)
- `dqm_ai_summary_enabled` - Toggle summary on/off
- `dqm_webllm_model` - WebLLM model selection
- `dqm_translation_mode` - Translation mode ('fast' | 'full')
- `dqm_openai_api_key` - OpenAI API key (if user provides via UI)
- `dqm_openai_model` - OpenAI model selection
- `dqm_openai_summary_model` - OpenAI summary model selection

**UI Features:**
- **Settings Dialog:** Click gear icon in sidebar header to open AI settings
- **Real-time Toggle:** Enable/disable translation and summary without reloading
- **Model Selection:** Choose between OpenAI models (gpt-4o-mini, gpt-4o, gpt-4.1)
- **Language Selection:** Change target language on the fly
- **Backend Switch:** Toggle between OpenAI and WebLLM
- **Persistent Settings:** All settings saved to localStorage

---

## See Also

- **[AI Features Guide](./AI-FEATURES.md)** - Complete AI documentation with architecture diagrams
- **[API Reference](./API-REFERENCE.md)** - Full TypeScript API including AI hooks
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common AI-related issues and solutions

