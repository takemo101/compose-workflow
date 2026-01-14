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
CLAUDE_SOURCE="${SOURCE_DIR}/.claude"
TEMPLATES_DIR="${SOURCE_DIR}/templates"

GITIGNORE_ENTRIES=(
    "# Claude Code workflow"
    "node_modules/"
    "bun.lockb"
    ".serena/"
    "environments.json"
    "environments.json.lock"
    ".claude/settings.local.json"
)

EXCLUDE_ENTRIES=(
    "# Claude Code symlink (local-only)"
    ".claude"
)

usage() {
    cat <<EOF
Usage: $0 [OPTIONS] <target-directory>

Creates a symbolic link to .claude in the specified directory.
.mcp.json is included in the .claude symlink or copied from template.
CLAUDE.md is included in the .claude symlink.
Creates docs/memos directory with .gitkeep for project documentation.
Creates or updates .gitignore (or .git/info/exclude) with Claude Code-related entries.

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

if [[ ! -d "$CLAUDE_SOURCE" ]]; then
    echo -e "${RED}Error: Source .claude directory not found: ${CLAUDE_SOURCE}${NC}"
    exit 1
fi

[[ "$DRY_RUN" == true ]] && echo -e "${BLUE}=== DRY RUN MODE ===${NC}\n"

# --- Create .claude symlink ---
TARGET_LINK="${TARGET_DIR}/.claude"

if [[ -L "$TARGET_LINK" ]]; then
    EXISTING_TARGET="$(readlink "$TARGET_LINK")"
    if [[ "$EXISTING_TARGET" == "$CLAUDE_SOURCE" ]]; then
        echo -e "${YELLOW}Symlink already exists and points to the correct location.${NC}"
    else
        echo -e "${YELLOW}Warning: Symlink exists but points to different location: ${EXISTING_TARGET}${NC}"
        read -p "Replace it? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            execute "Replace symlink" "rm '$TARGET_LINK' && ln -s '$CLAUDE_SOURCE' '$TARGET_LINK'"
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
    execute "Create symlink" "ln -s '$CLAUDE_SOURCE' '$TARGET_LINK'"
    [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ Symbolic link created successfully!${NC}"
fi

echo ""
echo "  Source: ${CLAUDE_SOURCE}"
echo "  Link:   ${TARGET_LINK}"

# --- Copy .mcp.json ---
TARGET_MCP_JSON="${TARGET_DIR}/.claude/.mcp.json"
SOURCE_MCP_JSON="${TEMPLATES_DIR}/mcp.template.json"

echo ""
if [[ -f "$SOURCE_MCP_JSON" ]]; then
    if [[ -e "$TARGET_MCP_JSON" ]]; then
        echo -e "${YELLOW}⏭ .claude/.mcp.json already exists, skipping.${NC}"
    else
        execute "Copy .mcp.json from template" "cp '$SOURCE_MCP_JSON' '$TARGET_MCP_JSON'"
        [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ .claude/.mcp.json copied from template.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Template mcp.template.json not found, skipping.${NC}"
fi



# --- Copy package.json (for MCP dependencies) ---
TARGET_PACKAGE_JSON="${TARGET_DIR}/package.json"
SOURCE_PACKAGE_JSON="${TEMPLATES_DIR}/package.template.json"

if [[ -f "$SOURCE_PACKAGE_JSON" ]]; then
    if [[ -e "$TARGET_PACKAGE_JSON" ]]; then
        echo -e "${YELLOW}⏭ package.json already exists, skipping.${NC}"
    else
        execute "Copy package.json from template" "cp '$SOURCE_PACKAGE_JSON' '$TARGET_PACKAGE_JSON'"
        [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ package.json copied from template.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Template package.template.json not found, skipping.${NC}"
fi

# --- Create docs/memos directory ---
MEMOS_DIR="${TARGET_DIR}/docs/memos"
if [[ -d "$MEMOS_DIR" ]]; then
    echo -e "${YELLOW}⏭ docs/memos already exists, skipping.${NC}"
else
    execute "Create docs/memos with .gitkeep" "mkdir -p '$MEMOS_DIR' && touch '$MEMOS_DIR/.gitkeep'"
    [[ "$DRY_RUN" == false ]] && echo -e "${GREEN}✓ docs/memos created with .gitkeep.${NC}"
fi

# --- Update .git/info/exclude for symlink ---
GIT_DIR="${TARGET_DIR}/.git"
if [[ -d "$GIT_DIR" ]]; then
    echo ""
    update_ignore_file "${GIT_DIR}/info/exclude" ".git/info/exclude" "# Claude Code symlink (local-only)" "${EXCLUDE_ENTRIES[@]}"
fi

# --- Update .gitignore or .git/info/exclude ---
echo ""
if [[ "$USE_EXCLUDE" == true ]]; then
    if [[ ! -d "$GIT_DIR" ]]; then
        echo -e "${RED}Error: Not a git repository: ${TARGET_DIR}${NC}"
        echo "Cannot use --exclude without .git directory."
        exit 1
    fi
    update_ignore_file "${GIT_DIR}/info/exclude" ".git/info/exclude" "# Claude Code workflow" "${GITIGNORE_ENTRIES[@]}"
else
    update_ignore_file "${TARGET_DIR}/.gitignore" ".gitignore" "# Claude Code workflow" "${GITIGNORE_ENTRIES[@]}"
fi

# --- Run package manager install ---
if [[ "$DRY_RUN" == false ]]; then
    echo ""
    if command -v bun &> /dev/null; then
        echo "Running bun install in ${TARGET_DIR}..."
        (cd "$TARGET_DIR" && bun install)
        echo -e "${GREEN}✓ bun install completed.${NC}"
    elif command -v npm &> /dev/null; then
        echo "Running npm install in ${TARGET_DIR}..."
        (cd "$TARGET_DIR" && npm install)
        echo -e "${GREEN}✓ npm install completed.${NC}"
    else
        echo -e "${YELLOW}⚠ Neither bun nor npm found, skipping package install.${NC}"
    fi
else
    log_dry_run "Would run: bun/npm install in ${TARGET_DIR}"
fi

# --- Final summary ---
echo ""
if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}=== DRY RUN COMPLETE ===${NC}"
    echo "Run without --dry-run to apply changes."
else
    echo -e "${GREEN}=== Setup Complete ===${NC}"
    echo ""
    echo "Claude Code configurations are now available in ${TARGET_DIR}"
    echo ""
    echo "Created/Linked:"
    echo "  • .claude/          → Symlink to shared agents, commands, skills, CLAUDE.md, .mcp.json"
    echo "  • docs/memos/       → Project documentation directory"
    echo ""
    echo "Next steps:"
    echo "  1. Adjust .claude/.mcp.json if you need different MCP servers"
    echo "  2. Run 'claude' to start Claude Code"
fi
