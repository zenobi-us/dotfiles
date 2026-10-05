---
name: shared-context
description: Routes shared engineering context work to the right procedure — report or change where context is stored, pull an external source (Confluence page, Jira issue, web page, PDF, screenshot) into it, and publish the write so other agents see it. Use when the user says shared context, eng-context, alignment root, "save this page", "pull this in", "where does my context live", or when a write must land outside the repository clone.
user-invocable: true
---

# Shared Context

Origin-keyed engineering context. Each file-backed record uses its configured
repository or shared store. The repository's Git `origin` identifies shared context.

## Markdown access policy

Use `agent-core:mq-query` for every agent operation that searches, reads, filters,
selects, lists, summarises, or validates local Markdown content. Load its matching
task reference and the required upstream reference first. Use explicit input and
output formats.

Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell globs, or ad hoc Markdown
parsers to locate or inspect local Markdown. A known path may be passed to
`mq`, but `mq` remains the content-reading interface. This policy applies to
alignment files, ingested files, indexes, and local ticket files. It does not
change the implementation of the shared-context CLI itself.

## The shared-context CLI

it is a TypeScript script that runs in Bun. It resolves the alignment root, the
shared-context store, and the repository store. It reports the route table and
alignment root, and it resolves a record to its store, path, and stable reference.

When running it, use the absolute path to the entry point. Do not `cd` to the skill directory.

Most harnesses will tell you the absolute path to the skill file. Use that to construct the 
absolute path to the entry point. For example, if the harness shows:

```text
files/devtools/agent/bundles/agent-core/skills/shared-context/SKILL.md
```

Then the absolute path to the entry point is:

```text
files/devtools/agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts
```

You **MUST** use that absolute path to run the CLI. Do not `cd` to the skill directory and run it with a relative path.


## Step 0: resolve the root. Always.

`./scripts/shared-context/cli.ts`

Every shown command **MUST** set or preserve the working directory inside the
repository being worked on because the CLI reads the origin from that working
directory. Invoking the entry point by its path does not change the working
directory. Do not `cd` to the skill directory: that resolves a different
repository and reports the wrong root.

Run `./scripts/shared-context/cli.ts` directly. Its shebang starts Bun through mise and installs the
CLI's own dependencies on first run. You **MUST NOT** prefix the call with Bun's
runner because that skips the entry point's shebang.


`report` is the default. It prints the route table and alignment root. Use
`./scripts/shared-context/cli.ts resolve <kind> ... --json` to resolve a record.
Use `./scripts/shared-context/cli.ts root` only when a script needs the alignment
root.

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

## Router

| You want to | Read |
|---|---|
| See or change where context is stored | `references/storage.md` |
| Know where a file goes and what it is named | `references/layout.md` |
| Pull an external source into context | `references/ingest.md` |
| Fetch one specific source type | `references/sources.md` |
| Make a write visible to other agents | `references/publishing.md` |

## Shared-context writes and links

Run the shared-context CLI before you choose a path or link:

```bash
./scripts/shared-context/cli.ts
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
7. You **MUST** stop and report a non-zero exit status from `shared-context`.
   Do not retry silently. This rule covers `shared-context` only. An ordinary
   shell probe such as `ls` exits non-zero for an absent path, which is an
   answer, not a failure.
8. If there exists `<shared-agent-context />` block in the system prompt, then you don't need to run the shared-context cli to get a report.
