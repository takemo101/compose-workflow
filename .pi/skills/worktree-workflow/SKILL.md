---
name: worktree-workflow
description: Git worktree を使用したホスト環境での並行開発ワークフロー。
---

# Git Worktree Workflow

Git worktree を使用して、ホスト環境で複数のブランチを並行して安全に開発するためのワークフロー。

---

## 概要

`git worktree` を使用すると、1つのリポジトリで複数のブランチを同時にチェックアウトできます。
これにより、ブランチ切り替え（`git checkout`）に伴う再ビルドやコンテキストスイッチのコストを回避できます。

### メリット

- **並行作業**: 複数のIssueを同時に進行可能
- **高速化**: ブランチ切り替え時の `node_modules` やビルドアーティファクトの再生成が不要
- **安全性**: 独立したディレクトリでの作業により、未コミットの変更が混ざらない

---

## ディレクトリ構造

```
project-root/
├── .git/
├── .worktrees/            # worktree 用ディレクトリ（.gitignoreに追加）
│   ├── issue-123/         # Issue #123 用 worktree
│   └── issue-124/         # Issue #124 用 worktree
├── src/
└── package.json
```

---

## ワークフロー詳細

### Phase 1: Worktree 作成

```bash
# create-worktree skill を使用
/create-worktree <issue_id> <branch_name>
```

**内部処理**:
1. `.worktrees/issue-<id>` ディレクトリ作成
2. `git worktree add` 実行
3. 依存関係のインストール（`npm ci`, `cargo build` 等）
4. `.env` ファイル等のコピー（必要な場合）

### Phase 2: 実装作業

作成された worktree ディレクトリ内で作業を行います。

```bash
cd .worktrees/issue-123
# 実装、テスト、コミット
git add .
git commit -m "feat: ..."
```

### Phase 3: PR作成 & クリーンアップ

開発完了後、PRを作成し、worktree を削除します。

```bash
# pr-and-cleanup skill を使用
/pr-and-cleanup <issue_id>
```

**内部処理**:
1. 変更を push
2. GitHub PR 作成
3. `git worktree remove` でディレクトリ削除
4. `git worktree prune` でメタデータ削除

---

## Worktree 管理コマンド

| アクション | コマンド | 説明 |
|------------|---------|------|
| 作成 | `/create-worktree` | 新しい worktree を作成 |
| 一覧 | `git worktree list` | 現在の worktree 一覧を表示 |
| 削除 | `/pr-and-cleanup` | 作業完了後に削除 |
| 手動削除 | `git worktree remove <path>` | 強制的に削除する場合 |

---

## 注意事項

1. **.gitignore 設定**: `.worktrees/` を必ず `.gitignore` に追加してください。
2. **ディスク容量**: 複数の worktree を作成するとディスク容量を消費します（特に `node_modules`）。
3. **ホットリロード**: 複数の worktree で同時に dev server を起動する場合、ポート競合に注意してください。

---

## 関連スキル

- `create-worktree`: Worktree 作成オートメーション
- `pr-and-cleanup`: PR作成とクリーンアップ
- `github-issue-state-management`: 環境状態管理
