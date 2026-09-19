# Artifact share

A private site for published agent artifacts. Built with
[Fumapress](https://press.fumadocs.dev), deployed to GitHub Pages by
`.github/workflows/deploy.yml`.

Created and written to by the `artifact-shares` skill. Read that skill before
you edit anything here by hand.

## Layout

```text
content/index.mdx          the landing page
content/shares/<hash>.mdx  one share, converted to MDX
content/shares/meta.json   sidebar title for the shares section
public/s/<hash>/           the media a share links, copied untouched
.types                     one <hash>=<kind> line per share
.mise/tasks/               every command this repository has
.mise/tasks/checks/        the checks the hook and both workflows run
src/app.css                the theme: colours, fonts, shapes
src/components/kinds.ts    the kinds a share may be
src/components/renderers.ts  which component draws one file row
src/components/registry.tsx  what the generated MDX may name
```

## Commands

Every command is a mise task. `package.json` holds no `scripts` block: the task
files are the one place a command is written, so the pre-commit hook, both
workflows, and a person all run exactly the same thing.

```sh
mise run deps             # bun install
mise run dev              # http://localhost:3000
mise run build            # writes dist/public
mise run start            # serve the built site
mise run checks:types     # .types against content/shares/ and the kind registry
mise run checks:scripts   # package.json must have no scripts block
mise run checks:typescript
mise tasks ls             # list them with their descriptions
```

`dev`, `build`, and `checks:typescript` depend on `deps`, so a fresh clone
needs no separate install step. A task passes `"$@"` through, so
`mise run deps -- --frozen-lockfile` reaches bun.

Every check lives in `.mise/tasks/checks/`. There is no `scripts/` directory:
a check is a task like any other command.

`mise.toml` pins node, bun, and hk. node is pinned because the fumapress CLI
declares `engines.node >= 24` and runs through its own `#!/usr/bin/env node`
shebang. bun installs the packages and runs the validator.

## Base path

GitHub Pages serves this repository at `https://<owner>.github.io/<repo>/`, so
every built URL needs the `/<repo>/` prefix. The deploy workflow sets
`BASE_PATH` from the repository name. No file here names the repository.

Local `mise run dev` and `mise run build` use `/`. To reproduce the published
paths locally:

```sh
BASE_PATH=/my-repo/ mise run build
```

Fumapress rejects a `basePath` that does not end with `/`.

## Adding a kind

1. Add an entry to `shareKinds` in `src/components/kinds.ts`.
2. Add a renderer to `fileRenderers` in `src/components/renderers.ts`, but only
   when the default file row is wrong for that kind.
3. Teach the `share` command the kind. See the skill's `references/types.md`.

`mise run checks:types` fails on a `.types` line whose kind is not in
`kinds.ts`.

## Theme

`src/app.css` holds every colour, twice: once as a Tailwind theme colour, and
once as the matching fumadocs `--color-fd-*` variable. A component writes
`text-ink` or `border-border`, never a hex value. The dark theme redefines the
same variables under `.dark`.

Every Tailwind class in a component is a whole literal string. A class built by
joining pieces is invisible to Tailwind and produces no CSS.
