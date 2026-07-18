---
name: setup-matt-pocock-skills
description: Configure this repo for the engineering skills — choose alignment storage, set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the configuration that the engineering skills assume:

- **Alignment storage** — repository-local or origin-keyed shared storage outside the repository
- **Issue tracker** — where issues live (GitHub by default; local markdown is supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

Before reading or writing these artifacts, follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md). This is a prompt-driven skill: explore, present what you found, confirm with the user, then write.

## Process

### 1. Resolve roots and explore

Inspect the system prompt for `<matt-pocock-context>`. Record its `storage`, `root`, `shared-root`, `repository-root`, `source`, `origin`, and `slug` attributes. If it is absent, repository storage is the only active mode and the Git repository root is `ALIGNMENT_ROOT`.

Inspect the repository root for source and Git state:

- `git remote -v` and `.git/config`
- root `AGENTS.md` and `CLAUDE.md`
- monorepo signals: `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or populated `packages/*/src/`
- whether `triage` is installed

Inspect `ALIGNMENT_ROOT` for alignment state:

- `AGENTS.md` or the active repository instruction file
- `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, and context-scoped `src/*/docs/adr/`
- `docs/agents/`
- `.scratch/`

Read existing files. Do not infer missing state from repository paths while shared storage is active.

### 2. Present findings and ask

Summarise what's present and missing. Take the sections in order, one answer at a time. Lead with the recommended answer. Skip a section when exploration already settled it.

**Section A — Alignment storage.**

Default to the currently active storage.

- **Repository** — alignment files live in the Git working tree.
- **Shared** — alignment files live beneath `~/.pi/shared-context/<origin-slug>/`; source code remains in the repository.

If no `<matt-pocock-context>` exists, do not invent a shared path. If repository storage is active and the user chooses first-time shared storage, run `/eng-context init`, stop, and rerun this skill on the next agent turn. If populated alignment storage must switch modes, run `/eng-context migrate`, stop, and rerun on the next turn. Never write into an inactive destination.

**Section B — Issue tracker.**

The issue tracker is where issues live. Skills such as `to-tickets`, `triage`, `to-spec`, and `wayfinder` read from and write to it.

If the remote is GitHub, recommend GitHub. If it is GitLab, recommend GitLab. Otherwise offer:

- **GitHub** — GitHub Issues via `gh`
- **GitLab** — GitLab Issues via `glab`
- **Local markdown** — one file per issue beneath `.scratch/<feature>/` under `ALIGNMENT_ROOT`
- **Other** — record the user's workflow as freeform prose

The tracker choice is independent of alignment storage. Record it in `docs/agents/issue-tracker.md`. GitHub and GitLab templates keep external PRs as a request surface disabled by default.

**Section C — Triage label vocabulary.** Skip when `triage` is not installed.

Ask whether to keep the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Recommend yes. Collect overrides only when the existing tracker already uses other strings.

**Section D — Domain docs.**

Default to single-context: one `CONTEXT.md` plus `docs/adr/` beneath `ALIGNMENT_ROOT`. Offer multi-context — one `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` and ADR directories beneath the same root — only when exploration found genuine monorepo signals.

### 3. Confirm and edit

Show one draft containing:

- active storage and absolute `ALIGNMENT_ROOT`
- the `## Agent skills` block
- `docs/agents/issue-tracker.md`
- `docs/agents/domain.md`
- `docs/agents/triage-labels.md` when `triage` is installed

Let the user edit before writing.

### 4. Write

For repository storage, edit `CLAUDE.md` when it exists, otherwise `AGENTS.md`. If neither exists, ask which one to create. Never create the other file when one already exists.

For shared storage, update or create `ALIGNMENT_ROOT/AGENTS.md`. MUST NOT edit repository `AGENTS.md` or `CLAUDE.md`.

Update an existing `## Agent skills` block in place. Preserve unrelated content. Use this block:

```markdown
## Agent skills

### Issue tracker

[summary]. See `docs/agents/issue-tracker.md` relative to the active Matt Pocock alignment root.

### Triage labels

[summary]. See `docs/agents/triage-labels.md` relative to the active Matt Pocock alignment root.

### Domain docs

["single-context" or "multi-context" summary]. See `docs/agents/domain.md` relative to the active Matt Pocock alignment root.
```

Omit the triage block and file when `triage` is not installed.

Write configuration files beneath `ALIGNMENT_ROOT` using these seeds:

- [issue-tracker-github.md](./issue-tracker-github.md)
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)
- [issue-tracker-local.md](./issue-tracker-local.md)
- [triage-labels.md](./triage-labels.md)
- [domain.md](./domain.md)

Every generated `docs/agents/issue-tracker.md` MUST begin with YAML frontmatter naming the actual backend, such as `backend: github`, `backend: gitlab`, `backend: jira`, or `backend: local-markdown`. Local markdown MUST also declare `issue-root: .scratch`. `/eng-context migrate` uses this metadata and MUST NOT infer the backend from prose.

For another tracker, write the tracker document from the user's description and use the actual service identifier as `backend`.

Only local markdown stores issue data beneath `ALIGNMENT_ROOT`; external tracker data remains external. Repository source, ordinary project docs, prototypes, research notes, commits, and branches remain in the repository.

### 5. Done

Report active storage, absolute `ALIGNMENT_ROOT`, and files written. Mention that `docs/agents/*.md` can be edited directly later. A storage change activates on the next agent turn.
