---
name: shared-context
description: Routes shared engineering context work to the right procedure — report or change where context is stored, pull an external source (Confluence page, Jira issue, web page, PDF, screenshot) into it, and publish the write so other agents see it. Use when the user says shared context, eng-context, alignment root, "save this page", "pull this in", "where does my context live", or when a write must land outside the repository clone.
---

# Shared Context

Origin-keyed engineering context. Alignment files and ingested source material live
outside any single repository clone, keyed by the repository's git `origin`.

## Step 0: resolve the root. Always.

```bash
cd "<repository being worked on>" && bun run "<skillroot>/scripts/shared-context/cli.ts"
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

`report` is the default. `cli.ts` and `cli.ts report` do the same thing. Output:

```
storage: shared | repository
root: <ALIGNMENT_ROOT — use this for every write>
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

## Rules that override convenience

1. You **MUST NOT** run `init` or `migrate` from an implied request. Both mutate
   storage. Run either only when the user names that operation.
2. You **MUST** write under the resolved `root`. You **MUST NOT** mix the
   repository root and the shared root in one task.
3. You **MUST** use `cli.ts anchor` to get a target directory. Do not build the
   path by hand. Add `--dry-run` when you are planning and must not create
   anything.
4. You **MUST** run `cli.ts index <dir>` after you add or remove a file in a
   source directory.
5. If `storage` is `shared`, you **MUST** commit and push the write in the same
   turn. Read `references/publishing.md` first — the branch check there can stop
   the push.
6. You **MUST NOT** overwrite a file that holds hand-written work. See the
   authored-content guard in `references/layout.md`.
7. You **MUST** stop and report a non-zero exit status from `cli.ts`. Do not retry
   silently. This rule covers `cli.ts` only. An ordinary shell probe such as `ls`
   exits non-zero for an absent path, which is an answer, not a failure.
