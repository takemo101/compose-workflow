---
description: ワークフロー改善提案の起案からIssue化までを行う（ROI分析・アクションプラン付）
argument-hint: "[改善のテーマ]"
agent: document-writer
---

# ワークフロー改善提案プロセス

現場の気づきを体系的な提案書に昇華し、実装可能なタスク（GitHub Issue）として具体化します。

## 処理フロー

### 1. Context Analysis & Drafting (分析と起案)
- **現状分析 (As-Is)**: 具体的にどの作業が非効率か？（ログ、ファイル、現状のルールから分析）
- **ROI試算**: その改善により、どれだけの「時間」「トークン」「精神的負荷」が削減できるか？
- **ドラフト作成**: 指定テンプレートに基づき `docs/proposals/` にドラフトを作成。

### 2. Review & Refine (レビューと洗練)
- ユーザーにドラフトを提示。
- **Action**: 修正が必要か、このまま進めるかを確認。

### 3. Finalization & Issue Creation (確定とIssue化)
- **承認時**:
  1. ドキュメントのステータスを `Open` に更新。
  2. **GitHub Issueを作成**（提案書へのリンクを含む）。
  3. Issueには `improvement-proposal` ラベルを付与。

---

## 提案書テンプレート (Strict Format)

```markdown
---
id: PROP-{YYYYMMDD}-NNN
title: {title}
status: Draft  # Draft | Open | Accepted | Rejected | Implemented
author: Sisyphus
date: {YYYY-MM-DD}
---

# {Title}

## 1. Executive Summary
<!-- 提案の核心を3行以内で -->

## 2. Problem & Context (As-Is)
### 現状の課題
<!-- 具体的なペインポイント。例: "〇〇の手順が手動で発生し、毎回5分ロスしている" -->

### 発生頻度・影響範囲
<!-- 例: チーム全体で毎日発生、〇〇機能の開発に影響 -->

## 3. Solution (To-Be)
### 改善案
<!-- 具体的な解決策。新しいコマンド、ツール設定、ルール変更など -->

### 期待される効果 (ROI)
| 項目 | 現状 (Cost) | 改善後 (Benefit) | 効果 (Delta) |
|------|-------------|------------------|--------------|
| 時間 | 例: 10分/回 | 例: 1分/回 | 90%削減 |
| 品質 | 手動ミスあり | 自動化 | ミスゼロ |
| トークン | 大 | 小 | 節約 |

## 4. Implementation Details
### 具体的な変更点
- [ ] ファイル: `path/to/file`
- [ ] コマンド: `/new-command`
- [ ] ルール: `SKILL.md` の修正

### 依存関係・リスク
<!-- 既存機能への影響、学習コストなど -->

## 5. Next Actions
- [ ] GitHub Issue作成
- [ ] 実装担当割り当て: （例: 自分、他のメンバー）
- [ ] 適用ワークフロー: （例: /implement-issues, /basic-design-workflow）
```

## 実行プロンプト（document-writerへの指示）

```markdown
あなたは「厳格なエンジニアリングマネージャー」兼「テクニカルライター」です。
以下の情報を元に、単なるアイデアメモではなく、**「投資判断が可能」なレベルの改善提案書**を作成してください。

**入力情報**:
- テーマ: {theme}
- コンテキスト: {context}

**制約事項**:
1. **ROI分析を必須とする**: 数値（概算で可）を用いて効果をアピールすること。
2. **アクション重視**: 抽象的な「良くする」ではなく、「どのファイルをどう変えるか」まで踏み込むこと。
3. **ファイルパス**: `docs/proposals/PROP-{YYYYMMDD}-{kebab-case-title}.md`
4. **Issue連携**: ドキュメント作成後、ユーザーに「GitHub Issueを作成しますか？」と問いかけるフローを含めること。
```
