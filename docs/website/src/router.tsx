import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // GitHub Pages serves each page at its `.html` file name as well as without it,
    // for example `worktree-workflow.html` and `worktree-workflow`. Match both.
    rewrite: {
      input: ({ url }) => {
        url.pathname = url.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
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
