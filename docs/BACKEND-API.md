# DQM Backend API - Architecture & Implementation Guide

## Overview

The DQM Backend API provides a **secure proxy layer** between your React application and the Crownpeak DQM API. It enables **centralized credential management** through server-side storage, eliminating the need to expose DQM API keys in the browser.

## Two Operating Modes

### Mode 1: Direct API Key (Development/Testing)
User provides Crownpeak credentials directly in the widget:
```
User → Widget (API Key + Website ID) → Crownpeak DQM API
```
**Use Case:** Quick testing, development environments, demos

### Mode 2: Backend Session with SSO (Production - RECOMMENDED)
User authenticates with YOUR system, backend manages DQM credentials:
```
User → Your OAuth/SSO → Your Backend → Retrieves DQM Credentials → Session Token → Widget → Backend Proxy → Crownpeak DQM API
```
**Use Case:** Production deployments, enterprise SSO integration, centralized credential management

---

## Mode 2 Architecture (SSO/Backend - RECOMMENDED)

### Complete Authentication Flow

```mermaid
sequenceDiagram
   autonumber
   actor User as 👤 User (Browser)
   participant Widget as DQM Widget<br/>(React Component)
   participant Popup as Login Popup Window
   participant Backend as Your Backend<br/>(Express/Node.js)
   participant OAuth as OAuth Provider<br/>(Okta/Azure AD/Auth0)
   participant DB as Your Database<br/>(User Credentials)
   participant Redis as Redis SessionStore
   participant DQM as Crownpeak DQM API<br/>(api.crownpeak.net)

   Note over User,DQM: Phase 1: Initial Authentication Request
   User->>Widget: Opens widget, clicks "Login"
   activate Widget
   Widget->>Popup: window.open('/auth/login')
   activate Popup
   Note over Popup: Beautiful Material-UI<br/>Login Page<br/>(Built from server-ui/)
   Popup-->>User: Display: "Sign in with SSO"<br/>or "Direct API Key"
   deactivate Widget

   Note over User,DQM: Phase 2: OAuth Authorization Flow
   User->>Popup: Clicks "Sign in with SSO"
   Popup->>OAuth: Redirect to OAuth authorize URL<br/>?client_id=X&redirect_uri=/auth/callback
   activate OAuth
   OAuth-->>User: Display login form
   User->>OAuth: Enter credentials
   OAuth->>OAuth: Validate user credentials
   OAuth->>Popup: Redirect: /auth/callback<br/>?code=xyz&state=abc
   deactivate OAuth
   activate Popup
   Note over Popup: Callback Handler Page<br/>Shows loading spinner

   Note over User,DQM: Phase 3: Token Exchange & Session Creation
   Popup->>Backend: POST /auth/oauth2/callback<br/>{ code, redirectUri }
   activate Backend
   Backend->>OAuth: POST /token<br/>{ grant_type, code,<br/>client_id, client_secret }
   activate OAuth
   OAuth-->>Backend: { access_token, ... }
   deactivate OAuth

   Backend->>OAuth: GET /userinfo<br/>Authorization: Bearer {token}
   activate OAuth
   OAuth-->>Backend: { sub: userId, email, ... }
   deactivate OAuth

   Backend->>DB: SELECT api_key, website_id<br/>WHERE user_id = $userId
   activate DB
   Note over DB: Table: user_dqm_credentials<br/>┌──────────┬─────────────┐<br/>│ user_id  │ dqm_api_key │ (ENCRYPTED!)<br/>│          │ website_id  │<br/>└──────────┴─────────────┘
   DB-->>Backend: { encrypted_api_key,<br/>website_id }
   deactivate DB

   Backend->>Backend: apiKey = decrypt(encrypted_api_key)

   Backend->>Redis: Create session<br/>sessionStore.create(apiKey,<br/>websiteId, userId)
   activate Redis
   Note over Redis: Store session data:<br/>session:{token}<br/>├─ apiKey: "real_key..."<br/>├─ websiteId: "site123"<br/>├─ userId: "user456"<br/>└─ expiresAt: timestamp<br/><br/>TTL: 24 hours
   Redis-->>Backend: sessionToken
   deactivate Redis

   Backend-->>Popup: 200 OK<br/>{ sessionToken,<br/>websiteId, userId }
   deactivate Backend

   Note over User,DQM: Phase 4: Token Propagation to Widget
   Popup->>Widget: postMessage({<br/>type: 'DQM_AUTH_SUCCESS',<br/>sessionToken, websiteId<br/>})
   activate Widget
   Popup->>Popup: window.close()
   deactivate Popup

   Widget->>Widget: Store in localStorage:<br/>- dqm_sessionToken<br/>- dqm_websiteID<br/>- dqm_sessionType: 'backend'
   Widget-->>User: Show: "Authenticated ✓"
   deactivate Widget

   Note over User,DQM: Phase 5: Proxied DQM API Requests
   User->>Widget: Analyze page quality
   activate Widget
   Widget->>Widget: Capture HTML via<br/>optimizeHtmlForAnalysis()
   Widget->>Backend: POST /dqm/assets<br/>Authorization: Bearer {sessionToken}<br/>{ html, url }
   activate Backend

   Backend->>Backend: Extract token from header
   Backend->>Redis: sessionStore.get(token)
   activate Redis
   Redis-->>Backend: { apiKey, websiteId, ... }
   deactivate Redis

   Backend->>Backend: Validate session.expiresAt
   Backend->>DQM: POST /dqm-cms/v1/assets<br/>x-api-key: {real_api_key}<br/>{ html, url, websiteId }
   activate DQM
   DQM-->>Backend: { assetId, analysisState }
   deactivate DQM

   Backend-->>Widget: { assetId, analysisState }
   deactivate Backend

   Note over Widget: Poll every 2s for completion
   loop Until analysisState === 'completed'
      Widget->>Backend: GET /dqm/assets/{assetId}<br/>Authorization: Bearer {sessionToken}
      activate Backend
      Backend->>Redis: Verify session
      activate Redis
      Redis-->>Backend: { apiKey }
      deactivate Redis
      Backend->>DQM: GET /assets/{assetId}?apiKey=X<br/>x-api-key: {real_api_key}
      activate DQM
      DQM-->>Backend: { checkpoints[], totalErrors }
      deactivate DQM
      Backend-->>Widget: Analysis data
      deactivate Backend
   end

   Widget-->>User: Display quality results<br/>(CategoryCards, Checkpoints)
   deactivate Widget

   Note over User,DQM: Phase 6: Error Highlighting (Optional)
   User->>Widget: Click specific checkpoint
   activate Widget
   Widget->>Backend: GET /dqm/assets/{assetId}/<br/>pagehighlight/{checkpointId}<br/>Authorization: Bearer {sessionToken}
   activate Backend
   Backend->>Redis: Verify session
   activate Redis
   Redis-->>Backend: { apiKey }
   deactivate Redis
   Backend->>DQM: GET /assets/{assetId}/<br/>pagehighlight/{checkpointId}<br/>x-api-key: {real_api_key}
   activate DQM
   DQM-->>Backend: HTML with .astError classes
   deactivate DQM
   Backend-->>Widget: Highlighted HTML
   deactivate Backend
   Widget->>Widget: Render in ShadowDOMRenderer<br/>with IntersectionObserver
   Widget-->>User: Show highlighted errors
   deactivate Widget

   Note over User,DQM: Security: API key never exposed to browser!<br/>All requests proxied through backend with session token.
```

### Key Concepts

**🔐 Your OAuth Provider = Your Authentication System**
- This is NOT Crownpeak OAuth
- This is YOUR company's SSO system (Okta, Azure AD, Auth0, Keycloak, custom OAuth, etc.)
- Users log in with THEIR work credentials
- Example: `user@yourcompany.com` + password/MFA

**🗄️ Your Database = DQM Credential Storage**
- You store a mapping: `userId` → `{ dqmApiKey, dqmWebsiteId }`
- When user logs in via SSO, backend looks up their DQM credentials
- Users never see or enter Crownpeak API keys
- Admin interface needed for initial credential setup

**🎟️ Session Token = Temporary Access Key**
- Backend creates this after successful SSO authentication
- Widget uses this for all DQM requests
- Maps to real DQM credentials server-side
- Expires after 24 hours (configurable)




---

## Implementation Steps

### Step 1: Database Schema for User Credentials

Create a table to store each user's DQM credentials:

```sql
-- PostgreSQL Example
CREATE TABLE user_dqm_credentials (
  user_id UUID PRIMARY KEY,
  api_key TEXT NOT NULL,           -- ⚠️ MUST BE ENCRYPTED!
  website_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_user_dqm_user_id ON user_dqm_credentials(user_id);

-- Audit trail (optional but recommended)
CREATE TABLE dqm_credential_audit (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'accessed'
  performed_by UUID,           -- Admin user who made the change
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

⚠️ **CRITICAL SECURITY**: Always encrypt `api_key` before storing!

```typescript
// Example encryption (using Node.js crypto)
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate encryption key (run once, store in .env):
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Implement OAuth Callback Handler

Edit `server/routes/auth.ts` and implement the callback handler:

```typescript
import { Router, Request, Response } from 'express';
import { sessionStore } from '../services/sessionStore.js';
import { yourDB } from '../services/database.js'; // Your database service
import { encrypt, decrypt } from '../utils/crypto.js'; // Your encryption utils

const authRouter = Router();

authRouter.post('/oauth2/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: code and redirectUri',
      });
    }

    // ============================================
    // STEP 1: Exchange code for access token
    // ============================================
    const tokenResponse = await fetch(process.env.OAUTH_TOKEN_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.OAUTH_CLIENT_ID!,
        client_secret: process.env.OAUTH_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Auth] Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // ============================================
    // STEP 2: Get user info from YOUR OAuth provider
    // ============================================
    const userInfoResponse = await fetch(process.env.OAUTH_USERINFO_URL!, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from OAuth provider');
    }

    const userInfo = await userInfoResponse.json();
    const userId = userInfo.sub || userInfo.id || userInfo.userId;

    if (!userId) {
      throw new Error('User ID not found in OAuth response');
    }

    console.log(`[Auth] OAuth success for user: ${userId}`);

    // ============================================
    // STEP 3: Retrieve DQM credentials from YOUR database
    // ============================================
    const credentialsResult = await yourDB.query(
      'SELECT api_key, website_id FROM user_dqm_credentials WHERE user_id = $1',
      [userId]
    );

    if (!credentialsResult || credentialsResult.rows.length === 0) {
      console.warn(`[Auth] No DQM credentials found for user ${userId}`);
      return res.status(404).json({
        error: true,
        message: 'DQM credentials not configured for this user. Please contact your administrator.',
        code: 'CREDENTIALS_NOT_FOUND',
      });
    }

    const { api_key: encryptedApiKey, website_id: websiteId } = credentialsResult.rows[0];

    // ============================================
    // STEP 4: Decrypt API key and create session
    // ============================================
    const apiKey = decrypt(encryptedApiKey);

    // Optional: Validate credentials with Crownpeak DQM API
    // const isValid = await validateDQMCredentials(apiKey, websiteId);
    // if (!isValid) {
    //   return res.status(401).json({
    //     error: true,
    //     message: 'DQM credentials are invalid. Please contact your administrator.',
    //   });
    // }

    // Create session in Redis/SessionStore
    const sessionToken = await sessionStore.create(apiKey, websiteId, userId);

    console.log(`[Auth] Created session ${sessionToken} for user ${userId}`);

    // ============================================
    // STEP 5: Return session token to widget
    // ============================================
    res.json({
      sessionToken,
      websiteId,
      userId, // Optional: for display purposes
    });
  } catch (error: any) {
    console.error('[Auth] OAuth2 callback error:', error);
    res.status(401).json({
      error: true,
      message: error.message || 'OAuth2 authentication failed',
      code: 'OAUTH_ERROR',
    });
  }
});

export { authRouter };
```

### Step 3: Configure Environment Variables

Create `.env` file in your backend:

```bash
# ==================================
# YOUR OAuth/SSO Configuration
# ==================================
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_AUTHORIZE_URL=https://your-oauth-provider.com/oauth2/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth2/token
OAUTH_USERINFO_URL=https://your-oauth-provider.com/oauth2/userinfo

# ==================================
# DQM Backend Configuration
# ==================================
PORT=3001
REDIS_URL=redis://localhost:6379

# ==================================
# Security
# ==================================
ENCRYPTION_KEY=your-32-byte-hex-key-here  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_TTL=86400  # 24 hours in seconds

# ==================================
# CORS
# ==================================
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# ==================================
# Database (example for PostgreSQL)
# ==================================
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
```

### Step 4: Configure Auth UI

Edit `server-ui/.env`:

```bash
# Point to YOUR OAuth provider
VITE_OAUTH_CLIENT_ID=your-oauth-client-id
VITE_OAUTH_AUTHORIZE_URL=https://your-oauth-provider.com/oauth2/authorize
VITE_API_BASE_URL=http://localhost:3001
```

### Step 5: Admin Interface for Credential Management

Create an admin interface where you (or admins) can configure DQM credentials for users:

```tsx
// Example: Admin Settings Component
import { useState, useEffect } from 'react';

function UserDQMSettings({ userId }: { userId: string }) {
  const [apiKey, setApiKey] = useState('');
  const [websiteId, setWebsiteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load existing credentials
  useEffect(() => {
    fetch(`/api/admin/users/${userId}/dqm-credentials`, {
      headers: {
        Authorization: `Bearer ${yourAdminToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.websiteId) {
          setWebsiteId(data.websiteId);
          // Don't load API key for security
        }
      });
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}/dqm-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourAdminToken}`,
        },
        body: JSON.stringify({
          apiKey,
          websiteId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save credentials');
      }

      setSuccess(true);
      setApiKey(''); // Clear for security
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dqm-settings-form">
      <h3>DQM Integration Settings</h3>
      <p>Configure Crownpeak DQM credentials for this user.</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Credentials saved successfully!</div>}

      <div className="form-group">
        <label htmlFor="apiKey">Crownpeak API Key</label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter new API key (leave blank to keep existing)"
          autoComplete="off"
        />
        <small>This will be encrypted before storage</small>
      </div>

      <div className="form-group">
        <label htmlFor="websiteId">Website ID</label>
        <input
          id="websiteId"
          value={websiteId}
          onChange={(e) => setWebsiteId(e.target.value)}
          placeholder="e.g., my-website-id"
        />
      </div>

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Credentials'}
      </button>
    </div>
  );
}

export default UserDQMSettings;
```

Backend endpoint:

```typescript
// Your backend admin API
app.post('/api/admin/users/:userId/dqm-credentials', 
  authenticateAdmin,  // Middleware to ensure user is admin
  async (req, res) => {
    const { userId } = req.params;
    const { apiKey, websiteId } = req.body;

    if (!websiteId) {
      return res.status(400).json({ error: 'Website ID is required' });
    }

    try {
      // Optional: Validate credentials with Crownpeak before saving
      if (apiKey) {
        const isValid = await validateDQMCredentials(apiKey, websiteId);
        if (!isValid) {
          return res.status(400).json({ 
            error: 'Invalid DQM credentials. Please check API key and Website ID.' 
          });
        }

        // Encrypt API key
        const encryptedKey = encrypt(apiKey);

        // Store in database
        await db.query(
          `INSERT INTO user_dqm_credentials (user_id, api_key, website_id, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET api_key = $2, website_id = $3, updated_at = NOW()`,
          [userId, encryptedKey, websiteId]
        );

        // Audit trail
        await db.query(
          `INSERT INTO dqm_credential_audit (user_id, action, performed_by, timestamp)
           VALUES ($1, 'updated', $2, NOW())`,
          [userId, req.user.id]
        );
      } else {
        // Update only website ID (keep existing API key)
        await db.query(
          `UPDATE user_dqm_credentials 
           SET website_id = $1, updated_at = NOW()
           WHERE user_id = $2`,
          [websiteId, userId]
        );
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Admin] Failed to save DQM credentials:', error);
      res.status(500).json({ 
        error: 'Failed to save credentials', 
        message: error.message 
      });
    }
  }
);

async function validateDQMCredentials(apiKey: string, websiteId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.crownpeak.net/dqm-cms/v1/websites/${websiteId}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

### Step 6: Widget Configuration

In your React app where you embed the DQM Widget:

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { useState, useEffect } from 'react';

function MyApp() {
  const [isDQMOpen, setIsDQMOpen] = useState(false);

  const handleOpenDQM = () => {
    // Check if user already has a session token
    const existingToken = localStorage.getItem('dqm_sessionToken');
    const sessionType = localStorage.getItem('dqm_sessionType');

    if (existingToken && sessionType === 'backend') {
      // User is already authenticated, open widget directly
      setIsDQMOpen(true);
    } else {
      // Open SSO login page in popup
      const authWindow = window.open(
        'http://localhost:3001/auth/login',
        'DQM Login',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        alert('Please enable popups to log in');
        return;
      }

      // Listen for authentication success
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== 'http://localhost:3001') {
          return;
        }

        if (event.data.type === 'DQM_AUTH_SUCCESS') {
          const { sessionToken, websiteId } = event.data;

          // Store session token in localStorage
          localStorage.setItem('dqm_sessionToken', sessionToken);
          localStorage.setItem('dqm_websiteID', websiteId);
          localStorage.setItem('dqm_sessionType', 'backend');

          // Close auth window
          authWindow.close();

          // Open widget
          setIsDQMOpen(true);

          // Remove event listener
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'DQM_AUTH_ERROR') {
          alert('Authentication failed: ' + event.data.error);
          authWindow.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>My Application</h1>
        <button onClick={handleOpenDQM} className="dqm-button">
          ✨ Check Quality with DQM
        </button>
      </header>

      <main>
        {/* Your app content */}
      </main>

      <DQMSidebar
        open={isDQMOpen}
        onClose={() => setIsDQMOpen(false)}
        onOpen={() => setIsDQMOpen(true)}
        config={{
          backendUrl: 'http://localhost:3001',  // Your backend proxy
          useBackend: true,                      // Enable backend mode
          useLocalStorage: true,                 // Store session token
        }}
        onAuthSuccess={(credentials) => {
          console.log('DQM authenticated:', credentials.sessionType);
        }}
        onAuthError={(error) => {
          console.error('DQM auth error:', error);
          // Clear invalid session
          localStorage.removeItem('dqm_sessionToken');
          localStorage.removeItem('dqm_websiteID');
          localStorage.removeItem('dqm_sessionType');
        }}
      />
    </div>
  );
}

export default MyApp;
```




---

## API Endpoints Reference

Your backend must implement these endpoints for the widget to communicate with Crownpeak DQM API.

### Authentication Endpoints

#### 1. Direct Credentials Login (Fallback Mode)

**Endpoint:** `POST /auth/login`

**Description:** User provides API Key and Website ID directly. Backend validates and issues session token.

**Request:**
```json
{
  "apiKey": "user_crownpeak_api_key",
  "websiteId": "user_website_id"
}
```

**Response (Success - 200):**
```json
{
  "sessionToken": "unique_session_token_or_jwt",
  "websiteId": "user_website_id"
}
```

**Response (Error - 401):**
```json
{
  "error": true,
  "message": "Invalid credentials or authentication failed"
}
```

#### 2. Backend Session Authentication

**Endpoint:** `POST /auth/token`

**Description:** User already authenticated via your backend's session/cookie. Backend issues DQM session token.

**Headers:**
```
Cookie: your_session_cookie
```

**Response (Success - 200):**
```json
{
  "sessionToken": "unique_session_token",
  "websiteId": "user_website_id"
}
```

**Response (Error - 401):**
```json
{
  "error": true,
  "message": "Not authenticated"
}
```

#### 3. OAuth2 Callback (Recommended for SSO)

**Endpoint:** `POST /auth/oauth2/callback`

**Description:** Process OAuth2 authorization code and issue session token.

**Request:**
```json
{
  "code": "oauth2_authorization_code",
  "redirectUri": "https://your-backend.com/auth/callback"
}
```

**Response (Success - 200):**
```json
{
  "sessionToken": "unique_session_token",
  "websiteId": "user_website_id",
  "userId": "user123"  // Optional
}
```

**Response (Error - 401):**
```json
{
  "error": true,
  "message": "OAuth2 token exchange failed",
  "code": "OAUTH_ERROR"
}
```

**Response (Error - 404):**
```json
{
  "error": true,
  "message": "DQM credentials not configured for this user. Please contact your administrator.",
  "code": "CREDENTIALS_NOT_FOUND"
}
```

---

### DQM Proxy Endpoints

All DQM API calls are proxied through your backend when in Backend Mode.

#### 4. Start HTML Analysis

**Endpoint:** `POST /dqm/assets`

**Description:** Proxy for Crownpeak DQM API - Start HTML analysis.

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "html": "<html>...</html>",
  "url": "https://example.com/page",
  "websiteId": "optional_if_backend_knows"
}
```

**Response (Success - 200):**
```json
{
  "assetId": "generated_asset_id",
  "analysisState": "analyzing",
  "totalCheckpoints": 150
}
```

**Backend Implementation:**
```typescript
app.post('/dqm/assets', authenticateSession, async (req, res) => {
  const { apiKey, websiteId } = req.session;  // From session store
  
  const response = await fetch('https://api.crownpeak.net/dqm-cms/v1/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      ...req.body,
      websiteId, // Ensure correct websiteId
    }),
  });
  
  const data = await response.json();
  res.json(data);
});
```

#### 5. Get Analysis Status (Polling)

**Endpoint:** `GET /dqm/assets/:assetId`

**Description:** Poll analysis status and get results when complete.

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```json
{
  "assetId": "asset_id",
  "checkpoints": [
    {
      "checkpointId": "cp1",
      "name": "Heading Structure",
      "category": "Accessibility",
      "severity": "high",
      "failedCount": 3,
      "passedCount": 12,
      "canHighlight": { "page": true, "source": true }
    }
  ],
  "totalCheckpoints": 150,
  "totalErrors": 42
}
```

**Backend Implementation:**
```typescript
app.get('/dqm/assets/:assetId', authenticateSession, async (req, res) => {
  const { apiKey } = req.session;
  const { assetId } = req.params;
  
  const response = await fetch(
    `https://api.crownpeak.net/dqm-cms/v1/assets/${assetId}?apiKey=${apiKey}`,
    {
      headers: { 'x-api-key': apiKey },
    }
  );
  
  const data = await response.json();
  res.json(data);
});
```

#### 6. Get Highlighted HTML (All Errors)

**Endpoint:** `GET /dqm/assets/:assetId/pagehighlight/all`

**Description:** Get HTML with all errors highlighted using CSS classes.

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```html
<html>
  <body>
    <h1 class="astHighlightFull astError" data-checkpoint="cp1">
      Heading text
    </h1>
    <!-- More highlighted HTML -->
  </body>
</html>
```

**Backend Implementation:**
```typescript
app.get('/dqm/assets/:assetId/pagehighlight/all', authenticateSession, async (req, res) => {
  const { apiKey } = req.session;
  const { assetId } = req.params;
  
  const response = await fetch(
    `https://api.crownpeak.net/dqm-cms/v1/assets/${assetId}/pagehighlight/all?apiKey=${apiKey}`,
    {
      headers: { 'x-api-key': apiKey },
    }
  );
  
  const html = await response.text();
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
```

#### 7. Get Highlighted HTML (Specific Checkpoint)

**Endpoint:** `GET /dqm/assets/:assetId/pagehighlight/:checkpointId`

**Description:** Get HTML with only specific checkpoint errors highlighted.

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```html
<html>
  <body>
    <h1 class="astHighlightStart astError">Heading</h1>
  </body>
</html>
```

**Backend Implementation:**
```typescript
app.get('/dqm/assets/:assetId/pagehighlight/:checkpointId', authenticateSession, async (req, res) => {
  const { apiKey } = req.session;
  const { assetId, checkpointId } = req.params;
  
  const response = await fetch(
    `https://api.crownpeak.net/dqm-cms/v1/assets/${assetId}/pagehighlight/${checkpointId}?apiKey=${apiKey}`,
    {
      headers: { 'x-api-key': apiKey },
    }
  );
  
  const html = await response.text();
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
```

---

## Session Management

### Session Store Interface

```typescript
interface Session {
  apiKey: string;       // Real Crownpeak API key
  websiteId: string;    // Website ID
  userId?: string;      // Your user identifier
  expiresAt: number;    // Unix timestamp
}

interface SessionStore {
  create(apiKey: string, websiteId: string, userId?: string): Promise<string>;
  get(token: string): Promise<Session | null>;
  delete(token: string): Promise<void>;
  refresh(token: string): Promise<void>;
}
```

### Redis Implementation (Recommended)

```typescript
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL);
const SESSION_TTL = 86400; // 24 hours

export const sessionStore = {
  async create(apiKey: string, websiteId: string, userId?: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const session: Session = {
      apiKey,
      websiteId,
      userId,
      expiresAt: Date.now() + SESSION_TTL * 1000,
    };
    
    await redis.setex(
      `session:${token}`,
      SESSION_TTL,
      JSON.stringify(session)
    );
    
    return token;
  },

  async get(token: string): Promise<Session | null> {
    const data = await redis.get(`session:${token}`);
    if (!data) return null;
    
    const session: Session = JSON.parse(data);
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      await this.delete(token);
      return null;
    }
    
    return session;
  },

  async delete(token: string): Promise<void> {
    await redis.del(`session:${token}`);
  },

  async refresh(token: string): Promise<void> {
    const session = await this.get(token);
    if (session) {
      session.expiresAt = Date.now() + SESSION_TTL * 1000;
      await redis.setex(
        `session:${token}`,
        SESSION_TTL,
        JSON.stringify(session)
      );
    }
  },
};
```

### Authentication Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  session?: {
    apiKey: string;
    websiteId: string;
    userId?: string;
  };
}

export async function authenticateSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Get session from store
    const session = await sessionStore.get(token);
    if (!session) {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired session token',
      });
    }

    // Attach session to request
    req.session = session;

    // Optional: Refresh session TTL on activity
    await sessionStore.refresh(token);

    next();
  } catch (error) {
    console.error('[Auth] Session verification failed:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error during authentication',
    });
  }
}
```

---

## Security Best Practices

### 1. Encryption at Rest

Always encrypt API keys in database:

```typescript
// Generate encryption key (run once):
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

// Store in .env:
ENCRYPTION_KEY=your-64-character-hex-string-here
```

### 2. HTTPS Only

```typescript
// Redirect HTTP to HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### 3. CORS Configuration

```typescript
import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

app.use(cors({
   origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### 4. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
});

app.use('/auth', authLimiter);
```

### 5. Input Validation

```typescript
import { body, validationResult } from 'express-validator';

app.post('/auth/login',
  body('apiKey').isString().trim().notEmpty(),
  body('websiteId').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... proceed with login
  }
);
```

### 6. Audit Logging

```typescript
async function logAuthEvent(
  userId: string,
  action: string,
  success: boolean,
  ipAddress: string
) {
  await db.query(
    `INSERT INTO auth_audit_log (user_id, action, success, ip_address, timestamp)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, action, success, ipAddress]
  );
}

// Usage:
await logAuthEvent(userId, 'oauth_login', true, req.ip);
```

---

## Alternative: Shared Organizational Credentials

If you don't want per-user credentials, use a **single organization-wide API key**:

```typescript
// All users share same DQM credentials
authRouter.post('/oauth2/callback', async (req, res) => {
  // ... OAuth validation ...
  
  // Use organization-wide credentials from environment
  const apiKey = process.env.DQM_ORG_API_KEY!;
  const websiteId = process.env.DQM_ORG_WEBSITE_ID!;
  
  const sessionToken = await sessionStore.create(apiKey, websiteId, userId);
  
  res.json({ sessionToken, websiteId });
});
```

**Pros:**
- ✅ Simpler setup - no per-user credential management
- ✅ No database schema needed
- ✅ Easier admin maintenance

**Cons:**
- ❌ All users share same DQM analysis context
- ❌ Cannot track usage per user
- ❌ Cannot have different permissions per user

---

## Testing

### Test OAuth Flow

```bash
# 1. Start backend
npm run start:server

# 2. Open login page
open http://localhost:3001/auth/login

# 3. Click "Sign in with SSO"
# Should redirect to your OAuth provider

# 4. After auth, check callback
# Should exchange code for token
# Should create session in Redis
# Should return sessionToken
```

### Test Direct Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_test_api_key",
    "websiteId": "your_test_website_id"
  }'

# Expected response:
# {"sessionToken":"abc123...","websiteId":"your_test_website_id"}
```

### Test DQM Proxy

```bash
# Get session token first
TOKEN="your_session_token_here"

# Start analysis
curl -X POST http://localhost:3001/dqm/assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Test</h1></body></html>",
    "url": "https://example.com"
  }'

# Poll status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/dqm/assets/ASSET_ID_HERE
```

---

## Deployment Checklist

- [ ] Implement OAuth callback handler in `server/routes/auth.ts`
- [ ] Create database schema for `user_dqm_credentials`
- [ ] Generate encryption key and store in environment
- [ ] Configure OAuth provider (client ID, secret, URLs)
- [ ] Set up Redis (local, Redis Cloud, AWS ElastiCache)
- [ ] Build all components: `npm run build`
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS (Let's Encrypt, AWS Certificate Manager)
- [ ] Add rate limiting to auth endpoints
- [ ] Set up audit logging
- [ ] Test complete SSO flow end-to-end
- [ ] Test direct login fallback
- [ ] Monitor backend logs for errors
- [ ] Document process for users/admins

---

## Benefits of Backend Mode

✅ **Security**
- API keys never exposed in browser
- Encrypted storage in database
- Server-side request signing
- Audit trail of all requests

✅ **Centralized Management**
- Admin can update credentials for all users
- Single point for credential rotation
- Per-user or organization-wide credentials
- Consistent credential lifecycle

✅ **SSO Integration**
- Seamless login with existing user system
- No separate credential management for users
- Consistent UX with your application
- Support for enterprise identity providers

✅ **Scalability**
- Redis session store for high availability
- Horizontal scaling support
- Session sharing across instances
- Automatic session cleanup

✅ **Compliance**
- Meet security requirements
- Data encryption at rest and in transit
- Access control and permissions
- Detailed audit logs

---

## Support & Resources

- **Crownpeak DQM API**: https://docs.crownpeak.com/dqm-api
- **Component Source**: `src/DQMSidebar.tsx`
- **Auth UI Source**: `server-ui/src/`
- **Backend Source**: `server/`
- **Examples**: See `EXAMPLES.md` for integration patterns



---

### 2. Backend Session Authentication

**Endpoint:** `POST /auth/token`

**Description:** User is already authenticated via your backend's session/cookie system. Backend issues a DQM session token based on current user session.

**Request:**
```json
{}
```

**Headers:**
```
Cookie: your_session_cookie
```

**Response (Success - 200):**
```json
{
  "sessionToken": "unique_session_token_or_jwt",
  "websiteId": "user_website_id" // Optional
}
```

**Response (Error - 401):**
```json
{
  "message": "Not authenticated"
}
```

**Notes:**
- Uses existing user session (cookies, JWT, etc.)
- Backend determines user identity and associated DQM credentials
- Useful when user is already logged into your platform

---

### 3. OAuth2 Callback

**Endpoint:** `POST /auth/oauth2/callback`

**Description:** Process OAuth2 authorization code and issue session token.

**Request:**
```json
{
  "code": "oauth2_authorization_code",
  "redirectUri": "https://your-app.com/oauth-callback"
}
```

**Response (Success - 200):**
```json
{
  "sessionToken": "unique_session_token_or_jwt",
  "websiteId": "user_website_id" // Optional
}
```

**Response (Error - 401):**
```json
{
  "message": "OAuth2 token exchange failed"
}
```

**Notes:**
- Backend exchanges authorization code for access token with OAuth2 provider
- Retrieves user's DQM credentials from OAuth2 provider or your database
- Issues session token for DQM component

---

## DQM API Proxy Endpoints

When in Backend Mode, **ALL** DQM API calls are proxied through your backend. The component will use `config.authBackendUrl` as the base URL instead of calling Crownpeak DQM API directly.

### 4. Start Analysis

**Endpoint:** `POST /dqm/assets`

**Description:** Proxy for Crownpeak DQM API `POST /assets` - Start HTML analysis.

**Request Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "html": "<html>...</html>",
  "url": "https://example.com/page",
  "websiteId": "optional_if_backend_knows"
}
```

**Response (Success - 200):**
```json
{
  "assetId": "generated_asset_id",
  "analysisState": "analyzing"
}
```

**Backend Implementation:**
1. Verify session token and retrieve real API key + websiteId
2. Call Crownpeak DQM API: `POST https://api.crownpeak.net/dqm-cms/v1/assets`
   - Headers: `x-api-key: <real_api_key>`
   - Body: Same as client request
3. Return response to client

---

### 5. Get Analysis Status

**Endpoint:** `GET /dqm/assets/{assetId}`

**Description:** Proxy for Crownpeak DQM API `GET /assets/{assetId}` - Poll analysis status.

**Request Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```json
{
  "assetId": "asset_id",
  "analysisState": "completed",
  "checkpoints": [...],
  "totalErrors": 42,
  // ... full analysis data
}
```

**Backend Implementation:**
1. Verify session token and retrieve real API key
2. Call Crownpeak DQM API: `GET https://api.crownpeak.net/dqm-cms/v1/assets/{assetId}?apiKey=<real_api_key>`
3. Return response to client

---

### 6. Get Highlighted HTML (All Errors)

**Endpoint:** `GET /dqm/assets/{assetId}/pagehighlight/all`

**Description:** Proxy for Crownpeak DQM API - Get HTML with all errors highlighted.

**Request Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```html
<html>
  <!-- HTML with .astHighlightFull, .astError classes -->
</html>
```

**Backend Implementation:**
1. Verify session token and retrieve real API key
2. Call Crownpeak DQM API: `GET https://api.crownpeak.net/dqm-cms/v1/assets/{assetId}/pagehighlight/all?apiKey=<real_api_key>`
3. Return HTML response to client

---

### 7. Get Highlighted HTML (Specific Checkpoint)

**Endpoint:** `GET /dqm/assets/{assetId}/pagehighlight/{checkpointId}`

**Description:** Proxy for Crownpeak DQM API - Get HTML with specific checkpoint errors highlighted.

**Request Headers:**
```
Authorization: Bearer <sessionToken>
```

**Response (Success - 200):**
```html
<html>
  <!-- HTML with .astHighlightFull, .astError classes for specific checkpoint -->
</html>
```

**Backend Implementation:**
1. Verify session token and retrieve real API key
2. Call Crownpeak DQM API: `GET https://api.crownpeak.net/dqm-cms/v1/assets/{assetId}/pagehighlight/{checkpointId}?apiKey=<real_api_key>`
3. Return HTML response to client

---

## Session Management

### Session Token Storage

**Client-Side (localStorage):**
```javascript
localStorage.setItem('dqm_sessionToken', 'token');
localStorage.setItem('dqm_sessionType', 'backend');
```

**Backend-Side:**
- Store mapping: `sessionToken -> { apiKey, websiteId, userId, expiresAt }`
- Recommended: Redis, database, or in-memory cache with TTL
- Session should expire after inactivity (e.g., 24 hours)

### Token Validation

On every proxied API request:
1. Extract `Authorization: Bearer <sessionToken>` header
2. Validate session token (check existence, expiration)
3. Retrieve associated API key and websiteId
4. Proxy request to Crownpeak DQM API with real credentials

---

## Error Handling

### Standard Error Response

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE" // Optional
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid session token or credentials)
- `403` - Forbidden (valid token but insufficient permissions)
- `500` - Internal Server Error

---

## Security Considerations

1. **HTTPS Only:** Always use HTTPS in production
2. **CORS:** Configure CORS to allow requests from your React app domain
3. **Rate Limiting:** Implement rate limiting on auth endpoints
4. **Session Expiration:** Sessions should expire after 24 hours or on logout
5. **Token Rotation:** Consider refreshing session tokens periodically
6. **CSRF Protection:** Use CSRF tokens for state-changing operations
7. **Input Validation:** Validate all inputs (API keys, HTML content, etc.)
8. **API Key Storage:** Store real API keys encrypted in database

---

## Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

// Session store (use Redis in production)
const sessions = new Map();

// Auth endpoint - Direct credentials
app.post('/auth/login', async (req, res) => {
  const { apiKey, websiteId } = req.body;
  
  // Validate credentials with Crownpeak API
  try {
    const response = await axios.get(
      `https://api.crownpeak.net/dqm-cms/v1/websites/${websiteId}`,
      { headers: { 'x-api-key': apiKey } }
    );
    
    // Generate session token
    const sessionToken = generateUniqueToken();
    sessions.set(sessionToken, {
      apiKey,
      websiteId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    res.json({ sessionToken, websiteId });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// DQM API Proxy - Start analysis
app.post('/dqm/assets', authenticateSession, async (req, res) => {
  const { apiKey, websiteId } = req.session;
  
  try {
    const response = await axios.post(
      'https://api.crownpeak.net/dqm-cms/v1/assets',
      req.body,
      {
        headers: { 'x-api-key': apiKey },
        params: { apiKey, websiteId },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// Middleware: Verify session token
function authenticateSession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(token);
  
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
  
  req.session = session;
  next();
}

function generateUniqueToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

app.listen(3000);
```

---

## Frontend Configuration

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  return (
    <DQMSidebar
      open={true}
      onOpen={() => {}}
      onClose={() => {}}
      config={{
        authBackendUrl: 'https://your-backend.com', // Backend proxy base URL
        useLocalStorage: true, // Store session token
        
        // Optional: OAuth2 configuration
        oauth2Config: {
          authUrl: 'https://oauth-provider.com/authorize',
          tokenUrl: 'https://oauth-provider.com/token',
          clientId: 'your_client_id',
          redirectUri: 'https://your-app.com/oauth-callback',
          scope: 'dqm:read',
        },
      }}
      onAuthSuccess={(creds) => {
        console.log('Authenticated:', creds.sessionType); // 'backend'
      }}
    />
  );
}
```

---

## Testing

### Test Direct Credentials Flow

```bash
curl -X POST https://your-backend.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test_key","websiteId":"test_id"}'
```

### Test Analysis Proxy

```bash
curl -X POST https://your-backend.com/dqm/assets \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html>...</html>","url":"https://example.com"}'
```

---

## Migration Guide

### From Direct Mode to Backend Mode

1. **Implement backend endpoints** as documented above
2. **Update React component config:**
   ```tsx
   // Before (Direct Mode)
   config={{
     apiKey: 'user_api_key',
     websiteId: 'user_website_id',
   }}
   
   // After (Backend Mode)
   config={{
     authBackendUrl: 'https://your-backend.com',
   }}
   ```
3. **Clear old localStorage:**
   ```javascript
   localStorage.removeItem('dqm_apiKey');
   localStorage.removeItem('dqm_websiteID');
   ```

---

## Support

For questions or issues:
- Check Crownpeak DQM API docs: https://docs.crownpeak.com/dqm-api
- Review component source: `src/DQMSidebar.tsx`
- Check authentication flow: `src/components/auth/`
