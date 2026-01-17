# Worktree Creator - Reference

## Git Worktreeとは

Git worktreeは、同一リポジトリで複数のブランチを**同時にチェックアウト**できる機能です。

### ディレクトリ構成例

```
project/                         # メインworktree (mainブランチ)
├── .worktrees/
│   ├── issue-42-auth/           # feature/issue-42-auth ブランチ
│   └── issue-43-dashboard/      # feature/issue-43-dashboard ブランチ
```

## よくあるユースケース

### 1. 複数機能の並行開発

planモードで複数の機能を計画した場合、それぞれのworktreeで並列開発が可能。

```bash
bash .claude/skills/create-worktree/scripts/create_worktree.sh issue-42-auth
bash .claude/skills/create-worktree/scripts/create_worktree.sh issue-43-dashboard
```

### 2. ホットフィックス

メイン開発を中断せずに緊急修正が可能。

```bash
bash .claude/skills/create-worktree/scripts/create_worktree.sh hotfix-critical-bug
```

### 3. PRレビュー

自分の作業を中断せずに他のPRを確認。

```bash
git worktree add .worktrees/review-pr-123 origin/feature/some-pr
```

## Git Worktreeコマンドリファレンス

### worktree一覧表示

```bash
git worktree list
```

### worktree追加（既存ブランチ）

```bash
git worktree add <path> <branch>
```

### worktree追加（新規ブランチ）

```bash
git worktree add -b <new-branch> <path> <start-point>
```

### worktree削除

```bash
git worktree remove <worktree-path>
```

### worktree修復（ロック状態から復帰）

```bash
git worktree repair
```

### 強制削除（未コミットの変更がある場合）

```bash
git worktree remove --force <worktree-path>
```

## トラブルシューティング

### worktreeが既に存在する場合

```bash
git worktree list
git worktree remove .worktrees/<feature-name>

# 強制削除
rm -rf .worktrees/<feature-name>
git worktree prune
```

### 環境変数ファイルをコピーし忘れた場合

```bash
cp .env .worktrees/<feature-name>/
```

### ブランチが既に存在する場合

スクリプトは既存のブランチを使用してworktreeを作成します。
新規ブランチを作成したい場合は、まず既存ブランチを削除してください。

```bash
git branch -d feature/<feature-name>
```

### worktreeがロックされている場合

```bash
git worktree unlock .worktrees/<feature-name>
```

## ベストプラクティス

### 1. 命名規則

| タイプ | パターン | 例 |
|--------|---------|-----|
| Issue実装 | `issue-{number}-{desc}` | `issue-42-auth` |
| 機能追加 | `feature-{name}` | `feature-dark-mode` |
| バグ修正 | `fix-{name}` | `fix-memory-leak` |
| ホットフィックス | `hotfix-{name}` | `hotfix-critical-bug` |
| リファクタリング | `refactor-{name}` | `refactor-auth-module` |

### 2. 作業完了後のクリーンアップ

PRがマージされたら、worktreeとブランチを削除：

```bash
git worktree remove .worktrees/<feature-name>
git branch -d feature/<feature-name>
```

### 3. 定期的なpruning

不要なworktree参照を削除：

```bash
git worktree prune
```

## 環境変数ファイル一覧

このスクリプトでコピーされる環境変数ファイル：

| パス | 説明 |
|------|------|
| `.env` | ルートレベルの環境変数 |
| `.envrc` | direnv設定 |
| `.env.local` | ローカル開発用 |

## 関連ドキュメント

- [Git Worktree公式ドキュメント](https://git-scm.com/docs/git-worktree)
- [pr-and-cleanup スキル](../pr-and-cleanup/SKILL.md)
- [worktree-workflow スキル](../worktree-workflow/SKILL.md)
