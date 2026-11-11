# Website

A static TanStack Start site, published to GitHub Pages. Content lives in `content/` as Markdown and YAML.

## Components and props

- Receive component props as one `props` object. Read values as `props.name`. Do not destructure props in the parameter list or in the body. The oxlint rule `local/no-props-destructuring` enforces this; its source is `lint/no-props-destructuring.ts`.
- Build related UI parts as compound components, such as `DocSection.Root`, `DocSection.Heading` and `DocSection.Content`. Export the root with its parts: `Object.assign(Root, { Root, ... })`.
- Give each component its own folder under `src/components/`. Keep its hooks in that folder, named after the component, such as `useDocSection`.

## Agent bundle pages

- `/bundles` and `/bundles/<bundle>` read skills, agents, hooks and manifests from `mise/conf.d/devtools-agent/bundles/` at build time. Do not copy that data into `content/`.
- Hand-written bundle text lives in `content/bundles/<bundle>/NN-*.md`, with `kind: tutorial` or `explanation`.
- A how-to guide lives next to its skill's `SKILL.md`, as `how-to-*.md` with a `title` in its frontmatter. Each skill with guides has a page at `/bundles/<bundle>/skill/<skill>/how-to/`. The bundle page links to it from the guide list and the skill table. The guide page renders all adjacent guides in file-name order. A guide in a subfolder of a skill is not shown.
- Each skill row in the reference has the id `skill-<name>`. A link to that id opens the row's category and highlights the row.
- Harness facts that no bundle file holds live in `content/bundles/harnesses.yaml`.
- Every installed skill has a page at `/bundles/<bundle>/skill/<skill>/` that renders its `SKILL.md`. The metadata rail lists declared schema and skill versions, local Markdown references, and inferred output paths with source links. It shows missing metadata explicitly and stacks below the instructions on narrow screens. Output detection is descriptive, not a schema validator. Hand-written `content/bundles/<bundle>/skills/<skill>/page.md`, diagrams, and source notes remain supplementary.
- Build each skill document into `.content-collections/skill-documents/<bundle>/<skill>.json`. Detail routes import one document at a time. Keep full skill HTML out of the bundle summaries.
- Headings use native fragment links with icons visible on hover, keyboard focus, and touch. `Heading` covers React headings; `compileDocument` adds unique, document-prefixed IDs and links to Markdown headings. It also renders GFM tables and resolves skill-relative links to repository sources.
- GitHub Pages prefers a folder to a file with the same name. Write each page that has pages below it as `<path>/index.html` (`asFolder` in `vite.config.ts`), and link to it with a trailing `/`.

## Redirects

- `404.html` runs the rules in `content/redirects.yaml` before React starts. Each `pattern` is a regular expression tested against the path without the `/dotfiles/` base. The first match wins.
- When you move or remove a published page, add a rule. One rule can cover a whole subtree, such as `^/artifacts(/.*)?$`.

## Commands

Run these from the repository root:

| Command                   | Purpose                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `mise run website:dev`    | Start the dev server at `http://localhost:4173/dotfiles/`.                                    |
| `mise run website:build`  | Typecheck and build the static site into `dist/client`.                                       |
| `mise run website:check`  | Typecheck, oxlint, oxfmt check, rule tests and react-doctor. CI runs this before each deploy. |
| `mise run website:format` | Format with oxfmt, including Tailwind class order.                                            |
| `mise run website:lint`   | Lint with oxlint.                                                                             |
| `mise run website:doctor` | Scan with react-doctor.                                                                       |
