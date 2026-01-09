#!/bin/bash
set -euo pipefail

# ============================================================================
# pr-merge-full.sh - PRマージ完全フロースクリプト
#
# CI待機 → マージ → environments.json更新 → 環境削除の完全フローを実行。
#
# Usage: bash .opencode/skill/pr-merge-workflow/scripts/pr-merge-full.sh <pr-number> [env-id]
# Example: bash .opencode/skill/pr-merge-workflow/scripts/pr-merge-full.sh 42 abc-123-def
#
# Exit codes:
#   0 - PR merged and cleanup completed
#   1 - CI checks failed
#   2 - Merge failed
#   3 - Invalid arguments or prerequisites not met
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENV_JSON_SCRIPT="${SCRIPT_DIR}/../../environments-json-management/scripts/env-json.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

usage() {
    echo "Usage: $0 <pr-number> [env-id]"
    echo ""
    echo "Complete PR merge workflow: CI wait → Merge → Cleanup"
    echo ""
    echo "Arguments:"
    echo "  pr-number    PR number to merge (e.g., 42)"
    echo "  env-id       Optional: container-use environment ID for cleanup"
    echo ""
    echo "Exit codes:"
    echo "  0 - PR merged and cleanup completed"
    echo "  1 - CI checks failed"
    echo "  2 - Merge failed"
    echo "  3 - Invalid arguments or prerequisites not met"
    echo ""
    echo "Example:"
    echo "  $0 42                    # Merge PR without env cleanup"
    echo "  $0 42 abc-123-def        # Merge PR and delete environment"
    exit 3
}

if [ $# -lt 1 ]; then
    log_error "PR number is required"
    usage
fi

PR_NUMBER="$1"
ENV_ID="${2:-}"

if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
    log_error "PR number must be a number: $PR_NUMBER"
    exit 3
fi

if ! command -v gh &> /dev/null; then
    log_error "gh CLI is not installed"
    exit 3
fi

if ! gh auth status &> /dev/null; then
    log_error "gh CLI is not authenticated"
    exit 3
fi

PR_STATE=$(gh pr view "$PR_NUMBER" --json state --jq '.state' 2>/dev/null) || {
    log_error "PR #${PR_NUMBER} not found"
    exit 3
}

if [ "$PR_STATE" = "MERGED" ]; then
    log_warn "PR #${PR_NUMBER} is already merged"
    exit 0
fi

if [ "$PR_STATE" = "CLOSED" ]; then
    log_error "PR #${PR_NUMBER} is closed (not merged)"
    exit 3
fi

log_step "Phase 1: Waiting for CI checks..."

CI_WAIT_SCRIPT="${SCRIPT_DIR}/../../ci-workflow/scripts/ci-wait.sh"
if [ -f "$CI_WAIT_SCRIPT" ]; then
    if ! bash "$CI_WAIT_SCRIPT" "$PR_NUMBER" 600; then
        CI_EXIT=$?
        if [ $CI_EXIT -eq 1 ]; then
            log_error "CI checks failed. Fix the issues and re-run."
            exit 1
        elif [ $CI_EXIT -eq 2 ]; then
            log_error "CI timeout. You can continue manually:"
            log_info "  gh pr checks $PR_NUMBER --watch"
            log_info "  gh pr merge $PR_NUMBER --merge --delete-branch"
            exit 1
        fi
    fi
else
    log_warn "ci-wait.sh not found, using gh pr checks --watch"
    if ! gh pr checks "$PR_NUMBER" --watch; then
        log_error "CI checks failed"
        exit 1
    fi
fi

log_step "Phase 2: Merging PR..."

if gh pr merge "$PR_NUMBER" --merge --delete-branch; then
    log_info "PR #${PR_NUMBER} merged successfully"
else
    if gh pr merge "$PR_NUMBER" --merge 2>&1 | grep -q "worktree"; then
        log_warn "Worktree conflict detected, merging without --delete-branch"
        if gh pr merge "$PR_NUMBER" --merge; then
            log_info "PR merged. Delete remote branch manually:"
            BRANCH=$(gh pr view "$PR_NUMBER" --json headRefName --jq '.headRefName')
            log_info "  git push origin --delete $BRANCH"
        else
            log_error "Merge failed"
            exit 2
        fi
    else
        log_error "Merge failed"
        exit 2
    fi
fi

log_step "Phase 3: Updating environments.json..."

update_environments_json() {
    if [ ! -f "$ENV_JSON_SCRIPT" ]; then
        log_warn "env-json.sh not found, skipping environments.json update"
        return
    fi

    if [ -n "$ENV_ID" ]; then
        bash "$ENV_JSON_SCRIPT" mark-merged "$ENV_ID"
        log_info "Updated status to 'merged' for env_id: $ENV_ID"
    else
        log_warn "No env-id provided, cannot update environments.json by PR number"
    fi
}

update_environments_json

log_step "Phase 4: Cleaning up environment..."

if [ -n "$ENV_ID" ]; then
    if command -v container-use &> /dev/null; then
        if container-use delete "$ENV_ID" 2>/dev/null; then
            log_info "Environment deleted: $ENV_ID"
            
            if [ -f "$ENV_JSON_SCRIPT" ]; then
                bash "$ENV_JSON_SCRIPT" remove "$ENV_ID"
                log_info "Removed entry from environments.json"
            fi
        else
            log_warn "Failed to delete environment: $ENV_ID"
            log_info "Delete manually: container-use delete $ENV_ID"
        fi
    else
        log_warn "container-use not installed, skipping environment deletion"
        log_info "Delete manually: container-use delete $ENV_ID"
    fi
else
    log_info "No env-id provided, skipping environment cleanup"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} PR Merge Workflow Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "PR #${PR_NUMBER} has been merged"
if [ -n "$ENV_ID" ]; then
    echo "Environment $ENV_ID has been cleaned up"
fi
echo ""
