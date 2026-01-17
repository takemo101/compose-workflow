# OpenCode Quick Reference

> **Purpose**: Minimal context for token-efficient session initialization.
> **Full details**: See `README.md` or specific skills.

---

## Commands

| Command | Purpose | Output | Pass |
|---------|---------|--------|------|
| `/req-workflow` | Requirements definition | REQ-XXX.md | 8+ |
| `/basic-design-workflow` | Basic design | BASIC-XXX.md | 9+ |
| `/detailed-design-workflow` | Detailed design | Design docs + Issues | 9+ |
| `/implement-issues` | Implementation | Code + PR | 9+ |
| `/release` | Release | GitHub Release | - |
| `/bug-fix` | Bug fix | PR | - |

---

## Agents

### Writers
- `req-writer`: Requirements documents
- `basic-design-writer`: Basic design documents
- `detailed-design-writer`: Detailed design documents
- `test-spec-writer`: Test specifications

### Reviewers
- `frontend-reviewer`: UI/UX, React, accessibility
- `backend-reviewer`: API, performance, architecture
- `database-reviewer`: Schema, indexes, migrations
- `security-reviewer`: OWASP, auth, injection
- `infra-reviewer`: AWS/GCP, K8s, availability

---

## Quality Standards

| Metric | Threshold |
|--------|-----------|
| Review Score | 9+ (8+ for infra/req) |
| Test Coverage | 80%+ |
| File Size | 500 lines max |
| Lint/Type Errors | 0 |

---

## Key Skills (load when needed)

| Trigger | Skill |
|---------|-------|
| Environment setup | `container-use-guide` |
| Before PR | `quality-review-flow` |
| Critical features | `stress-test-flow` |
| TDD cycle | `tdd-implementation` |
| CI failure | `ci-workflow` |
| Session recovery | `github-issue-state-management` |

---

## Container-use Basics

```python
# Create environment
container-use_environment_create(title="Issue #N")

# Configure
container-use_environment_config(
    base_image="node:20-slim",
    setup_commands=["npm ci"]
)

# Add service (if needed)
container-use_environment_add_service(
    name="postgres", 
    image="postgres:15-alpine"
)

# Run tests
container-use_environment_run_cmd(command="npm test")
```

---

## Document Structure

```
docs/
├── memos/           # Ideas (input)
├── requirements/    # REQ-XXX.md
└── designs/
    ├── basic/       # BASIC-XXX.md
    └── detailed/    # Feature folders
```

---

## Prohibited Patterns

- `as any`, `@ts-ignore`, `@ts-expect-error`
- Empty catch blocks
- Commit without explicit request
- Skip quality review before PR

---

> **Need more detail?** Load specific skill with `{{skill:approval-gate}}` or `{{skill:container-use-guide}}`
