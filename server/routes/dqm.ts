// DQM API Proxy Routes
import { Router, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { AuthenticatedRequest } from '../types.js';
import { DQMClient } from '../services/dqmClient.js';

export const dqmRouter = Router();

// All DQM routes require authentication
dqmRouter.use(authenticate);

/**
 * POST /dqm/assets
 * Proxy: Create new DQM analysis asset
 */
dqmRouter.post('/assets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: true, message: 'No session' });
    }
    
    const { html, url, websiteId } = req.body;
    
    if (!html) {
      return res.status(400).json({
        error: true,
        message: 'Missing required field: html',
      });
    }
    
    // Create DQM client with session credentials
    const dqmClient = new DQMClient(req.session.apiKey, req.session.websiteId);
    
    // Create asset
    const result = await dqmClient.createAsset({
      html,
      url,
      websiteId: websiteId || req.session.websiteId,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('[DQM] Create asset error:', error.message);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to create asset',
    });
  }
});

/**
 * GET /dqm/assets/:assetId/status
 * Proxy: Get DQM analysis results
 */
dqmRouter.get('/assets/:assetId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: true, message: 'No session' });
    }
    
    const { assetId } = req.params;

    if (!assetId) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameter: assetId',
      });
    }
    
    // Create DQM client with session credentials
    const dqmClient = new DQMClient(req.session.apiKey, req.session.websiteId);
    
    // Get asset
    const result = await dqmClient.getAssetStatus(assetId);
    
    res.json(result);
  } catch (error: any) {
    console.error('[DQM] Get asset error:', error.message);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get asset',
    });
  }
});

/**
 * GET /dqm/assets/:assetId/pagehighlight/all
 * Proxy: Get highlighted HTML for all errors
 */
dqmRouter.get('/assets/:assetId/pagehighlight/all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: true, message: 'No session' });
    }
    
    const { assetId } = req.params;
    
    if (!assetId) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameter: assetId',
      });
    }
    
    // Create DQM client with session credentials
    const dqmClient = new DQMClient(req.session.apiKey, req.session.websiteId);
    
    // Get highlighted HTML
    const html = await dqmClient.getPageHighlightAll(assetId);
    
    // Return as HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('[DQM] Get page highlight error:', error.message);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get page highlight',
    });
  }
});

/**
 * GET /dqm/assets/:assetId/pagehighlight/:checkpointId
 * Proxy: Get highlighted HTML for specific checkpoint
 * Query params: highlightSource=true/false (default: false for browser view)
 */
dqmRouter.get('/assets/:assetId/pagehighlight/:checkpointId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.session) {
      return res.status(401).json({ error: true, message: 'No session' });
    }
    
    const { assetId, checkpointId } = req.params;
    const { highlightSource } = req.query;
    
    if (!assetId || !checkpointId) {
      return res.status(400).json({
        error: true,
        message: 'Missing required parameters: assetId, checkpointId',
      });
    }
    
    // Create DQM client with session credentials
    const dqmClient = new DQMClient(req.session.apiKey, req.session.websiteId);
    
    // Get highlighted HTML (with optional highlightSource parameter)
    const html = await dqmClient.getPageHighlightCheckpoint(
      assetId, 
      checkpointId,
      highlightSource === 'true'
    );
    
    // Return as HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('[DQM] Get checkpoint highlight error:', error.message);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get checkpoint highlight',
    });
  }
});
