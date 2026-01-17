#!/bin/bash
set -euo pipefail

# ============================================================================
# issue-state.sh - GitHub Issue ベースの環境状態管理スクリプト
#
# container-use/worktree/ホスト環境すべてからアクセス可能な状態管理。
# GitHub Issue のラベルとメタデータを使用。
#
# Usage: bash .opencode/skill/github-issue-state-management/scripts/issue-state.sh <command> [args...]
#
# Commands:
#   register <issue-num> <env-id> <branch> <env-type>  - 環境を登録
#   phase <issue-num> <phase>                          - Phase を更新
#   block <issue-num> <reason> <description>           - Blocked 状態に設定
#   unblock <issue-num>                                - Blocked を解除
#   pr-created <issue-num> <pr-number>                 - PR作成済みに更新（PR番号を記録）
#   merged <issue-num>                                 - マージ完了に更新
#   get <issue-num>                                    - 状態を取得
#   list                                               - アクティブな環境一覧
#   resume <issue-num>                                 - 復旧情報を取得（途中再開用）
#   ci-status <pr-number>                              - CI状態を取得（JSON形式）
#   init-labels                                        - ラベルを一括作成
#
# Example: bash issue-state.sh register 42 abc-123 feature/auth container-use
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# リトライ設定
MAX_RETRIES=${MAX_RETRIES:-3}
RETRY_DELAY=${RETRY_DELAY:-5}

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# リトライ付きでコマンドを実行
# Usage: retry_cmd <command...>
# Returns: コマンドの終了コード（成功時は0）
retry_cmd() {
    local attempt=1
    local output
    local exit_code
    
    while [ $attempt -le $MAX_RETRIES ]; do
        output=$("$@" 2>&1)
        exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            echo "$output"
            return 0
        fi
        
        # レート制限エラーの検出
        if echo "$output" | grep -qiE "rate.?limit|too many requests|403"; then
            log_warn "Rate limited. Waiting 60 seconds before retry (attempt $attempt/$MAX_RETRIES)..."
            sleep 60
        # ネットワークエラーの検出
        elif echo "$output" | grep -qiE "network|connection|timeout|could not resolve"; then
            log_warn "Network error. Waiting ${RETRY_DELAY} seconds before retry (attempt $attempt/$MAX_RETRIES)..."
            sleep $RETRY_DELAY
        # その他のエラー
        else
            log_warn "Command failed (attempt $attempt/$MAX_RETRIES): $output"
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Command failed after $MAX_RETRIES attempts: $*"
    echo "$output"
    return $exit_code
}

# gh コマンドのラッパー（リトライ付き）
gh_retry() {
    retry_cmd gh "$@"
}

# gh CLI が存在するか確認
if ! command -v gh &> /dev/null; then
    log_error "gh CLI is required but not installed. Install with: brew install gh"
    exit 1
fi

# 認証確認
if ! gh auth status &> /dev/null; then
    log_error "gh CLI is not authenticated. Run: gh auth login"
    exit 1
fi

usage() {
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Manage environment state via GitHub Issue labels and metadata."
    echo ""
    echo "Commands:"
    echo "  register <issue-num> <env-id> <branch> <env-type>"
    echo "      Register environment (env-type: container-use|worktree|host)"
    echo ""
    echo "  phase <issue-num> <phase>"
    echo "      Update phase (e.g., 4-red, 5-green, 7-review)"
    echo ""
    echo "  block <issue-num> <reason> <description>"
    echo "      Set blocked status with reason"
    echo ""
    echo "  unblock <issue-num>"
    echo "      Clear blocked status"
    echo ""
    echo "  pr-created <issue-num> <pr-number>"
    echo "      Mark as PR created and record PR number"
    echo ""
    echo "  merged <issue-num>"
    echo "      Mark as merged"
    echo ""
    echo "  get <issue-num>"
    echo "      Get current state"
    echo ""
    echo "  list"
    echo "      List all active environments"
    echo ""
    echo "  resume <issue-num>"
    echo "      Get resume info (env_id, phase, next action)"
    echo ""
    echo "  ci-status <pr-number>"
    echo "      Get CI status for a PR (JSON format with failed job details)"
    echo ""
    echo "  init-labels"
    echo "      Create all required labels in the repository"
    echo ""
    echo "Examples:"
    echo "  $0 register 42 abc-123 feature/auth container-use"
    echo "  $0 phase 42 5-green"
    echo "  $0 block 42 design_ambiguity \"設計書に矛盾があります\""
    echo "  $0 unblock 42"
    echo "  $0 get 42"
    echo "  $0 list"
    echo "  $0 ci-status 123"
    exit 1
}

get_env_label() {
    local issue_num="$1"
    gh_retry issue view "$issue_num" --json labels -q '.labels[].name' 2>/dev/null | grep -E '^env:' | head -1 || echo ""
}

get_phase_label() {
    local issue_num="$1"
    gh_retry issue view "$issue_num" --json labels -q '.labels[].name' 2>/dev/null | grep -E '^phase:' | head -1 || echo ""
}

remove_label_if_exists() {
    local issue_num="$1"
    local label="$2"
    if [ -n "$label" ]; then
        gh_retry issue edit "$issue_num" --remove-label "$label" 2>/dev/null || true
    fi
}

# タイムスタンプ生成
timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

if [ $# -lt 1 ]; then
    usage
fi

COMMAND="$1"
shift

case "$COMMAND" in
    register)
        if [ $# -lt 4 ]; then
            log_error "register requires: <issue-num> <env-id> <branch> <env-type>"
            exit 1
        fi
        ISSUE_NUM="$1"
        ENV_ID="$2"
        BRANCH="$3"
        ENV_TYPE="$4"
        
        # 既存のenv:*ラベルを削除
        OLD_ENV=$(get_env_label "$ISSUE_NUM")
        remove_label_if_exists "$ISSUE_NUM" "$OLD_ENV"
        
        gh_retry issue edit "$ISSUE_NUM" --add-label "env:active,phase:1-env"
        
        CURRENT_BODY=$(gh_retry issue view "$ISSUE_NUM" --json body -q '.body')
        
        # 既存のメタデータを削除
        CLEAN_BODY=$(echo "$CURRENT_BODY" | sed '/<!-- ENV_METADATA/,/-->/d')
        
        # 新しいメタデータを追加
        TIMESTAMP=$(timestamp)
        NEW_BODY="${CLEAN_BODY}

<!-- ENV_METADATA
env_id: ${ENV_ID}
branch: ${BRANCH}
env_type: ${ENV_TYPE}
worktree_path: 
created_at: ${TIMESTAMP}
last_updated_at: ${TIMESTAMP}
-->"
        
        gh_retry issue edit "$ISSUE_NUM" --body "$NEW_BODY"
        
        log_info "Registered environment for Issue #${ISSUE_NUM}: env_id=${ENV_ID}, branch=${BRANCH}"
        ;;
        
    phase)
        if [ $# -lt 2 ]; then
            log_error "phase requires: <issue-num> <phase>"
            exit 1
        fi
        ISSUE_NUM="$1"
        NEW_PHASE="$2"
        
        # 既存のphase:*ラベルを削除
        OLD_PHASE=$(get_phase_label "$ISSUE_NUM")
        remove_label_if_exists "$ISSUE_NUM" "$OLD_PHASE"
        
        gh_retry issue edit "$ISSUE_NUM" --add-label "phase:${NEW_PHASE}"
        
        log_info "Updated Issue #${ISSUE_NUM} to phase:${NEW_PHASE}"
        ;;
        
    block)
        if [ $# -lt 3 ]; then
            log_error "block requires: <issue-num> <reason> <description>"
            exit 1
        fi
        ISSUE_NUM="$1"
        REASON="$2"
        DESCRIPTION="$3"
        
        remove_label_if_exists "$ISSUE_NUM" "env:active"
        gh_retry issue edit "$ISSUE_NUM" --add-label "env:blocked"
        
        # Blocked コメントを追加
        TIMESTAMP=$(timestamp)
        COMMENT="## Blocked: ${REASON}

**Description**: ${DESCRIPTION}

**Blocked at**: ${TIMESTAMP}

---
> このコメントは \`env:blocked\` ラベルと連動しています。
> 問題解決後、ラベルを \`env:active\` に変更し、このコメントに「Resolved」と返信してください。"
        
        gh_retry issue comment "$ISSUE_NUM" --body "$COMMENT"
        
        log_warn "Issue #${ISSUE_NUM} is now BLOCKED: ${REASON}"
        ;;
        
    unblock)
        if [ $# -lt 1 ]; then
            log_error "unblock requires: <issue-num>"
            exit 1
        fi
        ISSUE_NUM="$1"
        
        remove_label_if_exists "$ISSUE_NUM" "env:blocked"
        gh_retry issue edit "$ISSUE_NUM" --add-label "env:active"
        
        log_info "Issue #${ISSUE_NUM} is now ACTIVE (unblocked)"
        ;;
        
    pr-created)
        if [ $# -lt 2 ]; then
            log_error "pr-created requires: <issue-num> <pr-number>"
            exit 1
        fi
        ISSUE_NUM="$1"
        PR_NUMBER="$2"
        
        # ラベル更新
        OLD_ENV=$(get_env_label "$ISSUE_NUM")
        OLD_PHASE=$(get_phase_label "$ISSUE_NUM")
        remove_label_if_exists "$ISSUE_NUM" "$OLD_ENV"
        remove_label_if_exists "$ISSUE_NUM" "$OLD_PHASE"
        
        gh_retry issue edit "$ISSUE_NUM" --add-label "env:pr-created,phase:10-pr"
        
        CURRENT_BODY=$(gh_retry issue view "$ISSUE_NUM" --json body -q '.body')
        TIMESTAMP=$(timestamp)
        
        if echo "$CURRENT_BODY" | grep -q "<!-- ENV_METADATA"; then
            # 既存のメタデータを更新
            NEW_BODY=$(echo "$CURRENT_BODY" | sed "s/last_updated_at: .*/last_updated_at: ${TIMESTAMP}/")
            
            # pr_number が既にある場合は更新、なければ追加
            if echo "$NEW_BODY" | grep -q "pr_number:"; then
                NEW_BODY=$(echo "$NEW_BODY" | sed "s/pr_number: .*/pr_number: ${PR_NUMBER}/")
            else
                # last_updated_at の後に pr_number を追加
                NEW_BODY=$(echo "$NEW_BODY" | sed "s/last_updated_at: ${TIMESTAMP}/last_updated_at: ${TIMESTAMP}\npr_number: ${PR_NUMBER}/")
            fi
            
            gh_retry issue edit "$ISSUE_NUM" --body "$NEW_BODY"
        fi
        
        log_info "Issue #${ISSUE_NUM} marked as PR created (PR #${PR_NUMBER})"
        ;;
        
    merged)
        if [ $# -lt 1 ]; then
            log_error "merged requires: <issue-num>"
            exit 1
        fi
        ISSUE_NUM="$1"
        
        # ラベル更新
        OLD_ENV=$(get_env_label "$ISSUE_NUM")
        OLD_PHASE=$(get_phase_label "$ISSUE_NUM")
        remove_label_if_exists "$ISSUE_NUM" "$OLD_ENV"
        remove_label_if_exists "$ISSUE_NUM" "$OLD_PHASE"
        
        gh_retry issue edit "$ISSUE_NUM" --add-label "env:merged,phase:12-merge"
        
        log_info "Issue #${ISSUE_NUM} marked as merged"
        ;;
        
    get)
        if [ $# -lt 1 ]; then
            log_error "get requires: <issue-num>"
            exit 1
        fi
        ISSUE_NUM="$1"
        
        echo ""
        echo -e "${BLUE}Issue #${ISSUE_NUM} State${NC}"
        echo "========================"
        
        # ラベル取得
        LABELS=$(gh issue view "$ISSUE_NUM" --json labels -q '.labels[].name' | tr '\n' ', ' | sed 's/,$//')
        echo "Labels: $LABELS"
        
        # メタデータ取得
        BODY=$(gh issue view "$ISSUE_NUM" --json body -q '.body')
        if echo "$BODY" | grep -q "<!-- ENV_METADATA"; then
            echo ""
            echo "Metadata:"
            echo "$BODY" | sed -n '/<!-- ENV_METADATA/,/-->/p' | grep -E '^[a-z_]+:' | sed 's/^/  /'
        fi
        
        # ステータスサマリー
        echo ""
        ENV_LABEL=$(get_env_label "$ISSUE_NUM")
        PHASE_LABEL=$(get_phase_label "$ISSUE_NUM")
        echo "Status: ${ENV_LABEL:-'(none)'}"
        echo "Phase: ${PHASE_LABEL:-'(none)'}"
        echo ""
        ;;
        
    list)
        echo ""
        echo -e "${BLUE}Active Environments${NC}"
        echo "===================="
        
        # env:active のIssue一覧
        gh issue list --label "env:active" --json number,title,labels \
            --template '{{range .}}#{{.number}} {{.title}}{{"\n"}}  Labels: {{range .labels}}{{.name}} {{end}}{{"\n\n"}}{{end}}'
        
        # Blocked も表示
        BLOCKED_COUNT=$(gh issue list --label "env:blocked" --json number | jq 'length')
        if [ "$BLOCKED_COUNT" -gt 0 ]; then
            echo ""
            echo -e "${RED}Blocked Environments${NC}"
            echo "====================="
            gh issue list --label "env:blocked" --json number,title \
                --template '{{range .}}#{{.number}} {{.title}}{{"\n"}}{{end}}'
        fi
        ;;
        
    resume)
        if [ $# -lt 1 ]; then
            log_error "resume requires: <issue-num>"
            exit 1
        fi
        ISSUE_NUM="$1"
        
        ENV_LABEL=$(get_env_label "$ISSUE_NUM")
        PHASE_LABEL=$(get_phase_label "$ISSUE_NUM")
        PHASE=$(echo "$PHASE_LABEL" | sed 's/phase://')
        
        BODY=$(gh issue view "$ISSUE_NUM" --json body -q '.body')
        ENV_ID=$(echo "$BODY" | grep -oP '(?<=env_id: )[^\n]+' || echo "")
        BRANCH=$(echo "$BODY" | grep -oP '(?<=branch: )[^\n]+' || echo "")
        ENV_TYPE=$(echo "$BODY" | grep -oP '(?<=env_type: )[^\n]+' || echo "")
        PR_NUMBER=$(echo "$BODY" | grep -oP '(?<=pr_number: )[^\n]+' || echo "")
        
        echo "{"
        echo "  \"issue_number\": $ISSUE_NUM,"
        echo "  \"status\": \"${ENV_LABEL:-none}\","
        echo "  \"phase\": \"${PHASE:-none}\","
        echo "  \"env_id\": \"${ENV_ID}\","
        echo "  \"branch\": \"${BRANCH}\","
        echo "  \"env_type\": \"${ENV_TYPE}\","
        echo "  \"pr_number\": \"${PR_NUMBER}\","
        
        case "$ENV_LABEL" in
            "env:active")
                case "$PHASE" in
                    0-branch)
                        echo "  \"action\": \"create_environment\","
                        echo "  \"command\": \"environment_create with from_git_ref=${BRANCH}\""
                        ;;
                    1-env|2-design|3-check|4-red|5-green|6-refactor)
                        echo "  \"action\": \"reopen_environment\","
                        echo "  \"command\": \"environment_open with env_id=${ENV_ID}\""
                        ;;
                    7-review|8-stress)
                        echo "  \"action\": \"resume_review\","
                        echo "  \"command\": \"Continue review/stress test in env_id=${ENV_ID}\""
                        ;;
                    9-approval)
                        echo "  \"action\": \"wait_approval\","
                        echo "  \"command\": \"Present approval gate to user\""
                        ;;
                    10-pr|11-ci)
                        echo "  \"action\": \"monitor_ci\","
                        if [ -n "$PR_NUMBER" ]; then
                            echo "  \"command\": \"gh pr checks ${PR_NUMBER}\""
                        else
                            echo "  \"command\": \"gh pr list --search 'head:${BRANCH}' to find PR number\""
                        fi
                        ;;
                    *)
                        echo "  \"action\": \"unknown\","
                        echo "  \"command\": \"Manual investigation required\""
                        ;;
                esac
                ;;
            "env:blocked")
                BLOCKED_REASON=$(gh issue view "$ISSUE_NUM" --json comments -q '.comments[-1].body' | grep -oP '(?<=## Blocked: )[^\n]+' || echo "unknown")
                echo "  \"action\": \"resolve_block\","
                echo "  \"blocked_reason\": \"${BLOCKED_REASON}\","
                echo "  \"command\": \"Review blocked comment, resolve issue, then: issue-state.sh unblock $ISSUE_NUM\""
                ;;
            "env:pr-created")
                echo "  \"action\": \"monitor_pr\","
                if [ -n "$PR_NUMBER" ]; then
                    echo "  \"command\": \"gh pr checks ${PR_NUMBER} or gh pr view ${PR_NUMBER}\""
                else
                    echo "  \"command\": \"gh pr list --search 'head:${BRANCH}' to find PR number\""
                fi
                ;;
            "env:merged")
                echo "  \"action\": \"cleanup\","
                echo "  \"command\": \"Environment can be deleted if still exists\""
                ;;
            *)
                echo "  \"action\": \"initialize\","
                echo "  \"command\": \"issue-state.sh register $ISSUE_NUM <env_id> <branch> <env_type>\""
                ;;
        esac
        
        echo "}"
        ;;
        
    ci-status)
        if [ $# -lt 1 ]; then
            log_error "ci-status requires: <pr-number>"
            exit 1
        fi
        PR_NUMBER="$1"
        
        CHECKS_JSON=$(gh pr checks "$PR_NUMBER" --json name,state,conclusion,detailsUrl 2>/dev/null || echo "[]")
        
        if [ "$CHECKS_JSON" = "[]" ]; then
            echo "{"
            echo "  \"pr_number\": $PR_NUMBER,"
            echo "  \"error\": \"No checks found or PR does not exist\","
            echo "  \"total_runs\": 0,"
            echo "  \"failed\": 0,"
            echo "  \"passed\": 0,"
            echo "  \"pending\": 0"
            echo "}"
            exit 0
        fi
        
        TOTAL=$(echo "$CHECKS_JSON" | jq 'length')
        PASSED=$(echo "$CHECKS_JSON" | jq '[.[] | select(.conclusion == "success")] | length')
        FAILED=$(echo "$CHECKS_JSON" | jq '[.[] | select(.conclusion == "failure")] | length')
        PENDING=$(echo "$CHECKS_JSON" | jq '[.[] | select(.state == "pending" or .state == "queued" or .state == "in_progress")] | length')
        
        FAILED_JOBS=$(echo "$CHECKS_JSON" | jq '[.[] | select(.conclusion == "failure") | {name: .name, conclusion: .conclusion, log_url: .detailsUrl}]')
        
        echo "{"
        echo "  \"pr_number\": $PR_NUMBER,"
        echo "  \"total_runs\": $TOTAL,"
        echo "  \"failed\": $FAILED,"
        echo "  \"passed\": $PASSED,"
        echo "  \"pending\": $PENDING,"
        if [ "$FAILED" -gt 0 ]; then
            echo "  \"all_passed\": false,"
            echo "  \"failed_jobs\": $FAILED_JOBS"
        else
            if [ "$PENDING" -gt 0 ]; then
                echo "  \"all_passed\": false,"
                echo "  \"status\": \"in_progress\""
            else
                echo "  \"all_passed\": true"
            fi
        fi
        echo "}"
        ;;
        
    init-labels)
        log_info "Creating labels..."
        
        # ステータスラベル
        gh label create "env:active" --color "0E8A16" --description "作業中" --force 2>/dev/null || true
        gh label create "env:blocked" --color "D93F0B" --description "人間の介入が必要" --force 2>/dev/null || true
        gh label create "env:pr-created" --color "1D76DB" --description "PR作成済み" --force 2>/dev/null || true
        gh label create "env:merged" --color "6F42C1" --description "マージ完了" --force 2>/dev/null || true
        
        # Phase ラベル
        for phase in "0-branch:ブランチ作成" "1-env:環境構築" "2-design:設計書参照" \
                     "3-check:設計実現性チェック" "4-red:TDD Red" "5-green:TDD Green" \
                     "6-refactor:リファクタリング" "7-review:レビュー" "8-stress:ストレステスト" \
                     "9-approval:承認待ち" "10-pr:PR作成" "11-ci:CI監視" "12-merge:マージ完了"; do
            NAME=$(echo "$phase" | cut -d: -f1)
            DESC=$(echo "$phase" | cut -d: -f2)
            gh label create "phase:${NAME}" --color "FBCA04" --description "$DESC" --force 2>/dev/null || true
        done
        
        # 領域ラベル
        gh label create "area:backend" --color "C2E0C6" --description "バックエンド" --force 2>/dev/null || true
        gh label create "area:frontend" --color "C2E0C6" --description "フロントエンド" --force 2>/dev/null || true
        gh label create "area:infra" --color "C2E0C6" --description "インフラ" --force 2>/dev/null || true
        gh label create "area:database" --color "C2E0C6" --description "データベース" --force 2>/dev/null || true
        
        log_info "Labels created successfully"
        ;;
        
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac
