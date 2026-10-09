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
- Use the `iso-24495-1` skill for the full rule set.

# Setup Matt Pocock's Skills

Scaffold the configuration that the engineering skills assume:

- **Alignment storage** — repository-local or origin-keyed shared storage outside the repository
- **Issue tracker** — where issues live (GitHub by default; local markdown is supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them

Before reading or writing these artifacts, use the `agent-core:shared-context` skill from the repository root. Use the root that the skill resolves as `ALIGNMENT_ROOT` and use the repository root for repository files. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md). The shared-context skill is the source of truth for storage and path resolution.

## Process

### 1. Resolve roots and explore

Use the `agent-core:shared-context` skill and record its route table, `mode`,
alignment `root`, `repository-root`, `origin`, and `slug`. Use the reported
alignment `root` as `ALIGNMENT_ROOT`. Do not infer a route from prompt text,
environment variables, configuration paths, or repository path formulas.

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

**Section A — File-backed records.**

Default to the active routes. If routes are not configured, recommend the
repository store unless the user requests shared storage.

- **Alignment** — `AGENTS.md`, domain documents, ADRs, and agent configuration.
- **Initiatives** — Markdown records. Use the default file store.
- **Workflows** — receipts, reviews, snapshots, and projections. Use the default
  file store.
- **Evidence** — inherit the workflow store. Ask about a separate store only
  when the user requests one.
- **Sources** — inherit the alignment store.

Ask for one default file store: `repository` or `shared`. Show the full route
table before you write it.

**Section B — Issue tracker.**

The issue tracker owns ticket records. Skills such as `to-tickets`, `triage`,
`to-spec`, and `wayfinder` read from and write to it.

If the remote is GitHub, recommend GitHub. If it is GitLab, recommend GitLab.
Otherwise offer:

- **GitHub** — GitHub Issues via `gh`
- **GitLab** — GitLab Issues via `glab`
- **Local Markdown** — tickets and initiatives use their configured file stores.
- **Other** — use a configured tracker adapter.

The tracker choice is independent of file storage. Record it in
`docs/agents/issue-tracker.md`. External tickets remain in the tracker. Use the
`hosted-shared` preset when the user wants external tickets with shared
initiatives and workflow records.

**Section C — Triage label vocabulary.** Skip when `triage` is not installed.

Ask whether to keep the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Recommend yes. Collect overrides only when the existing tracker already uses other strings.

**Section D — Domain docs.**

Create `CONTEXT-MAP.md` as the stable root navigation document. For a
single-context project, it points to one `CONTEXT.md` and `docs/adr/`. For a
multi-context project, it points to `domains/<domain>/CONTEXT.md`. Keep ADRs
central under `docs/adr/`.

### 3. Confirm and edit

Show one draft containing:

- the full record route table and absolute alignment root;
- the selected preset, if any;
- the `## Agent skills` block;
- `docs/agents/issue-tracker.md`;
- `docs/agents/domain.md`;
- `docs/agents/triage-labels.md` when `triage` is installed.

Let the user edit before writing. If a route uses shared storage, show its
resolved root and publication steps.

### 4. Write

Before each write, resolve its record kind with the
`agent-core:shared-context` skill. Use the reported alignment root only for
alignment files. Resolve tracker, initiative, workflow, evidence, source, and
ADR targets with `shared-context resolve`. Run
`shared-context index <dir> --kind source --source <SOURCE>` after a source
directory changes. Include its ticket or library selector. Apply the publishing
rules to each shared store after the write.

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

Only local Markdown stores issue data in file-backed routes; external tracker
data remains external. Repository source, ordinary project docs, prototypes,
research notes, commits, and branches remain in the repository.

### 5. Done

Report the route table, absolute alignment root, and files written. Mention that
`docs/agents/*.md` can be edited directly later. After `init` or `migrate`, rerun
the shared-context CLI and resolve each affected record before continuing.

## Context resolution

Before reading or writing workflow or domain artifacts, use the `agent-core:shared-context` skill from the repository root. Use the root that the skill resolves as `ALIGNMENT_ROOT`. Use the repository root for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a shared-context source write, use the `agent-core:shared-context` skill to
resolve the source directory before choosing a destination. Use that skill to update
the source index after adding or removing a file there, and apply its publishing
procedure after the write. Follow
[ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.
