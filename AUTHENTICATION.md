# DQM Authentication Configuration Examples

This document shows different ways to configure authentication for the DQM Sidebar component.

## 1. Direct Credentials (Simplest)

Pass API credentials directly as props:

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
        apiKey: process.env.REACT_APP_DQM_API_KEY,
        websiteId: process.env.REACT_APP_DQM_WEBSITE_ID,
      }}
    />
  );
}
```

## 2. LocalStorage (Default Behavior)

If no credentials are provided via props, the component will check `localStorage` and show a login form if credentials are missing:

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);

  // On first open, user will see login form
  // Credentials are stored in localStorage after successful login
  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        useLocalStorage: true, // Default: true
      }}
    />
  );
}
```

## 3. Backend Authentication (Custom Token Exchange)

Use your own Express.js backend to manage credentials:

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
        authBackendUrl: 'https://api.yourcompany.com',
        useLocalStorage: true, // Optional: cache credentials
      }}
      onAuthSuccess={(credentials) => {
        console.log('Authenticated:', credentials);
      }}
      onAuthError={(error) => {
        console.error('Auth failed:', error);
      }}
    />
  );
}
```

### Backend API Requirements

Your backend must implement this endpoint:

```typescript
// POST /auth/token
// Response:
{
  "apiKey": "your-dqm-api-key",
  "websiteId": "your-website-id"
}
```

## 4. OAuth2 Flow

For enterprise SSO integration:

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [open, setOpen] = useState(false);
  
  // TODO: verify that your backend supports OAuth2 token exchange

  return (
    <DQMSidebar
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      config={{
        authBackendUrl: 'https://api.yourcompany.com',
        oauth2Config: {
          authUrl: 'https://oauth.yourcompany.com/authorize',
          tokenUrl: 'https://oauth.yourcompany.com/token',
          clientId: 'your-oauth-client-id',
          redirectUri: window.location.origin + '/dqm/callback',
          scope: 'dqm:read',
        },
      }}
    />
  );
}
```

### OAuth2 Backend Requirements

Your backend must implement:

```typescript
// POST /auth/oauth2/callback
// Body: { code: string, redirectUri: string }
// Response:
{
  "apiKey": "your-dqm-api-key",
  "websiteId": "your-website-id"
}
```

## 5. Hybrid Configuration

Combine multiple authentication methods with priority:

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
        // Priority 1: Direct credentials (if provided)
        apiKey: process.env.REACT_APP_DQM_API_KEY,
        websiteId: process.env.REACT_APP_DQM_WEBSITE_ID,
        
        // Priority 2: LocalStorage (if no props provided)
        useLocalStorage: true,
        
        // Priority 3: Backend authentication (fallback)
        authBackendUrl: 'https://api.yourcompany.com',
        oauth2Config: {
          authUrl: 'https://oauth.yourcompany.com/authorize',
          tokenUrl: 'https://oauth.yourcompany.com/token',
          clientId: 'your-oauth-client-id',
          redirectUri: window.location.origin + '/dqm/callback',
        },
      }}
      onAuthSuccess={(credentials) => {
        // Optional: Send to analytics
        analytics.track('DQM Auth Success');
      }}
    />
  );
}
```

## Express.js Backend Example

Here's a complete Express.js backend example:

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Simple token exchange (custom session-based)
app.post('/auth/token', async (req, res) => {
  try {
    // Verify user session (implement your own logic)
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch user's DQM credentials from your database
    const user = await database.users.findById(req.session.userId);
    
    res.json({
      apiKey: user.dqmApiKey,
      websiteId: user.dqmWebsiteId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth2 callback handler
app.post('/auth/oauth2/callback', async (req, res) => {
  const { code, redirectUri } = req.body;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://oauth.yourcompany.com/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
    });

    const { access_token } = tokenResponse.data;

    // Use access token to fetch user's DQM credentials
    const userInfo = await axios.get('https://api.yourcompany.com/user/dqm-credentials', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    res.json({
      apiKey: userInfo.data.apiKey,
      websiteId: userInfo.data.websiteId,
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth2 flow failed' });
  }
});

app.listen(3000, () => {
  console.log('DQM Auth Backend running on port 3000');
});
```

## Security Best Practices

1. **Never expose API keys in client-side code** for production
2. **Use HTTPS** for all authentication endpoints
3. **Implement CSRF protection** for OAuth2 flows
4. **Validate redirect URIs** in OAuth2 configuration
5. **Use short-lived sessions** and implement token refresh
6. **Log authentication events** for security monitoring
7. **Rate limit** authentication endpoints

## TypeScript Support

All configuration options are fully typed:

```tsx
import type { DQMConfig, OAuth2Config } from '@crownpeak/dqm-react-component';

const config: DQMConfig = {
  apiKey: '...',
  websiteId: '...',
  authBackendUrl: '...',
  oauth2Config: {
    authUrl: '...',
    tokenUrl: '...',
    clientId: '...',
    redirectUri: '...',
    scope: 'dqm:read',
  },
  useLocalStorage: true,
  apiEndpoint: 'https://api.crownpeak.net/dqm-cms/v1', // Optional: custom endpoint
};
```
