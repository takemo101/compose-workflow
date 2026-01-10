---
name: release-workflow
description: バージョン提案からGitHub Release作成までの標準リリースフローを定義（マルチエコシステム対応）
---

# リリースワークフロー

バージョン提案 → ユーザー承認 → リリース作成までの標準フローを定義する。

---

## フロー概要

```
1. バージョン提案（Sisyphusが自動計算）
   ↓
2. ユーザーがバージョンを承認/変更
   ↓
3. リリース実行（自動）
   - バージョンファイル更新
   - CHANGELOG.md更新
   - コミット & タグ作成
   - push
   - GitHub Release作成
   - Release Workflow完了待機
```

---

## 実装環境

### container-use不要

リリースワークフローでは**container-useは不要**です。

| 理由 | 説明 |
|------|------|
| コード変更なし | バージョンファイル（Cargo.toml等）とCHANGELOG.mdのみ更新 |
| ドキュメント操作のみ | 実行可能コードの変更を伴わない |
| タグ・リリース操作 | Gitタグ作成とGitHub Release操作のみ |

### ホスト環境で直接実行

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

---

## Phase 1: バージョン提案

### 1.1 エコシステム検出とバージョン取得

```bash
# スクリプトを使用（推奨）
.opencode/skill/release-workflow/scripts/release.sh --detect

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
- `はい`: v0.5.0 でリリース開始
- `0.4.1`: パッチバージョンに変更
- `1.0.0`: メジャーバージョンに変更
- `キャンセル`: リリース中止
```

---

## Phase 2: ユーザー承認

ユーザーがバージョンを承認または変更するまで待機。

| ユーザー入力 | アクション |
|-------------|----------|
| `はい` / `yes` | 提案バージョンでリリース |
| `0.x.x` 形式 | 指定バージョンでリリース |
| `キャンセル` / `cancel` | リリース中止 |

---

## Phase 3: リリース実行

### 3.1 バージョンファイル更新

```bash
# スクリプトを使用（推奨）
.opencode/skill/release-workflow/scripts/release.sh --update-version <new-version>

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
.opencode/skill/release-workflow/scripts/release.sh --commit <new-version>

# または手動
git add -A
git commit -m "chore: release v<new-version>"
git tag -a v<new-version> -m "Release v<new-version> - <summary>"
git push origin <default-branch> --tags
```

### 3.4 GitHub Release作成

```bash
# スクリプトを使用（推奨）
.opencode/skill/release-workflow/scripts/release.sh --create-release <new-version> "<release-notes>"

# または手動
gh release create v<new-version> \
  --title "v<new-version> - <summary>" \
  --notes "<release-notes>"
```

### 3.5 Release Workflow完了待機

```bash
# スクリプトを使用（推奨）
.opencode/skill/release-workflow/scripts/release.sh --watch

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

`.opencode/skill/release-workflow/scripts/release.sh` を使用することで、上記の処理を自動化できます。

### 基本コマンド

```bash
# エコシステム検出とバージョン表示
.opencode/skill/release-workflow/scripts/release.sh --detect

# 完全自動リリース（対話モード）
.opencode/skill/release-workflow/scripts/release.sh

# バージョン指定リリース
.opencode/skill/release-workflow/scripts/release.sh --version 1.2.3

# ドライラン（実行せずに確認）
.opencode/skill/release-workflow/scripts/release.sh --dry-run --version 1.2.3
```

### 個別操作

```bash
# バージョン更新のみ
.opencode/skill/release-workflow/scripts/release.sh --update-version 1.2.3

# コミット & タグのみ
.opencode/skill/release-workflow/scripts/release.sh --commit 1.2.3

# GitHub Release作成のみ
.opencode/skill/release-workflow/scripts/release.sh --create-release 1.2.3 "Release notes here"

# Workflow監視
.opencode/skill/release-workflow/scripts/release.sh --watch
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

### リリース中
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

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-10 | 2.0.0 | マルチエコシステム対応（Rust, Node.js, Python, Go, Generic）。release.sh スクリプト追加 |
| 2026-01-09 | 1.0.0 | 初版作成（Rust専用） |
