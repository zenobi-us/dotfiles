// Regex redirects for the 404 page. GitHub Pages serves `404.html` for any path it
// cannot find. A script in that page runs `redirectTarget` before React starts, so a
// moved page or a whole moved subtree lands on its new address. Rules live in
// `content/redirects.yaml`.

export type RedirectRule = { pattern: string; to: string };

/**
 * Returns the URL to go to, or null when no rule matches.
 *
 * Each rule's pattern is tested against the path with the site base removed, so
 * `/dotfiles/worktree-workflow.html` is tested as `/worktree-workflow.html`. The
 * first match wins. `to` may use `$1`, `$2`, ... for capture groups. The query and
 * hash of the request are kept unless `to` sets its own.
 *
 * The 404 page inlines this function with `Function.prototype.toString`, so it MUST
 * NOT use any value from outside its own body.
 */
export function redirectTarget(href: string, base: string, rules: RedirectRule[]): string | null {
  const url = new URL(href);
  if (!url.pathname.startsWith(base)) return null;
  const path = `/${url.pathname.slice(base.length)}`;
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern);
    if (!pattern.test(path)) continue;
    const target = new URL(base + path.replace(pattern, rule.to).replace(/^\//, ""), url.origin);
    if (!target.search) target.search = url.search;
    if (!target.hash) target.hash = url.hash;
    // A rule that points at the same path would reload the 404 page for ever.
    if (target.pathname === url.pathname) return null;
    return target.href;
  }
  return null;
}

/** Set on `window` by the 404 page when no rule matched. The router then renders `/404`, the route the HTML was prerendered for. */
export const notFoundFlag = "__dotfilesNotFound";

/** The inline script for the 404 page: find a target and replace the location before the page renders. */
export function redirectScript(base: string, rules: RedirectRule[]): string {
  return `(function(){var t=(${redirectTarget.toString()})(location.href,${JSON.stringify(base)},${JSON.stringify(rules)});if(t)location.replace(t);else window.${notFoundFlag}=true;})();`;
}
