#!/usr/bin/env bash
# sync-to-claude.sh - Sync .opencode/ directory to .claude/ for Claude Code compatibility
#
# Usage:
#   ./sync-to-claude.sh [--dry-run] [--verbose]
#
# This script:
# 1. Copies content from .opencode/ to .claude/
# 2. Converts skill references: {{skill:xxx}} -> @.claude/skills/xxx/SKILL.md
# 3. Converts agent frontmatter for Claude Code format
# 4. Maps directory names: agent -> agents, command -> commands, skill -> skills

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

OPENCODE_DIR="$PROJECT_ROOT/.opencode"
CLAUDE_DIR="$PROJECT_ROOT/.claude"

DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --verbose) VERBOSE=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

log() {
    if [[ "$VERBOSE" == true ]]; then
        echo "[INFO] $1"
    fi
}

get_claude_dir() {
    local opencode_dir="$1"
    case "$opencode_dir" in
        agent) echo "agents" ;;
        command) echo "commands" ;;
        skill) echo "skills" ;;
        instructions) echo "instructions" ;;
        *) echo "$opencode_dir" ;;
    esac
}

convert_skill_refs() {
    local content="$1"
    echo "$content" | sed -E 's/\{\{skill:([^}]+)\}\}/@.claude\/skills\/\1\/SKILL.md/g'
}

convert_paths() {
    local content="$1"
    echo "$content" | sed -E \
        -e 's|\.opencode/skill/|.claude/skills/|g' \
        -e 's|\.opencode/agent/|.claude/agents/|g' \
        -e 's|\.opencode/command/|.claude/commands/|g' \
        -e 's|\.opencode/instructions/|.claude/instructions/|g' \
        -e 's|\.opencode/templates/|.claude/templates/|g'
}

convert_agent_frontmatter() {
    local file="$1"
    local dest_file="$2"
    local content
    content=$(cat "$file")
    
    if [[ ! "$content" =~ ^---[[:space:]] ]]; then
        echo "$content"
        return
    fi
    
    local name description model tools_yaml
    name=$(basename "$file" .md)
    description=$(echo "$content" | grep -E '^description:' | head -1 | sed 's/^description:[[:space:]]*//' || echo "")
    model=$(echo "$content" | grep -E '^model:' | head -1 | sed 's/^model:[[:space:]]*//' || echo "")
    
    local tools_list=""
    if echo "$content" | grep -q '^\s*read:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Read"
    fi
    if echo "$content" | grep -q '^\s*glob:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Glob"
    fi
    if echo "$content" | grep -q '^\s*grep:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Grep"
    fi
    if echo "$content" | grep -q '^\s*write:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Write"
    fi
    if echo "$content" | grep -q '^\s*edit:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Edit"
    fi
    if echo "$content" | grep -q '^\s*bash:\s*true'; then
        tools_list="${tools_list:+$tools_list, }Bash"
    fi
    
    # Check existing .claude file for opus model
    local existing_model=""
    if [[ -f "$dest_file" ]]; then
        existing_model=$(grep -E '^model:' "$dest_file" | head -1 | sed 's/^model:[[:space:]]*//' || echo "")
    fi
    
    local claude_model="sonnet"
    # If .claude file already has opus, preserve it
    if [[ "$existing_model" == "opus" ]]; then
        claude_model="opus"
    else
        case "$model" in
            *opus*|*high*) claude_model="opus" ;;
            *sonnet*|*pro*) claude_model="sonnet" ;;
            *haiku*|*low*|*flash*) claude_model="haiku" ;;
        esac
    fi
    
    local body
    body=$(echo "$content" | awk '/^---$/{p++; next} p>=2{print}')
    
    cat << EOF
---
name: $name
description: $description
${tools_list:+tools: $tools_list}
model: $claude_model
---
$body
EOF
}

sync_file() {
    local src="$1"
    local dest="$2"
    local type="$3"
    
    log "Syncing: $src -> $dest"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "[DRY-RUN] Would sync: $src -> $dest"
        return
    fi
    
    mkdir -p "$(dirname "$dest")"
    
    local content
    
    case "$type" in
        agent)
            content=$(convert_agent_frontmatter "$src" "$dest")
            content=$(convert_skill_refs "$content")
            content=$(convert_paths "$content")
            ;;
        skill|command|instructions)
            content=$(cat "$src")
            content=$(convert_skill_refs "$content")
            content=$(convert_paths "$content")
            ;;
        *)
            content=$(cat "$src")
            ;;
    esac
    
    echo "$content" > "$dest"
}

main() {
    echo "=== OpenCode to Claude Code Sync ==="
    echo "Source: $OPENCODE_DIR"
    echo "Destination: $CLAUDE_DIR"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "Running in DRY-RUN mode (no changes will be made)"
        echo ""
    fi
    
    for opencode_dir in agent command skill instructions templates; do
        local claude_subdir
        claude_subdir=$(get_claude_dir "$opencode_dir")
        local src_dir="$OPENCODE_DIR/$opencode_dir"
        local dest_dir="$CLAUDE_DIR/$claude_subdir"
        
        if [[ ! -d "$src_dir" ]]; then
            log "Skipping (not found): $src_dir"
            continue
        fi
        
        echo "Processing: $opencode_dir -> $claude_subdir"
        
        local count=0
        while IFS= read -r -d '' file; do
            if [[ "$file" == *"/node_modules/"* ]]; then
                continue
            fi
            local rel_path="${file#$src_dir/}"
            local dest_file="$dest_dir/$rel_path"
            
            sync_file "$file" "$dest_file" "$opencode_dir"
            count=$((count + 1))
        done < <(find "$src_dir" -name "*.md" -type f -print0)
        
        if [[ "$opencode_dir" == "skill" ]]; then
            while IFS= read -r -d '' scripts_dir; do
                if [[ "$scripts_dir" == *"/node_modules/"* ]]; then
                    continue
                fi
                local rel_scripts="${scripts_dir#$src_dir/}"
                local dest_scripts="$dest_dir/$rel_scripts"
                
                if [[ "$DRY_RUN" != true ]]; then
                    mkdir -p "$dest_scripts"
                    cp -r "$scripts_dir"/* "$dest_scripts/" 2>/dev/null || true
                fi
                log "Copied scripts: $rel_scripts"
            done < <(find "$src_dir" -type d -name "scripts" -print0)
        fi
        
        echo "  Done: $count files"
    done
    
    echo ""
    echo "=== Sync Complete ==="
    
    if [[ "$DRY_RUN" == true ]]; then
        echo "(Dry run - no files were actually modified)"
    fi
}

main "$@"
