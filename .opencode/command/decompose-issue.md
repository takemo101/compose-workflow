---
description: 既存の大きなIssueを適切な粒度のSubtaskに分解します。200行以下・3ファイル以下の粒度で子Issueを作成し、並列実装を可能にします。
argument-hint: "[Issue番号]"
---

# Issue分解コマンド

既存の大きなIssueを適切な粒度のSubtaskに分解します。
**200行以下・3ファイル以下**の粒度で子Issueを作成し、並列実装を可能にします。

---

## 入力

$ARGUMENTS（Issue番号）

例: `/decompose-issue 8`

---

## 全体フロー

| Phase | 名称 | 内容 |
|-------|------|------|
| 0 | 入力解析 | Issue番号の解析、Issue情報取得 |
| 1 | Issue分析 | 規模分析、設計書特定、コード量推定 |
| 2 | 分解計画 | Subtask分割、200行/3ファイル制約適用 |
| 3 | 依存関係解析 | Subtask間の依存関係を解析 |
| 3.5 | ユーザー確認 | 分解計画の承認（{{skill:approval-gate}}） |
| 4 | Subtask作成 | GitHub Issue作成、Sub-issue連携 |
| 5 | 親Issue更新 | サマリーコメント追加 |

> **Phase規約**: {{skill:workflow-phase-convention}} を参照

---

## いつ使うか

| 状況 | 使用するコマンド |
|------|-----------------|
| **新規機能を設計から開始** | `/detailed-design-workflow`（設計時に適切な粒度でIssue作成） |
| **既存の大きなIssueを分割** | **`/decompose-issue`**（このコマンド） |
| **すでに適切な粒度のIssue** | `/implement-issues`（直接実装） |

---

## 分解基準

| 制約 | 上限 | 違反時のアクション |
|------|------|------------------|
| **コード量** | 200行以下 | 複数Subtaskに分割 |
| **ファイル数** | 1-3ファイル | 複数Subtaskに分割 |
| **責務** | 単一責務 | 機能ごとに分割 |
| **テスト可能性** | 独立してテスト可能 | 依存関係を整理 |

---

## 実行プロセス

### Phase 1: Issue分析

```python
def analyze_issue(issue_id: int) -> IssueAnalysis:
    """Issueの規模と構成を分析"""
    
    # 1. Issue情報を取得
    issue = bash(f"gh issue view {issue_id} --json title,body,labels")
    
    # 2. 関連する設計書を特定
    design_doc = find_related_design_doc(issue_id)
    
    # 3. 設計書から実装項目を抽出
    implementation_items = extract_items_from_design(design_doc)
    
    # 4. 推定コード量を計算
    total_estimated_lines = sum(
        estimate_lines(item) for item in implementation_items
    )
    
    # 5. 対象ファイルを特定
    target_files = extract_target_files(design_doc)
    
    return IssueAnalysis(
        issue_id=issue_id,
        title=issue.title,
        estimated_lines=total_estimated_lines,
        file_count=len(target_files),
        items=implementation_items,
        needs_decomposition=total_estimated_lines > 200 or len(target_files) > 3
    )
```

### Phase 2: 分解計画

```python
def create_decomposition_plan(analysis: IssueAnalysis) -> list[Subtask]:
    """分解計画を作成"""
    
    if not analysis.needs_decomposition:
        return [Subtask(
            title=analysis.title,
            estimated_lines=analysis.estimated_lines,
            files=analysis.target_files,
            items=analysis.items
        )]
    
    subtasks = []
    current_subtask = Subtask()
    
    for item in analysis.items:
        item_lines = estimate_lines(item)
        
        # 200行を超えそうなら新しいSubtaskを開始
        if current_subtask.estimated_lines + item_lines > 200:
            if current_subtask.items:
                subtasks.append(current_subtask)
            current_subtask = Subtask()
        
        current_subtask.add_item(item)
    
    if current_subtask.items:
        subtasks.append(current_subtask)
    
    return subtasks
```

### Phase 3: 依存関係解析

```python
def analyze_dependencies(subtasks: list[Subtask]) -> dict[int, list[int]]:
    """Subtask間の依存関係を解析"""
    
    dependencies = {}
    
    for i, subtask in enumerate(subtasks):
        deps = []
        for j, other in enumerate(subtasks):
            if i != j and subtask.depends_on(other):
                deps.append(j)
        dependencies[i] = deps
    
    return dependencies
```

### Phase 3.5: ユーザー確認

> **共通仕様**: {{skill:approval-gate}} を参照

分解計画をユーザーに提示し、承認を得る。

**出力形式**:

```markdown
## 📋 Issue分解計画

### 親Issue
- **#{issue_id}**: {title}
- 推定コード量: {total_lines}行
- 対象ファイル: {file_count}件

### 分解が必要な理由
- {reason}（例: 推定500行で200行上限を超過）

### 作成予定のSubtask

| # | Subtask | 対象ファイル | 推定行数 | 依存 |
|---|---------|------------|---------|------|
| 1 | {subtask_1_title} | `{files}` | {lines}行 | なし |
| 2 | {subtask_2_title} | `{files}` | {lines}行 | #1 |
| 3 | {subtask_3_title} | `{files}` | {lines}行 | #1 |
| 4 | {subtask_4_title} | `{files}` | {lines}行 | #1, #2 |

### 実行順序

| Phase | 並列実行可能 | Subtask |
|-------|------------|---------|
| 1 | - | #1（基盤） |
| 2 | ✅ | #2, #3（#1完了後） |
| 3 | - | #4（#1, #2完了後） |

---
**この分解計画で進めてよろしいですか？**
- `続行` → Subtask Issueを作成
- `修正` → 分解計画を修正
- `カスタム指示` → 特定の分割方法を指定
```

### Phase 4: Subtask Issue作成

```python
def create_subtask_issues(
    parent_issue_id: int,
    subtasks: list[Subtask],
    dependencies: dict
) -> list[int]:
    """GitHub上にSubtask Issueを作成（ロールバック機構付き）"""
    
    created_ids = []
    
    try:
        for i, subtask in enumerate(subtasks):
            # 依存関係を人が読める形式に変換
            deps_text = format_dependencies(dependencies[i], created_ids)
            
            # Subtask Issue作成
            result = bash(f'''
                gh issue create \
                  --title "[#{parent_issue_id}] {i+1}/{len(subtasks)}: {subtask.title}" \
                  --body "## 概要
{subtask.description}

## 親Issue
- Epic: #{parent_issue_id}

## 推定規模
| 項目 | 値 |
|------|-----|
| コード量 | {subtask.estimated_lines}行 |
| ファイル数 | {len(subtask.files)}件 |

## 対象ファイル
{format_file_list(subtask.files)}

## 実装内容
{format_items(subtask.items)}

## 完了条件
- [ ] 実装完了（200行以下）
- [ ] テスト通過
- [ ] レビュー9点以上
- [ ] PR作成・マージ

## 依存
{deps_text}

---
🤖 このIssueは \`/decompose-issue {parent_issue_id}\` により自動生成されました
" \
                  --label "subtask,automated"
            ''')
            
            if result.exit_code != 0:
                raise IssueCreationError(f"Subtask {i+1} 作成失敗: {result.stderr}")
            
            subtask_id = parse_issue_number(result)
            created_ids.append(subtask_id)

            # Sub-issueとして親Issueに登録
            # 詳細: {{skill:github-graphql-api}}
            add_sub_issue(parent_issue_id, subtask_id)
        
        # 親Issueにサマリーをコメント
        add_decomposition_summary(parent_issue_id, subtasks, created_ids)
        
        return created_ids
        
    except Exception as e:
        # ロールバック処理
        handle_partial_creation_failure(parent_issue_id, created_ids, subtasks, e)
        raise


def handle_partial_creation_failure(
    parent_issue_id: int,
    created_ids: list[int],
    subtasks: list[Subtask],
    error: Exception
):
    """Issue作成が途中で失敗した場合のロールバック処理"""
    
    # 1. 作成済みIssueをリストアップ
    created_count = len(created_ids)
    total_count = len(subtasks)
    
    # 2. 親Issueにエラー報告をコメント
    error_comment = f"""
## ⚠️ Subtask作成エラー

### 状況
- 作成予定: {total_count}件
- 作成済み: {created_count}件
- 失敗位置: {created_count + 1}件目

### エラー内容
```
{str(error)}
```

### 作成済みSubtask
| # | Subtask |
|---|---------|
"""
    for i, issue_id in enumerate(created_ids):
        error_comment += f"| {i+1} | #{issue_id} |\n"
    
    error_comment += f"""
### 対応オプション

**オプション1: 作成済みIssueを活用して続行**
```bash
# 残りのSubtaskを手動作成後、実装を開始
/implement-issues {' '.join(str(id) for id in created_ids)} [追加Issue番号]
```

**オプション2: 作成済みIssueをクローズして再実行**
```bash
# 作成済みIssueをクローズ
{chr(10).join(f'gh issue close {id} --reason "not planned"' for id in created_ids)}

# 再度分解を実行
/decompose-issue {parent_issue_id}
```

---
🤖 自動ロールバックは行いません（作成済みIssueには有用な情報が含まれる可能性があるため）
"""
    
    bash(f"gh issue comment {parent_issue_id} --body '{error_comment}'")
    
    # 3. ユーザーに報告
    report_to_user(f"""
⚠️ Subtask作成が途中で失敗しました。

- 親Issue: #{parent_issue_id}
- 作成済み: {created_count}/{total_count}件
- 作成済みIssue: {', '.join(f'#{id}' for id in created_ids)}

親Issueに対応オプションをコメントしました。
""")
```

### Phase 5: 親Issue更新

```python
def add_decomposition_summary(
    parent_issue_id: int,
    subtasks: list[Subtask],
    created_ids: list[int]
):
    """親IssueにSubtask一覧をコメント"""
    
    summary = f"""
## 🔄 Issue分解完了

このIssueは以下のSubtaskに分解されました。

### Subtask一覧

| Subtask | 推定行数 | 依存 | ステータス |
|---------|---------|------|----------|
"""
    
    for subtask, issue_id in zip(subtasks, created_ids):
        summary += f"| #{issue_id} {subtask.title} | {subtask.estimated_lines}行 | {subtask.deps_text} | ⏳ 未着手 |\n"
    
    summary += f"""
### 実装方法

```bash
# 全Subtaskを並列実装
/implement-issues {' '.join(str(id) for id in created_ids)}
```

---
**Note**: 全Subtaskが完了したら、このIssueは自動的にクローズされます。
"""
    
    bash(f"gh issue comment {parent_issue_id} --body '{summary}'")
```

---

## 完了条件

- [ ] 親Issueの分析が完了している
- [ ] 分解計画がユーザーに承認されている
- [ ] 全Subtask Issueが作成されている
- [ ] 各Subtaskが200行以下である
- [ ] 各Subtaskが3ファイル以下である
- [ ] 依存関係が明記されている
- [ ] 親Issueにサマリーがコメントされている

---

## 出力形式

```markdown
## ✅ Issue分解完了

### 親Issue
- **#{parent_id}**: {parent_title}

### 作成されたSubtask

| # | Subtask | 推定行数 |
|---|---------|---------|
| #{id_1} | {title_1} | {lines_1}行 |
| #{id_2} | {title_2} | {lines_2}行 |
| #{id_3} | {title_3} | {lines_3}行 |

### 次のステップを選択してください

1. 実装に進む（`/implement-issues {id_1} {id_2} {id_3}`）
2. Subtask構成を修正する
3. 一旦終了する

> 番号を入力してください（1-3）:

### 実行順序

| Phase | Subtask | 依存 |
|-------|---------|------|
| 1 | #{id_1} | なし |
| 2 | #{id_2}, #{id_3} | #{id_1} |
```

---

## Sisyphusへの指示

```python
def decompose_issue(issue_id: int):
    # 1. Issue分析
    analysis = analyze_issue(issue_id)
    
    if not analysis.needs_decomposition:
        report_to_user(f"Issue #{issue_id} は分解不要です（{analysis.estimated_lines}行）")
        return
    
    # 2. 分解計画作成
    subtasks = create_decomposition_plan(analysis)
    dependencies = analyze_dependencies(subtasks)
    
    # 3. ユーザー確認
    approved = ask_user_for_approval(subtasks, dependencies)
    if not approved:
        return  # ユーザーがキャンセルまたは修正指示
    
    # 4. Subtask Issue作成
    created_ids = create_subtask_issues(issue_id, subtasks, dependencies)
    
    # 5. 完了報告
    report_completion(issue_id, subtasks, created_ids)
```
