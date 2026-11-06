import type { ReactNode } from "react";
import { Glyph } from "../Glyph";

function Root(props: { children: ReactNode }) {
  return <div className="grid gap-0">{props.children}</div>;
}

function Item(props: { href: string; title: string; description?: string }) {
  return (
    <a className="group block py-4 no-underline [a+&]:border-t [a+&]:border-border" href={props.href}>
      <strong className="flex justify-between gap-4 group-hover:underline">
        {props.title} <Glyph>↗</Glyph>
      </strong>
      {props.description && <span className="mt-2 block text-[11px] text-muted">{props.description}</span>}
    </a>
  );
}

export const ReferenceList = Object.assign(Root, { Root, Item });
