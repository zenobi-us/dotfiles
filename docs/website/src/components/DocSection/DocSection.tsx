import { type ReactNode, useMemo } from "react";
import { cx } from "../../lib/cx";
import { DocSectionContext, useDocSection } from "./useDocSection";
import { headingSlug } from "../../lib/headings";
import { Heading as PermalinkHeading } from "../Heading";

function Root(props: { id: string; children: ReactNode }) {
  const context = useMemo(() => ({ id: props.id, titleId: `${props.id}-title` }), [props.id]);
  return (
    <DocSectionContext.Provider value={context}>
      <section
        className="mt-5 grid grid-cols-[280px_minmax(0,1fr)] border border-border narrow:grid-cols-1"
        id={context.id}
        aria-labelledby={context.titleId}
      >
        {props.children}
      </section>
    </DocSectionContext.Provider>
  );
}

function Heading(props: { number: string; eyebrow: string; title: string; summary: string }) {
  const section = useDocSection();
  return (
    // Sticks below the site header while its section scrolls past. Static on narrow screens, where it stacks above the content.
    <div className="sticky top-(--header-height) flex items-start gap-4 self-start p-6 narrow:static narrow:border-b narrow:border-border narrow:p-5">
      <span className="text-[11px] text-primary">{props.number}</span>
      <div>
        <p className="text-[10px] tracking-[.1em] text-muted uppercase">{props.eyebrow}</p>
        <PermalinkHeading as="h2" id={section.titleId} title={props.title} className="mt-2 mb-3 text-[18px]" />
        <p className="text-[11px] text-muted">{props.summary}</p>
      </div>
    </div>
  );
}

function Content(props: { className?: string; children: ReactNode }) {
  // The content carries the column divider, so a sticky heading does not cut it short.
  return (
    <div className={cx("min-w-0 border-l border-border p-6 narrow:border-l-0 narrow:p-5 tiny:p-4", props.className)}>
      {props.children}
    </div>
  );
}

function Article(props: { id?: string; title: string; children: ReactNode }) {
  const section = useDocSection();
  return (
    <article
      id={props.id}
      className="scroll-mt-16 [article+&]:mt-6 [article+&]:border-t [article+&]:border-border [article+&]:pt-6"
    >
      <PermalinkHeading
        as="h3"
        id={`${section.id}-${headingSlug(props.title)}`}
        title={props.title}
        className="mb-3 text-[14px]"
      />
      {props.children}
    </article>
  );
}

export const DocSection = Object.assign(Root, { Root, Heading, Content, Article });
