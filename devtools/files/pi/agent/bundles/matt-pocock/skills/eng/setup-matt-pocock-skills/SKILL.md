---
name: setup-matt-pocock-skills
description: Configure the Matt Pocock engineering skills for a repository — alignment storage, issue tracker, triage labels, and domain-document layout.
disable-model-invocation: true
---

# Setup Matt Pocock Skills

Configure the shared substrate used by the engineering skills:

- **Alignment storage** — repository-local or shared outside the repository
- **Issue tracker** — GitHub, GitLab, local Markdown, local shared context, or another workflow
- **Triage labels** — actual tracker strings for the canonical workflow roles
- **Domain docs** — where `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs live

Read [ALIGNMENT-ROOT.md](../ALIGNMENT-ROOT.md) before starting.

## Process

### 1. Discover current state

Inspect the system prompt for `<matt-pocock-context>`. Record its `storage`, `root`, `shared-root`, `repository-root`, `source`, `origin`, and `slug` attributes.

Inspect the repository root for:

- `AGENTS.md` and `CLAUDE.md`, including any existing `## Agent skills` section
- `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, and `src/*/docs/adr/`
- `docs/agents/`
- `.scratch/`
- `git remote -v`

If `shared-root` is available, inspect that directory for the same alignment files. Missing shared directories are normal before first setup.

### 2. Ask for configuration

Present the findings, explain each choice briefly, then collect these decisions together with the structured ask tool.

**Alignment storage:**

- **Repository** — configuration, domain documents, ADRs, and local issue files live in the repository. Existing behavior.
- **Shared context** — those files live beneath the injected `shared-root`, outside the repository. Requires the Matt Pocock context extension.

Default to the currently active storage. If no `<matt-pocock-context>` exists, repository storage is the only valid choice; do not invent a shared path.

**Issue tracker:**

- **GitHub** — use `gh`; propose when `origin` points at GitHub
- **GitLab** — use `glab`; propose when `origin` points at GitLab
- **Local Markdown** — issues live beneath `.scratch/` in the selected alignment root
- **Other** — record the user-described workflow as prose

When shared storage and Local Markdown are selected, the tracker method is **local-shared-context**. When repository storage is selected, it remains **local markdown**.

For GitHub or GitLab, also ask whether external pull requests are a triage request surface. Default: no.

**Triage labels:**

Ask whether any canonical role maps to a different tracker string: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Default each role to its own name.

**Domain layout:**

- **Single-context** — `CONTEXT.md` and `docs/adr/` beneath the alignment root
- **Multi-context** — `CONTEXT-MAP.md` beneath the alignment root points to context glossaries and ADR directories beneath that same root

Default to the layout already present; otherwise single-context.

### 3. Resolve output root

- Repository storage: `ALIGNMENT_ROOT` is `repository-root` from the injected context, or the Git repository root when no context was injected.
- Shared storage: `ALIGNMENT_ROOT` is `shared-root` from the injected context. It MUST be an absolute path beneath `~/.pi/shared-context/`.

All output paths below are relative to `ALIGNMENT_ROOT`.

### 4. Draft and confirm

Show one draft containing:

- Target alignment root and storage mode
- `## Agent skills` block
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

Let the user edit the draft before writing.

The block:

```markdown
## Agent skills

### Issue tracker

[summary]. See `docs/agents/issue-tracker.md` relative to the active Matt Pocock alignment root.

### Triage labels

[summary]. See `docs/agents/triage-labels.md` relative to the active Matt Pocock alignment root.

### Domain docs

["single-context" or "multi-context" summary]. See `docs/agents/domain.md` relative to the active Matt Pocock alignment root.
```

### 5. Write

Create files lazily and preserve unrelated user content.

For repository storage:

1. If `CLAUDE.md` exists, update it.
2. Else if `AGENTS.md` exists, update it.
3. If neither exists, ask which one to create.
4. Never create the other file when one already exists.

For shared storage:

1. Create `ALIGNMENT_ROOT` if needed.
2. Update or create `ALIGNMENT_ROOT/AGENTS.md`.
3. MUST NOT edit repository `AGENTS.md` or `CLAUDE.md`.

If `## Agent skills` already exists, update it in place rather than adding a duplicate.

Write the three configuration files using these seeds:

- [issue-tracker-github.md](./issue-tracker-github.md)
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)
- [issue-tracker-local.md](./issue-tracker-local.md) for repository-local Markdown
- [issue-tracker-local-shared-context.md](./issue-tracker-local-shared-context.md) for shared local Markdown
- [triage-labels.md](./triage-labels.md)
- [domain.md](./domain.md)

For another tracker, write `docs/agents/issue-tracker.md` from the user's description.

Configuration, domain documents, ADRs, and local issue files created by this workflow MUST stay beneath the selected alignment root. Source code remains in the repository.

### 6. Finish

Report the absolute alignment root and files written. First-time shared setup activates on the next agent turn because the extension resolves the file for every turn.
