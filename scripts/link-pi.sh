#!/bin/bash
set -euo pipefail

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=false
USE_EXCLUDE=false

# ディレクトリパス設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# このリポジトリ内の .pi をソースとする
PI_SOURCE="${SOURCE_DIR}/.pi"

# gitignore に追加するエントリ
GITIGNORE_ENTRIES=(
    "# Pi Agent"
    ".pi"
)

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <target-directory>

Creates a symbolic link to .pi in the specified directory.
Creates or updates .gitignore (or .git/info/exclude) with .pi entry.

Options:
  --dry-run    Show what would be done without making changes
  --exclude    Use .git/info/exclude instead of .gitignore (local-only, not committed)

Examples:
  $0 ~/projects/my-app
  $0 --exclude ~/projects/my-app
EOF
    exit 1
}

log_dry_run() {
    echo -e "${BLUE}[DRY-RUN]${NC} $1"
}

execute() {
    local description="$1"
    local command="$2"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_dry_run "$description"
        return 0
    fi
    eval "$command"
}

update_ignore_file() {
    local target_file="$1"
    local file_type="$2"
    local header="$3"
    shift 3
    local entries=("$@")
    local entries_to_add=()
    
    if [[ -f "$target_file" ]]; then
        for entry in "${entries[@]}"; do
            [[ "$entry" == \#* ]] && continue
            if ! grep -qxF "$entry" "$target_file" 2>/dev/null; then
                entries_to_add+=("$entry")
            fi
        done
        
        if [[ ${#entries_to_add[@]} -eq 0 ]]; then
            echo -e "${YELLOW}⏭ ${file_type} already contains required entries.${NC}"
            return 0
        fi
        
        if [[ "$DRY_RUN" == true ]]; then
            log_dry_run "Would append to ${file_type}: ${entries_to_add[*]}"
            return 0
        fi
        
        # 最終行が空行でなければ改行を追加
        if [[ -s "$target_file" && -n "$(tail -c 1 "$target_file")" ]]; then
             echo "" >> "$target_file"
        fi

        echo "$header" >> "$target_file"
        for entry in "${entries_to_add[@]}"; do
            echo "$entry" >> "$target_file"
        done
        echo -e "${GREEN}✓ ${file_type} updated with ${#entries_to_add[@]} new entries.${NC}"
    else
        if [[ "$DRY_RUN" == true ]]; then
            log_dry_run "Would create ${file_type} with entries"
            return 0
        fi
        
        mkdir -p "$(dirname "$target_file")"
        # 最初の要素はヘッダーとして使われているのでスキップするロジックは呼び出し元にはないので、
        # ここでは単純にheaderとentriesを書き込む
        echo "$header" > "$target_file"
        for entry in "${entries[@]}"; do
            [[ "$entry" == \#* ]] && continue
            echo "$entry" >> "$target_file"
        done
        echo -e "${GREEN}✓ ${file_type} created.${NC}"
    fi
}

# オプション解析
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --exclude)
            USE_EXCLUDE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo -e "${RED}Error: Unknown option: $1${NC}"
            usage
            ;;
        *)
            break
            ;;
    esac
done

if [[ $# -lt 1 ]]; then
    echo -e "${RED}Error: Target directory is required.${NC}"
    usage
fi

TARGET_DIR="$1"

if [[ ! -d "$TARGET_DIR" ]]; then
    echo -e "${RED}Error: Target directory does not exist: ${TARGET_DIR}${NC}"
    exit 1
fi

if [[ ! -d "$PI_SOURCE" ]]; then
    echo -e "${RED}Error: Source .pi directory not found: ${PI_SOURCE}${NC}"
    exit 1
fi

[[ "$DRY_RUN" == true ]] && echo -e "${BLUE}=== DRY RUN MODE ===${NC}\n"

TARGET_LINK="${TARGET_DIR}/.pi"

# シンボリックリンク作成
if [[ -L "$TARGET_LINK" ]]; then
    EXISTING_TARGET="$(readlink "$TARGET_LINK")"
    if [[ "$EXISTING_TARGET" == "$PI_SOURCE" ]]; then
        echo -e "${YELLOW}Symlink already exists and points to the correct location.${NC}"
    else
        echo -e "${YELLOW}Warning: Symlink exists but points to different location: ${EXISTING_TARGET}${NC}"
        read -p "Replace it? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            execute "Replace symlink" "rm '$TARGET_LINK' && ln -s '$PI_SOURCE' '$TARGET_LINK'"
            [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ Symbolic link replaced.${NC}"
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
    execute "Create symlink" "ln -s '$PI_SOURCE' '$TARGET_LINK'"
    [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ Symbolic link created successfully!${NC}"
fi

echo ""
echo "  Source: ${PI_SOURCE}"
echo "  Link:   ${TARGET_LINK}"

# .gitignore 更新
GIT_DIR="${TARGET_DIR}/.git"

echo ""
if [[ "$USE_EXCLUDE" == true ]]; then
    if [[ ! -d "$GIT_DIR" ]]; then
        echo -e "${RED}Error: Not a git repository: ${TARGET_DIR}${NC}"
        echo "Cannot use --exclude without .git directory."
        exit 1
    fi
    update_ignore_file "${GIT_DIR}/info/exclude" ".git/info/exclude" "# Pi Agent" "${GITIGNORE_ENTRIES[@]}"
else
    update_ignore_file "${TARGET_DIR}/.gitignore" ".gitignore" "# Pi Agent" "${GITIGNORE_ENTRIES[@]}"
fi

echo ""
if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}=== DRY RUN COMPLETE ===${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo -e "${GREEN}Success! You can now use pi agent in ${TARGET_DIR}${NC}"
fi
