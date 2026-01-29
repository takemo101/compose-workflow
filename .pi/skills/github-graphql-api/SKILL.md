---
name: github-graphql-api
description: GitHub REST APIのSub-issue関連バグを回避するためのGraphQL API共通処理（Sub-issue登録、エラーハンドリング）を提供
---

# GitHub GraphQL API Utilities

GitHub REST APIではまだサポートが不完全な機能（特にSub-issue関連）を補完するためのGraphQL APIラッパー。

---

## 概要

GitHubのProject V2やSub-issue機能はREST APIでの操作が難しい場合があるため、GraphQL API (`gh api graphql`) を使用して操作を行うスクリプト群を提供します。

---

## 機能一覧

### Sub-issue 追加

親Issueに子Issue（Sub-issue）を追加します。

**スクリプト**: `scripts/add-sub-issue.sh`

**使用方法**:
```bash
bash .pi/skills/github-graphql-api/scripts/add-sub-issue.sh <parent-issue> <child-issue>
```

**例**:
```bash
bash .pi/skills/github-graphql-api/scripts/add-sub-issue.sh 10 42
```

**動作**:
1. 親Issueと子IssueのNode IDを取得
2. `addSubIssue` GraphQL mutationを実行
3. 結果（成功/失敗）をJSONで出力

### エラーハンドリング

- Issueが見つからない場合
- 既にSub-issueとして登録されている場合
- 権限不足の場合

これらを検出し、適切な終了コードとメッセージを返します。

---

## 依存関係

- `gh` CLI (GitHub CLI)
- `jq` (JSON processor)

---

## 制限事項

- GitHub CLIが認証済みであること (`gh auth login`)
- Sub-issue機能が有効なリポジトリであること
