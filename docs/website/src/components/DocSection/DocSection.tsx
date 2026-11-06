import { type ReactNode, useMemo } from "react";
import { cx } from "../../lib/cx";
import { DocSectionContext, useDocSection } from "./useDocSection";

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
    <div className="flex items-start gap-4 border-r border-border p-6 narrow:border-r-0 narrow:border-b narrow:p-5">
      <span className="text-[11px] text-primary">{props.number}</span>
      <div>
        <p className="text-[10px] tracking-[.1em] text-muted uppercase">{props.eyebrow}</p>
        <h2 id={section.titleId} className="mt-2 mb-3 text-[18px]">
          {props.title}
        </h2>
        <p className="text-[11px] text-muted">{props.summary}</p>
      </div>
    </div>
  );
}

function Content(props: { className?: string; children: ReactNode }) {
  return <div className={cx("min-w-0 p-6 narrow:p-5 tiny:p-4", props.className)}>{props.children}</div>;
}

function Article(props: { title: string; children: ReactNode }) {
  return (
    <article className="[article+&]:mt-6 [article+&]:border-t [article+&]:border-border [article+&]:pt-6">
      <h3 className="mb-3 text-[14px]">{props.title}</h3>
      {props.children}
    </article>
  );
}

export const DocSection = Object.assign(Root, { Root, Heading, Content, Article });
