---
name: artifact-shares
description: Routes private artifact publishing to the right procedure — create a private share repository, publish an artifact into one, list the share repositories this machine knows, and sync a clone from its remote. Use when the user says artifact share, private share, "publish this report", "share this session", "put this on a private page", or when a report, session export, or document must reach a URL someone else can open.
user-invocable: true
---

# Artifact Shares

A share repository is a private GitHub repository that builds a
[Fumapress](https://press.fumadocs.dev) site and deploys it to GitHub Pages. One
artifact becomes one page.

## Step 0: find out what exists. Always.

```bash
"<skillroot>/scripts/artifact-shares/cli.ts" list
```

`<skillroot>` is the directory holding the `SKILL.md` you are reading now. Use
that copy, not another one on disk — an installed plugin cache can be older than
the source.

Run the file directly, as shown. Its shebang starts bun through mise and
installs the CLI's own dependencies on first run. You **MUST NOT** prefix the
call with Bun's runner. That skips the shebang, and the call then fails in an
installed copy that has no dependencies.

## Router

| You want to | Read |
|---|---|
| Make a new private share repository | `references/create.md` |
| Publish an artifact into one | `references/share.md` |
| See the share repositories on this machine | `references/list.md` |
| Bring a clone up to date | `references/sync.md` |
| Add or change a share kind | `references/types.md` |
| Change what a new repository is built from | `references/template.md` |

## Commands

```bash
cli.ts create <name>               # new private repository and site
cli.ts share <kind> <path>         # publish one artifact
cli.ts list                        # what this machine knows
cli.ts sync <name>                 # pull a clone
cli.ts doctor                      # check prerequisites
cli.ts check                       # run a repository's own checks:types task
cli.ts self-test                   # check the helpers
cli.ts --help
```

`create`, `share`, and `sync` change remote state. `doctor`, `check`,
`self-test`, and `--help` do not.

## Rules that override convenience

1. You **MUST NOT** run `create` or `share` from an implied request. Both push
   to GitHub. Run either only when the user names the operation.
2. You **MUST** read the artifact before you share it. Publishing distributes
   the content. Check it for credentials, customer data, and internal detail the
   reader must not have.
3. You **MUST** tell the user that a private repository still serves its Pages
   site publicly, unless the account has GitHub Pages access control. That is a
   GitHub Enterprise Cloud feature. `create` prints the same warning.
4. You **MUST NOT** edit `.types`, `content/shares/`, or `public/s/` by hand.
   `share` writes all three together, and the repository's own validator fails
   when they disagree.
5. You **MUST** pass `--into <name>` when `list` shows more than one share. The
   CLI refuses to guess, because a wrong guess publishes to the wrong site.
6. You **MUST** stop and report a non-zero exit status from `cli.ts`. Do not
   retry silently.
7. You **SHOULD** use `--title` when the artifact has no `<title>` or `<h1>`.
   The fallback title is the file name, which reads badly in a sidebar.

## What a share looks like when it lands

```text
content/shares/<hash>.mdx   the page: frontmatter, <ShareMeta>, the prose, <FileTree>
public/s/<hash>/            the artifact's own files, byte for byte
.types                      one new line: <hash>=<kind>
```

The hash is the first 12 hex characters of the SHA-256 of the artifact. The same
bytes give the same hash, so re-sharing an unchanged artifact prints the existing
URL instead of publishing a second copy.
