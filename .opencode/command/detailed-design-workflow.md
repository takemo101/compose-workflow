# 詳細設計・完全ワークフロー (v2.9)

基本設計書を入力として、詳細設計書を作成し、モックアップ生成とテスト設計までを一貫して行うワークフロー。

## 入力

$ARGUMENTS（基本設計書のパス）

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | ドキュメント計画 | 機能分解、ドキュメント一覧作成、ユーザー確認 |
| 0.5 | 影響分析 | 既存設計書・Issue・コードとの整合性確認（追加仕様時） |
| 1 | 設計書作成 | 詳細/BE/FE/画面/共通設計書の作成 |
| 1.5 | 検証 & モックアップ | ASCII禁止チェック、HTML作成、スクリーンショット |
| 2 | 品質保証ループ | detailed-design-reviewer によるレビュー（9点以上） |
| 2.5 | ユーザー承認 | {{skill:approval-gate}} |
| 3 | 成果物作成 | テスト項目書、Epic/子Issue作成、Sub-issue連携 |

> **Phase規約**: {{skill:workflow-phase-convention}} を参照

---

## Phase 0: ドキュメント計画

1. 基本設計書を分析し、必要なサブ機能とドキュメントを特定
2. 機能タイプに応じて必須ドキュメントを判定（下表参照）
3. ドキュメント一覧をユーザーに提示し承認を得る

### 機能タイプ別 必須設計書

| 機能タイプ | 詳細設計書 | BE | FE | 画面設計書 |
|-----------|:----------:|:--:|:--:|:----------:|
| 画面あり機能 | O | O | O | O |
| API専用機能 | O | O | - | - |
| バッチ処理 | O | O | - | - |

### 共通設計書（機能群ごとに1つ）

| 設計書 | 必須 |
|--------|:----:|
| データベース設計書.md | O |
| インフラ設計書.md | O |
| セキュリティ設計書.md | O |

---

## Phase 0.5: 影響分析【追加仕様時】

> **トリガー**: 既存の詳細設計書・Issue・コードが存在する場合

| チェック項目 | 確認内容 |
|-------------|---------|
| API互換性 | 既存APIシグネチャを破壊しないか |
| 型定義互換性 | 既存の型定義と矛盾しないか |
| 依存Issue | 新規Issueが既存Issueに依存するか |
| 既存モジュール | `src/` のどのファイルを変更するか |

**ユーザー確認オプション**: `続行` / `調整` / `中断`

---

## Phase 1: 設計書作成

`detailed-design-writer` エージェントが各サブ機能に対して設計書を作成。

> **テンプレート**: {{skill:detailed-design-templates}} を参照

---

## Phase 1.5: 検証 & モックアップ

### ASCII禁止チェック（BLOCKING）

```bash
grep -r -l '┌\|┐\|└\|┘\|│\|─' docs/designs/detailed/{機能名}/**/画面設計書.md
# → 0件であること
```

### モックアップ生成

> **ツール**: {{skill:wireframe-generator}} を使用

1. 画面設計書から Wireframe DSL を生成
2. `bun run generate.ts` で `mockup.html` 等を生成
3. Playwrightでスクリーンショット撮影
4. 画面設計書に画像埋め込み

**生成対象**:
- `mockup.html` (Desktop)
- `mockup-mobile.html` (Mobile, 固定幅375px)
- `mockup-error.html`

---

## Phase 2: 品質保証ループ

| 条件 | アクション |
|------|----------|
| スコア >= 9 & FE設計書あり | Phase 2.5へ |
| スコア < 9 | Phase 1に戻り修正（最大3回） |
| スコア悪化 | 即時中断 |

---

## Phase 2.5: ユーザー承認ゲート

> **共通仕様**: {{skill:approval-gate}} を参照

---

## Phase 3: 成果物作成 & Issue化

### ⚠️ 責任分離（重複防止）

| ステップ | 担当 | 成果物 | 制約 |
|---------|------|--------|------|
| 3.1 テスト項目書作成 | `test-spec-writer` | `.md` ファイルのみ | **Issue作成禁止** |
| 3.2 Epic Issue作成 | メインエージェント | GitHub Issue | 重複チェック必須 |
| 3.3 子Issue作成 | メインエージェント | GitHub Issue | 重複チェック必須 |
| 3.4 ドキュメントIssue | メインエージェント | GitHub Issue | 重複チェック必須 |
| 3.5 Sub-issue連携 | メインエージェント | GraphQL API | - |

### Issue粒度ルール

| 制約 | 上限 |
|------|------|
| コード量 | 200行以下 |
| ファイル数 | 1-3ファイル |
| 責務 | 単一責務 |

### 作成フロー

#### Step 3.1: テスト項目書作成

`test-spec-writer` エージェントに以下を指示：

```
MUST DO:
- テスト項目書を {出力パス} に作成する
- 設計書のテスト観点を網羅する

MUST NOT DO:
- GitHub Issue を作成しない（Issue作成は後続ステップで行う）
- gh コマンドを実行しない
- 設計書内の TASK-XXX を Issue 化しない
```

#### Step 3.2-3.4: Issue作成（重複チェック必須）

```bash
# Issue作成前に既存Issueを確認
gh issue list --repo $REPO --search "{機能ID}" --json number,title

# 重複がなければ作成
gh issue create --title "..." --body "..."
```

#### Step 3.5: Sub-issue連携

> **GraphQL API**: {{skill:github-graphql-api}} を参照

> **テンプレート**: {{skill:detailed-design-templates}} を参照

---

## チェックリスト

### Phase 1 完了条件

- [ ] 全サブ機能に `詳細設計書.md` が存在
- [ ] 全サブ機能に `バックエンド設計書.md` が存在
- [ ] 画面機能に `画面設計書.md` と `フロントエンド設計書.md` が存在
- [ ] 共通フォルダに DB/インフラ/セキュリティ設計書が存在

### Phase 1.5 完了条件

- [ ] ASCII罫線チェック: 0件
- [ ] 全画面に mockup.html / mockup-mobile.html / mockup-error.html が存在

### Phase 3 完了条件

- [ ] Epic Issueが作成されている
- [ ] 各子Issueが200行以下・3ファイル以下
- [ ] 依存関係がMermaid形式で記述されている
- [ ] 子IssueがEpicのSub-issueとして登録されている
- [ ] ドキュメント更新IssueがSub-issueとして登録されている

---

### Phase 3.5: 次ステップ選択【必須】

> **共通仕様**: {{skill:approval-gate}} の「ワークフロー完了後の次ステップ選択」を参照

Issue作成完了後、以下の選択肢を提示してユーザーの応答を待つ。

```markdown
---
## ✅ ワークフロー完了: 詳細設計

### 成果物サマリー
| 項目 | 結果 |
|------|------|
| 最終スコア | {score}/10点 |
| 成果物 | `docs/designs/detailed/{機能名}/` |
| Epic Issue | #{epic_issue_number} |
| 子Issue数 | {count}件 |
| ステータス | 合格 ✅ |

### 次のステップを選択してください

1. 実装に進む（`/implement-issues`）
2. 詳細設計書を修正する（指摘箇所をコメントしてください）
3. 一旦終了する

> 番号を入力してください（1-3）:
---
```

**ユーザー回答と対応:**

| 回答 | アクション |
|-----|----------|
| `1` | `/implement-issues` を自動実行（Epicの子Issueを順次実装） |
| `2` | ユーザーの指摘を待ち、修正後に再レビュー |
| `3` | ワークフロー終了。Epic Issueへのリンクと次回再開方法を提示 |

**重要**: ユーザーからの応答があるまで次のアクションを実行しない。

---

## サーキットブレーカー

| 状況 | アクション |
|------|----------|
| モックアップ生成失敗 | placeholder.png を置いて続行、警告を残す |
| FE設計書欠落 | Phase 3で検出してPhase 1に戻る |
| レビュー3回失敗 | 中断、ユーザーにエスカレーション |

---

## 参考スキル

| スキル | 用途 |
|--------|------|
| {{skill:detailed-design-templates}} | 設計書・Issueテンプレート |
| {{skill:approval-gate}} | ユーザー承認ゲート |
| {{skill:workflow-phase-convention}} | Phase命名規約 |
| {{skill:github-graphql-api}} | Sub-issue登録 |
| {{skill:design-document-types}} | 設計書タイプ判定 |
| {{skill:wireframe-generator}} | Phase 1.5 モックアップ生成 |

---

## 変更履歴

| バージョン | 変更内容 |
|-----------|---------|
| v2.10 | Phase 3の責任分離明確化（Issue重複作成防止）、test-spec-writerへのMUST NOT DO追加 |
| v2.9 | ドキュメント更新Issue自動作成 |
| v2.8 | Sub-issue登録をGraphQL APIに変更 |
| v2.7 | Sub-issue連携の自動化 |
| v2.6 | 既存システム影響分析の追加 |
| v2.5 | ASCII自動検証の追加 |
| v2.4 | ドキュメント計画フェーズ追加 |
| v2.3 | 画面設計書からASCII禁止 |
| v2.2 | フロントエンド設計書必須化 |
