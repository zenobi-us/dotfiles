# Ingest

Pull an external source into shared context so other agents can read it.

## Overview

Nine steps. They take a URL, a ticket key, a file path, or a screenshot and leave a
provenance-stamped Markdown file at a known path, indexed and pushed.

## Steps

1. You **MUST** resolve the root. Run `cli.ts` with no subcommand, with the working
   directory inside the repository you are working on. Read `storage` and `root`.
2. If `storage` is `repository`, you **MUST** stop and tell the user shared storage
   is off for this repository. You **MUST NOT** run `init` to fix it. Ask.
3. You **MUST** identify the work key. Read it from the user's words, the branch
   name, or the worktree name. If no work key applies, the anchor is `library/`.
   If a work key is likely but unstated, ask before you write.
4. You **MUST** run `cli.ts anchor --source <SOURCE> [--key <KEY>]`. Use the printed
   directory as the target. Add `--dry-run` while you are still planning. See
   `references/layout.md` for the source names.
5. You **MUST** check whether the target file already exists. If it does, apply the
   authored-content guard and the refresh rule in `references/layout.md` before you
   overwrite anything.
6. You **MUST** fetch with the tool named in `references/sources.md`. A repository's
   own skill beats the tool named there. Check `.agents/skills/` in the repository
   first.
7. You **MUST** write the file with the full frontmatter contract from
   `references/layout.md`. A file with no frontmatter is not ingested, it is
   litter.
8. You **MUST** run `cli.ts index "<anchor directory>"`.
9. If `storage` is `shared`, you **MUST** publish. Follow `references/publishing.md`
   in the same turn. The branch check there can stop the push. Report it if so.

## Success criteria

- [ ] `cli.ts` reports `storage: shared` and the write is under that `root`.
- [ ] The file sits at the anchor under the name the filename rule chose.
- [ ] The first six frontmatter fields are present and correct.
- [ ] `index.md` lists the file with a working link, and any hand-written text in
      that index survived.
- [ ] A second run of the same request overwrites or skips. It never creates a
      second file.
- [ ] `git -C "$ALIGNMENT_ROOT" status --porcelain` is empty after the push, or you
      reported why you did not push.

## Many sources at once

Ingest them one at a time into the same anchor. Run `index` once at the end, not
once per file. Commit once.

## When not to ingest

- The source is one paragraph the user already pasted. Quote it in the work-key
  note instead.
- The source changes every hour. Record the URL in the note. A stale copy is worse
  than a link.
- The source holds credentials or personal data the user did not ask you to store.
  Stop and ask.
- A file already sits at the target path holding hand-written analysis. Stop and
  ask. See the authored-content guard in `references/layout.md`.
