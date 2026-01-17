# Skill Index

> **Purpose**: Lazy loading guide for skills. Load only when trigger condition matches.
> **Total skills**: 30 | **Total lines**: ~7,200

---

## Loading Rules

1. **Session Start**: Load this index only (~100 lines)
2. **On Trigger**: Load specific skill when condition matches
3. **Explicit Request**: Load when user or workflow explicitly requires

---

## Skill Catalog

### Environment & Container (load at implementation start)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `container-use-guide` | 383 | Environment creation | Container setup, services, commands |
| `tech-stack-configs` | 246 | Tech stack setup | Stack-specific configs, DB migrations |
| `github-issue-state-management` | 350 | Session recovery, env tracking | **SSOT via GitHub Issue labels** |
| `delete-environment` | 105 | Environment cleanup | Container, file, label removal |

### Implementation Flow (load during coding)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `sisyphus-implementation-guide` | 270 | Issue implementation | Sisyphus agent flow, checklists |
| `implement-subtask-rules` | 317 | Subtask execution | Design doc reference matrix |
| `tdd-implementation` | 113 | Test writing | Red-Green-Refactor cycle |
| `code-quality-rules` | 223 | Code writing | 500-line rule, architecture |
| `issue-size-estimation` | 104 | Issue planning | Size labels, line estimates |

### Quality & Review (load before PR)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `quality-review-flow` | 261 | Before PR creation | Score criteria, TODO-driven fix |
| `stress-test-flow` | 353 | Critical features | Parallel security/perf/edge tests |
| `reviewer-common` | 141 | Review execution | Reviewer shared guidelines |
| `review-guidelines` | 293 | Detailed review | Domain-specific review points |

### Git & PR (load at PR stage)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `pr-merge-workflow` | 203 | PR to merge | Full PR lifecycle |
| `pr-and-cleanup` | 93 | After PR merge | Worktree cleanup |
| `ci-workflow` | 214 | CI failure | CI monitoring, fix flow |
| `github-graphql-api` | 132 | Sub-issue creation | GraphQL API patterns |

### Workflow Control (load when managing phases)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `workflow-phase-convention` | 218 | Phase management | Phase numbering, gates |
| `approval-gate` | 148 | User approval needed | Approval prompt format |
| `subtask-detection` | 178 | Issue decomposition | Dependency resolution |
| `handover-process` | 100 | BE/FE handoff | Cross-domain requests |

### Design (load during design phase)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `design-document-types` | 321 | Design creation | Required doc types per project |
| `detailed-design-templates` | 335 | Detailed design | Issue templates, review prompts |
| `tech-stack-selection` | 174 | Basic design | Stack selection criteria |
| `infra-workflow` | 360 | Infra design | Terraform, Docker Compose |
| `release-workflow` | 439 | Release creation | Version, changelog, GitHub Release |
| `wireframe-generator` | 288 | Screen design mockup | YAML→Chakra UI wireframe screenshots |

### Special Cases (load when applicable)

| Skill | Lines | Trigger | Description |
|-------|-------|---------|-------------|
| `worktree-workflow` | 147 | Platform-specific code | Host environment development |
| `create-worktree` | 67 | Branch isolation | Worktree creation |
| `iterative-review` | 310 | .opencode modifications | Self-improvement loop |

---

## Quick Reference by Task

| Task | Load These Skills |
|------|-------------------|
| **New implementation** | `container-use-guide`, `tdd-implementation`, `code-quality-rules` |
| **Before PR** | `quality-review-flow` |
| **Critical feature** | + `stress-test-flow` |
| **CI failed** | `ci-workflow` |
| **Session recovery** | `github-issue-state-management` |
| **Platform exception** | `worktree-workflow`, `create-worktree` |
| **Release** | `release-workflow` |

---

## Token Estimates

| Scenario | Skills Loaded | Lines | vs Full Load |
|----------|---------------|-------|--------------|
| Simple fix | 2-3 | ~600 | **90% saved** |
| Standard impl | 4-5 | ~1,200 | **80% saved** |
| Full workflow | 8-10 | ~2,500 | **60% saved** |
| All skills | 29 | ~7,000 | baseline |

---

> **Usage**: `{{skill:approval-gate}}` or `{{skill:tdd-implementation}}` to load specific skill
