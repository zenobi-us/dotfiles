import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { z } from "zod";
import { mdxComponents } from "./src/components/registry";

// One collection over `content/`. Shares live under `content/shares/`.
//
// `kind` is the share type. It is NOT the fumadocs `type` property: fumadocs
// takes `type` from the collection key, so a frontmatter `type` would collide.
// `.types` at the repository root is the filesystem record of the same value,
// and `bun run validate` fails when the two disagree.
const shareSchema = pageSchema.extend({
  kind: z.string().optional(),
  hash: z.string().optional(),
  date: z.coerce.date().optional(),
  source: z.string().optional(),
  files: z
    .array(z.object({ path: z.string(), label: z.string().optional() }))
    .optional(),
});

const docs = defineDocs({
  dir: "content",
  docs: {
    async: true,
    schema: shareSchema,
    lastModified: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  content: docs.toFumadocsSource(),
  // Emit static files only. `fumapress build` writes them to dist/public, which
  // the deploy workflow uploads to GitHub Pages.
  mode: "static",
  site: {
    name: process.env.SITE_NAME ?? "Artifact shares",
    // Set by the deploy workflow. Without it sitemap and RSS fall back to
    // relative URLs, which is a warning, not a failure.
    baseUrl: process.env.SITE_BASE_URL,
    trailingSlash: true,
  },
  meta: {
    root() {
      return (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
            rel="stylesheet"
          />
        </>
      );
    },
  },
}).adapters(
  // Every component the generated MDX may name. `share` writes MDX that calls
  // these, so a component removed here breaks every published share.
  fumadocsMdx({ getMdxComponents: () => mdxComponents }),
);
