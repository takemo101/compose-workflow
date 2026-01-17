#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Composer Workflow Setup ==="
echo ""

cd "$PROJECT_ROOT"

# 1. npm install
echo "Step 1: Installing npm dependencies..."
npm install
echo ""

# 2. Create symlinks
echo "Step 2: Creating symlinks..."

# wireframe-generator: .claude/skills/wireframe-generator -> .opencode/skill/wireframe-generator
LINK_PATH=".claude/skills/wireframe-generator"
TARGET_PATH="../../.opencode/skill/wireframe-generator"

if [ -L "$LINK_PATH" ]; then
    echo "  Symlink already exists: $LINK_PATH"
elif [ -e "$LINK_PATH" ]; then
    echo "  Warning: $LINK_PATH exists but is not a symlink. Skipping."
else
    ln -s "$TARGET_PATH" "$LINK_PATH"
    echo "  Created: $LINK_PATH -> $TARGET_PATH"
fi

echo ""

# 3. Install wireframe-generator dependencies
echo "Step 3: Installing wireframe-generator dependencies..."
if [ -d ".opencode/skill/wireframe-generator/scripts" ]; then
    cd ".opencode/skill/wireframe-generator/scripts"
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
    cd "$PROJECT_ROOT"
    echo "  Done."
else
    echo "  Skipped (directory not found)"
fi

echo ""
echo "=== Setup Complete ==="
