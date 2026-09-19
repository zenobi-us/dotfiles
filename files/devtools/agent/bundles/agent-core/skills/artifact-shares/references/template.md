# The repository template

`assets/repo-template/` is what `create` copies into a new share repository. It
is a working Fumapress site: `mise run build` in a copy of it produces
`dist/public`.

## Layout

```text
press.config.tsx           content source, static mode, MDX components
vite.config.ts             the fumapress plugin, Tailwind, the base path
package.json               dependencies only. No scripts block
bun.lock                   pinned dependencies, used by --frozen-lockfile in CI
mise.toml                  the node, bun, and hk versions
.mise/tasks/               every command this repository has
.mise/tasks/checks/        the checks the hook and both workflows run
hk.pkl                     pre-commit and check hooks
tsconfig.json
.gitleaks.toml             what gitleaks skips
.trufflehogignore          what trufflehog skips
.types                     the share index, empty apart from its header
content/index.mdx          the landing page
content/shares/meta.json   sidebar title for the shares section
public/s/.gitkeep          where a share's own files land
src/app.css                the theme
src/components/            the components the generated MDX names
.github/workflows/deploy.yml
.github/workflows/check.yml
```

## Commands

Every command is a mise file task in `.mise/tasks/`. `package.json` holds no
`scripts` block, so a command is written in exactly one place and the hook, both
workflows, and a person all run the same thing.

| Task | Runs |
|---|---|
| `deps` | `bun install` |
| `dev` | the fumapress dev server |
| `build` | the static build into `dist/public` |
| `start` | serves the built site |
| `checks:types` | `.types` against `content/shares/` and the kind registry |
| `checks:secrets` | trufflehog and gitleaks over the whole repository |
| `checks:metadata` | EXIF and text chunks in published PNG, JPEG, and WebP files |
| `checks:size` | File sizes against GitHub's 50 MiB and 100 MiB limits, and the site against the 1 GB Pages limit |
| `checks:scripts` | fails when `package.json` grows a `scripts` block |
| `checks:typescript` | `tsc --noEmit` |

A task file under `.mise/tasks/checks/` becomes a `checks:<name>` task, so the
directory is the namespace. There is no `scripts/` directory: a check is a task
like any other command.

`deps`, `dev`, `build`, and `start` are one-line bash wrappers.
`.mise/tasks/checks/*.ts` are TypeScript, run by bun through the
`mise exec -- bun run --install=fallback` shebang. Each one resolves the
repository root from its own path, so it gives the same answer wherever it is
started.

`dev`, `build`, and `checks:typescript` declare `depends=["deps"]`, so a fresh
clone needs no separate install step. A task passes `"$@"` through, so
`mise run deps -- --frozen-lockfile` reaches bun.

`mise.toml` pins trufflehog and gitleaks as well as node and bun. A scanner that
changes version between a person and CI gives two answers for the same bytes.

`mise.toml` pins node as well as bun. The fumapress CLI declares
`engines.node >= 24` and runs through its own `#!/usr/bin/env node` shebang, so
the build needs a node that mise controls. bun installs the packages and runs
the checks.

`cli.ts share` runs `checks:types`, `checks:size`, `checks:metadata`, and
`checks:secrets` inside the clone before it commits.
Without mise on PATH that step fails, which is why `cli.ts doctor` checks for it.
It does not run `checks:typescript`, which would install `node_modules` into a
fresh clone in the middle of a share.

## Build then deploy

Nothing is served from a branch. Pages is set to `build_type: workflow`.

`deploy.yml` runs on a push to `main`: install the tools with `jdx/mise-action`,
then `mise run deps -- --frozen-lockfile`, `mise run checks:types`,
`mise run checks:scripts`, `mise run build`, upload `dist/public`, deploy.
`check.yml` runs the same checks plus `mise run checks:typescript` on a pull
request, and deploys nothing.

`hk.pkl` runs `checks:types`, `checks:scripts`, `checks:secrets`,
`checks:metadata`, and `checks:size` on pre-commit. `hk check` runs those plus
`checks:typescript`, and asks trufflehog to verify its findings against each
provider, which needs the network.

`artifact-shares create` runs `hk install`, so the hooks are live in every
repository the skill makes. `artifact-shares share` runs the same checks itself,
so a clone whose hooks were never installed is still covered.

Every action is pinned to a commit SHA. A tag can be moved; a SHA cannot. To
change a version, resolve the new SHA and keep the `# vN` comment beside it:

```bash
gh api repos/actions/checkout/git/ref/tags/v5 --jq '.object.sha'
```

## The base path

GitHub Pages serves the repository at `https://<owner>.github.io/<repo>/`, so
every built URL needs the `/<repo>/` prefix.

`deploy.yml` sets `BASE_PATH` from the repository name. `vite.config.ts` passes
it to the fumapress plugin. Vite republishes the same value as
`import.meta.env.BASE_URL`, and `src/components/base.ts` uses that to resolve
every asset URL at render time.

No file in a share repository names the repository. Generated MDX stores paths
without the prefix, as `s/<hash>/x.png`, so a published share keeps working if
the repository is renamed.

Fumapress rejects a `basePath` that does not end with `/`.

To reproduce the published paths locally:

```bash
BASE_PATH=/my-repo/ mise run build
```

## The theme

`src/app.css` holds every colour, twice:

1. As a Tailwind theme colour, so a component writes `text-ink` or
   `border-border` and never a hex value.
2. As the matching fumadocs `--color-fd-*` variable, so the navbar, sidebar,
   search dialog, and prose take the same theme.

The palette is the zeno theme v1. The dark theme redefines the same variables
under `.dark`, which is the class fumadocs toggles. The overlay palette is fixed
across themes, because a media viewer is dark in both.

You **MUST NOT** write a colour in a component. You **MUST** write every Tailwind
class as a whole literal string; a class built by joining pieces is invisible to
Tailwind and produces no CSS.

## The components

| File | Holds |
|---|---|
| `Viewer.tsx` | The media viewer, and the thumbnail button that opens it |
| `Gallery.tsx` | A thumbnail grid with one viewer, and `Figure` for a single file |
| `FileTree.tsx` | Files grouped by folder, with a filter and one viewer across every group |
| `FileLink.tsx` | The default file row |
| `ShareMeta.tsx` | The header: kind badge, date, hash, link to the original files |
| `media.ts` | Which extensions a browser can render |
| `base.ts` | The base path helper |
| `kinds.ts`, `renderers.ts`, `registry.tsx` | The kind registry. See `types.md` |

`Viewer.tsx` is a React port of the zeno lightbox v2. It keeps that behaviour: a
video opens paused with controls and never autoplays, the arrow keys seek the
video while it has focus, clicking an image toggles 1:1 zoom, Esc closes, and
`FileTree` walks every thumbnail on screen so prev and next cross group
boundaries.

`registry.tsx` lists every component the generated MDX may name. Removing one
breaks every published share that names it. Add, do not remove.

## Change the template

1. Copy it somewhere writable and install:

   ```bash
   cp -r "<skillroot>/assets/repo-template" /tmp/share-template
   cd /tmp/share-template && mise run deps
   ```

2. Make the change.

3. You **MUST** run every check and the build:

   ```bash
   mise run checks:types
   mise run checks:scripts
   mise run checks:typescript
   BASE_PATH=/demo/ mise run build
   ```

4. You **SHOULD** publish a test share into the copy before you trust it. Add a
   `content/shares/<hash>.mdx` with a `.types` line and build again.

5. Copy the result back over `assets/repo-template/`, without `node_modules`,
   `dist`, `.source`, or `src/pages.gen.ts`.

6. You **MUST** run the skill's own tests. One of them reads the template's
   kinds:

   ```bash
   cd "<skillroot>/scripts/artifact-shares" && bun test
   ```

A template change reaches an existing share repository only when a person copies
it there. `create` uses the template once.

## What the checks may touch

A share repository holds two classes of file, and the difference decides what a
tool is allowed to do.

| Class | Path | Rule |
|---|---|---|
| Repository source | `src/`, `.mise/`, `.github/`, `*.pkl`, `*.toml`, `*.tsx` | A tool **MAY** rewrite it |
| Published artifact | `public/s/`, `content/shares/` | A tool **MUST NOT** rewrite it |

The hash is taken from the **source** artifact, not from the copy in
`public/s/`. A formatter that rewrites a published file therefore does not fail
`checks:types`. It silently publishes bytes that differ from the artifact that
was tested, and `<FileTree>` then hands the reader a file nobody checked.

So every check over `public/s/` reports and stops. None of them fixes anything.
The fix is always to change the source artifact and share it again, which gives
a new hash and a new page.

`.gitleaks.toml` and `.trufflehogignore` exclude `.git/`, `node_modules/`,
`dist/`, `.source/`, `bun.lock`, and `src/pages.gen.ts`. You **MUST NOT** add a
path under `public/s/` or `content/shares/` to either file. Those are the
published bytes, and they are the reason the scan exists.

`.git/` is excluded for a reason worth knowing. A loose object outlives the file
it came from: stage a secret once, delete the file, and the blob stays in
`.git/objects`. Without the exclusion the check then fails every later commit
and no working-tree change clears it. The scan guards what gets published.
History is `artifact-shares recreate`, and nothing under `.git/` is ever
deployed.

## Two scanners, on purpose

trufflehog matches known credential shapes per provider. gitleaks matches
regular expressions and entropy. They miss different things: in testing,
trufflehog found a bare AWS key pair that gitleaks passed, and both found a
GitHub token. Running one would have published the other.

## A known wrong URL

On a project Pages site the canonical link, `sitemap.xml`, and `rss.xml` drop the
repository segment. A page served at

```text
https://<owner>.github.io/<repo>/shares/<hash>/
```

declares itself canonical at

```text
https://<owner>.github.io/shares/<hash>/
```

which does not exist. This was measured on a live deploy with
`SITE_BASE_URL=https://<owner>.github.io/<repo>` correctly set by the workflow,
so it is not a configuration mistake. Fumapress resolves a route path against
the **origin** of `site.baseUrl` and discards that URL's own path.

Nothing else is affected. Navigation, assets, and every published page resolve
correctly, because those come from `basePath`, not from `site.baseUrl`.

A user Pages site served at the domain root is not affected at all.

To fix it properly, fumapress has to join the route to the whole base URL. Until
then, do not add a second `baseUrl` guess to `press.config.tsx`: a wrong value
there breaks the pages as well as the metadata.
