---
name: shared-context
description: Routes shared engineering context work to the right procedure — report or change where context is stored, pull an external source (Confluence page, Jira issue, web page, PDF, screenshot) into it, and publish the write so other agents see it. Use when the user says shared context, eng-context, alignment root, "save this page", "pull this in", "where does my context live", or when a write must land outside the repository clone.
user-invocable: true
---

# Shared Context

Origin-keyed engineering context. Alignment files and ingested source material live
outside any single repository clone, keyed by the repository's git `origin`.

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

## Step 0: resolve the root. Always.

```bash
cd "<repository being worked on>" && "<skillroot>/scripts/shared-context/cli.ts"
```

You **MUST** run every `cli.ts` call with the working directory inside the
repository you are working on. The CLI reads the origin from the working
directory. Run it from the skill directory and it resolves a different
repository and reports the wrong root.

`<skillroot>` is the directory holding the `SKILL.md` you are reading right now.
Use that copy, not another one on disk — an installed plugin cache can be older
than the source. The path to the CLI repeats the directory name:
`<skillroot>/scripts/shared-context/cli.ts`. That is correct. Do not trim a
segment.

Run the file directly, as shown. Its shebang starts bun through mise and installs
the CLI's own dependencies on first run. You **MUST NOT** prefix the call with
Bun's runner — that skips the shebang, and the call then fails in an installed copy
that has no dependencies.

`report` is the default. `cli.ts` and `cli.ts report` do the same thing. Use
`cli.ts root` when a script needs only the resolved root; do not derive it.
Output:

```
storage: shared | repository
root: <resolved root — use this for every write>
shared root: <equals root in shared mode, equals the repository root otherwise>
shared candidate: <where shared storage would live; printed only in repository mode>
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
cd "<repository being worked on>" && "<skillroot>/scripts/shared-context/cli.ts"
```

Use the CLI output to determine the storage mode. Use its resolved root instead
of deriving a path yourself. The CLI reports the resolved root, storage mode,
origin, and context slug.

### Write rule

When the CLI reports `storage: shared`, write the file under the resolved `root`.
Commit and push every file that you create or update there when the shared store
has a usable git remote. Other agents only see the update after it reaches the
remote. A non-git store is valid local-only storage. Keep the write and report
that it is local.

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

1. You **MUST NOT** run `init` or `migrate` from an implied request. Both mutate
   storage. Run either only when the user names that operation.
2. You **MUST** write under the resolved `root`. You **MUST NOT** mix the
   repository root and the shared root in one task.
3. You **MUST** use `cli.ts path` to get a typed target. Do not join
   root-relative path segments in a skill. For source ingestion, use
   `path source --ticket <ID> --source <SOURCE>` or
   `path source --library --source <SOURCE>`.
4. You **MUST** run `cli.ts index <dir>` after you add or remove a file in a
   source directory.
5. If `storage` is `shared`, you **MUST** read `references/publishing.md` after
   the write. Publish when the store has a usable git remote. A non-git store is
   valid local-only storage: keep the completed write, report that it is local,
   and offer the version-control options in that reference.
6. You **MUST NOT** overwrite a file that holds hand-written work. See the
   authored-content guard in `references/layout.md`.
7. You **MUST** stop and report a non-zero exit status from `cli.ts`. Do not retry
   silently. This rule covers `cli.ts` only. An ordinary shell probe such as `ls`
   exits non-zero for an absent path, which is an answer, not a failure.
