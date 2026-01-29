---
name: github-issue-dependency
description: GitHub Issue間の依存関係（Is blocking / Blocked by）を設定・取得するためのAPI操作を提供
---

# GitHub Issue Dependency Management

GitHub Issueのコメントを使用して、Issue間の依存関係（Blocking / Blocked by）を管理します。
GitHub Projectのフィールドではなく、Issueコメント内のメタデータとして依存関係を記録します。

---

## 概要

Issueコメントに以下のような形式で依存関係を記録します：

```markdown
<!-- DEPENDENCY_METADATA
blocked_by: [12, 13]
blocking: [45]
-->
```

このスキルは、このメタデータの読み書きを抽象化します。

---

## 使用方法

### CLIスクリプト

```bash
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh <command> [args...]
```

### コマンド一覧

| コマンド | 引数 | 説明 |
|----------|------|------|
| `add-blocked-by` | `<issue> <blocker>` | `issue` が `blocker` にブロックされていると記録 |
| `remove-blocked-by` | `<issue> <blocker>` | 依存関係を削除 |
| `list` | `<issue>` | 依存関係（blocking/blocked_by）を表示 |
| `check-blockers` | `<issue>` | ブロッカーが全てClosedか確認（bool） |

---

## 使用例

### 依存関係の追加

Issue #10 は Issue #5 に依存している（#5 が終わらないと #10 は着手できない）。

```bash
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh add-blocked-by 10 5
```

### 依存関係の削除

```bash
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh remove-blocked-by 10 5
```

### 依存関係の確認

```bash
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh list 10
```

出力例:
```json
{
  "issue": 10,
  "blocked_by": [5],
  "blocking": [],
  "is_blocked": true
}
```

---

## 自動化連携

### `subtask-detection` スキルでの利用

親Issueを分解した際、Subtask間の順序関係を記録するために使用します。

```python
# Subtask S2 は S1 に依存
bash(f"bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh add-blocked-by {s2_id} {s1_id}")
```

### `github-issue-state-management` スキルでの利用

環境構築時やタスク開始時に、ブロッカーが残っていないかチェックします。

```bash
if $(bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh check-blockers 10); then
    # ブロッカーなし（または全て完了済み） -> 開始可能
else
    # ブロックされている
fi
```

---

## 制限事項

- 同じリポジトリ内のIssueのみサポート
- 循環依存のチェックは行っていません（使用者が注意すること）
