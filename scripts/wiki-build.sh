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

# Preserve templates
if [ -f "$WIKI_DIR/Home.md" ]; then
    echo "✅ Preserving Home.md template"
fi
if [ -f "$WIKI_DIR/_Sidebar.md" ]; then
    echo "✅ Preserving _Sidebar.md template"
fi

# File mapping: docs/*.md → wiki/Wiki-Name.md
echo "📋 Copying files from docs/ to wiki/..."

cp "$DOCS_DIR/QUICKSTART.md" "$WIKI_DIR/Quick-Start.md" 2>/dev/null && echo "  ✓ Quick-Start.md" || echo "  ⚠ QUICKSTART.md not found"
cp "$DOCS_DIR/EXAMPLES.md" "$WIKI_DIR/Examples.md" 2>/dev/null && echo "  ✓ Examples.md" || echo "  ⚠ EXAMPLES.md not found"
cp "$DOCS_DIR/AUTHENTICATION.md" "$WIKI_DIR/Authentication.md" 2>/dev/null && echo "  ✓ Authentication.md" || echo "  ⚠ AUTHENTICATION.md not found"
cp "$DOCS_DIR/AI-FEATURES.md" "$WIKI_DIR/AI-Features.md" 2>/dev/null && echo "  ✓ AI-Features.md" || echo "  ⚠ AI-FEATURES.md not found"
cp "$DOCS_DIR/WIDGET-GUIDE.md" "$WIKI_DIR/Widget-Bundle.md" 2>/dev/null && echo "  ✓ Widget-Bundle.md" || echo "  ⚠ WIDGET-GUIDE.md not found"
cp "$DOCS_DIR/MIGRATION-GUIDE.md" "$WIKI_DIR/Migration-Guide.md" 2>/dev/null && echo "  ✓ Migration-Guide.md" || echo "  ⚠ MIGRATION-GUIDE.md not found"
cp "$DOCS_DIR/API-REFERENCE.md" "$WIKI_DIR/API-Reference.md" 2>/dev/null && echo "  ✓ API-Reference.md" || echo "  ⚠ API-REFERENCE.md not found"
cp "$DOCS_DIR/TROUBLESHOOTING.md" "$WIKI_DIR/Troubleshooting.md" 2>/dev/null && echo "  ✓ Troubleshooting.md" || echo "  ⚠ TROUBLESHOOTING.md not found"
cp "$DOCS_DIR/BACKEND-API.md" "$WIKI_DIR/Backend-Server.md" 2>/dev/null && echo "  ✓ Backend-Server.md" || echo "  ⚠ BACKEND-API.md not found"
cp "$DOCS_DIR/DEVELOPMENT.md" "$WIKI_DIR/Development.md" 2>/dev/null && echo "  ✓ Development.md" || echo "  ⚠ DEVELOPMENT.md not found"
cp "$DOCS_DIR/NPM-PUBLISH.md" "$WIKI_DIR/NPM-Publish.md" 2>/dev/null && echo "  ✓ NPM-Publish.md" || echo "  ⚠ NPM-PUBLISH.md not found"
cp "$DOCS_DIR/REDIS-SETUP.md" "$WIKI_DIR/Redis-Setup.md" 2>/dev/null && echo "  ✓ Redis-Setup.md" || echo "  ⚠ REDIS-SETUP.md not found"
cp "$DOCS_DIR/SERVER.md" "$WIKI_DIR/Server.md" 2>/dev/null && echo "  ✓ Server.md" || echo "  ⚠ SERVER.md not found"

echo ""
echo "🔗 Fixing wiki links..."

# Fix all markdown links for wiki format
cd "$WIKI_DIR"

# Remove .md extensions from links
sed -i '' 's|\](./docs/QUICKSTART\.md)|\](Quick-Start)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/EXAMPLES\.md)|\](Examples)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/AUTHENTICATION\.md)|\](Authentication)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/AI-FEATURES\.md)|\](AI-Features)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/WIDGET-GUIDE\.md)|\](Widget-Bundle)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/MIGRATION-GUIDE\.md)|\](Migration-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/API-REFERENCE\.md)|\](API-Reference)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/TROUBLESHOOTING\.md)|\](Troubleshooting)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/BACKEND-API\.md)|\](Backend-Server)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/DEVELOPMENT\.md)|\](Development)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/NPM-PUBLISH\.md)|\](NPM-Publish)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/REDIS-SETUP\.md)|\](Redis-Setup)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./docs/SERVER\.md)|\](Server)|g' *.md 2>/dev/null || true

# Also handle root-level links
sed -i '' 's|\](./QUICKSTART\.md)|\](Quick-Start)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./EXAMPLES\.md)|\](Examples)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./AUTHENTICATION\.md)|\](Authentication)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./AI-FEATURES\.md)|\](AI-Features)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./WIDGET-GUIDE\.md)|\](Widget-Bundle)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./MIGRATION-GUIDE\.md)|\](Migration-Guide)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./API-REFERENCE\.md)|\](API-Reference)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./TROUBLESHOOTING\.md)|\](Troubleshooting)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./BACKEND-API\.md)|\](Backend-Server)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./DEVELOPMENT\.md)|\](Development)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./NPM-PUBLISH\.md)|\](NPM-Publish)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./REDIS-SETUP\.md)|\](Redis-Setup)|g' *.md 2>/dev/null || true
sed -i '' 's|\](./SERVER\.md)|\](Server)|g' *.md 2>/dev/null || true

cd ..

echo ""
echo "✅ Wiki build complete!"
echo "📁 Files: $(ls -1 $WIKI_DIR/*.md 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "Next steps:"
echo "  ./scripts/wiki-deploy.sh \"Update documentation\""
