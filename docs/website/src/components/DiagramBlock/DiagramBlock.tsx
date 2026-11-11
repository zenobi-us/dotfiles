import { type ReactNode, useRef } from "react";
import { Prose } from "../Prose";
import { useOverflowHint } from "./useOverflowHint";
import { Heading } from "../Heading";

function Root(props: { id: string; children: ReactNode }) {
  return (
    <section
      className="mt-4 scroll-mt-4 border border-border bg-background print:break-inside-avoid"
      id={props.id}
      aria-labelledby={`title-${props.id}`}
    >
      {props.children}
    </section>
  );
}

function Head(props: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-4 narrow:items-start narrow:p-4">
      {props.children}
    </div>
  );
}

function Title(props: { id: string; number: string; children: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-4 narrow:gap-2">
      <span className="text-[11px] text-primary">{props.number}</span>
      <Heading as="h2" id={`title-${props.id}`} title={props.children} className="m-0 text-[14px]" />
    </div>
  );
}

function Kind(props: { children: string }) {
  return (
    <span className="text-[10px] tracking-[.1em] text-muted uppercase narrow:max-w-[110px] narrow:text-right">
      {props.children}
    </span>
  );
}

function Figure(props: { children: ReactNode }) {
  return <figure className="m-0 p-5 narrow:p-4">{props.children}</figure>;
}

/** Scrollable frame for one diagram, with a hint that appears only when the diagram overflows. */
function Viewport(props: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const overflowing = useOverflowHint(ref);
  return (
    <>
      <p className="mt-0 mb-3 text-[11px] text-primary print:hidden" hidden={!overflowing}>
        Scroll this diagram sideways →
      </p>
      <div
        ref={ref}
        className="[scrollbar-color:var(--color-primary)_var(--color-background)] overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary print:overflow-visible"
        tabIndex={0}
        role="region"
        aria-label={`${props.label}; scroll horizontally on narrow screens`}
      >
        {props.children}
      </div>
    </>
  );
}

function Caption(props: { html: string }) {
  return (
    <figcaption className="mt-4 border-t border-border pt-3 text-[11px] text-muted">
      <Prose html={props.html} className="[&_p]:max-w-none" />
    </figcaption>
  );
}

export const DiagramBlock = Object.assign(Root, { Root, Head, Title, Kind, Figure, Viewport, Caption });
