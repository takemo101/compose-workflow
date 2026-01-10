---
model: google/antigravity-gemini-3-flash
description: 対象技術の最新情報を調査し、技術調査レポートを作成する
---

# 技術キャッチアップ・完全ワークフロー

対象技術に関する最新情報を調査し、技術調査レポートを作成する自動化ワークフローです。
基本設計フェーズ前に実行することで、技術選定の精度向上と設計ミスの予防を図ります。

> **使用モデル**: Gemini 3 Flash（コスト効率重視）

## 入力

$ARGUMENTS（対象技術リスト、調査深度など）

### 入力形式

以下の形式で入力を受け付けます：

```
技術: [調査対象技術のリスト（カンマ区切り）]
深度: [quick/standard/deep]（省略時: standard）
要件: [要件定義書のパス（任意）]
目的: [調査の目的・背景（任意）]
```

**入力例:**
```
技術: Next.js 15, Prisma, TanStack Query v5
深度: standard
要件: docs/requirements/REQ-XXX-001_機能名.md
目的: 半年ぶりの技術更新、Breaking Changes確認
```

**簡易入力（技術名のみ）:**
```
React 19, Bun
```

---

## 調査深度の定義

| 深度 | 調査範囲 | 所要時間目安 | 成果物 |
|------|---------|------------|--------|
| **quick** | 最新バージョン・Breaking Changesのみ | 5-10分 | 簡易レポート |
| **standard** | 上記 + 新機能・非推奨・マイグレーション + **実装向け情報** | 15-30分 | 標準レポート |
| **deep** | 上記 + ベストプラクティス・エコシステム動向・競合比較 | 30-60分 | 詳細レポート |

### standard以上で含まれる実装向け情報

| 項目 | 内容 |
|------|------|
| **インストール方法** | パッケージマネージャー別のインストールコマンド |
| **基本的な使い方** | 最小構成のコード例（コピペで動く） |
| **参照リンク集** | 公式ドキュメント、GitHub、APIリファレンス等 |
| **よくあるエラーと対処** | 初期セットアップで躓きやすいポイント |

---

## 実行プロセス

### Phase 0.5: コンテキスト確認

**実行内容:**
1. 既存プロジェクトの `package.json` / `Cargo.toml` 等から現行バージョンを確認
2. 直近30日以内に同一技術の調査レポートが存在するか確認
3. 調査の重複を防止

**スキップ条件:**
- 直近30日以内に同一技術の調査レポートが存在 → ユーザーに確認

---

### Phase 1: 調査対象の特定と優先度付け

**実行内容:**
1. 入力から調査対象技術を抽出
2. 要件定義書が指定されている場合、追加の技術キーワードを抽出
3. 調査優先度を決定

**優先度判定基準:**

| 優先度 | 条件 | 例 |
|--------|------|-----|
| 高 | メジャーバージョン差あり | Next.js 13 → 15 |
| 高 | 未使用技術（新規導入） | 初めてのRust |
| 中 | マイナーバージョン差あり | React 18.2 → 18.3 |
| 中 | 1年以上触れていない | 久しぶりのDocker |
| 低 | 現行最新、日常的に使用 | 毎日使うTypeScript |

**スキップ条件:**
- 全技術が「低」優先度 かつ ユーザーが明示的にスキップを許可

---

### Phase 2: 最新情報収集（軽量版）

**librarianエージェントを起動して技術概要のみを調査:**

> **実装方法**: 
> - `call_omo_agent` でバックグラウンド実行
> - **技術概要のみ** にフォーカスし、コード例や詳細調査をスキップ
> - 使用ツール: `websearch_exa` (メイン)
>
> **⚠️ 制約（動作軽量化）**:
> - コード例、インストール手順、詳細な変更点は調査しない
> - 公式サイトのメタデータ（バージョン、日付、URL）のみ取得
> - リポジトリへのアクセス・ダウンロードは一切行わない

1. **基本情報確認**
   - 最新バージョン番号とリリース日
   - 公式ドキュメントURL
   - 概要（1-2行）

2. **詳細調査（スキップ）**
   - コード例、マイグレーションガイド、エコシステム調査は実施しない
   - 必要であればユーザーが個別に調査を行う前提とする

**調査ソース:**
- 公式ドキュメント（最優先）
- GitHub Releases / Changelog
- 公式ブログ
- RFC / Proposal（deep のみ）
- 公式Getting Started / Quickstart（standard以上）
- 公式Examples / Tutorials（standard以上）

---

### Phase 3: 技術調査レポート作成

**出力先:**
- **単体調査時**: `docs/research/TECH-[カテゴリ]-[連番]_[技術名].md`
- **複数調査時**: `docs/research/TECH-REPORT-[YYYYMMDD]_Combined.md`（統合レポート）
  > **Note**: 大量ファイル生成を防ぐため、複数技術の調査時は1つのMarkdownファイルに統合します。

**カテゴリ定義:**

| カテゴリ | 対象 |
|---------|------|
| FE | フロントエンドフレームワーク・ライブラリ |
| BE | バックエンドフレームワーク・ライブラリ |
| DB | データベース・ORM |
| INFRA | インフラ・DevOps・コンテナ |
| LANG | プログラミング言語・ランタイム |
| TOOL | 開発ツール・ビルドツール |

**レポート構成（参照インデックス版）:**

```markdown
# 技術調査レポート: [技術名]

| 項目 | 内容 |
|------|------|
| 調査日 | YYYY-MM-DD |
| 最新バージョン | vX.Y.Z |

## 参照リンク（公式）
- **公式ドキュメント**: [URL]
- **GitHubリポジトリ**: [URL]

## 技術概要
[LLMの知識ベースに基づいて1-2行で記載]

## メモ
[必要に応じて追記]
```

---

---

### Phase 4: 基本設計への引き継ぎ

**実行内容:**

1. **技術調査レポートの要約生成**
   - 設計に影響する重要ポイントを抽出
   - 未解決課題（I-XXX）として記録

2. **基本設計ワークフローへの連携準備**
   - 技術調査レポートへのリンクを準備
   - 技術スタック選定ヒアリングへのインプット整理

3. **次ステップの案内**

---

## サーキットブレーカー

| 条件 | アクション |
|------|----------|
| 公式ドキュメントにアクセス不可 | 代替ソース使用 + 警告表示 |
| 情報が古い可能性あり | `⚠️ 要確認` マークを付与 |
| 調査時間超過（deep: 90分以上） | 中間レポート出力して終了 |

---

## 最終出力

```markdown
## 技術キャッチアップ完了報告

### 実行サマリー

| 項目 | 内容 |
|------|------|
| 調査技術数 | X件 |
| 調査深度 | standard |
| 所要時間 | XX分 |

### 調査結果一覧

| 技術 | 現行 | 最新 | 影響度 | レポート |
|------|------|------|--------|---------|
| Next.js | 14.0.0 | 15.1.0 | 🔴 高 | [リンク] |
| Prisma | 5.0.0 | 5.5.0 | 🟡 中 | [リンク] |
| TanStack Query | v4 | v5 | 🔴 高 | [リンク] |

### 実装クイックリファレンス

| 技術 | インストール | 公式ドキュメント | GitHub |
|------|-------------|-----------------|--------|
| Next.js | `npm install next@15` | [nextjs.org/docs](URL) | [vercel/next.js](URL) |
| Prisma | `npm install prisma` | [prisma.io/docs](URL) | [prisma/prisma](URL) |
| TanStack Query | `npm install @tanstack/react-query` | [tanstack.com/query](URL) | [TanStack/query](URL) |

### 設計への影響サマリー

#### 🚨 必須対応（基本設計前に決定必要）

1. **Next.js 15**: App Router完全移行が必要。Pages Router非推奨
2. **TanStack Query v5**: API大幅変更。既存コード要修正

#### ⚠️ 注意事項

- Prisma 5.5: 新しいクエリエンジン。パフォーマンステスト推奨

#### 未解決課題

| ID | 課題 | 対応方針 |
|----|------|---------|
| I-XXX | Next.js 14→15移行戦略 | 基本設計で決定 |

### 成果物

- docs/research/TECH-FE-001_Next.js.md
- docs/research/TECH-BE-002_Prisma.md
- docs/research/TECH-FE-003_TanStack-Query.md

### 次のステップ

1. 技術調査レポートの確認
2. 不明点があればユーザーに確認
3. `/basic-design-workflow` の実行（技術調査レポートを参照）
```

---

## エラーハンドリング

| 状況 | 対処法 |
|------|--------|
| 技術名が曖昧 | 候補を提示してユーザーに確認 |
| 公式ドキュメントなし | GitHub / npm / crates.io から情報収集 |
| バージョン情報取得失敗 | 手動入力を依頼 |
| 深度「deep」で時間超過 | 中間成果を保存して続行オプション提示 |

---

## Sisyphusへの指示

```python
def tech_catchup_workflow(input_args):
    """
    技術キャッチアップワークフローのメイン処理
    
    使用ツール:
    - call_omo_agent(subagent_type='librarian'): 外部ドキュメント調査（並列実行）
    - websearch_exa: Web検索
    - context7_query-docs: ライブラリドキュメント検索
    - webfetch: 公式ドキュメント取得
    """
    
    # Phase 0.5: コンテキスト確認
    # 既存プロジェクトのバージョン確認（package.json, Cargo.toml等）
    current_versions = detect_current_versions()
    
    # 直近30日以内の同一技術調査レポートを確認
    existing_reports = glob("docs/research/TECH-*.md")
    recent_reports = filter_recent(existing_reports, days=30)
    
    # Phase 1: 調査対象の特定と優先度付け
    technologies = parse_technologies(input_args)
    req_path = input_args.get('requirements')
    depth = input_args.get('depth', 'standard')
    
    if req_path:
        # 要件定義書から追加の技術キーワード抽出
        additional_techs = extract_tech_keywords(req_path)
        technologies.extend(additional_techs)
    
    # 優先度付け（recent_reportsで調査済みはスキップ）
    prioritized = prioritize_technologies(technologies, current_versions, recent_reports)
    
    # スキップ判定
    if all(t.priority == 'low' for t in prioritized):
        if await confirm_skip():
            return skip_with_summary()
    
    # Phase 2: 最新情報収集（省エネモード：シングルエージェント）
    # トークン節約のため、1つのlibrarianエージェントに全技術の調査を依頼する
    
    tech_list_str = ", ".join([t.name for t in prioritized])
    
    # 統合プロンプトの作成
    prompt = f"""
    Collect REFERENCE URLs and METADATA for the following technologies.
    Target Technologies: {tech_list_str}
    
    For EACH technology, provide ONLY:
    1. Latest Version Number (e.g., v15.1.0)
    2. Official Documentation URL
    3. GitHub Repository URL
    
    Use tools: websearch_exa (Preferred)
    Output the result as a structured JSON list.
    
    IMPORTANT: Return ONLY the raw JSON list. No markdown formatting.
    Start with [ and end with ].
    
    ===== RESTRICTIONS =====
    - DO NOT summarize the technology
    - DO NOT look for features or changes
    - DO NOT download anything
    - GOAL is just to create an index of links
    ========================
    """

    # シングルエージェント起動
    task_id = call_omo_agent(
        subagent_type='librarian',
        run_in_background=True,
        description=f"Batch Research: {tech_list_str}",
        prompt=prompt
    )
    
    # 結果待機
    raw_result = background_output(task_id=task_id)
    
    # 結果のパース（JSONリストを辞書に変換）
    # 期待形式: [{ "name": "Next.js", "version": "v15.0", "docs": "...", "github": "..." }, ...]
    reports = parse_json_result(raw_result)
    
    # Phase 3: レポート作成（リンク集のみ）
    report_paths = []
    
    if len(reports) > 1:
        # 複数技術の場合は統合レポートを作成
        date_str = get_current_date_str()
        path = f"docs/research/TECH-REPORT-{date_str}_Combined.md"
        
        # 統合インデックスレポートの作成
        create_combined_index_report(path, reports)
        report_paths.append(path)
    else:
        # 単体の場合は個別ファイル作成
        for tech in reports:
            category = determine_category(tech.get('name', 'UNKNOWN'))
            next_id = get_next_report_id(category)
            path = f"docs/research/TECH-{category}-{next_id}_{tech.get('name', 'unknown')}.md"
            
            create_index_report(path, tech)
            report_paths.append(path)
    
    # Phase 4: 基本設計への引き継ぎ
    # 複雑な分析（impact_summary等）は廃止し、単純な完了報告のみ返す
    
    handoff = {
        'reports': report_paths,
        'status': 'completed',
        'note': 'Technical details should be checked by humans using the provided links.'
    }
    
    return success(handoff)
```

---

## 関連ドキュメント

- 前工程: `/req-workflow`（要件定義）
- 次工程: `/basic-design-workflow`（基本設計）
- 参照: `.opencode/README.md`（ワークフロー全体図）

## 参照スキル

| スキル | 用途 |
|--------|------|
| {{skill:workflow-phase-convention}} | Phase番号体系・承認ゲート規約 |
| {{skill:approval-gate}} | ユーザー承認ゲートの共通フォーマット |
