---
name: shared-context
description: The shared-context skill resolves the alignment root, the shared-context store,
  and the store for tickets, evidence and worktree logs. It reports the route table and alignment root, and it
  resolves a record to its store, path, and stable reference.
---

# Shared Context

Origin-keyed engineering context. Each file-backed record uses its configured
repository or shared store. The repository's Git `origin` identifies shared context.

## Markdown access policy

Use `mq-query` skill for every agent operation that searches, reads, filters,
selects, lists, summarises, or validates local Markdown content. Load its matching
task reference and the required upstream reference first. Use explicit input and
output formats.

Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown
parsers to locate or inspect local Markdown. A known path may be passed to
`mq`, but `mq` remains the content-reading interface. This policy applies to
alignment files, ingested files, indexes, and local ticket files. It does not
change the implementation of the shared-context CLI itself.

## Step 0: resolve the root. Always.

Resolve the installed shared-context skill directory (the directory containing
this `SKILL.md`) and set `SHARED_CONTEXT_SKILL_ROOT` to its absolute path.
The CLI is inside the skill, not the repository. Run it by absolute path from
the project root:

```bash
"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts"
```

Its shebang starts Bun through mise and installs the CLI's own dependencies on first run.
You **MUST NOT** prefix the call with Bun's runner (or any other runner) because that skips the entry point's shebang.

`report` is the default. Use
`"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve <kind> ... --json`
to resolve a record. Use
`"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" root` only when a
script needs the alignment root.

```text
mode: shared | repository | mixed
root: <alignment root>
alignment: shared | repository
tickets: <tracker adapter or local store>
initiatives: shared | repository
workflows: shared | repository
evidence: workflows -> <store>, or <store>
sources: alignment -> <store>, or <store>
origin: <git origin>
slug: <origin-derived directory name>
```

## Recovery boundary

A typed `resolve workflow` result identifies a location, not an existing workflow, valid receipt chain, running phase, or completed implementation. Resolve and inspect existing records without creating directories during read-only recovery. Evidence has its own route and publication rules; evidence runs are not phase receipts and do not establish workflow progress. The worktree skill owns recovery decisions and append-only workflow provenance. Never run `init` or `migrate` as an implied recovery step; both require an explicit request naming that storage operation.

## Router

| You want to                                 | Read                       |
| ------------------------------------------- | -------------------------- |
| See or change where context is stored       | `references/storage.md`    |
| Know where a file goes and what it is named | `references/layout.md`     |
| Pull an external source into context        | `references/ingest.md`     |
| Fetch one specific source type              | `references/sources.md`    |
| Make a write visible to other agents        | `references/publishing.md` |

## Shared-context writes and links

Run the shared-context CLI before you choose a path or link, using the absolute
skill-relative path established in Step 0:

```bash
"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts"
```

Use `resolve <kind>` for the record you will read or write. Its structured
result names the adapter, store, root, path, stable reference, and publication
rule. Do not infer a store from `mode` or join paths under `root`.

For an external ticket, use the ticket skill. `shared-context` resolves only
file-backed records. A file-backed record can use the repository or the
origin-keyed shared store.

### Write rule

When a record resolves to `store: shared`, write to its resolved path. Read
`references/publishing.md` and publish when the store has a usable git remote.
A non-git store is valid local-only storage. Keep the write and report that it
is local.

### Link rule

Use a public URL only when the shared-context store is a public git repository
and the destination has the same public access boundary. Build the URL only
after you commit and push the file. Include the context slug in the path.

For a shared-context store with no git repository, no usable remote, or a private
GitHub repository whose destination is not related to the shared-context store,
write the reference as:

```text
SharedContext/<path relative to the shared-context root>
```

If you cannot determine whether the shared-context store and the destination
have the same access boundary, ask the user before you choose a URL or path.
Never use a public URL for a private or uncertain boundary.

For a file in the repository being changed, use a path relative to that
repository root.


## CLI usage errors

If a CLI command fails because its arguments or usage are incorrect, read its
`--help` output, correct the command, and try again. Do not report the error as
a blocker before checking the documented usage. For other non-zero exit
statuses, follow Rule 7.

## Rules that override convenience

0. You **MUST** Always use the absolute path to the CLI entry point. Do not `cd` to the skill directory.
1. You **MUST NOT** run `init` or `migrate` from an implied request. Both
   mutate storage. Run either only when the user names that operation.
2. You **MUST** resolve each record kind before choosing a path. Do not infer a
   store from the report mode or mix a resolved path with a different root.
3. You **MUST** use `shared-context resolve` to get a typed target. Do not join
   root-relative path segments in a skill. For source ingestion, use
   `resolve source --ticket <ID> --source <SOURCE>` or
   `resolve source --library --source <SOURCE>`.
4. Run `shared-context index <dir> --kind source --source <SOURCE>` after you
   add or remove a file in a source directory. Include `--ticket <ID>` or
   `--library` to select the source record.
5. For each record resolved to `store: shared`, you **MUST** read
   `references/publishing.md` after the write. Publish when that store has a
   usable git remote. A non-git store is valid local-only storage.
6. You **MUST NOT** overwrite a file that holds hand-written work. See the
   authored-content guard in `references/layout.md`.
7. You **MUST** stop and report a non-zero exit status from `shared-context`,
   except for an incorrect-arguments or usage error. For that error, read
   `shared-context --help`, correct the command, and try again. Do not retry
   other failures silently. This rule covers `shared-context` only. An ordinary
   shell probe such as `ls` exits non-zero for an absent path, which is an
   answer, not a failure.
8. If there exists `<shared-agent-context />` block in the system prompt, then you don't need to run the shared-context cli to get a report.


## Collection roots and layout

Use `resolve tracker --json`, `resolve tickets --json`, `resolve initiatives --json`,
or `resolve sources --json` to get exact collection directories. Do not append
`tracker` or `sources` to a resolved store. Optional
`docs/agents/context-layout.toml` in the active alignment root overrides tracker
and source base directories; store routes remain independent. Local tracker
frontmatter `issue-root` and `initiative-root` override their collection paths.
See `references/layout.md` for schema, defaults, and validation rules.
