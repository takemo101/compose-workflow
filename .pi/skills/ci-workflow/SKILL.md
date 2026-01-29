---
name: ci-workflow
description: PR作成後のCI監視、失敗時の分類と対応、自動マージまでの完全なワークフローを定義
---

# CI監視ワークフロー

> **責任範囲**: CI監視 → 失敗分析 → 自動修正 → 成功時マージ
> 
> | このスキル | pr-merge-workflow |
> |-----------|-------------------|
> | CIポーリング・ログ分析 | PR作成テンプレート |
> | 失敗時の自動修正 | マージ戦略選択 |
> | リトライ管理（3回） | ロールバック手順 |
> | 成功時の自動マージ呼び出し | クリーンアップ |

---

## 実行者の責任分担

| フェーズ | 実行者 | 理由 |
|---------|--------|------|
| 0-9 (実装→PR作成) | `Sisyphus` | ホスト環境/Worktreeでの作業 |
| **10 (CI監視→マージ)** | **`Sisyphus`** | GitHub API操作 |
| **11 (環境クリーンアップ)** | **`Sisyphus`** | Worktree削除等 |

> **Note**: CI監視やPRマージは `bash` ツールでGitHub APIを呼び出す。

---

## メインフロー

```python
def post_pr_workflow(pr_number: int):
    """PR作成後: CI待機 → 成功:マージ&削除 / 失敗:修正(3回) / タイムアウト:報告"""
    ci_result = wait_for_ci(pr_number)
    
    if ci_result == SUCCESS:
        auto_merge_pr(pr_number) and cleanup_worktree(pr_number)
    elif ci_result == FAILURE:
        if handle_ci_failure(pr_number):
            # 修正成功 → マージ & 環境削除
            auto_merge_pr(pr_number) and cleanup_worktree(pr_number)
        else:
            # 3回失敗 → エスカレーション（環境保持）
            escalate_ci_failure(pr_number)
    elif ci_result == TIMEOUT:
        handle_ci_timeout(pr_number)  # 環境保持
```

---

## 1. CI完了待機

```python
def wait_for_ci(pr_number: int, timeout: int = 600) -> CIResult:
    """30秒間隔でgh pr checksをポーリング（最大10分）"""
    for _ in range(timeout // 30):
        checks = bash(f"gh pr checks {pr_number} --json state,name")
        if all_success(checks): return SUCCESS
        if any_failure(checks): return FAILURE
        wait(30)
    return TIMEOUT
```

---

## 2. CI失敗の分類と対応

| 失敗カテゴリ | 検出パターン | 対応方法 |
|------------|-------------|---------|
| **Lint/Clippy** | `warning:`, `clippy::` | 自動修正 (`--fix`) |
| **Test失敗** | `FAILED`, `test result: FAILED` | テストコード修正 |
| **ビルドエラー** | `error[E`, `cannot find` | コード修正 |
| **フォーマット** | `Diff in`, `would have been reformatted` | `cargo fmt` |
| **環境依存** | `platform exception` | 環境再開 |

```python
def analyze_failure(log: str) -> CIFailureAnalysis:
    """CIログを分析して失敗種別を特定"""
    if "clippy::" in log or "warning:" in log:
        return CIFailureAnalysis(type="lint", auto_fixable=True, 
            fix_command="cargo clippy --fix --allow-dirty --allow-staged")
    if "FAILED" in log:
        return CIFailureAnalysis(type="test", auto_fixable=False)
    if "error[E" in log:
        return CIFailureAnalysis(type="build", auto_fixable=False)
    if "would have been reformatted" in log:
        return CIFailureAnalysis(type="format", auto_fixable=True, fix_command="cargo fmt")
    return CIFailureAnalysis(type="unknown")
```

---

## 3. CI修正フロー

```python
MAX_CI_RETRIES = 3

def handle_ci_failure(pr_number: int) -> bool:
    """CI失敗 → ログ分析 → ホスト環境で修正 → push → 再待機（最大3回）"""
    for attempt in range(MAX_CI_RETRIES):
        log = bash("gh run view --log-failed")
        fix_in_host(pr_number, analyze_failure(log))
        bash("git add . && git commit -m 'fix: CI修正' && git push")
        if wait_for_ci(pr_number) == SUCCESS:
            return True
    return False  # リトライ超過 → escalate_ci_failure()

def fix_in_host(pr_number: int, analysis: CIFailureAnalysis):
    """ホスト環境で修正を実施"""
    # 1. ブランチをチェックアウト
    branch = bash(f"gh pr view {pr_number} --json headRefName -q .headRefName")
    bash(f"git checkout {branch}")
    # 2. リモートの最新状態を取得
    bash(command="git pull origin HEAD")
    # 3. 修正を実施
    if analysis.auto_fixable:
        bash(command=analysis.fix_command)
    # 4. ローカルで検証
    bash(command="cargo clippy -- -D warnings && cargo test")
    # 5. 修正をpush
    bash(command="git add . && git commit -m 'fix: CI修正' && git push")
```

---

## 4. 自動マージ

```python
def auto_merge_pr(pr_number: int, issue_num: int) -> bool:
    """gh pr merge --merge --delete-branch"""
    result = bash(f"gh pr merge {pr_number} --merge --delete-branch")
    if result.exit_code == 0:
        # Issue ラベル更新: env:merged (`github-issue-state-management` skill API)
        bash(f"bash .pi/skills/github-issue-state-management/scripts/issue-state.sh merged {issue_num}")
        return True
    return handle_merge_failure(pr_number, error=result.stderr)
```

---

## 5. エスカレーション

```python
def escalate_ci_failure(pr_number: int):
    """PRをDraft化、失敗ログをコメント、ユーザーに報告"""
    bash(f"gh pr ready {pr_number} --undo")
    bash(f"gh pr comment {pr_number} --body '⚠️ CI修正3回失敗。'")
    report_to_user(f"⚠️ PR #{pr_number} 手動確認が必要")
```

---

## 6. 環境クリーンアップ

```python
def cleanup_worktree(pr_number: int) -> bool:
    """worktreeを使用している場合は削除"""
    # worktreeの削除ロジック（もしあれば）
    #基本的には `git worktree prune` や `rm -rf`
    return True
```

> **Note**: 環境状態は GitHub Issue ラベルで管理。詳細は [github-issue-state-management](../github-issue-state-management/SKILL.md) を参照。

### クリーンアップタイミング

| 状況 | 環境の扱い |
|------|----------|
| PRマージ成功 | ✅ 即座に削除 |
| PRクローズ（マージなし） | ✅ 即座に削除 |
| CI修正中（リトライ中） | ❌ 削除しない |
| Draft PR（エスカレーション中） | ❌ 削除しない |
| PRレビュー修正待ち | ❌ 削除しない |

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `pr-merge-workflow` skill | PR作成〜マージ〜ロールバックの全体フロー |
| `github-issue-state-management` skill | 環境状態管理（ラベル） |

---

## CLIスクリプト

**CI待機の自動化スクリプト：**

```bash
bash .pi/skills/ci-workflow/scripts/ci-wait.sh <pr-number> [timeout-seconds]
```

| 引数 | 説明 | デフォルト |
|------|------|-----------|
| `pr-number` | PR番号 | 必須 |
| `timeout-seconds` | 最大待機時間（秒） | 600 |

**終了コード：**
| コード | 意味 |
|--------|------|
| 0 | 全CIチェック成功 |
| 1 | CIチェック失敗 |
| 2 | タイムアウト |
| 3 | 引数エラー |

**使用例：**
```bash
bash .pi/skills/ci-workflow/scripts/ci-wait.sh 42 1800
```
