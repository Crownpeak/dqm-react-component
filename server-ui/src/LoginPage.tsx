// Login Page with Beautiful Design
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Login as LoginIcon,
  VpnKey as VpnKeyIcon,
  CloudQueue as CloudIcon,
  Forward as ForwardIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './components/LanguageSwitch';

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation(['server', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [websiteId, setWebsiteId] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [autoRedirect, setAutoRedirect] = useState<{
    websiteId: string;
    token: string;
    countdown: number;
    paused: boolean;
  } | null>(null);

  // Countdown timer for auto-redirect screen
  useEffect(() => {
    if (!autoRedirect || autoRedirect.paused) return;

    if (autoRedirect.countdown === 0) {
      // Redirect now
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || 'http://localhost:5173';
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set('sessionToken', autoRedirect.token);
      redirectUrl.searchParams.set('websiteId', autoRedirect.websiteId);
      redirectUrl.searchParams.set('dqm', "true");
      window.location.href = redirectUrl.toString();
      return;
    }

    const timer = setTimeout(() => {
      setAutoRedirect(prev => prev ? { ...prev, countdown: prev.countdown - 1 } : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRedirect]);

  // Handle pause/resume countdown
  const handleTogglePause = () => {
    setAutoRedirect(prev => prev ? { ...prev, paused: !prev.paused } : null);
  };

  // Handle manual logout from auto-redirect screen
  const handleLogout = () => {
    localStorage.removeItem('dqm_stored_session_token');
    localStorage.removeItem('dqm_stored_website_id');
    setAutoRedirect(null);
    setCheckingSession(false);
  };

  // Handle skip countdown and continue immediately
  const handleSkipCountdown = () => {
    if (!autoRedirect) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('returnUrl') || 'http://localhost:5173';
    const redirectUrl = new URL(returnUrl);
    redirectUrl.searchParams.set('sessionToken', autoRedirect.token);
    redirectUrl.searchParams.set('websiteId', autoRedirect.websiteId);
    redirectUrl.searchParams.set('dqm', "true");
    window.location.href = redirectUrl.toString();
  };

  // Check for existing session on mount (SSO)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Try to get session token from localStorage
        const storedToken = localStorage.getItem('dqm_stored_session_token');
        const storedWebsiteId = localStorage.getItem('dqm_stored_website_id');

        if (storedToken && storedWebsiteId) {
          console.log('[LoginPage] 🔍 Found stored session, validating...');
          
          // Validate session with backend using new endpoint
          const response = await axios.post('/auth/token/validate', {
            sessionToken: storedToken,
          });

          if (response.data.valid) {
            console.log('[LoginPage] ✅ Stored session is valid, showing auto-redirect screen...');
            
            // Show auto-redirect screen with countdown
            setAutoRedirect({
              websiteId: storedWebsiteId,
              token: storedToken,
              countdown: 5, // 5 seconds countdown
              paused: false,
            });
            setCheckingSession(false);
            return; // Don't redirect immediately, show the screen first
          } else {
            console.log('[LoginPage] ⚠️ Stored session expired, need new login');
            // Clear invalid token
            localStorage.removeItem('dqm_stored_session_token');
            localStorage.removeItem('dqm_stored_website_id');
          }
        }
      } catch (err) {
        console.error('[LoginPage] Error checking session:', err);
        // Clear invalid token on error
        localStorage.removeItem('dqm_stored_session_token');
        localStorage.removeItem('dqm_stored_website_id');
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/auth/login', {
        apiKey,
        websiteId,
      });

      const data = response.data;
      
      console.log('[LoginPage] ✅ Login successful');
      console.log('[LoginPage] Session token:', data.sessionToken?.substring(0, 20) + '...');
      
      // Store session token for SSO (remember me)
      localStorage.setItem('dqm_stored_session_token', data.sessionToken);
      localStorage.setItem('dqm_stored_website_id', data.websiteId);
      console.log('[LoginPage] 💾 Session stored for SSO');
      
      // Get return URL from query params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || localStorage.getItem('dqm_return_url') || 'http://localhost:5173';
      
      console.log('[LoginPage] 🔄 Redirecting back to:', returnUrl);
      
      // Redirect back to widget with session token in URL
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set('sessionToken', data.sessionToken);
      redirectUrl.searchParams.set('websiteId', data.websiteId);
      redirectUrl.searchParams.set('dqm', "true");
      
      window.location.href = redirectUrl.toString();
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('server:auth_failed');
      setError(errorMessage);
      console.error('[LoginPage] ❌ Login error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking for existing session
  if (checkingSession) {
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
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            {t('server:checking_session')}
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Show auto-redirect screen when user is already logged in
  if (autoRedirect) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <LanguageSwitch />
        </Box>
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2070)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 0,
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <Card
              elevation={24}
              sx={{
                width: '100%',
                backdropFilter: 'blur(20px)',
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={4} alignItems="center">
                  {/* Success Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={(100 - (5 - autoRedirect.countdown) / 5) * 100}
                        size={120}
                        thickness={2}
                        sx={{
                          color: theme.palette.success.main,
                          position: 'absolute',
                          transition: 'all 0.8s ease-in-out',
                        }}
                      />
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 30px ${alpha(theme.palette.success.main, 0.4)}`,
                        }}
                      >
                        <LoginIcon sx={{ fontSize: 50, color: 'white' }} />
                      </Box>
                    </Box>
                  </motion.div>

                  {/* Heading */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    style={{ textAlign: 'center' }}
                  >
                    <Typography variant="h4" gutterBottom fontWeight={700} color="success.main">
                      {t('server:already_logged_in')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {t('server:already_auth')}
                    </Typography>
                  </motion.div>

                  {/* Session Info */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ width: '100%' }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      }}
                    >
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('server:session_website_id')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {autoRedirect.websiteId.substring(0, 20)}...
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('server:session_label')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {t('server:session_active')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </motion.div>

                  {/* Countdown with AnimatePresence */}
                  <Box sx={{ textAlign: 'center', minHeight: 120 }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={autoRedirect.countdown}
                        initial={{ scale: 1.5, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 20 }}
                        transition={{ 
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        <Typography 
                          variant="h1" 
                          fontWeight={700} 
                          color="primary.main"
                          sx={{
                            fontSize: '6rem',
                            lineHeight: 1,
                            textShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                          }}
                        >
                          {autoRedirect.countdown}
                        </Typography>
                      </motion.div>
                    </AnimatePresence>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {t('server:redirecting_in', { count: autoRedirect.countdown })}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    style={{ width: '100%' }}
                  >
                    <Stack spacing={2} sx={{ width: '100%' }}>
                      {/* Primary Action Row */}
                      <Stack direction="row" spacing={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          color={autoRedirect.paused ? 'success' : 'warning'}
                          onClick={handleTogglePause}
                          startIcon={autoRedirect.paused ? <PlayIcon /> : <PauseIcon />}
                          sx={{
                            background: autoRedirect.paused 
                              ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                              : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: autoRedirect.paused
                                ? `0 8px 20px ${alpha(theme.palette.success.main, 0.4)}`
                                : `0 8px 20px ${alpha(theme.palette.warning.main, 0.4)}`,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                            {autoRedirect.paused ? t('server:resume') : t('server:pause')}
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={handleSkipCountdown}
                          startIcon={<ForwardIcon />}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {t('server:continue')}
                        </Button>
                      </Stack>
                      
                      {/* Logout Button */}
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<CloudIcon />}
                        onClick={handleLogout}
                      >
                        {t('server:logout')}
                      </Button>
                    </Stack>
                  </motion.div>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <LanguageSwitch />
      </Box>
      {/* Background Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2070)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Card
          elevation={24}
          sx={{
            width: '100%',
            backdropFilter: 'blur(20px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header with Brand */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <CloudIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('server:brand_title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('server:brand_subtitle')}
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleDirectLogin}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h6" gutterBottom>
                    {t('server:login_heading')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('server:login_subheading')}
                  </Typography>
                </Box>

                <TextField
                // for Password Managers, set this field to "username"
                  autoComplete="username"
                  label={t('server:website_id')}
                  fullWidth
                  type="text"
                  required
                  value={websiteId}
                  onChange={(e) => setWebsiteId(e.target.value)}
                  disabled={loading}
                  placeholder={t('server:website_id')}
                />

                <TextField
                  label={t('server:api_key')}
                  type="password"
                  fullWidth
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={loading}
                  placeholder={t('server:api_key')}
                  InputProps={{
                    startAdornment: <VpnKeyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !apiKey || !websiteId}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  {loading ? t('server:signin_loading') : t('server:sign_in')}
                </Button>

                <Box textAlign="center" mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    {t('server:credentials_note')}
                  </Typography>
                </Box>
              </Stack>
            </form>
          </CardContent>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t('server:footer')}
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};
