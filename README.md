# Composer Workflow

ソフトウェア設計の自動化ワークフローシステム。アイデアから実装まで、要件定義→基本設計→詳細設計→実装の各フェーズを自動化します。

## 前提条件

### Claude Code プラグイン（必須）

このプロジェクトでClaude Codeを使用する場合、**oh-my-claude-sisyphus** プラグインのインストールが必須です。

```bash
# プラグインのインストール
claude /plugin marketplace add Yeachan-Heo/oh-my-claude-sisyphus
claude /plugin install oh-my-claude-sisyphus

# デフォルトモードとして設定
claude /oh-my-claude-sisyphus:sisyphus-default
```

#### プラグインが提供する機能

| 機能 | 説明 |
|------|------|
| マルチエージェント委譲 | 複雑なタスクを専門エージェントに自動委譲 |
| TODO継続実行 | タスクリストが空になるまで自動継続 |
| 並列処理 | 独立タスクの自動並列実行 |
| スマートモデルルーティング | タスク複雑度に応じたHaiku/Sonnet/Opus選択 |

#### 主要コマンド

| コマンド | 説明 |
|---------|------|
| `/ultrawork` | 最大並列度での高速実行 |
| `/prometheus` | 戦略的プランニング |
| `/ralph-loop` | 完了まで停止しない実行モード |
| `/deepinit` | コードベースのインデックス化 |

### その他の前提条件

| ツール | 用途 | インストール |
|--------|------|-------------|
| Docker | コンテナランタイム | Docker Desktop |
| GitHub CLI | Issue/PR操作 | `brew install gh` |
| Playwright | モックアップ生成 | `npx playwright install chromium` |

## セットアップ

```bash
git clone <repo>
cd composer-workflow
npm run setup
```

これにより以下が実行されます:
1. npm依存関係のインストール
2. シンボリックリンクの作成（`.claude/skills/wireframe-generator`）
3. wireframe-generatorの依存関係インストール

## クイックスタート

```bash
# 1. アイデアをメモに記載
# docs/memos/my-idea.md

# 2. 要件定義書を作成
/req-workflow "プロジェクト: ..., ビジネス: ..., メモ: docs/memos/my-idea.md"

# 3. 基本設計書を作成
/basic-design-workflow "docs/requirements/REQ-XXX-001_機能名.md"

# 4. 詳細設計書を作成
/detailed-design-workflow "docs/designs/basic/BASIC-XXX-001_機能名.md"

# 5. 実装開始
/implement-issues
```

## ワークフロー概要

```
アイデア → /req-workflow → /basic-design-workflow → /detailed-design-workflow → /implement-issues → PR
```

| ワークフロー | 入力 | 出力 | 合格基準 |
|-------------|------|------|---------|
| `/req-workflow` | アイデア・メモ | 要件定義書 | 8点以上 |
| `/basic-design-workflow` | 要件定義書 | 基本設計書 | 9点以上 |
| `/detailed-design-workflow` | 基本設計書 | 詳細設計書群 + Issues | 9点以上 |
| `/implement-issues` | GitHub Issues | 実装コード + PR | 9点以上 |

## ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [.opencode/README.md](.opencode/README.md) | ワークフロー詳細ガイド |
| [.claude/CLAUDE.md](.claude/CLAUDE.md) | Claude Code設定 |
| [.opencode/skill/SKILL_INDEX.md](.opencode/skill/SKILL_INDEX.md) | スキル一覧 |

## ライセンス

Private
