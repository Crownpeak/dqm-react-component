# GitHub Wiki Deployment Guide

Complete guide for deploying and maintaining the Crownpeak DQM React Component documentation wiki.

## Single Source of Truth Architecture

**Key Principle:** Avoid duplication - maintain ONE authoritative source for all documentation.

### Structure

```
/
├── README.md                    # GitHub landing page (stays in root)
├── LICENSE                      # Stays in root
├── CONTRIBUTING.md             # Stays in root (GitHub feature)
├── CODE_OF_CONDUCT.md          # Stays in root (GitHub feature)
│
├── docs/                       # 📚 SINGLE SOURCE OF TRUTH
│   ├── QUICKSTART.md
│   ├── EXAMPLES.md
│   ├── AUTHENTICATION.md
│   ├── AI-FEATURES.md
│   ├── WIDGET-GUIDE.md
│   ├── MIGRATION-GUIDE.md
│   ├── API-REFERENCE.md
│   ├── TROUBLESHOOTING.md
│   ├── BACKEND-API.md
│   ├── DEVELOPMENT.md
│   ├── NPM-PUBLISH.md
│   ├── REDIS-SETUP.md
│   └── SERVER.md
│
├── wiki/                       # 🔨 BUILD OUTPUT (in .gitignore)
│   ├── Home.md                 # Template (committed)
│   ├── _Sidebar.md             # Template (committed)
│   ├── README.md               # Documentation (committed)
│   └── *.md                    # Generated files (not committed)
│
└── scripts/
    ├── wiki-build.sh           # Build wiki/ from docs/
    └── wiki-deploy.sh          # Deploy wiki/ to GitHub Wiki
```

### Why This Structure?

✅ **No Duplication** - `docs/` is the only source  
✅ **Version Control** - Docs versioned with code  
✅ **PR Reviews** - Documentation changes reviewed with code  
✅ **Developer Access** - Developers have docs locally  
✅ **Build Automation** - `wiki/` generated automatically  
✅ **Clean Git History** - Build outputs not committed

### 1. Getting Started (4 pages)
- **[Home](wiki/Home.md)** - Main landing page with quick start
- **[Quick-Start](wiki/Quick-Start.md)** - Installation and basic setup
- **[Examples](wiki/Examples.md)** - 10 integration examples (React, Next.js, AI features)
- **[Authentication](wiki/Authentication.md)** - OAuth2, direct API, backend proxy with Mermaid diagrams

### 2. AI Features (4 pages)
- **[AI-Features](wiki/AI-Features.md)** - Complete AI documentation with 4 Mermaid diagrams
- **[API-Reference](wiki/API-Reference.md)** - Full TypeScript API (800+ lines)
- **[Migration-Guide](wiki/Migration-Guide.md)** - v1.0→v1.1 upgrade guide
- **[Troubleshooting](wiki/Troubleshooting.md)** - FAQ, error codes, debugging (600+ lines)

### 3. Advanced Usage (2 pages)
- **[Widget-Bundle](wiki/Widget-Bundle.md)** - IIFE/ESM bundles, CMS integrations
- **[Backend-Server](wiki/Backend-Server.md)** - OAuth2 backend server setup

### 4. Development (4 pages)
- **[Development](wiki/Development.md)** - Local development guide
- **[NPM-Publish](wiki/NPM-Publish.md)** - Publishing workflow
- **[Contributing](wiki/Contributing.md)** - Contribution guidelines
- **[Code-of-Conduct](wiki/Code-of-Conduct.md)** - Community guidelines

### Navigation (2 files)
- **[_Sidebar.md](wiki/_Sidebar.md)** - Manual sidebar navigation
- **[README.md](wiki/README.md)** - Wiki structure documentation

## File Mapping

| Root File | Wiki File | Description |
|-----------|-----------|-------------|
| - | `Home.md` | Wiki home page (derived from README.md) |
| - | `_Sidebar.md` | Navigation sidebar |
| `QUICKSTART.md` | `Quick-Start.md` | Getting started guide |
| `EXAMPLES.md` | `Examples.md` | Integration examples |
| `AUTHENTICATION.md` | `Authentication.md` | Auth configuration |
| `AI-FEATURES.md` | `AI-Features.md` | AI features documentation |
| `WIDGET-GUIDE.md` | `Widget-Bundle.md` | Widget bundle guide |
| `MIGRATION-GUIDE.md` | `Migration-Guide.md` | Migration guide |
| `API-REFERENCE.md` | `API-Reference.md` | TypeScript API |
| `TROUBLESHOOTING.md` | `Troubleshooting.md` | Troubleshooting guide |
| `BACKEND-API.md` | `Backend-Server.md` | Backend server docs |
| `DEVELOPMENT.md` | `Development.md` | Development guide |
| `NPM-PUBLISH.md` | `NPM-Publish.md` | Publishing guide |
| `CONTRIBUTING.md` | `Contributing.md` | Contributing guide |
| `CODE_OF_CONDUCT.md` | `Code-of-Conduct.md` | Code of conduct |

## Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Deploy to GitHub Wiki
./scripts/wiki-deploy.sh "Update AI features documentation"
```

The script will:
1. Clone wiki repository (if not exists)
2. Copy all `wiki/*.md` files
3. Show git diff
4. Prompt for confirmation
5. Commit and push to GitHub Wiki

### Method 2: Manual npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "wiki:update": "cp QUICKSTART.md wiki/Quick-Start.md && cp EXAMPLES.md wiki/Examples.md && cp AUTHENTICATION.md wiki/Authentication.md && cp AI-FEATURES.md wiki/AI-Features.md && cp WIDGET-GUIDE.md wiki/Widget-Bundle.md && cp MIGRATION-GUIDE.md wiki/Migration-Guide.md && cp API-REFERENCE.md wiki/API-Reference.md && cp TROUBLESHOOTING.md wiki/Troubleshooting.md && cp BACKEND-API.md wiki/Backend-Server.md && cp DEVELOPMENT.md wiki/Development.md && cp NPM-PUBLISH.md wiki/NPM-Publish.md && cp CONTRIBUTING.md wiki/Contributing.md && cp CODE_OF_CONDUCT.md wiki/Code-of-Conduct.md",
    "wiki:fix-links": "cd wiki && sed -i '' 's|\\](\\./QUICKSTART\\.md)|](Quick-Start)|g' *.md && sed -i '' 's|\\](\\./EXAMPLES\\.md)|](Examples)|g' *.md && sed -i '' 's|\\](\\./AUTHENTICATION\\.md)|](Authentication)|g' *.md && sed -i '' 's|\\](\\./AI-FEATURES\\.md)|](AI-Features)|g' *.md && sed -i '' 's|\\](\\./WIDGET-GUIDE\\.md)|](Widget-Bundle)|g' *.md && sed -i '' 's|\\](\\./MIGRATION-GUIDE\\.md)|](Migration-Guide)|g' *.md && sed -i '' 's|\\](\\./API-REFERENCE\\.md)|](API-Reference)|g' *.md && sed -i '' 's|\\](\\./TROUBLESHOOTING\\.md)|](Troubleshooting)|g' *.md && sed -i '' 's|\\](\\./BACKEND-API\\.md)|](Backend-Server)|g' *.md && sed -i '' 's|\\](\\./DEVELOPMENT\\.md)|](Development)|g' *.md && sed -i '' 's|\\](\\./NPM-PUBLISH\\.md)|](NPM-Publish)|g' *.md && sed -i '' 's|\\](\\./CONTRIBUTING\\.md)|](Contributing)|g' *.md && sed -i '' 's|\\](\\./CODE_OF_CONDUCT\\.md)|](Code-of-Conduct)|g' *.md",
    "wiki:deploy": "npm run wiki:update && npm run wiki:fix-links && ./scripts/wiki-deploy.sh"
  }
}
```

Then run:

```bash
npm run wiki:deploy
```

### Method 3: Manual GitHub Upload

1. Go to https://github.com/Crownpeak/dqm-react-component/wiki
2. Click "New Page" for each file
3. Copy content from `wiki/*.md` files
4. Save each page

**Note:** This is tedious for 16 pages - use automated methods instead.

## Link Format Conversion

GitHub Wiki uses special link syntax without file extensions:

**Before (Repository):**
```markdown
[Quick Start](./QUICKSTART.md)
[Examples](./EXAMPLES.md)
```

**After (Wiki):**
```markdown
[Quick Start](Quick-Start)
[Examples](Examples)
```

All links in `wiki/*.md` files have been automatically converted.

## Updating Documentation

### Workflow

1. **Edit source files in repository root:**
   ```bash
   vim QUICKSTART.md
   vim AI-FEATURES.md
   # etc.
   ```

2. **Update wiki/ directory:**
   ```bash
   npm run wiki:update      # Copy files
   npm run wiki:fix-links   # Fix link format
   ```

3. **Deploy to GitHub Wiki:**
   ```bash
   ./scripts/wiki-deploy.sh "Update quick start guide"
   ```

### Git Workflow

```bash
# 1. Make changes to documentation
vim AI-FEATURES.md

# 2. Update wiki/ directory
npm run wiki:update
npm run wiki:fix-links

# 3. Commit to repository (feat/localization branch)
git add AI-FEATURES.md wiki/AI-Features.md
git commit -m "docs: update AI features guide"
git push origin feat/localization

# 4. Deploy to GitHub Wiki
./scripts/wiki-deploy.sh "Update AI features documentation"
```

## Wiki vs Repository Documentation

### Keep Both Synchronized

| Location | Purpose | Format | Audience |
|----------|---------|--------|----------|
| **Repository Root** (`*.md`) | GitHub README display | Standard markdown with `.md` links | GitHub visitors |
| **`wiki/` Directory** | Wiki source files | Wiki format (no `.md` in links) | Wiki deployment |
| **GitHub Wiki** | Live documentation | Rendered wiki pages | Documentation readers |

### Why Keep Root Files?

1. **GitHub README:** Repository visitors see documentation in file browser
2. **Version Control:** Docs versioned with code (in branches)
3. **Pull Requests:** Documentation changes reviewed with code
4. **Offline Access:** Developers have docs locally

### Why Separate wiki/ Directory?

1. **Link Format:** Wiki links don't use file extensions
2. **File Names:** Wiki uses hyphenated names (Quick-Start.md vs QUICKSTART.md)
3. **Deployment:** Clean separation between source and wiki deployment
4. **Automation:** Easy to automate wiki updates

## Mermaid Diagrams

The wiki contains **8 Mermaid diagrams** across 3 files:

### AI-Features.md (4 diagrams)
1. Translation Flow - OpenAI/WebLLM processing pipeline
2. Summary Generation Flow - Chunking strategies and fallbacks
3. Chunking Strategy Decision - Token-based chunking logic
4. Caching Architecture - IndexedDB + In-Memory caching

### Authentication.md (3 diagrams)
1. Authentication Flow Overview - Props → localStorage → Backend → Login form
2. OAuth2 Flow (Sequence) - Complete OAuth2 authorization flow
3. Session Type Flow - Direct vs Backend proxy API calls

### Widget-Bundle.md (1 diagram)
1. Widget Loading Flow - IIFE/ESM initialization and analysis flow

## Maintenance

### Regular Updates

**After each feature/bugfix:**
1. Update relevant documentation in repository root
2. Run `npm run wiki:update && npm run wiki:fix-links`
3. Deploy with `./scripts/wiki-deploy.sh "Description of changes"`

**After releases (v1.1.0, v1.2.0, etc.):**
1. Update version numbers in all docs
2. Update Migration-Guide.md with new breaking changes
3. Deploy updated wiki

### Monitoring

- **Check Wiki:** https://github.com/Crownpeak/dqm-react-component/wiki
- **Wiki Analytics:** GitHub Insights → Traffic (if available)
- **User Feedback:** GitHub Issues/Discussions for documentation requests

## Troubleshooting

### Issue: Links not working in wiki

**Cause:** Links still use `.md` extension

**Solution:**
```bash
cd wiki
npm run wiki:fix-links
```

### Issue: Wiki deployment script fails

**Cause:** Wiki repository not cloned

**Solution:**
```bash
git clone https://github.com/Crownpeak/dqm-react-component.wiki.git
./scripts/wiki-deploy.sh
```

### Issue: Mermaid diagrams not rendering

**Cause:** GitHub Wiki might not support Mermaid (depends on GitHub features)

**Solution:** Mermaid is supported in GitHub markdown. If diagrams don't render:
1. Verify syntax with [Mermaid Live Editor](https://mermaid.live/)
2. Check for any indentation issues
3. Ensure code blocks use ` ```mermaid ` (not ` ```markdown `)

### Issue: Missing pages in _Sidebar.md

**Cause:** Some pages listed in _Sidebar.md don't exist yet

**Solution:** These are placeholder pages for future expansion:
- `AI-Translation-OpenAI.md`
- `AI-Translation-WebLLM.md`
- `AI-Summary.md`
- `AI-Caching.md`
- `Internationalization.md`
- `Custom-Translations.md`
- `Language-Support.md`
- `Component-DQMSidebar.md`
- `Component-ErrorBoundary.md`
- `Component-Configuration.md`
- `Widget-IIFE.md`
- `Widget-ESM.md`
- `Widget-CMS-Integrations.md`
- `Hooks-AI.md`
- `Hooks-Core.md`
- `Redux-Store.md`
- `Error-Messages.md`
- `LocalStorage-Keys.md`
- `Browser-Compatibility.md`
- `TypeScript-Types.md`
- `Performance.md`

You can either:
1. Remove these links from `_Sidebar.md`
2. Create these pages by extracting content from existing docs
3. Leave as-is (GitHub Wiki shows broken links, but it's clear they're placeholders)

## Statistics

- **Total Pages:** 16 (+ 19 placeholders in sidebar)
- **Total Lines:** ~4,500+ lines of documentation
- **Mermaid Diagrams:** 8
- **Code Examples:** 60+
- **Languages Covered:** TypeScript, JavaScript, HTML, PHP, Liquid, Bash, JSON
- **Sections:** Getting Started, AI Features, Advanced Usage, Development, Reference

## Next Steps

1. **Create Placeholder Pages:** Extract detailed pages from existing documentation
2. **Add Screenshots:** Add visual examples to wiki pages
3. **Video Tutorials:** Embed YouTube videos in wiki
4. **Community Contributions:** Encourage users to improve documentation via wiki edits
5. **Translations:** Consider translating wiki to German/Spanish (matching i18n support)

## Resources

- **GitHub Wiki Docs:** https://docs.github.com/en/communities/documenting-your-project-with-wikis
- **Mermaid Syntax:** https://mermaid.js.org/
- **Markdown Guide:** https://guides.github.com/features/mastering-markdown/
