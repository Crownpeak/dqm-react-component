/**
 * Sidebar translations - English (Fallback)
 * @see I18N.md for documentation
 */
export const sidebar = {
  // Header
  title: 'Digital Quality and Accessibility',
  ready_title: 'Ready to Analyze',
  ready_body: 'Click "Run Quality Check" to analyze the current page for accessibility and quality issues.',
  run_quality_check: 'Run Quality Check',
  analyzing: 'Analyzing...',
  access_denied: 'Access Denied',
  config_required: 'Configuration Required',
  auth_error: 'Authentication Error',
  close: 'Close',
  close_sidebar: 'Close sidebar',
  fab_tooltip: 'DQM Quality Analysis',

  // AI Assistant
  ai_settings: 'AI Assistant',
  ai_backend_local: 'Local',
  ai_backend_api: 'API',
  ai_backend_label: 'Translation backend',
  summary_label: 'Summary',
  summary_stats: 'AI stats – attempts: {{attempts}}, empty: {{empty}}, mode: {{mode}}, duration: {{duration}}ms',
  openai_info: 'Uses an OpenAI-compatible Chat Completions API. A browser call usually requires a CORS-enabled proxy.',
  openai_model: 'OpenAI model',
  openai_base_url: 'OpenAI base URL',
  openai_api_key: 'OpenAI API key',
  openai_missing_key: 'OpenAI API key is missing.',

  // Translation
  translation_enable: 'Auto-translate DQM results',
  summary_enable: 'AI summary card',
  ai_model_label: 'AI model',
  ai_model_fast: 'Fast (small, quickest)',
  ai_model_simple: 'Simple (very small)',
  ai_model_reliable: 'Reliable (balanced)',
  ai_model_accurate: 'Accurate (stronger, slower)',
  ai_model_configured: 'Configured by host app',
  ai_model_hint: 'Model choice affects translation and summary quality/speed.',
  ai_cache_clear: 'Clear AI cache',
  translation_not_needed: 'UI language is English; translation is not needed.',
  translation_webgpu_required: 'Translation requires a WebGPU-capable browser.',
  translation_target_lang: 'Target language: {{lang}}',
  translation_when: 'AI features run automatically after an analysis completes, when you change the UI language, or when you enable them here.',
  ai_limitations: 'AI can be wrong or hallucinate – please verify results.',
  summary_api_only: 'Summaries always use ChatGPT (API). Translations can use ChatGPT or local.',
  summary_disclaimer: 'Note: Summaries may contain errors or hallucinations. Please verify.',
  translation_full_power: 'Full translation (may take longer)',
  translation_model: 'Model: {{model}}',
  translation_cache: 'Model cache: IndexedDB',
  translation_persistent_storage_on: 'persistent storage: on',
  translation_persistent_storage_off: 'persistent storage: off',
  translation_persistent_storage_unknown: 'persistent storage: unknown',
  translation_request_persistent_storage: 'Keep model permanently',
  translation_persistent_storage_explainer: '"Keep model permanently" asks the browser to mark this site\'s storage as persistent, reducing the chance it will be evicted under storage pressure. Users can still clear site data manually.',
  translation_persistent_storage_denied: 'The browser did not grant persistent storage. This is normal on some browsers or when site engagement is low.',
  translation_downloading: 'Initializing model…',
  translation_translating: 'Translating results…',
  translation_progress: '{{done}} / {{total}} checkpoints',
  translation_ready: 'Translation is ready.',
  translation_partial: 'Translation stopped early to keep performance snappy. Some items remain untranslated.',
  translation_incomplete: 'Some items could not be translated reliably and remain unchanged.',
  translation_restart: 'Translate missing items',

  // Summary
  summary_restart: 'Restart summary',
  summary_title: 'AI Summary',
  summary_regenerate: 'Regenerate',
  summary_generating: 'Generating summary…',
  summary_failed: 'Summary failed',
  summary_empty: 'No summary available yet.',
  summary_disabled: 'Enable the AI summary in the AI Assistant settings to get an executive overview of the most important issues.',

  // Analysis results
  overall_quality: 'Overall Quality',
  passed: 'Passed',
  failed: 'Failed',
  show_all_errors: 'Show Page with all Errors',
  quality_breakdown: 'Quality Breakdown',
  all_passed: 'All Passed',
  x_of_y_passed: '{{passed}} of {{total}} passed',
  percent_passed: '{{percent}}% passed',

  // Failed checkpoints
  failed_checkpoints: 'Failed Checkpoints',
  filter_by_category: 'Filter by Category',
  showing_categories: 'Showing {{count}} of {{total}} categories',
  showing_all_categories: 'Showing all of {{total}} categories',
  show_all: 'Show All',
  view_in_browser: 'View in Browser',
  view_source: 'View Source',

  // Error states
  analysis_failed: 'Analysis Failed',
  retry: 'Retry',
  no_highlighted_content: 'No highlighted content available.',
  failed_load_browser: 'Failed to load browser view. Please try again.',
  loading_views: 'Loading both views...',

  // Highlight modal
  highlighted_errors: 'Highlighted Errors',
  browser_view: 'Browser View',
  source_view: 'Source View',
  x_of_y: '{{current}} of {{total}}',
  prev_highlight: 'Previous highlight',
  next_highlight: 'Next highlight',
  reload_highlights: 'Reload highlights',
  open_in_new_tab: 'Open in new tab',
  enable_js: 'Enable JavaScript',
  disable_js: 'Disable JavaScript',

  // Fallback content
  no_source_content: 'No source content available for this checkpoint.',
  failed_load_all_errors: 'Failed to load page with all errors. Please try again.',
  failed_load_highlights: 'Failed to load highlighted content. Please try again.',
  failed_load_source: 'Failed to load source view. Please try again.',

  // Auth errors shown in sidebar
  dqm_disabled: 'DQM is disabled. Permission denied.',
  dqm_not_configured: 'DQM is not configured. Please provide API credentials via props, localStorage, or configure an authentication backend.',
} as const;

export type SidebarTranslationKeys = keyof typeof sidebar;
