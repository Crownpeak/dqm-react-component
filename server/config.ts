import {config as dotenvConfig} from 'dotenv';
dotenvConfig();

// Server Configuration
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  
  // Session configuration
  session: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  
  // Crownpeak DQM API
  dqm: {
    apiBaseUrl: process.env.DQM_API_BASE_URL || 'https://api.crownpeak.net/dqm-cms/v1',
  },
  
  // JWT (optional, for session tokens)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h',
  },
};
