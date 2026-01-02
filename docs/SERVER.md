# DQM Backend Server

This package includes an optional Express.js backend server that acts as a secure proxy for the Crownpeak DQM API.

## Why Use the Backend?

The backend server provides:
- **Secure API Key Storage**: API keys never exposed to the browser
- **Session Management**: Token-based authentication with Redis support
- **Request Proxying**: All DQM API calls routed through your backend
- **CORS Protection**: Controlled access to your DQM resources

## Quick Start

### 1. Install Dependencies

```bash
npm install @crownpeak/dqm-react-component
```

All server dependencies (Express, Redis client, etc.) are included.

### 2. Start the Server

**Basic (In-Memory Sessions):**
```bash
node node_modules/@crownpeak/dqm-react-component/dist/server/index.js
```

**With Redis (Recommended for Production):**
```bash
REDIS_URL=redis://localhost:6379 node node_modules/@crownpeak/dqm-react-component/dist/server/index.js
```

**Custom Port:**
```bash
PORT=4000 node node_modules/@crownpeak/dqm-react-component/dist/server/index.js
```

### 3. Configure Your React App

```tsx
import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

function App() {
  return (
    <DQMSidebar
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      config={{
        authBackendUrl: 'http://localhost:3001', // Your server URL
        useLocalStorage: true
      }}
    />
  );
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with API key and website ID
- `POST /api/auth/logout` - Invalidate session token
- `GET /api/auth/session` - Get current session info

### DQM Proxy
- `POST /api/dqm/assets` - Create analysis asset
- `GET /api/dqm/assets/:assetId/status` - Get analysis status
- `GET /api/dqm/assets/:assetId/pagehighlight/all` - Get all highlights
- `GET /api/dqm/assets/:assetId/pagehighlight/:checkpointId` - Get specific checkpoint

## Environment Variables

```bash
# Server Configuration
PORT=3001                                    # Server port (default: 3001)
CORS_ORIGINS=http://localhost:3000           # Allowed origins

# Redis Configuration (Optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379            # Local Redis
REDIS_URL=redis://user:pass@host:port       # Redis Cloud
REDIS_URL=redis://endpoint:6379             # AWS ElastiCache

# DQM API Configuration (Optional)
DQM_API_BASE_URL=https://api.crownpeak.net/dqm-cms/v1  # Default DQM API URL
```

## Production Deployment

### Docker Example

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Set environment
ENV PORT=3001
ENV REDIS_URL=redis://redis:6379
ENV NODE_ENV=production

# Start server
CMD ["node", "node_modules/@crownpeak/dqm-react-component/dist/server/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  dqm-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGINS=https://yourdomain.com
    depends_on:
      - redis
```

### PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start node_modules/@crownpeak/dqm-react-component/dist/server/index.js \
  --name dqm-server \
  -i max \
  --env production

# With environment variables
pm2 start node_modules/@crownpeak/dqm-react-component/dist/server/index.js \
  --name dqm-server \
  --env production \
  -- \
  REDIS_URL=redis://localhost:6379 \
  PORT=3001
```

## Session Storage

### In-Memory (Development)
- No Redis required
- Sessions lost on server restart
- Not suitable for production with multiple instances

### Redis (Production)
- Persistent sessions across restarts
- Supports horizontal scaling
- 24-hour session TTL (configurable)

See [REDIS-SETUP.md](./REDIS-SETUP.md) for detailed Redis configuration.

## Security Best Practices

1. **Always use HTTPS in production**
2. **Set proper CORS_ORIGINS** - never use `*`
3. **Use Redis with password** in production
4. **Keep dependencies updated**
5. **Monitor server logs** for suspicious activity
6. **Rate limit authentication endpoints** (consider adding rate-limiting middleware)

## Troubleshooting

### Server won't start
```bash
# Check if port is already in use
lsof -i :3001

# Try different port
PORT=4000 node dist/server/index.js
```

### Redis connection failed
```bash
# Verify Redis is running
redis-cli ping

# Check Redis URL format
echo $REDIS_URL
```

### CORS errors
```bash
# Add your frontend URL to CORS_ORIGINS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Session expired immediately
- Check if Redis is running (in-memory fallback loses sessions on restart)
- Verify clock sync between servers
- Check Redis TTL: `redis-cli TTL session:your-token`

## Development

```bash
# Clone repository
git clone https://github.com/Crownpeak/dqm-react-component.git
cd dqm-react-component

# Install dependencies
npm install

# Start dev server with hot reload
npm run dev:server

# Build server only
npm run build:server
```

## License

MIT © Crownpeak Technology GmbH
