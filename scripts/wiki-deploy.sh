#!/bin/bash
#
# GitHub Wiki Deployment Script
# Deploys documentation from wiki/ directory to GitHub Wiki repository
#
# Usage: ./wiki-deploy.sh [commit-message]
#

set -e

WIKI_REPO="https://github.com/Crownpeak/dqm-react-component.wiki.git"
WIKI_DIR="dqm-react-component.wiki"
COMMIT_MSG="${1:-Update documentation}"

echo "🚀 GitHub Wiki Deployment Script"
echo "=================================="
echo ""

# Build wiki from docs/
echo "🔨 Building wiki from docs/..."
./scripts/wiki-build.sh

# Check if wiki directory exists
if [ ! -d "wiki" ]; then
    echo "❌ Error: wiki/ directory not found"
    echo "   Wiki build failed"
    exit 1
fi

# Check if wiki repo is already cloned
if [ -d "$WIKI_DIR" ]; then
    echo "📁 Wiki repository already cloned"
    cd "$WIKI_DIR"
    echo "🔄 Pulling latest changes..."
    git pull origin master
    cd ..
else
    echo "📥 Cloning wiki repository..."
    git clone "$WIKI_REPO" "$WIKI_DIR"
fi

# Copy wiki files
echo "📋 Copying wiki files..."
cp wiki/*.md "$WIKI_DIR/"

# Show changes
cd "$WIKI_DIR"
echo ""
echo "📊 Changes to be committed:"
git status --short

# Prompt for confirmation
echo ""
read -p "Deploy to GitHub Wiki? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Committing changes..."
    git add .
    git commit -m "$COMMIT_MSG" || echo "No changes to commit"
    
    echo "🚀 Pushing to GitHub Wiki..."
    git push origin master
    
    echo ""
    echo "✅ Deployment complete!"
    echo "📖 View wiki: https://github.com/Crownpeak/dqm-react-component/wiki"
else
    echo "❌ Deployment cancelled"
    exit 1
fi

cd ..
