# Website

A static TanStack Start site, published to GitHub Pages. Content lives in `content/` as Markdown and YAML.

## Components and props

- Receive component props as one `props` object. Read values as `props.name`. Do not destructure props in the parameter list or in the body. The oxlint rule `local/no-props-destructuring` enforces this; its source is `lint/no-props-destructuring.ts`.
- Build related UI parts as compound components, such as `DocSection.Root`, `DocSection.Heading` and `DocSection.Content`. Export the root with its parts: `Object.assign(Root, { Root, ... })`.
- Give each component its own folder under `src/components/`. Keep its hooks in that folder, named after the component, such as `useDocSection`.

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
