# Share an artifact

Convert one artifact to MDX, copy its files, and push. The deploy workflow builds
and publishes the page.

## Before you start

The command pushes to GitHub. Run it only when the user names the operation.

You **MUST** read the artifact first. Publishing distributes the content. Check
it for credentials, tokens, customer data, and internal detail the reader must
not have. A screenshot carries as much as a paragraph does.

## Steps

1. You **MUST** know which share to publish into:

   ```bash
   cli.ts list
   ```

   One configured share is the default. Two or more make `--into` compulsory.

2. You **MUST** pick a kind the site knows. To see them, read
   `src/components/kinds.ts` in the clone, or run the command and read the error:
   it lists every kind. The template ships `session`, `doc`, and `artifact`. To
   add one, read `references/types.md`.

3. You **MUST** run the command:

   ```bash
   cli.ts share <kind> <path>
   cli.ts share session ./export.html --title "Bank accounts dirty state"
   cli.ts share doc ./notes.md --into work-shares
   cli.ts share artifact ./report-dir --date 2026-09-01 --description "PR 6906 evidence"
   ```

4. You **MUST** report the printed `url` to the user. The page 404s until the
   deploy workflow finishes:

   ```bash
   gh run watch --repo <owner>/<name>
   ```

## Flags

| Flag | Effect |
|---|---|
| `--into <name>` | Which share repository to publish into |
| `--title <text>` | Page title. Defaults to the artifact's `<title>`, then its `<h1>`, then its file name |
| `--date <YYYY-MM-DD>` | Share date. Defaults to today, local time |
| `--description <text>` | One-line summary for the sidebar |

## What happens to the artifact

| Input | Result |
|---|---|
| A directory | Every file is copied to `public/s/<hash>/`. `index.html`, or the only `.html` file, becomes the page |
| One `.html` file | The file is copied, then every local image and video it names, resolved against its own directory |
| One `.md` or `.mdx` file | The body is kept as written. Its own frontmatter is dropped, because `share` writes new frontmatter |
| Anything else | The file is copied and the page is the header plus the file list |

An `src` that climbs out of the artifact's own directory is skipped, not
followed. Following it would publish an unrelated file.

## What the conversion keeps and loses

Kept: headings, paragraphs, lists, tables, code blocks, links, images, video.

Lost: the artifact's own CSS, its own scripts, and any markup with no Markdown
equivalent. A report that depends on its own JavaScript does not behave the same
way on the published page.

The untouched files stay at `public/s/<hash>/`, and `<FileTree>` at the foot of
every page links them. A reader who needs the original opens it from there.

MDX reads `{` as an expression and `<` as a tag. Both are escaped everywhere
except inside code, where MDX already treats them as text.

## The hash

The hash is the first 12 hex characters of the SHA-256 of the artifact. A
directory hashes over its sorted relative paths and their contents.

The same bytes give the same hash. Re-sharing an unchanged artifact prints the
existing URL and changes nothing:

```json
{ "hash": "c4ca92a7473c", "kind": "session", "url": "...", "unchanged": true }
```

To publish a changed artifact, change the artifact. A new hash makes a new page;
the old page stays where it is, because a published URL must keep working.

## Failure modes

| Message | Cause | Fix |
|---|---|---|
| `Several shares are configured` | More than one share exists | Pass `--into <name>` |
| `Unknown kind: <k>` | The kind is not in the site's registry | Pick a listed kind, or read `references/types.md` |
| `Not an artifact share repository` | The clone is not built from the template | Check the path in `list` |
| `types validation: ...` | `.types`, `content/shares/`, and the kinds disagree | Do not push. Read the message; it names the file and line |

The validator runs before the commit, so a broken share never reaches the deploy
workflow.
