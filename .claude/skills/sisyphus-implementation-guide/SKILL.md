---
name: sisyphus-implementation-guide
description: Sisyphus専用の実装フロー、Subtask処理、Phase別責任分担、チェックリスト、完了報告フォーマットを定義
---

# Sisyphusへの指示（必読）

> **参照元**: implement-issues.md から分離されたSisyphus専用実行指示
> **このセクションはSisyphus専用の実行指示です。上記ルールの要約版。**

---

## 🔄 実装フロー

```
1. Issue受領
     ↓
2. 【単一Issue指定時】Subtask自動検出 ★重要★
     ├─ Subtaskあり → Step 3へ（Subtask単位で実装）
     └─ Subtaskなし → 粒度チェックへ（Step 4へ）
     ↓
3. 粒度チェック（200行以下か?）
     ├─ No（大きい）→ `/decompose-issue` を実行してから再度呼び出し
     └─ Yes（適切）→ 実装開始
     ↓
4. 各Subtaskを順次実装（container-worker）
     ※ 各Subtaskが独立した実装フローを実行:
        ブランチ → 環境 → TDD → レビュー(9点以上までループ) → PR
     ↓
5. CI監視 → マージ（各PR単位）
     ↓
6. 次のSubtaskへ（Step 4に戻る）
     ↓
7. 全Subtask完了 → 親Issue自動クローズ
```

---

## 実装フローの単位

| 状況 | 実装単位 | 作成されるもの |
|------|---------|---------------|
| Subtaskなし | Issue単位 | 1ブランチ、1環境、1レビューループ、1PR |
| Subtaskあり | **Subtask単位** | **N個のブランチ、N個の環境、N個のレビューループ、N個のPR** |

---

## 各Subtaskで実行される完全フロー

```
Subtask #N:
  ブランチ作成 → container-use環境
       ↓
  TDD実装 (Red → Green → Refactor)
       ↓
  品質レビュー ←──────┐
       ↓             │
  9点以上? ──No────→ 修正（最大3回）
       ↓ Yes
  ユーザー承認
       ↓
  PR作成 → CI監視 → マージ → 環境削除
       ↓
  ✅ このSubtask完了 → 次のSubtaskへ
```

---

## ⚡ Subtask自動検出（単一Issue指定時は必須）

> **⚠️ 重要**: Subtaskがある場合、**各Subtaskごとに独立したfeatureブランチ・container-use環境・PR**を作成する。

詳細は [Subtask検出 & 依存関係解決](./subtask-detection.md) を参照。

---

## 粒度判定（実装開始前に必須）

| 推定コード量 | 対応 |
|-------------|------|
| **200行以下** | → そのまま実装 |
| **200行超** | → **`/decompose-issue` で分割してから再実行** |

詳細は [Issue粒度判定](./issue-size-estimation.md) を参照。

---

## 実装フロー（分岐条件）

| 状況 | 処理方法 | 作成されるもの |
|------|---------|---------------|
| **Subtaskあり** | 各Subtask単位で**順次**実装 | Subtask数 × (ブランチ + 環境 + PR) |
| **Subtaskなし + 200行以下** | Issue単位で直接実装 | 1ブランチ + 1環境 + 1PR |
| **Subtaskなし + 200行超** | `/decompose-issue` で分割 | - |
| **複数親Issue指定** | 各親Issue単位で**並列**実装 | 親Issue数 × (Subtask数 × ブランチ + 環境 + PR) |

---

## Phase別の責任分担（SSOT）

> **Note**: 以下のフローは**Issue単位でもSubtask単位でも同一**。
> **この表がPhase責任の唯一の定義（Single Source of Truth）です。**

### 責任分担マトリクス

| Phase | 実行者 | 内容 | 入力 | 出力 | Token消費 |
|-------|--------|------|------|------|-----------|
| **0** | Sisyphus | Subtask検出 & ブランチ作成 | Issue ID | branch_name, subtask_list | 低 |
| **1** | container-worker | 環境構築 | branch_name | env_id | 低 |
| **2** | container-worker | 設計書参照（マトリクス使用） | task_type | context (必須セクションのみ) | **中**（最適化済） |
| **3** | container-worker | **設計書実現性チェック** | context | **OK/NG** | 低 |
| **4** | container-worker | TDD: テスト作成（Red） | context, test_spec | test_files | 中 |
| **5** | container-worker | TDD: 実装（Green） | test_files | impl_files | 中 |
| **6** | container-worker | TDD: リファクタ | impl_files | impl_files (refined) | 低 |
| **6.5** | container-worker | **実装完了自己チェック** | impl_files | **到達可能性/定義-使用相関 OK/NG** | 低 |
| **7** | container-worker | 品質レビュー依頼 | impl_files | review_result | 低（レビュアーがトークン消費） |
| **8** | container-worker | TODO駆動再実装（必要時） | review_todo_file | impl_files (fixed) | **低**（TODO参照のみ） |
| **9** | container-worker | **ストレステスト（任意）** | impl_files | stress_report | 中（重要機能のみ） |
| **10** | container-worker | ユーザー承認依頼 | review_score | approval | 低 |
| **11** | container-worker | PR作成 | approval | pr_number | 低 |
| **12** | Sisyphus | CI監視 | pr_number | ci_status | 低 |
| **13** | Sisyphus | マージ & 環境削除 | ci_status, env_id | merged | 低 |
| **14** | Sisyphus | 親Issueクローズ | all_subtasks_done | closed | 低 |

### Token消費の最適化ポイント

| Phase | 最適化手法 | 効果 |
|-------|-----------|------|
| Phase 2 | 設計書参照マトリクス（必須セクションのみ） | 60-70%削減 |
| Phase 3 | **設計書実現性チェック**（Gate） | **手戻り防止**（無限Token消費回避） |
| Phase 6.5 | **実装完了自己チェック**（到達可能性/定義-使用相関） | **統合漏れ/スタブ残存防止** |
| Phase 8 | TODO駆動再実装（TODOファイルのみ参照） | 60-70%削減 |
| Phase 9 | ストレステスト（読み取り専用エージェント並列） | 単一エージェント比50%削減 |
| Phase 7, 10 | Sisyphusからworkerへの委譲 | メインエージェントのコンテキスト維持 |

### 責任境界（厳格）

| 操作 | Sisyphus | container-worker |
|------|----------|------------------|
| Subtask検出 | ✅ | ❌ |
| ブランチ作成 | ✅ | ❌ |
| 環境作成/操作 | ❌ | ✅ |
| ファイル読み書き | ❌ | ✅ |
| テスト実行 | ❌ | ✅ |
| レビュー依頼 | ❌ | ✅ |
| PR作成 | ❌ | ✅ |
| CI監視 | ✅ | ❌ |
| マージ | ✅ | ❌ |
| 環境削除 | ✅ | ❌ |

**⛔ 違反禁止**: container-workerがSisyphusの責任を実行すること、またはその逆。

---

## Subtask順次実装時の全体像

```
Sisyphus (親エージェント)
│
├── Subtask #9 を処理
│   ├── Phase 0: ブランチ作成 (feature/issue-9-data-types)
│   ├── Phase 1-9: container-worker → 実装 → PR #25
│   └── Phase 10-11: CI監視 → マージ → 環境削除
│       ↓ (完了後)
├── Subtask #10 を処理
│   ├── Phase 0: ブランチ作成 (feature/issue-10-timer-engine)
│   ├── Phase 1-9: container-worker → 実装 → PR #26
│   └── Phase 10-11: CI監視 → マージ → 環境削除
│       ↓ (完了後)
└── Phase 12: 全Subtask完了 → 親Issue自動クローズ
```

---

## ⛔ 必須チェックリスト

### 実装前チェック
```
□ 【単一Issue指定時】Subtask検出を実行したか? ★最優先★
□ Issue粒度チェック（200行以下か?）
□ 大きい場合は `/decompose-issue` を案内したか?
```

### 実装中チェック
```
□ 【Subtaskあり】各Subtaskに独立したfeatureブランチを作成したか? ★重要★
□ 【Subtaskあり】各Subtaskに独立したcontainer-use環境を作成したか? ★重要★
□ 【Subtaskあり】各Subtaskで独立したレビューループを実行したか? ★重要★
□ 【Subtaskあり】各Subtaskに独立したPRを作成したか? ★重要★
□ 【レビュー】各Subtaskが9点以上を獲得するまでループしたか?
□ background_task を使用しているか?（⛔ task 禁止）
□ Subtaskは順次処理しているか?（1つ完了してから次へ）
```

### 機能完了チェック（PRマージ後の再確認）

> **重要**: Phase 6.5 で既にチェック済みだが、PRマージ後に再確認を推奨。
> **詳細**: {{skill:quality-review-flow}} セクション2（客観的品質基準）を参照

| チェック | 確認方法 | 必須 |
|---------|---------|------|
| **到達可能性** | エントリポイントからの参照確認（Phase 6.5で実施済み） | 再確認推奨 |
| **定義-使用相関** | 未使用の引数/Props/パラメータがないこと（Phase 6.5で実施済み） | 再確認推奨 |
| **Smoke Test** | `cargo run` / `npm run dev` で基本動作確認 | ✅ |
| Epic紐付け | Epic Issue の機能リスト（F-XXX）に完了マーク | 推奨 |

```
□ 【Smoke Test】アプリケーションが正常に起動・動作するか?
□ 全Subtask完了後、親Issueをクローズしたか?
```

---

## ツール使用ルール

| 操作 | 使用ツール | 備考 |
|------|-----------|------|
| container-worker起動 | `background_task` | ⛔ `task` 禁止（MCPツール継承されない） |
| 品質レビュー起動 | `task` | ✅ OK（レビューエージェントはMCP不要） |
| ファイル操作 | `container-use_environment_file_*` | ⛔ `edit`/`write` 禁止 |
| コマンド実行 | `container-use_environment_run_cmd` | ⛔ `bash` でのテスト/ビルド禁止 |
| CI監視・マージ | `bash` (gh コマンド) | ✅ OK（環境外のGitHub API操作） |
| 環境クリーンアップ | `delete_env.sh` (delete-environment skill) | ✅ OK（Sisyphusが実行） |
| 親Issueクローズ | `bash` (gh issue close) | 全Subtask完了後 |

---

## ⛔ よくある間違い

| ❌ 間違い | ✅ 正しい方法 |
|----------|-------------|
| **単一Issue指定時にSubtask検出をスキップ** | **必ず `detect_subtasks()` を実行** |
| 親IssueをそのままSubtaskなしで実装開始 | まずSubtask検出 → なければ粒度チェック |
| **Subtask全体で1つのブランチを共有** | **各Subtaskごとに独立したfeatureブランチを作成** |
| **Subtask全体で1つのPRを作成** | **各Subtaskごとに独立したPRを作成** |
| **Subtask全体で1つのcontainer-use環境を共有** | **各Subtaskごとに独立した環境を作成** |
| **レビューをスキップしてPR作成** | **各Subtaskで9点以上になるまでレビューループ** |
| **レビュー1回で諦めてPR作成** | **最大3回までリトライ、それでも失敗ならDraft PR** |
| 大きなIssueをそのまま実装 | `/decompose-issue` で分割してから実装 |
| `task(subagent_type="container-worker", ...)` | `background_task(agent="container-worker", ...)` |
| Subtaskを並列実行 | Subtaskは順次実行（1つ完了してから次へ） |
| 全Subtask完了後、親Issueを放置 | 必ず自動クローズ処理を実行 |

---

## 完了報告フォーマット

```markdown
## 📋 実装完了サマリー

### 親Issue
- **#{parent_id}**: {parent_title} → ✅ Closed

### Subtask結果

| Subtask | ブランチ | 環境ID | レビュー | PR | CI | マージ |
|---------|---------|--------|---------|-----|-----|-------|
| #{s1} | feature/issue-{s1}-xxx | env-aaa | 10/10 (1回目) | PR #{p1} | ✅ | ✅ |
| #{s2} | feature/issue-{s2}-xxx | env-bbb | 9/10 (2回目) | PR #{p2} | ✅ | ✅ |

### 統計
- 総Subtask数: N
- 成功: N
- 失敗: 0
- レビュー平均スコア: X.X/10

### 環境クリーンアップ
- ✅ env-aaa 削除済み
- ✅ env-bbb 削除済み
```
