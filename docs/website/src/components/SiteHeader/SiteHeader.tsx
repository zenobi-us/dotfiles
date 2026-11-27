import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Glyph } from "../Glyph";

const headerLink =
  "flex min-h-12 items-center whitespace-nowrap px-4 text-foreground no-underline hover:bg-card hover:text-primary focus-visible:outline-offset-[-4px]";

function Root(props: { className?: string; children: ReactNode }) {
  return (
    <header className={cx("sticky top-0 z-20 min-h-[49px] border-b border-border bg-background", props.className)}>
      <div className="mx-auto grid w-[min(1280px,calc(100%-32px))] grid-cols-[auto_minmax(0,1fr)_auto] narrow:grid-cols-[1fr_auto] tiny:w-[calc(100%-24px)]">
        {props.children}
      </div>
    </header>
  );
}

function Brand(props: { href: string; mark: string; label: string }) {
  return (
    <a className={cx(headerLink, "gap-3 border-r border-border font-medium narrow:border-r-0")} href={props.href}>
      <span className="text-primary" aria-hidden="true">
        {props.mark}
      </span>{" "}
      {props.label}
    </a>
  );
}

function Nav(props: { label: string; children: ReactNode }) {
  return (
    <nav
      className="flex overflow-x-auto narrow:[grid-column:1/-1] narrow:[grid-row:2] narrow:border-t narrow:border-border"
      aria-label={props.label}
    >
      {props.children}
    </nav>
  );
}

function NavLink(props: { href: string; icon?: string; current?: boolean; children: string }) {
  return (
    <a
      className={cx(
        headerLink,
        "border-r border-border text-[12px] narrow:flex-1 narrow:justify-center narrow:px-3 tiny:px-2 tiny:text-[11px]",
      )}
      href={props.href}
      aria-current={props.current ? "page" : undefined}
    >
      {props.children}
      {props.icon && (
        <>
          &nbsp;<Glyph>{props.icon}</Glyph>
        </>
      )}
    </a>
  );
}

function Repository(props: { href: string; children: string }) {
  return (
    <a className={cx(headerLink, "gap-2 border-l border-border text-[12px]")} href={props.href}>
      {props.children} <Glyph>↗</Glyph>
    </a>
  );
}

export const SiteHeader = Object.assign(Root, { Root, Brand, Nav, NavLink, Repository });
