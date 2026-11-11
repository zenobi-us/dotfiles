import type { ReactNode } from "react";
import { headingLinkIcon } from "../../lib/headings";

export function Heading(props: {
  as: "h1" | "h2" | "h3";
  id: string;
  title: string;
  className?: string;
  children?: ReactNode;
}) {
  const Tag = props.as;
  return (
    <Tag id={props.id} className={props.className}>
      {props.children ?? props.title}
      <a
        className="heading-anchor"
        href={`#${props.id}`}
        aria-label={`Link to ${props.title}`}
        title={`Link to ${props.title}`}
      >
        <svg viewBox={headingLinkIcon.viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d={headingLinkIcon.path} />
        </svg>
      </a>
    </Tag>
  );
}
