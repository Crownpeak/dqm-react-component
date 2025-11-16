# Crownpeak DQM React Component

[![npm version](https://img.shields.io/npm/v/@crownpeak/dqm-react-component.svg)](https://www.npmjs.com/package/@crownpeak/dqm-react-component)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue)](https://reactjs.org/)

A React component library for integrating [Crownpeak Digital Quality Management (DQM)](https://www.crownpeak.com/) into your React applications. Display quality analysis, accessibility violations, and checkpoint errors with visual highlighting capabilities.

![DQM Sidebar Demo](https://via.placeholder.com/800x450?text=DQM+Sidebar+Demo)

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
import React, { useState } from 'react';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Check Quality</button>
      
      <DQMSidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
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

## 🔑 Authentication Setup

The component requires authentication with Crownpeak DQM. Two options available:

### Option 1: OAuth 2.0 (Recommended)

```tsx
import { DQMLogin } from '@crownpeak/dqm-react-component';

function LoginPage() {
  return <DQMLogin redirectUri="http://localhost:5173/callback" />;
}
```

### Option 2: Direct Backend Integration

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

## 📋 Requirements

### Peer Dependencies

```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "@mui/material": ">=5.0.0",
  "@mui/icons-material": ">=5.0.0",
  "@emotion/react": ">=11.0.0",
  "@emotion/styled": ">=11.0.0"
}
```

### Backend Requirements (Optional)

If using the included backend server:
- Node.js 18+ or 20+
- Redis (for session storage)

See [REDIS-SETUP.md](./REDIS-SETUP.md) for Redis installation.

## 🎨 Customization

The component uses Material-UI theming and can be customized:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DQMSidebar } from '@crownpeak/dqm-react-component';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <DQMSidebar open={true} onClose={...} onOpen={...} />
    </ThemeProvider>
  );
}
```

## 📊 API Reference

### DQMSidebar Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls sidebar visibility |
| `onClose` | `() => void` | ✅ | Callback when sidebar closes |
| `onOpen` | `() => void` | ✅ | Callback when sidebar opens |
| `debugHtml` | `string` | ❌ | HTML for testing (dev only) |

### Exported Types

```typescript
import type {
  AnalysisState,
  Checkpoint,
  AnalysisData,
  DQMSidebarProps
} from '@crownpeak/dqm-react-component';
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

Found a bug or have a feature request? Please [open an issue](https://github.com/e-Spirit/crownpeak-dqm-react-component/issues/new/choose).

## 📞 Support

- **Documentation**: Check the [docs folder](.)
- **Issues**: [GitHub Issues](https://github.com/e-Spirit/crownpeak-dqm-react-component/issues)
- **Website**: [crownpeak.com](https://www.crownpeak.com/)

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@crownpeak/dqm-react-component)
- [GitHub Repository](https://github.com/e-Spirit/crownpeak-dqm-react-component)
- [Crownpeak DQM](https://www.crownpeak.com/products/digital-quality-management/)
- [Material-UI Documentation](https://mui.com/)

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

Made with ❤️ by the Crownpeak team
