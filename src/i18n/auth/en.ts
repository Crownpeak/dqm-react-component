/**
 * Auth translations - English (Fallback)
 * @see I18N.md for documentation
 */
export const auth = {
  heading: 'DQM Authentication',
  subheading: 'Please authenticate to access quality analysis',
  enter_credentials: 'Enter credentials directly',
  website_id: 'Website ID',
  website_id_helper: 'Your website identifier',
  api_key: 'API Key',
  api_key_helper: 'Your Crownpeak DQM API key',
  continue: 'Continue',
  or: 'OR',
  login_backend: 'Login with Backend Session',
  no_credentials: "Don't have credentials?",
  get_started: 'Get started with Crownpeak DQM',
  errors: {
    missing_fields: 'Please enter both API Key and Website ID',
    non_ascii_key: 'API key contains non-ASCII characters',
    backend_missing: 'Backend URL not configured',
    failed_redirect: 'Failed to redirect to login page',
  },
} as const;

export type AuthTranslationKeys = keyof typeof auth;
