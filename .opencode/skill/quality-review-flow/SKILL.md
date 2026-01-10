---
name: quality-review-flow
description: PR作成前の品質レビュー実行フロー、客観的品質基準、同一指摘検出、エスカレーション手順を定義
---

# 品質レビューフロー & 客観的品質基準

> **参照元**: implement-issues.md から分離された品質レビューロジック

---

## 1. 品質レビュー実行フロー ⚠️ 必須

> **⚠️ 重要**: PR作成前に必ず品質レビューを実行。スキップ厳禁。

### 1.1 レビューエージェント選択

| 実装内容 | エージェント |
|----------|-------------|
| バックエンド/CLI | `backend-reviewer` |
| フロントエンド | `frontend-reviewer` |
| DB関連 | `database-reviewer` |
| インフラ | `infra-reviewer` |
| セキュリティ | `security-reviewer` |

### 1.3 Token最適化（Diff-Driven Review）

> **⚠️ 重要**: レビュアーエージェントは、ファイル全体ではなく**変更差分**を中心にレビューすること。

1. **差分取得**: `git diff main...HEAD` で変更箇所のみを取得
2. **重点確認**: 差分とその周辺コンテキストのみを読み込む
3. **全文読み込み禁止**: ファイル全体の読み込みは、構造理解が必要な場合のみに限定する

```python
# レビューエージェントへの指示例
prompt = """
レビュー対象:
1. `git diff main...HEAD` の出力（変更点）
2. 変更されたファイルの関連箇所（全体ではない）

確認事項:
- 変更が要件を満たしているか
- 既存機能を破壊していないか
"""
```

### 1.4 スコア判定基準

| スコア | アクション |
|--------|----------|
| 9-10点 | ✅ PR作成へ |
| 7-8点 | 修正 → 再レビュー |
| 6点以下 | 設計見直し |

---

## 2. 客観的品質基準（必須条件）

レビュースコアに加え、以下の**客観的基準**を満たす必要があります。
これらはAIの主観に依存せず、ツールで検証可能です。

| 基準 | 検証コマンド | 必須 |
|------|-------------|------|
| **Lintエラー 0件** | `cargo clippy -- -D warnings` / `npm run lint` | ✅ |
| **型エラー 0件** | `cargo check` / `npm run type-check` | ✅ |
| **フォーマット準拠** | `cargo fmt --check` / `npm run format:check` | ✅ |
| **テスト全通過** | `cargo test` / `npm test` | ✅ |
| **カバレッジ 80%以上** | `cargo tarpaulin` / `npm run coverage` | 推奨 |

```python
def check_objective_criteria(env_id: str, language: str) -> ObjectiveCriteriaResult:
    """客観的品質基準のチェック"""
    
    checks = {
        "rust": {
            "lint": "cargo clippy -- -D warnings",
            "type": "cargo check",
            "format": "cargo fmt --check",
            "test": "cargo test -- --quiet",  # ログ抑制
        },
        "typescript": {
            "lint": "npm run lint -- --quiet",
            "type": "npm run type-check",
            "format": "npm run format:check",
            "test": "npm test -- --silent",  # ログ抑制
        }
    }
    
    results = {}
    lang_checks = checks.get(language, {})
    
    for check_name, command in lang_checks.items():
        result = container-use_environment_run_cmd(
            environment_id=env_id,
            command=command
        )
        results[check_name] = result.exit_code == 0
    
    all_passed = all(results.values())
    
    return ObjectiveCriteriaResult(
        passed=all_passed,
        details=results,
        message="全ての客観的基準を満たしています" if all_passed else f"失敗: {[k for k, v in results.items() if not v]}"
    )
```

> **Note**: 客観的基準が未達の場合、レビュースコアに関係なく PR 作成不可。

---

## 3. 同一指摘の検出（無限ループ防止）

同じ指摘が繰り返される場合は即座にエスカレーションします。

```python
def detect_repeated_issues(current_issues: list[str], previous_issues: list[str]) -> bool:
    """前回と同じ指摘が繰り返されているか検出"""
    
    normalize = lambda s: s.lower().strip()
    current_set = set(normalize(i) for i in current_issues)
    previous_set = set(normalize(i) for i in previous_issues)
    
    overlap = current_set & previous_set
    if previous_set and len(overlap) / len(previous_set) >= 0.5:
        return True
    return False

def review_with_repeat_detection(env_id: str, subtask_id: int) -> ReviewResult:
    """同一指摘検出付きレビューループ"""
    
    MAX_RETRIES = 3
    previous_issues = []
    
    for attempt in range(MAX_RETRIES):
        # レビュー実行（各エージェント呼び出し）
        review = run_quality_review(env_id, subtask_id)
        
        # 客観的基準チェック
        objective_result = check_objective_criteria(env_id, detect_language())
        if not objective_result.passed:
             report_to_user(f"⚠️ 客観的基準未達: {objective_result.message}")
             fix_issues(env_id, ["Objective criteria failure"])
             continue

        if review.score >= 9:
            return ReviewResult(status="passed", score=review.score)
        
        # 同一指摘検出
        if attempt > 0 and detect_repeated_issues(review.issues, previous_issues):
            report_to_user(f"⚠️ 同一指摘が繰り返されています（Issue #{subtask_id}）\n前回: {previous_issues}\n今回: {review.issues}")
            return ReviewResult(status="escalated", score=review.score, reason="repeated_issues")
        
        previous_issues = review.issues
        fix_issues(env_id, review.issues)
    
    return ReviewResult(status="escalated", score=review.score, reason="max_retries")
```

---

## 4. 修正 & 再レビュー（TODO駆動インクリメンタル方式）

> **Token最適化**: レビュー指摘をTODOファイルに保存し、再実装時はTODOのみ参照。
> 設計書・既存コードの再読み込みを最小限に抑える。

### 4.1 TODOファイル生成（レビュー後）

レビュー指摘事項を構造化TODOファイルに保存：

```python
def save_review_todo(env_id: str, subtask_id: int, review_result: ReviewResult) -> str:
    """レビュー指摘をTODOファイルに保存（トークン節約）"""
    
    todo_content = f"""# Review TODO: Issue #{subtask_id}
## Review Score: {review_result.score}/10
## Attempt: {review_result.attempt}/3

### 指摘事項（優先度順）

{chr(10).join(f"- [ ] **{issue.severity}**: {issue.description} (File: {issue.file}, Line: {issue.line})" for issue in sorted(review_result.issues, key=lambda x: x.severity_order))}

### 修正ガイド

| 指摘 | 修正方針 | 参照セクション |
|------|---------|--------------|
{chr(10).join(f"| {issue.description[:30]}... | {issue.fix_hint} | {issue.design_section or 'N/A'} |" for issue in review_result.issues)}

### ⚠️ 再実装時の注意
- このTODOファイルのみ参照して修正
- 設計書の再読み込みは「参照セクション」が指定された場合のみ
- 修正後、このファイルの該当行にチェックを入れる
"""
    
    todo_path = f".review-todo/issue-{subtask_id}-attempt-{review_result.attempt}.md"
    container_use_environment_file_write(
        environment_id=env_id,
        target_file=todo_path,
        contents=todo_content
    )
    return todo_path
```

### 4.2 TODO駆動の再実装フロー

```
📋 レビュー完了（スコア < 9）
     ↓
💾 TODOファイル生成 (.review-todo/issue-N-attempt-M.md)
     ↓
🔧 再実装（TODOファイルのみ参照）
     ├─ 指摘事項を上から順に修正
     ├─ 修正完了したらチェック☑
     └─ 「参照セクション」がある場合のみ設計書をピンポイント読み込み
     ↓
🧪 テスト再実行
     ↓
📝 再レビュー依頼（修正サマリ付き）
```

### 4.3 再レビュー呼び出し（TODO参照版）

```python
# 修正後の再レビュー呼び出し例（トークン最適化版）
todo_content = container_use_environment_file_read(
    environment_id=env_id,
    target_file=f".review-todo/issue-{subtask_id}-attempt-{attempt}.md"
)

task(
    subagent_type="backend-reviewer",
    description="Issue #{issue_id} 修正後再レビュー",
    prompt=f"""
## 前回レビュー
- スコア: {previous_score}/10
- 指摘事項: {len(issues)}件

## 修正TODOファイル
```
{todo_content}
```

## 修正サマリ
{fix_summary}

## 再レビュー依頼
TODOファイルの指摘事項が適切に修正されたか確認し、再スコアリングしてください。
新規の問題があれば指摘してください。
"""
)
```

### 4.4 Token節約効果

| フェーズ | 従来方式 | TODO駆動方式 | 削減率 |
|---------|---------|-------------|--------|
| 1回目レビュー後 | 設計書全文 + コード全文読み込み | TODOファイルのみ | **60-70%** |
| 2回目レビュー後 | 設計書全文 + コード全文読み込み | TODOファイルのみ | **60-70%** |
| 3回目レビュー後 | 設計書全文 + コード全文読み込み | TODOファイルのみ | **60-70%** |

**累積効果**: 3回のレビューループで **5,000-15,000トークン節約**

### 4.5 TODOファイルのセッション間永続化

> **重要**: TODOファイルはcontainer-use環境内に保存されるため、セッション間で永続化される。

#### environments.json との連携

```python
def sync_review_todo_to_environments_json(env_id: str, subtask_id: int, attempt: int):
    """レビューTODOをenvironments.jsonにも記録（復旧用）"""
    from pathlib import Path
    import json
    
    # environments.jsonに pending_issues として記録
    todo_path = f".review-todo/issue-{subtask_id}-attempt-{attempt}.md"
    
    add_pending_issue(env_id, {
        "type": "review_todo",
        "todo_file": todo_path,
        "attempt": attempt,
        "subtask_id": subtask_id
    })
    
    # Phaseを review-fix に更新
    update_phase(env_id, phase=7, step="review-fix")
```

#### セッション再開時の復旧

```python
def resume_review_fix(env_id: str) -> str | None:
    """セッション再開時にレビューTODOを復旧"""
    env = find_environment_by_id(env_id)
    
    if not env:
        return None
    
    # pending_issues からレビューTODOを検索
    for issue in env.get("pending_issues", []):
        if issue.get("type") == "review_todo":
            todo_path = issue["todo_file"]
            
            # container-use環境からTODOファイルを読み込み
            content = container_use_environment_file_read(
                environment_id=env_id,
                target_file=todo_path,
                should_read_entire_file=True
            )
            
            return content
    
    return None
```

#### ディレクトリ構造

```
.review-todo/
├── issue-42-attempt-1.md    # 1回目レビュー後のTODO
├── issue-42-attempt-2.md    # 2回目レビュー後のTODO
├── issue-42-attempt-3.md    # 3回目レビュー後のTODO（Blocked判定）
└── .gitignore               # Git管理外（環境内のみ）
```

### 4.6 Blocked状態への移行

レビュー3回失敗時、`environments.json` を `blocked` 状態に更新：

```python
def escalate_to_blocked(env_id: str, subtask_id: int, last_score: int, issues: list):
    """レビュー3回失敗時にBlocked状態に移行"""
    
    set_blocked(
        env_id=env_id,
        reason="review_loop_exceeded",
        description=f"Issue #{subtask_id}: レビュー3回失敗（最終スコア: {last_score}/10）",
        suggested_action="設計書の該当セクションを見直し、要件の曖昧さを解消してください",
        context={
            "subtask_id": subtask_id,
            "review_attempts": 3,
            "last_score": last_score,
            "unresolved_issues": issues
        }
    )
    
    # Draft PR作成
    create_draft_pr(env_id, subtask_id, issues)
```

---

## 5. レビュー失敗時のエスカレーション

3回連続でスコア9点未満の場合：

1. `environments.json` を `blocked` 状態に更新（`escalate_to_blocked()`）
2. Draft PRを作成（`--draft`フラグ）
3. PRの本文に「レビュー未通過」と明記
4. 未解決の指摘事項をPRコメントに記載
5. ユーザーに報告して判断を仰ぐ
