#!/bin/bash
#
# .opencode ディレクトリへのシンボリックリンクを作成するスクリプト
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
OPENCODE_SOURCE="$(cd "${SCRIPT_DIR}/.." && pwd)/.opencode"

usage() {
    echo "Usage: $0 <target-directory>"
    echo ""
    echo "Creates a symbolic link to .opencode in the specified directory."
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
        exit 0
    else
        echo -e "${YELLOW}Warning: Symlink exists but points to different location: ${EXISTING_TARGET}${NC}"
        read -p "Replace it? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$TARGET_LINK"
        else
            echo "Aborted."
            exit 1
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
fi

ln -s "$OPENCODE_SOURCE" "$TARGET_LINK"

echo -e "${GREEN}✓ Symbolic link created successfully!${NC}"
echo ""
echo "  Source: ${OPENCODE_SOURCE}"
echo "  Link:   ${TARGET_LINK}"
echo ""
echo "You can now use .opencode configurations in ${TARGET_DIR}"
