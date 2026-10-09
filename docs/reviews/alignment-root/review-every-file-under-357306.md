# Agent review: Matt Pocock ALIGNMENT_ROOT references

- Agent: `review-every-file-under-357306`
- Scope: all files under `.mise/conf.d/devtools-agent/bundles/matt-pocock/skills` containing `ALIGNMENT_ROOT`, plus `ALIGNMENT-ROOT.md`
- Result: no files edited

## Findings

### P1 — Root resolution trusts the prompt instead of the CLI

Files:

- `.mise/conf.d/devtools-agent/bundles/matt-pocock/ALIGNMENT-ROOT.md:3-4`
- `skills/setup-matt-pocock-skills/SKILL.md:33`
- `skills/setup-matt-pocock-skills/SKILL.md:42`
- `skills/setup-matt-pocock-skills/SKILL.md:145-150`

Run `cli.ts report` from the repository. Treat its `root`, `storage`, and repository values as authoritative. Do not use prompt presence or absence as the resolver.

### P1 — Common boilerplate omits the mandatory CLI report

The repeated block in 25 skills says to follow `ALIGNMENT-ROOT.md` and resolve against `ALIGNMENT_ROOT`, but does not require the CLI, use its root, or stop on failure.

Replace it with a CLI-first procedure that runs the CLI from the repository, uses its output, stops on non-zero exit, and keeps source files relative to `repository-root`.

### P1 — Setup uses obsolete commands and manually derives paths

File: `skills/setup-matt-pocock-skills/SKILL.md`

Replace `/agent-core context init` and `/agent-core context migrate` with the direct CLI commands. Remove the `<storage_path>/<origin-slug>/` formula. Use only the CLI-reported root.

### P1 — Setup writes without the current path and publication workflow

Files:

- `setup-matt-pocock-skills/SKILL.md:42-47`
- `setup-matt-pocock-skills/SKILL.md:101`
- `setup-matt-pocock-skills/SKILL.md:123-137`

Require CLI resolution, `anchor`, `index`, and shared-store publication handling for writes.

### P2 — Ticket routing treats `ALIGNMENT_ROOT` as an undefined shell variable

File: `skills/reading-and-writing-tickets/SKILL.md:21-22,46`

Use the absolute root reported by the CLI rather than assuming `$ALIGNMENT_ROOT` exists.

### P2 — Ticket routing lacks a CLI failure rule

Require `cli.ts report`, use its root in both storage modes, and stop on a non-zero result.

### P2 — Domain and architecture skills need write guardrails

Files:

- `skills/domain-modeling/SKILL.md:56,76-78`
- `skills/improve-codebase-architecture/SKILL.md:91-92`

Add CLI resolution, root containment, preservation of authored content, indexing where needed, and publication handling after writes.

### P2 — Prototype path wording permits hand resolution

File: `skills/prototype/SKILL.md:40`

Require CLI resolution for filesystem paths and the shared-context link rule for issue links.

### P2 — Setup has a stale storage-change timing rule

File: `skills/setup-matt-pocock-skills/SKILL.md:141`

Run `cli.ts report` again immediately after `init` or `migrate`. Do not wait for a new agent turn as the root-resolution rule.

## Correct or mostly correct uses

The distinction between `ALIGNMENT_ROOT` and `repository-root`, the storage categories, and the path categories in `ALIGNMENT-ROOT.md` remain valid after CLI-first resolution.
