// Authentication Middleware
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types.js';
import { sessionStore } from '../services/sessionStore.js';

/**
 * Middleware to verify session token and attach session data to request
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Auth] Missing or invalid authorization header');
    return res.status(401).json({
      error: true,
      message: 'Missing or invalid authorization header',
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const session = await sessionStore.get(token);
  
  if (!session) {
    console.error(`[Auth] Invalid or expired session token: ${token.substring(0, 16)}...`);
    const count = await sessionStore.count();
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
  
  // Attach session data to request
  req.session = session;
  req.sessionToken = token;
  
  // Extend session expiration on each request
  await sessionStore.extend(token);
  
  next();
}
