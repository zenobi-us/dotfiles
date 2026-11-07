import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "../components/NotFound";
import { redirectConfig } from "../content";
import { redirectScript } from "../lib/redirects";

// Prerendered as `404.html`, which GitHub Pages serves for any missing path. The
// head script checks `content/redirects.yaml` and leaves before React starts.
export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [{ title: "Not found — dotfiles" }, { name: "robots", content: "noindex" }],
    scripts: [{ children: redirectScript(import.meta.env.BASE_URL, redirectConfig.rules) }],
  }),
  component: NotFound,
});
