import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site from https://zenobi-us.github.io/dotfiles/.
const base = "/dotfiles/";

// One page for each agent bundle: each folder with a Claude Code plugin manifest.
// content-collections.ts reads the same folder.
const bundlesDirectory = join(import.meta.dirname, "../../mise/conf.d/devtools-agent/bundles");
const bundlePages = readdirSync(bundlesDirectory)
  .filter((name) => existsSync(join(bundlesDirectory, name, ".claude-plugin/plugin.json")))
  .map((name) => ({ path: `/bundles/${name}` }));

export default defineConfig({
  base,
  server: { port: 4173 },
  plugins: [
    contentCollections(),
    tailwindcss(),
    tanstackStart({
      router: { basepath: base },
      // `/404` becomes `404.html`, which GitHub Pages serves for any missing path.
      pages: [{ path: "/" }, { path: "/404" }, { path: "/bundles" }, ...bundlePages],
      // Static output only: `/bundles/developer` is written as `bundles/developer.html`.
      // Moved URLs, such as `/worktree-workflow`, redirect through `content/redirects.yaml`.
      prerender: { enabled: true, crawlLinks: false, autoSubfolderIndex: false, failOnError: true },
    }),
    viteReact(),
  ],
});
