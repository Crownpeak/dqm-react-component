# Crownpeak DQM React Component - Documentation Wiki

Welcome to the complete documentation for `@crownpeak/dqm-react-component`.

## Quick Links

- 📚 **[Quick Start Guide](Quick-Start-Guide)** - Get started in 5 minutes
- 🤖 **[AI Features Guide](AI-Features-Guide)** - Translation & Summary with OpenAI  
- 📖 **[Example Usage](Example-Usage)** - Integration examples
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

See **[Quick Start Guide](Quick-Start-Guide)** for detailed setup.

## Documentation Sections

Use the sidebar (→) to navigate, or explore:

- **[Quick Start Guide](Quick-Start-Guide)** - Installation and setup
- **[Example Usage](Example-Usage)** - React, Next.js, TypeScript examples
- **[Authentication Configuration](Authentication-Configuration)** - API keys, backend proxy
- **[AI Features Guide](AI-Features-Guide)** - Translation & summary generation
- **[Widget Bundle Guide](Widget-Bundle-Guide)** - Standalone IIFE/ESM bundles
- **[API Reference](API-Reference)** - Complete TypeScript API
- **[Troubleshooting Guide](Troubleshooting-Guide)** - Common issues and solutions
- **[Development Guide](Development-Guide)** - Contributing guide
