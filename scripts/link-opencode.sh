#!/bin/bash
#
# .opencode ディレクトリへのシンボリックリンクを作成するスクリプト
# opencode.json と package.json はコピー（既存の場合はスキップ）
#
# 使用方法:
#   ./scripts/link-opencode.sh <target-directory>
#
# 例:
#   ./scripts/link-opencode.sh ~/projects/my-app
#   ./scripts/link-opencode.sh /Users/user/work/another-project
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OPENCODE_SOURCE="${SOURCE_DIR}/.opencode"

usage() {
    echo "Usage: $0 <target-directory>"
    echo ""
    echo "Creates a symbolic link to .opencode in the specified directory."
    echo "Also copies opencode.json and package.json (if not already present)."
    echo ""
    echo "Arguments:"
    echo "  target-directory    Directory where the symlink will be created"
    echo ""
    echo "Examples:"
    echo "  $0 ~/projects/my-app"
    echo "  $0 /Users/user/work/another-project"
    exit 1
}

if [[ $# -lt 1 ]]; then
    echo -e "${RED}Error: Target directory is required.${NC}"
    usage
fi

TARGET_DIR="$1"

if [[ ! -d "$TARGET_DIR" ]]; then
    echo -e "${RED}Error: Target directory does not exist: ${TARGET_DIR}${NC}"
    exit 1
fi

if [[ ! -d "$OPENCODE_SOURCE" ]]; then
    echo -e "${RED}Error: Source .opencode directory not found: ${OPENCODE_SOURCE}${NC}"
    exit 1
fi

TARGET_LINK="${TARGET_DIR}/.opencode"

if [[ -L "$TARGET_LINK" ]]; then
    EXISTING_TARGET="$(readlink "$TARGET_LINK")"
    if [[ "$EXISTING_TARGET" == "$OPENCODE_SOURCE" ]]; then
        echo -e "${YELLOW}Symlink already exists and points to the correct location.${NC}"
    else
        echo -e "${YELLOW}Warning: Symlink exists but points to different location: ${EXISTING_TARGET}${NC}"
        read -p "Replace it? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$TARGET_LINK"
            ln -s "$OPENCODE_SOURCE" "$TARGET_LINK"
            echo -e "${GREEN}✓ Symbolic link replaced.${NC}"
        else
            echo "Symlink not updated."
        fi
    fi
elif [[ -d "$TARGET_LINK" ]]; then
    echo -e "${RED}Error: A directory already exists at ${TARGET_LINK}${NC}"
    echo "Please remove or rename it first."
    exit 1
elif [[ -f "$TARGET_LINK" ]]; then
    echo -e "${RED}Error: A file already exists at ${TARGET_LINK}${NC}"
    echo "Please remove or rename it first."
    exit 1
else
    ln -s "$OPENCODE_SOURCE" "$TARGET_LINK"
    echo -e "${GREEN}✓ Symbolic link created successfully!${NC}"
fi

echo ""
echo "  Source: ${OPENCODE_SOURCE}"
echo "  Link:   ${TARGET_LINK}"

TARGET_OPENCODE_JSON="${TARGET_DIR}/opencode.json"
SOURCE_OPENCODE_JSON="${SOURCE_DIR}/opencode.json"

if [[ -f "$SOURCE_OPENCODE_JSON" ]]; then
    if [[ -e "$TARGET_OPENCODE_JSON" ]]; then
        echo -e "${YELLOW}⏭ opencode.json already exists, skipping.${NC}"
    else
        cp "$SOURCE_OPENCODE_JSON" "$TARGET_OPENCODE_JSON"
        echo -e "${GREEN}✓ opencode.json copied.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Source opencode.json not found, skipping.${NC}"
fi

TARGET_PACKAGE_JSON="${TARGET_DIR}/package.json"
SOURCE_PACKAGE_JSON="${SOURCE_DIR}/package.json"

if [[ -f "$SOURCE_PACKAGE_JSON" ]]; then
    if [[ -e "$TARGET_PACKAGE_JSON" ]]; then
        echo -e "${YELLOW}⏭ package.json already exists, skipping.${NC}"
    else
        cp "$SOURCE_PACKAGE_JSON" "$TARGET_PACKAGE_JSON"
        echo -e "${GREEN}✓ package.json copied.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Source package.json not found, skipping.${NC}"
fi

echo ""
echo "Running bun install in ${TARGET_DIR}..."
(cd "$TARGET_DIR" && bun install)
echo -e "${GREEN}✓ bun install completed.${NC}"

echo ""
echo "You can now use .opencode configurations in ${TARGET_DIR}"
