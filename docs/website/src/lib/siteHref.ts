import { siteBase } from "./site-base";

/**
 * Resolves a link from `content/`. A path that starts with `/` is relative to the site
 * root, so it gets the Vite base (`/dotfiles/`) and works from any page depth. Anchors,
 * relative paths and full URLs pass through unchanged.
 */
export function siteHref(href: string): string {
  return href.startsWith("/") ? `${siteBase}${href.slice(1)}` : href;
}
