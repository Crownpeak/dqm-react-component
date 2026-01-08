# Crownpeak DQM Website - Release Notes

## v1.2.4 - 2026-01-08

### 🚀 Initial Release

The Crownpeak DQM React Component now has an official marketing and documentation website, hosted on GitHub Pages.

#### ✨ Features

- **Hero Section**: Animated landing page with feature highlights and call-to-action
- **Features Section**: Grid layout showcasing component capabilities
- **Demo Section**: Interactive sidebar demonstration with live preview
- **Integration Section**: Code examples with syntax highlighting and one-click copy
- **Footer**: Links to documentation, GitHub repository, and NPM package

#### 🌍 Internationalization

- Multi-language support: English (default), German, Spanish
- Language switcher in navigation
- Browser language auto-detection
- URL parameter override (`?lang=de`)

#### ♿ Accessibility (WCAG AA)

- Proper `aria-label` attributes on all icon-only interactive elements
- Color contrast ratio of 6.5:1+ on dark backgrounds
- Semantic HTML structure
- Keyboard navigation support

#### 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **i18n**: react-i18next
- **Deployment**: Static export to GitHub Pages

#### 📦 Deployment

Automatic deployment via GitHub Actions on push to `main` branch. Manual trigger also available via workflow dispatch.
