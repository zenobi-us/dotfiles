# Ingest

Pull an external source into shared context so other agents can read it.

## Overview

Nine steps. They take a URL, a ticket key, a file path, or a screenshot and leave a
provenance-stamped Markdown file at a known path, indexed and pushed when the
resolved storage has a usable remote.

## Steps

1. You **MUST** resolve the root. Run `shared-context` with no subcommand, with the working
   directory inside the repository you are working on. Read `storage` and `root`.
2. Use the `root` printed by the CLI as the only write target. Repository storage
   is valid repository-local context; shared storage is valid external context.
   Do not run `init` unless the user explicitly asks to change storage.
3. You **MUST** identify the ticket ID. Read it from the user's words, the branch
   name, or the worktree name. If no ticket applies, select the library source
   area. If a ticket is likely but unstated, ask before you write.
4. You **MUST** run one typed path command. Use its printed directory as the
   target:
   - `shared-context path source --ticket <ID> --source <SOURCE>`
   - `shared-context path source --library --source <SOURCE>`
   See `references/layout.md` for the source names.
5. You **MUST** check whether the target file already exists. If it does, apply the
   authored-content guard and the refresh rule in `references/layout.md` before you
   overwrite anything.
6. You **MUST** fetch with the tool named in `references/sources.md`. A repository's
   own skill beats the tool named there. Check `.agents/skills/` in the repository
   first.
7. You **MUST** write the file with the full frontmatter contract from
   `references/layout.md`. A file with no frontmatter is not ingested, it is
   litter.
8. You **MUST** run `shared-context index "<source directory>"`.
9. If `storage` is `shared`, you **MUST** publish. Follow `references/publishing.md`
   in the same turn. The branch check there can stop the push. Report it if so.

## Success criteria

- [ ] `shared-context` reports the active storage and the write is under its `root`.
- [ ] The file sits in the typed source directory under the name the filename rule chose.
- [ ] The first six frontmatter fields are present and correct.
- [ ] `index.md` lists the file with a working link, and any hand-written text in
      that index survived.
- [ ] A second run of the same request overwrites or skips. It never creates a
      second file.
- [ ] The resolved root is clean after a successful push, or you reported why you
      did not push. Use the CLI's root/report output; do not derive the root separately.

## Many sources at once

Ingest them one at a time into the same source directory. Run `index` once at the
end, not once per file. Commit once.

## When not to ingest

- The source is one paragraph the user already pasted. Quote it in the ticket
  note instead.
- The source changes every hour. Record the URL in the note. A stale copy is worse
  than a link.
- The source holds credentials or personal data the user did not ask you to store.
  Stop and ask.
- A file already sits at the target path holding hand-written analysis. Stop and
  ask. See the authored-content guard in `references/layout.md`.
