// OAuth Callback Page
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Alert,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './components/LanguageSwitch';

export const CallbackPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation(['server', 'common']);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('server:processing_auth'));

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(params.get('error_description') || error);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        // Verify state for CSRF protection
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        // Exchange code for token
        const response = await fetch('/auth/oauth2/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: window.location.origin + '/auth/callback',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Token exchange failed');
        }

        const data = await response.json();

        // Store session token
        localStorage.setItem('dqm_sessionToken', data.sessionToken);
        sessionStorage.removeItem('oauth_state'); // Clean up

        // Notify parent window (if opened in popup/iframe)
        if (window.opener || window.parent !== window) {
          const target = window.opener || window.parent;
          target.postMessage(
            {
              type: 'DQM_AUTH_SUCCESS',
              sessionToken: data.sessionToken,
              websiteId: data.websiteId,
            },
            '*'
          );
        }

        setStatus('success');
        setMessage(t('server:auth_close'));

        // Auto-close after 2 seconds if in popup
        if (window.opener) {
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        console.error('[OAuth Callback] Error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitch />
      </Box>
      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            backdropFilter: 'blur(20px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Stack spacing={4} alignItems="center" textAlign="center">
              {status === 'loading' && (
                <>
                  <CircularProgress size={64} thickness={4} />
                  <Typography variant="h5" fontWeight="600">
                    {t('server:auth_loading')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('server:auth_wait')}
                  </Typography>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircleIcon
                    sx={{
                      fontSize: 80,
                      color: theme.palette.success.main,
                    }}
                  />
                  <Typography variant="h5" fontWeight="600" color="success.main">
                    {t('server:auth_success')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {message}
                  </Typography>
                </>
              )}

              {status === 'error' && (
                <>
                  <ErrorIcon
                    sx={{
                      fontSize: 80,
                      color: theme.palette.error.main,
                    }}
                  />
                  <Typography variant="h5" fontWeight="600" color="error.main">
                    {t('server:auth_failed')}
                  </Typography>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {message}
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    {t('server:auth_retry')}
                  </Typography>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
