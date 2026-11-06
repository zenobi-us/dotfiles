import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site from https://zenobi-us.github.io/dotfiles/.
const base = "/dotfiles/";

export default defineConfig({
  base,
  server: { port: 4173 },
  plugins: [
    contentCollections(),
    tailwindcss(),
    tanstackStart({
      router: { basepath: base },
      pages: [{ path: "/" }, { path: "/worktree-workflow" }],
      // Static output only: `/worktree-workflow` is written as `worktree-workflow.html`,
      // so the URL published before this site used TanStack Start keeps working.
      prerender: { enabled: true, crawlLinks: false, autoSubfolderIndex: false, failOnError: true },
    }),
    viteReact(),
  ],
});
