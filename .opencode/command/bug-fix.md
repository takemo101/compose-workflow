---
description: バグ報告から修正完了までの完全ワークフロー（Issue作成→実装→PR→マージ）
argument-hint: "[Issue番号] または バグの説明"
---

# バグ修正完全ワークフロー

バグ発見から修正完了までの完全なライフサイクルを自動化します。

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | バグ報告検出 | 会話からバグ報告を自動検出 |
| 1 | Issue確認/作成 | 既存Issue確認、または新規作成提案 |
| 1.5 | 環境選択 | container-use or worktree |
| 2 | 実装 | `/implement-issues` 内部呼び出し（Bugfix Rule適用） |
| 2.5 | ユーザー承認 | {{skill:approval-gate}} ※PR作成前 |
| 3 | PR作成 | バグ修正専用テンプレートでPR作成 |
| 4 | CI監視 & マージ | CI成功→自動マージ |
| 5 | クリーンアップ | 環境削除 |

> **Phase規約**: {{skill:workflow-phase-convention}} を参照

---

## サーキットブレーカー

| 条件 | アクション |
|------|----------|
| **Issue作成拒否** | 修正を中断 |
| **CI修正3回失敗** | Draft PR化、手動確認依頼 |
| **品質レビュー3回失敗** | Draft PR作成 → ユーザー判断 |
| **環境削除3回失敗** | 手動削除依頼 |

---

## 自動検出トリガー

Sisyphusが会話からバグ報告を自動検出します。

| 優先度 | パターン | アクション |
|-------|---------|----------|
| **高** | "Issue #XX を修正して" | 即座に修正開始 |
| **高** | "PR #XX のレビュー指摘" | 既存環境再開 → 修正 → push |
| **中** | "-w 2が反映されない" | Issue作成 → 原因特定 → 修正 |
| **低** | "〇〇が動かない" | Issue作成提案 → 承認後に修正 |

### 検出パターン

```python
# 明示的Issue/PR番号（優先度: 高）
issue_match = re.search(r'Issue #(\d+).*(修正|fix|直)', user_message)
pr_match = re.search(r'PR #(\d+).*(レビュー|指摘|修正)', user_message)

# 具体的不具合（優先度: 中）- LLM判定で誤検知回避
patterns = [r'(.+)が反映されない', r'(.+)が動作しない', r'(.+)がエラーになる']

# 一般キーワード（優先度: 低）- ユーザー確認必須
keywords = ["バグ", "bug", "不具合", "動かない", "エラー"]
```

### 誤検知回避

| リスク | 回避策 |
|--------|--------|
| 設計議論との混同 | 除外パターン: `動かない.*べき` |
| 調査依頼との混同 | 除外パターン: `調査.*動かない` + LLM判定 |
| 質問との混同 | LLM判定で文末の疑問符を検出 |

---

## Phase 1: Issue確認/作成

### 既存Issue確認

```bash
# ユーザーが明示的にIssue番号を指定した場合
gh issue view {issue_id} --json state,title

# 類似Issueを検索
gh issue list --state open --label bug --limit 20 --json number,title
```

### Issue作成提案

既存Issueがない場合、ユーザーに作成を提案:

```markdown
## バグ報告 - Issue作成提案

- **タイトル**: `fix: {summary}`
- **ラベル**: `bug`
- **説明**: 現象、期待動作、再現手順

**このIssueを作成して修正を開始しますか？**
- `作成`: Issue作成 → 修正開始
- `既存利用 #XX`: 既存Issue #XX を使用
- `キャンセル`: 中断
```

---

## Phase 1.5: 環境選択

| 条件 | 環境 | 理由 |
|------|------|------|
| 通常のバグ修正 | **container-use** | 環境分離、再現性 |
| macOS固有API | **worktree** | Linuxコンテナで動作しない |
| Windows固有API | **worktree** | Linuxコンテナで動作しない |
| ハードウェア依存 | **worktree** | コンテナでアクセス不可 |

> **詳細**: {{skill:container-use-guide}}, {{skill:worktree-workflow}}

---

## Phase 2: 実装（/implement-issues 内部呼び出し）

バグ修正は `/implement-issues` を内部で呼び出して実行。
違いは以下のBugfix Ruleのみ:

| 項目 | Feature開発 | バグ修正 |
|------|-----------|---------|
| ブランチ名 | `feature/issue-XX-*` | `fix/issue-XX-*` |
| 修正方針 | 新規機能追加 | **最小変更**（Bugfix Rule） |
| テスト追加 | 新規テスト | **Regression Test必須** |

### Bugfix Rule（実装ガイドライン）

| ルール | 説明 | 検証者 |
|--------|------|--------|
| **最小変更** | バグの根本原因のみを修正（リファクタリング禁止） | backend-reviewer |
| **Regression Test** | バグを再現するテストケースを必ず追加 | container-worker |
| **原因記録** | 修正前にコメントで根本原因を記録 | backend-reviewer |
| **影響範囲確認** | 修正が他の機能に影響しないか確認 | container-worker |

### リファクタリング判定基準

| 指標 | 閾値 | 判定 |
|------|------|------|
| 変更行数 | 修正ファイルの30%以上 | 要レビュー |
| 変更ファイル数 | 3ファイル以上 | 要レビュー |
| 関数名変更 | あり | リファクタリングの可能性 |

### Regression Test免除条件

| 条件 | 免除可否 | 代替要件 |
|------|---------|---------|
| 既存テストがバグを検出していた | 免除可 | 既存テストの修正のみ |
| タイポ修正（コメント・文字列） | 免除可 | 影響範囲が限定的であることを明記 |
| ロジック修正 | 必須 | 例外なし |

---

## Phase 2.5: ユーザー承認ゲート

> **共通仕様**: {{skill:approval-gate}} を参照

```markdown
## 承認リクエスト: バグ修正PR作成

**Issue**: #{issue_id}
**修正内容**: {fix_summary}
**変更行数**: {changed_lines}行（{changed_files}ファイル）

### レビュー結果
- スコア: {score}/10
- Regression Test: 追加済み

---
**選択肢**:
- `approve` → PR作成へ進む
- `reject` → 修正を中断
- `revise` → 指摘箇所を修正
```

---

## Phase 3: PR作成

バグ修正専用PRテンプレート:

```markdown
## 概要
Closes #{issue_id}

## Root Cause Analysis（根本原因分析）

### 原因
{root_cause_description}

### 修正内容
{fix_description}
**修正行数**: {changed_lines}行（{changed_files}ファイル）

### 影響範囲
{impact_scope}
**デグレードリスク**: 低/中/高

## Regression Test
- `test_fix_issue_{issue_id}_*`: バグ再現テスト
- 修正前: ❌ 失敗 / 修正後: ✅ 成功

## Bugfix Rule遵守チェック
- [x] 最小変更の原則（リファクタリングなし）
- [x] Regression Test追加
- [x] 原因記録
- [x] 影響範囲確認（全テスト通過）
```

---

## CI監視 & マージ & クリーンアップ

> **詳細**: {{skill:ci-workflow}}, {{skill:pr-merge-workflow}}

---

## レビュー指摘対応（PRコメント対応）

```python
def handle_pr_review_feedback(pr_number: int):
    # 1. 既存環境の再利用確認
    env_id = find_environment_by_pr(pr_number)
    
    # 2. 環境再開（または再作成）
    container-use_environment_open(environment_id=env_id)
    
    # 3. 修正実施 → push
    container-use_environment_run_cmd(
        command="git add . && git commit -m 'fix: レビュー指摘対応' && git push"
    )
    
    # 4. CI再監視
    post_pr_workflow(pr_number, env_id)
```

---

## エスカレーション条件

| 条件 | アクション |
|------|----------|
| Issue作成を拒否された | 修正を中断 |
| CI修正3回失敗 | Draft PR化、手動確認依頼 |
| PRマージ時にコンフリクト | 手動マージ依頼 |
| 環境削除3回失敗 | 手動削除依頼 |
| Regression Test作成失敗 | 再現手順を依頼 |
| 設計書と実装の大幅な乖離 | `/request-design-fix` 提案 |
| container-use環境構築失敗 | Docker状態確認 → フォールバック提案 |
| 品質レビュー3回失敗 | Draft PR作成 → ユーザー判断 |

### 品質レビュー3回失敗時

```markdown
## ⚠️ 品質レビュー基準未達（3回失敗）

### レビュー履歴
| 回数 | スコア | 主な指摘 |
|------|--------|----------|
| 1 | 7/10 | ... |
| 2 | 8/10 | ... |
| 3 | 8/10 | ... |

### Draft PR作成済み
- **PR**: #{pr_number}
- **環境**: {env_id}（保持中）

**次のステップ**:
1. **継続**: さらに修正を試行（最大2回）
2. **手動対応**: Draft PRを手動でレビュー・修正
3. **中止**: Issue再検討
```

---

## ユースケース例

### 例1: 会話から自動検出

```
User: "--timeout 30 オプションが反映されていないようです"

Sisyphus:
1. バグ報告を検出
2. Issue作成提案 → ユーザー承認
3. /implement-issues {issue_id} を内部呼び出し（Bugfix Rule適用）
4. PR作成 → CI → マージ → クリーンナップ
```

### 例2: 明示的なIssue番号指定

```
User: "Issue #64 を修正してください"

Sisyphus:
1. Issue #64 を取得
2. fix/issue-64-* ブランチ作成
3. /implement-issues 64 を内部呼び出し
```

### 例3: PRレビュー指摘対応

```
User: "PR #42 のレビュー指摘に対応してください"

Sisyphus:
1. PR #42 から Issue/環境を特定
2. 既存環境を再開
3. 修正実施 → push → CI再監視
```

---

## プラットフォーム例外

バグ修正時も `/implement-issues` と同様、プラットフォーム固有コードの例外ルールが適用。

| バグ内容 | 例外適用 | 理由 |
|---------|---------|------|
| ネイティブ通知が表示されない | 適用 | プラットフォーム固有 API |
| システムサウンド再生が失敗 | 適用 | OS オーディオ API |
| ソケット通信エラー | 不適用 | クロスプラットフォーム |

> **詳細**: [プラットフォーム例外ポリシー](../instructions/platform-exception.md)

---

## 関連ドキュメント

| スキル/ドキュメント | 参照タイミング |
|-------------------|---------------|
| {{skill:container-use-guide}} | 環境作成・管理 |
| {{skill:worktree-workflow}} | プラットフォーム固有コード |
| {{skill:ci-workflow}} | PR作成後のCI監視 |
| {{skill:pr-merge-workflow}} | PRマージ〜クリーンアップ |
| {{skill:tdd-implementation}} | テスト追加時 |
| {{skill:approval-gate}} | ユーザー承認ゲート |
| {{skill:workflow-phase-convention}} | Phase命名規約 |
| [プラットフォーム例外](../instructions/platform-exception.md) | 固有コードの修正時 |
| [設計書同期ポリシー](../instructions/design-sync.md) | 設計書更新時 |
| [テスト戦略](../instructions/testing-strategy.md) | Regression Test追加時 |

---

## まとめ

| フェーズ | 自動化内容 |
|---------|----------|
| Issue作成 | 会話から自動検出 → 作成提案 → 承認後に作成 |
| 実装 | `/implement-issues` 内部呼び出し（Bugfix Rule遵守） |
| 完了 | PR作成 → CI監視 → マージ → クリーンナップ |

**ユーザーは「バグがある」と報告するだけで、残りは全自動で完了します。**
