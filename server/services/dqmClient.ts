// Crownpeak DQM API Client
import axios, { AxiosInstance } from 'axios';
import { config } from '../config.js';
import { DQMAssetRequest, DQMAssetResponse } from '../types.js';

export class DQMClient {
  private client: AxiosInstance;
  
  constructor(private apiKey: string, private websiteId: string) {
    this.client = axios.create({
      baseURL: config.dqm.apiBaseUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000, // 30 seconds
    });
  }
  
  /**
   * Start HTML analysis
   */
  async createAsset(data: DQMAssetRequest): Promise<DQMAssetResponse> {
    try {
      const encodedApiKey = encodeURIComponent(this.apiKey);
      const targetWebsiteId = data.websiteId || this.websiteId;
      
      // Convert to URLSearchParams for proper application/x-www-form-urlencoded encoding
      const formData = new URLSearchParams();
      formData.append('websiteId', targetWebsiteId);
      formData.append('content', data.html);
      formData.append('contentType', 'text/html; charset=UTF-8');
      formData.append('title', data.url || 'DQM Analysis');
      formData.append('timestamp', new Date().toISOString());
      
      const response = await this.client.post(`/assets?apiKey=${encodedApiKey}`, formData, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[DQMClient] Create asset error:', error.response?.data || error.message);
      throw new Error(`Failed to create DQM asset: ${error.response?.data?.message || error.response?.statusText || error.message}`);
    }
  }
  
  /**
   * Get analysis status and results
   */
  async getAssetStatus(assetId: string): Promise<DQMAssetResponse> {
    try {
      const encodedApiKey = encodeURIComponent(this.apiKey);

      const response = await this.client.get(`/assets/${assetId}/status?apiKey=${encodedApiKey}`, {
        headers: {
          'x-api-key': this.apiKey,
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[DQMClient] Get asset error:', error.response?.data || error.message);
      throw new Error(`Failed to get DQM asset: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Get highlighted HTML for all errors
   */
  async getPageHighlightAll(assetId: string): Promise<string> {
    try {
      const encodedApiKey = encodeURIComponent(this.apiKey);
      
      const response = await this.client.get(`/assets/${assetId}/pagehighlight/all?apiKey=${encodedApiKey}`, {
        responseType: 'text',
        headers: {
          'x-api-key': this.apiKey,
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[DQMClient] Get page highlight error:', error.response?.data || error.message);
      throw new Error(`Failed to get page highlight: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Get highlighted HTML for specific checkpoint
   * @param assetId - The asset ID
   * @param checkpointId - The checkpoint ID
   * @param highlightSource - If true, returns source view with highlighted code snippet. If false, returns browser view with full page.
   */
  async getPageHighlightCheckpoint(assetId: string, checkpointId: string, highlightSource: boolean = false): Promise<string> {
    try {
      const encodedApiKey = encodeURIComponent(this.apiKey);
      
      const response = await this.client.get(`/assets/${assetId}/errors/${checkpointId}?apiKey=${encodedApiKey}&highlightSource=${highlightSource}`, {
        responseType: 'text',
        headers: {
          'x-api-key': this.apiKey,
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[DQMClient] Get checkpoint highlight error:', error.response?.data || error.message);
      throw new Error(`Failed to get checkpoint highlight: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Validate credentials by making a test request
   * We'll use the /assets endpoint with minimal data as a test
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const encodedApiKey = encodeURIComponent(this.apiKey);
      
      // Simple test: Try to get assets list (should return empty or existing assets)
      await this.client.get(`/assets?apiKey=${encodedApiKey}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });
      return true;
    } catch (error: any) {
      console.error('[DQMClient] Credential validation failed:', error.response?.status || error.message);
      return false;
    }
  }
}
