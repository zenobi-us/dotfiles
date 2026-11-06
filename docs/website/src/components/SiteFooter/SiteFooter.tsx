import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

const spacing = {
  page: "py-6",
  compact: "pt-4",
};

function Root(props: { spacing?: keyof typeof spacing; children: ReactNode }) {
  return (
    <footer
      className={cx("flex flex-wrap justify-between gap-4 text-[11px] text-muted", spacing[props.spacing ?? "page"])}
    >
      {props.children}
    </footer>
  );
}

function Label(props: { children: string }) {
  return <span>{props.children}</span>;
}

function Link(props: { href: string; icon?: string; iconBefore?: string; children: string }) {
  // One text run, as in the original page, so the arrow sits on the same underline.
  const text = [props.iconBefore, props.children, props.icon].filter(Boolean).join(" ");
  return (
    <a className="inline-flex min-h-6 items-center" href={props.href}>
      {text}
    </a>
  );
}

export const SiteFooter = Object.assign(Root, { Root, Label, Link });
