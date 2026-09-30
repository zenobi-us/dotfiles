---
name: setup-matt-pocock-skills
description: Configure this repo for the engineering skills — choose alignment storage, set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
user-invocable: true
---

## Language

All agent-authored prose MUST follow **ASD-STE100 Simplified Technical English**. Apply it to questions, explanations, recommendations, issue text, reports, handoffs, and procedures.

- Use short, complete sentences and active voice.
- Use one term for one meaning.
- Put conditions before commands.
- Use imperative sentences for procedures.
- Keep code, identifiers, commands, quoted text, product names, and exact domain terms unchanged.
- Use the `simple-english` skill for the full rule set.

# Setup Matt Pocock's Skills

Scaffold the configuration that the engineering skills assume:

- **Alignment storage** — repository-local or origin-keyed shared storage outside the repository
- **Issue tracker** — where issues live (GitHub by default; local markdown is supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

Before reading or writing these artifacts, run the shared-context CLI procedure from `agent-core:shared-context` in the repository root. Use its reported `root` as `ALIGNMENT_ROOT` and its reported `repository-root` for repository files. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md). The CLI is the source of truth for storage and path resolution.

## Process

### 1. Resolve roots and explore

Run the shared-context CLI `report` command and record its `storage`, `root`, `shared root`, `origin`, and `slug` output. Use the reported `root` as `ALIGNMENT_ROOT`. Do not resolve storage from prompt text, environment variables, configuration paths, or repository path formulas.

Inspect the repository root for source and Git state:

- `git remote -v` and `.git/config`
- root `AGENTS.md` and `CLAUDE.md`
- monorepo signals: `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or populated `packages/*/src/`
- whether `triage` is installed

Inspect the reported `ALIGNMENT_ROOT` for alignment state:

- `AGENTS.md` or the active repository instruction file
- `CONTEXT-MAP.md`, `docs/adr/`, and `domains/*/CONTEXT.md`
- `docs/agents/`
- `tracker/`, `workflows/`, and `sources/`

Read existing files. Do not infer missing state from repository paths while shared storage is active.

### 2. Present findings and ask

Summarise what's present and missing. Take the sections in order, one answer at a time. Lead with the recommended answer. Skip a section when exploration already settled it.

**Section A — Alignment storage.**

Default to the currently active storage.

- **Repository** — alignment files live in the Git working tree.
- **Shared** — alignment files live under the `root` reported by the CLI; source code remains in the repository.

If storage must change, ask the user to run the shared-context `init` or `migrate` command through its documented CLI procedure. Stop after that command. Never write into an inactive destination.

**Section B — Issue tracker.**

The issue tracker is where issues live. Skills such as `to-tickets`, `triage`, `to-spec`, and `wayfinder` read from and write to it.

If the remote is GitHub, recommend GitHub. If it is GitLab, recommend GitLab. Otherwise offer:

- **GitHub** — GitHub Issues via `gh`
- **GitLab** — GitLab Issues via `glab`
- **Local markdown** — stable ticket files under `tracker/tickets/` and
  initiative records under `tracker/initiatives/`
- **Other** — record the user's workflow as freeform prose

The tracker choice is independent of alignment storage. Record it in `docs/agents/issue-tracker.md`. GitHub and GitLab templates keep external PRs as a request surface disabled by default.

**Section C — Triage label vocabulary.** Skip when `triage` is not installed.

Ask whether to keep the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Recommend yes. Collect overrides only when the existing tracker already uses other strings.

**Section D — Domain docs.**

Create `CONTEXT-MAP.md` as the stable root navigation document. For a
single-context project, it points to one `CONTEXT.md` and `docs/adr/`. For a
multi-context project, it points to `domains/<domain>/CONTEXT.md`. Keep ADRs
central under `docs/adr/`.

### 3. Confirm and edit

Show one draft containing:

- active storage and absolute `ALIGNMENT_ROOT`
- the `## Agent skills` block
- `docs/agents/issue-tracker.md`
- `docs/agents/domain.md`
- `docs/agents/triage-labels.md` when `triage` is installed

Let the user edit before writing. If the write uses shared storage, show the resolved root and the publication steps.

### 4. Write

Before each write, confirm that the destination is under the current
CLI-reported `ALIGNMENT_ROOT`. Use `cli.ts path` for tracker, workflow, source,
and ADR targets. Run `cli.ts index <dir>` after adding or removing a file in a
source directory. Read the shared-context publishing procedure after every
shared-root write and publish when required.

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

Create or update these navigation files:

- `CONTEXT-MAP.md` with stable entry points only;
- `docs/adr/index.md` with links to existing ADRs;
- `workflows/index.md` when a workflow area exists;
- `tracker/index.md` when the backend is `local-markdown`;
- each initiative's `tracker/initiatives/<id>/index.md`.

An index MUST describe or link existing records. It MUST NOT claim that a
directory is empty. Do not list individual event receipts in `CONTEXT-MAP.md`.

Every generated `docs/agents/issue-tracker.md` MUST begin with YAML frontmatter
naming the actual backend, such as `backend: github`, `backend: gitlab`,
`backend: jira`, or `backend: local-markdown`. Local Markdown MUST also declare:

```yaml
initiative-root: tracker/initiatives
issue-root: tracker/tickets
```

For local Markdown, define separate `triage` and `work_status` fields.
`work_status: completed` is valid only after verification, merge, and push
succeed. Validate both configured roots after writing the tracker document.

For another tracker, write the tracker document from the user's description and use the actual service identifier as `backend`.

Only local markdown stores issue data beneath `ALIGNMENT_ROOT`; external tracker data remains external. Repository source, ordinary project docs, prototypes, research notes, commits, and branches remain in the repository.

### 5. Done

Report active storage, absolute `ALIGNMENT_ROOT`, and files written. Mention that `docs/agents/*.md` can be edited directly later. After `init` or `migrate`, run the shared-context CLI `report` command again and use its new output immediately.

## Context resolution

Before reading or writing workflow or domain artifacts, run the shared-context CLI procedure from `agent-core:shared-context` in the repository root. Use its `root` output as `ALIGNMENT_ROOT` and its `repository-root` output for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a shared-context source write, use `cli.ts path source` before choosing a
directory, run `cli.ts index <dir>` after adding or removing a file there, and
read the shared-context publishing procedure after the write. Follow
[ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.
