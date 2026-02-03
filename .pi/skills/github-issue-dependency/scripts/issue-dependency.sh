#!/usr/bin/env bash
# GitHub Issue依存関係管理スクリプト
# Usage: issue-dependency.sh <command> <args...>
#
# Commands:
#   add-blocked-by <issue> <blocking-issue>  - Issue が blocking-issue にブロックされていることを設定
#   remove-blocked-by <issue> <blocking-issue> - ブロック関係を削除
#   list <issue>                              - Issue の依存関係を一覧表示

set -euo pipefail

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# リポジトリ情報を取得
get_repo_info() {
    local remote_url
    remote_url=$(git remote get-url origin 2>/dev/null || echo "")
    
    if [[ -z "$remote_url" ]]; then
        log_error "Git リポジトリではないか、origin remote が設定されていません"
        exit 1
    fi
    
    # HTTPS or SSH URL からowner/repoを抽出
    if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
    else
        log_error "GitHub リポジトリURLを解析できません: $remote_url"
        exit 1
    fi
}

# Issue の database ID を取得
get_issue_db_id() {
    local issue_number=$1
    local issue_id
    
    issue_id=$(gh api "repos/${OWNER}/${REPO}/issues/${issue_number}" --jq '.id' 2>/dev/null || echo "")
    
    if [[ -z "$issue_id" ]]; then
        log_error "Issue #${issue_number} の ID を取得できません"
        return 1
    fi
    
    echo "$issue_id"
}

# Issue の Node ID を取得
get_issue_node_id() {
    local issue_number=$1
    local node_id
    
    node_id=$(gh issue view "$issue_number" --json id --jq '.id' 2>/dev/null || echo "")
    
    if [[ -z "$node_id" ]]; then
        log_error "Issue #${issue_number} の Node ID を取得できません"
        return 1
    fi
    
    echo "$node_id"
}

# 依存関係を追加（REST API）
add_blocked_by() {
    local issue_number=$1
    local blocking_number=$2
    
    log_info "Issue #${issue_number} に依存関係を追加中... (blocked by #${blocking_number})"
    
    # blocking Issue の database ID を取得
    local blocking_id
    blocking_id=$(get_issue_db_id "$blocking_number") || return 1
    
    # 依存関係を追加
    local result
    result=$(gh api "repos/${OWNER}/${REPO}/issues/${issue_number}/dependencies/blocked_by" \
        -X POST \
        -f "issue_id=${blocking_id}" \
        --jq '.number' 2>&1) || {
        # 既に存在する場合は成功として扱う
        if [[ "$result" == *"already exists"* ]] || [[ "$result" == *"Validation Failed"* ]]; then
            log_warn "依存関係は既に存在します: #${issue_number} ← #${blocking_number}"
            return 0
        fi
        log_error "依存関係の追加に失敗: $result"
        return 1
    }
    
    log_success "依存関係を追加しました: #${issue_number} is blocked by #${blocking_number}"
}

# 依存関係を削除（REST API）
remove_blocked_by() {
    local issue_number=$1
    local blocking_number=$2
    
    log_info "Issue #${issue_number} から依存関係を削除中... (blocked by #${blocking_number})"
    
    # blocking Issue の database ID を取得
    local blocking_id
    blocking_id=$(get_issue_db_id "$blocking_number") || return 1
    
    # 依存関係を削除
    gh api "repos/${OWNER}/${REPO}/issues/${issue_number}/dependencies/blocked_by/${blocking_id}" \
        -X DELETE 2>/dev/null || {
        log_warn "依存関係が存在しないか、削除に失敗しました"
        return 0
    }
    
    log_success "依存関係を削除しました: #${issue_number} ← #${blocking_number}"
}

# 依存関係を一覧表示
list_dependencies() {
    local issue_number=$1
    
    log_info "Issue #${issue_number} の依存関係を取得中..."
    
    echo ""
    echo "=== Blocked by (このIssueをブロックしているIssue) ==="
    local blocked_by
    blocked_by=$(gh api "repos/${OWNER}/${REPO}/issues/${issue_number}/dependencies/blocked_by" \
        --jq '.[] | "  #\(.number) [\(.state)] \(.title)"' 2>/dev/null || echo "")
    
    if [[ -z "$blocked_by" ]]; then
        echo "  (なし)"
    else
        echo "$blocked_by"
    fi
    
    echo ""
    echo "=== Blocking (このIssueがブロックしているIssue) ==="
    local blocking
    blocking=$(gh api "repos/${OWNER}/${REPO}/issues/${issue_number}/dependencies/blocking" \
        --jq '.[] | "  #\(.number) [\(.state)] \(.title)"' 2>/dev/null || echo "")
    
    if [[ -z "$blocking" ]]; then
        echo "  (なし)"
    else
        echo "$blocking"
    fi
    
    echo ""
}

# GraphQL APIで依存関係を追加（代替手段）
add_blocked_by_graphql() {
    local issue_number=$1
    local blocking_number=$2
    
    log_info "[GraphQL] Issue #${issue_number} に依存関係を追加中..."
    
    # Node ID を取得
    local issue_node_id blocking_node_id
    issue_node_id=$(get_issue_node_id "$issue_number") || return 1
    blocking_node_id=$(get_issue_node_id "$blocking_number") || return 1
    
    # GraphQL mutation を実行
    local result
    # shellcheck disable=SC2016  # GraphQL variables ($issueId, $blockingIssueId) are intentional, not bash expansion
    result=$(gh api graphql -f query='
        mutation($issueId: ID!, $blockingIssueId: ID!) {
            addBlockedBy(input: {
                issueId: $issueId,
                blockingIssueId: $blockingIssueId
            }) {
                issue {
                    number
                    title
                }
            }
        }
    ' -f issueId="$issue_node_id" -f blockingIssueId="$blocking_node_id" 2>&1) || {
        log_error "GraphQL API呼び出しに失敗: $result"
        return 1
    }
    
    log_success "依存関係を追加しました (GraphQL): #${issue_number} is blocked by #${blocking_number}"
}

# 使用方法を表示
show_usage() {
    cat << EOF
GitHub Issue依存関係管理スクリプト

Usage: $(basename "$0") <command> <args...>

Commands:
  add-blocked-by <issue> <blocking-issue>
      Issue が blocking-issue にブロックされていることを設定
      例: $(basename "$0") add-blocked-by 10 5
          → #10 is blocked by #5

  remove-blocked-by <issue> <blocking-issue>
      ブロック関係を削除
      例: $(basename "$0") remove-blocked-by 10 5

  list <issue>
      Issue の依存関係を一覧表示
      例: $(basename "$0") list 10

  add-blocked-by-graphql <issue> <blocking-issue>
      GraphQL APIを使用して依存関係を追加（REST APIの代替）

Examples:
  # Subtask #12, #13, #14 を作成し、#13 は #12 に依存
  $(basename "$0") add-blocked-by 13 12

  # 依存関係を確認
  $(basename "$0") list 13
EOF
}

# メイン処理
main() {
    if [[ $# -lt 1 ]]; then
        show_usage
        exit 1
    fi
    
    local command=$1
    shift
    
    # リポジトリ情報を取得
    get_repo_info
    
    case "$command" in
        add-blocked-by)
            [[ $# -lt 2 ]] && { log_error "引数が不足しています"; show_usage; exit 1; }
            add_blocked_by "$1" "$2"
            ;;
        remove-blocked-by)
            [[ $# -lt 2 ]] && { log_error "引数が不足しています"; show_usage; exit 1; }
            remove_blocked_by "$1" "$2"
            ;;
        list)
            [[ $# -lt 1 ]] && { log_error "Issue番号を指定してください"; show_usage; exit 1; }
            list_dependencies "$1"
            ;;
        add-blocked-by-graphql)
            [[ $# -lt 2 ]] && { log_error "引数が不足しています"; show_usage; exit 1; }
            add_blocked_by_graphql "$1" "$2"
            ;;
        -h|--help|help)
            show_usage
            exit 0
            ;;
        *)
            log_error "不明なコマンド: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
