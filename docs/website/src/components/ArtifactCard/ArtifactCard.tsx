import type { ReactNode } from "react";
import { Glyph } from "../Glyph";
import { Prose } from "../Prose";

function Root(props: { href: string; children: ReactNode }) {
  return (
    <a className="block border border-border bg-card p-5 no-underline hover:border-primary" href={props.href}>
      {props.children}
    </a>
  );
}

function Eyebrow(props: { children?: string }) {
  return <span className="text-[10px] tracking-[.1em] text-muted uppercase">{props.children}</span>;
}

function Title(props: { children: string }) {
  return (
    <h3 className="mt-4 mb-3 flex justify-between text-[14px]">
      {props.children} <Glyph>↗</Glyph>
    </h3>
  );
}

function Body(props: { html: string }) {
  return <Prose html={props.html} className="[&_p]:text-[12px] [&_p]:text-foreground" />;
}

function Footer(props: { children?: string }) {
  return (
    <span className="mt-6 flex justify-between border-t border-border pt-3 text-[11px]">
      {props.children} <Glyph>→</Glyph>
    </span>
  );
}

export const ArtifactCard = Object.assign(Root, { Root, Eyebrow, Title, Body, Footer });
