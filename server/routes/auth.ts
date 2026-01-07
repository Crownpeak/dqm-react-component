// Authentication Routes
import { Router, Request, Response } from 'express';
import { sessionStore } from '../services/sessionStore.js';
import { DQMClient } from '../services/dqmClient.js';
import { authenticate } from '../middleware/authenticate.js';
import { AuthenticatedRequest } from '../types.js';

export const authRouter = Router();

/**
 * POST /auth/login
 * Direct credentials login - validate with DQM API and issue session token
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { apiKey, websiteId } = req.body;
    
    if (!apiKey || !websiteId) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields: apiKey, websiteId',
      });
    }
    
    // Validate API key encoding (must be ASCII)
    if (!/^[\x00-\x7F]*$/.test(apiKey)) {
      return res.status(400).json({
        error: true,
        message: 'API key contains non-ASCII characters',
      });
    }
    
    // Validate credentials with Crownpeak DQM API (optional validation)
    // If validation fails, we still create a session and let the actual API call fail later
    // This allows users to login even if the validation endpoint doesn't work
    const dqmClient = new DQMClient(apiKey, websiteId);
    const isValid = await dqmClient.validateCredentials();
    
    if (!isValid) {
      console.warn('[Auth] Could not validate credentials during login, will validate on first API call');
    }
    
    // Create session regardless of validation result
    const sessionToken = await sessionStore.create(apiKey, websiteId);
    
    console.log(`[Auth] User logged in (websiteId: ${websiteId})`);
    
    res.json({
      sessionToken,
      websiteId,
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error.message);
    res.status(401).json({
      error: true,
      message: error.message || 'Authentication failed',
    });
  }
});

/**
 * POST /auth/token
 * DISABLED - Use /auth/login instead for direct credential authentication
 */
authRouter.post('/token', async (req: Request, res: Response) => {
  return res.status(501).json({
    error: true,
    message: 'Session-based authentication not available. Please use /auth/login with API key and website ID.',
  });
});

/**
 * POST /auth/token/validate
 * Validate if a session token is still valid
 */
authRouter.post('/token/validate', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({
        valid: false,
        message: 'Missing sessionToken',
      });
    }
    
    // Get session from store
    const session = await sessionStore.get(sessionToken);
    
    if (!session) {
      return res.status(200).json({
        valid: false,
        message: 'Session not found or expired',
      });
    }
    
    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      // Clean up expired session
      await sessionStore.delete(sessionToken);
      return res.status(200).json({
        valid: false,
        message: 'Session expired',
      });
    }
    
    // Session is valid
    res.json({
      valid: true,
      websiteId: session.websiteId,
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    console.error('[Auth] Token validation error:', error.message);
    res.status(500).json({
      valid: false,
      message: 'Token validation failed',
    });
  }
});

/**
 * POST /auth/logout
 * Logout - invalidate session token
 */
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    await sessionStore.delete(req.sessionToken);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /auth/session
 * Get current session info (for debugging)
 */
authRouter.get('/session', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    session: {
      websiteId: req.session?.websiteId,
      createdAt: req.session?.createdAt,
      expiresAt: req.session?.expiresAt,
    },
  });
});
