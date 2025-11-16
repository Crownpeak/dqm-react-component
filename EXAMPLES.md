# Example Usage

This directory contains example implementations of the `@crownpeak/dqm-react-component`.

## Basic React App Example

```tsx
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme();

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set DQM credentials (e.g., from environment variables)
  React.useEffect(() => {
    localStorage.setItem('dqm_apiKey', process.env.REACT_APP_DQM_API_KEY);
    localStorage.setItem('dqm_websiteID', process.env.REACT_APP_DQM_WEBSITE_ID);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <h1>My Application with DQM</h1>
        <p>This page is monitored by Crownpeak DQM for quality assurance.</p>
        
        <DQMSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## Next.js Example

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme();

function MyApp({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dqm_apiKey', process.env.NEXT_PUBLIC_DQM_API_KEY!);
      localStorage.setItem('dqm_websiteID', process.env.NEXT_PUBLIC_DQM_WEBSITE_ID!);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />
    </ThemeProvider>
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

