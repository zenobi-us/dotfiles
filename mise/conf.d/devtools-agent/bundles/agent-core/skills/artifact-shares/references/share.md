# Share an artifact

Convert one artifact to MDX, copy its files, and push. When Pages is enabled,
the deploy workflow publishes the page. Otherwise, the share stays in the
repository and the command returns no page URL.

## Before you start

The command pushes to GitHub. Run it only when the user names the operation.

You **MUST** dry run it first, and read the page it writes. Publishing
distributes the content. A screenshot carries as much as a paragraph does.

```bash
cli.ts share <kind> <path> --dry-run
```

The dry run builds the real page in a temporary directory, runs every check on
it, and touches neither the clone nor GitHub. Read the `page` path it prints.
That file is what a reader gets, which is a better thing to check than the
source artifact.

The checks find credentials and image metadata. They do not find customer data,
an internal hostname, or an unreleased product name. Those are still yours to
see.

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

4. You **MUST** report the result. With Pages enabled, report the printed `url`;
   the page resolves after the deploy workflow finishes. In repository-only mode,
   report `url: null` and `repositoryPath`.

   To enable Pages later, read `references/pages.md` first. Enabling it can
   publish every existing share.

## Flags

| Flag | Effect |
|---|---|
| `--into <name>` | Which share repository to publish into |
| `--title <text>` | Page title. Defaults to the artifact's `<title>`, then its `<h1>`, then its file name |
| `--date <YYYY-MM-DD>` | Share date. Defaults to today, local time |
| `--description <text>` | One-line summary for the sidebar |
| `--dry-run` | Build and check the page in a temporary directory. Writes nothing, pushes nothing |
| `--allow-metadata` | Publish images that carry embedded metadata |
| `--allow-large` | Publish a file over 50 MiB |

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

New v2 metadata quotes the hash as a YAML string. Historical unversioned and
v1 pages keep their original bytes: readers recover plain 12-character lowercase
hexadecimal hash text, including leading zeros and exponent-shaped hashes such
as `123456789e12` and `42226e907802`. Explicit v2 metadata requires a string; unknown
versions and malformed hashes are rejected.

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
| `secrets check: ...` | trufflehog or gitleaks found a credential | Stop. Read `references/redact.md`. There is no override |
| `metadata check: ...` | A published image carries EXIF or text chunks | Strip it in the source artifact and share again |
| `size check: ...` | A file is over 50 MiB, or the site is over 1 GB | Shrink the artifact, or agree `--allow-large` with the user |

The validator runs before the commit, so a broken share never reaches the deploy
workflow.

## The checks

Four tasks run before the commit, in this order. Each one lives in the
repository, so a repository that adds a check gets it here with no change to the
CLI.

| Task | Fails when |
|---|---|
| `checks:types` | `.types`, `content/shares/`, and the kind registry disagree |
| `checks:size` | A file is over 50 MiB, or the published site is over 1 GB |
| `checks:metadata` | A published PNG, JPEG, or WebP carries EXIF or text chunks |
| `checks:secrets` | trufflehog or gitleaks finds a credential anywhere in the repository |

`checks:secrets` scans the whole repository, not only the new share. An old
share that leaks stops a new one. That is deliberate: a scan that skipped old
shares would report a repository clean when it is not.

When a check fails, the three files `share` just wrote are removed again and
nothing is pushed. The clone is left exactly as it was.

### Two overrides, and when they are allowed

| Flag | Gets past |
|---|---|
| `--allow-metadata` | `checks:metadata` |
| `--allow-large` | `checks:size`, up to the 100 MiB GitHub blocks outright |

You **MUST NOT** pass either without telling the user what the check reported
and getting an answer. There is no override for `checks:secrets`.

The better fix for a metadata finding is to strip the metadata in the source
artifact and share it again. Different bytes give a different hash, so the
result is a new page and the original stays untouched.

## When a check finds a credential

Stop. Do not retry, and do not look for a flag.

1. Rotate the credential.
2. If the share never reached GitHub, the rollback already removed it. Fix the
   source artifact and share again.
3. If it did reach GitHub, read `references/redact.md`.


## Upgrade an existing repository

Before generating v2 metadata, run the local preview:

```bash
cli.ts upgrade work-shares --dry-run
cli.ts upgrade work-shares --confirm work-shares
```

The command updates only `.mise/tasks/checks/types.ts`, `src/share-metadata.ts`,
and the owned schema/docs block plus one import in `press.config.tsx`. It
recognizes the frozen base template and the declared earlier consumer code from
installed `assets/consumer-history.json`. It does not fetch, commit, push,
change visibility, or enable Pages. Review and commit the local changes before
publishing. Run `share --dry-run` again and read its page.

The kind registry, component registry, authored content, assets, site settings,
workflow files, hook files, tool pins, scanner configuration and other checks
keep their bytes. The existing four publication checks must pass. If a check
fails, the command restores every changed consumer file. Repeating an applied
upgrade is a no-op. Read-only commands and historical retrieval never upgrade
consumer code. New generation refuses outdated consumers before staging v2.

Customized owned checker/helper code, unknown schema/docs blocks, ambiguous
imports and symlink targets require manual review. The command refuses these
without writing. It does not replace customized files or offer a force flag.
Port the consumer changes through a separate reviewed source change, retain all
required checks, and use the real site build and repository checks to verify it.

The MDX loader validates every required owned field through the same interpreter as
the CLI and repository checker, without coercing owned wire types. This applies to
`content/shares/` pages only; ordinary content pages keep the normal page schema.
Historical unversioned and v1 hashes retain leading zeros and exponent-shaped
text. Numeric v2, malformed hashes, missing fields and unknown explicit versions
fail. The loader never rewrites stored pages.

The installed replacement allowlist declares
`schemaVersion: artifact-share-consumer-history/v1`. Its authoritative definition
is `references/contracts/consumer-history-v1.json`. The owner produces and accepts
v1. It also accepts exactly one historical unversioned shape: the complete v1
structure without `schemaVersion`. This is read-only interpretation, not an
automatic asset conversion. Original file strings and commit pins remain evidence.
The optional `reviewed` snapshot retains the last released consumers.

Before either upgrade preview or confirmed replacement, the owner validates the
identity, repository reference, commit pins, required snapshots and exact file
maps. Unknown explicit identities, duplicate keys, missing evidence, unknown
fields and malformed values reject without changing clone or asset bytes.

## Publication metadata contracts

New generated pages declare `schemaVersion: artifact-share-metadata/v2` in their owned YAML frontmatter. The CLI and template readers also accept explicit v1 and supported unversioned historical frontmatter. They reject unknown explicit identifiers. The kind and hash must agree with `.types`; existing-page retrieval validates this agreement before returning `unchanged`. Historical reads preserve the page body, authored metadata and original asset bytes.

The `.types` wire format remains `artifact-share-index/v1`: comments, blank lines and `<hash>=<kind>` entries. It gets no version header. Package manifests, MDX syntax, GitHub responses and Pages formats keep their external contracts. New template checks consume both supported frontmatter versions. Existing clones require the explicit consumer upgrade above before generating v2 pages. A fetch or pull does not install consumers.

No published-page upgrade is declared. Do not rewrite published history to add an identifier. Use historical readers. A valid contract does not authorize sharing, make a private repository public, enable Pages, or establish successful publication. Keep every dry-run, credential, metadata and Pages approval rule above.



## Historical retrieval regression checks

Use a 30-second deadline for the historical retrieval integration test, as for
nearby owning-command tests. Keep its fixture outside the shared `afterEach`
registry. Remove it in the test body’s `finally` block after all commands and
byte-preservation assertions settle. A runner timeout must not remove files
while the asynchronous test body still uses them.

