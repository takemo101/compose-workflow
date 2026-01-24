---
description: 既存の大きなIssueを適切な粒度のSubtaskに分解します。200行以下・3ファイル以下の粒度で子Issueを作成し、並列実装を可能にします。
argument-hint: "[Issue番号]"
---

# Issue分解コマンド

既存の大きなIssueを適切な粒度のSubtaskに分解します。
**200行以下・3ファイル以下**の粒度で子Issueを作成し、並列実装を可能にします。

---

## 入力

$ARGUMENTS（Issue番号）

例: `/decompose-issue 8`

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | 入力解析 | Issue番号の解析、Issue情報取得 |
| 1 | Issue分析 | 規模分析、設計書特定、コード量推定 |
| 2 | 分解計画 | Subtask分割、200行/3ファイル制約適用 |
| 3 | 依存関係解析 | Subtask間の依存関係を解析 |
| 3.5 | ユーザー確認 | 分解計画の承認（{{skill:approval-gate}}） |
| 4 | Subtask作成 | GitHub Issue作成、Sub-issue連携 |
| 4.5 | 依存関係設定 | GitHub Issue依存関係を設定（{{skill:github-issue-dependency}}） |
| 5 | 親Issue更新 | サマリーコメント追加 |

> **Phase規約**: {{skill:workflow-phase-convention}} を参照

---

## いつ使うか

| 状況 | 使用するコマンド |
|------|-----------------|
| **新規機能を設計から開始** | `/detailed-design-workflow`（設計時に適切な粒度でIssue作成） |
| **既存の大きなIssueを分割** | **`/decompose-issue`**（このコマンド） |
| **すでに適切な粒度のIssue** | `/implement-issues`（直接実装） |

---

## 分解基準

| 制約 | 上限 | 違反時のアクション |
|------|------|------------------|
| **コード量** | 200行以下 | 複数Subtaskに分割 |
| **ファイル数** | 1-3ファイル | 複数Subtaskに分割 |
| **責務** | 単一責務 | 機能ごとに分割 |
| **テスト可能性** | 独立してテスト可能 | 依存関係を整理 |

---

## 実行プロセス

### Phase 1: Issue分析

1. **Issue情報取得**: `gh issue view {issue_id} --json title,body,labels`
2. **関連設計書の特定**: Issue番号から設計書パスを検索
3. **実装項目の抽出**: 設計書から実装すべき項目をリスト化
4. **推定コード量の計算**: 各項目の行数を見積もり合計
5. **対象ファイルの特定**: 設計書からターゲットファイルを抽出
6. **分解判定**: 200行超過 OR 3ファイル超過 → 分解が必要

### Phase 2: 分解計画

1. **分解不要の場合**: そのまま1つのSubtaskとして返却
2. **分解が必要な場合**:
   - 各実装項目を順次処理
   - 現在のSubtaskが200行を超えそうなら新しいSubtaskを開始
   - 3ファイルを超えそうなら新しいSubtaskを開始
   - 関連する項目は同じSubtaskにグループ化

### Phase 3: 依存関係解析

1. **各Subtask間の依存を解析**:
   - Subtask Aが参照する型/関数がSubtask Bで定義 → A depends on B
   - DB変更を含むSubtaskは先行実行
   - 共通モジュールは最初に実装

### Phase 3.5: ユーザー確認

> **共通仕様**: {{skill:approval-gate}} を参照

**出力形式**:

```markdown
## 📋 Issue分解計画

### 親Issue
- **#{issue_id}**: {title}
- 推定コード量: {total_lines}行
- 対象ファイル: {file_count}件

### 分解が必要な理由
- {reason}（例: 推定500行で200行上限を超過）

### 作成予定のSubtask

| # | Subtask | 対象ファイル | 推定行数 | 依存 |
|---|---------|------------|---------|------|
| 1 | {subtask_1_title} | `{files}` | {lines}行 | なし |
| 2 | {subtask_2_title} | `{files}` | {lines}行 | #1 |

---
**この分解計画で進めてよろしいですか？**

1. 続行 → Subtask Issueを作成
2. 修正 → 分解計画を修正
3. カスタム指示 → 特定の分割方法を指定

> 番号を選択してください（1-3）:
```

### Phase 4: Subtask Issue作成

1. **各Subtaskに対してIssue作成**:
   - タイトル: `[#{parent_id}] N/M: {subtask_title}`
   - ラベル: `subtask,automated`
   - 本文: 概要、推定規模、対象ファイル、実装内容、完了条件、依存関係
2. **Sub-issueとして親に連携**: {{skill:github-graphql-api}} を使用
3. **エラー時のロールバック**:
   - 作成済みIssueは削除しない（有用な情報が含まれる可能性）
   - 親Issueにエラー報告と対応オプションをコメント

### Phase 4.5: 依存関係設定

> **参照スキル**: {{skill:github-issue-dependency}}

1. **依存関係の設定**:
   - Phase 3で解析した依存関係を GitHub Issue の「Blocked by」として設定
   - スクリプト: `bash .opencode/skill/github-issue-dependency/scripts/issue-dependency.sh add-blocked-by <subtask> <blocking-subtask>`

2. **設定例**:
   ```bash
   # Subtask #13 は #12 に依存（#12 が完了しないと #13 は着手不可）
   bash .opencode/skill/github-issue-dependency/scripts/issue-dependency.sh add-blocked-by 13 12
   ```

3. **エラーハンドリング**:
   - 依存関係設定の失敗は警告として記録（ワークフロー停止しない）
   - 失敗した場合は手動設定を案内

### Phase 5: 親Issue更新

1. **サマリーコメント追加**:
   - 作成されたSubtask一覧（番号、推定行数、依存、ステータス）
   - 実装開始コマンド例
---

## 完了条件

- [ ] 親Issueの分析が完了している
- [ ] 分解計画がユーザーに承認されている
- [ ] 全Subtask Issueが作成されている
- [ ] 各Subtaskが200行以下である
- [ ] 各Subtaskが3ファイル以下である
- [ ] 依存関係がIssue本文に明記されている
- [ ] 依存関係がGitHub Issue依存関係機能で設定されている
- [ ] 親Issueにサマリーがコメントされている

---

## 出力形式

```markdown
## ✅ Issue分解完了

### 親Issue
- **#{parent_id}**: {parent_title}

### 作成されたSubtask

| # | Subtask | 推定行数 |
|---|---------|---------|
| #{id_1} | {title_1} | {lines_1}行 |
| #{id_2} | {title_2} | {lines_2}行 |
| #{id_3} | {title_3} | {lines_3}行 |

### 次のステップを選択してください

1. 実装に進む（`/implement-issues {id_1} {id_2} {id_3}`）
2. Subtask構成を修正する
3. 一旦終了する

> 番号を選択してください（1-3）:

### 実行順序

| Phase | Subtask | 依存 |
|-------|---------|------|
| 1 | #{id_1} | なし |
| 2 | #{id_2}, #{id_3} | #{id_1} |
```

---

## Sisyphusへの指示

1. **Issue分析** → 分解不要なら報告して終了
2. **分解計画作成** → 依存関係も解析
3. **ユーザー確認** → 承認ゲートで計画を提示
4. **Subtask Issue作成** → エラー時はロールバック報告
5. **依存関係設定** → {{skill:github-issue-dependency}} を使用してGitHub Issue依存関係を設定
6. **完了報告** → 番号選択形式で次のステップを提示
