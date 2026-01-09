# Crownpeak DQM React Component - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-01-09

### Added
- **GPT-5.2 Support**: Default AI model upgraded from `gpt-4.1-mini` to `gpt-5.2`
  - 1M token context window enables larger translation batches and fewer API calls
  - New `reasoning_effort` parameter (`low`/`medium`/`high`) for GPT-5 models
  - Automatic API adaptation for GPT-5 vs GPT-4 differences:
    - Token parameter: `max_completion_tokens` (GPT-5) vs `max_tokens` (GPT-4)
    - Structured output: `json_schema` (GPT-5) vs `json_object` (GPT-4)
    - System role: `developer` (GPT-5) vs `system` (GPT-4)
  - 50,000 token context budget (vs 12,000 for GPT-4o)
- **Model Capabilities Module**: New `src/utils/modelCapabilities.ts` for centralized model detection
  - `isGPT5Model()`, `isReasoningModel()` utility functions
  - `getModelCapabilities()` returns full capability info per model
  - `buildTokenParams()`, `buildReasoningParams()`, `getSystemRole()` helpers
- **Reasoning Effort UI**: New setting in AI Settings dialog (only visible for GPT-5 models)
  - Persisted to `localStorage` as `dqm_reasoning_effort`
  - Full i18n support (EN/DE/ES)
- **MCP Server Feature**: Added MCP Server section to website features
  - New feature card with link to documentation
  - Translations for all 3 languages

### Changed
- **AI Settings Dialog**: GPT-5.2 now shown with "NEW" badge in model selector
- **AI Summary Card**: Improved layout with column flex direction for better readability
- **Website Hero Badge**: Updated from version number to "GPT-5.2 Powered AI"
- **Website MSW Provider**: Refactored to `useMSW()` hook for better lifecycle control
  - MSW now starts only when sidebar opens
  - MSW resets completely when sidebar closes
- **Footer Links**: Updated Crownpeak DQM Platform URL to German FirstSpirit product page

### Fixed
- **Translation Feature Descriptions**: Updated to reflect GPT-5.2 capabilities
- **Website Feature Cards**: Added MCP Server feature with external documentation link
- **Accessibility**: Added `aria-label` to MCP Server feature link

## [1.2.4] - 2026-01-08

### Added
- **Marketing Website**: New Next.js marketing/documentation website deployed to GitHub Pages
  - Hero section with animated feature highlights
  - Interactive demo section with live sidebar preview
  - Integration section with code examples and copy functionality
  - Multi-language support (English, German, Spanish) using react-i18next
  - Framer Motion animations throughout
  - Built with Tailwind CSS and shadcn/ui components
  - WCAG AA accessibility compliant (proper aria-labels, 4.5:1+ contrast ratios)
  - Static export for GitHub Pages hosting
- **AI Agent Documentation**: Added comprehensive Website section to `.github/copilot-instructions.md`

## [1.2.2] - 2026-01-08

### Fixed
- **AI Translation Reliability**: Resolved issue where AI translations were not triggered automatically
  - Translation now starts automatically when AI summary completes
  - Translation now starts automatically when AI engine becomes ready
  - Fixed race condition where blocked translations would never retry

### Added
- **300ms Debounce**: API calls are now debounced to prevent accidental spam when state changes rapidly
- **Reactive State Management**: `summaryGenerating` and `engineIsReady` are now proper effect dependencies
- **Automatic Retry Logic**: Translation automatically restarts when blocking conditions are resolved
- **Unit Tests**: 13 new tests for `useAITranslation` hook covering debounce, blocking, cache, and abort behavior
- **Integration Tests**: 6 new tests for Summary→Translation flow with API call counting

### Changed
- AI Translation hook now uses reactive dependencies instead of refs for blocking conditions
- Improved cleanup on component unmount (cancels pending debounce timers and aborts requests)

## [1.2.0] - 2026-01-07

### Added
- **Internationalization (i18n)**: Full multi-language support using i18next
  - Supported languages: English (default), German, Spanish
  - Language switcher component in sidebar footer
  - URL parameter override (`?dqmUiLang=de`)
  - Browser language auto-detection
  - LocalStorage persistence of user preference (`dqm_locale`)
  - Regional variant fallbacks (e.g., `de-AT` → `de` → `en`)
- **New Exports**: 
  - `i18n`, `resolveLanguage` from `./i18n`
  - `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `normalizeLocale` from `./locale`
  - Types: `SupportedLocale`, `AvailableLanguage`
- **Comprehensive i18n documentation** in `I18N.md`

## [1.1.0] - 2025-12-17

### Added
- **Overlay Configuration**: New `overlayConfig` option in `DQMConfig` for customizing overlay/toolbar detection
  - `selector`: Custom CSS selector for overlay elements
  - `validateIframe`: Option to validate iFrame contentWindow availability
  - `pollMs`: Configurable polling interval for cross-origin iFrame detection
  - `manualOffset`: Manual offset configuration for cases where auto-detection fails
- **Enhanced `useDomPresence` Hook**: Now returns comprehensive element information including:
  - `rect`: Element bounding rectangle (height, width, top, bottom, left, right)
  - `position`: Detected position ('top', 'bottom', 'left', 'right', 'center')
  - `contentOffset`: Ready-to-use offsets for positioning UI elements
- **New Exports**: 
  - `useOverlayResistant` hook for advanced overlay handling
  - `OverlayConfig`, `OverlayOffsetPosition`, `OverlayInfo`, `OverlayPosition` types
- **Standalone Widget Bundle**: New widget build (IIFE + ESM) with `initDQMWidget`, Shadow DOM isolation, and Emotion cache binding for safe embedding on any site.
- **Widget Tooling & Types**: Added loader utilities, TypeScript declarations, and public exports for widget consumers.
- **Integration Demos**: New demo pages for IIFE, ESM, dynamic loading, and standalone widget usage to test the bundled widget end-to-end.
- **Config Option `disableLogout`**: Allows host apps to hide the sidebar logout control when session lifecycle is managed externally.

### Changed
- `useOverlayResistant` hook now accepts configuration options
- `OverlayInfo` interface now includes `isManualOffset` flag
- Sidebar header, content, footer, skeleton, and FAB now respect overlay offsets for consistent spacing around external toolbars.

## [1.0.1] - 2025-12-08

### Fixed
- Resolved issue with error highlighting in certain browsers
- Fixed TypeScript type definition for DQMSidebar props

## [1.0.0] - 2025-10-30

### Added
- Initial release of @crownpeak/dqm-react-component
- DQMSidebar component for quality analysis
- ErrorBoundary component for error handling
- Full TypeScript support with type definitions
- Material-UI integration
- Real-time quality analysis dashboard
- Browser and source view for error highlighting
- Category-based filtering
- Accessibility compliance checking
- Comprehensive documentation

### Features
- Quality scoring and checkpoint validation
- WCAG 2.1 compliance checking
- Visual error highlighting
- Mobile responsive design
- Export functionality for highlighted errors

