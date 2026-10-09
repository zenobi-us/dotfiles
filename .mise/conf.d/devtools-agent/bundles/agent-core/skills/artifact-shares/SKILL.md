---
name: artifact-shares
description: Routes artifact publishing to private GitHub repositories, with optional Pages sites — create, share, enable Pages later, list, sync, redact, or rebuild. Use when the user says artifact share, publish a report, share a session, or store an artifact in a private repository. Produces a checked repository change and, when Pages is enabled, a public site URL.
user-invocable: true
---

# Artifact Shares

A share repository stores checked artifacts in GitHub. It can also build a
[Fumapress](https://press.fumadocs.dev) site and deploy it to GitHub Pages. A
repository without Pages has no public page URL.

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
| Enable Pages on a repository-only share | `references/pages.md` |
| Bring a clone up to date | `references/sync.md` |
| Take a published share down | `references/redact.md` |
| Get published bytes off GitHub | `references/recreate.md` |
| Add or change a share kind | `references/types.md` |
| Change what a new repository is built from | `references/template.md` |

## Commands

```bash
cli.ts create <name>                   # new private repository and site
cli.ts create <name> --no-pages        # private repository without Pages
cli.ts create <name> --public          # a public one, the only kind a free plan serves
cli.ts pages enable <name> --confirm <name>  # publish existing shares on Pages
cli.ts share <kind> <path>             # publish one artifact
cli.ts share <kind> <path> --dry-run   # build and check it, publish nothing
cli.ts redact <hash>                   # take one published share down
cli.ts recreate <name>                 # delete the repository, rebuild it cleaned
cli.ts list                            # what this machine knows
cli.ts sync <name>                     # pull a clone
cli.ts doctor                          # check prerequisites
cli.ts check                           # run a repository's own checks
cli.ts self-test                       # check the helpers
cli.ts --help
```
`create`, `share`, `redact`, `recreate`, `sync`, and `pages enable` change
remote state. `doctor`, `check`, `self-test`, `--help`, and `share --dry-run`
do not.

## Before the first repository: check the plan

GitHub serves Pages from a **private** repository only on a paid plan. On a free
account or a free organisation, create a private repository with `--no-pages`,
or ask the user whether to upgrade or make the repository public.

```bash
gh api orgs/<owner> --jq .plan.name
```

Making the repository public lets anyone read every share in it. You **MUST
NOT** pass `--public` on your own. Ask.

## Rules that override convenience

1. You **MUST NOT** run `create`, `share`, `redact`, `recreate`, or `pages enable`
   from an implied request. These commands change remote state. Run them only
   when the user names the operation.
2. You **MUST** run `share --dry-run` first, and read its page, before you
   publish content that you have not published before. The dry run stages the
   page in a temporary directory, runs every check, and touches neither the
   clone nor GitHub.
3. Before enabling Pages or sharing to a Pages-enabled repository, tell the
   user that its site is public unless the account has GitHub Pages access
   control. That feature requires GitHub Enterprise Cloud.
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

The order is always the same: rotate the credential first, then remove the
share, then decide whether the history has to go as well. Rotation is the fix.
Everything the CLI does after that is cleanup.

## What a share looks like when it lands

```text
content/shares/<hash>.mdx   the page: frontmatter, <ShareMeta>, the prose, <FileTree>
public/s/<hash>/            the artifact's own files, byte for byte
.types                      one new line: <hash>=<kind>
```

The hash is the first 12 hex characters of the SHA-256 of the artifact. The same
bytes give the same hash, so re-sharing an unchanged artifact does not add a
second copy. The CLI returns its URL when Pages is enabled, or `url: null`
without Pages.

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
