/**
 * Sidebar translations - Spanish
 * @see I18N.md for documentation
 */
export const sidebar = {
  // Header
  title: 'Calidad digital y accesibilidad',
  ready_title: 'Listo para analizar',
  ready_body: 'Haz clic en "Ejecutar comprobación de calidad" para analizar la página actual en busca de problemas de accesibilidad y calidad.',
  run_quality_check: 'Ejecutar comprobación de calidad',
  analyzing: 'Analizando...',
  access_denied: 'Acceso denegado',
  config_required: 'Configuración requerida',
  auth_error: 'Error de autenticación',
  close: 'Cerrar',
  close_sidebar: 'Cerrar barra lateral',
  fab_tooltip: 'Análisis de calidad DQM',

  // AI Assistant
  ai_settings: 'Asistente de IA',
  ai_backend_local: 'Local',
  ai_backend_api: 'API',
  ai_backend_label: 'Backend de traducción',
  summary_label: 'Resumen',
  summary_stats: 'Estadísticas IA – intentos: {{attempts}}, vacías: {{empty}}, modo: {{mode}}, duración: {{duration}}ms',
  openai_info: 'Usa una API compatible con OpenAI Chat Completions. Normalmente, una llamada desde el navegador requiere un proxy con CORS.',
  openai_model: 'Modelo de OpenAI',
  openai_base_url: 'URL base de OpenAI',
  openai_api_key: 'Clave API de OpenAI',
  openai_missing_key: 'Falta la clave API de OpenAI.',

  // Translation
  translation_enable: 'Traducir automáticamente los resultados de DQM',
  summary_enable: 'Tarjeta de resumen de IA',
  ai_model_label: 'Modelo de IA',
  ai_model_fast: 'Rápido (pequeño, muy rápido)',
  ai_model_simple: 'Simple (muy pequeño)',
  ai_model_reliable: 'Fiable (equilibrado)',
  ai_model_accurate: 'Preciso (más potente, más lento)',
  ai_model_configured: 'Configurado por la app anfitriona',
  ai_model_hint: 'La elección del modelo afecta la traducción y el resumen (calidad/velocidad).',
  ai_cache_clear: 'Borrar caché de IA',
  translation_not_needed: 'El idioma de la interfaz es inglés; no es necesario traducir.',
  translation_webgpu_required: 'La traducción requiere un navegador compatible con WebGPU.',
  translation_target_lang: 'Idioma de destino: {{lang}}',
  translation_when: 'Las funciones de IA se ejecutan automáticamente al finalizar un análisis, al cambiar el idioma de la UI o al activarlas aquí.',
  ai_limitations: 'La IA puede equivocarse o alucinar; verifica los resultados.',
  summary_api_only: 'Los resúmenes usan siempre ChatGPT (API). Las traducciones pueden usar ChatGPT o el modelo local.',
  summary_disclaimer: 'Nota: los resúmenes pueden contener errores o alucinaciones. Verifica el contenido.',
  translation_full_power: 'Traducción completa (puede tardar más)',
  translation_model: 'Modelo: {{model}}',
  translation_cache: 'Caché del modelo: IndexedDB',
  translation_persistent_storage_on: 'almacenamiento persistente: activado',
  translation_persistent_storage_off: 'almacenamiento persistente: desactivado',
  translation_persistent_storage_unknown: 'almacenamiento persistente: desconocido',
  translation_request_persistent_storage: 'Conservar el modelo permanentemente',
  translation_persistent_storage_explainer: '"Conservar el modelo permanentemente" solicita al navegador marcar el almacenamiento de este sitio como persistente, reduciendo la probabilidad de que se elimine bajo presión de almacenamiento. El usuario aún puede borrar los datos del sitio manualmente.',
  translation_persistent_storage_denied: 'El navegador no concedió almacenamiento persistente. Esto es normal en algunos navegadores o cuando la interacción con el sitio es baja.',
  translation_downloading: 'Inicializando el modelo…',
  translation_translating: 'Traduciendo resultados…',
  translation_progress: '{{done}} / {{total}} checkpoints',
  translation_ready: 'La traducción está lista.',
  translation_partial: 'La traducción se detuvo antes para mantener un buen rendimiento. Algunos elementos quedan sin traducir.',
  translation_incomplete: 'Algunos elementos no se pudieron traducir de forma fiable y permanecen sin cambios.',
  translation_restart: 'Traducir elementos faltantes',

  // Summary
  summary_restart: 'Reiniciar resumen',
  summary_title: 'Resumen de IA',
  summary_regenerate: 'Regenerar',
  summary_generating: 'Generando resumen…',
  summary_failed: 'Falló el resumen',
  summary_empty: 'Aún no hay resumen disponible.',
  summary_disabled: 'Activa el resumen de IA en los ajustes del asistente para obtener una visión general de los puntos más importantes.',

  // Analysis results
  overall_quality: 'Calidad general',
  passed: 'Aprobado',
  failed: 'Fallido',
  show_all_errors: 'Mostrar página con todos los errores',
  quality_breakdown: 'Desglose de calidad',
  all_passed: 'Todo aprobado',
  x_of_y_passed: '{{passed}} de {{total}} aprobados',
  percent_passed: '{{percent}}% aprobados',

  // Failed checkpoints
  failed_checkpoints: 'Checkpoints fallidos',
  filter_by_category: 'Filtrar por categoría',
  showing_categories: 'Mostrando {{count}} de {{total}} categorías',
  showing_all_categories: 'Mostrando todas las {{total}} categorías',
  show_all: 'Mostrar todo',
  view_in_browser: 'Ver en el navegador',
  view_source: 'Ver fuente',

  // Error states
  analysis_failed: 'El análisis falló',
  retry: 'Reintentar',
  no_highlighted_content: 'No hay contenido resaltado disponible.',
  failed_load_browser: 'No se pudo cargar la vista del navegador. Inténtalo de nuevo.',
  loading_views: 'Cargando ambas vistas...',

  // Highlight modal
  highlighted_errors: 'Errores resaltados',
  browser_view: 'Vista del navegador',
  source_view: 'Vista de fuente',
  x_of_y: '{{current}} de {{total}}',
  prev_highlight: 'Resaltado anterior',
  next_highlight: 'Siguiente resaltado',
  reload_highlights: 'Recargar resaltados',
  open_in_new_tab: 'Abrir en una pestaña nueva',
  enable_js: 'Habilitar JavaScript',
  disable_js: 'Deshabilitar JavaScript',

  // Fallback content
  no_source_content: 'No hay contenido de fuente disponible para este checkpoint.',
  failed_load_all_errors: 'No se pudo cargar la página con todos los errores. Inténtalo de nuevo.',
  failed_load_highlights: 'No se pudo cargar el contenido resaltado. Inténtalo de nuevo.',
  failed_load_source: 'No se pudo cargar la vista de fuente. Inténtalo de nuevo.',

  // Auth errors shown in sidebar
  dqm_disabled: 'DQM está deshabilitado. Permiso denegado.',
  dqm_not_configured: 'DQM no está configurado. Proporciona credenciales de API vía props, localStorage o configura un backend de autenticación.',
} as const;
