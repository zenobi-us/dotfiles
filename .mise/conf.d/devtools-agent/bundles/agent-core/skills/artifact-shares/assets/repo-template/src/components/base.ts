/*!
 * Turn a repository-relative path into a URL this site can serve.
 *
 * GitHub Pages serves the site under /<repo>/, so every asset URL needs that
 * prefix. `vite.config.ts` passes it to fumapress as `basePath`, and Vite
 * publishes the same value as `import.meta.env.BASE_URL`.
 *
 * Generated MDX therefore stores paths WITHOUT the prefix, as `s/<hash>/x.png`.
 * A share published today keeps working if the repository is renamed.
 */

export const BASE_PATH: string = import.meta.env.BASE_URL ?? "/";

export function asset(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${BASE_PATH.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
}
