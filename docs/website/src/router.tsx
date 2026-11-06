import { createRouter } from "@tanstack/react-router";
import { notFoundFlag } from "./lib/redirects";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // GitHub Pages serves each page at its `.html` file name as well as without it,
    // for example `worktree-workflow.html` and `worktree-workflow`. Match both.
    rewrite: {
      input: ({ url }) => {
        // `404.html` was prerendered for `/404`. Render that route for any missing
        // path, so hydration matches the HTML. The address bar keeps the requested path.
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>)[notFoundFlag]) {
          url.pathname = "/404";
          return url;
        }
        url.pathname = url.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
        return url;
      },
      output: ({ url }) => {
        if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>)[notFoundFlag]) {
          // The router adds the base again after this rewrite.
          url.pathname = `/${window.location.pathname.slice(import.meta.env.BASE_URL.length)}`;
        }
        return url;
      },
    },
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
