import type { ReactNode } from "react";
import { type BundleSkill, navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";
import { Page } from "../Page";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkipLink } from "../SkipLink";

export function SkillDocument(props: { skill: BundleSkill; children: ReactNode }) {
  const nav = navigation.bundles;
  const bundleHref = siteHref(`/bundles/${props.skill.bundle}/`);
  return (
    <>
      <SkipLink href="#skill">Skip to skill documentation</SkipLink>
      <SiteHeader className="print:hidden">
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink key={link.href} {...link} href={siteHref(link.href)}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
          <SiteHeader.NavLink href={bundleHref}>{props.skill.bundle}</SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="skill">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted">
          <a href={siteHref("/bundles/")}>Agent bundles</a>
          <span>/</span>
          <a href={bundleHref}>{props.skill.bundle}</a>
          <span>/</span>
          <a href={siteHref(`/bundles/${props.skill.bundle}/skill/${props.skill.name}/`)}>{props.skill.name}</a>
        </nav>
        {props.children}
        <SiteFooter spacing="compact">
          <SiteFooter.Label>{nav.footer.label}</SiteFooter.Label>
          <SiteFooter.Link href={`${bundleHref}#${props.skill.anchor}`} iconBefore="←">
            All bundle skills
          </SiteFooter.Link>
          <SiteFooter.Link href="#skill" icon="↑">
            Back to top
          </SiteFooter.Link>
        </SiteFooter>
      </Page.Main>
    </>
  );
}
