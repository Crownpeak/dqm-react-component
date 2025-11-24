# NPM Publishing Guide

## Prerequisites

1. **NPM Account**: Ensure you have an account on [npmjs.com](https://www.npmjs.com/)
2. **NPM Login**: Login to npm from your terminal:
   ```bash
   npm login
   ```
3. **Organization Access**: If publishing to `@crownpeak` scope, ensure you have write permissions to the organization

## Pre-Publishing Checklist

- [ ] Update version in `package.json` (follow [Semantic Versioning](https://semver.org/))
- [ ] Update `CHANGELOG.md` with changes in this release
- [ ] Ensure all tests pass: `npm test` (if tests exist)
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Review package contents: `npm pack --dry-run`

## Version Update

Update the version number in `package.json`:

```bash
# For patches (bug fixes)
npm version patch

# For minor releases (new features, backwards compatible)
npm version minor

# For major releases (breaking changes)
npm version major
```

This will automatically:
- Update `package.json`
- Create a git commit
- Create a git tag

## Publish to NPM

### 1. First Time Publishing

For first-time publishing of a scoped package:

```bash
npm publish --access public
```

### 2. Subsequent Publishes

For regular updates:

```bash
npm publish
```

The `prepublishOnly` script will automatically:
1. Run `npm run build` to compile all code
2. Run `npm run lint` to check code quality

### 3. Beta/Pre-release Versions

For pre-release versions:

```bash
# Update to beta version
npm version prerelease --preid=beta

# Publish with beta tag
npm publish --tag beta
```

Users can install with: `npm install @crownpeak/dqm-react-component@beta`

## Post-Publishing

1. **Push to Git**:
   ```bash
   git push origin main --follow-tags
   ```

2. **Create GitHub Release**:
   - Go to GitHub repository
   - Create a new release from the version tag
   - Add release notes from `CHANGELOG.md`

3. **Verify Installation**:
   ```bash
   npm view @crownpeak/dqm-react-component
   ```

4. **Test Installation**:
   ```bash
   npm install @crownpeak/dqm-react-component
   ```

## Package Contents

The published package includes:

- `dist/` - Compiled library code (ESM + CommonJS)
  - `dist/index.js` - ESM build
  - `dist/index.cjs` - CommonJS build
  - `dist/index.d.ts` - TypeScript definitions
  - `dist/server/` - Backend server code
  - `dist/auth-ui/` - Authentication UI bundle
- `README.md` - Main documentation
- `LICENSE` - MIT License
- `CHANGELOG.md` - Version history
- `QUICKSTART.md` - Quick start guide
- `EXAMPLES.md` - Usage examples
- `AUTHENTICATION.md` - Auth documentation
- `BACKEND-API.md` - Backend API docs
- `DEVELOPMENT.md` - Development guide
- `PUBLISHING.md` - Publishing workflow

## Files Excluded (via .npmignore)

- Source code (`src/`, `server/`, `server-ui/`)
- Development files (`.vscode/`, `.env`, config files)
- Build configuration files
- Test files
- Git files

## Unpublishing

⚠️ **Caution**: Unpublishing is discouraged and only allowed within 72 hours.

```bash
npm unpublish @crownpeak/dqm-react-component@1.0.0
```

## Deprecating a Version

If a version has issues, deprecate it instead of unpublishing:

```bash
npm deprecate @crownpeak/dqm-react-component@1.0.0 "Critical bug, use version 1.0.1 instead"
```

## Troubleshooting

### Authentication Errors

```bash
npm logout
npm login
```

### Permission Errors

Ensure you have write access to the `@crownpeak` organization on npmjs.com.

### Build Errors

Clean and rebuild:

```bash
rm -rf dist node_modules
npm install
npm run build
```

### Package Size Warnings

Check bundle size:

```bash
npm pack --dry-run | grep "unpacked size"
```

Current package size: ~4.3 MB unpacked, ~1.2 MB packed

## NPM Scripts Reference

- `npm run build` - Build library, server, and auth-ui
- `npm run build:lib` - Build library only
- `npm run build:server` - Build server only
- `npm run build:auth-ui` - Build auth-ui only
- `npm run lint` - Run ESLint
- `npm pack` - Create tarball locally for testing
- `npm publish` - Publish to npm registry

## Resources

- [NPM Publishing Docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [NPM Package Scope](https://docs.npmjs.com/cli/v10/using-npm/scope)
- [NPM Organizations](https://docs.npmjs.com/organizations)
