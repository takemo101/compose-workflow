# リファレンス: pr-and-cleanup

worktree での開発完了後に PR を作成し、worktree を自動削除する。ローカル/リモートブランチは保持。

## コマンド構文

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh [OPTIONS]
```

**注意**: このスクリプトは **worktreeディレクトリ内で実行** する必要があります。

### オプション

| オプション | 説明 |
|------------|------|
| `--title "..."` | PRのタイトルを指定（対話モードをスキップ） |
| `--body "..."` | PRの本文を指定（対話モードをスキップ） |
| `--draft` | ドラフトPRとして作成 |
| `--base <branch>` | ベースブランチを指定（デフォルト: デフォルトブランチ） |
| `--pr-only` | PR作成のみ行い、worktree削除をスキップ |
| `--cleanup-only` | worktree削除のみ行う（PR作成済みの場合） |
| `--force` | 未コミットの変更があっても強制実行（非推奨） |

## 使用例

### 基本（対話モード）

```bash
cd .worktrees/issue-42-auth
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh
```

タイトルと本文の入力を求められます。

### タイトル・本文指定

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh \
  --title "feat: Add authentication" \
  --body "Closes #42. Implemented JWT auth."
```

### ドラフトPR

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh --draft
```

### PR作成のみ（削除しない）

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh --pr-only
```

### クリーンアップのみ（後で実行）

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh --cleanup-only
```

### ベースブランチ指定

```bash
bash ../../.pi/skills/pr-and-cleanup/scripts/pr_and_cleanup.sh --base develop
```

## トラブルシューティング

### "Not inside a git worktree" エラー

スクリプトは git worktree 内で実行する必要があります。
`git rev-parse --is-inside-work-tree` が true を返す場所で実行してください。
メインの作業ツリー（ルートディレクトリ）では実行できません。

### "Uncommitted changes detected" エラー

未コミットの変更がある場合、安全のため停止します。
変更をコミットするか、stash してから再実行してください。

### worktree削除に失敗する

何らかのプロセスがディレクトリを使用中の可能性があります。
ターミナルを worktree ディレクトリの外に移動してから、手動で削除してください：

```bash
cd ../..  # プロジェクトルートへ
git worktree remove .worktrees/<feature-name>
```

## 関連スキル

- `create-worktree`: worktree作成
