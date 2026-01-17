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

## GitHub Issue 状態管理 (MANDATORY)

> **詳細**: @.claude/skills/github-issue-state-management/SKILL.md を参照

**ALL container-use operations MUST update GitHub Issue labels** to track environment state.

### 必須更新ポイント（概要）

| トリガー | アクション |
|---------|----------|
| `environment_create` 成功 | ラベル追加: `env:active`, `phase:1-env` |
| Phase 遷移 | ラベル入れ替え: `phase:X` → `phase:Y` |
| `gh pr create` 成功 | ラベル変更: `env:pr-created`, `phase:10-pr` |
| PR merged | ラベル変更: `env:merged`, `phase:12-merge` |
| 環境削除 | 全 `env:*`, `phase:*` ラベルを削除 |

### セッション復旧（概要）

作業再開時、**GitHub Issue のラベルを参照**：
1. `gh issue list --label "env:active"` でアクティブな環境を検索
2. `gh issue view <num> --json labels,body` で詳細取得
3. Issue body 内の `env_id` で環境を再開

### Hard Blocks

| 違反 | 結果 |
|------|------|
| 環境作成時にラベル未追加 | **FORBIDDEN** - 復旧不可 |
| Phase 遷移時にラベル未更新 | **FORBIDDEN** - 状態不整合 |
| Blocked 時にコメント未追加 | **FORBIDDEN** - 理由が不明 |

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

### GitHub Issue Labels in Parallel Execution

**Concurrency Rule**: Each worker updates labels on its own Issue independently.

| Actor | Responsibility |
|-------|---------------|
| `container-worker` | Updates labels on assigned Issue via `gh issue edit` |
| Main agent | Monitors overall progress via `gh issue list --label "env:active"` |

**Workflow**:
1. Main agent creates todo list for parallel issues
2. Delegates to `container-worker` agents (they work independently)
3. Each worker updates its Issue labels directly (no file conflicts)
4. Main agent checks overall status via `gh issue list`
5. GitHub handles concurrent label updates atomically

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
   a. Update Issue state (@.claude/skills/github-issue-state-management/SKILL.md API)
   b. Create a NEW environment with the same branch
   c. Update Issue body with new env_id in metadata block
   d. Re-register environment: issue-state.sh register <num> <new_env_id> <branch> container-use
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

> **詳細**: @.claude/skills/github-issue-state-management/SKILL.md の「セッション復旧」セクションを参照

### Quick Reference

1. **GitHub Issue のラベルを参照** - `gh issue list --label "env:active"`
2. **Issue 詳細を取得** - `gh issue view <num> --json labels,body`
3. **env_id で環境を再開** - Issue body のメタデータから `env_id` を抽出し `environment_open`

### Recovery Decision Matrix

| Label Status | PR State | Action |
|--------------|----------|--------|
| `env:active` | No PR | `phase:*` ラベルから作業継続 |
| `env:blocked` | N/A | **人間に通知**、ラベル変更後に再開 |
| `env:pr-created` | PR open | `env_id` で環境再開し修正 |
| `env:pr-created` | PR merged | `env:merged` に更新、環境削除 |
| `env:merged` | N/A | クリーンアップ候補 |

### Session State Management

**GitHub Issue のラベルが唯一の状態管理（SSOT）です。**

| 情報源 | 役割 | 復旧時 |
|-------|------|--------|
| **GitHub Issue Labels** | 状態管理 | ✅ 最優先 |
| Issue Body Metadata | env_id, branch | ✅ 環境再開用 |
| Git状態 | コード状態 | ✅ 検証用 |

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
- [ ] **Issue labels updated**: `env:pr-created`, `phase:10-pr`
- [ ] **CI passed** (MUST wait: `gh pr checks <pr-number> --watch`)
- [ ] PR merged (only AFTER CI passes)
- [ ] Issue closed (automatic if `Closes #XX` used in PR)
- [ ] **Issue labels updated**: `env:merged`, `phase:12-merge`
- [ ] **Environment deleted**: `container-use delete <env_id>` (after PR merge)
- [ ] **Remote branch deleted**: `git push origin --delete <branch-name>` (after PR merge)

### PR Merge Flow (MANDATORY)

> **詳細**: @.claude/skills/pr-merge-workflow/SKILL.md を参照

**概要**: PR作成 → CI待機 → マージ → クリーンアップ → Issue ラベル更新

| フェーズ | 必須アクション |
|---------|--------------|
| PR作成 | `Closes #XX` でIssue参照、テンプレート使用 |
| CI待機 | `gh pr checks --watch` で完了を待つ |
| マージ | `gh pr merge --merge --delete-branch` |
| クリーンアップ | 環境削除 + Issue ラベル更新 (`env:merged`) |

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
| **Update Issue state** | `issue-state.sh <command>` (@.claude/skills/github-issue-state-management/SKILL.md) |

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
| **GitHub API / CLI** | Issue number (e.g., `42`) | GitHub's canonical identifier |
| **Code/Pseudocode** | `issue_num` or `issue_id` | Common convention for ID variables |

**Note**: GitHub Issue number is the primary identifier. Use it consistently in `gh` CLI commands.

---

## Related Documents

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| [Design Sync Policy](./design-sync.md) | Keep design docs and implementation in sync | Before/during/after implementation |
| [Testing Strategy](./testing-strategy.md) | Handle environment-dependent code testing | When writing tests for OS/hardware-dependent code |
| [Platform Exception Policy](./platform-exception.md) | Platform-specific code exception rules | When implementing macOS/Windows-specific code |
| @.claude/skills/container-use-guide/SKILL.md | Step-by-step container environment setup | First time using container-use |
| @.claude/skills/pr-merge-workflow/SKILL.md | PR creation to merge and cleanup | When creating/merging PRs |
| @.claude/skills/github-issue-state-management/SKILL.md | Environment state via Issue labels | Session recovery, state tracking |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|:---|:---|:---|
| 2026-01-17 | 3.33.0 | **GitHub Issue状態管理に移行**: environments.jsonを廃止、GitHub Issueラベルによる状態管理に完全移行 |
| 2026-01-12 | 3.22.0 | Docker障害フォールバックとセッション復旧をスキル参照に置換 |
