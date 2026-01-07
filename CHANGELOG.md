# Crownpeak DQM React Component - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

