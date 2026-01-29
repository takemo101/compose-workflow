---
name: sanitizer
description: 外部入力（Issue/PRの本文）からプロンプトインジェクション対策としてサニタイズを行う
---

# Sanitizer

外部からの入力（GitHub Issue本文、PR説明文など）をLLMに入力する前にサニタイズします。
プロンプトインジェクション攻撃や、予期しない制御文字による誤動作を防ぎます。

---

## 概要

以下の処理を行います：

1. **制御文字の除去**: NULLバイトやバックスペースなどの制御文字を削除
2. **Markdownの無害化**: 危険なHTMLタグ（`<script>`, `<iframe>`など）のエスケープ
3. **プロンプトインジェクション対策**: "Ignore previous instructions" などの既知の攻撃パターンの検出と警告

---

## 使用方法

### ファイル入力

```bash
bash .pi/skills/sanitizer/scripts/sanitize.sh <input-file>
```

### 標準入力

```bash
echo "content" | bash .pi/skills/sanitizer/scripts/sanitize.sh --stdin
```

### 適用箇所

| ワークフロー | タイミング |
|-------------|----------|
| 実装フェーズ | Issue本文を読み込む際 |
| `req-workflow` | ユーザー要件を読み込む際 |
| `pr-merge-workflow` | PR本文を解析する際 |

---

## サニタイズ仕様

### 削除対象（制御文字）

- ASCII 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F
- UTF-8の不正なシーケンス

### エスケープ対象（HTMLタグ）

以下のタグは `&lt;tag&gt;` に変換されます：
- `<script>`
- `<style>`
- `<svg>`
- `<iframe>`
- `<object>`
- `<embed>`

### 警告トリガー（インジェクションパターン）

以下のパターンが含まれる場合、警告ログを出力し、該当部分を `[POTENTIAL INJECTION BLOCKED]` に置換します：

- `Ignore previous instructions`
- `System override`
- `You are now ...` (role hijacking)

---

## 制限事項

- 完全なセキュリティを保証するものではありません。
- LLM自体の安全性フィルタと併用することを推奨します。
