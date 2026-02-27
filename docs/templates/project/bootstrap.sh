#!/bin/bash
# Project Bootstrap Script for OpenClaw Projects
# Usage: ./bootstrap.sh <project-name>

set -e

PROJECT_NAME=$1
TEMPLATE_DIR="$(dirname "$0")"
PROJECTS_DIR="$(dirname "$TEMPLATE_DIR")/projects"

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ Error: Project name required"
    echo "Usage: ./bootstrap.sh <project-name>"
    exit 1
fi

PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"

echo "🚀 Bootstrapping project: $PROJECT_NAME"

# Create project directory
mkdir -p "$PROJECT_DIR"

# Copy templates
echo "📁 Copying templates..."
cp "$TEMPLATE_DIR"/*.template "$PROJECT_DIR/"
cp "$TEMPLATE_DIR"/.env.example "$PROJECT_DIR/"

# Rename .template files
echo "📝 Renaming templates..."
for file in "$PROJECT_DIR"/*.template; do
    mv "$file" "${file%.template}"
done

# Initialize git
echo "🔧 Initializing git repository..."
cd "$PROJECT_DIR"
git init
git add .
git commit -m "Initial commit: Bootstrap $PROJECT_NAME from template"

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env.local
.env*.local
.next/
dist/
build/
*.log
.DS_Store
EOF

git add .gitignore
git commit -m "Add .gitignore"

echo ""
echo "✅ Project '$PROJECT_NAME' bootstrapped successfully!"
echo ""
echo "📍 Location: $PROJECT_DIR"
echo ""
echo "📋 Next steps:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Edit REQ.md with your requirements"
echo "  3. Run 'npm install' (or appropriate install command)"
echo "  4. Start development workflow: Tony → Peter → Heimdall"
echo ""
