---
name: release
description: バージョン提案からGitHub Release作成までの完全ワークフロー
---

# リリースワークフロー

> **スキル参照**: `release-workflow` skill

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | 入力解析 | バージョン引数の解析（省略時は自動提案） |
| 1 | 状態確認 | 現在バージョン取得、前回リリースからの変更取得 |
| 2 | バージョン提案 | セマンティックバージョニングに基づく提案 |
| 2.5 | ユーザー承認 | バージョン確認（`approval-gate` skill） |
| 3 | リリース実行 | Cargo.toml更新、CHANGELOG更新、タグ作成、Push、Release作成 |
| 4 | 完了報告 | リリース結果の報告 |

> **Phase規約**: `workflow-phase-convention` skill を参照

---

## 実装環境

**container-use不要**: リリース作業はホスト環境で直接実行します。

| 理由 | 説明 |
|------|------|
| コード変更なし | バージョンファイルとCHANGELOGのみ更新 |
| ドキュメント操作のみ | 実行可能コードの変更を伴わない |

---

## 実行フロー

### Phase 1: 状態確認

```bash
# 現在のバージョンを取得
current_version=$(grep '^version = ' Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
last_tag=$(git tag --sort=-version:refname | head -1)

# 前回リリースからの変更を取得
git log ${last_tag}..HEAD --oneline
```

### Phase 2: バージョン提案

前回リリースからの変更を分析し、セマンティックバージョニングに基づいてバージョンを提案する。

**提案ロジック**:
1. `feat:` または `feature/` → MINOR
2. `fix:` または `fix/` のみ → PATCH
3. `BREAKING CHANGE` または `!:` → MAJOR

**ユーザーに提案を提示**:
- 現在のバージョン
- 変更内容のサマリー
- 提案バージョン
- 変更種別の内訳

### Phase 2.5: ユーザー承認

> **共通仕様**: `approval-gate` skill を参照

**ユーザーの選択を待つ**:

1. 続行 → 提案バージョンで続行
2. 修正 → 別のバージョンを指定
3. 中断 → キャンセル

> 番号を選択してください（1-3）:

### Phase 3: リリース実行

ユーザー承認後、以下を自動実行：

1. **Cargo.toml更新**: `version = "<new-version>"`
2. **CHANGELOG.md更新**: 変更内容を追記
3. **コミット**: `chore: bump version to <new-version>`
4. **タグ作成**: `v<new-version>`
5. **Push**: `git push origin master --tags`
6. **GitHub Release作成**: `gh release create`
7. **Release Workflow監視**: 完了まで待機
8. **アセット確認**: ダウンロード可能なファイルを確認

---

## 引数

| 引数 | 説明 | 例 |
|------|------|-----|
| `[version]` | リリースバージョン（省略時は自動提案） | `0.5.0`, `1.0.0` |

---

## 使用例

```bash
# バージョン自動提案
/release

# バージョン指定
/release 1.0.0
```

---

## 出力

リリース完了後、以下を報告：

```markdown
## ✅ リリース完了

| 項目 | 内容 |
|------|------|
| バージョン | v<version> |
| リリースURL | https://github.com/<owner>/<repo>/releases/tag/v<version> |
| アセット | <asset-list> |

### 変更内容サマリー
- ✨ 新機能: N件
- 🐛 バグ修正: N件
```
