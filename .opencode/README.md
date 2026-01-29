# OpenCode ワークフロー概要

このディレクトリには、ソフトウェア設計の自動化ワークフローが定義されています。

> **Quick Reference**: [CONTEXT_SLIM.md](./CONTEXT_SLIM.md) - 軽量コンテキスト（トークン最適化用）
> **Skill Index**: [SKILL_INDEX.md](./skill/SKILL_INDEX.md) - スキル遅延読み込みガイド

## ワークフロー全体図

```mermaid
flowchart TB
    subgraph title["OpenCode 設計自動化パイプライン"]
        direction TB
        
        %% 入力
        IDEA[("アイデア・メモ<br/>docs/memos/")]
        
        %% 要件定義ワークフロー
        subgraph REQ["/req-workflow<br/>要件定義完全ワークフロー"]
            direction TB
            REQ1["コンテキスト収集"]
            REQ05{"Phase 0.5<br/>既存要件確認"}
            REQ2["要件定義書作成<br/>@req-writer"]
            REQ3{"レビューループ<br/>@req-reviewer<br/>最大5回"}
            REQ_OUT[["REQ-XXX.md<br/>8点以上"]]
            
            REQ1 --> REQ05
            REQ05 -->|"追記/新規"| REQ2
            REQ05 -->|"中断"| REQ_ABORT(("中断"))
            REQ2 --> REQ3
            REQ3 -->|"不合格"| REQ2
            REQ3 -->|"合格"| REQ_OUT
        end
        
        %% 技術キャッチアップワークフロー
        subgraph TECH["/tech-catchup-workflow<br/>技術キャッチアップ"]
            direction TB
            TECH1["調査対象特定<br/>優先度付け"]
            TECH2["最新情報収集<br/>@librarian"]
            TECH3["技術調査レポート作成"]
            TECH_OUT[["TECH-XXX.md<br/>技術調査レポート"]]
            
            TECH1 --> TECH2 --> TECH3 --> TECH_OUT
        end
        
        %% 基本設計ワークフロー
        subgraph BASIC["/basic-design-workflow<br/>基本設計完全ワークフロー"]
            direction TB
            BASIC05A{"Phase 0.5-A<br/>技術スタック<br/>ヒアリング"}
            BASIC05B{"Phase 0.5-B<br/>既存設計書確認"}
            BASIC1["技術スタック検証<br/>未定義は I-XXX"]
            BASIC2["基本設計書作成<br/>@basic-design-writer"]
            BASIC3{"レビューループ<br/>@basic-design-reviewer<br/>最大3回"}
            BASIC4["詳細設計準備<br/>フォルダ構造作成"]
            BASIC_OUT[["BASIC-XXX.md<br/>9点以上"]]
            
            BASIC05A --> BASIC05B
            BASIC05B -->|"統合/新規"| BASIC1
            BASIC05B -->|"中断"| BASIC_ABORT(("中断"))
            BASIC1 --> BASIC2 --> BASIC3
            BASIC3 -->|"不合格"| BASIC2
            BASIC3 -->|"合格"| BASIC4 --> BASIC_OUT
        end
        
        %% 詳細設計ワークフロー
        subgraph DETAIL["/detailed-design-workflow<br/>詳細設計完全ワークフロー"]
            direction TB
            DETAIL05{"Phase 0.5<br/>既存Issue・<br/>コードベース確認"}
            DETAIL1["機能分析<br/>画面/API/DB/外部連携"]
            DETAIL2["設計書作成<br/>@detailed-design-writer<br/>BE/FE/画面/DB/インフラ等"]
            DETAIL3["モックアップ生成<br/>Playwright<br/>【必須】"]
            DETAIL4{"レビューループ<br/>@detailed-design-reviewer<br/>最大3回"}
            DETAIL5["テスト項目書<br/>@test-spec-writer"]
            DETAIL6["Issue作成<br/>GitHub Issue化"]
            DETAIL_OUT[["詳細設計書群<br/>+ テスト項目書<br/>+ GitHub Issues"]]
            
            DETAIL05 -->|"続行/調整"| DETAIL1
            DETAIL05 -->|"中断"| DETAIL_ABORT(("中断"))
            DETAIL1 --> DETAIL2 --> DETAIL3 --> DETAIL4
            DETAIL4 -->|"不合格"| DETAIL2
            DETAIL4 -->|"合格"| DETAIL5 --> DETAIL6 --> DETAIL_OUT
        end
        
        %% 実装ワークフロー
        subgraph IMPL["/implement-issues<br/>実装ワークフロー"]
            direction TB
            I_START("Issue選択<br/>⚡ 複数指定で並列処理")
            I_DESIGN{"📋 設計書確認"}
            I_ENV["🐳 container-use<br/>環境構築"]
            I_SVC["サービス追加<br/>(DB/Redis等)"]
            I_TEST["🔴 テスト実装<br/>(Red)"]
            I_CODE["🟢 実装<br/>(Green)"]
            I_REF["🔵 リファクタリング"]
            I_CHECK{"品質検証<br/>AI Review<br/>9点以上"}
            I_APPROVE{"👤 ユーザー承認<br/>PR作成許可"}
            I_PR["🔀 PR作成"]
            
            I_START --> I_DESIGN
            I_DESIGN -->|"存在"| I_ENV
            I_DESIGN -->|"不在"| DESIGN_FIX
            I_ENV --> I_SVC --> I_TEST --> I_CODE --> I_REF --> I_CHECK
            I_CHECK -->|"修正"| I_CODE
            I_CHECK -->|"OK"| I_APPROVE
            I_APPROVE -->|"承認"| I_PR
            I_APPROVE -->|"却下"| I_CODE
        end

        %% フィードバックループ
        I_CODE -.->|"❌ 設計不備検知"| DESIGN_FIX>"設計修正リクエスト<br/>(Design Fix)"]
        DESIGN_FIX -.-> DETAIL

        %% 人間による承認ゲート
        PR_REVIEW{"👤 ユーザー/メンテナー<br/>レビュー"}
        MERGE(("マージ & デプロイ"))
        
        I_PR --> PR_REVIEW
        PR_REVIEW -->|"Approve"| MERGE
        PR_REVIEW -->|"Request Changes"| I_CODE
        
        %% フロー接続
        IDEA --> REQ
        REQ_OUT --> TECH
        TECH_OUT --> BASIC
        BASIC_OUT --> DETAIL
        DETAIL_OUT --> IMPL
        
        %% 技術キャッチアップはスキップ可能
        REQ_OUT -.->|"スキップ可"| BASIC
    end

    %% スタイル
    classDef inputNode fill:#e1f5fe,stroke:#01579b
    classDef outputNode fill:#e8f5e9,stroke:#2e7d32
    classDef reviewNode fill:#fff3e0,stroke:#e65100
    classDef processNode fill:#f3e5f5,stroke:#7b1fa2
    classDef human fill:#ffccbc,stroke:#d84315
    
    class IDEA inputNode
    class REQ_OUT,BASIC_OUT,DETAIL_OUT,IMPL_OUT,TECH_OUT outputNode
    class REQ3,BASIC3,DETAIL4 reviewNode
    class PR_REVIEW human
    class TECH processNode
```

---

## ワークフロー一覧

| コマンド | 入力 | 出力 | 合格基準 |
|---------|------|------|---------|
| `/req-workflow` | アイデア・メモ | 要件定義書 (REQ-XXX.md) | 8点以上 |
| `/tech-catchup-workflow` | 技術リスト / 要件定義書 | 技術調査レポート (TECH-XXX.md) | - (調査完了) |
| `/basic-design-workflow` | 要件定義書 + 技術調査レポート | 基本設計書 (BASIC-XXX.md) | 9点以上 |
| `/release` | バージョン（省略可） | GitHub Release | - (リリース完了) |
| `/detailed-design-workflow` | 基本設計書 | 詳細設計書群 + テスト項目書 + Issues | 9点以上 |
| `/implement-issues` | GitHub Issues | 実装コード + PR | 9点以上（全レビュアー）⚡並列対応 |
| `/find-refactoring` | 対象パス | リファクタリングIssues | - (検出完了) |

> **Note**: `/tech-catchup-workflow` は任意実行。全技術が既知かつ最新の場合はスキップ可能。

---

## 使用エージェント

### ライター（作成担当）

| エージェント | 役割 |
|-------------|------|
| `@req-writer` | 要件定義書の作成・修正 |
| `@basic-design-writer` | 基本設計書の作成・修正 |
| `@detailed-design-writer` | 詳細設計書の作成・修正 |
| `@test-spec-writer` | テスト項目書の作成 |

### レビュアー（品質保証担当）

| エージェント | 役割 | 評価観点 |
|-------------|------|---------|
| `@req-reviewer` | 要件定義書のレビュー | 完全性、一貫性、実現可能性 |
| `@basic-design-reviewer` | 基本設計書のレビュー | 要件整合性、アーキテクチャ妥当性、技術スタック網羅性 |
| `@detailed-design-reviewer` | 詳細設計書のレビュー | 整合性、具体性、実装可能性 |

### スペシャリストレビュアー（専門領域）

| エージェント | 役割 |
|-------------|------|
| `@frontend-reviewer` | フロントエンド設計のレビュー |
| `@backend-reviewer` | バックエンド設計のレビュー |
| `@database-reviewer` | データベース設計のレビュー |
| `@security-reviewer` | セキュリティ設計のレビュー |
| `@infra-reviewer` | インフラ設計のレビュー |

---

## 品質ゲート

### サーキットブレーカー

各ワークフローには以下の安全装置が実装されています：

| 条件 | アクション |
|------|----------|
| 最大リトライ超過 | 警告マーク付与して終了 |
| スコア悪化検知 | 即座に中断 |
| 必須チェック失敗 | 未解決課題として記録 |

### 失敗時のリカバリ

```bash
# 要件定義でリトライ上限到達時
/req-workflow "入力パス" --resume-from=phase2

# 基本設計でスコア悪化時
/basic-design-workflow "REQ-XXX.md" --resume-from=phase2

# 詳細設計で特定機能のみ再実行
/detailed-design-workflow "BASIC-XXX.md" --target="ユーザー管理" --resume-from=phase3
```

---

## ドキュメント構成

```
docs/
├── memos/                        # アイデア・メモ（入力）
│   ├── archive/                  # 解決済みメモ
│   └── *.md
├── research/                     # 技術調査レポート
│   └── TECH-[カテゴリ]-NNN_技術名.md
├── requirements/                 # 要件定義書
│   └── REQ-XXX-NNN_機能名.md
└── designs/
    ├── basic/                    # 基本設計書
    │   └── BASIC-XXX-NNN_機能名.md
    └── detailed/                 # 詳細設計書
        └── {機能名}/
            ├── README.md
            ├── {サブ機能}/
            │   ├── 詳細設計書.md
            │   ├── バックエンド設計書.md
            │   ├── 画面設計書.md
            │   ├── フロントエンド設計書.md
            │   ├── *.png            # モックアップ画像
            │   └── mockup*.html     # HTMLモックアップ
            └── 共通/
                ├── データベース設計書.md
                ├── インフラ設計書.md
                └── セキュリティ設計書.md
```

---

## クイックスタート

### 新規プロジェクト開始

```bash
# 1. アイデアをメモに記載
# docs/memos/my-idea.md

# 2. 要件定義書を作成
/req-workflow "プロジェクト: タスク管理システム, ビジネス: チーム生産性向上, メモ: docs/memos/my-idea.md"

# 3. 技術キャッチアップ（推奨）
/tech-catchup-workflow "技術: Next.js 15, Prisma, 深度: standard, 要件: docs/requirements/REQ-XXX-001_機能名.md"

# 4. 基本設計書を作成
/basic-design-workflow "docs/requirements/REQ-XXX-001_機能名.md"

# 5. 詳細設計書を作成
/detailed-design-workflow "docs/designs/basic/BASIC-XXX-001_機能名.md"

# 6. 実装開始
/implement-issues
```

---

## スキルドキュメント

実装・レビュー時に参照する詳細ガイドです。

| ドキュメント | 説明 | 参照タイミング |
|-------------|------|---------------|
| [container-use環境構築](./skill/container-use-guide/SKILL.md) | コンテナ環境での開発・テスト手順 | **実装開始時（必須）** |
| [container-useエージェントルール](./instructions/container-use.md) | 障害対応・セッション復旧・フォールバック手順 | **障害発生時・セッション再開時** |
| [設計書同期ポリシー](./instructions/design-sync.md) | 設計書と実装の同期ルール、差分ドキュメント化 | **実装時（設計書参照時）** |
| [テスト戦略](./instructions/testing-strategy.md) | 環境依存コードのテスト方針、Mock実装パターン | **テスト実装時** |
| [プラットフォーム例外ポリシー](./instructions/platform-exception.md) | macOS/Windows固有コードのcontainer-use例外判断 | **プラットフォーム固有コード実装時** |
| [Worktreeワークフロー](./skill/worktree-workflow/SKILL.md) | ホスト環境開発時のブランチ分離（platform-exception用） | **プラットフォーム固有コード実装時** |
| [レビューガイド](./skill/review-guidelines/SKILL.md) | DB/セキュリティ/アーキテクチャの詳細レビュー観点 | レビュー時 |
| [コード品質ルール](./skill/code-quality-rules/SKILL.md) | 500行ルール、固定アーキテクチャ、命名規則 | 実装時 |
| [インフラワークフロー](./skill/infra-workflow/SKILL.md) | Terraform/Docker Composeの設計・実装フロー | インフラ構築時 |
| [申し送り処理](./skill/handover-process/SKILL.md) | BE↔FE間の申し送り処理ルール | 実装時 |
| [反復レビュー](./skill/iterative-review/SKILL.md) | OpenCode自己改善の修正→レビュー→修正ループ | **.opencode/修正時** |
| [CI監視ワークフロー](./skill/ci-workflow/SKILL.md) | CI監視・修正・自動マージフロー | **PR作成後（必須）** |
| [PRマージワークフロー](./skill/pr-merge-workflow/SKILL.md) | PR作成〜マージ〜ロールバックの全体フロー | **PR作成・マージ時** |
| [Subtask検出](./skill/subtask-detection/SKILL.md) | 親Issue→Subtask検出・依存関係解決 | **Issue実装開始時** |
| [品質レビューフロー](./skill/quality-review-flow/SKILL.md) | レビュースコア基準・客観的品質基準・TODO駆動再実装 | **PR作成前（必須）** |
| [ストレステストフロー](./skill/stress-test-flow/SKILL.md) | マルチ視点ストレステスト（セキュリティ/パフォーマンス/エッジケース） | **重要機能実装時（推奨）** |
| [Issue粒度判定](./skill/issue-size-estimation/SKILL.md) | 200行ルール・サイズラベル・行数見積もり | **Issue実装開始時** |
| [TDD実装フロー](./skill/tdd-implementation/SKILL.md) | Red→Green→Refactorサイクル | **コード実装時** |
| [GitHub Issue状態管理](./skill/github-issue-state-management/SKILL.md) | **環境状態のSSOT**（ラベル＆メタデータ） | **環境作成・削除時（必須）** |
| [環境削除](./skill/delete-environment/SKILL.md) | コンテナ・ファイル・メタデータの完全削除手順 | **環境削除時** |
| [Sisyphus実装ガイド](./skill/sisyphus-implementation-guide/SKILL.md) | Sisyphus専用の実行フロー・チェックリスト | **Issue実装時（Sisyphus）** |
| [GitHub GraphQL API](./skill/github-graphql-api/SKILL.md) | Sub-issue登録等のGraphQL API共通処理 | **Issue作成時** |
| [承認ゲート](./skill/approval-gate/SKILL.md) | ユーザー承認ゲートの共通フォーマット | **フェーズ移行時** |
| [レビュアー共通](./skill/reviewer-common/SKILL.md) | 実装レビュアーの共通ガイドライン | **レビュー時** |
| [Phase命名規約](./skill/workflow-phase-convention/SKILL.md) | Phase番号・承認ゲート・リトライ回数の標準 | **ワークフロー設計時** |
| [バグ修正ワークフロー](./command/bug-fix.md) | バグ報告→修正→PR作成の完全フロー（`/bug-fix`コマンド） | **バグ修正時** |
| [リリースワークフロー](./skill/release-workflow/SKILL.md) | バージョン提案→承認→GitHub Release作成（`/release`コマンド） | **リリース時** |

---

## コード品質ルール（概要）

詳細は [コード品質ルール](./skill/code-quality-rules/SKILL.md) を参照。

### 500行ルール

| 条件 | 対応 |
|------|------|
| 500行以下 | OK |
| 500行超過 | 自動分割を実行 |

### 固定アーキテクチャ

| 領域 | アーキテクチャ |
|------|---------------|
| バックエンド | オニオン/クリーンアーキテクチャ + TDD |
| フロントエンド | Atomic Design + MVVM |

### テストカバレッジ

| 対象 | 閾値 |
|------|------|
| 新規コード | **80%以上** |

---

## 申し送り処理（概要）

詳細は [申し送り処理](./skill/handover-process/SKILL.md) を参照。

| 方向 | 種別 | 例 |
|------|------|-----|
| BE→FE | `api_change` | APIレスポンス形式変更 |
| BE→FE | `error_code` | 新規エラーコード追加 |
| FE→BE | `api_request` | 新規API追加依頼 |
| FE→BE | `validation` | バリデーション追加依頼 |

---

## container-use（コンテナ開発環境）

**実装フェーズでは container-use を使用したコンテナ環境での開発が必須です。**

詳細は [container-use環境構築ガイド](./skill/container-use-guide/SKILL.md) を参照。

### メリット

| メリット | 説明 |
|----------|------|
| 環境分離 | ローカル環境を汚さない |
| 再現性 | チーム全員が同一環境で作業 |
| サービス統合 | DB/Redis等を安全にテスト |
| クリーンな状態 | いつでもリセット可能 |

### 基本フロー

```bash
# 1. 環境作成
container-use_environment_create(title="Issue #123")

# 2. 環境設定
container-use_environment_config(base_image="node:20-slim", setup_commands=["npm ci"])

# 3. サービス追加 (必要に応じて)
container-use_environment_add_service(name="postgres", image="postgres:15")

# 4. コマンド実行 (テスト等)
container-use_environment_run_cmd(command="npm test")
```

### 対応サービス

| サービス | イメージ | 用途 |
|----------|---------|------|
| PostgreSQL | `postgres:15-alpine` | リレーショナルDB |
| MySQL | `mysql:8` | リレーショナルDB |
| Redis | `redis:7-alpine` | キャッシュ/セッション |
| MongoDB | `mongo:7` | ドキュメントDB |
| Elasticsearch | `elasticsearch:8` | 全文検索 |

---

## 外部ツール依存

| ツール | 用途 | インストール |
|--------|------|-------------|
| container-use | コンテナ開発環境 | **組み込みツール（インストール不要）** |
| Docker | コンテナランタイム | Docker Desktop |
| Playwright | モックアップスクリーンショット生成 | `npx playwright install chromium` |
| GitHub CLI | Issue/PR作成 | `brew install gh` |
| Terraform | インフラ構築（オプション） | `brew install terraform` |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-29 | 3.34.0 | **Phase 6.6（設計書整合性チェック）導入**: 設計書で定義された機能が実装・統合されているかを確認するチェックフェーズを追加。「呼び出し元（Integration Points）」セクションを設計書テンプレートに必須化。統合漏れによる「死にコード」を防止。 |
| 2026-01-17 | 3.33.0 | **GitHub Issue状態管理導入**: environments.jsonからGitHub Issueラベル＆メタデータへ状態管理を移行。container-use/worktree/ホスト環境すべてからアクセス可能なSSOTを実現。`github-issue-state-management`スキル新規作成、`environments-json-management`をdeprecatedに |
| 2026-01-17 | 3.32.0 | **ワークフロー整合性＆トークン最適化**: (1) 承認ゲート選択肢を番号形式（1/2/3）に統一、英語選択肢を日本語化 (2) レビュアー共通テンプレート強化（8エージェント合計392行削減、39%圧縮）(3) ci-workflow/pr-merge-workflow責任境界を明確化 |
| 2026-01-12 | 3.31.0 | **ワークフローレビュー＆最適化**: Phase X.5規約を「中間ステップ」に再定義、レビュアー合格基準統一（basic/detailed-design-reviewer: 8点→9点）、変更履歴をCHANGELOG.mdに完全移行（README 27行削減） |
| 2026-01-11 | 3.30.0 | **Security Scan Plugin**: OpenCodeプラグインとして`plugin/security-scan/`を導入。センシティブファイル・APIキー検出によるセキュリティ強化 |

> **過去の変更履歴**: 3.29.0以前の変更履歴は [CHANGELOG.md](./CHANGELOG.md) を参照してください。
