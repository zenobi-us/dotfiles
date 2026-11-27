import type { ReactNode } from "react";
import { navigation } from "../../content";
import type { ModuleItem, ModuleSummary } from "../../lib/module-document";
import { moduleSource } from "../../lib/module-source";
import { siteHref } from "../../lib/siteHref";
import { Page } from "../Page";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkipLink } from "../SkipLink";

function Root(props: { module?: ModuleSummary; item?: ModuleItem; guide?: boolean; children: ReactNode }) {
  return (
    <>
      <SkipLink href="#main">Skip to module documentation</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label="Module documentation navigation">
          <SiteHeader.NavLink href={siteHref("/")}>Workstation guide</SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/modules/")} current>
            Mise modules
          </SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/bundles/")}>Agent bundles</SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px]">
          <a href={siteHref("/modules/")}>Mise modules</a>
          {props.module && (
            <>
              <span aria-hidden="true">/</span>
              <a href={siteHref(`/modules/${props.module.id}/`)}>{props.module.title}</a>
            </>
          )}
          {props.module && props.item && (
            <>
              <span aria-hidden="true">/</span>
              <a href={siteHref(`/modules/${props.module.id}/items/${props.item.id}/`)}>{props.item.title}</a>
            </>
          )}
          {props.guide && (
            <>
              <span aria-hidden="true">/</span>
              <span aria-current="page">How-to</span>
            </>
          )}
        </nav>
        {props.children}
        <SiteFooter />
      </Page.Main>
    </>
  );
}

function Metadata(props: { module: ModuleSummary; item: ModuleItem; source: string }) {
  return (
    <aside
      aria-label="Item provenance"
      className="min-w-0 border-l border-border pl-6 text-[11px] wrap-anywhere narrow:border-t narrow:border-l-0 narrow:pt-5 narrow:pl-0"
    >
      <h2 className="mb-4 text-[14px]">Source and context</h2>
      <dl className="grid gap-4">
        <div>
          <dt className="text-muted">Module</dt>
          <dd>
            <a href={siteHref(`/modules/${props.module.id}/`)}>{props.module.title}</a>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Item type</dt>
          <dd>{props.item.kind}</dd>
        </div>
        <div>
          <dt className="text-muted">Documentation</dt>
          <dd>
            <a href={props.source}>View Markdown source ↗</a>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Implementation sources</dt>
          <dd>
            <ul className="mt-2 grid gap-2">
              {props.item.sources.map((source) => (
                <li key={source}>
                  <a href={moduleSource(props.module.id, source)}>{source} ↗</a>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export const ModuleDocumentation = Object.assign(Root, { Root, Metadata });
