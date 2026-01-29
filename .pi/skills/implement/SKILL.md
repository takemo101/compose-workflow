---
name: implement
description: 指定されたGitHub Issueをworktree環境で実装する完全ワークフロー。Subtask検出からPR作成までを統括。
---

# Issue実装ワークフロー (/implement)

> **役割**: Sisyphus (Main Agent) が実行する実装のメインループ
> **環境**: Host環境 + Git Worktree

---

## 🔄 全体フロー

1. **Issue分析 & 準備**
   - 粒度チェック (200行以下?)
   - Subtask検出 (親Issueの場合 → 再帰的に実行)
   - 既存実装の確認

2. **環境構築 (Phase 1)**
   - `/create-worktree` で独立環境を作成
   - 作業ディレクトリへ移動 (`cd .worktrees/issue-XXX`)

3. **実装サイクル (Phase 2-3)**
   - **TDDサイクル**: Red → Green → Refactor
   - **品質保証**: Lint, Test, 品質レビュー (9点以上)
   - **客観的基準**: `quality-review-flow` 準拠

4. **完了 & クリーンアップ (Phase 4)**
   - ユーザー承認
   - `/pr-and-cleanup` でPR作成と環境削除

---

## 📋 Sisyphus 実行ガイド

### 1. 準備フェーズ

まず、Issueのサイズと依存関係を確認します。

- **粒度チェック**: 200行を超える場合は `/decompose-issue` を提案
- **Subtask検出**: 親Issueの場合は `/decompose-issue` を実行し、各Subtaskに対してこのワークフローを適用
- **作業開始**:
  ```bash
  /create-worktree <issue_id> <branch_name>
  ```

### 2. 実装フェーズ

**重要**: すべてのファイル操作・コマンド実行は **Worktreeディレクトリ内** で行います。

```bash
# 必ず移動してから作業
cd .worktrees/issue-<id>-<name>
```

#### TDDの実践
1. **Red**: テストケースを作成（`write` tool）
2. **Green**: テストを通す最小限の実装（`write`/`edit` tool）
3. **Refactor**: コードを整理

### 3. 品質レビューフェーズ

PR作成前に必ず品質チェックを行います。

1. **自己チェック**:
   ```bash
   # プロジェクトに応じたコマンド
   npm run lint && npm test
   # または
   cargo clippy && cargo test
   ```
2. **専門レビュアーによるレビュー**:
   - `quality-review-flow` skill を参照
   - 9点未満の場合は修正して再レビュー

### 4. 完了フェーズ

1. **承認ゲート**: ユーザーにPR作成の許可を得る
2. **PR作成と削除**:
   ```bash
   /pr-and-cleanup <issue_id>
   ```

---

## ⛔ 禁止事項

1. **メインブランチでの直接作業**: 必ずWorktreeを作成すること
2. **テストなしの実装**: TDDを原則とする
3. **レビューなしのPR作成**: 必ず品質レビューを通すこと
4. **Worktree外のファイル操作**: 誤ってルートディレクトリのファイルを書き換えないこと
