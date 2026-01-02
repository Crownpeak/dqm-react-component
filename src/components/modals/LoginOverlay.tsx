/**
 * LoginOverlay Component
 *
 * Full-screen overlay for authentication when user is not logged in.
 * Displays DQM branding header and login form.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { DQMConfig, SessionType } from '../../types';
import { DQMLogin, OAuth2CallbackHandler } from '../auth';

export interface LoginOverlayProps {
  /** Configuration object */
  config?: DQMConfig;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Callback when authentication succeeds */
  onAuthSuccess: (creds: {
    apiKey: string;
    websiteId: string;
    sessionToken?: string;
    sessionType: SessionType;
  }) => void;
  /** Callback when authentication fails */
  onAuthError: (error: Error) => void;
  /** Initial error message to display */
  initialError: string | null;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({
  config,
  onClose,
  onAuthSuccess,
  onAuthError,
  initialError,
}) => {
  const { t } = useTranslation(['sidebar', 'auth']);

  return (
    <Box
      sx={{
        width: '730px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        overflow: 'auto',
      }}
    >
      {/* OAuth2 Callback Handler */}
      {config?.oauth2Config && (
        <OAuth2CallbackHandler
          config={config}
          onAuthSuccess={onAuthSuccess}
          onAuthError={onAuthError}
        />
      )}

      {/* Header with Logo */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #711bc1 0%, #8e44d6 100%)',
          color: 'white',
          py: 4,
          px: 3,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <DQMLogo />
        <Typography variant="subtitle1">{t('sidebar:title')}</Typography>
      </Box>

      {/* Login Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          overflow: 'auto',
        }}
      >
        <DQMLogin
          config={config || {}}
          onAuthSuccess={onAuthSuccess}
          onAuthError={onAuthError}
          initialError={initialError}
        />
      </Box>

      {/* Close Button (top right) */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
        aria-label={t('sidebar:close')}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
};

/** DQM Logo SVG Component */
const DQMLogo: React.FC = () => {
  const { t } = useTranslation(['sidebar']);

  return (
    <svg
      style={{ width: '24px', height: '24px', marginBottom: '1rem' }}
      aria-label={t('sidebar:title')}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
    >
      <path
        d="M18.84,250c0-4.39,1.18-8.74,3.39-12.55L125.16,60.82c4.51-7.75,12.92-12.54,21.92-12.54h205.84c9.03,0,17.41,4.79,21.92,12.54l102.92,176.63c2.21,3.8,3.39,8.16,3.39,12.55,0,4.39-1.18,8.74-3.39,12.54l-102.92,176.64c-4.51,7.75-12.92,12.55-21.92,12.55h-205.84c-9.03,0-17.41-4.8-21.92-12.55L22.24,262.55c-2.21-3.8-3.39-8.16-3.39-12.54ZM12.5,250c0,5.41,1.42,10.82,4.25,15.67l102.92,176.64c5.67,9.71,16.11,15.67,27.41,15.67h205.84c11.3,0,21.75-5.96,27.41-15.67l102.92-176.64c2.83-4.85,4.25-10.26,4.25-15.67,0-5.41-1.42-10.82-4.25-15.68l-102.92-176.64c-5.67-9.71-16.11-15.67-27.41-15.67h-205.84c-11.3,0-21.75,5.96-27.41,15.67L16.75,234.33c-2.83,4.85-4.25,10.27-4.25,15.68Z"
        style={{ fill: '#fff', stroke: '#fff', strokeMiterlimit: 10, strokeWidth: 3 }}
      />
      <path
        d="M41.06,250c0-3.97,1.07-7.9,3.07-11.34l93.03-159.66c4.08-7.01,11.68-11.34,19.82-11.34h186.06c8.16,0,15.74,4.33,19.82,11.34l93.03,159.66c2,3.44,3.07,7.37,3.07,11.34s-1.07,7.9-3.07,11.34l-93.03,159.66c-4.08,7.01-11.68,11.34-19.82,11.34h-186.06c-8.16,0-15.74-4.34-19.82-11.34l-93.03-159.66c-2-3.44-3.07-7.37-3.07-11.34Z"
        style={{ fill: '#fff', strokeWidth: 0 }}
      />
      <g>
        <path
          d="M347.45,204.4c-2.14-9.18-8.83-8.76-16.53-7.36-20.65,3.73-41.32,7.7-62.16,9.94-4.02.43-10.73,1.04-19.22,1.09,0,.02,0,.04,0,.06-6.08-.08-12.18-.41-18.31-1.07-20.84-2.25-41.51-6.21-62.16-9.94-7.7-1.39-14.39-1.81-16.53,7.36-2,8.6,4.3,11.78,10.98,13.76,7.09,2.11,14.26,4.15,21.54,5.35,17.54,2.88,35.17,5.25,52.85,7.83-4.75,38.47-13.41,74.69-39.48,104.67-2.52,2.9-1.87,11.59.69,15.16,4.35,6.07,10.07,2.47,14.89-1.86,18.01-16.16,28.26-36.83,35.98-62.51,0-.06,0-.12,0-.19,0,.04,0,.07,0,.11,7.71,25.67,17.97,46.35,35.98,62.51,4.82,4.33,10.54,7.93,14.89,1.86,2.57-3.57,3.21-12.27.69-15.16-26.07-29.98-34.72-66.2-39.48-104.67,17.68-2.59,35.31-4.95,52.85-7.83,7.28-1.2,14.45-3.24,21.54-5.35,6.68-1.99,12.98-5.16,10.98-13.76Z"
          style={{ fill: '#711bc1', strokeWidth: 0 }}
        />
        <circle cx="250" cy="171.61" r="26.08" style={{ fill: '#711bc1', strokeWidth: 0 }} />
      </g>
    </svg>
  );
};

export default LoginOverlay;
