import type { ReactNode } from "react";

function Root(props: { label: string; children: ReactNode }) {
  return (
    <nav className="flex flex-wrap border border-t-0 border-border print:hidden" aria-label={props.label}>
      {props.children}
    </nav>
  );
}

function Link(props: { href: string; number: string; children: string }) {
  return (
    <a
      className="inline-flex min-h-11 items-center gap-2 border-r border-border px-4 py-2 text-[11px] no-underline hover:bg-card"
      href={props.href}
    >
      {/* One text run, as in the original page, so the flex gap does not split it. */}
      {`${props.number} ${props.children} ↓`}
    </a>
  );
}

export const SectionLinks = Object.assign(Root, { Root, Link });
