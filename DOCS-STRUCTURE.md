# Documentation Structure

This document explains how documentation is organized and maintained in this repository.

## Single Source of Truth

**All documentation lives in `/docs`** - no duplicates elsewhere.

## Directory Structure

```
/
├── docs/                       📚 SINGLE SOURCE OF TRUTH
│   ├── QUICKSTART.md          - Quick start guide
│   ├── EXAMPLES.md            - Integration examples (10 examples)
│   ├── AUTHENTICATION.md      - Auth configuration + 3 Mermaid diagrams
│   ├── AI-FEATURES.md         - AI features + 4 Mermaid diagrams
│   ├── WIDGET-GUIDE.md        - Widget bundles + 1 Mermaid diagram
│   ├── MIGRATION-GUIDE.md     - v1.0→v1.1 migration
│   ├── API-REFERENCE.md       - TypeScript API (800+ lines)
│   ├── TROUBLESHOOTING.md     - FAQ + error codes (600+ lines)
│   ├── BACKEND-API.md         - Backend server docs
│   ├── DEVELOPMENT.md         - Development guide
│   ├── NPM-PUBLISH.md         - npm publishing workflow
│   ├── REDIS-SETUP.md         - Redis configuration
│   └── SERVER.md              - Server documentation
│
├── wiki/                       🔨 BUILD OUTPUT (gitignored except templates)
│   ├── Home.md                - Wiki home page (template, committed)
│   ├── _Sidebar.md            - Navigation (template, committed)
│   ├── README.md              - Wiki docs (committed)
│   └── *.md                   - Generated from docs/ (NOT committed)
│
└── Root (GitHub features only)
    ├── README.md              - Repository landing page
    ├── CHANGELOG.md           - Release notes
    ├── CONTRIBUTING.md        - Contribution guidelines (GitHub feature)
    ├── CODE_OF_CONDUCT.md     - Code of conduct (GitHub feature)
    └── LICENSE                - MIT license
```

## Why This Structure?

### `/docs` as Single Source

✅ **No Duplication** - Documentation exists in ONE place only  
✅ **Version Control** - Docs are versioned with code in Git  
✅ **Pull Request Reviews** - Documentation changes reviewed with code  
✅ **Developer Access** - Developers have docs locally when they clone  
✅ **Branch Support** - Different docs for different branches  

### `wiki/` as Build Output

✅ **Automated Generation** - Built from `/docs` via `scripts/wiki-build.sh`  
✅ **Clean Git History** - Generated files not committed (in `.gitignore`)  
✅ **Deploy Target** - `scripts/wiki-deploy.sh` pushes to GitHub Wiki  
✅ **Link Conversion** - Links automatically converted to Wiki format  

### Root Stays Minimal

✅ **GitHub Features** - `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` used by GitHub  
✅ **Landing Page** - `README.md` shown on repository homepage  
✅ **Visibility** - Important files remain at root for easy discovery  

## Workflow

### Editing Documentation

1. **Edit source files in `/docs`:**
   ```bash
   vim docs/QUICKSTART.md
   vim docs/AI-FEATURES.md
   ```

2. **Commit to repository:**
   ```bash
   git add docs/
   git commit -m "docs: update quick start guide"
   git push origin feat/localization
   ```

### Deploying to GitHub Wiki

1. **Build wiki from docs:**
   ```bash
   ./scripts/wiki-build.sh
   ```
   This creates `wiki/*.md` files with converted links.

2. **Deploy to GitHub Wiki:**
   ```bash
   ./scripts/wiki-deploy.sh "Update AI features documentation"
   ```
   This pushes `wiki/` to the GitHub Wiki repository.

### One-Step Deployment

```bash
# Build and deploy in one command
./scripts/wiki-deploy.sh "Update documentation"
```

The deploy script automatically runs `wiki-build.sh` first.

## Link Formats

### In `/docs` (Repository)

Use standard markdown links:

```markdown
[Quick Start](./QUICKSTART.md)
[Examples](./EXAMPLES.md)
[AI Features](./AI-FEATURES.md)
```

### In `wiki/` (Generated)

Links are automatically converted to Wiki format (no `.md` extension):

```markdown
[Quick Start](Quick-Start)
[Examples](Examples)
[AI Features](AI-Features)
```

### In Root `README.md`

Point to `/docs`:

```markdown
[Quick Start](./docs/QUICKSTART.md)
[Examples](./docs/EXAMPLES.md)
[AI Features](./docs/AI-FEATURES.md)
```

## File Mapping

| Source (`docs/`) | Wiki Output (`wiki/`) | Description |
|------------------|-----------------------|-------------|
| `QUICKSTART.md` | `Quick-Start.md` | Getting started |
| `EXAMPLES.md` | `Examples.md` | Integration examples |
| `AUTHENTICATION.md` | `Authentication.md` | Auth configuration |
| `AI-FEATURES.md` | `AI-Features.md` | AI features guide |
| `WIDGET-GUIDE.md` | `Widget-Bundle.md` | Widget bundles |
| `MIGRATION-GUIDE.md` | `Migration-Guide.md` | Migration guide |
| `API-REFERENCE.md` | `API-Reference.md` | TypeScript API |
| `TROUBLESHOOTING.md` | `Troubleshooting.md` | Troubleshooting |
| `BACKEND-API.md` | `Backend-Server.md` | Backend server |
| `DEVELOPMENT.md` | `Development.md` | Development guide |
| `NPM-PUBLISH.md` | `NPM-Publish.md` | Publishing workflow |
| `REDIS-SETUP.md` | `Redis-Setup.md` | Redis setup |
| `SERVER.md` | `Server.md` | Server docs |

## Git Ignore Rules

```gitignore
# Wiki build output (keep templates only)
wiki/*
!wiki/Home.md
!wiki/_Sidebar.md
!wiki/README.md
```

This ensures:
- ✅ Wiki templates (`Home.md`, `_Sidebar.md`, `README.md`) are committed
- ✅ Generated wiki files (`*.md`) are NOT committed
- ✅ Clean git history without build artifacts

## Scripts

### `scripts/wiki-build.sh`

Builds `wiki/` directory from `docs/` source files.

**What it does:**
1. Copies `docs/*.md` → `wiki/*.md` with name mapping
2. Converts markdown links to Wiki format (removes `.md` extensions)
3. Preserves wiki templates (`Home.md`, `_Sidebar.md`)

**Usage:**
```bash
./scripts/wiki-build.sh
```

### `scripts/wiki-deploy.sh`

Deploys `wiki/` directory to GitHub Wiki repository.

**What it does:**
1. Runs `wiki-build.sh` to generate wiki files
2. Clones GitHub Wiki repository (if not exists)
3. Copies `wiki/*.md` to wiki repository
4. Commits and pushes to GitHub Wiki

**Usage:**
```bash
./scripts/wiki-deploy.sh "Update AI features documentation"
```

## Benefits

### For Developers

✅ Edit docs alongside code  
✅ See docs in GitHub file browser  
✅ Review documentation in pull requests  
✅ Access docs offline  
✅ Branch-specific documentation  

### For Users

✅ Browse docs in GitHub Wiki  
✅ Search all documentation  
✅ Formatted wiki pages  
✅ Sidebar navigation  
✅ Always up-to-date  

### For Maintainers

✅ Single source of truth - no duplication  
✅ Automated wiki deployment  
✅ No manual sync required  
✅ Clean git history  
✅ Easy to update  

## Comparison with Alternatives

### ❌ Root-Level Docs (Old Approach)

```
/
├── QUICKSTART.md
├── EXAMPLES.md
├── AI-FEATURES.md
└── ... (13 files at root)
```

**Problems:**
- Cluttered root directory
- Hard to distinguish docs from config files
- No organization

### ❌ Duplicate Docs (Old Wiki Approach)

```
/
├── QUICKSTART.md (source)
├── EXAMPLES.md (source)
└── wiki/
    ├── Quick-Start.md (duplicate!)
    └── Examples.md (duplicate!)
```

**Problems:**
- Duplication causes sync issues
- Which is the source of truth?
- Double maintenance burden

### ✅ `/docs` + Generated `wiki/` (Current)

```
/
├── docs/
│   ├── QUICKSTART.md (source)
│   └── EXAMPLES.md (source)
└── wiki/
    ├── Quick-Start.md (generated, gitignored)
    └── Examples.md (generated, gitignored)
```

**Benefits:**
- Single source of truth (`docs/`)
- No duplication
- Automated wiki generation
- Clean git history

## Maintenance

### Regular Updates

After each feature/bugfix:
1. Update relevant docs in `docs/`
2. Commit to repository
3. Deploy to wiki: `./scripts/wiki-deploy.sh "Description"`

### After Releases

After releasing v1.1.0, v1.2.0, etc.:
1. Update version numbers in docs
2. Update `MIGRATION-GUIDE.md` with breaking changes
3. Update `CHANGELOG.md`
4. Deploy updated wiki

## Statistics

- **Source Files:** 13 markdown files in `docs/`
- **Total Lines:** ~4,500+ lines of documentation
- **Mermaid Diagrams:** 8 (3 in Authentication, 4 in AI Features, 1 in Widget)
- **Code Examples:** 60+ with TypeScript/JavaScript/HTML/PHP/Liquid
- **Languages:** TypeScript, JavaScript, Bash, JSON, HTML, PHP, Liquid

## See Also

- [WIKI-DEPLOYMENT.md](./WIKI-DEPLOYMENT.md) - Complete wiki deployment guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
- [GitHub Wiki](https://github.com/Crownpeak/dqm-react-component/wiki) - Live wiki
