import { expect, test } from "bun:test";
import { type RedirectRule, redirectScript, redirectTarget } from "./redirects";

const base = "/dotfiles/";
const site = "https://zenobi-us.github.io";
const rules: RedirectRule[] = [
  { pattern: "^/worktree-workflow(\\.html)?/?$", to: "/bundles/developer#worktree-workflow" },
  { pattern: "^/old-guides/(.*)$", to: "/guides/$1" },
];

test("redirects a moved page, with and without .html", () => {
  expect(redirectTarget(`${site}/dotfiles/worktree-workflow.html`, base, rules)).toBe(
    `${site}/dotfiles/bundles/developer#worktree-workflow`,
  );
  expect(redirectTarget(`${site}/dotfiles/worktree-workflow`, base, rules)).toBe(
    `${site}/dotfiles/bundles/developer#worktree-workflow`,
  );
});

test("redirects a whole subtree with a capture group and keeps the query and hash", () => {
  expect(redirectTarget(`${site}/dotfiles/old-guides/a/b?x=1#top`, base, rules)).toBe(
    `${site}/dotfiles/guides/a/b?x=1#top`,
  );
});

test("returns null when no rule matches, outside the base, or for a rule that points at itself", () => {
  expect(redirectTarget(`${site}/dotfiles/missing`, base, rules)).toBeNull();
  expect(redirectTarget(`${site}/other/worktree-workflow`, base, rules)).toBeNull();
  expect(redirectTarget(`${site}/dotfiles/loop`, base, [{ pattern: "^/loop$", to: "/loop" }])).toBeNull();
});

test("the inline script redirects with no outside references", () => {
  const calls: string[] = [];
  const location = { href: `${site}/dotfiles/worktree-workflow.html`, replace: (to: string) => calls.push(to) };
  new Function("location", redirectScript(base, rules))(location);
  expect(calls).toEqual([`${site}/dotfiles/bundles/developer#worktree-workflow`]);
});
