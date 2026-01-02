# DQM Backend API

Express.js REST API server for proxying Crownpeak DQM API requests with session-based authentication.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

```env
PORT=3001
CORS_ORIGINS=http://localhost:3000
DQM_API_BASE_URL=https://api.crownpeak.net/dqm-cms/v1
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start Development Server

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run backend only
npm run dev:server
```

Server runs on `http://localhost:3001`

## Architecture

```
server/
├── index.ts                # Express app entry point
├── config.ts               # Configuration (env vars)
├── types.ts                # TypeScript type definitions
├── middleware/
│   ├── authenticate.ts     # Session token verification
│   └── errorHandler.ts     # Global error handling
├── routes/
│   ├── auth.ts             # Authentication endpoints
│   └── dqm.ts              # DQM API proxy endpoints
└── services/
    ├── sessionStore.ts     # Session management (in-memory)
    └── dqmClient.ts        # Crownpeak DQM API client
```

## API Endpoints

### Authentication

#### `POST /auth/login`

Direct credentials login - validate and issue session token

**Request:**

```json
{
  "apiKey": "user_api_key",
  "websiteId": "user_website_id"
}
```

**Response:**

```json
{
  "sessionToken": "abc123...",
  "websiteId": "user_website_id"
}
```

### Session Operations (all require `Authorization: Bearer <token>`)

#### `POST /auth/logout`

Invalidate session token

#### `GET /auth/session`

Get current session info

### DQM Proxy (all require `Authorization: Bearer <token>`)

#### `POST /dqm/assets`

Start HTML analysis

Make sure to remove url field when testing, since Crownpeak DQM rejects multiple calls with the same URL.

**Request:**

```json
{
  "html": "<html>...</html>",
  "url": "https://example.com"
}
```

#### `GET /dqm/assets/:assetId`

Get analysis results

#### `GET /dqm/assets/:assetId/pagehighlight/all`

Get highlighted HTML for all errors

#### `GET /dqm/assets/:assetId/pagehighlight/:checkpointId`

Get highlighted HTML for specific checkpoint

## Session Management

- **Storage**: In-memory Map (use Redis for production)
- **TTL**: 24 hours (configurable)
- **Auto-cleanup**: Expired sessions cleaned every hour
- **Token format**: 64-character hex string

### Production Considerations

For production, replace `sessionStore.ts` with Redis:

```typescript
import {createClient} from 'redis';

const redis = createClient();
await redis.connect();

// Store session
await redis.setEx(`session:${token}`, 86400, JSON.stringify(session));

// Get session
const data = await redis.get(`session:${token}`);
```

## Security

- ✅ Helmet.js for HTTP headers
- ✅ CORS with whitelist
- ✅ Session token expiration
- ✅ API key validation
- ✅ Request size limits (10MB)
- ⚠️ In-memory sessions (use Redis in production)
- ⚠️ No rate limiting (add in production)

## Frontend Configuration

Update React component to use backend mode:

```tsx
import {DQMSidebar} from '@crownpeak/dqm-react-sdk';
import {useState} from 'react';

const [open, setOpen] = useState(true);

<DQMSidebar
    open={open}
    onOpen={() => setOpen(true);}
    onClose={() => setOpen(false)}
    config={{
        authBackendUrl: 'http://localhost:3001', // Backend URL
        useLocalStorage: true,
    }}
/>
```

## Testing

### Test Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_API_KEY","websiteId":"YOUR_WEBSITE_ID"}'
```

### Test Analysis (with token from login)

```bash
curl -X POST http://localhost:3001/dqm/assets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"html":"<html><body>Test</body></html>","url":"https://example.com"}'
```

## Development

### Watch Mode

```bash
npm run dev:server
```

Changes to `server/**/*` files trigger automatic restart.

### Build

```bash
npm run build:server
```

Compiles TypeScript to `dist/server/`.

### Production

```bash
npm run build:server
npm run start:server
```

## Environment Variables

| Variable           | Default                                | Description                       |
|--------------------|----------------------------------------|-----------------------------------|
| `PORT`             | `3001`                                 | Server port                       |
| `CORS_ORIGINS`     | `http://localhost:3000,...`            | Allowed origins (comma-separated) |
| `DQM_API_BASE_URL` | `https://api.crownpeak.net/dqm-cms/v1` | Crownpeak DQM API base URL        |
| `JWT_SECRET`       | `your-secret-key...`                   | Secret for JWT signing (if used)  |

## Troubleshooting

### CORS Errors

Add your frontend URL to `CORS_ORIGINS` in `.env`

### Session Expired

Sessions expire after 24 hours. Login again to get new token.

### Invalid Credentials

Check that API key and website ID are correct in Crownpeak DQM.

### Port Already in Use

Change `PORT` in `.env` or kill process on port 3001:

```bash
lsof -ti:3001 | xargs kill -9
```

## License

MIT License. See `LICENSE` file for details.
