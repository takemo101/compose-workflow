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

| Phase | 名称 | 内容 | ラベル |
|-------|------|------|--------|
| 0 | ブランチ作成 | featureブランチ作成・プッシュ | `phase:0-branch` |
| 0.5 | 設計書存在チェック | 詳細設計書の有無確認 | - |
| 0.6 | 設計書参照ルール | トークン最適化のための部分参照 | - |
| 1 | 環境構築 | container-use環境作成・設定 | `phase:1-env` |
| 2 | 設計書参照 | 申し送り確認・設計書セクション読み込み | `phase:2-design` |
| 3 | 設計書実現性チェック | 設計の矛盾・曖昧さを検出 | `phase:3-check` |
| 4 | TDD: Red | テスト作成（失敗確認） | `phase:4-red` |
| 5 | TDD: Green | 最小実装（成功確認） | `phase:5-green` |
| 6 | TDD: Refactor | リファクタリング | `phase:6-refactor` |
| 6.5 | 実装完了自己チェック | TODO残存・Smoke Test・到達可能性 | - |
| 6.6 | 設計書整合性チェック | 設計書の全機能実装・統合確認 | - |
| 7 | 品質レビュー | スコア9点以上、客観的基準クリア | `phase:7-review` |
| 8 | ストレステスト | **任意**。スキップ可 | `phase:8-stress` |
| 9 | ユーザー承認 | @.claude/skills/approval-gate/SKILL.md ※`--auto`時スキップ | `phase:9-approval` |
| 10 | コミット & PR作成 | git操作 + `gh pr create` | `phase:10-pr` |
| 11 | CI監視 | CI成功→マージ、失敗→修正(3回) | `phase:11-ci` |
| 12 | マージ & クローズ | マージ、環境削除、親Issueクローズ | `phase:12-merge` |

> **Phase規約**: @.claude/skills/workflow-phase-convention/SKILL.md を参照

---

## オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--auto` | 承認ゲートをスキップし、PR作成から環境削除まで自動実行 | off |
| `--resume` | 既存の状態から途中再開（GitHub Issueラベルから状態を復元） | off |

**使用例**:
```
/implement-issues 123 --auto
/implement-issues 9,10,11 --auto
/implement-issues 42 --resume        # Issue #42 を途中から再開
/implement-issues 42 --resume --auto # 途中再開 + 自動完了
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

## 途中再開モード（--resume）

`--resume` オプション指定時は、新規開始ではなく既存の状態から再開します。

### 再開フロー

```bash
# 1. 復旧情報を取得
RESUME_INFO=$(bash .claude/skills/github-issue-state-management/scripts/issue-state.sh resume {issue_id})

# 2. 状態に応じてアクションを決定
# - action: reopen_environment → container-use環境を再開
# - action: resume_review → レビューループを継続
# - action: wait_approval → 承認ゲートを提示
# - action: monitor_ci → CI監視を継続
# - action: resolve_block → Blocked原因を確認して解決
```

### 再開判定マトリクス

| 現在のPhase | 再開アクション |
|------------|---------------|
| `0-branch` | 環境作成から開始（Phase 1へ） |
| `1-env`〜`6-refactor` | `environment_open` で環境再開 → 該当Phaseから継続 |
| `7-review` | 環境再開 → レビューループ継続 |
| `8-stress` | 環境再開 → ストレステスト継続 |
| `9-approval` | ユーザー承認ゲートを提示 |
| `10-pr`〜`11-ci` | CI監視を継続 |
| `12-merge` | 完了済み（何もしない） |

> **Blocked状態**: `env:blocked` の場合は、Blockedコメントの内容を確認し、問題解決後に `issue-state.sh unblock` を実行してから再開。

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

#### ラベル初期化（必須）

> **状態管理API**: @.claude/skills/github-issue-state-management/SKILL.md セクション「必須更新ポイント」を参照

ブランチ作成後、`phase:0-branch` ラベルを追加。未設定の場合は `issue-state.sh` で初期化。

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

#### ラベル更新（必須）

環境作成後、`env:active` + `phase:1-env` に更新。API は @.claude/skills/github-issue-state-management/SKILL.md を参照。

技術スタック別設定は @.claude/skills/container-use-guide/SKILL.md を参照。

### Phase 2: 申し送り確認

Issueのコメントをスキャンし、未完了の申し送り事項があれば最優先で対応。
詳細は @.claude/skills/handover-process/SKILL.md を参照。

### Phase 3: 設計書実現性チェック

> **Token最適化**: Phase 2 で取得した設計書コンテキストを使用（再読み込み禁止）
> **詳細**: @.claude/skills/implement-subtask-rules/SKILL.md セクション1.5 を参照

設計書に矛盾や曖昧さがある場合は `env:blocked` に移行し、`/request-design-fix` を実行。

### Phase 4-6: TDD実装 (Red → Green → Refactor)

@.claude/skills/tdd-implementation/SKILL.md

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

### Phase 6.6: 設計書整合性チェック ⚠️ 必須（統合漏れ防止）

> **重要**: 設計書で定義された全機能が実装・統合されていることを確認する。
> **このPhaseをスキップすると、機能が作成されても使われない「死にコード」が発生するリスクあり。**

| チェック項目 | 確認方法 | 失敗時アクション |
|-------------|---------|----------------|
| **全機能実装** | 設計書の「実装内容」セクションの全項目をチェック | 未実装機能があれば実装 |
| **呼び出し元統合** | 設計書の「呼び出し元」セクションの全統合ポイントを確認 | 統合漏れがあれば追加実装 |
| **CLIコマンド動作** | 設計書で定義されたCLIコマンドが実際に動作するか | 動作しなければ修正必須 |
| **E2E動作確認** | 設計書の主要フローがエンドツーエンドで動作するか | 動作しなければ修正必須 |

#### 詳細チェックフロー

```
1. 設計書の「実装内容」セクションを取得
     ↓
2. 各実装項目に対して:
   - 該当コードが存在するか確認 (grep/find)
   - 存在しない → ❌ 未実装として記録
     ↓
3. 設計書の「呼び出し元（Integration Points）」セクションを取得
     ↓
4. 各呼び出し元に対して:
   - 呼び出し元ファイルで実際に import/use されているか確認
   - 呼び出しコードが存在するか確認
   - 存在しない → ❌ 統合漏れとして記録
     ↓
5. 設計書で定義されたCLIコマンドがあれば:
   - 実際にコマンドを実行して動作確認
   - ヘルプ表示・基本動作・エラーハンドリングをテスト
     ↓
6. 全チェック結果を集計:
   - 未実装あり or 統合漏れあり → Phase 5 (Green) に戻って追加実装
   - 全てOK → Phase 7 (品質レビュー) へ
```

#### 設計書に「呼び出し元」セクションがない場合

> **注意**: 古い設計書には「呼び出し元」セクションがない場合があります。

| 状況 | アクション |
|------|----------|
| 「呼び出し元」セクションなし | 実装者が自ら統合ポイントを特定し、設計書に追記してから確認 |
| 統合ポイントが不明確 | `/request-design-fix` で設計書更新を依頼 |

#### 判定ルール

| 条件 | 結果 |
|------|------|
| 全機能実装 + 全統合確認 + CLI動作OK | ✅ Phase 7 へ |
| 未実装あり | ❌ Phase 5 に戻って実装 |
| 統合漏れあり | ❌ Phase 5 に戻って統合コード追加 |
| CLI動作NG | ❌ Phase 5 に戻って修正 |

> **Note**: このPhaseで問題が見つかった場合、品質レビュー（Phase 7）には進めません。

> **ラベル設計意図**: Phase 6.6 には専用ラベルを設けていません。理由:
> - NGの場合は Phase 5（`phase:5-green`）に戻るため、新たなラベルは不要
> - OKの場合は即座に Phase 7 へ進むため、中間状態を記録する必要がない
> - 外部からの状態確認では「6-refactor → 7-review」の遷移で十分

### Phase 7: 品質レビュー & 客観的基準

> **詳細**: @.claude/skills/quality-review-flow/SKILL.md を参照

| 項目 | 基準 | アクション |
|------|------|------------|
| レビュースコア | 9-10点 | 次のチェックへ |
| 客観的基準 | 全クリア | PR作成承認リクエストへ |

### Phase 8: ストレステスト（任意）

> **詳細**: @.claude/skills/stress-test-flow/SKILL.md を参照

ストレステストは任意実行。重要な機能では推奨。

**ラベル更新**: `issue-state.sh phase <issue> 8-stress`

### Phase 9: ユーザー承認ゲート

> **共通仕様**: @.claude/skills/approval-gate/SKILL.md を参照

| モード | 動作 |
|-------|------|
| **通常モード** | PR作成前にユーザー承認を待つ |
| **`--auto` モード** | レビュースコア9点以上で自動続行（承認ゲートスキップ） |

#### 通常モード時のユーザー回答

| ユーザー回答 | アクション |
|------------|----------|
| `1` | 通常PRを作成 → Phase 10へ |
| `2` + フィードバック | 指摘箇所を修正 → Phase 6へ戻る |
| `3` | Draft PRを作成 |
| タイムアウト（30分） | Draft PR自動作成、ユーザーに通知 |

> 番号を選択してください（1-3）:

**ラベル更新**: `issue-state.sh phase <issue> 9-approval`

#### `--auto` モード時

レビュースコア9点以上を満たした場合、Phase 10〜12を自動実行：
1. コミット & プッシュ & PR作成
2. CI監視 & 自動マージ
3. 環境削除
4. 親Issue自動クローズ（該当時）

### Phase 10: コミット & PR作成

```bash
git add . && \
git commit -m "feat: {summary}

Closes #{issue_id}

- {change1}
- {change2}" && \
git push origin feature/issue-{issue_id}-{description}
```

> **重要**: PRのタイトルと本文は**日本語**で記述。

**PRタイトル形式**:
| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feat:` | 新機能 | `feat: ユーザー認証機能を追加` |
| `fix:` | バグ修正 | `fix: セッション期限切れ時のエラーを修正` |
| `refactor:` | リファクタリング | `refactor: 設定管理のコードを整理` |

**ラベル更新**: `issue-state.sh pr-created <issue> <pr_number>`

### Phase 11: CI監視

> **詳細**: @.claude/skills/ci-workflow/SKILL.md を参照

| 実行者 | 処理 |
|--------|------|
| Sisyphus | CI監視 → 成功:Phase 12へ / 失敗:修正(3回) |

**ラベル更新**: `issue-state.sh phase <issue> 11-ci`

### Phase 12: マージ & クリーンアップ

| 実行者 | 処理 |
|--------|------|
| Sisyphus | PRマージ → 環境削除 → 親Issueクローズ（全Subtask完了時） |

```bash
# PRマージ
gh pr merge <pr_number> --merge

# 環境削除
# @.claude/skills/delete-environment/SKILL.md を参照

# 親Issueクローズ（全Subtask完了時）
gh issue comment {parent_issue_id} --body "## ✅ 全Subtask完了 ..."
gh issue close {parent_issue_id} --reason completed
```

**ラベル更新**: `issue-state.sh merged <issue>`

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
| @.claude/skills/github-issue-state-management/SKILL.md | 環境状態管理 |
| @.claude/skills/workflow-phase-convention/SKILL.md | Phase命名規約 |
