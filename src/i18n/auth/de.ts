/**
 * Auth translations - German
 * @see I18N.md for documentation
 */
export const auth = {
  heading: 'DQM-Authentifizierung',
  subheading: 'Bitte authentifizieren Sie sich für die Qualitätsanalyse',
  enter_credentials: 'Zugangsdaten direkt eingeben',
  website_id: 'Website-ID',
  website_id_helper: 'Ihre Website-Kennung',
  api_key: 'API-Schlüssel',
  api_key_helper: 'Ihr Crownpeak DQM API-Schlüssel',
  continue: 'Weiter',
  or: 'ODER',
  login_backend: 'Mit Backend-Sitzung anmelden',
  no_credentials: 'Keine Zugangsdaten?',
  get_started: 'Jetzt mit Crownpeak DQM starten',
  errors: {
    missing_fields: 'Bitte API-Schlüssel und Website-ID eingeben',
    non_ascii_key: 'API-Schlüssel enthält Nicht-ASCII-Zeichen',
    backend_missing: 'Backend-URL nicht konfiguriert',
    failed_redirect: 'Weiterleitung zur Login-Seite fehlgeschlagen',
  },
} as const;
