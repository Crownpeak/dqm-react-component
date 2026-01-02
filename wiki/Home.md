# Crownpeak DQM React Component - Documentation Wiki

Welcome to the complete documentation for `@crownpeak/dqm-react-component`.

## Quick Links

- 📚 **[Quick Start](Quick-Start)** - Get started in 5 minutes
- 🤖 **[AI Features](AI-Features)** - Translation & Summary with OpenAI/WebLLM  
- 📖 **[Examples](Examples)** - Integration examples
- 🔧 **[API Reference](API-Reference)** - Full TypeScript API

## What is DQM?

Crownpeak Digital Quality Management (DQM) provides automated quality analysis for web pages, including accessibility violations, SEO issues, mobile responsiveness, design consistency, and performance metrics.

## Installation

```bash
npm install @crownpeak/dqm-react-component
```

## Basic Example

```typescript
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
    const [open, setOpen] = useState(false);

    return (
        <DQMSidebar
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            config={{
                websiteId: 'your-website-id',
                apiKey: 'your-api-key',
            }}
        />
    );
}
```

See **[Quick Start](Quick-Start)** for detailed setup.

## Documentation Sections

Use the sidebar (→) to navigate, or explore:

- **[Quick Start](Quick-Start)** - Installation and setup
- **[Examples](Examples)** - React, Next.js, TypeScript examples
- **[Authentication](Authentication)** - OAuth2, API keys, backend proxy
- **[AI Features](AI-Features)** - Translation & summary generation
- **[Widget Bundle](Widget-Bundle)** - Standalone IIFE/ESM bundles
- **[API Reference](API-Reference)** - Complete TypeScript API
- **[Troubleshooting](Troubleshooting)** - Common issues and solutions
- **[Development](Development)** - Contributing guide
