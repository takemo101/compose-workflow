# Project Instructions

This document provides essential guidelines for AI assistants working on this project.

---

## Container-Use Rules

### Core Rules (MANDATORY)

ALWAYS use ONLY container-use Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

**Exception**: `.claude/` workflow documentation (instructions, skills, agents) may be edited directly on host when:
- Changes are documentation-only (no code impact)
- Quick iteration is needed for workflow improvements
- Docker is unavailable and user approves direct editing

### Environment Integrity Protocol

If local build/test commands fail due to environment issues (e.g., wrong rustc version):
1. **STOP**. Do NOT push to CI hoping it works there.
2. **FIX** the environment (or switch to a Container).
3. **VERIFY** locally.
4. Only then, **PUSH**.

**Pushing broken code to CI to test it is strictly FORBIDDEN.**

### environments.json Management

> **Reference**: @.claude/skills/environments-json-management/SKILL.md

**ALL container-use operations MUST update `environments.json` (project root)** to track Issue/PR/Environment relationships.

| Trigger | Action |
|---------|--------|
| `environment_create` success | Add entry (`status: "active"`) |
| `gh pr create` success | Update `pr_number`, `status: "pr_created"` |
| PR merged | Update `status: "merged"` |
| Environment deleted | Remove entry |

### Session Recovery

On session resume, **prioritize environments.json**:
1. Search entry by `issue_number` or `pr_number`
2. Resume environment using `env_id`

### Crash Recovery Protocol

When encountering errors or crashes:

1. **DO NOT** fall back to direct host file operations
2. **DO NOT** abandon the container-use workflow
3. **INSTEAD**, follow this recovery flow:
   - Check environment status with `environment_list`
   - Reopen the environment with `environment_open(env_id)`
   - Verify file state with `environment_file_list`
   - Continue work within the environment

### Completion Criteria

Work is complete when ALL conditions are met:

- [ ] Implementation complete (all files edited)
- [ ] Build passes (verify with `environment_run_cmd`, if applicable)
- [ ] Tests pass (if applicable)
- [ ] Environment Info presented
- [ ] PR created (using PR Description Template)
- [ ] **environments.json updated**: `pr_number` set, `status: "pr_created"`
- [ ] **CI passed** (MUST wait: `gh pr checks <pr-number> --watch`)
- [ ] PR merged (only AFTER CI passes)
- [ ] **environments.json updated**: `status: "merged"` or entry removed
- [ ] **Environment deleted**: `container-use delete <env_id>`

### Required Outputs

After ANY container-use session, ALWAYS provide:

```
## Environment Info
- Environment ID: `<env_id>`
- View logs: `container-use log <env_id>`
- Checkout code: `container-use checkout <env_id>`
```

---

## Platform Exception Policy

Platform-specific code (macOS, Windows, iOS, Android) that cannot build in Linux containers requires exception handling.

### Exception Conditions (ALL must be met)

| Condition | Description |
|-----------|-------------|
| Platform-specific API | Uses macOS/Windows/iOS/Android-only APIs |
| Cannot build in container | Compilation errors in Linux container |
| CI-verifiable | Can be tested on GitHub Actions runners |

### Platform-Specific Libraries (Exception Applies)

| Platform | Libraries |
|----------|-----------|
| **macOS** | `objc2`, `cocoa`, `core-foundation`, `core-graphics`, `core-audio`, `security-framework`, `appkit`, `icrate` |
| **Windows** | `windows-rs`, `winapi`, `win32` |
| **iOS** | `swift`, `uikit` |
| **Android** | `kotlin`, `android-ndk`, `jni` |

### Cross-Platform Libraries (No Exception)

These libraries are cross-platform and can build in container-use:

| Library | Description |
|---------|-------------|
| `tray-icon` | Menu bar/system tray |
| `notify-rust` | Notifications |
| `rodio` | Audio playback |
| `image` | Image processing |

### Exception Workflow

> **Reference**: @.claude/skills/worktree-workflow/SKILL.md

When exception applies, use worktree:

```bash
# 1. Create worktree
bash .claude/skill/create-worktree/scripts/create_worktree.sh issue-{issue_id}-{feature}

# 2. Move to worktree and develop
cd .worktrees/issue-{issue_id}-{feature}

# 3. After completion, create PR + cleanup worktree
bash ../../.claude/skill/pr-and-cleanup/scripts/pr_and_cleanup.sh --title "feat: {summary}" --body "Closes #{issue_id}

[platform-exception: macOS]"
```

---

## Design Document Synchronization

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Design First** | Read design docs BEFORE implementation |
| **Document Deviations** | Any deviation from design MUST be documented |
| **Update or Annotate** | Either update the design doc OR annotate in PR |

### Implementation Phases

**Phase 1: Pre-Implementation**
1. Read the design document thoroughly
2. Verify design completeness
3. Check for conflicts with existing code

**Phase 2: During Implementation**
1. Follow design specifications
2. Track deviations as they occur

**Phase 3: Post-Implementation**
1. Review deviations list
2. Update design doc OR annotate in PR

### Deviation Documentation Format

```markdown
### Deviations from Design

| Design Spec | Implementation | Reason |
|-------------|----------------|--------|
| `UserStatus` struct | `AccountStatus` struct | More generic naming |
```

---

## Testing Strategy

### Code Classification

| Category | Examples | Testing Strategy |
|----------|----------|------------------|
| **Pure Logic** | Data transformations, calculations | Standard unit tests |
| **OS API Calls** | Platform-specific commands | Mock or `#[ignore]` |
| **File System** | Config files, platform-specific configs | tempdir or Mock |
| **Network** | HTTP clients, sockets | Mock server or `#[ignore]` |
| **Hardware** | Audio devices, display | `#[ignore]` + manual testing |

### Mock Guidelines

**What to Mock:**
- External commands (platform-specific)
- File system (use tempdir for isolation)
- Network (avoid port conflicts)
- Time/delays (speed up tests)
- Audio playback (no audio device in CI)
- Notifications (no notification center in CI)

**What NOT to Mock:**
- Your own pure functions
- Data structures
- Serialization/deserialization
- Error types

### Test Attributes Cheat Sheet

```rust
#[test]                           // Standard test
#[ignore]                         // Skip by default
#[ignore = "reason"]              // Skip with reason
#[cfg(test)]                      // Only compile for tests
#[cfg(target_os = "macos")]       // Platform-specific
#[should_panic]                   // Expect panic
```

### Running Tests

```bash
# All tests (skips #[ignore])
cargo test

# Include ignored tests
cargo test -- --ignored

# Only ignored tests
cargo test -- --ignored --include-ignored

# With output
cargo test -- --nocapture
```

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| @.claude/skills/container-use-guide/SKILL.md | Environment setup guide |
| @.claude/skills/environments-json-management/SKILL.md | Environment state management |
| @.claude/skills/pr-merge-workflow/SKILL.md | PR creation to merge flow |
| @.claude/skills/worktree-workflow/SKILL.md | Host environment development |
| @.claude/skills/code-quality-rules/SKILL.md | Code quality standards |
