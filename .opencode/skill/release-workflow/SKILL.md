---
name: release-workflow
description: バージョン提案からGitHub Release作成までの標準リリースフローを定義
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
   - Cargo.toml更新
   - CHANGELOG.md更新
   - コミット & タグ作成
   - push
   - GitHub Release作成
   - Release Workflow完了待機
```

---

## Phase 1: バージョン提案

### 1.1 現在のバージョン取得

```bash
# Cargo.tomlから現在のバージョンを取得
grep '^version = ' Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/'

# 最新タグを取得
git tag --sort=-version:refname | head -1
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

### 現在のバージョン
v0.4.0

### 前回リリースからの変更
- feat: ビジュアル強化機能（Epic #121）
- fix: 作業アニメーション方向修正（#136）
- fix: 休憩アニメーション改善（#138, #140）

### 提案バージョン
**v0.5.0** (MINOR: 新機能追加)

### 変更種別
- ✨ 新機能: 3件
- 🐛 バグ修正: 3件
- 📝 ドキュメント: 0件

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

### 3.1 Cargo.toml更新

```bash
# バージョンを更新
sed -i '' 's/^version = ".*"/version = "<new-version>"/' Cargo.toml
```

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
git add Cargo.toml CHANGELOG.md
git commit -m "chore: bump version to <new-version>"
git tag -a v<new-version> -m "Release v<new-version> - <summary>"
git push origin master --tags
```

### 3.4 GitHub Release作成

```bash
gh release create v<new-version> \
  --title "v<new-version> - <summary>" \
  --notes "<release-notes>"
```

### 3.5 Release Workflow完了待機

```bash
# Release workflowの実行を監視
gh run list --workflow=Release --limit 1
gh run watch <run-id>
```

### 3.6 リリースアセット確認

```bash
gh release view v<new-version> --json tagName,assets --jq '.tagName, (.assets[].name)'
```

---

## リリースノートテンプレート

```markdown
## ポモドーロタイマーCLI v<version>

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
curl -LO https://github.com/<owner>/<repo>/releases/download/v<version>/<asset-name>.tar.gz
tar -xzf <asset-name>.tar.gz
sudo mv <binary-name> /usr/local/bin/<command-name>
```

### 動作確認
```bash
<command-name> --version
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
- [ ] masterブランチが最新
- [ ] 未マージのPRなし

### リリース中
- [ ] Cargo.toml更新
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
