#!/bin/bash
#
# Wiki Build Script
# Builds wiki/ directory from docs/ source files
#
# Usage: ./scripts/wiki-build.sh
#

set -e

DOCS_DIR="docs"
WIKI_DIR="wiki"

echo "📦 Building Wiki from docs/"
echo "=============================="
echo ""

# Check if docs directory exists
if [ ! -d "$DOCS_DIR" ]; then
    echo "❌ Error: $DOCS_DIR/ directory not found"
    exit 1
fi

# Create wiki directory if not exists
mkdir -p "$WIKI_DIR"

# Copy templates from docs/
echo "📄 Copying wiki templates from docs/..."
cp "$DOCS_DIR/WIKI-HOME.md" "$WIKI_DIR/Home.md" 2>/dev/null && echo "  ✓ Home.md (from WIKI-HOME.md)" || echo "  ⚠ WIKI-HOME.md not found"
cp "$DOCS_DIR/WIKI-SIDEBAR.md" "$WIKI_DIR/_Sidebar.md" 2>/dev/null && echo "  ✓ _Sidebar.md (from WIKI-SIDEBAR.md)" || echo "  ⚠ WIKI-SIDEBAR.md not found"

# File mapping: docs/*.md → wiki/Wiki-Name.md (names based on document headings)
echo "📋 Copying files from docs/ to wiki/..."

cp "$DOCS_DIR/QUICKSTART.md" "$WIKI_DIR/Quick-Start-Guide.md" 2>/dev/null && echo "  ✓ Quick-Start-Guide.md" || echo "  ⚠ QUICKSTART.md not found"
cp "$DOCS_DIR/EXAMPLES.md" "$WIKI_DIR/Example-Usage.md" 2>/dev/null && echo "  ✓ Example-Usage.md" || echo "  ⚠ EXAMPLES.md not found"
cp "$DOCS_DIR/AUTHENTICATION.md" "$WIKI_DIR/Authentication-Configuration.md" 2>/dev/null && echo "  ✓ Authentication-Configuration.md" || echo "  ⚠ AUTHENTICATION.md not found"
cp "$DOCS_DIR/AI-FEATURES.md" "$WIKI_DIR/AI-Features-Guide.md" 2>/dev/null && echo "  ✓ AI-Features-Guide.md" || echo "  ⚠ AI-FEATURES.md not found"
cp "$DOCS_DIR/WIDGET-GUIDE.md" "$WIKI_DIR/Widget-Bundle-Guide.md" 2>/dev/null && echo "  ✓ Widget-Bundle-Guide.md" || echo "  ⚠ WIDGET-GUIDE.md not found"
cp "$DOCS_DIR/MIGRATION-GUIDE.md" "$WIKI_DIR/Migration-Guide.md" 2>/dev/null && echo "  ✓ Migration-Guide.md" || echo "  ⚠ MIGRATION-GUIDE.md not found"
cp "$DOCS_DIR/API-REFERENCE.md" "$WIKI_DIR/API-Reference.md" 2>/dev/null && echo "  ✓ API-Reference.md" || echo "  ⚠ API-REFERENCE.md not found"
cp "$DOCS_DIR/TROUBLESHOOTING.md" "$WIKI_DIR/Troubleshooting-Guide.md" 2>/dev/null && echo "  ✓ Troubleshooting-Guide.md" || echo "  ⚠ TROUBLESHOOTING.md not found"
cp "$DOCS_DIR/BACKEND-API.md" "$WIKI_DIR/Backend-API-Guide.md" 2>/dev/null && echo "  ✓ Backend-API-Guide.md" || echo "  ⚠ BACKEND-API.md not found"
cp "$DOCS_DIR/DEVELOPMENT.md" "$WIKI_DIR/Development-Guide.md" 2>/dev/null && echo "  ✓ Development-Guide.md" || echo "  ⚠ DEVELOPMENT.md not found"
cp "$DOCS_DIR/NPM-PUBLISH.md" "$WIKI_DIR/NPM-Publishing-Guide.md" 2>/dev/null && echo "  ✓ NPM-Publishing-Guide.md" || echo "  ⚠ NPM-PUBLISH.md not found"
cp "$DOCS_DIR/REDIS-SETUP.md" "$WIKI_DIR/Redis-Production-Setup.md" 2>/dev/null && echo "  ✓ Redis-Production-Setup.md" || echo "  ⚠ REDIS-SETUP.md not found"
cp "$DOCS_DIR/SERVER.md" "$WIKI_DIR/Backend-Server.md" 2>/dev/null && echo "  ✓ Backend-Server.md" || echo "  ⚠ SERVER.md not found"
cp "$DOCS_DIR/MCP-SERVER.md" "$WIKI_DIR/MCP-Server-Integration.md" 2>/dev/null && echo "  ✓ MCP-Server-Integration.md" || echo "  ⚠ MCP-SERVER.md not found"

echo ""
echo "🔗 Fixing wiki links..."

# Fix all markdown links for wiki format
cd "$WIKI_DIR"

# Remove .md extensions from links and map to new wiki page names
sed -i '' 's|\](./docs/QUICKSTART\.md)|\](Quick-Start-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/EXAMPLES\.md)|\](Example-Usage)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/AUTHENTICATION\.md)|\](Authentication-Configuration)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/AI-FEATURES\.md)|\](AI-Features-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/WIDGET-GUIDE\.md)|\](Widget-Bundle-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/MIGRATION-GUIDE\.md)|\](Migration-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/API-REFERENCE\.md)|\](API-Reference)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/TROUBLESHOOTING\.md)|\](Troubleshooting-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/BACKEND-API\.md)|\](Backend-API-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/DEVELOPMENT\.md)|\](Development-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/NPM-PUBLISH\.md)|\](NPM-Publishing-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/REDIS-SETUP\.md)|\](Redis-Production-Setup)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/SERVER\.md)|\](Backend-Server)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/MCP-SERVER\.md)|\](MCP-Server-Integration)|g' *.md 2>/dev/null || true

# Also handle root-level links (within docs/ folder)
sed -i '' 's|\](./QUICKSTART\.md)|\](Quick-Start-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./EXAMPLES\.md)|\](Example-Usage)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./AUTHENTICATION\.md)|\](Authentication-Configuration)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./AI-FEATURES\.md)|\](AI-Features-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./WIDGET-GUIDE\.md)|\](Widget-Bundle-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./MIGRATION-GUIDE\.md)|\](Migration-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./API-REFERENCE\.md)|\](API-Reference)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./TROUBLESHOOTING\.md)|\](Troubleshooting-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./BACKEND-API\.md)|\](Backend-API-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./DEVELOPMENT\.md)|\](Development-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./NPM-PUBLISH\.md)|\](NPM-Publishing-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./REDIS-SETUP\.md)|\](Redis-Production-Setup)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./SERVER\.md)|\](Backend-Server)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./MCP-SERVER\.md)|\](MCP-Server-Integration)|g' *.md 2>/dev/null || true

# Handle links without ./ prefix (e.g., ](EXAMPLES.md))
sed -i '' 's|\](QUICKSTART\.md)|\](Quick-Start-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](EXAMPLES\.md)|\](Example-Usage)|g' *.md 2>/dev/null || true
sed -i '' 's|\](AUTHENTICATION\.md)|\](Authentication-Configuration)|g' *.md 2>/dev/null || true
sed -i '' 's|\](AI-FEATURES\.md)|\](AI-Features-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](WIDGET-GUIDE\.md)|\](Widget-Bundle-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](MIGRATION-GUIDE\.md)|\](Migration-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](API-REFERENCE\.md)|\](API-Reference)|g' *.md 2>/dev/null || true
sed -i '' 's|\](TROUBLESHOOTING\.md)|\](Troubleshooting-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](BACKEND-API\.md)|\](Backend-API-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](DEVELOPMENT\.md)|\](Development-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](NPM-PUBLISH\.md)|\](NPM-Publishing-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](REDIS-SETUP\.md)|\](Redis-Production-Setup)|g' *.md 2>/dev/null || true
sed -i '' 's|\](SERVER\.md)|\](Backend-Server)|g' *.md 2>/dev/null || true
sed -i '' 's|\](MCP-SERVER\.md)|\](MCP-Server-Integration)|g' *.md 2>/dev/null || true

cd ..

echo ""
echo "✅ Wiki build complete!"
echo "📁 Files: $(ls -1 $WIKI_DIR/*.md 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "Next steps:"
echo "  ./scripts/wiki-deploy.sh \"Update documentation\""
