#!/bin/bash
set -euo pipefail

# ============================================================================
# env-json.sh - environments.json 管理スクリプト
#
# container-use環境の状態管理（SSOT）のためのCRUD操作を提供。
#
# Usage: bash .opencode/skill/environments-json-management/scripts/env-json.sh <command> [args...]
#
# Commands:
#   add <env-id> <issue-number> <branch> [title]  - 新規環境を登録
#   update-pr <env-id> <pr-number>                - PR番号を記録
#   mark-merged <env-id>                          - ステータスを merged に更新
#   remove <env-id>                               - エントリを削除
#   find-by-issue <issue-number>                  - Issue番号で環境を検索
#   list                                          - 全環境を一覧表示
#
# Example: bash .opencode/skill/environments-json-management/scripts/env-json.sh add abc-123 42 feature/auth
# ============================================================================

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENVIRONMENTS_JSON="${REPO_ROOT}/.opencode/environments.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

usage() {
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Manage environments.json for container-use environment tracking."
    echo ""
    echo "Commands:"
    echo "  add <env-id> <issue-number> <branch> [title]"
    echo "      Register a new environment"
    echo ""
    echo "  update-pr <env-id> <pr-number>"
    echo "      Record PR number and set status to 'pr_created'"
    echo ""
    echo "  mark-merged <env-id>"
    echo "      Update status to 'merged'"
    echo ""
    echo "  remove <env-id>"
    echo "      Remove environment entry"
    echo ""
    echo "  find-by-issue <issue-number>"
    echo "      Find environment by issue number (returns env-id or empty)"
    echo ""
    echo "  list"
    echo "      List all environments"
    echo ""
    echo "Examples:"
    echo "  $0 add abc-123 42 feature/auth \"User authentication\""
    echo "  $0 update-pr abc-123 45"
    echo "  $0 mark-merged abc-123"
    echo "  $0 remove abc-123"
    echo "  $0 find-by-issue 42"
    echo "  $0 list"
    exit 1
}

ensure_file_exists() {
    if [ ! -f "$ENVIRONMENTS_JSON" ]; then
        mkdir -p "$(dirname "$ENVIRONMENTS_JSON")"
        echo '{"environments": []}' > "$ENVIRONMENTS_JSON"
        log_info "Created $ENVIRONMENTS_JSON"
    fi
}

if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
fi

if [ $# -lt 1 ]; then
    usage
fi

COMMAND="$1"
shift

case "$COMMAND" in
    add)
        if [ $# -lt 3 ]; then
            log_error "add requires: <env-id> <issue-number> <branch> [title]"
            exit 1
        fi
        ENV_ID="$1"
        ISSUE_NUMBER="$2"
        BRANCH="$3"
        TITLE="${4:-}"
        
        ensure_file_exists
        
        EXISTING=$(jq --arg env_id "$ENV_ID" '.environments[] | select(.env_id == $env_id)' "$ENVIRONMENTS_JSON")
        if [ -n "$EXISTING" ]; then
            log_warn "Environment $ENV_ID already exists"
            exit 0
        fi
        
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        UPDATED=$(jq --arg env_id "$ENV_ID" \
                     --argjson issue_number "$ISSUE_NUMBER" \
                     --arg branch "$BRANCH" \
                     --arg title "$TITLE" \
                     --arg timestamp "$TIMESTAMP" '
            .environments += [{
                "env_id": $env_id,
                "issue_number": $issue_number,
                "branch": $branch,
                "title": $title,
                "status": "active",
                "pr_number": null,
                "created_at": $timestamp,
                "last_used_at": $timestamp
            }]
        ' "$ENVIRONMENTS_JSON")
        echo "$UPDATED" > "$ENVIRONMENTS_JSON"
        log_info "Added environment: $ENV_ID (Issue #$ISSUE_NUMBER)"
        ;;
        
    update-pr)
        if [ $# -lt 2 ]; then
            log_error "update-pr requires: <env-id> <pr-number>"
            exit 1
        fi
        ENV_ID="$1"
        PR_NUMBER="$2"
        
        ensure_file_exists
        
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        UPDATED=$(jq --arg env_id "$ENV_ID" \
                     --argjson pr_number "$PR_NUMBER" \
                     --arg timestamp "$TIMESTAMP" '
            .environments = [.environments[] | 
                if .env_id == $env_id then 
                    .pr_number = $pr_number | .status = "pr_created" | .last_used_at = $timestamp 
                else . end
            ]
        ' "$ENVIRONMENTS_JSON")
        echo "$UPDATED" > "$ENVIRONMENTS_JSON"
        log_info "Updated PR number for $ENV_ID: PR #$PR_NUMBER"
        ;;
        
    mark-merged)
        if [ $# -lt 1 ]; then
            log_error "mark-merged requires: <env-id>"
            exit 1
        fi
        ENV_ID="$1"
        
        ensure_file_exists
        
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        UPDATED=$(jq --arg env_id "$ENV_ID" --arg timestamp "$TIMESTAMP" '
            .environments = [.environments[] | 
                if .env_id == $env_id then 
                    .status = "merged" | .merged_at = $timestamp | .last_used_at = $timestamp 
                else . end
            ]
        ' "$ENVIRONMENTS_JSON")
        echo "$UPDATED" > "$ENVIRONMENTS_JSON"
        log_info "Marked as merged: $ENV_ID"
        ;;
        
    remove)
        if [ $# -lt 1 ]; then
            log_error "remove requires: <env-id>"
            exit 1
        fi
        ENV_ID="$1"
        
        ensure_file_exists
        
        UPDATED=$(jq --arg env_id "$ENV_ID" '
            .environments = [.environments[] | select(.env_id != $env_id)]
        ' "$ENVIRONMENTS_JSON")
        echo "$UPDATED" > "$ENVIRONMENTS_JSON"
        log_info "Removed environment: $ENV_ID"
        ;;
        
    find-by-issue)
        if [ $# -lt 1 ]; then
            log_error "find-by-issue requires: <issue-number>"
            exit 1
        fi
        ISSUE_NUMBER="$1"
        
        if [ ! -f "$ENVIRONMENTS_JSON" ]; then
            exit 0
        fi
        
        RESULT=$(jq -r --argjson issue_number "$ISSUE_NUMBER" '
            .environments[] | 
            select(.issue_number == $issue_number and (.status == "active" or .status == "pr_created")) |
            .env_id
        ' "$ENVIRONMENTS_JSON" | head -1)
        
        if [ -n "$RESULT" ]; then
            echo "$RESULT"
        fi
        ;;
        
    list)
        if [ ! -f "$ENVIRONMENTS_JSON" ]; then
            log_warn "No environments.json found"
            exit 0
        fi
        
        echo ""
        echo "Environments:"
        echo "============="
        jq -r '.environments[] | "[\(.status)] \(.env_id) - Issue #\(.issue_number // "N/A") PR #\(.pr_number // "N/A") (\(.branch))"' "$ENVIRONMENTS_JSON"
        echo ""
        TOTAL=$(jq '.environments | length' "$ENVIRONMENTS_JSON")
        echo "Total: $TOTAL environment(s)"
        ;;
        
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac
