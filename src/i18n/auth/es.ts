/**
 * Auth translations - Spanish
 * @see I18N.md for documentation
 */
export const auth = {
  heading: 'Autenticación DQM',
  subheading: 'Autentícate para acceder al análisis de calidad',
  enter_credentials: 'Introducir credenciales directamente',
  website_id: 'ID del sitio web',
  website_id_helper: 'Tu identificador de sitio web',
  api_key: 'Clave API',
  api_key_helper: 'Tu clave API de Crownpeak DQM',
  continue: 'Continuar',
  or: 'O',
  login_backend: 'Iniciar sesión con sesión del backend',
  no_credentials: '¿No tienes credenciales?',
  get_started: 'Comienza con Crownpeak DQM',
  errors: {
    missing_fields: 'Introduce tanto la clave API como el ID del sitio web',
    non_ascii_key: 'La clave API contiene caracteres no ASCII',
    backend_missing: 'La URL del backend no está configurada',
    failed_redirect: 'No se pudo redirigir a la página de inicio de sesión',
  },
} as const;
