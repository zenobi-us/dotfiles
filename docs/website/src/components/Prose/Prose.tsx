import { cx } from "../../lib/cx";

/**
 * Renders HTML that content-collections compiled from a Markdown file in `content/`.
 * Only repository content reaches this component, never user input.
 */
export function Prose(props: { html: string; className?: string }) {
  return <div className={cx(props.className)} dangerouslySetInnerHTML={{ __html: props.html }} />;
}
