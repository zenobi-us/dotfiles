---
name: artifact-shares
description: Routes private artifact publishing to the right procedure — create a private share repository, publish an artifact into one, list the share repositories this machine knows, sync a clone from its remote, take a published share down, and rebuild a repository whose history must go. Use when the user says artifact share, private share, "publish this report", "share this session", "put this on a private page", or when a report, session export, or document must reach a URL someone else can open.
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
| See what a share would look like, before publishing | `references/share.md` |
| See the share repositories on this machine | `references/list.md` |
| Bring a clone up to date | `references/sync.md` |
| Take a published share down | `references/redact.md` |
| Get published bytes off GitHub | `references/recreate.md` |
| Add or change a share kind | `references/types.md` |
| Change what a new repository is built from | `references/template.md` |

## Commands

```bash
cli.ts create <name>               # new private repository and site
cli.ts create <name> --public      # a public one, the only kind a free plan serves
cli.ts share <kind> <path>         # publish one artifact
cli.ts share <kind> <path> --dry-run   # build and check it, publish nothing
cli.ts redact <hash>               # take one published share down
cli.ts recreate <name>             # delete the repository, rebuild it cleaned
cli.ts list                        # what this machine knows
cli.ts sync <name>                 # pull a clone
cli.ts doctor                      # check prerequisites
cli.ts check                       # run a repository's own checks
cli.ts self-test                   # check the helpers
cli.ts --help
```

`create`, `share`, `redact`, `recreate`, and `sync` change remote state.
`doctor`, `check`, `self-test`, `--help`, and `share --dry-run` do not.

## Before the first repository: check the plan

GitHub serves Pages from a **private** repository only on a paid plan. On a free
account or a free organisation, `create` makes the repository and then reports
that the site cannot exist.

```bash
gh api orgs/<owner> --jq .plan.name
```

A free plan leaves two choices, and both are the user's: upgrade the account, or
`create <name> --public` and accept that anyone can read every share in it.

You **MUST NOT** pass `--public` on your own. Ask.

## Rules that override convenience

1. You **MUST NOT** run `create`, `share`, `redact`, or `recreate` from an
   implied request. All four push to GitHub. Run one only when the user names
   the operation.
2. You **MUST** run `share --dry-run` first, and read the page it writes, before
   you publish anything you have not published before. Publishing distributes
   the content. The dry run stages the real page in a temporary directory, runs
   every check on it, and touches neither the clone nor GitHub.
3. You **MUST** tell the user that a private repository still serves its Pages
   site publicly, unless the account has GitHub Pages access control. That is a
   GitHub Enterprise Cloud feature. `create` prints the same warning.
4. You **MUST NOT** edit `.types`, `content/shares/`, or `public/s/` by hand.
   `share` and `redact` write all three together, and the repository's own
   validator fails when they disagree.
5. You **MUST** pass `--into <name>` when `list` shows more than one share. The
   CLI refuses to guess, because a wrong guess publishes to the wrong site.
6. You **MUST** stop and report a non-zero exit status from `cli.ts`. Do not
   retry silently. A failed check has already taken back what it wrote.
7. You **SHOULD** use `--title` when the artifact has no `<title>` or `<h1>`.
   The fallback title is the file name, which reads badly in a sidebar.
8. You **MUST NOT** pass `--allow-metadata` or `--allow-large` without telling
   the user what the check found and getting an answer.

## When a check finds a credential

Do not retry. Do not pass a flag to get past it. Read `references/redact.md`.

The order is always the same: rotate the credential first, then take the page
down, then decide whether the history has to go as well. Rotation is the fix.
Everything the CLI does after that is cleanup.

## What a share looks like when it lands

```text
content/shares/<hash>.mdx   the page: frontmatter, <ShareMeta>, the prose, <FileTree>
public/s/<hash>/            the artifact's own files, byte for byte
.types                      one new line: <hash>=<kind>
```

The hash is the first 12 hex characters of the SHA-256 of the artifact. The same
bytes give the same hash, so re-sharing an unchanged artifact prints the existing
URL instead of publishing a second copy.

## The checks that guard a push

`share`, `redact`, `check`, the pre-commit hook, and both workflows run the same
four tasks from the repository itself.

| Task | Fails when |
|---|---|
| `checks:types` | `.types`, `content/shares/`, and the kind registry disagree |
| `checks:size` | A file is over 50 MiB, or the site is over 1 GB |
| `checks:metadata` | A published PNG, JPEG, or WebP carries EXIF or text chunks |
| `checks:secrets` | trufflehog or gitleaks finds a credential anywhere in the repository |

`checks:secrets` scans the whole repository every run, not only the new share. A
scan that skipped old shares would report a repository clean when it is not.
