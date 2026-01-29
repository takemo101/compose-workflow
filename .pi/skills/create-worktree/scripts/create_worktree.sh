#!/bin/bash
set -euo pipefail

# ============================================================================
# create_worktree.sh - Git Worktree 作成スクリプト
# 
# ホスト環境での開発時にブランチを分離するための worktree を作成します。
# 主にプラットフォーム固有コード（macOS API 等）の開発で使用します。
#
# Usage: bash .pi/skills/create-worktree/scripts/create_worktree.sh <feature-name>
# Example: bash .pi/skills/create-worktree/scripts/create_worktree.sh issue-42-auth
#
# 参照: https://github.com/shikajiro/claude-code-skill-example
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

usage() {
    echo "Usage: $0 <feature-name>"
    echo ""
    echo "Creates a git worktree for parallel feature development."
    echo ""
    echo "Arguments:"
    echo "  feature-name    Name of the feature (e.g., issue-42-auth, feature-dark-mode)"
    echo ""
    echo "Example:"
    echo "  $0 issue-42-auth"
    echo ""
    echo "This will create:"
    echo "  - Branch: feature/issue-42-auth"
    echo "  - Worktree: .worktrees/issue-42-auth/"
    exit 1
}

if [ $# -lt 1 ]; then
    log_error "Feature name is required"
    usage
fi

FEATURE_NAME="$1"
BRANCH_NAME="feature/${FEATURE_NAME}"
WORKTREE_DIR=".worktrees/${FEATURE_NAME}"

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

log_info "Creating worktree for feature: ${FEATURE_NAME}"
log_info "Branch: ${BRANCH_NAME}"
log_info "Worktree directory: ${WORKTREE_DIR}"

if [ ! -d ".git" ]; then
    log_error "Not a git repository"
    exit 1
fi

if [ -d "${WORKTREE_DIR}" ]; then
    log_error "Worktree already exists: ${WORKTREE_DIR}"
    log_info "To remove it, run: git worktree remove ${WORKTREE_DIR}"
    exit 1
fi

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    log_warn "Branch ${BRANCH_NAME} already exists"
    log_info "Creating worktree from existing branch..."
    git worktree add "${WORKTREE_DIR}" "${BRANCH_NAME}"
else
    log_step "Creating new branch and worktree..."
    DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
    git worktree add -b "${BRANCH_NAME}" "${WORKTREE_DIR}" "${DEFAULT_BRANCH}"
fi

log_info "Worktree created successfully"

log_step "Copying environment files..."

copy_if_exists() {
    local src="$1"
    local dest="$2"
    if [ -f "${src}" ]; then
        mkdir -p "$(dirname "${dest}")"
        cp "${src}" "${dest}"
        log_info "Copied: ${src}"
    fi
}

copy_if_exists ".env" "${WORKTREE_DIR}/.env"
copy_if_exists ".envrc" "${WORKTREE_DIR}/.envrc"
copy_if_exists ".env.local" "${WORKTREE_DIR}/.env.local"

log_info "Environment files copied"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Worktree created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Location: ${REPO_ROOT}/${WORKTREE_DIR}"
echo "Branch:   ${BRANCH_NAME}"
echo ""
echo "To start working:"
echo "  cd ${WORKTREE_DIR}"
echo ""
echo "To create PR and cleanup when done:"
echo "  bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh"
echo ""
echo "To remove worktree manually:"
echo "  git worktree remove ${WORKTREE_DIR}"
echo ""
