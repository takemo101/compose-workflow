#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=false
USE_EXCLUDE=false

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OPENCODE_SOURCE="${SOURCE_DIR}/.opencode"

GITIGNORE_ENTRIES=(
    "# OpenCode workflow"
    "node_modules/"
    "bun.lockb"
)

EXCLUDE_ENTRIES=(
    "# OpenCode symlink (local-only)"
    ".opencode"
)

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <target-directory>

Creates a symbolic link to .opencode in the specified directory.
Also copies opencode.json and package.json (if not already present).
Creates or updates .gitignore (or .git/info/exclude) with OpenCode-related entries.

Options:
  --dry-run    Show what would be done without making changes
  --exclude    Use .git/info/exclude instead of .gitignore (local-only, not committed)

Examples:
  $0 ~/projects/my-app
  $0 --exclude ~/projects/my-app
  $0 --dry-run --exclude /Users/user/work/another-project
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
            echo -e "${YELLOW}⏭ ${file_type} already contains all required entries.${NC}"
            return 0
        fi
        
        if [[ "$DRY_RUN" == true ]]; then
            log_dry_run "Would append to ${file_type}: ${entries_to_add[*]}"
            return 0
        fi
        
        echo "" >> "$target_file"
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
        printf '%s\n' "${entries[@]}" > "$target_file"
        echo -e "${GREEN}✓ ${file_type} created.${NC}"
    fi
}

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

if [[ ! -d "$OPENCODE_SOURCE" ]]; then
    echo -e "${RED}Error: Source .opencode directory not found: ${OPENCODE_SOURCE}${NC}"
    exit 1
fi

[[ "$DRY_RUN" == true ]] && echo -e "${BLUE}=== DRY RUN MODE ===${NC}\n"

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
            execute "Replace symlink" "rm '$TARGET_LINK' && ln -s '$OPENCODE_SOURCE' '$TARGET_LINK'"
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
    execute "Create symlink" "ln -s '$OPENCODE_SOURCE' '$TARGET_LINK'"
    [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ Symbolic link created successfully!${NC}"
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
        execute "Copy opencode.json" "cp '$SOURCE_OPENCODE_JSON' '$TARGET_OPENCODE_JSON'"
        [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ opencode.json copied.${NC}"
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
        execute "Copy package.json" "cp '$SOURCE_PACKAGE_JSON' '$TARGET_PACKAGE_JSON'"
        [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ package.json copied.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Source package.json not found, skipping.${NC}"
fi

GIT_DIR="${TARGET_DIR}/.git"
if [[ -d "$GIT_DIR" ]]; then
    echo ""
    update_ignore_file "${GIT_DIR}/info/exclude" ".git/info/exclude" "# OpenCode symlink (local-only)" "${EXCLUDE_ENTRIES[@]}"
fi

echo ""
if [[ "$USE_EXCLUDE" == true ]]; then
    if [[ ! -d "$GIT_DIR" ]]; then
        echo -e "${RED}Error: Not a git repository: ${TARGET_DIR}${NC}"
        echo "Cannot use --exclude without .git directory."
        exit 1
    fi
    update_ignore_file "${GIT_DIR}/info/exclude" ".git/info/exclude" "# OpenCode workflow" "${GITIGNORE_ENTRIES[@]}"
else
    update_ignore_file "${TARGET_DIR}/.gitignore" ".gitignore" "# OpenCode workflow" "${GITIGNORE_ENTRIES[@]}"
fi

if [[ "$DRY_RUN" == false ]]; then
    echo ""
    echo "Running bun install in ${TARGET_DIR}..."
    (cd "$TARGET_DIR" && bun install)
    echo -e "${GREEN}✓ bun install completed.${NC}"
else
    log_dry_run "Would run: bun install in ${TARGET_DIR}"
fi

echo ""
if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}=== DRY RUN COMPLETE ===${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo "You can now use .opencode configurations in ${TARGET_DIR}"
fi
