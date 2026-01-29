# リファレンス: create-worktree

Git worktree を作成し、並行開発用の独立したブランチ環境を構築します。

## コマンド構文

```bash
bash .pi/skills/create-worktree/scripts/create_worktree.sh <feature-name>
```

### 引数

| 引数 | 必須 | 説明 | 例 |
|------|------|------|----|
| `feature-name` | Yes | 機能名（ブランチ名とディレクトリ名に使用） | `issue-42-auth`, `feature/new-ui` |

## 使用例

### 通常の機能開発

```bash
bash .pi/skills/create-worktree/scripts/create_worktree.sh issue-42-auth
```

これにより以下が実行されます：
1. `feature/issue-42-auth` ブランチを作成（または既存をチェックアウト）
2. `.worktrees/issue-42-auth/` ディレクトリを作成
3. 必要な環境設定ファイルをコピー

### 別のIssueと並行作業

```bash
bash .pi/skills/create-worktree/scripts/create_worktree.sh issue-43-dashboard
```

既存の `issue-42-auth` worktree に影響を与えることなく、新しい独立した環境を作成します。

### 緊急バグ修正

```bash
bash .pi/skills/create-worktree/scripts/create_worktree.sh hotfix-critical-bug
```

## トラブルシューティング

### "already exists" エラー

ディレクトリが既に存在する場合、スクリプトはエラーで停止します。
手動でディレクトリを削除するか、`git worktree prune` を実行してください。

```bash
rm -rf .worktrees/existing-dir
git worktree prune
```

### 環境変数がコピーされない

ルートディレクトリに `.env` ファイルが存在することを確認してください。
存在しない場合、コピー処理はスキップされます。
