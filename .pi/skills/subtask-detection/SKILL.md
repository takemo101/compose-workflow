---
name: subtask-detection
description: 親IssueからSubtaskを検出し、依存関係を考慮した実行順序（トポロジカルソート）を決定するロジック
---

# Subtask検出 & 依存関係解決

> **参照元**: 実装ワークフローから分離されたSubtask検出・依存関係解決ロジック

---

## 概要

親Issueに関連付けられたSubtaskを検出し、依存関係（Blocked by）に基づいて実装順序を決定します。

---

## 検出ロジック

### 1. Subtaskの取得

GitHub GraphQL API または Issue 本文のタスクリストからSubtaskを検出します。

**優先順位**:
1. GitHub Native Sub-issues (Hierarchy)
2. Issue本文のTask list (`- [ ] #123`)

### 2. 依存関係の取得

`github-issue-dependency` スキルを使用して、各Subtaskの依存関係を取得します。

```bash
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh list <issue>
```

### 3. トポロジカルソート

依存関係グラフを構築し、実行可能な順序にソートします。

**例**:
- S1 (Blockerなし)
- S2 (Blocked by S1)
- S3 (Blocked by S2)

**実行順序**: `[S1, S2, S3]`

---

## 並列実行判定

依存関係がない（または既に解決された）Subtask同士は並列実行が可能です。

**判定ロジック**:
- 現在のアクティブなタスク一覧を取得
- 依存先が全て「完了（Closed）」している待機タスクを抽出
- これらを並列実行候補とする

---

## 依存関係の設定

Subtask作成時に依存関係を設定するには：

```bash
# S2 は S1 にブロックされている
bash .pi/skills/github-issue-dependency/scripts/issue-dependency.sh add-blocked-by <issue> <blocking-issue>
```

---

## 循環依存の検出

トポロジカルソート時に循環依存が検出された場合、エラーを報告し、ユーザーに手動解決を求めます。
