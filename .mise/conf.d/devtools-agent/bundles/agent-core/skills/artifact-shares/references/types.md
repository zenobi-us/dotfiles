# Share kinds and the renderer registry

A kind says what an artifact is. The site uses it twice: for the badge at the top
of the page, and to choose which component draws a file row.

## Where a kind is recorded

Three places, and all three must agree:

| Place | Holds | Written by |
|---|---|---|
| `.types` at the repository root | `<hash>=<kind>`, one line per share | `cli.ts share` |
| `content/shares/<hash>.mdx` frontmatter | `kind: <kind>` | `cli.ts share` |
| `src/components/kinds.ts` | Every kind the site knows | A person |

`mise run checks:types` in the repository fails when they disagree. The pre-commit
hook and both workflows run it.

`.types` is the filesystem record. It answers "what is this hash?" without
parsing MDX, which is why the CLI and the validator both read it.

You **MUST NOT** edit `.types` by hand.

## The registry

```text
src/components/kinds.ts      kind -> label, description, badge colours
src/components/renderers.ts  kind -> the component that draws one file row
src/components/registry.tsx  what the generated MDX is allowed to name
```

`kinds.ts` holds no JSX and imports no React, so `.mise/tasks/checks/types.ts`
reads it directly. Keep it that way.

`renderers.ts` does not import `FileTree`, because `FileTree` imports it. Adding
that import back makes a cycle.

## Add a kind

1. You **MUST** add an entry to `shareKinds` in `src/components/kinds.ts`:

   ```ts
   review: {
     label: "review",
     description: "A pull request review with screenshots.",
     tone: "bg-info-bg text-info",
   },
   ```

   `tone` **MUST** be a whole Tailwind class string. A class built by joining
   pieces is invisible to Tailwind and produces no CSS.

2. You **MAY** add a renderer, but only when the default file row is wrong for
   that kind:

   ```tsx
   // src/components/renderers.ts
   import { ReviewRow } from "./ReviewRow";

   export const fileRenderers: Record<string, FileRenderer> = {
     review: ReviewRow,
   };
   ```

   A renderer takes `{ file, root }` and draws one row. It **MUST** render into
   the tree's three grid tracks, the way `FileLink` does, or the badges stop
   lining up.

3. You **MUST** commit and push the change before the first share of that kind.
   `cli.ts share` reads `kinds.ts` from the clone, so an unpushed kind works
   locally and fails in CI.

4. You **SHOULD** run the checks:

   ```bash
   mise run checks:types
   mise run checks:typescript
   mise run build
   ```

## How a file row picks its renderer

`FileTree` reads `kind` from each entry it is given:

```tsx
<FileTree root="s/<hash>" files={[
  { path: "s/<hash>/index.html" },
  { path: "s/<hash>/review.md", kind: "review" }
]} />
```

`rendererFor(kind)` returns the registered component, or `FileLink` when the kind
has none. An unknown kind is not an error here: the row is drawn the default way.

The share's own kind and a file's kind are separate. The share's kind is the
badge at the top of the page. A file's kind picks that file's row.

## Change the kinds the CLI accepts

You do not. `cli.ts share` reads `shareKinds` out of the clone's `kinds.ts`
rather than holding its own list. A repository that adds a kind can take a share
of that kind with no change to this skill.
