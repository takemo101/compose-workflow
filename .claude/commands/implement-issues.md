---
description: 指定されたGitHub Issueを実装します。TDD（テスト駆動開発）を強制し、container-use環境でクローズドな開発・テストを行います。
argument-hint: "[Issue番号] [--auto]"
---

# Issue実装コマンド (TDD + container-use)

指定されたGitHub Issueを実装します。
**TDD（テスト駆動開発）を強制**し、品質基準を満たすまでリトライします。
**container-use環境**でクローズドな開発・テストを行います。

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | ブランチ作成 | featureブランチ作成・プッシュ |
| 0.5 | 設計書存在チェック | 詳細設計書の有無確認 |
| 0.6 | 設計書参照ルール | トークン最適化のための部分参照 |
| 1 | 環境構築 | container-use環境作成・設定 |
| 2 | 申し送り確認 | 未完了事項の優先対応 |
| 3-5 | TDD実装 | Red → Green → Refactor |
| 6 | 設計不備対応 | `/request-design-fix` 実行（必要時） |
| 6.5 | 実装完了自己チェック | TODO残存・Smoke Test・到達可能性 |
| 7 | 品質レビュー | スコア9点以上、客観的基準クリア |
| 7.1 | ユーザー承認 | @.claude/skills/approval-gate/SKILL.md ※`--auto`時スキップ |
| 8 | コミット & プッシュ | git操作 |
| 9 | PR作成 | `gh pr create` |
| 10-11 | CI監視 & マージ | CI成功→自動マージ、環境削除 |
| 12 | 親Issueクローズ | 全Subtask完了時 |

> **Phase規約**: @.claude/skills/workflow-phase-convention/SKILL.md を参照

---

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--auto` | 承認ゲートをスキップし、PR作成から環境削除まで自動実行 | off |

**使用例**:
```
/implement-issues 123 --auto
/implement-issues 9,10,11 --auto
```

> **注意**: `--auto` 使用時はレビュースコア9点以上で自動的にPR作成・CI監視・マージ・環境削除まで実行します。

---

## 実装単位の原則

> **Subtaskがある場合、実装フローはIssue単位ではなくSubtask単位で実行する。**

| 状況 | 実装単位 | 実行内容 |
|------|---------|---------|
| **Subtaskあり** | **Subtask単位** | 各Subtaskごとに: ブランチ → 環境 → TDD → レビュー → PR → CI → マージ |
| **Subtaskなし** | Issue単位 | Issue全体で同様のフローを実行 |

---

## 処理方式

| 状況 | 処理方式 | 理由 |
|------|---------|------|
| **親Issue内のSubtask** | **順次実行** | 安定性重視、エラー追跡容易 |
| **複数の親Issue** | **並列実行** | 独立したIssueは並列で効率化 |

---

## 絶対ルール

> **container-use環境の使用は必須。ホスト環境での直接実装は禁止。**

| 禁止 | 正しい方法 |
|------|-----------|
| ホスト環境で `edit`/`write` ツール使用 | `container-use_environment_file_write` 使用 |
| ホスト環境で `bash git commit/push` | `container-use_environment_run_cmd` でgit操作 |
| ホスト環境で `bash cargo test` 等 | `container-use_environment_run_cmd` でテスト |
| `cu-*` ブランチから直接PR作成 | featureブランチを作成してからPR |

### プラットフォーム例外

macOS/Windows固有APIはコンテナでビルド不可の場合のみ例外適用。
詳細は [プラットフォーム例外ポリシー](../instructions/platform-exception.md) を参照。

---

## 引数

| 形式 | 例 | 処理方法 |
|------|-----|---------|
| 単一Issue | `/implement-issues 123` | Subtask自動検出 → 順次処理 |
| 複数Issue | `/implement-issues 9 10` または `9,10,11` | **並列処理** |
| 範囲指定 | `/implement-issues 9-12` | **並列処理** (9,10,11,12) |
| 親Issue | `/implement-issues 8` | **Subtask自動検出 → 順次処理** |

### Subtask自動検出

> **詳細**: @.claude/skills/subtask-detection/SKILL.md を参照

| 検出結果 | 処理 |
|---------|------|
| Subtask検出（N件） | 依存関係チェック → 順次実装 |
| Subtaskなし + 200行以下 | 単体実装 |
| Subtaskなし + 200行超 | `/decompose-issue` を案内 |

---

## 前提条件: 適切な粒度

@.claude/skills/issue-size-estimation/SKILL.md

---

## 実行プロセス

### Phase 0: ブランチ作成（Sisyphus）

> **責任者**: Sisyphus（親エージェント）。container-workerはブランチを作成しない。

```bash
# Sisyphus がホスト側でブランチ作成
git checkout main && git pull origin main
git checkout -b feature/issue-{issue_id}-{short_description}
git push -u origin feature/issue-{issue_id}-{short_description}
```

**ブランチ命名規則**:
| プレフィックス | 用途 |
|---------------|------|
| `feature/issue-{N}-*` | 機能追加 |
| `fix/issue-{N}-*` | バグ修正 |
| `refactor/issue-{N}-*` | リファクタリング |

### Phase 0.5: 設計書存在チェック

> 実装開始前に、対象Issueに対応する詳細設計書の存在を確認。

| 状況 | アクション |
|------|----------|
| 設計書なし + 小規模変更 | ユーザーに確認 → 承認されれば続行 |
| 設計書なし + 大規模変更 | 実装中断 → 詳細設計ワークフロー実行を推奨 |
| 設計書あり | 通常フローで続行 |

### Phase 0.6: 設計書参照ルール（トークン最適化）

> **禁止**: 設計書の全文読み込み
> **必須**: Subtaskに必要なセクションのみ参照（2,000トークン上限）

詳細は @.claude/skills/implement-subtask-rules/SKILL.md セクション1を参照。

### Phase 1: container-use環境構築

**`from_git_ref`でfeatureブランチを指定**して環境を作成。

```python
container-use_environment_create(
    environment_source="/path/to/repo",
    title=f"Issue #{issue_id} - {issue_title}",
    from_git_ref=f"feature/issue-{issue_id}-{short_description}"
)
```

技術スタック別設定は @.claude/skills/container-use-guide/SKILL.md を参照。

### Phase 2: 申し送り確認

Issueのコメントをスキャンし、未完了の申し送り事項があれば最優先で対応。
詳細は @.claude/skills/handover-process/SKILL.md を参照。

### Phase 3-5: TDD実装 (Red → Green → Refactor)

@.claude/skills/tdd-implementation/SKILL.md

### Phase 6: 設計不備への対応

設計の矛盾が見つかった場合は `/request-design-fix` を実行。

### Phase 6.5: 実装完了自己チェック ⚠️ 必須

> **重要**: 以下の全チェックを通過しないとPR作成に進めない。
> **詳細**: @.claude/skills/quality-review-flow/SKILL.md セクション2（客観的品質基準）を参照

| チェック項目 | アクション |
|-------------|-----------|
| TODO/unimplemented残存 | `grep -r 'todo!\|unimplemented!' src/` → 実装して解消 or Issue作成 |
| Smoke Test | `cargo run -- --help` / `npm run dev` → 起動失敗なら修正必須 |
| **到達可能性** | エントリポイントから実装コードが呼ばれているか確認 |
| **定義-使用相関** | 未使用の引数/Props/パラメータがないか確認（スタブ検出） |

> ※ 到達可能性・定義-使用相関の詳細な確認方法は @.claude/skills/quality-review-flow/SKILL.md セクション2.2, 2.3 を参照

### Phase 7: 品質レビュー & 客観的基準

> **詳細**: @.claude/skills/quality-review-flow/SKILL.md を参照

| 項目 | 基準 | アクション |
|------|------|------------|
| レビュースコア | 9-10点 | 次のチェックへ |
| 客観的基準 | 全クリア | PR作成承認リクエストへ |

### Phase 7.1: ユーザー承認ゲート

> **共通仕様**: @.claude/skills/approval-gate/SKILL.md を参照

| モード | 動作 |
|-------|------|
| **通常モード** | PR作成前にユーザー承認を待つ |
| **`--auto` モード** | レビュースコア9点以上で自動続行（承認ゲートスキップ） |

#### 通常モード時のユーザー回答

| ユーザー回答 | アクション |
|------------|----------|
| `続行` | 通常PRを作成 → Phase 8へ |
| `下書き` | Draft PRを作成 |
| `修正` + フィードバック | 指摘箇所を修正 → Phase 6へ戻る |
| タイムアウト（30分） | Draft PR自動作成、ユーザーに通知 |

#### `--auto` モード時

レビュースコア9点以上を満たした場合、Phase 8〜12を自動実行：
1. コミット & プッシュ
2. PR作成
3. CI監視 & 自動マージ
4. 環境削除
5. 親Issue自動クローズ（該当時）

### Phase 8: コミット & プッシュ

```bash
git add . && \
git commit -m "feat: {summary}

Closes #{issue_id}

- {change1}
- {change2}" && \
git push origin feature/issue-{issue_id}-{description}
```

### Phase 9: PR作成

> **重要**: PRのタイトルと本文は**日本語**で記述。

**PRタイトル形式**:
| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feat:` | 新機能 | `feat: ユーザー認証機能を追加` |
| `fix:` | バグ修正 | `fix: セッション期限切れ時のエラーを修正` |
| `refactor:` | リファクタリング | `refactor: 設定管理のコードを整理` |

### Phase 10-11: CI監視 & 自動マージ

> **詳細**: @.claude/skills/ci-workflow/SKILL.md を参照

| フェーズ | 実行者 | 処理 |
|---------|--------|------|
| Phase 10 | Sisyphus | CI監視 → 成功:マージ / 失敗:修正(3回) |
| Phase 11 | Sisyphus | 環境削除 |

### Phase 12: 親Issue自動クローズ

> 全SubtaskのPRがマージされたら、親Issueを自動でクローズ。

```bash
gh issue comment {parent_issue_id} --body "## ✅ 全Subtask完了 ..."
gh issue close {parent_issue_id} --reason completed
```

---

## 結果の最小化ルール（トークン最適化）

> **絶対ルール**: `background_output()` の結果をそのまま使用してはならない。

### 許可される結果フィールド（5フィールドのみ）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `subtask_id` | int | Subtask Issue ID |
| `pr_number` | int | 作成したPR番号 |
| `status` | string | `"merged"`, `"failed"`, `"escalated"` |
| `score` | int | レビュースコア (1-10) |
| `env_id` | string | 環境ID（削除確認用） |

### 必須実装パターン

```python
# ⛔ 禁止: 生の結果をそのまま使用
result = background_output(task_id=task_id)  # 5,000トークン消費

# ✅ 必須: 最小化関数を経由
def collect_worker_result(task_id: str) -> dict:
    raw = background_output(task_id=task_id)
    return {k: raw.get(k) for k in ["subtask_id", "pr_number", "status", "score", "env_id"]}
```

---

## エラーハンドリング

### GitHub API エラー

| 状況 | 対応 |
|------|------|
| Issue不存在（404） | エラーメッセージ表示、Issue番号確認依頼 |
| レート制限（403） | 1分待機後リトライ（最大3回） |
| ネットワークエラー | 30秒待機後リトライ（最大3回） |
| 認証エラー（401） | `gh auth login` の実行を案内 |

### 実装エラー

| 状況 | 対応 |
|------|------|
| 3回連続レビュー失敗 | Draft PRを作成して終了 |
| 設計不備 | `/request-design-fix` を実行 |
| 環境構築失敗 | `container-use_environment_config` で設定見直し |
| ブランチ作成失敗 | 既存ブランチ確認、競合解消 |

### 並列処理エラー

| 状況 | 対応 |
|------|------|
| 1つのIssueが失敗 | 他のIssueは継続、失敗分のみ報告 |
| 全Issueが失敗 | 各失敗理由を収集して報告 |
| container-workerタイムアウト | タイムアウトしたIssueをリストアップ |
| 循環依存検出 | エラー報告、手動での依存解消を依頼 |

---

## Sisyphusへの指示

@.claude/skills/sisyphus-implementation-guide/SKILL.md

---

## 参考スキル

| スキル | 用途 |
|--------|------|
| @.claude/skills/container-use-guide/SKILL.md | 環境構築・サービス統合 |
| @.claude/skills/handover-process/SKILL.md | BE↔FE間の申し送り |
| @.claude/skills/code-quality-rules/SKILL.md | 500行ルール、命名規則 |
| @.claude/skills/ci-workflow/SKILL.md | CI監視・修正・マージ |
| @.claude/skills/pr-merge-workflow/SKILL.md | PR作成〜マージ〜ロールバック |
| @.claude/skills/subtask-detection/SKILL.md | Subtask検出・依存関係 |
| @.claude/skills/issue-size-estimation/SKILL.md | Issue粒度判定・見積もり |
| @.claude/skills/tdd-implementation/SKILL.md | Red→Green→Refactor |
| @.claude/skills/quality-review-flow/SKILL.md | PR作成前品質レビュー |
| @.claude/skills/approval-gate/SKILL.md | ユーザー承認ゲート |
| @.claude/skills/implement-subtask-rules/SKILL.md | Subtask実装ルール |
| @.claude/skills/environments-json-management/SKILL.md | 環境ID管理 |
| @.claude/skills/workflow-phase-convention/SKILL.md | Phase命名規約 |
