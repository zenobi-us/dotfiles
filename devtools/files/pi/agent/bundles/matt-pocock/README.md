# Matt Pocock Pi bundle

Engineering workflow skills plus origin-keyed shared context support.

## Upstream skills

Promoted skills and human docs are synchronized from [`mattpocock/skills`](https://github.com/mattpocock/skills) commit `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`:

- `skills/engineering/` — 17 engineering skills, including `ask-matt`, `to-spec`, `to-tickets`, and `wayfinder`
- `skills/productivity/` — 5 productivity skills, including `writing-great-skills`
- `docs/engineering/` and `docs/productivity/` — upstream human-facing docs
- `agents/openai.yaml` — upstream Agent Skills metadata retained beside every skill

Pi-specific divergence is limited to the shared-context extension, [ALIGNMENT-ROOT.md](./skills/ALIGNMENT-ROOT.md), short alignment-root pointers in artifact-consuming skills, setup/storage integration, and tracker backend metadata required by migration.

## Context extension

The bundled extension resolves the current Git repository's `origin`, canonicalizes it, and derives:

```text
~/.pi/shared-context/<slugified-origin>--<hash>/
```

### Why ?

Two reasons (mainly) :

- Sometimes I work in repos that aren't completely under my control, and so I either dont want to influence other peoples clankers, or am not allowed to modify the repos AGENTS.md.
- Some repos I work with may be considered to be a part of a larger project or effort. In these cases, I want to be able to share context across multiple repos, and so I want to be able to have a shared AGENTS.md that is not tied to any one repo.


In all cases, the end effect here is that I now have a way to:

- Append more system prompt for repos that share context without modifying the AGENTS.md in each repo.
- Share research and planning if I need.

### How it works

The pi extension simply injects a bit of XML into the agent's system prompt, which tells the agent where to find the shared context. Pocock skills from then on will resolve alignment files against the shared context root, falling back to the repository root when the extension is absent.

The extension also provides a set of `/eng-context` subcommands to manage the shared context, including reporting the current storage, initializing shared storage, listing all origin-keyed shared contexts, and migrating alignment files between repository and shared storage.


### Usage

Use `/eng-context` subcommands:

- `/eng-context report` shows current storage, roots, origin, and slug.
- `/eng-context init` creates shared `AGENTS.md` and activates shared storage.
- `/eng-context list` lists every origin-keyed shared context.
- `/eng-context migrate` copies alignment files to the opposite storage, verifies existing files match, and activates the destination. Source files remain intact.

Subcommands support Pi command argument autocomplete. Running `/eng-context` without a subcommand defaults to `report`.

When shared `AGENTS.md` exists, the extension appends:

```xml
<matt-pocock-context
  storage="shared"
  root="/home/q/.pi/shared-context/github-com-owner-repo--12345678"
  shared-root="/home/q/.pi/shared-context/github-com-owner-repo--12345678"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  source="/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md">
  <instructions source="/home/q/.pi/shared-context/github-com-owner-repo--12345678/AGENTS.md">
    ...XML-escaped instructions...
  </instructions>
</matt-pocock-context>
```

Without shared `AGENTS.md`, repository behavior remains active:

```xml
<matt-pocock-context
  storage="repository"
  root="/work/repo"
  shared-root="/work/repo"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  source="/work/repo/AGENTS.md">
  <instructions source="/work/repo/AGENTS.md" already-loaded="true" />
</matt-pocock-context>
```

`root` and `shared-root` both identify the active alignment storage. They point to the repository in repository mode and the origin-keyed external directory in shared mode. A `.storage` marker in the external directory records the selected mode, allowing migration back to repository storage without deleting the shared copy. The external candidate is intentionally omitted from XML while repository storage is active.

## Alignment files

Skills resolve these paths against the injected `root`, falling back to the repository root when the extension is absent:

```text
AGENTS.md
docs/agents/issue-tracker.md
docs/agents/triage-labels.md
docs/agents/domain.md
CONTEXT.md
CONTEXT-MAP.md
docs/adr/
src/**/docs/adr/
.scratch/
```

Migration covers `AGENTS.md` (or the active repository instruction file), `docs/agents/`, `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, and context-scoped `src/**/docs/adr/`. It copies `.scratch/` only when `docs/agents/issue-tracker.md` declares `backend: local-markdown`; external trackers leave `.scratch/` behind. Missing backend metadata with an existing `.scratch/` aborts migration. Differing destination files also abort before anything is copied.

Repository source code, ordinary project docs/specs, tests, prototypes, research notes, commits, and branches always remain in the Git working tree.
