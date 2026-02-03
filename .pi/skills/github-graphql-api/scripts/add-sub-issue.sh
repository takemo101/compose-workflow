#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# add-sub-issue.sh - Sub-issue 登録スクリプト
#
# 親IssueにSub-issueを紐付けるGraphQL API処理。
# REST APIのSub-issue関連バグを回避するためGraphQL APIを使用。
#
# Usage: bash .pi/skills/github-graphql-api/scripts/add-sub-issue.sh <parent-issue> <child-issue>
# Example: bash .pi/skills/github-graphql-api/scripts/add-sub-issue.sh 10 42
#
# Reference: https://github.com/cli/cli/issues/10378
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

usage() {
    echo "Usage: $0 <parent-issue> <child-issue>"
    echo ""
    echo "Adds a sub-issue relationship between two GitHub issues using GraphQL API."
    echo ""
    echo "Arguments:"
    echo "  parent-issue    Parent issue number (e.g., 10)"
    echo "  child-issue     Child issue number to add as sub-issue (e.g., 42)"
    echo ""
    echo "Example:"
    echo "  $0 10 42    # Adds issue #42 as sub-issue of issue #10"
    echo ""
    echo "Note: This script uses GraphQL API to avoid REST API bugs with sub-issues."
    exit 1
}

if [ $# -lt 2 ]; then
    log_error "Both parent and child issue numbers are required"
    usage
fi

PARENT_ISSUE="$1"
CHILD_ISSUE="$2"

if ! [[ "$PARENT_ISSUE" =~ ^[0-9]+$ ]]; then
    log_error "Parent issue must be a number: $PARENT_ISSUE"
    exit 1
fi

if ! [[ "$CHILD_ISSUE" =~ ^[0-9]+$ ]]; then
    log_error "Child issue must be a number: $CHILD_ISSUE"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    log_error "gh CLI is not installed"
    log_info "Install from: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    log_error "gh CLI is not authenticated"
    log_info "Run: gh auth login"
    exit 1
fi

log_info "Adding issue #${CHILD_ISSUE} as sub-issue of issue #${PARENT_ISSUE}..."

# Step 1: Get GraphQL Node IDs
log_info "Fetching GraphQL Node IDs..."

PARENT_NODE_ID=$(gh issue view "$PARENT_ISSUE" --json id --jq '.id' 2>/dev/null) || {
    log_error "Failed to get parent issue #${PARENT_ISSUE}"
    log_info "Make sure the issue exists and you have access to the repository"
    exit 1
}

CHILD_NODE_ID=$(gh issue view "$CHILD_ISSUE" --json id --jq '.id' 2>/dev/null) || {
    log_error "Failed to get child issue #${CHILD_ISSUE}"
    log_info "Make sure the issue exists and you have access to the repository"
    exit 1
}

if [ -z "$PARENT_NODE_ID" ]; then
    log_error "Could not retrieve Node ID for parent issue #${PARENT_ISSUE}"
    exit 1
fi

if [ -z "$CHILD_NODE_ID" ]; then
    log_error "Could not retrieve Node ID for child issue #${CHILD_ISSUE}"
    exit 1
fi

log_info "Parent Node ID: ${PARENT_NODE_ID}"
log_info "Child Node ID: ${CHILD_NODE_ID}"

# Step 2: Add sub-issue relationship via GraphQL
log_info "Adding sub-issue relationship..."

RESULT=$(gh api graphql \
    -H "GraphQL-Features: sub_issues" \
    -f query="mutation {
        addSubIssue(input: {
            issueId: \"${PARENT_NODE_ID}\",
            subIssueId: \"${CHILD_NODE_ID}\"
        }) {
            issue { number title }
            subIssue { number title }
        }
    }" 2>&1) || {
    if echo "$RESULT" | grep -q "already a sub-issue"; then
        log_warn "Issue #${CHILD_ISSUE} is already a sub-issue of #${PARENT_ISSUE}"
        exit 0
    elif echo "$RESULT" | grep -q "INSUFFICIENT_SCOPES"; then
        log_error "Insufficient permissions. Make sure your token has 'repo' scope."
        exit 1
    elif echo "$RESULT" | grep -q "sub_issues.*not enabled"; then
        log_error "Sub-issues feature is not enabled for this repository"
        log_info "Sub-issues may require GitHub Projects or specific repository settings"
        exit 1
    else
        log_error "Failed to add sub-issue relationship"
        log_error "Response: $RESULT"
        exit 1
    fi
}

if echo "$RESULT" | grep -q '"number"'; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} Sub-issue added successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Parent: Issue #${PARENT_ISSUE}"
    echo "Child:  Issue #${CHILD_ISSUE} (sub-issue)"
    echo ""
    echo "View parent issue:"
    echo "  gh issue view ${PARENT_ISSUE}"
    echo ""
else
    log_warn "Unexpected response format"
    log_info "Response: $RESULT"
    log_info "Please verify the relationship manually"
fi
