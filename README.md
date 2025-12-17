# Crownpeak DQM React Component

[![npm version](https://img.shields.io/npm/v/@crownpeak/dqm-react-component.svg)](https://www.npmjs.com/package/@crownpeak/dqm-react-component)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue)](https://reactjs.org/)

A React component library for integrating [Crownpeak Digital Quality Management (DQM)](https://www.crownpeak.com/) into
your React applications. Display quality analysis, accessibility violations, and checkpoint errors with visual
highlighting capabilities.

## 🌟 Features

- **📊 Quality Analysis** - Comprehensive quality metrics and scores
- **♿ Accessibility Checks** - WCAG compliance validation
- **🎯 Error Highlighting** - Visual highlighting of issues in HTML
- **🎨 Material-UI Design** - Beautiful, responsive sidebar interface
- **🔐 OAuth 2.0 Authentication** - Secure Crownpeak SSO integration
- **⚡ Real-time Analysis** - Live quality assessment as you edit
- **📱 Responsive** - Works on desktop, tablet, and mobile
- **🔧 TypeScript Support** - Full type definitions included

## 📦 Installation

```bash
npm install @crownpeak/dqm-react-component
```

## 🚀 Quick Start

```tsx
import React, {useState} from 'react';
import {DQMSidebar} from '@crownpeak/dqm-react-component';

function App() {
    const [open, setOpen] = useState(false);

    const customHtml = `<html>
                <head><title>Test Page</title></head>
                <body>
                    <h1>Hello World</h1>
                    <img src="image.jpg" />
                </body>`

    return (
        <div>
            <button onClick={() => setOpen(true)}>Check Quality</button>

            <DQMSidebar
                open={sidebarOpen}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                debugHtml={customHtml}
                config={{
                    // ... authentication options here
                    // look for "🔑 Authentication Setup" below
                }}
            />
        </div>
    );
}

export default App;
```

## 📖 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Examples](./EXAMPLES.md)** - Integration examples for React, Next.js, TypeScript
- **[Authentication Guide](./AUTHENTICATION.md)** - OAuth 2.0 setup and configuration
- **[Backend API](./BACKEND-API.md)** - API endpoints and usage
- **[Development Guide](./DEVELOPMENT.md)** - Contributing and local development
- **Standalone Widget** - Use the fully bundled widget via `/dist/dqm-widget.{esm.js,iife.js}` (see Quick Start and test
  demos under `test/`)

## 🔑 Authentication Setup

The component requires authentication with Crownpeak DQM. 3 options are available:

```tsx
import {DQMSidebar} from '@crownpeak/dqm-react-component';

<DQMSidebar
    {/* ... */}
    config={{
        // --  Direct API Key and Website ID (not recommended for production)
        // websiteId: 'your-website-id',
        // apiKey: 'your-api-key',

        // -- Auth Backend for API Key management
        authBackendUrl: 'http://localhost:3001',
        useLocalStorage: true,

        // -- Oauth2:  backend not yet implemented ...
        // oauth2Config: {
        //     authUrl: 'https://dqm.crownpeak.com/oauth2/authorize',
        //     clientId: 'crownpeak-dqm-react-component',
        //     scope: 'dqm_api',
        //     redirectUri: 'http://localhost:5173/',
        //     tokenUrl: 'https://dqm.crownpeak.com/oauth2/token',
        // }
    }}
```

### Direct Backend Integration

Run the included backend server for session management:

```bash
npm run server
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed setup instructions.

## 🛠️ Development Server

For local development with test harness:

```bash
npm install
npm run dev
```

This starts:

- Frontend on `http://localhost:5173`
- Backend on `http://localhost:3001`

### Backend Requirements (Optional)

If using the included backend server:

- Node.js 18+ or 20+
- Redis (for session storage)

See [REDIS-SETUP.md](./REDIS-SETUP.md) for Redis installation.

## 📊 API Reference

### DQMSidebar Props

| Prop        | Type         | Required | Description                  |
|-------------|--------------|----------|------------------------------|
| `open`      | `boolean`    | ✅        | Controls sidebar visibility  |
| `onClose`   | `() => void` | ✅        | Callback when sidebar closes |
| `onOpen`    | `() => void` | ✅        | Callback when sidebar opens  |
| `debugHtml` | `string`     | ❌        | HTML for testing (dev only)  |
| `config`    | `DQMConfig`  | ❌        | Configuration options        |

### DQMConfig Options

| Option            | Type            | Default | Description                                    |
|-------------------|-----------------|---------|------------------------------------------------|
| `apiKey`          | `string`        | -       | Direct API key (not for production)            |
| `websiteId`       | `string`        | -       | Website ID for DQM                             |
| `authBackendUrl`  | `string`        | -       | Backend URL for session management             |
| `useLocalStorage` | `boolean`       | `true`  | Persist credentials in localStorage            |
| `disabled`        | `boolean`       | `false` | Disable DQM completely                         |
| `disableLogout`   | `boolean`       | `false` | Hide the logout control (host manages session) |
| `shadowDomMode`   | `boolean`       | `false` | Enable for Shadow DOM embedding                |
| `overlayConfig`   | `OverlayConfig` | -       | Overlay/toolbar detection config               |

### OverlayConfig (for Toolbars & Overlays)

Configure how the sidebar adapts to fixed overlays (e.g., admin toolbars):

```tsx
<DQMSidebar
    config={{
        overlayConfig: {
            // CSS selector for the overlay element
            selector: 'iframe#MyToolbar',

            // Validate iFrame has contentWindow (default: true)
            validateIframe: true,

            // Polling interval in ms for cross-origin iFrames (default: 1000)
            pollMs: 1000,

            // OR: Manual offset when auto-detection doesn't work
            // (e.g., for iFrames that fill screen but have smaller internal content)
            manualOffset: {
                position: 'top', // 'top' | 'bottom' | 'left' | 'right'
                pixels: 50
            }
        }
    }}
/>
```

**Common overlay configurations:**

[//]: # (@formatter:off)
```tsx
// Disable overlay detection
overlayConfig: {
    selector: null
}

// Manual 50px offset from top
overlayConfig: {
    manualOffset: {
        position: 'top', pixels: 50
    }
}

// Custom selector without iFrame validation
overlayConfig: {
    selector: '.admin-toolbar', validateIframe: false
}
```
[//]: # (@formatter:on)

### Exported Types

```typescript
import type {
    AnalysisState,
    Checkpoint,
    AnalysisData,
    DQMSidebarProps,
    DQMConfig,
    OverlayConfig,
    OverlayOffsetPosition
} from '@crownpeak/dqm-react-component';

// For advanced overlay handling
import {useOverlayResistant} from '@crownpeak/dqm-react-component';
import type {OverlayInfo, OverlayPosition} from '@crownpeak/dqm-react-component';
```

See [TypeScript examples](./EXAMPLES.md#typescript-configuration) for full type definitions.

## 🧪 Testing

```bash
# Lint code
npm run lint

# Build library
npm run build:lib

# Test as package
npm pack
npm install ./crownpeak-dqm-react-component-1.0.0.tgz
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

MIT © [Crownpeak Technology GmbH](https://www.crownpeak.com/)

See [LICENSE](./LICENSE) file for details.

## 🐛 Issues

Found a bug or have a feature request?
Please [open an issue](https://github.com/Crownpeak/dqm-react-component/issues/new/choose).

## 📞 Support

- **Documentation**: Check the [docs folder](.)
- **Issues**: [GitHub Issues](https://github.com/Crownpeak/dqm-react-component/issues)
- **Website**: [crownpeak.com](https://www.crownpeak.com/)

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@crownpeak/dqm-react-component)
- [GitHub Repository](https://github.com/Crownpeak/dqm-react-component)
- [Material-UI Documentation](https://mui.com/)

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

Made with ❤️ by the Crownpeak team
