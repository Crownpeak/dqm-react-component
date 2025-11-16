# Contributing to Crownpeak DQM React Component

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to foster an inclusive and welcoming community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crownpeak-dqm-react-component.git
   cd crownpeak-dqm-react-component
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Development Server

```bash
npm run dev
```

This starts:
- Client on `http://localhost:5173`
- Backend on `http://localhost:3001`

### Building

```bash
# Build everything
npm run build

# Build library only
npm run build:lib

# Build server only
npm run build:server

# Build auth UI only
npm run build:auth-ui
```

### Linting

```bash
npm run lint
```

### Testing Your Changes

1. Test in development mode: `npm run dev`
2. Test build: `npm run build`
3. Test as package: `npm pack` and install in test project

## Pull Request Process

1. **Update documentation** if you change APIs or add features
2. **Update CHANGELOG.md** with your changes
3. **Ensure all builds pass**: `npm run build`
4. **Lint your code**: `npm run lint`
5. **Create a pull request** with a clear description of changes
6. **Link any related issues** in the PR description
7. **Wait for review** - maintainers will review your PR

### PR Title Format

Use conventional commits format:
- `feat: Add new feature`
- `fix: Fix bug in component`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Properly type all functions and variables
- Export types for public APIs
- Use interfaces for component props

### React

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use Material-UI components consistently

### Code Style

- Use ESLint configuration provided
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays

### File Organization

```
src/
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── cards/         # Card components
│   ├── common/        # Shared components
│   ├── renderers/     # HTML renderers
│   └── sidebar/       # Sidebar components
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## Commit Messages

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(sidebar): Add keyboard navigation support

Add arrow key navigation for checkpoint list.
Press Enter to expand/collapse categories.

Closes #123
```

```
fix(auth): Resolve session timeout issue

Session was expiring too early due to incorrect
timestamp calculation in Redis store.

Fixes #456
```

## Areas for Contribution

### High Priority
- Add unit tests (React Testing Library)
- Improve accessibility (ARIA labels, keyboard navigation)
- Add internationalization (i18n)
- Performance optimizations

### Documentation
- More usage examples
- Integration guides for different frameworks
- API documentation improvements
- Video tutorials

### Features
- Additional authentication methods
- Custom theming support
- Export analysis reports
- Offline mode support

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Tag your issues appropriately (bug, enhancement, question)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing!
