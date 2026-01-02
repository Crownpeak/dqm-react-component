# Development Guide

## Running the Complete Stack

### Start Development (Frontend + Backend)

```bash
npm run dev
```

This runs both servers concurrently:
- **Frontend (Vite)**: http://localhost:3000
- **Backend (Express)**: http://localhost:3001

### Start Individual Servers

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

## Project Structure

```
crownpeak-dqm-react-component/
├── src/                          # React component source
│   ├── components/
│   │   ├── auth/                # Authentication components
│   │   ├── sidebar/             # Sidebar UI components
│   │   ├── cards/               # Analysis result cards
│   │   ├── renderers/           # HTML rendering
│   │   └── common/              # Shared components
│   ├── utils/                   # Utilities
│   ├── types.ts                 # TypeScript types
│   ├── DQMSidebar.tsx          # Main component
│   ├── index.ts                # Library entry point
│   ├── App.tsx                 # Dev test harness
│   └── main.tsx                # Dev app entry
│   ├── html-pages/              # Widget entrypoint, loaders, declarations
│
├── server/                      # Backend API
│   ├── routes/                 # API endpoints
│   │   ├── auth.ts            # Authentication
│   │   └── dqm.ts             # DQM proxy
│   ├── services/              # Business logic
│   │   ├── sessionStore.ts   # Session management
│   │   └── dqmClient.ts      # DQM API client
│   ├── middleware/            # Express middleware
│   ├── config.ts              # Configuration
│   ├── types.ts               # TypeScript types
│   └── index.ts               # Express app
│
├── dist/                       # Build output
│   ├── index.js               # Library ESM
│   ├── index.cjs              # Library CommonJS
│   ├── index.d.ts             # Library type declarations
│   ├── dqm-widget.esm.js      # Widget bundle (ESM)
│   ├── dqm-widget.iife.js     # Widget bundle (IIFE)
│   └── dqm-widget.d.ts        # Widget type declarations
│   └── server/                # Compiled server code
│
├── test/                       # Demo pages for widget bundles
├── public/                     # Landing page for demos
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript base config
├── tsconfig.lib.json          # Library build config
├── tsconfig.server.json       # Server build config
└── package.json               # Dependencies & scripts
```

## Authentication Modes

The component supports two modes:

### 1. Backend Mode (Recommended for Production)

```tsx
<DQMSidebar
  config={{
    authBackendUrl: 'http://localhost:3001',
    useLocalStorage: true,
  }}
/>
```

- All API calls proxied through backend
- Session token stored in localStorage
- Real credentials never exposed to client

### 2. Direct Mode (Development/Staging)

```tsx
<DQMSidebar
  config={{
    apiKey: 'YOUR_API_KEY',
    websiteId: 'YOUR_WEBSITE_ID',
  }}
/>
```

- Direct communication with Crownpeak DQM API
- Credentials in props or localStorage
- No backend required

## Testing Both Modes

### Test Backend Mode

1. Start both servers: `npm run dev`
2. Open http://localhost:3000
3. Click "Login" and enter credentials
4. Backend validates and issues session token
5. All API calls go through http://localhost:3001

### Test Direct Mode

1. Update `src/App.tsx`:
```tsx
<DQMSidebar
  config={{
    apiKey: 'YOUR_API_KEY',
    websiteId: 'YOUR_WEBSITE_ID',
  }}
/>
```

2. Start frontend only: `npm run dev:client`
3. No backend needed, direct API calls

## Building for Production

### Build Library

```bash
npm run build:lib
```

Output: `dist/index.{js,cjs,d.ts}`

### Build Widget Bundle

```bash
npm run build:widget
```

Output: `dist/dqm-widget.{esm.js,iife.js,d.ts}` (fully bundled, Shadow DOM-safe)

### Build Server

```bash
npm run build:server
```

Output: `dist/server/`

### Build Everything

```bash
npm run build
```

Runs library + widget + backend + auth UI builds.

### Test Library Build

```bash
npm pack
# Creates: crownpeak-dqm-react-component-1.0.0.tgz
```

### Preview Widget Bundle Locally

```bash
npm run build:widget
npm run serve:widget
```

Serves `dist/` plus demo pages via `serve.json` rewrites:
- `/test/demo-iife.html` for IIFE bundle
- `/test/demo-esm.html` for ESM bundle
- `/test/demo-dynamic.html` for lazy loading
- `/test/widget-standalone.html` for full standalone demo

## Environment Configuration

### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env)

```env
PORT=3001
CORS_ORIGINS=http://localhost:3000
DQM_API_BASE_URL=https://api.crownpeak.net/dqm-cms/v1
JWT_SECRET=your-secret-key
```

## API Testing with cURL

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "websiteId": "YOUR_WEBSITE_ID"
  }'
```

Response:
```json
{
  "sessionToken": "abc123...",
  "websiteId": "YOUR_WEBSITE_ID"
}
```

### Start Analysis

```bash
curl -X POST http://localhost:3001/dqm/assets \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Test</h1></body></html>",
    "url": "https://example.com"
  }'
```

### Get Results

```bash
curl -X GET http://localhost:3001/dqm/assets/ASSET_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Debugging

### Enable Verbose Logging

Backend logs all requests automatically. Check terminal output:

```
[2025-10-31T10:00:00.000Z] POST /auth/login
[Auth] User logged in successfully (websiteId: test_id)
[SessionStore] Created session: abc12345... (expires in 1440 minutes)
```

### Check Session Status

```bash
curl -X GET http://localhost:3001/auth/session \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### View Active Sessions (Dev Only)

Add to `server/routes/auth.ts`:

```typescript
authRouter.get('/sessions/count', (req, res) => {
  res.json({ count: sessionStore.count() });
});
```

## Common Issues

### CORS Errors

**Problem:** Frontend can't reach backend

**Solution:** Add frontend URL to `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:3000
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:** Kill process or change port:
```bash
lsof -ti:3001 | xargs kill -9
# or change PORT in .env
```

### Session Expired

**Problem:** 401 Unauthorized after some time

**Solution:** Session TTL is 24 hours. Login again or extend TTL in `server/config.ts`:
```typescript
session: {
  ttl: 48 * 60 * 60 * 1000, // 48 hours
}
```

### TypeScript Errors

**Problem:** Type errors in server code

**Solution:** Ensure @types packages installed:
```bash
npm install --save-dev @types/express @types/cors @types/node
```

## Production Deployment

### Deploy Backend

1. Build server: `npm run build:server`
2. Copy `dist/server/` to production
3. Set environment variables
4. Install production dependencies only
5. Start: `node dist/server/index.js`

### Use Redis for Sessions

Replace `server/services/sessionStore.ts` with Redis:

```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

await redis.connect();

export const sessionStore = {
  create: async (apiKey, websiteId) => {
    const token = generateToken();
    await redis.setEx(`session:${token}`, 86400, JSON.stringify({
      apiKey, websiteId, createdAt: Date.now()
    }));
    return token;
  },
  get: async (token) => {
    const data = await redis.get(`session:${token}`);
    return data ? JSON.parse(data) : null;
  },
  delete: async (token) => {
    await redis.del(`session:${token}`);
  }
};
```

### Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/auth/login', limiter);
```

## License

MIT
