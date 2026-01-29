---
name: release-workflow
description: バージョン整合性チェック→提案→承認→GitHub Release作成までの標準リリースフロー（マルチエコシステム対応）
---

# リリースワークフロー

バージョン提案 → ユーザー承認 → リリース作成までの標準フローを定義する。

---

## フロー概要

```
0.5. バージョン整合性チェック（ハードコード検出）
   ↓
1. バージョン提案（Sisyphusが自動計算）
   ↓
2. ユーザーがバージョンを承認/変更
   ↓
3. リリース実行（自動）
   - ハードコードバージョン修正（検出時）
   - バージョンファイル更新
   - CHANGELOG.md更新
   - コミット & タグ作成
   - push
   - GitHub Release作成
   - Release Workflow完了待機
```

---

## 実装環境

### ホスト環境で実行

リリース作業はホスト環境で直接実行します。

| 理由 | 説明 |
|------|------|
| コード変更なし | バージョンファイル（Cargo.toml等）とCHANGELOG.mdのみ更新 |
| ドキュメント操作のみ | 実行可能コードの変更を伴わない |
| タグ・リリース操作 | Gitタグ作成とGitHub Release操作のみ |

```bash
# リリース作業はホスト環境で直接実行
git add Cargo.toml CHANGELOG.md
git commit -m "chore: release v<version>"
git tag -a v<version> -m "Release v<version>"
git push origin <default-branch> --tags
gh release create v<version> ...
```

---

## 対応エコシステム

| エコシステム | バージョンファイル | 検出条件 |
|-------------|-------------------|----------|
| **Rust** | `Cargo.toml` | `Cargo.toml` 存在 |
| **Node.js** | `package.json` | `package.json` 存在 |
| **Python (pyproject)** | `pyproject.toml` | `pyproject.toml` 存在 |
| **Python (setup.py)** | `setup.py` | `setup.py` 存在 |
| **Go** | タグのみ | `go.mod` 存在 |
| **Generic** | `VERSION` | `VERSION` ファイル存在 |
| **Tag-only** | なし | 上記いずれも該当しない |

### 自動検出の優先順位

1. `Cargo.toml` → Rust
2. `package.json` → Node.js
3. `pyproject.toml` → Python (pyproject)
4. `setup.py` → Python (setup.py)
5. `go.mod` → Go
6. `VERSION` → Generic
7. いずれもなし → Tag-only

> **Note**: 複数のエコシステムファイルが存在する場合、上記の優先順位で最初にマッチしたものを使用します。
> スクリプトは検出時に警告を表示します。

---

## Phase 0.5: バージョン整合性チェック

リリース前にコードベース内のハードコードされたバージョンを検出し、修正を提案する。

### 0.5.1 目的

- ハードコードされたバージョン文字列の検出
- 推奨パターン（動的バージョン取得）への移行提案
- リリース時のバージョン不整合を防止

### 0.5.2 エコシステム別チェックパターン

#### Rust

| パターン | 検索コマンド | 問題 | 推奨修正 |
|---------|-------------|------|---------|
| `#[command(version = "x.x.x")]` | `rg '#\[command\(version\s*=' --type rust` | clap属性にハードコード | `#[command(version)]` |
| `const VERSION: &str = "x.x.x"` | `rg 'const\s+VERSION.*=.*"\d+\.\d+' --type rust` | 定数定義 | `env!("CARGO_PKG_VERSION")` |
| `static VERSION` | `rg 'static\s+VERSION.*=.*"\d+\.\d+' --type rust` | static定義 | `env!("CARGO_PKG_VERSION")` |

#### Node.js

| パターン | 検索コマンド | 問題 | 推奨修正 |
|---------|-------------|------|---------|
| `const version = "x.x.x"` | `rg 'const\s+version\s*=\s*["\x27]\d+\.\d+' --type js --type ts` | 定数定義 | `require('./package.json').version` |
| `VERSION = "x.x.x"` | `rg 'VERSION\s*=\s*["\x27]\d+\.\d+' --type js --type ts` | 大文字定数 | `process.env.npm_package_version` |
| `.version("x.x.x")` | `rg '\.version\(["\x27]\d+\.\d+' --type js --type ts` | メソッドチェーン | 動的取得に変更 |

#### Python

| パターン | 検索コマンド | 問題 | 推奨修正 |
|---------|-------------|------|---------|
| `__version__ = "x.x.x"` | `rg '__version__\s*=\s*["\x27]\d+\.\d+' --type py` | モジュールバージョン | `importlib.metadata.version("pkg")` |
| `VERSION = "x.x.x"` | `rg 'VERSION\s*=\s*["\x27]\d+\.\d+' --type py` | 定数定義 | `importlib.metadata.version("pkg")` |
| `version="x.x.x"` in setup() | `rg 'version\s*=\s*["\x27]\d+\.\d+' setup.py` | setup.py内 | pyproject.tomlに移行 |

#### Go

| パターン | 検索コマンド | 問題 | 推奨修正 |
|---------|-------------|------|---------|
| `var Version = "x.x.x"` | `rg 'var\s+[Vv]ersion\s*=\s*"\d+\.\d+' --type go` | 変数定義 | `-ldflags "-X main.Version=..."` |
| `const Version = "x.x.x"` | `rg 'const\s+[Vv]ersion\s*=\s*"\d+\.\d+' --type go` | 定数定義 | `-ldflags`でビルド時注入 |

### 0.5.3 共通チェックパターン（全エコシステム）

| パターン | 検索コマンド | 対応 |
|---------|-------------|------|
| READMEバッジ | `rg 'badge/v?\d+\.\d+\.\d+' README.md` | 新バージョンに更新 |
| シールドバッジ | `rg 'shields\.io.*\d+\.\d+\.\d+' README.md` | 新バージョンに更新 |
| インストール例 | `rg '@\d+\.\d+\.\d+' README.md` | 新バージョンに更新 |
| ドキュメント内バージョン | `rg 'v\d+\.\d+\.\d+' docs/` | 警告表示（確認必要） |

### 0.5.4 スクリプト実行

バージョン整合性チェックは `release.sh` に統合されています：

```bash
# Phase 0.5 のみ実行
.pi/skills/release-workflow/scripts/release.sh --version-check <new-version>

# 完全リリースフロー内で自動実行（デフォルト）
.pi/skills/release-workflow/scripts/release.sh --version 1.2.3

# Phase 0.5 をスキップして実行
.pi/skills/release-workflow/scripts/release.sh --version 1.2.3 --skip-version-check
```

> **依存**: `rg`（ripgrep）がインストールされている場合は高速検索を使用。
> 未インストールの場合は `grep -E` にフォールバック。

### 0.5.5 出力フォーマット

```markdown
## バージョン整合性チェック結果

### ⚠️ 検出されたハードコードバージョン

| ファイル | 行 | 現在の値 | 種別 | 推奨対応 |
|---------|-----|---------|------|---------|
| src/cli/args.rs | 5 | `version = "0.1.0"` | Rust/clap | `#[command(version)]` に変更 |
| README.md | 12 | `badge/v0.1.0` | バッジ | `v{NEW_VERSION}` に更新 |

### 対応オプション

1. **自動修正を適用** → 推奨パターンに変換（コード変更あり）
2. **バージョン番号のみ更新** → 現在のパターンを維持し値のみ更新
3. **スキップ** → 警告のみ、修正なし

> 番号を選択してください（1-3）:
```

### 0.5.6 自動修正ルール

| 種別 | 自動修正可能 | 修正内容 |
|------|-------------|---------|
| Rust clap属性 | ✅ | `version = "x.x.x"` → `version` |
| Rust定数 | ✅ | `"x.x.x"` → `env!("CARGO_PKG_VERSION")` |
| READMEバッジ | ✅ | バージョン番号を新バージョンに置換 |
| Node.js定数 | ⚠️ 確認必要 | 使用箇所により異なる |
| Python `__version__` | ⚠️ 確認必要 | importlib使用可否による |
| Go変数 | ❌ 手動 | ビルドスクリプト修正が必要 |
| ドキュメント内 | ⚠️ 確認必要 | コンテキストによる |

### 0.5.7 Phase 0.5 スキップ条件

以下の場合はPhase 0.5をスキップ可能：

- `--skip-version-check` フラグ指定時
- 前回リリースからコード変更がない場合（CHANGELOG.mdのみ等）
- ユーザーが明示的にスキップを選択

---

## Phase 1: バージョン提案

### 1.1 エコシステム検出とバージョン取得

```bash
# スクリプトを使用（推奨）
.pi/skills/release-workflow/scripts/release.sh --detect

# または手動で検出
# Rust
grep '^version = ' Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/'

# Node.js
jq -r '.version' package.json

# Python (pyproject.toml)
grep '^version = ' pyproject.toml | head -1 | sed 's/version = "\(.*\)"/\1/'

# Python (setup.py)
grep -o "version=['\"][^'\"]*['\"]" setup.py | sed "s/version=['\"]\\([^'\"]*\\)['\"/\\1/"

# Go / Tag-only
git tag --sort=-version:refname | head -1 | sed 's/^v//'

# Generic
cat VERSION
```

### 1.2 変更内容の分析

```bash
# 前回リリースからのコミットを取得
git log <last-tag>..HEAD --oneline
```

### 1.3 セマンティックバージョニング判定

| 変更種別 | バージョン変更 | 例 |
|---------|---------------|-----|
| **Breaking Change** | MAJOR (x.0.0) | API変更、後方互換性なし |
| **新機能追加** | MINOR (0.x.0) | 機能追加、後方互換性あり |
| **バグ修正** | PATCH (0.0.x) | バグ修正、リファクタリング |

### 1.4 提案フォーマット

```markdown
## リリース提案

### エコシステム
<detected-ecosystem>

### 現在のバージョン
v0.4.0

### 前回リリースからの変更
- feat: 新機能追加（#XX）
- fix: バグ修正（#YY）

### 提案バージョン
**v0.5.0** (MINOR: 新機能追加)

### 変更種別
- ✨ 新機能: N件
- 🐛 バグ修正: N件
- 📝 ドキュメント: N件

---

**このバージョンでリリースしますか？**

1. **提案バージョンで続行** → v0.5.0 でリリース開始
2. **バージョン変更** → 手動でバージョンを入力
3. **キャンセル** → リリース中止

> 番号を選択してください（1-3）:
```

> **参照**: `approval-gate` skill 形式に準拠

---

## Phase 2: ユーザー承認

ユーザーがバージョンを承認または変更するまで待機。

| 選択 | アクション |
|------|----------|
| 1 | 提案バージョンでリリース |
| 2 | 指定バージョンでリリース（入力プロンプト） |
| 3 | リリース中止 |

---

## Phase 3: リリース実行

### 3.1 バージョンファイル更新

```bash
# スクリプトを使用（推奨）
.pi/skills/release-workflow/scripts/release.sh --update-version <new-version>

# または手動で更新（エコシステム別）
```

#### Rust (Cargo.toml)

```bash
sed -i '' 's/^version = ".*"/version = "<new-version>"/' Cargo.toml
```

#### Node.js (package.json)

```bash
npm version <new-version> --no-git-tag-version
# または
jq '.version = "<new-version>"' package.json > tmp.json && mv tmp.json package.json
```

#### Python (pyproject.toml)

```bash
sed -i '' 's/^version = ".*"/version = "<new-version>"/' pyproject.toml
```

#### Python (setup.py)

```bash
sed -i '' "s/version=['\"][^'\"]*['\"]/version='<new-version>'/" setup.py
```

#### Generic (VERSION)

```bash
echo "<new-version>" > VERSION
```

#### Go / Tag-only

バージョンファイル更新なし（タグのみ）

### 3.2 CHANGELOG.md更新

変更内容を `## [Unreleased]` の下に追加：

```markdown
## [<new-version>] - <YYYY-MM-DD>

### Added
- 機能追加項目

### Fixed
- バグ修正項目

### Changed
- 変更項目
```

### 3.3 コミット & タグ作成

```bash
# スクリプトを使用（推奨）
.pi/skills/release-workflow/scripts/release.sh --commit <new-version>

# または手動
git add -A
git commit -m "chore: release v<new-version>"
git tag -a v<new-version> -m "Release v<new-version> - <summary>"
git push origin <default-branch> --tags
```

### 3.4 GitHub Release作成

```bash
# スクリプトを使用（推奨）
.pi/skills/release-workflow/scripts/release.sh --create-release <new-version> "<release-notes>"

# または手動
gh release create v<new-version> \
  --title "v<new-version> - <summary>" \
  --notes "<release-notes>"
```

### 3.5 Release Workflow完了待機

```bash
# スクリプトを使用（推奨）
.pi/skills/release-workflow/scripts/release.sh --watch

# または手動
gh run list --workflow=Release --limit 1
gh run watch <run-id>
```

### 3.6 リリースアセット確認

```bash
gh release view v<new-version> --json tagName,assets --jq '.tagName, (.assets[].name)'
```

---

## スクリプト使用方法

`.pi/skills/release-workflow/scripts/release.sh` を使用することで、上記の処理を自動化できます。

### 基本コマンド

```bash
# エコシステム検出とバージョン表示
.pi/skills/release-workflow/scripts/release.sh --detect

# 完全自動リリース（対話モード）
.pi/skills/release-workflow/scripts/release.sh

# バージョン指定リリース
.pi/skills/release-workflow/scripts/release.sh --version 1.2.3

# ドライラン（実行せずに確認）
.pi/skills/release-workflow/scripts/release.sh --dry-run --version 1.2.3
```

### 個別操作

```bash
# バージョン更新のみ
.pi/skills/release-workflow/scripts/release.sh --update-version 1.2.3

# コミット & タグのみ
.pi/skills/release-workflow/scripts/release.sh --commit 1.2.3

# GitHub Release作成のみ
.pi/skills/release-workflow/scripts/release.sh --create-release 1.2.3 "Release notes here"

# Workflow監視
.pi/skills/release-workflow/scripts/release.sh --watch
```

---

## リリースノートテンプレート

```markdown
## <project-name> v<version>

### ✨ 新機能

#### <機能名>
<説明>

### 🐛 バグ修正

- <修正内容> (#<issue-number>)

### 📝 ドキュメント

- <ドキュメント変更>

---

### インストール方法

```bash
# エコシステムに応じたインストールコマンド
```

### 動作確認
```bash
<command> --version
```

### システム要件
- <要件>
```

---

## CHANGELOG.md テンプレート

```markdown
## [<version>] - <YYYY-MM-DD>

### Added
- **<機能名>**: <説明> (#<issue>)
  - <詳細1>
  - <詳細2>

### Fixed
- **<修正名>**: <説明> (#<issue>, #<pr>)

### Changed
- **<変更名>**: <説明>

### Deprecated
- **<非推奨名>**: <説明>

### Removed
- **<削除名>**: <説明>

### Security
- **<セキュリティ修正>**: <説明>
```

---

## エラーハンドリング

### タグが既に存在する場合

```bash
# エラー: tag 'v0.5.0' already exists
git tag -d v<version>  # ローカル削除
git push origin :refs/tags/v<version>  # リモート削除
# 再度タグ作成
```

### Release Workflow失敗時

```bash
# ワークフロー再実行
gh run rerun <run-id>

# または手動でリリースアセットをアップロード
gh release upload v<version> <asset-file>
```

---

## チェックリスト

### リリース前
- [ ] 全テスト通過
- [ ] Lint通過
- [ ] デフォルトブランチが最新
- [ ] 未マージのPRなし
- [ ] **バージョン整合性チェック完了**（Phase 0.5）

### リリース中
- [ ] ハードコードバージョン修正（検出時）
- [ ] バージョンファイル更新
- [ ] CHANGELOG.md更新
- [ ] コミット & タグ作成
- [ ] push完了
- [ ] GitHub Release作成

### リリース後
- [ ] Release Workflow完了
- [ ] アセットが正しくアップロード
- [ ] リリースノートの内容確認

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [Keep a Changelog](https://keepachangelog.com/) | CHANGELOG形式の標準 |
| [Semantic Versioning](https://semver.org/) | バージョニング規約 |
| [release.sh スクリプト](./scripts/release.sh) | リリース自動化スクリプト |
| `workflow-phase-convention` skill | Phase番号体系（release-workflowセクション参照） |
| `approval-gate` skill | 承認ゲートの共通フォーマット |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-17 | 3.1.0 | 承認ゲート形式を番号形式に統一。workflow-phase-convention参照を追加。複数エコシステム警告を追加 |
| 2026-01-17 | 3.0.0 | Phase 0.5（バージョン整合性チェック）追加。エコシステム別ハードコード検出パターン定義。自動修正ルール追加 |
| 2026-01-10 | 2.0.0 | マルチエコシステム対応（Rust, Node.js, Python, Go, Generic）。release.sh スクリプト追加 |
| 2026-01-09 | 1.0.0 | 初版作成（Rust専用） |
