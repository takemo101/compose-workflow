# Issue実装コマンド (TDD + container-use)

指定されたGitHub Issueを実装します。
**TDD（テスト駆動開発）を強制**し、品質基準を満たすまでリトライします。
**container-use環境**でクローズドな開発・テストを行います。

---

## 📌 重要: 実装単位の原則

> **Subtaskがある場合、実装フローはIssue単位ではなくSubtask単位で実行する。**
> 各Subtaskが**独立したブランチ・環境・PR**を持つことが重要。

| 状況 | 実装単位 | 実行内容 |
|------|---------|---------|
| **Subtaskあり** | **Subtask単位** | 各Subtaskごとに: ブランチ作成 → 環境構築 → TDD → レビュー → PR → CI → マージ |
| **Subtaskなし** | Issue単位 | Issue全体で: ブランチ作成 → 環境構築 → TDD → レビュー → PR → CI → マージ |

```
【例】Issue #8 に Subtask #9, #10, #11 がある場合

❌ 従来（Issue単位で1つにまとめる）:
Issue #8 → 1ブランチ → 1環境 → 1PR

✅ 新（Subtask単位で独立）:
Subtask #9  → feature/issue-9-xxx  → 環境A → PR #25 → マージ
    ↓
Subtask #10 → feature/issue-10-xxx → 環境B → PR #26 → マージ  ← 順次実行
    ↓
Subtask #11 → feature/issue-11-xxx → 環境C → PR #27 → マージ
    ↓
全Subtask完了 → 親Issue #8 自動クローズ
```

---

## 🚀 処理方式（必須ルール）

> **⛔ 絶対ルール**: 各Subtaskは**独立したブランチ・環境・PR**を持つこと。

### 処理方式の使い分け

| 状況 | 処理方式 | 理由 |
|------|---------|------|
| **親Issue内のSubtask** | **順次実行** | 安定性重視、エラー追跡容易 |
| **複数の親Issue** | **並列実行** | 独立したIssueは並列で効率化 |

```
/implement-issues 8 15   ← 複数の親Issue指定

親Issue #8 (Subtask: #9, #10, #11)     ┐
├── #9 → ブランチ → 環境 → PR → マージ  │
├── #10 → ブランチ → 環境 → PR → マージ │ ← 順次
└── #11 → ブランチ → 環境 → PR → マージ │
    → #8 クローズ                       │
                                        ├─ 並列実行
親Issue #15 (Subtask: #16, #17)        │
├── #16 → ブランチ → 環境 → PR → マージ │
└── #17 → ブランチ → 環境 → PR → マージ │ ← 順次
    → #15 クローズ                      ┘
```

### ✅ 正しい実装フロー

```python
def implement_subtasks(parent_issue_id: int, subtask_ids: list[int]):
    """各Subtaskを順次実装（独立したブランチ・環境・PR）"""
    
    results = []
    
    for subtask_id in subtask_ids:
        # Step 1: このSubtask用のブランチ作成（Sisyphus）
        branch_name = create_feature_branch(subtask_id)
        
        # Step 2: container-workerで実装（レビューループ含む）
        task_id = background_task(
            agent="container-worker",
            description=f"Subtask #{subtask_id} 実装",
            prompt=build_subtask_prompt(subtask_id, branch_name)
        )
        
        # Step 3: 完了を待つ（container-worker内でレビューループ実行済み）
        # ⚠️ collect_worker_result() で最小化（セクション14参照）
        result = collect_worker_result(task_id)
        
        # Step 4: CI監視 → マージ → 環境削除（Sisyphus）
        if result.get("pr_number"):
            post_pr_workflow(result["pr_number"], result["env_id"])
        
        results.append(result)
    
    # Step 5: 全Subtask完了 → 親Issue自動クローズ
    if all(r.get("status") == "merged" for r in results):
        close_parent_issue(parent_issue_id, results)
    
    return results
```

### container-worker内のレビューループ

詳細は {{skill:implement-subtask-rules}} を参照。

**要約**: TDD実装 → レビュー（9点以上まで最大3回） → PR作成

### Subtask実装の原則

| 原則 | 説明 |
|------|------|
| **1 Subtask = 1 ブランチ** | `feature/issue-{subtask_id}-xxx` |
| **1 Subtask = 1 container-use環境** | 独立した環境で実装・テスト |
| **1 Subtask = 1 PR** | 独立したPRでレビュー・マージ |
| **1 Subtask = 1 レビューループ** | 9点以上になるまで修正→再レビュー |
| **順次処理** | 1つのSubtaskが完了（マージ）してから次へ |

### 各Subtaskの実装フロー（レビューループ含む）

```
Subtask #9 の実装フロー:

ブランチ作成 → 環境構築 → TDD実装
                            ↓
                     品質レビュー ←───────┐
                            ↓            │
                    スコア判定            │
                     ├─ 9点以上 → PR作成 → CI → マージ → 環境削除 → ✅ 完了
                     └─ 9点未満 → 修正 ──┘（ループ: 最大3回）
                                         
                            ↓ (3回失敗)
                     Draft PR作成 → ユーザーにエスカレーション
```

各Subtaskは独立してこのフローを完了してから、次のSubtaskへ進む。

### ❌ 禁止パターン

| 禁止 | 理由 |
|------|------|
| 複数Subtaskを1つのブランチにまとめる | レビュー・ロールバックが困難 |
| 複数Subtaskを1つのPRにまとめる | 変更が大きくなりレビュー品質低下 |
| `task(subagent_type="container-worker", ...)` | MCPツール（container-use）が継承されない |
| ホスト環境で直接実装 | container-use必須ルール違反 |

### ⛔ `task` vs `background_task` 使い分けルール

> **MCPツール（container-use）を使う必要があるエージェントを起動する場合のみ `background_task` が必須。**

| 呼び出し元 | 呼び出し先 | 使用ツール | 理由 |
|-----------|-----------|-----------|------|
| **Sisyphus** | **container-worker** | **`background_task`** | MCPツール継承が必要（⛔ `task` 禁止） |
| container-worker | backend-reviewer | `task` | MCPツール継承不要（OK） |
| container-worker | frontend-reviewer | `task` | MCPツール継承不要（OK） |

**技術的理由**:
- `task` → MCPツールが継承されない → container-workerが `container-use_*` にアクセス不可
- `background_task` → MCPツールが継承される → container-use環境での実装が可能

### 複数親Issue指定時の並列処理

複数の親Issueが指定された場合（例: `/implement-issues 8 15`）:

```python
def implement_multiple_parent_issues(parent_issue_ids: list[int]):
    """
    複数の親Issueを並列処理
    各親Issue内のSubtaskは順次処理
    """
    
    # 各親Issueに対してbackground_taskを起動（並列）
    task_ids = {}
    for parent_id in parent_issue_ids:
        task_id = background_task(
            agent="container-worker",
            description=f"親Issue #{parent_id} のSubtask群を実装",
            prompt=f"""
## タスク
親Issue #{parent_id} のSubtaskを**順次**実装してください。

## 処理フロー
1. Subtaskを検出: `gh issue view {parent_id}` でSubtaskリストを取得
2. 各Subtaskを順次処理:
   - ブランチ作成（from mainブランチ）
   - container-use環境構築
   - TDD実装
   - レビュー
   - PR作成 → CI → マージ
   - 環境削除
3. 全Subtask完了後、親Issue #{parent_id} をクローズ

## 期待する出力（JSON形式）
{{
    "parent_issue_id": {parent_id},
    "subtasks": [
        {{"subtask_id": N, "pr_number": N, "status": "merged"}},
        ...
    ],
    "parent_closed": true
}}
"""
        )
        task_ids[parent_id] = task_id
    
    # 全親Issueの完了を待つ
    # ⚠️ collect_worker_result() で最小化（セクション14参照）
    results = []
    for parent_id, task_id in task_ids.items():
        result = collect_worker_result(task_id)
        results.append(result)
    
    # サマリー報告
    report_parallel_results(results)
```

### 依存関係がある場合

Subtask間に依存関係がある場合は、依存元を先に実装する（順次処理なので自然に対応可能）。
詳細は「Subtask検出」セクションの `implement_subtasks_with_deps` を参照。

---

## ⛔ 絶対ルール（違反厳禁）

> **container-use環境の使用は必須です。ホスト環境での直接実装は一切禁止。**
> ※ 例外: プラットフォーム固有コード（後述）

| ⛔ 絶対禁止 | ✅ 必ずこうする |
|------------|----------------|
| ホスト環境で `edit` / `write` ツールを使用 | `container-use_environment_file_write` を使用 |
| ホスト環境で `bash git commit/push` を実行 | `container-use_environment_run_cmd` でgit操作 |
| ホスト環境で `bash cargo test` 等を実行 | `container-use_environment_run_cmd` でテスト |
| `cu-*` ブランチから直接PRを作成 | featureブランチを作成してからPR |
| container-use環境を作成せずに実装開始 | 必ず環境作成してから実装 |

**違反した場合**: 即座に作業を中断し、正しいフローでやり直すこと。

### 🍎 例外: プラットフォーム固有コード

以下の条件を**すべて満たす**場合のみ、ホスト環境での作業を許可:

| 条件 | 説明 |
|------|------|
| ① プラットフォーム固有API | macOS専用（objc2等）、Windows専用、iOS/Android専用 |
| ② コンテナで検証不可 | LinuxコンテナではビルドまたはAPIが利用不可 |
| ③ CI環境で検証可能 | GitHub Actions等の対応ランナーで最終検証 |

#### 判断フロー（決定木）

```python
def should_use_platform_exception(issue_id: int, design_doc: str) -> PlatformDecision:
    """
    プラットフォーム固有コード例外の判断
    
    判断者: Sisyphus（container-worker起動前に判断）
    """
    
    # 1. 設計書から使用ライブラリを抽出
    libraries = extract_libraries_from_design(design_doc)
    
    # 2. プラットフォーム固有ライブラリのチェック
    platform_specific = {
        "macos": ["objc2", "cocoa", "core-foundation", "core-graphics", 
                  "core-audio", "security-framework", "appkit"],
        "windows": ["windows-rs", "winapi", "win32"],
        "ios": ["swift", "uikit"],
        "android": ["kotlin", "android-ndk"]
    }
    
    detected_platform = None
    for platform, libs in platform_specific.items():
        if any(lib in libraries for lib in libs):
            detected_platform = platform
            break
    
    if not detected_platform:
        # プラットフォーム固有ライブラリなし → container-use必須
        return PlatformDecision(
            use_exception=False,
            reason="クロスプラットフォームコード",
            executor="container-worker"
        )
    
    # 3. コンテナでビルド可能かチェック
    can_build_in_container = check_container_compatibility(libraries)
    
    if can_build_in_container:
        # ビルドだけならコンテナで可能（実行テストはCI）
        return PlatformDecision(
            use_exception=False,
            reason="コンテナでビルド可能（実行テストはCIで実施）",
            executor="container-worker",
            ci_required=True,
            ci_runner=f"{detected_platform}-latest"
        )
    
    # 4. 例外適用
    return PlatformDecision(
        use_exception=True,
        reason=f"{detected_platform}専用APIでコンテナビルド不可",
        executor="host",  # Sisyphusがホスト環境で直接実装
        ci_required=True,
        ci_runner=f"{detected_platform}-latest"
    )
```

#### 責任分担

| 判断者 | 責任 | タイミング |
|--------|------|----------|
| **Sisyphus** | 例外適用の判断 | Issue実装開始前（container-worker起動前） |
| **Sisyphus** | ホスト環境での実装 | 例外適用時のみ |
| **container-worker** | 例外適用の報告 | 作業中に例外が必要と判明した場合 |

#### container-workerが例外を検出した場合

```python
def handle_platform_exception_in_worker(env_id: str, issue_id: int, reason: str):
    """container-worker内で例外が必要と判明した場合"""
    
    # 1. 作業を中断
    # 2. 環境を保持（削除しない）
    # 3. Sisyphusに報告して判断を委ねる
    
    return WorkerResult(
        status="exception_required",
        env_id=env_id,
        issue_id=issue_id,
        reason=reason,
        recommendation="Sisyphusがホスト環境で実装を引き継ぐ必要があります"
    )
```

**例外適用時のルール**:

```
1. 作業開始時にユーザーに例外適用を報告
2. 他のIssueとブランチ競合がないことを確認
3. featureブランチで作業（mainブランチ直接編集禁止）
4. CI通過を最終確認として必須
```

**例外に該当する例**:
- macOS: `objc2`, `cocoa`, `core-foundation`
- Windows: `windows-rs`, `winapi`
- モバイル: `swift`, `kotlin`

**例外に該当しない例**:
- クロスプラットフォームのRust/Node.js/Pythonコード → container-use必須
- 条件付きコンパイル(`#[cfg]`)でも、ロジック部分はcontainer-useで検証可能

---

## 🔀 並行作業時の環境分離（重要）

複数のIssueを並行して処理する場合、**container-use環境による分離が必須**です。

### なぜ必要か

| 問題 | ホスト環境の場合 | container-use環境の場合 |
|------|-----------------|----------------------|
| ブランチ競合 | 切り替えが必要、未コミット変更が衝突 | 各環境で独立したブランチ |
| 依存関係 | Cargo.lock/package-lock.jsonが混在 | 環境ごとに隔離 |
| ビルドキャッシュ | 互いに影響 | 完全に独立 |
| 作業中断 | 状態保持が困難 | 環境を閉じて後で再開可能 |

### 並行作業フロー

```
Issue #42 → container環境 A (env_id: abc-123)
  └─ feature/issue-42-user-auth ブランチ
  └─ 独立したファイルシステム

Issue #43 → container環境 B (env_id: def-456)
  └─ feature/issue-43-payment ブランチ
  └─ 完全に隔離された状態
```

### 環境管理

{{skill:environments-json-management}}

---

## 引数

Issue番号を指定します。複数指定可能。

| 形式 | 例 | 処理方法 |
|------|-----|---------|
| 単一Issue | `/implement-issues 123` | Subtask自動検出 → 順次処理 |
| 複数Issue（スペース区切り） | `/implement-issues 9 10` | **並列処理** |
| 複数Issue（カンマ区切り） | `/implement-issues 9,10,11` | **並列処理** |
| 範囲指定 | `/implement-issues 9-12` | **並列処理** (9,10,11,12) |
| 親Issue | `/implement-issues 8` | **Subtask自動検出 → 順次処理** |

### 引数パース処理

| 入力 | 出力 | 説明 |
|------|------|------|
| `123` | `[123]` | 単一Issue（Subtaskあれば展開） |
| `9 10` | `[9, 10]` | スペース区切り |
| `9,10,11` | `[9, 10, 11]` | カンマ区切り |
| `9-12` | `[9, 10, 11, 12]` | 範囲指定 |

### 🔄 親Issue → Subtask自動検出（重要）

> **詳細**: {{skill:subtask-detection}} を参照

**概要**: 単一Issue指定時は、必ずSubtaskの有無を確認。Subtaskがある場合、各Subtaskごとに独立したブランチ・環境・PRを作成して**順次実装**する。

| 検出結果 | 処理 |
|---------|------|
| Subtask検出（N件） | 依存関係チェック → 順次実装 |
| Subtaskなし + 200行以下 | 単体実装 |
| Subtaskなし + 200行超 | `/decompose-issue` を案内 |

**Subtask順次実装の構造**:
```
親Issue #8 → Subtask #9 → #10 → #11 → 親Issue自動クローズ
            (各Subtaskが独立したブランチ・環境・PRを持つ)
```

#### 依存関係付きSubtask実装ロジック

```python
def implement_subtasks_with_deps(parent_id: int, subtask_ids: list[int]):
    """依存関係を考慮したSubtask順次実装"""
    
    # 依存関係をチェックしてソート（subtask-detection.md参照）
    sorted_subtasks = check_subtask_dependencies(subtask_ids)
    report_to_user(f"📋 {len(subtask_ids)}件のSubtaskを依存関係順に実装します: {sorted_subtasks}")
    
    results = []
    for i, subtask_id in enumerate(sorted_subtasks, 1):
        report_to_user(f"🔄 Subtask {i}/{len(sorted_subtasks)}: #{subtask_id} を実装中...")
        
        # Subtask単体実装（ブランチ作成〜PR作成）
        result = implement_single_subtask(subtask_id)
        results.append(result)
        
        # 失敗したら中断
        if result.get('status') == 'failed':
            report_to_user(f"⚠️ Subtask #{subtask_id} の実装に失敗。後続をスキップします")
            break
            
        # 成功したらCI監視〜マージへ（implement_single_subtask内でpost_pr_workflowが呼ばれる）
    
    return results
```

## ワークフロー概要

### 実装単位の考え方

> **⚠️ 重要**: 実装フローの単位は「Issue」ではなく「実装可能な最小単位」である。
> - Subtaskがある場合 → **Subtask単位**で実装フローを実行
> - Subtaskがない場合 → **Issue単位**で実装フローを実行

```
【従来】Issue単位で実装
Issue #8 → ブランチ → 環境 → TDD → レビュー → PR → CI → マージ

【新】Subtaskがある場合はSubtask単位で実装
Issue #8 (親)
├── Subtask #9 → ブランチ → 環境 → TDD → レビュー → PR → CI → マージ
│       ↓ (完了後)
├── Subtask #10 → ブランチ → 環境 → TDD → レビュー → PR → CI → マージ  ← 順次実行
│       ↓ (完了後)
└── Subtask #11 → ブランチ → 環境 → TDD → レビュー → PR → CI → マージ
    ↓
全Subtask完了 → 親Issue #8 自動クローズ
```

<!-- [DIAGRAM-FOR-HUMANS] 全体ワークフロー図（AI処理時はスキップ）
単一Issue指定 → Subtask検出 → [Subtaskあり] → Subtask単位で順次実装（各Subtaskが独立した実装フロー）
                           → [Subtaskなし] → 粒度チェック → [200行超] → /decompose-issue
                                                        → [200行以下] → Issue単位で実装

実装フロー（Issue/Subtask共通）:
ブランチ作成 → container-use環境 → TDD → レビュー → PR作成 → CI → マージ

→ 全Subtask完了 → Parent Issue Close
-->

## 🔄 前提条件: 適切な粒度のIssue

{{skill:issue-size-estimation}}

## 実行プロセス

### 0. ブランチ作成 (container-use環境作成前) ⚠️ 必須

Issue着手時に、まず**featureブランチを作成**します。

> **⚠️ 重要**: container-use環境が作成する `cu-*` ブランチを直接PRに使用してはいけません。
> 必ずfeatureブランチを作成し、そのブランチで作業を行ってください。

#### 責任者: Sisyphus（親エージェント）

> **⛔ 絶対ルール**: ブランチ作成は**必ずSisyphus**が行う。container-workerはブランチを作成しない。

| 処理 | 実行者 | 理由 |
|------|--------|------|
| ブランチ作成 | **Sisyphus** | ホスト環境でのgit操作 |
| container-use環境作成 | container-worker | 作成済みブランチを`from_git_ref`で指定 |

#### 単体実装時

```python
# Sisyphus がホスト側でブランチ作成 (bashツール使用)
bash("git checkout main && git pull origin main")
bash(f"git checkout -b feature/issue-{issue_id}-{short_description}")
bash(f"git push -u origin feature/issue-{issue_id}-{short_description}")

# その後 container-worker を起動
background_task(
    agent="container-worker",
    prompt=f"""
    ## ブランチ情報（Sisyphusが作成済み）
    - ブランチ名: feature/issue-{issue_id}-{short_description}
    - from_git_ref でこのブランチを指定してcontainer-use環境を作成すること
    ...
    """
)
```

#### Subtask順次実装時のブランチ作成

> **⚠️ 重要**: 各Subtaskごとに独立したfeatureブランチを作成する。
> ブランチは各Subtask実装開始時に作成（事前一括作成は不要）。

```python
def create_subtask_branch(subtask_id: int) -> str:
    """
    Sisyphusが各Subtask用のブランチを作成
    
    Args:
        subtask_id: Subtask Issue ID
    
    Returns:
        作成したブランチ名
    """
    # mainを最新化
    bash("git checkout main && git pull origin main")
    
    # Subtask情報を取得
    issue = fetch_github_issue(subtask_id)
    short_desc = slugify(issue.title)[:30]
    
    # featureブランチを作成
    branch_name = f"feature/issue-{subtask_id}-{short_desc}"
    bash(f"git checkout -b {branch_name}")
    bash(f"git push -u origin {branch_name}")
    
    # mainに戻る
    bash("git checkout main")
    
    return branch_name

# 使用例: Subtask順次実装
subtasks = detect_subtasks(parent_issue_id=8)  # → [9, 10, 11]

for subtask_id in subtasks:
    # Step 1: このSubtask用のブランチ作成
    branch_name = create_subtask_branch(subtask_id)
    
    # Step 2: container-workerで実装
    task_id = background_task(
        agent="container-worker",
        prompt=f"""
        ## タスク
        Subtask #{subtask_id} を実装し、PRを作成してください。
        
        ## ブランチ情報（Sisyphusが作成済み）
        - ブランチ名: {branch_name}
        - ⚠️ 新規ブランチを作成しないこと（既存を使用）
        - container-use環境作成時に `from_git_ref="{branch_name}"` を指定
        
        ## 親Issue
        - 親Issue: #8（全Subtask完了後にSisyphusが自動クローズ）
        
        ## 期待する出力（JSON形式）
        {{"subtask_id": {subtask_id}, "pr_number": N, "env_id": "xxx", "score": N}}
        """
    )
    
    # Step 3: 完了を待つ
    result = background_output(task_id=task_id)
    
    # Step 4: CI監視 → マージ → 環境削除
    post_pr_workflow(result["pr_number"], result["env_id"])
```

#### Subtask順次実装の全体フロー

```python
def implement_parent_issue_with_subtasks(parent_issue_id: int):
    """
    親IssueのSubtaskを検出し、各Subtaskを順次実装
    
    フロー:
    1. Subtask検出
    2. 各Subtaskを順次処理:
       - ブランチ作成（Sisyphus）
       - container-workerで実装
       - CI監視・マージ（Sisyphus）
       - 環境削除
    3. 全Subtask完了後、親Issue自動クローズ
    """
    
    # Step 1: Subtask検出
    subtasks = detect_subtasks(parent_issue_id)
    if not subtasks:
        # Subtaskなし → 単体実装
        return implement_single_issue(parent_issue_id)
    
    report_to_user(f"📋 親Issue #{parent_issue_id} から {len(subtasks)}件のSubtaskを検出。順次実装します。")
    
    results = []
    
    # Step 2: 各Subtaskを順次処理
    for i, subtask_id in enumerate(subtasks, 1):
        report_to_user(f"🔄 Subtask {i}/{len(subtasks)}: #{subtask_id} を実装中...")
        
        # 2a: ブランチ作成
        branch_name = create_subtask_branch(subtask_id)
        
        # 2b: container-workerで実装
        task_id = background_task(
            agent="container-worker",
            description=f"Subtask #{subtask_id} 実装",
            prompt=build_subtask_worker_prompt(subtask_id, branch_name, parent_issue_id)
        )
        # ⚠️ collect_worker_result() で最小化（セクション14参照）
        result = collect_worker_result(task_id)
        
        # 2c: CI監視・マージ・環境削除
        if result.get("pr_number"):
            post_pr_workflow(result["pr_number"], result["env_id"])
        
        results.append(result)
    
    # Step 3: 全Subtask完了確認 → 親Issue自動クローズ
    if all(r.get("status") == "merged" for r in results):
        close_parent_issue(parent_issue_id, results)
    
    return results
```

**ブランチ命名規則**:
| プレフィックス | 用途 |
|---------------|------|
| `feature/issue-{N}-*` | 機能追加 |
| `fix/issue-{N}-*` | バグ修正 |
| `refactor/issue-{N}-*` | リファクタリング |

**アンチパターン（禁止事項）**:
| ❌ 禁止 | ✅ 正しい方法 |
|--------|-------------|
| `cu-*` ブランチから直接PRを作成 | featureブランチからPRを作成 |
| container-workerがブランチを作成 | Sisyphusが事前にブランチを作成 |
| ブランチ作成をスキップしてcontainer-use環境を開始 | 先にfeatureブランチを作成してからcontainer-use環境を作成 |
| ホスト環境で `edit`/`write` ツールを使ってコード編集 | `container-use_environment_file_write` を使用 |
| ホスト環境で `bash` ツールを使ってテスト実行 | `container-use_environment_run_cmd` を使用 |
| container-use環境なしで実装を開始 | 必ず環境作成後に実装開始 |

### 0.5. 設計書存在チェック ⚠️ 必須

> **⚠️ 重要**: 実装開始前に、対象Issueに対応する詳細設計書が存在することを確認してください。

```python
def check_design_document(issue_id: int) -> DesignDocResult:
    """
    Issueに対応する設計書の存在を確認
    
    Returns:
        DesignDocResult: 設計書の存在状態と参照パス
    """
    
    # 1. Issueからラベル・タイトルを取得
    issue = fetch_github_issue(issue_id)
    
    # 2. 詳細設計書ディレクトリを検索
    design_dirs = glob("docs/designs/detailed/**/")
    
    # 3. 関連する設計書を特定
    related_docs = find_related_design_docs(issue, design_dirs)
    
    if not related_docs:
        return DesignDocResult(
            exists=False,
            warning="⚠️ 詳細設計書が見つかりません",
            recommendation="設計書作成を先に行うか、ユーザーに確認してください"
        )
    
    return DesignDocResult(
        exists=True,
        paths=related_docs,
        message=f"✅ 設計書確認: {len(related_docs)}件"
    )
```

#### 設計書が存在しない場合

| 状況 | アクション |
|------|----------|
| 設計書なし + 小規模変更 | ユーザーに確認 → 承認されれば続行 |
| 設計書なし + 大規模変更 | 実装中断 → 詳細設計ワークフロー実行を推奨 |
| 設計書あり | 通常フローで続行 |

```python
# 設計書確認の実装例
design_result = check_design_document(issue_id)

if not design_result.exists:
    # ユーザーに確認
    user_response = ask_user(f"""
⚠️ Issue #{issue_id} に対応する詳細設計書が見つかりません。

**推奨アクション**:
- 大規模な機能追加の場合: `/detailed-design-workflow` を先に実行
- 小規模な修正の場合: このまま続行可能

このまま実装を続行しますか？ (続行/中断)
""")
    
    if user_response != '続行':
        abort_with_message("設計書作成後に再実行してください")
```

### 0.6. 設計書参照ルール（トークン最適化）⚠️ 必須

> **⛔ 絶対禁止**: 設計書の全文読み込み
> **✅ 必須**: Subtaskに必要なセクションのみ参照（2,000トークン上限）

詳細は {{skill:implement-subtask-rules}} セクション1を参照。

| 実装内容 | 読むセクション |
|---------|--------------|
| 型定義 | `## データ型`, `## インターフェース` |
| API | `## エンドポイント`, `## リクエスト/レスポンス` |
| UI | `## 画面仕様`, `## コンポーネント` |
| テスト | `## テストケース`, `## 境界条件` |

### 1. container-use環境構築

**`from_git_ref`でfeatureブランチを指定**して環境を作成します。

```python
# 環境作成 (featureブランチから)
container-use_environment_create(
    environment_source="/path/to/repo",
    title=f"Issue #{issue_id} - {issue_title}",
    from_git_ref=f"feature/issue-{issue_id}-{short_description}"
)
```

これにより:
- featureブランチのコードがcontainer内にチェックアウトされる
- mainブランチは影響を受けない
- container内での変更はfeatureブランチにコミットされる

#### 1.1 環境設定

```python
container-use_environment_config(
    environment_id=env_id,
    environment_source="/path/to/repo",
    config={
        "base_image": "node:20-slim",
        "setup_commands": [
            "npm ci",
            "npm run build"
        ],
        "envs": [
            "NODE_ENV=test",
            "DATABASE_URL=postgresql://app:password@db:5432/testdb"
        ]
    }
)
```

#### 1.2 サービス追加 (必要に応じて)

```python
# PostgreSQL
container-use_environment_add_service(
    environment_id=env_id,
    environment_source="/path/to/repo",
    name="db",
    image="postgres:15",
    envs=["POSTGRES_USER=app", "POSTGRES_PASSWORD=password", "POSTGRES_DB=testdb"],
    ports=[5432]
)

# Redis (必要な場合)
container-use_environment_add_service(
    environment_id=env_id,
    environment_source="/path/to/repo",
    name="redis",
    image="redis:7-alpine",
    ports=[6379]
)
```

### 2. 申し送り確認 (Handover)

Issueのコメントをスキャンし、未完了の申し送り事項があれば最優先で対応。

### 3. TDD実装 (Red -> Green -> Refactor)

{{skill:tdd-implementation}}

### 4. 設計不備への対応

設計の矛盾が見つかった場合は `/request-design-fix` を実行。

### 6. 申し送り作成

他領域への影響がある場合は {{skill:handover-process}} に従う。

### 6.5. 実装完了自己チェック ⚠️ 必須

品質レビューに進む前に、以下の自己チェックを行うこと。

#### 1. TODO/unimplemented 残存チェック
コード内に未実装を示すマクロやコメントが残っていないか確認する。

```python
# 未実装マクロの検出
container-use_environment_run_cmd(
    command="grep -r 'todo!\\|unimplemented!' src/"
)
# コメントのTODO検出（意図的なものは除外）
container-use_environment_run_cmd(
    command="grep -r 'TODO' src/"
)
```

**アクション**:
- `todo!`, `unimplemented!` が見つかった場合 → **実装して解消**するか、解消できない場合はIssueを作成してリンクする。
- 意図的なTODOコメントの場合 → Issue番号を付記する (`// TODO(#123): ...`)。

#### 2. Smoke Test (起動確認)
実装した機能が実際に動作するか、バイナリを起動して確認する。
テストが通っても、`main`関数がつながっていなければ意味がない。

```python
# ヘルプ表示確認
container-use_environment_run_cmd(command="cargo run -- --help")

# バージョン表示確認
container-use_environment_run_cmd(command="cargo run -- --version")

# サブコマンドの簡易実行（例）
container-use_environment_run_cmd(command="cargo run -- status")
```

**アクション**:
- 起動に失敗した場合（パニック、エラー） → **修正必須**。
- エラーメッセージが適切に出るか確認。

### 7. 品質レビュー & 客観的基準 ⚠️ 必須

> **詳細**: {{skill:quality-review-flow}} を参照

**概要**: PR作成前に品質レビューを実行。レビュースコア9点以上かつ客観的基準（Lint/Test等）の全通過が必須。

| 項目 | 基準 | アクション |
|------|------|------------|
| レビュースコア | 9-10点 | ✅ 次のチェックへ |
| 客観的基準 | 全クリア | ✅ PR作成承認リクエストへ |
| **判定** | **両方合格** | **ユーザー承認ゲートへ進む** |

**フロー**: `レビュー実行 → 客観チェック → (失敗時:修正&再レビュー) → 合格 → ユーザー承認`

### 7.1. ユーザー承認ゲート ⚠️ 必須

> **共通仕様**: {{skill:approval-gate}} を参照
> **⚠️ 重要**: PR作成前に必ずユーザーの承認を得ること。自動でPRを作成しない。

品質レビュー通過後（9点以上）、PR作成前にユーザーに確認を求めます。

#### 承認リクエストフォーマット

```markdown
## ✅ 品質レビュー通過 - PR作成承認リクエスト

### Issue情報
- **Issue**: #{issue_id} - {issue_title}
- **ブランチ**: `feature/issue-{issue_id}-{description}`

### レビュー結果
- **スコア**: {score}/10
- **レビュアー**: {reviewer_agent}

### 変更概要
- 新規ファイル: {new_files_count}件
- 変更ファイル: {modified_files_count}件
- 削除ファイル: {deleted_files_count}件

### 主な変更内容
{change_summary}

### テスト結果
- 合計: {total_tests}件
- 成功: {passed_tests}件
- 失敗: {failed_tests}件

---

**PR作成を承認しますか？**
- `続行`: PR作成を続行
- `修正`: 追加修正が必要（指摘箇所をコメントしてください）
- `下書き`: Draft PRとして作成
```

#### 承認フロー

ユーザーに承認リクエストを表示し、`続行`→通常PR、`下書き`→Draft PR、`修正`→修正へ戻る。

#### 承認結果に応じたアクション

| ユーザー回答 | アクション |
|------------|----------|
| `続行` | 通常PRを作成 → Phase 8へ |
| `下書き` | Draft PRを作成（`--draft`フラグ付き） |
| `修正` + フィードバック | 指摘箇所を修正 → Phase 6（Lint & Test）へ戻る |
| タイムアウト（30分） | Draft PRを自動作成、ユーザーに通知 |

#### 承認タイムアウト仕様

| パラメータ | 値 | 説明 |
|----------|-----|------|
| タイムアウト時間 | 30分 | ユーザー応答の待機上限 |
| タイムアウト時の挙動 | Draft PR作成 | 作業成果を保全 |
| 再開方法 | PRページで承認/修正指示 | Draft解除またはコメント |

### 8. コミット & プッシュ (container内で実行)

```python
container-use_environment_run_cmd(
    environment_id=env_id,
    environment_source="/path/to/repo",
    command='''
        git add . && \
        git commit -m "feat: {summary}

Closes #{issue_id}

- {change1}
- {change2}" && \
        git push origin feature/issue-{issue_id}-{description}
    '''
)
```

**コミットメッセージ規則**:
- `feat:` - 新機能
- `fix:` - バグ修正
- `refactor:` - リファクタリング
- `test:` - テスト追加
- `docs:` - ドキュメント

### 9. PR作成 (container内で実行)

> **⚠️ 重要**: PRのタイトルと本文は**日本語**で記述してください。

```python
def generate_test_log_summary(test_output: str) -> str:
    """テスト出力からサマリーを生成（トークン節約）"""
    # 成功時: "✅ All tests passed (52/52)"
    # 失敗時: "❌ Failed: 2 tests\n- test_auth_login\n- test_api_create"
    pass

container-use_environment_run_cmd(
    environment_id=env_id,
    environment_source="/path/to/repo",
    command=f'''
        gh pr create \\
          --title "feat: {{日本語タイトル}}" \\
          --body "## 概要
Closes #{{issue_id}}

{{変更の概要を日本語で記述}}

## 変更内容
- {{変更点1}}
- {{変更点2}}

## テスト結果
{{generate_test_log_summary(test_output)}}

## チェックリスト
- [x] TDDで実装
- [x] 品質レビュー通過
- [x] Lintエラーなし
- [x] 型エラーなし" \
          --base main \
          --head feature/issue-{issue_id}-{description}
    '''
)
```

**PRタイトル形式（日本語）**:
| プレフィックス | 用途 | 例 |
|---------------|------|-----|
| `feat:` | 新機能 | `feat: ユーザー認証機能を追加` |
| `fix:` | バグ修正 | `fix: セッション期限切れ時のエラーを修正` |
| `refactor:` | リファクタリング | `refactor: 設定管理のコードを整理` |
| `test:` | テスト追加 | `test: API通信のユニットテストを追加` |
| `docs:` | ドキュメント | `docs: READMEにインストール手順を追加` |

### 10. CI監視 & 自動マージ ⚠️ 必須

> **詳細**: {{skill:ci-workflow}} を参照

**概要**: PR作成後、CIの完了を待ち、結果に応じて自動マージまたは修正を行う。

| フェーズ | 実行者 | 処理 |
|---------|--------|------|
| 0-9 | `container-worker` / `Sisyphus` | 実装→PR作成（環境内） |
| 10-11 | `Sisyphus` | CI監視→マージ→環境削除（環境外） |

**フロー**: `PR作成 → CI待機(10分) → 成功:マージ&削除 / 失敗:修正(3回) / タイムアウト:報告`

### 11. 親Issue自動クローズ ⚠️ 必須

> **⚠️ 重要**: 全SubtaskのPRがマージされたら、親Issueを自動でクローズする。

#### 11.1 Subtask完了チェック

```python
def check_all_subtasks_complete(parent_issue_id: int) -> bool:
    """親Issueに紐づく全Subtaskが完了したかチェック"""
    
    # detect_subtasks() を再利用（重複ロジック回避）
    # ※ detect_subtasks() は「引数」セクションで定義済み
    subtask_ids = detect_subtasks(parent_issue_id)
    
    if not subtask_ids:
        # Subtaskがない場合は親Issue自体の完了をチェック
        return True
    
    # 各SubtaskのステータスとPRマージ状況を確認
    for subtask_id in subtask_ids:
        result = bash(f"gh issue view {subtask_id} --json state")
        if result.exit_code != 0:
            continue
        
        issue_data = json.loads(result.stdout)
        if issue_data.get("state") != "CLOSED":
            return False
        
        # 関連PRがマージされているか確認
        pr_result = bash(f"gh pr list --search 'closes #{subtask_id}' --state merged --json number")
        if pr_result.exit_code != 0 or not json.loads(pr_result.stdout):
            return False
    
    return True
```

> **Note**: `detect_subtasks()` は「引数」セクションで定義されている共通関数。
> Subtask検出ロジックの重複を避けるため、必ずこの関数を再利用すること。

#### 11.2 親Issueクローズ処理

```python
def close_parent_issue(parent_issue_id: int, subtask_results: list[dict]):
    """全Subtask完了後、親Issueをクローズ"""
    
    # サマリーコメントを作成
    summary = f"""
## ✅ 全Subtask完了

| Subtask | PR | ステータス |
|---------|-----|----------|
"""
    for r in subtask_results:
        summary += f"| #{r['subtask_id']} | PR #{r['pr_number']} | ✅ Merged |\n"
    
    summary += f"""
---
🤖 全{len(subtask_results)}件のSubtaskが正常にマージされました。
このIssueを自動クローズします。
"""
    
    # コメント追加
    bash(f'''
        gh issue comment {parent_issue_id} --body "{summary}"
    ''')
    
    # 親Issueをクローズ
    bash(f"gh issue close {parent_issue_id} --reason completed")
    
    report_to_user(f"✅ 親Issue #{parent_issue_id} を自動クローズしました")
```

#### 12.3 部分完了時の処理

| 状況 | アクション |
|------|----------|
| 全Subtask成功 | 親Issueを自動クローズ |
| 一部Subtask失敗 | 親Issueは開いたまま、失敗Subtaskを報告 |
| 全Subtask失敗 | 親Issueにエラーサマリーをコメント |

```python
def handle_partial_completion(parent_issue_id: int, results: list[dict]):
    """部分完了時の処理"""
    
    succeeded = [r for r in results if r['status'] == 'merged']
    failed = [r for r in results if r['status'] != 'merged']
    
    if not failed:
        # 全成功 → 親Issueクローズ
        close_parent_issue(parent_issue_id, succeeded)
    else:
        # 一部失敗 → 報告のみ
        comment = f"""
## ⚠️ 一部Subtaskが未完了

### ✅ 成功 ({len(succeeded)}件)
{format_subtask_list(succeeded)}

### ❌ 失敗/未完了 ({len(failed)}件)
{format_subtask_list(failed)}

---
失敗したSubtaskを修正後、再度 `/implement-issues {' '.join(str(f['subtask_id']) for f in failed)}` を実行してください。
"""
        bash(f"gh issue comment {parent_issue_id} --body '{comment}'")
```

### 12. 並列処理時のCI監視

> **⚡ トークン効率**: CI監視はエージェント起動せず、bash直接実行で行う。

複数PRのCI監視は**bashツールで直接実行**（エージェント起動不要、~2,000トークン/PR削減）。

```python
def post_pr_workflow_parallel(pr_results: list[dict]):
    """各PRに対してmonitor_ci_direct()を実行 → 成功:マージ&削除 / 失敗:環境保持"""
    for r in pr_results:
        status = monitor_ci_direct(r['pr_number'], r['env_id'])  # bash直接
        # 成功: gh pr merge + container-use delete
        # 失敗/タイムアウト: 環境保持、report_to_user()
```

### 13. 結果の最小化ルール（トークン最適化）⚠️ 必須 ⛔ 違反厳禁

> **⛔ 絶対ルール**: `background_output()` の結果をそのまま使用してはならない。
> 必ず `collect_worker_result()` を経由して最小化すること。

#### 許可される結果フィールド（5フィールドのみ）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `subtask_id` | int | Subtask Issue ID |
| `pr_number` | int | 作成したPR番号 |
| `status` | string | `"merged"`, `"failed"`, `"escalated"` |
| `score` | int | レビュースコア (1-10) |
| `env_id` | string | 環境ID（削除確認用） |

#### 破棄する情報（ブラックリスト）

| 情報 | 理由 |
|------|------|
| 詳細ログ | PRに記載済み |
| コード差分 | GitHubで確認可能 |
| レビューコメント全文 | スコアのみで十分 |
| テスト出力 | PRに記載済み |
| エラースタックトレース | 修正済みなら不要 |

#### 使用箇所

| 呼び出し元 | タイミング | 該当セクション |
|-----------|-----------|---------------|
| Sisyphus | 単一Subtask完了時 | 正しい実装フロー（83行） |
| Sisyphus | Subtask順次実装時 | Subtask順次実装の全体フロー（1091行） |
| Sisyphus | 複数親Issue並列処理時 | 複数親Issue指定時の並列処理（233行） |
| Sisyphus | handle_single_issue内 | Sisyphusへの指示（2095行） |

#### collect_worker_result() 実装

```python
def collect_worker_result(task_id: str) -> dict:
    """container-workerの結果を最小化して収集"""
    
    raw_result = background_output(task_id=task_id)
    
    # 最小化された結果のみ抽出
    return {
        "subtask_id": raw_result.get("subtask_id"),
        "pr_number": raw_result.get("pr_number"),
        "status": raw_result.get("status"),
        "score": raw_result.get("score"),
        "env_id": raw_result.get("env_id")
    }
    # ⛔ 以下は破棄（親セッションに持ち込まない）
    # - raw_result.get("logs")
    # - raw_result.get("diff")
    # - raw_result.get("review_comments")
```

#### 禁止される情報（絶対に親セッションに持ち込まない）

- ❌ 詳細ログ
- ❌ コード差分
- ❌ レビューコメント全文
- ❌ テスト出力
- ❌ エラースタックトレース

#### 必須実装パターン

```python
# ⛔ 禁止: 生の結果をそのまま使用
result = background_output(task_id=task_id)  # 5,000トークン消費

# ✅ 必須: 最小化関数を経由
result = collect_worker_result(task_id)  # 200トークンで済む

def collect_worker_result(task_id: str) -> dict:
    raw = background_output(task_id=task_id)
    return {k: raw.get(k) for k in ["subtask_id", "pr_number", "status", "score", "env_id"]}
```

#### 効果

| Subtask数 | 従来 | 最適化後 | 削減率 |
|-----------|------|---------|--------|
| 1 | 5,000 | 200 | **96%** |
| 5 | 25,000 | 1,000 | **96%** |

#### build_subtask_worker_prompt() 実装

```python
def build_subtask_worker_prompt(subtask_id: int, branch_name: str, parent_issue_id: int) -> str:
    """Subtask実装用のcontainer-workerプロンプトを生成"""
    
    # Subtask情報を取得
    subtask = fetch_github_issue(subtask_id)
    design_doc = find_related_design_doc(subtask_id)
    repo_path = get_repo_path()
    
    return f"""
## タスク
Subtask #{subtask_id} を実装し、PRを作成してください。

## Subtask情報
- **タイトル**: {subtask.title}
- **本文**: {subtask.body[:500]}  # 500文字まで
- **ラベル**: {', '.join(subtask.labels)}

## ブランチ情報（Sisyphusが作成済み）
- ブランチ名: `{branch_name}`
- ⚠️ 新規ブランチを作成しないこと（既存を使用）
- container-use環境作成時に `from_git_ref="{branch_name}"` を指定

## 親Issue
- 親Issue: #{parent_issue_id}（全Subtask完了後にSisyphusが自動クローズ）

## リポジトリ
- パス: `{repo_path}`

## 設計書参照
- パス: `{design_doc}` (存在する場合のみ参照)
- ⚠️ 設計書全文を読み込まないこと。必要なセクションのみ参照。

## 実装要件
1. TDDで実装（Red → Green → Refactor）
2. 品質レビューで9点以上を獲得するまでループ
3. PR作成前にユーザー承認を取得

## 期待する出力（JSON形式）
```json
{{
  "subtask_id": {subtask_id},
  "pr_number": <作成したPR番号>,
  "env_id": "<環境ID>",
  "score": <最終レビュースコア>,
  "status": "passed" | "escalated"
}}
```

## 禁止事項
- 新規ブランチの作成
- 設計書の全文読み込み
- レビュー9点未満でのPR作成（escalate除く）
"""
```

### 14. decompose-issue との連携

> `/decompose-issue` で作成されたSubtaskは `detect_subtasks()` で自動検出される。

#### 検出される形式

`/decompose-issue` が作成するSubtask Issueは以下の形式を持つ：

| 要素 | 形式 | 例 |
|------|------|-----|
| タイトル | `[#{parent_id}] N/M: {title}` | `[#8] 1/3: 基本データ型定義` |
| 本文 | `## 親Issue\n- Epic: #{parent_id}` | `Epic: #8` |
| ラベル | `subtask`, `automated` | - |

#### detect_subtasks() の検出パターン

```python
# 以下のパターンで検出される（優先順）:
# 1. 親Issue bodyの "- [ ] #N" チェックリスト形式
# 2. 親Issue commentsの "Created subtask #N" 記録
# 3. 子Issue bodyの "Epic: #{parent_id}" 逆参照
```

これにより、`/decompose-issue 8` で作成されたSubtaskは、`/implement-issues 8` で自動的に検出・実装される。

## 技術スタック別設定

詳細は {{skill:container-use-guide}} を参照。

| スタック | base_image | setup_commands |
|---------|------------|----------------|
| Node.js/TypeScript | `node:20-slim` | `npm ci` |
| Python | `python:3.11-slim` | `pip install -r requirements.txt` |
| Go | `golang:1.21` | `go mod download` |
| Rust | `rust:1.85-slim` | `cargo fetch` |

## エラーハンドリング

### GitHub API エラー

| 状況 | 対応 |
|------|------|
| Issue不存在（404） | エラーメッセージを表示し、Issue番号の確認を依頼 |
| レート制限（403） | 1分待機後にリトライ（最大3回） |
| ネットワークエラー | 30秒待機後にリトライ（最大3回） |
| 認証エラー（401） | `gh auth login` の実行を案内 |

```python
def safe_gh_api_call(command: str, max_retries: int = 3) -> tuple[bool, str]:
    """GitHub API呼び出しのラッパー（リトライ付き）"""
    for attempt in range(max_retries):
        result = bash(command)
        
        if result.exit_code == 0:
            return (True, result.stdout)
        
        error = result.stderr.lower()
        
        if "404" in error or "not found" in error:
            return (False, f"Issue/PRが見つかりません: {command}")
        
        if "401" in error or "authentication" in error:
            return (False, "認証エラー: `gh auth login` を実行してください")
        
        if "403" in error or "rate limit" in error:
            wait(60)  # レート制限: 1分待機
            continue
        
        # その他のエラー: リトライ
        wait(30)
    
    return (False, f"APIエラー（{max_retries}回リトライ後）: {command}")
```

### 単一Issue処理時

| 状況 | 対応 |
|------|------|
| Issue不存在 | エラー報告して終了 |
| Subtask検出失敗 | ユーザーに確認（続行 or 中断） |
| 3回連続レビュー失敗 | Draft PRを作成して終了 |
| 設計不備 | `/request-design-fix` を実行 |
| 環境構築失敗 | `container-use_environment_config` で設定見直し |
| サービス接続失敗 | ポート・環境変数を確認 |
| ブランチ作成失敗 | 既存ブランチの有無を確認、競合解消 |

### 並列処理時

| 状況 | 対応 |
|------|------|
| 1つのIssueが失敗 | 他のIssueは継続、失敗分のみ報告 |
| 全Issueが失敗 | 各失敗理由を収集して報告 |
| container-worker タイムアウト | タイムアウトしたIssueをリストアップ |
| 依存関係エラー | 依存元Issueを先に処理するよう順序変更 |
| 循環依存検出 | エラー報告し、手動での依存解消を依頼 |
| ブランチ競合 | 競合したIssueのみ報告、他は継続 |

### Subtask検出時のエラー

| 状況 | 対応 |
|------|------|
| 親Issue不存在 | エラー報告して終了 |
| Subtask 0件検出 | 粒度チェックへ移行（正常フロー） |
| 一部Subtaskがクローズ済み | 未完了分のみ実装対象に |
| Subtask循環参照 | エラー報告、手動確認を依頼 |

### 並列処理の結果報告フォーマット

```markdown
## 実装結果サマリー

| Issue | ステータス | PR | レビュースコア |
|-------|----------|-----|--------------|
| #9 | ✅ 成功 | PR #25 | 10/10 |
| #10 | ✅ 成功 | PR #26 | 9/10 |
| #11 | ❌ 失敗 | - | - |

### 失敗詳細

#### Issue #11
- 失敗理由: レビュースコア未達（7/10）
- 指摘事項: ...
- 推奨アクション: 指摘事項を修正して再実行
```

## Sisyphusへの指示（必読）

{{skill:sisyphus-implementation-guide}}

## 参考スキル

| スキル | 用途 |
|--------|------|
| {{skill:container-use-guide}} | 環境構築・サービス統合 |
| {{skill:handover-process}} | BE↔FE間の申し送り |
| {{skill:code-quality-rules}} | 500行ルール、命名規則 |
| {{skill:ci-workflow}} | CI監視・修正・マージ |
| {{skill:subtask-detection}} | Subtask検出・依存関係 |
| {{skill:issue-size-estimation}} | Issue粒度判定・見積もり |
| {{skill:tdd-implementation}} | Red→Green→Refactor |
| {{skill:environments-json-management}} | 環境ID追跡 |
| {{skill:sisyphus-implementation-guide}} | Sisyphus実行フロー |
| {{skill:workflow-phase-convention}} | Phase番号規約 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-08 | 3.17.3 | **ファイル分割（第2弾）**: Issue粒度判定、TDD実装、environments.json管理、Sisyphus指示を分離。2,011行→1,427行（29%削減） |
| 2026-01-08 | 3.17.0 | **ファイル分割**: CI監視フロー（ci-workflow.md）、Subtask検出ロジック（subtask-detection.md）を分離。2,590行→2,131行（18%削減） |
| 2026-01-08 | 3.16.0 | Sub-issue登録GraphQL化、container-workerプロンプト簡素化、implement-subtask-rules.md分離 |
