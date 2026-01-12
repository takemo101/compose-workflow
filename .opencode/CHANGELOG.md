# OpenCode ワークフロー 変更履歴

このファイルには、過去のバージョン変更履歴がアーカイブされています。
最新の変更履歴は [README.md](./README.md#変更履歴) を参照してください。

---

## アーカイブ済み変更履歴（3.29.0以前）

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-11 | 3.29.0 | **P0 Refactoring (500行ルール適用)**: 巨大コマンドファイルを分割・スリム化。(1) **implement-issues.md**: 1,442行→290行（**80%削減**）- 重複Python疑似コードを表形式に変換、CI/マージ処理をスキル参照に置換 (2) **bug-fix.md**: 1,402行→322行（**77%削減**）- Phase 2を`/implement-issues`内部呼び出しに統一、エスカレーション詳細をサマリー表に凝縮。DRY原則徹底適用 |
| 2026-01-10 | 3.28.0 | **Token Consumption Optimization (トークン消費量最適化)**: 隠れた無駄を徹底排除。(1) **Diff-Driven Review** (レビュー時の全文読み込み禁止)、(2) **Test Log Compression** (テスト成功ログの抑制)、(3) **Context Pass-through** (設計書コンテキストの再利用による読み込みゼロ化) を実装 |
| 2026-01-10 | 3.27.1 | **Stress Test Integration (ストレステスト統合)**: Phase 9 に「ストレステスト（任意）」を追加し、メインフローに正式統合。重要機能の実装時に自動的にマルチ視点検証を実行するフローを確立 |
| 2026-01-10 | 3.27.0 | **Adaptive Architecture Strategy (適応型アーキテクチャ) 導入**: 固定アーキテクチャ強制を廃止。プロジェクト定義 > フレームワーク標準 > 推奨パターンの優先順位でアーキテクチャを決定。小規模プロジェクトやNext.js等のフレームワークとの親和性を向上 |
| 2026-01-10 | 3.26.0 | **Specification Gate (設計書検問) 実装**: Phase 3 に「設計書実現性チェック」を追加。実装前にAIが仕様の曖昧さを判定し、NGならBlocked移行することで「推測実装によるバグ」を完全防止。ai-frameworkの「仕様書品質重視」思想を取り込み完了 |
| 2026-01-10 | 3.25.0 | **セッション復旧強化4点**（ai-framework分析より）: (1) **再開ポイント明示化** - environments.jsonに`phase`/`step`フィールド追加、12段階の再開ポイント定義 (2) **Blocked状態検出** - `status: "blocked"`と`blocked`オブジェクト追加、6種類のblocked reason定義 (3) **エリア分離厳格化** - 参照マトリクスに`area`カラム追加、領域別設計書マッピング定義 (4) **TODO永続化強化** - レビューTODOのenvironments.json連携、セッション間復旧ロジック追加 |
| 2026-01-10 | 3.24.0 | **Token最適化5点実装**（ai-framework分析より）: (1) TODO駆動インクリメンタル再実装（quality-review-flow.md）- レビュー指摘をTODOファイル化し再読み込み60-70%削減 (2) 設計書参照マトリクス（implement-subtask-rules.md）- タスク別必須/任意/禁止セクション定義 (3) Phase責任SSOTテーブル（sisyphus-implementation-guide.md）- Token消費列追加 (4) 固定アーキテクチャプロンプト簡略化（code-quality-rules.md）- LLM事前学習活用で80-90%削減 (5) ストレステストフロー新規作成（stress-test-flow/SKILL.md）- 並列検証エージェント（コード生成なし） |
| 2026-01-09 | 3.23.0 | **OpenCodeスキル形式移行**: 全20スキルファイルをOpenCode標準ディレクトリ構造（`<name>/SKILL.md` + YAMLフロントマター）に移行。README.mdのスキル参照パスを更新 |
| 2026-01-09 | 3.22.0 | **Worktreeワークフロー追加**: shikajiro/claude-code-skill-exampleからworktreeスキルを移植。platform-exception時のホスト環境開発をサポート。スクリプト（create_worktree.sh, pr_and_cleanup.sh）とスキルドキュメント（worktree-workflow.md）を追加 |
| 2026-01-08 | 3.21.0 | **重複削減・SSOT化**: (1) pr-merge-workflow.md新規作成（179行）、container-use.mdのPRマージセクション約130行をスキル参照に置換 (2) environments-json-management.mdをSSOT化（98→223行）、container-use.mdの約85行をスキル参照に置換 (3) ci-workflow.mdに関連ドキュメント追加。総削減: container-use.md 750→544行（**206行削減、27%**） |
| 2026-01-08 | 3.20.0 | **ワークフロー構造改善**: bug-fix-workflow.mdをコマンドに昇格（`/bug-fix`）。container-use-guide.md軽量化（656→611行）。スキル参照形式の完全統一。古い変更履歴をCHANGELOG.mdにアーカイブ |
| 2026-01-08 | 3.19.0 | **ワークフローレビュー対応**: Phase命名規約（workflow-phase-convention.md）を新規作成。スキル参照を`{{skill:xxx}}`形式に統一。bug-fix-workflow.mdの重複削除（1382→1322行）。孤立スキル参照の修正 |
| 2026-01-08 | 3.18.0 | **ワークフロー汎用化**: 全ファイルからプロジェクト固有の例（Pomodoro, ECサイト, Daemon, launchctl等）を汎用プレースホルダに置換。スキル参照（github-graphql-api, approval-gate）を適用。Issue参照を削除し、ドキュメントを自己完結型に |
| 2026-01-08 | 3.17.4 | **重複コード共通化 & エージェント最適化**: GraphQL API共通化（github-graphql-api.md）、承認ゲート共通化（approval-gate.md）、レビュアー共通ガイドライン作成。agent/ディレクトリ2,704行→2,407行（11%削減） |
| 2026-01-08 | 3.17.3 | **implement-issues.md 分割（第2弾）**: 2,011行→1,427行（29%削減）。Issue粒度判定、TDD実装、environments.json管理、Sisyphus実装ガイドを分離 |
| 2026-01-08 | 3.17.2 | **厳格レビュー対応**: 循環参照解消（subtask-detection.mdから実行ロジック削除）、品質レビューフロー分離（quality-review-flow.md）、重複定義削除 |
| 2026-01-08 | 3.17.0 | **implement-issues.md 分割**: 2,590行→2,131行（18%削減）。CI監視フロー（ci-workflow.md）、Subtask検出ロジック（subtask-detection.md）を分離。Git conflict marker修正、セクション番号整合性修正 |
| 2026-01-08 | 3.16.0 | **Sub-issue登録GraphQL化 & トークン最適化**: REST APIバグ回避のためGraphQL APIに変更（decompose-issue, detailed-design-workflow）。implement-issuesトークン消費65%削減（container-workerプロンプト簡素化、implement-subtask-rules.md分離） |
| 2026-01-07 | 3.15.1 | **命名規則ガイドライン追加**: `issue_id`（コード内変数）vs `issue_number`（environments.json）の使い分けを明文化 |
| 2026-01-07 | 3.15.0 | **厳格レビュー対応**: (1) environments.jsonをSSOTに簡素化 (2) 設計書乖離検出を手動チェックに変更 (3) CI修正時のgit pull追加 (4) platform-exceptionにビルドテスト追加 (5) レビューループに同一指摘検出追加 (6) --delete-branch統一 (7) build_subtask_worker_prompt実装追加 (8) 客観的品質基準追加 (9) ロールバック手順追加 |
| 2026-01-07 | 3.14.0 | **ワークフロー改善5点**: (1) プラットフォーム例外ポリシー新規追加 (2) 設計書乖離自動検出機能追加 (3) セッション自動保存機能追加 (4) CI失敗時の分類・修正フロー追加 (5) スキルドキュメント参照にプラットフォーム例外ポリシーを追加 |
| 2026-01-05 | 3.13.0 | **environments.json必須化**: container-use操作時のenvironments.json読み書きを必須化。環境作成・PR作成・マージ・削除の各タイミングで更新を強制。セッション復旧時のenvironments.json参照を優先化 |
| 2026-01-05 | 3.12.0 | **追加仕様対応**: 全設計ワークフロー（req/basic/detailed）にPhase 0.5（既存ドキュメント整合性確認）を追加。既存プロジェクトへの仕様追加時に、要件定義書・基本設計書・詳細設計書・Issue・コードベースとの整合性を自動チェックし、影響範囲を明確化 |
| 2026-01-04 | 3.11.0 | **ワークフローレビュー反映**: PRマージフロー改善（クリーンアップ統合）、Related Documentsセクション追加、設計書更新手順追加、mockallクレート追加、現行テスト構造との差異明記 |
| 2026-01-04 | 3.10.0 | **ワークフロー改善**: PRテンプレート必須化（`Closes #XX`自動クローズ）、リモートブランチ削除義務化、設計書同期ポリシー（`design-sync.md`）、環境依存テスト戦略（`testing-strategy.md`）を追加 |
| 2026-01-04 | 3.9.0 | **障害復旧・セッション管理強化**: Docker障害時フォールバック手順、セッション復旧プロトコル、継続プロンプトベストプラクティスを `instructions/container-use.md` に追加 |
| 2026-01-04 | 3.8.0 | **トークン最適化強化**: 結果最小化ルール（セクション14）追加、oh-my-opencode設定でリカバリーフック有効化 |
| 2026-01-03 | 3.7.0 | **ドキュメント品質向上**: detailed-design-workflowに全体フロー図追加、request-design-fixにサーキットブレーカー・エラーハンドリング・擬似コード追加 |
| 2026-01-03 | 3.6.0 | **MCPツール継承修正**: 並列処理で `task` → `background_task` に変更。`task` ではMCPツール（container-use）がサブエージェントに継承されない問題を解決 |
| 2026-01-03 | 3.5.0 | **並列実装ワークフロー強化**: `/implement-issues 9 10` で複数Issueを `container-worker` エージェントで並列処理、設計書存在チェック追加、PR作成前ユーザー承認ゲート追加 |
| 2026-01-03 | 3.4.0 | 並行作業ガイドライン追加: container-use環境による複数Issue並行処理の必須化、プラットフォーム固有コードの例外ルールを明文化 |
| 2026-01-03 | 3.3.0 | 反復レビュースキル追加: OpenCode自己改善のための修正→レビュー→修正ループを文書化 |
| 2026-01-03 | 3.2.0 | ユーザー承認ゲート追加: 全ワークフロー（req/basic/detailed）に明示的な承認待ちフェーズを追加、environments.jsonをgitignore対象に |
| 2026-01-02 | 3.1.0 | container-use統合: 実装ワークフローにコンテナ環境構築を必須化、ガイドドキュメント追加 |
| 2026-01-02 | 3.0.0 | ai-framework機能取り込み: レビュー観点詳細化、500行ルール/固定アーキテクチャ、インフラワークフロー、申し送り処理 |
| 2026-01-02 | 2.2.0 | 実装ワークフロー強化: TDD厳密化、設計フィードバックループ、Human-in-the-Loop、依存関係ルール追加 |
| 2026-01-02 | 2.1.0 | モックアップ生成をChrome DevToolsからPlaywrightに変更 |
| 2026-01-02 | 2.0.0 | 改善メモの内容を各ワークフローに統合。README作成 |
| 2026-01-02 | 1.0.0 | 初版作成 |
