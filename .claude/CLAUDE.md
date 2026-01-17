# Project Instructions

This document provides essential guidelines for AI assistants working on this project.

---

## Core Instructions

Detailed instructions are maintained in separate files. **MUST READ** before implementation:

| Document | Purpose | When to Read |
|----------|---------|--------------|
| @.claude/instructions/container-use.md | Container environment rules, recovery, completion criteria | **Always (implementation)** |
| @.claude/instructions/platform-exception.md | Platform-specific code exception handling | When using macOS/Windows/iOS/Android APIs |
| @.claude/instructions/design-sync.md | Design document synchronization policy | Before implementation |
| @.claude/instructions/testing-strategy.md | Testing patterns, mocking guidelines | When writing tests |

---

## Quick Reference

### Container-Use (Summary)

> **Full Details**: @.claude/instructions/container-use.md

- **ALWAYS** use container-use for ALL file/code/shell operations
- **Exception**: `.claude/` workflow docs may be edited directly on host
- **GitHub Issue ラベル**: Phase遷移時は必ずラベルを更新（{{skill:github-issue-state-management}}）
- **Never push broken code** to CI hoping it works

### Platform Exception (Summary)

> **Full Details**: @.claude/instructions/platform-exception.md

- Platform-specific APIs (objc2, windows-rs, etc.) → Use worktree workflow
- Cross-platform libraries (tray-icon, rodio, etc.) → Use container-use

### Design Sync (Summary)

> **Full Details**: @.claude/instructions/design-sync.md

- Read design docs BEFORE implementation
- Document ALL deviations in PR or update design doc

### Testing Strategy (Summary)

> **Full Details**: @.claude/instructions/testing-strategy.md

- Pure logic → Unit tests
- OS API / Hardware → Mock or `#[ignore]`
- File System → tempdir

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| @.claude/skills/container-use-guide/SKILL.md | Environment setup guide |
| @.claude/skills/github-issue-state-management/SKILL.md | Environment state management (GitHub Issue labels) |
| @.claude/skills/pr-merge-workflow/SKILL.md | PR creation to merge flow |
| @.claude/skills/worktree-workflow/SKILL.md | Host environment development |
| @.claude/skills/code-quality-rules/SKILL.md | Code quality standards |
