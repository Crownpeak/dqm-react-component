# Redis Setup für Production-Ready Sessions

## Problem

Das Backend verwendet standardmäßig **In-Memory Sessions**. Diese gehen bei jedem Server-Restart verloren, was bedeutet:
- User müssen sich nach jedem Deployment neu einloggen
- Development mit Hot-Reload führt zu häufigen Session-Verlusten
- Load-Balancing über mehrere Server funktioniert nicht

## Lösung: Redis

Redis speichert Sessions persistent und server-übergreifend. Sessions überleben:
- ✅ Server-Restarts
- ✅ Deployments
- ✅ Load-Balancing
- ✅ Hot-Reload während Development

## Quick Start

### Lokale Entwicklung (Docker)

```bash
# Redis starten
docker run -d -p 6379:6379 redis:alpine

# Umgebungsvariable setzen
export REDIS_URL=redis://localhost:6379

# Server starten
npm run dev:server
```

### Lokale Entwicklung (ohne Docker)

```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Umgebungsvariable setzen
export REDIS_URL=redis://localhost:6379

# Server starten
npm run dev:server
```

### Production Deployment

#### Option 1: Redis Cloud (Managed, Free Tier verfügbar)

1. Erstelle Account auf [Redis Cloud](https://redis.com/try-free/)
2. Erstelle neue Datenbank
3. Kopiere Connection String
4. Setze Environment Variable:

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
# Automatisch via REDIS_URL env var gesetzt
heroku addons:create heroku-redis:mini
```

## Fallback-Verhalten

Wenn **keine Redis-Verbindung** verfügbar ist:
- ⚠️ Automatischer Fallback auf In-Memory Storage
- ⚠️ Warning-Log: "Redis not available, using in-memory storage"
- ⚠️ Sessions gehen bei Server-Restart verloren

## Monitoring

Die Backend-Logs zeigen:
```
[SessionStore] ✅ Connected to Redis
[SessionStore] Created Redis session: a285dde5... (expires in 1440 minutes)
[Auth] Current sessions in store: 5 (storage: redis)
```

## Konfiguration

### Environment Variables

```bash
# .env
REDIS_URL=redis://localhost:6379

# Optionale Redis-Konfiguration
REDIS_PASSWORD=your-password
REDIS_TLS=true  # Für Production mit TLS
```

### Session TTL

Sessions laufen nach 24 Stunden ab (konfigurierbar in `server/config.ts`):

```typescript
session: {
  ttl: 24 * 60 * 60 * 1000, // 24 Stunden in Millisekunden
}
```

## Troubleshooting

### "Redis connection failed"
- Prüfe ob Redis läuft: `redis-cli ping` → sollte "PONG" zurückgeben
- Prüfe REDIS_URL Format
- Prüfe Firewall/Security Groups

### "Session expired" trotz Redis
- TTL möglicherweise zu kurz → Erhöhe in `config.ts`
- Redis Memory voll → Prüfe `redis-cli info memory`

### Sessions werden nicht gespeichert
- Prüfe Backend-Logs: Sollte "Created Redis session" zeigen
- Prüfe Redis: `redis-cli KEYS "session:*"`

## Best Practices

### Development
```bash
# Lokaler Redis, keine Persistenz nötig
docker run -d -p 6379:6379 redis:alpine
```

### Staging/Production
```bash
# Managed Redis mit Backups und Monitoring
# Redis Cloud, AWS ElastiCache, Azure Cache
```

### Security
- ✅ Verwende TLS in Production (`rediss://` statt `redis://`)
- ✅ Verwende starke Passwörter
- ✅ Beschränke Network-Zugriff (Security Groups)
- ✅ Aktiviere Redis AUTH

## Migration von In-Memory zu Redis

Keine Code-Änderungen nötig! Einfach:
1. REDIS_URL Environment Variable setzen
2. Server neu starten
3. Backend erkennt Redis automatisch

Bestehende Sessions gehen bei der Migration verloren (User müssen sich neu einloggen).
