import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Glyph } from "../Glyph";
import { Heading } from "../Heading";

const eyebrow = "text-[10px] uppercase tracking-[.1em] text-muted";

function Root(props: { labelledBy: string; children: ReactNode }) {
  return (
    <section
      className="flex min-h-[min(720px,calc(100svh-var(--header-height)-32px))] flex-col border border-border bg-card narrow:min-h-0"
      aria-labelledby={props.labelledBy}
    >
      {props.children}
    </section>
  );
}

function Bar(props: { position?: "top" | "bottom"; children: ReactNode }) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-[11px] text-muted",
        props.position === "bottom"
          ? "border-t border-border [&_a]:inline-flex [&_a]:min-h-6 [&_a]:items-center"
          : "border-b border-border",
      )}
    >
      {props.children}
    </div>
  );
}

function Badge(props: { children: string }) {
  return <span className="border border-border px-2 py-[3px] text-foreground">{props.children}</span>;
}

function Body(props: { children: ReactNode }) {
  return <div className="grid flex-1 grid-cols-[1.2fr_1fr] narrow:grid-cols-1">{props.children}</div>;
}

function Introduction(props: { children: ReactNode }) {
  return <div className="self-center p-[clamp(24px,4vw,56px)] narrow:px-5 narrow:py-8">{props.children}</div>;
}

function Eyebrow(props: { children: string }) {
  return <p className={eyebrow}>{props.children}</p>;
}

function Title(props: { id: string; children: string }) {
  return (
    <Heading
      as="h1"
      id={props.id}
      title={props.children}
      className="my-5 text-[clamp(28px,4vw,48px)] leading-[1.2] tracking-[-.04em]"
    />
  );
}

function Lead(props: { children: string }) {
  return <p className="mb-4 text-[15px] text-primary">{props.children}</p>;
}

function Actions(props: { children: ReactNode }) {
  return <div className="my-6 flex flex-wrap gap-2">{props.children}</div>;
}

function Note(props: { children: string }) {
  return <p className="text-[11px] text-muted">{props.children}</p>;
}

function Index(props: { label: string; eyebrow: string; children: ReactNode }) {
  return (
    <nav
      className="flex flex-col justify-center border-l border-border p-6 narrow:border-t narrow:border-l-0 narrow:px-3 narrow:py-6"
      aria-label={props.label}
    >
      <p className={cx(eyebrow, "mx-3 mt-0 mb-4")}>{props.eyebrow}</p>
      {props.children}
    </nav>
  );
}

function IndexItem(props: { href: string; number: string; title: string; summary: string }) {
  return (
    <a
      className="grid grid-cols-[24px_minmax(0,1fr)_16px] items-start gap-4 border-t border-border px-3 py-5 no-underline hover:bg-background"
      href={props.href}
    >
      <span className="text-[11px] text-primary">{props.number}</span>
      <span>
        <strong className="mb-1 block text-foreground">{props.title}</strong>
        <span className="block text-[11px] text-muted">{props.summary}</span>
      </span>
      <Glyph>↗</Glyph>
    </a>
  );
}

export const Landing = Object.assign(Root, {
  Root,
  Bar,
  Badge,
  Body,
  Introduction,
  Eyebrow,
  Title,
  Lead,
  Actions,
  Note,
  Index,
  IndexItem,
});
