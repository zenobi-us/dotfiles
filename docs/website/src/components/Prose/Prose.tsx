import { cx } from "../../lib/cx";

/**
 * Renders HTML that content-collections compiled from a Markdown file in `content/`.
 * Only repository content reaches this component, never user input.
 *
 * Markdown links that start with `/` are relative to the site root, as in `siteHref`,
 * so they get the Vite base (`/dotfiles/`). Protocol-relative `//` links are left alone.
 */
export function Prose(props: { html: string; className?: string }) {
  const html = props.html.replace(/href="\/(?!\/)/g, `href="${import.meta.env.BASE_URL}`);
  return <div className={cx(props.className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
