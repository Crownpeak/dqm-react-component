// Session Store Service - Redis Implementation with In-Memory Fallback
// For production, configure REDIS_URL environment variable
// For development, falls back to in-memory storage
import { SessionData } from '../types.js';
import crypto from 'crypto';
import { config } from '../config.js';
import Redis from 'ioredis';

class SessionStore {
  private redis: Redis | null = null;
  private memoryStore: Map<string, SessionData> = new Map();
  private useRedis: boolean = false;
  
  constructor() {
    this.initializeRedis();
  }
  
  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          retryStrategy: (times) => {
            if (times > 3) {
              console.error('[SessionStore] Redis connection failed after 3 retries, falling back to in-memory');
              return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
          },
          maxRetriesPerRequest: 3,
        });
        
        this.redis.on('connect', () => {
          console.log('[SessionStore] ✅ Connected to Redis');
          this.useRedis = true;
        });
        
        this.redis.on('error', (err) => {
          console.error('[SessionStore] Redis error:', err.message);
          this.useRedis = false;
        });
        
        this.redis.on('close', () => {
          console.warn('[SessionStore] Redis connection closed, using in-memory fallback');
          this.useRedis = false;
        });
        
        // Test connection
        await this.redis.ping();
        this.useRedis = true;
        console.log('[SessionStore] Redis connection successful');
      } catch (error) {
        console.warn('[SessionStore] Redis not available, using in-memory storage:', error instanceof Error ? error.message : 'Unknown error');
        this.redis = null;
        this.useRedis = false;
      }
    } else {
      console.log('[SessionStore] No REDIS_URL configured, using in-memory storage (sessions will be lost on restart)');
    }
  }
  
  /**
   * Generate a unique session token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Create a new session
   */
  async create(apiKey: string, websiteId: string, userId?: string): Promise<string> {
    const token = this.generateToken();
    const now = Date.now();
    
    const session: SessionData = {
      apiKey,
      websiteId,
      userId,
      createdAt: now,
      expiresAt: now + config.session.ttl,
    };
    
    if (this.useRedis && this.redis) {
      try {
        // Store in Redis with TTL
        await this.redis.setex(
          `session:${token}`,
          Math.floor(config.session.ttl / 1000), // TTL in seconds
          JSON.stringify(session)
        );
        console.log(`[SessionStore] Created Redis session: ${token.substring(0, 8)}... (expires in ${config.session.ttl / 1000 / 60} minutes)`);
      } catch (error) {
        console.error('[SessionStore] Redis write failed, falling back to in-memory:', error);
        this.memoryStore.set(token, session);
      }
    } else {
      // Fallback to in-memory
      this.memoryStore.set(token, session);
      console.log(`[SessionStore] Created in-memory session: ${token.substring(0, 8)}... (expires in ${config.session.ttl / 1000 / 60} minutes)`);
    }
    
    return token;
  }
  
  /**
   * Get session data by token
   */
  async get(token: string): Promise<SessionData | null> {
    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(`session:${token}`);
        if (!data) {
          return null;
        }
        
        const session: SessionData = JSON.parse(data);
        
        // Check if session expired (redundant check, Redis TTL should handle this)
        if (Date.now() > session.expiresAt) {
          await this.redis.del(`session:${token}`);
          console.log(`[SessionStore] Session expired: ${token.substring(0, 8)}...`);
          return null;
        }
        
        return session;
      } catch (error) {
        console.error('[SessionStore] Redis read failed, checking in-memory:', error);
        return this.getFromMemory(token);
      }
    } else {
      return this.getFromMemory(token);
    }
  }
  
  /**
   * Get session from in-memory store
   */
  private getFromMemory(token: string): SessionData | null {
    const session = this.memoryStore.get(token);
    
    if (!session) {
      return null;
    }
    
    // Check if session expired
    if (Date.now() > session.expiresAt) {
      this.memoryStore.delete(token);
      console.log(`[SessionStore] Session expired: ${token.substring(0, 8)}...`);
      return null;
    }
    
    return session;
  }
  
  /**
   * Delete a session
   */
  async delete(token: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        const result = await this.redis.del(`session:${token}`);
        if (result > 0) {
          console.log(`[SessionStore] Deleted Redis session: ${token.substring(0, 8)}...`);
          return true;
        }
        return false;
      } catch (error) {
        console.error('[SessionStore] Redis delete failed:', error);
        return this.memoryStore.delete(token);
      }
    } else {
      const deleted = this.memoryStore.delete(token);
      if (deleted) {
        console.log(`[SessionStore] Deleted in-memory session: ${token.substring(0, 8)}...`);
      }
      return deleted;
    }
  }
  
  /**
   * Extend session expiration
   */
  async extend(token: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        // Get current session data
        const data = await this.redis.get(`session:${token}`);
        if (!data) {
          return false;
        }
        
        const session: SessionData = JSON.parse(data);
        session.expiresAt = Date.now() + config.session.ttl;
        
        // Update with new expiration
        await this.redis.setex(
          `session:${token}`,
          Math.floor(config.session.ttl / 1000),
          JSON.stringify(session)
        );
        return true;
      } catch (error) {
        console.error('[SessionStore] Redis extend failed:', error);
        return this.extendInMemory(token);
      }
    } else {
      return this.extendInMemory(token);
    }
  }
  
  /**
   * Extend session in memory
   */
  private extendInMemory(token: string): boolean {
    const session = this.memoryStore.get(token);
    if (!session) {
      return false;
    }
    
    session.expiresAt = Date.now() + config.session.ttl;
    return true;
  }
  
  /**
   * Clean up expired sessions (only for in-memory)
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [token, session] of this.memoryStore.entries()) {
      if (now > session.expiresAt) {
        this.memoryStore.delete(token);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[SessionStore] Cleaned up ${cleaned} expired in-memory sessions`);
    }
    
    return cleaned;
  }
  
  /**
   * Get session count (for monitoring)
   */
  async count(): Promise<number> {
    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys('session:*');
        return keys.length;
      } catch (error) {
        console.error('[SessionStore] Redis count failed:', error);
        return this.memoryStore.size;
      }
    } else {
      return this.memoryStore.size;
    }
  }
  
  /**
   * Get storage type
   */
  getStorageType(): 'redis' | 'memory' {
    return this.useRedis ? 'redis' : 'memory';
  }
}

// Singleton instance
export const sessionStore = new SessionStore();

// Auto-cleanup for in-memory sessions every hour
setInterval(() => {
  if (sessionStore.getStorageType() === 'memory') {
    sessionStore.cleanup();
  }
}, 60 * 60 * 1000);

