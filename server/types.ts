// Backend Type Definitions
import { Request } from 'express';

export interface SessionData {
  apiKey: string;
  websiteId: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthenticatedRequest extends Request {
  session?: SessionData;
  sessionToken?: string;
}

export interface DQMAssetRequest {
  html: string;
  url?: string;
  websiteId?: string;
}

export interface DQMAssetResponse {
  assetId: string;
  id: string;
  analysisState: 'analyzing' | 'completed' | 'error';
  created?: string;
  siteName?: string;
  totalCheckpoints?: number;
  totalErrors?: number;
  checkpoints?: any[];
}
