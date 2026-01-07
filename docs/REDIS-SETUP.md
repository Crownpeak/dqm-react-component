## Problem

The backend uses **In-Memory Sessions** by default. These are lost on every server restart, which means:
- Users must log in again after every deployment
- Development with hot-reload causes frequent session losses
- Load-balancing across multiple servers doesn't work

## Solution: Redis

Redis stores sessions persistently and across servers. Sessions survive:
- ✅ Server restarts
- ✅ Deployments
- ✅ Load balancing
- ✅ Hot-reload during development

## Quick Start

### Local Development (Docker)

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Set environment variable
export REDIS_URL=redis://localhost:6379

# Start server
npm run dev:server
```

### Local Development (without Docker)

```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Set environment variable
export REDIS_URL=redis://localhost:6379

# Start server
npm run dev:server
```

### Production Deployment

#### Option 1: Redis Cloud (Managed, Free Tier available)

1. Create an account on [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Copy the connection string
4. Set environment variable:

```bash
REDIS_URL=redis://default:password@redis-xxxxx.redislabs.com:xxxxx
```

#### Option 2: AWS ElastiCache

```bash
REDIS_URL=redis://your-elasticache-cluster.xxxxx.cache.amazonaws.com:6379
```

#### Option 3: Azure Cache for Redis

```bash
REDIS_URL=redis://:password@your-cache.redis.cache.windows.net:6380?tls=true
```

#### Option 4: Heroku Redis

```bash
# Automatically set via REDIS_URL env var
heroku addons:create heroku-redis:mini
```

## Fallback Behavior

When **no Redis connection** is available:
- ⚠️ Automatic fallback to in-memory storage
- ⚠️ Warning log: "Redis not available, using in-memory storage"
- ⚠️ Sessions are lost on server restart

## Monitoring

The backend logs show:
```
[SessionStore] ✅ Connected to Redis
[SessionStore] Created Redis session: a285dde5... (expires in 1440 minutes)
[Auth] Current sessions in store: 5 (storage: redis)
```

## Configuration

### Environment Variables

```bash
# .env
REDIS_URL=redis://localhost:6379

# Optional Redis configuration
REDIS_PASSWORD=your-password
REDIS_TLS=true  # For production with TLS
```

### Session TTL

Sessions expire after 24 hours (configurable in `server/config.ts`):

```typescript
session: {
  ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
}
```

## Troubleshooting

### "Redis connection failed"
- Check if Redis is running: `redis-cli ping` → should return "PONG"
- Check REDIS_URL format
- Check firewall/security groups

### "Session expired" despite Redis
- TTL might be too short → Increase in `config.ts`
- Redis memory full → Check `redis-cli info memory`

### Sessions are not being saved
- Check backend logs: Should show "Created Redis session"
- Check Redis: `redis-cli KEYS "session:*"`

## Best Practices

### Development
```bash
# Local Redis, no persistence needed
docker run -d -p 6379:6379 redis:alpine
```

### Staging/Production
```bash
# Managed Redis with backups and monitoring
# Redis Cloud, AWS ElastiCache, Azure Cache
```

### Security
- ✅ Use TLS in production (`rediss://` instead of `redis://`)
- ✅ Use strong passwords
- ✅ Restrict network access (security groups)
- ✅ Enable Redis AUTH

## Migration from In-Memory to Redis

No code changes required! Simply:
1. Set REDIS_URL environment variable
2. Restart server
3. Backend automatically detects Redis

Existing sessions are lost during migration (users must log in again).
