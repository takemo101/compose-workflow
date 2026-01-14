# Container-Use Agent Rules

## Core Rules (MANDATORY)

ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

**Note**: See "When to Use Container-Use" section for the only permitted exception (`.opencode/` workflow documentation).

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using `container-use log <env_id>` AND `container-use checkout <env_id>`. Failure to do this will make your work inaccessible to others.

### Environment Integrity Protocol

If local build/test commands fail due to environment issues (e.g., wrong rustc version):
1. **STOP**. Do NOT push to CI hoping it works there.
2. **FIX** the environment (or switch to a Container).
3. **VERIFY** locally.
4. Only then, **PUSH**.

**Pushing broken code to CI to test it is strictly FORBIDDEN.**

---

## environments.json Management (MANDATORY)

> **詳細**: @.claude/skills/environments-json-management/SKILL.md を参照

**ALL container-use operations MUST update `environments.json` (project root)** to track Issue/PR/Environment relationships.

### 必須更新ポイント（概要）

| トリガー | アクション |
|---------|----------|
| `environment_create` 成功 | エントリ追加（`status: "active"`） |
| `gh pr create` 成功 | `pr_number`, `status: "pr_created"` 更新 |
| PR merged | `status: "merged"` 更新 |
| 環境削除 | エントリ削除 |

### セッション復旧（概要）

作業再開時、**environments.json を最優先で参照**：
1. `issue_number` または `pr_number` でエントリ検索
2. `env_id` を使用して環境を再開

### Hard Blocks

| 違反 | 結果 |
|------|------|
| 環境作成時に未登録 | **FORBIDDEN** - 復旧不可 |
| PR作成時に未更新 | **FORBIDDEN** - 追跡不可 |
| 環境削除時に未更新 | **FORBIDDEN** - stale data |

---

## When to Use Container-Use

| Use Container-Use | Do NOT Use |
|-------------------|------------|
| Issue implementation (code changes) | Research / investigation only |
| New feature development | Documentation review |
| Bug fixes | Design discussions / reviews |
| Refactoring | Reading existing code |

**Decision criteria**: Will you modify files? → YES → Container-Use

**Exception**: `.opencode/` workflow documentation (instructions, skills, agents) may be edited directly on host when:
- Changes are documentation-only (no code impact)
- Quick iteration is needed for workflow improvements
- Docker is unavailable and user approves direct editing

---

## Required Parameters

All `container-use_*` tools require:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `environment_source` | Absolute path to project git repository | `/Users/user/projects/my-app` |
| `environment_id` | Environment UUID (obtained after create) | `env-abc123...` |

**Notes**:
- `environment_source`: Use current working directory. If unknown, ask the user
- `environment_id`: NOT required for `environment_create` (returned as create result). Required for all other tools

---

## Execution Options

| Method | Use Case | Characteristics |
|--------|----------|-----------------|
| **Direct tool execution** | Single Issue, sequential work | Call `container-use_*` tools directly. Simple and controllable |
| **task delegation (parallel)** | Multiple Issues simultaneously | Each worker operates in independent environment |

### Single Issue → Direct Tool Execution

```
1. Create environment with environment_create
2. Work directly with environment_file_* / environment_run_cmd
3. Present Environment Info to user upon completion
```

### Multiple Issues Parallel → task Delegation

When implementing different Issues simultaneously, delegate to `container-worker` via `task`:

```python
# Delegate Issue implementations in parallel
task(subagent_type="container-worker", prompt="Issue #1: User authentication...")
task(subagent_type="container-worker", prompt="Issue #2: Notification system...")
task(subagent_type="container-worker", prompt="Issue #3: Dashboard...")
# Each worker creates and manages independent environment
```

**Important**:
- Record the Environment ID returned by each worker
- Upon completion, aggregate and present Environment Info for all environments to user

### environments.json in Parallel Execution

**Concurrency Rule**: Only the **main agent (Sisyphus)** updates `environments.json`.

| Actor | Responsibility |
|-------|---------------|
| `container-worker` | Returns `env_id` in final response. Does NOT update environments.json |
| Main agent | Collects all `env_id` values and updates environments.json after all workers complete |

**Workflow**:
1. Main agent creates todo list for parallel issues
2. Delegates to `container-worker` agents (they work independently)
3. Each worker returns: `env_id`, `branch`, `issue_number`, `pr_number` (if created)
4. Main agent updates `environments.json` with all entries at once
5. This avoids race conditions and file conflicts

### container-worker Delegation Prompt Structure

When delegating via task, include the following information:

```markdown
1. ISSUE: Issue number and summary
2. REPOSITORY: Path for environment_source
3. GOAL: Specific objectives to achieve
4. SCOPE: Target files/directories to modify
5. CONSTRAINTS: Actions that are forbidden
6. VERIFICATION: How to verify completion (tests, build, etc.)
```

---

## Environment Lifecycle Management

### Environment Creation
- ALWAYS create a new environment at the start of a new task/issue
- Record the `env_id` immediately after creation
- Use descriptive environment names matching the task (e.g., `feature-issue-8-sound`)

### Environment Persistence
- NEVER abandon an environment due to errors
- If an operation fails, diagnose and retry within the SAME environment
- Use `environment_open` to reconnect to existing environments

### Environment Reuse Rules

| Situation | Action |
|-----------|--------|
| Same issue, continuing work | Reuse existing environment via `environment_open` |
| PR review feedback/fixes | Reuse the SAME environment (do NOT create new) |
| New issue/feature | Create NEW environment |
| Fix branch for different issue | Create NEW environment |

---

## Crash Recovery Protocol

When encountering errors or crashes:

1. **DO NOT** fall back to direct host file operations
2. **DO NOT** abandon the container-use workflow
3. **INSTEAD**, follow this recovery flow:
   ```
   a. Check environment status with `environment_list`
   b. Reopen the environment with `environment_open(env_id)`
   c. Verify file state with `environment_file_list`
   d. Continue work within the environment
   ```

4. **If environment is corrupted:**
   ```
   a. Update environments.json: mark old entry status as "abandoned"
   b. Create a NEW environment with the same branch
   c. Add new entry to environments.json with new env_id
   d. The git state will be preserved from the remote
   e. Continue work in the new environment
   ```

---

## Error Handling Escalation

1. **First failure**: Retry the operation
2. **Second failure**: Check environment state, diagnose issue
3. **Third failure**: Create checkpoint, attempt alternative approach
4. **Persistent failure**: Report to user WITH environment ID for manual recovery

NEVER silently switch to non-container-use operations.

---

## Docker Resource Failures (Fallback Protocol)

> **詳細手順**: @.claude/skills/container-use-guide/SKILL.md の「トラブルシューティング」セクションを参照

| Condition | Action |
|-----------|--------|
| Disk space < 10GB | `docker system prune -af` and retry |
| Docker daemon not running | Start Docker Desktop, wait 30s, retry |
| After prune still failing | **User escalation required** |

**CRITICAL**: Never silently fall back. Always get explicit user approval before direct host operations.

---

## Session Recovery Protocol

> **詳細**: @.claude/skills/environments-json-management/SKILL.md の「セッション復旧」セクションを参照

### Quick Reference

1. **environments.json を最優先で参照** - `cat environments.json`
2. **Issue/PR番号でエントリ検索** - `status: "active"` or `status: "pr_created"` を探す
3. **env_id で環境を再開** - `container-use_environment_open(environment_id="<env_id>")`

### Recovery Decision Matrix

| Entry Status | PR State | Action |
|--------------|----------|--------|
| `active` | No PR | `phase`/`step` から作業継続 |
| `blocked` | N/A | **人間に通知**、解除後に再開 |
| `pr_created` | PR open | `env_id` で環境再開し修正 |
| `pr_created` | PR merged | `status: "merged"` に更新、環境削除 |
| `merged` | N/A | クリーンアップ候補 |
| `abandoned` | N/A | 環境とエントリを即削除 |

### Session State Management

**environments.json が唯一の状態管理ファイル（SSOT）です。**

| 情報源 | 役割 | 復旧時 |
|-------|------|--------|
| **environments.json** | 状態管理 | ✅ 最優先 |
| Git状態 | コード状態 | ✅ 検証用 |
| Supermemory | 人間向けログ | ❌ 自動復旧には使用しない |

---

## Forbidden Actions (HARD BLOCKS)

| Action | Why It's Forbidden |
|--------|-------------------|
| Direct file read/write on host | Bypasses container isolation |
| Using `bash` for file operations | Must use environment_* tools |
| Abandoning environment on error | Loses work and context |
| Creating environment without recording env_id | Cannot recover later |
| Using git CLI in environment_run_cmd | Corrupts environment git state |

---

## Completion Criteria

Work is complete when ALL conditions are met:

- [ ] Implementation complete (all files edited)
- [ ] Build passes (verify with `environment_run_cmd`, if applicable)
- [ ] Tests pass (if applicable)
- [ ] Environment Info presented (format below)
- [ ] PR created (using PR Description Template below)
- [ ] **environments.json updated**: `pr_number` set, `status: "pr_created"`
- [ ] **CI passed** (MUST wait: `gh pr checks <pr-number> --watch`)
- [ ] PR merged (only AFTER CI passes)
- [ ] Issue closed (automatic if `Closes #XX` used in PR)
- [ ] **environments.json updated**: `status: "merged"` or entry removed
- [ ] **Environment deleted**: `container-use delete <env_id>` (after PR merge)
- [ ] **Remote branch deleted**: `git push origin --delete <branch-name>` (after PR merge)

### PR Merge Flow (MANDATORY)

> **詳細**: @.claude/skills/pr-merge-workflow/SKILL.md を参照

**概要**: PR作成 → CI待機 → マージ → クリーンアップ → environments.json更新

| フェーズ | 必須アクション |
|---------|--------------|
| PR作成 | `Closes #XX` でIssue参照、テンプレート使用 |
| CI待機 | `gh pr checks --watch` で完了を待つ |
| マージ | `gh pr merge --merge --delete-branch` |
| クリーンアップ | 環境削除 + environments.json更新 |

**HARD BLOCK**: CIが成功するまでマージしない。ロールバック手順も @.claude/skills/pr-merge-workflow/SKILL.md に記載。

### Required Outputs

After ANY container-use session, ALWAYS provide:

```
## Environment Info
- Environment ID: `<env_id>`
- View logs: `container-use log <env_id>`
- Checkout code: `container-use checkout <env_id>`
```

---

## Quick Reference

### Common Operations

| Task | Tool to Use |
|------|-------------|
| Create new environment | `environment_create` |
| Reopen existing environment | `environment_open` |
| List files | `environment_file_list` |
| Read file | `environment_file_read` |
| Write file | `environment_file_write` |
| Edit file | `environment_file_edit` |
| Run command | `environment_run_cmd` |
| Save progress | `environment_checkpoint` |
| **Delete environment** | `container-use delete <env_id>` (CLI) |
| **Update environments.json** | `Read` + `Edit` tools on `environments.json` (project root) |

### Environment Naming Convention

```
<type>-<issue>-<feature>
```

Examples:
- `feature-issue-8-sound-playback`
- `fix-issue-6-ci-failure`
- `refactor-notification-module`

### Variable Naming Convention

| Context | Variable Name | Rationale |
|---------|---------------|-----------|
| **environments.json** (data store) | `issue_number` | JSON field name - explicit that it's a number |
| **Code/Pseudocode** (variables) | `issue_id` | Common convention for ID variables |

**Why the inconsistency is acceptable:**
- `issue_number` in JSON is the **canonical field name** (matches GitHub API's `number` field)
- `issue_id` in code is a **variable name convention** (shorter, easier to type)
- Both refer to the same thing: GitHub Issue number (e.g., `42`)

**Rule**: When reading/writing `environments.json`, map `issue_id` (code) ↔ `issue_number` (JSON):

```python
# Writing to environments.json
entry = {
    "issue_number": issue_id,  # Map variable to JSON field
    ...
}

# Reading from environments.json
issue_id = entry["issue_number"]  # Map JSON field to variable
```

---

## Related Documents

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| [Design Sync Policy](./design-sync.md) | Keep design docs and implementation in sync | Before/during/after implementation |
| [Testing Strategy](./testing-strategy.md) | Handle environment-dependent code testing | When writing tests for OS/hardware-dependent code |
| [Platform Exception Policy](./platform-exception.md) | Platform-specific code exception rules | When implementing macOS/Windows-specific code |
| @.claude/skills/container-use-guide/SKILL.md | Step-by-step container environment setup | First time using container-use |
| @.claude/skills/pr-merge-workflow/SKILL.md | PR creation to merge and cleanup | When creating/merging PRs |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-12 | 3.22.0 | Docker障害フォールバックとセッション復旧をスキル参照に置換（545→391行、**28%削減**）|
| 2026-01-08 | 3.21.0 | PRマージフローをskill参照に置換（約130行削減）。Related Documentsにpr-merge-workflow追加 |
| 2026-01-08 | 3.21.0 | environments.json管理をskill参照に置換（約85行削減）。environments-json-management.mdをSSOT化 |
| 2026-01-07 | 3.15.1 | 命名規則ガイドライン追加: issue_id vs issue_number の使い分けを明文化 |
| 2026-01-07 | 3.15.0 | 厳格レビュー対応: Session State ManagementをSSOT化（Supermemoryは補助ログに）、ロールバック手順追加、--delete-branch統一 |
| 2026-01-07 | 3.14.0 | Session Summary Auto-Save セクションを追加。Supermemory との連携による自動復旧機能を追加。Related Documents に Platform Exception Policy を追加 |
| 2026-01-05 | 3.13.0 | environments.json必須化 |
| 2026-01-05 | 3.12.0 | 追加仕様対応 |
