/**
 * Sidebar translations - German
 * @see I18N.md for documentation
 */
export const sidebar = {
  // Header
  title: 'Digitale Qualität und Barrierefreiheit',
  ready_title: 'Bereit für Analyse',
  ready_body: 'Klicken Sie auf "Qualitätsprüfung starten", um die aktuelle Seite auf Barrierefreiheits- und Qualitätsprobleme zu prüfen.',
  run_quality_check: 'Qualitätsprüfung starten',
  analyzing: 'Analyse läuft...',
  access_denied: 'Zugriff verweigert',
  config_required: 'Konfiguration erforderlich',
  auth_error: 'Authentifizierungsfehler',
  close: 'Schließen',
  close_sidebar: 'Seitenleiste schließen',
  fab_tooltip: 'DQM Qualitätsanalyse',

  // AI Assistant
  ai_settings: 'KI-Assistent',
  ai_backend_api: 'ChatGPT (API)',
  summary_label: 'Zusammenfassung',
  summary_stats: 'KI-Statistik – Versuche: {{attempts}}, leer: {{empty}}, Modus: {{mode}}, Dauer: {{duration}}ms',
  openai_info: 'Nutzt eine OpenAI-kompatible Chat-Completions-API. Ein Browser-Aufruf benötigt meist einen CORS-fähigen Proxy.',
  openai_model: 'OpenAI-Modell',
  openai_base_url: 'OpenAI Base-URL',
  openai_api_key: 'OpenAI API-Key',
  openai_missing_key: 'OpenAI API-Key fehlt.',

  // Translation
  translation_enable: 'DQM-Ergebnisse automatisch übersetzen',
  summary_enable: 'KI-Zusammenfassung',
  ai_model_hint: 'Die Modellauswahl beeinflusst Übersetzung und Zusammenfassung (Qualität/Tempo).',
  ai_cache_clear: 'KI-Cache löschen',
  translation_not_needed: 'Die UI-Sprache ist Englisch; eine Übersetzung ist nicht nötig.',
  translation_target_lang: 'Zielsprache: {{lang}}',
  translation_when: 'KI-Funktionen laufen automatisch nach Abschluss der Analyse, beim Wechsel der UI-Sprache oder sobald Sie sie hier aktivieren.',
  ai_limitations: 'KI kann sich irren oder halluzinieren – bitte Ergebnisse prüfen.',
  summary_api_only: 'KI-Funktionen nutzen ChatGPT (API) für Übersetzungen und Zusammenfassungen.',
  summary_disclaimer: 'Hinweis: Zusammenfassungen können Fehler oder Halluzinationen enthalten. Bitte fachlich prüfen.',
  translation_full_power: 'Vollständige Übersetzung (kann länger dauern)',
  translation_model: 'Modell: {{model}}',
  translation_downloading: 'KI wird initialisiert…',
  translation_translating: 'Ergebnisse werden übersetzt…',
  translation_progress: '{{done}} / {{total}} Prüfpunkte',
  translation_ready: 'Übersetzung ist bereit.',
  translation_partial: 'Die Übersetzung wurde vorzeitig beendet, um die Performance hoch zu halten. Einige Inhalte bleiben unübersetzt.',
  translation_incomplete: 'Einige Inhalte konnten nicht zuverlässig übersetzt werden und bleiben unverändert.',
  translation_restart: 'Fehlende Übersetzungen nachholen',

  // Summary
  summary_restart: 'Zusammenfassung neu starten',
  summary_title: 'KI-Zusammenfassung',
  summary_regenerate: 'Neu generieren',
  summary_generating: 'Zusammenfassung wird erstellt…',
  summary_failed: 'Zusammenfassung fehlgeschlagen',
  summary_empty: 'Noch keine Zusammenfassung verfügbar.',
  summary_disabled: 'Aktivieren Sie die KI-Zusammenfassung in den KI-Assistent-Einstellungen, um eine kompakte Übersicht der wichtigsten Punkte zu erhalten.',

  // Analysis results
  overall_quality: 'Gesamtqualität',
  passed: 'Bestanden',
  failed: 'Fehlgeschlagen',
  show_all_errors: 'Seite mit allen Fehlern anzeigen',
  quality_breakdown: 'Qualitätsübersicht',
  all_passed: 'Alle bestanden',
  x_of_y_passed: '{{passed}} von {{total}} bestanden',
  percent_passed: '{{percent}}% bestanden',

  // Failed checkpoints
  failed_checkpoints: 'Fehlgeschlagene Prüfpunkte',
  filter_by_category: 'Nach Kategorie filtern',
  showing_categories: '{{count}} von {{total}} Kategorien angezeigt',
  showing_all_categories: 'Alle {{total}} Kategorien angezeigt',
  show_all: 'Alle anzeigen',
  view_in_browser: 'Im Browser anzeigen',
  view_source: 'Quellcode anzeigen',

  // Error states
  analysis_failed: 'Analyse fehlgeschlagen',
  retry: 'Wiederholen',
  no_highlighted_content: 'Keine hervorgehobenen Inhalte verfügbar.',
  failed_load_browser: 'Browseransicht konnte nicht geladen werden. Bitte erneut versuchen.',
  loading_views: 'Beide Ansichten werden geladen...',

  // Highlight modal
  highlighted_errors: 'Hervorgehobene Fehler',
  browser_view: 'Browseransicht',
  source_view: 'Quellansicht',
  x_of_y: '{{current}} von {{total}}',
  prev_highlight: 'Vorheriger Fehler',
  next_highlight: 'Nächster Fehler',
  reload_highlights: 'Hervorhebungen neu laden',
  open_in_new_tab: 'In neuem Tab öffnen',
  enable_js: 'JavaScript aktivieren',
  disable_js: 'JavaScript deaktivieren',

  // Fallback content
  no_source_content: 'Kein Quellcode für diesen Prüfpunkt verfügbar.',
  failed_load_all_errors: 'Seite mit allen Fehlern konnte nicht geladen werden. Bitte erneut versuchen.',
  failed_load_highlights: 'Hervorgehobene Inhalte konnten nicht geladen werden. Bitte erneut versuchen.',
  failed_load_source: 'Quellansicht konnte nicht geladen werden. Bitte erneut versuchen.',

  // Auth errors shown in sidebar
  dqm_disabled: 'DQM ist deaktiviert. Zugriff verweigert.',
  dqm_not_configured: 'DQM ist nicht konfiguriert. Bitte geben Sie API-Zugangsdaten über Props, localStorage oder ein Authentifizierungs-Backend an.',
} as const;
