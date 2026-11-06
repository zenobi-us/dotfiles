import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site from https://zenobi-us.github.io/dotfiles/.
const base = "/dotfiles/";

// GitHub Pages prefers a folder to a file with the same name: `bundles.html` next to
// `bundles/` sends `/bundles` to `bundles/`. A page with pages below it must therefore
// be written as `<path>/index.html`.
const asFolder = (path: string) => ({ path, prerender: { autoSubfolderIndex: true } });

// One page for each agent bundle: each folder with a Claude Code plugin manifest.
// content-collections.ts reads the same folder.
const bundlesDirectory = join(import.meta.dirname, "../../mise/conf.d/devtools-agent/bundles");
const bundleNames = readdirSync(bundlesDirectory).filter((name) =>
  existsSync(join(bundlesDirectory, name, ".claude-plugin/plugin.json")),
);

// One page for each skill with a `content/bundles/<bundle>/skills/<skill>/page.md`.
const skillPages = bundleNames.flatMap((bundle) => {
  const skills = join(import.meta.dirname, "content/bundles", bundle, "skills");
  if (!existsSync(skills)) return [];
  return readdirSync(skills)
    .filter((skill) => existsSync(join(skills, skill, "page.md")))
    .map((skill) => asFolder(`/bundles/${bundle}/skill/${skill}`));
});

export default defineConfig({
  base,
  server: { port: 4173 },
  plugins: [
    contentCollections(),
    tailwindcss(),
    tanstackStart({
      router: { basepath: base },
      pages: [
        { path: "/" },
        // `/404` becomes `404.html`, which GitHub Pages serves for any missing path.
        { path: "/404" },
        asFolder("/bundles"),
        ...bundleNames.map((bundle) => asFolder(`/bundles/${bundle}`)),
        ...skillPages,
      ],
      // Static output only. Moved URLs redirect through `content/redirects.yaml`.
      prerender: { enabled: true, crawlLinks: false, autoSubfolderIndex: false, failOnError: true },
    }),
    viteReact(),
  ],
});
