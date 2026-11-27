import type { ReactNode } from "react";
import { navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";
import { Glyph } from "../Glyph";

/** One shared footer: brand, grouped destinations and a separate utility row. */
function Root() {
  return (
    <footer className="mt-10 border-t border-border pt-8 pb-6">
      <div className="mb-8 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 narrow:grid-cols-2 narrow:gap-6">
        <Brand />
        {navigation.footer.groups.map((group) => (
          <Group key={group.label} label={group.label}>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={siteHref(link.href)}>{link.label}</Link>
              </li>
            ))}
          </Group>
        ))}
      </div>
      <Bottom />
    </footer>
  );
}

function Brand() {
  return (
    <div className="narrow:col-span-2">
      <a
        href={siteHref("/")}
        className="inline-flex min-h-11 items-center gap-3 text-[20px] text-foreground no-underline"
      >
        <span className="text-primary" aria-hidden="true">
          {navigation.brand.mark}
        </span>
        {navigation.brand.label}
      </a>
      <p className="mt-3 max-w-[28ch] text-[11px] text-muted">{navigation.footer.description}</p>
    </div>
  );
}

function Group(props: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={`Footer: ${props.label}`} className="min-w-0">
      <h2 className="mb-3 text-[11px] tracking-[.08em] uppercase">{props.label}</h2>
      <ul className="list-none space-y-1">{props.children}</ul>
    </nav>
  );
}

function Link(props: { href: string; children: string }) {
  return (
    <a
      href={props.href}
      className="inline-flex min-h-11 items-center gap-2 text-[12px] leading-[1.5] text-muted no-underline hover:text-foreground hover:underline"
    >
      {props.children}
      {props.href.startsWith("https://") && <Glyph>↗</Glyph>}
    </a>
  );
}

function Bottom() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[11px] text-muted">
      <span>{navigation.footer.label}</span>
      <Link href="#top">Back to top ↑</Link>
    </div>
  );
}

export const SiteFooter = Object.assign(Root, { Root, Brand, Group, Link, Bottom });
