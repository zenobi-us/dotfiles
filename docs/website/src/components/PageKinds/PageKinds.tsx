import { navigation } from "../../content";
import { cx } from "../../lib/cx";
import { siteHref } from "../../lib/siteHref";
import { Heading } from "../Heading";
import { Page } from "../Page";
import { PageLayoutThumbnail } from "../PageLayoutThumbnail/PageLayoutThumbnail";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkipLink } from "../SkipLink";
import { SourceNote } from "../SourceNote";
import { layoutRoles, pageKinds } from "./page-kinds";

/** Uses the skill-reference geometry without inventing skill metadata for an authoring guide. */
export function PageKinds() {
  return (
    <>
      <SkipLink href="#main">Skip to page kinds</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label="Page kinds navigation">
          <SiteHeader.NavLink href={siteHref("/")}>Workstation guide</SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/bundles/")}>Agent bundles</SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/page-kinds/")} current>
            Page kinds
          </SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted">
          <a href={siteHref("/")}>Website</a>
          <span aria-hidden="true">/</span>
          <a href={siteHref("/design-system/")}>Design system</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Page kinds</span>
        </nav>
        <Page.Header>
          <Page.Eyebrow>Website / Authoring reference</Page.Eyebrow>
          <Page.Title>Page kinds</Page.Title>
          <p className="text-[12px] text-muted">
            Choose a page by what the reader needs to do. Use the layout thumbnail to see the structure, then follow the
            component guidance.
          </p>
          <Page.Details
            items={[`${pageKinds.length} page kinds`, "Layout: skill reference", "Audience: website contributors"]}
          />
          <div className="mt-4 flex flex-wrap gap-5 text-[11px]">
            <a href="#page-patterns">Browse the patterns ↓</a>
            <a href="#shared-rules">Shared composition rules →</a>
            <a href={siteHref("/design-system/components/")}>Component reference →</a>
          </div>
        </Page.Header>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_280px] gap-8 narrow:grid-cols-1">
          <article className="min-w-0" aria-labelledby="page-patterns">
            <Heading as="h2" id="page-patterns" title="Choose the right page" className="mb-3 text-[20px]" />
            <p className="text-[12px] text-muted">
              Page kind determines the composition. Content kind determines how you write it. Start with the reader’s
              task, not the visual treatment.
            </p>
            <ul
              aria-label="Layout thumbnail colour key"
              className="mt-5 mb-2 flex list-none flex-wrap gap-x-4 gap-y-2 border-y border-border py-3 text-[10px]"
            >
              {Object.entries(layoutRoles).map(([role, definition]) => (
                <li key={role} className="flex items-center gap-2">
                  <span aria-hidden="true" className={cx("inline-block size-[9px] bg-current", definition.className)} />
                  {definition.label}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted">
              Schematic layouts, not screenshots. Every region has a text label; colours keep the same meaning across
              page kinds.
            </p>
            {pageKinds.map((kind, index) => (
              <section
                key={kind.id}
                id={`kind-${kind.id}`}
                aria-labelledby={`kind-${kind.id}-title`}
                className="grid grid-cols-[196px_minmax(0,1fr)] gap-7 border-b border-border py-7 narrow:grid-cols-[112px_minmax(0,1fr)] narrow:gap-4 narrow:py-6"
              >
                <figure className="m-0 min-w-0 self-start">
                  <PageLayoutThumbnail kind={kind} />
                  <figcaption className="mt-2 text-[9px] text-muted narrow:text-[8px]">
                    {kind.id === "missing" ? "Recovery layout · no full shell" : "Desktop anatomy · schematic"}
                  </figcaption>
                </figure>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[10px] text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <Heading
                      as="h3"
                      id={`kind-${kind.id}-title`}
                      title={kind.name}
                      className="text-[17px] leading-[1.4] tracking-[-.02em] narrow:text-[15px]"
                    />
                  </div>
                  <p className="text-[12px] narrow:text-[11px]">{kind.intent}</p>
                  <p className="mt-3 text-[11px] text-muted narrow:text-[10px]">
                    <strong className="text-foreground">Use for.</strong> {kind.use}
                  </p>
                  <ul aria-label={`${kind.name} components`} className="mt-3 flex list-none flex-wrap gap-1.5">
                    {kind.components.map((component) => (
                      <li key={component}>
                        <a
                          className="inline-flex min-h-6 items-center border border-border bg-card px-2 text-[10px] no-underline hover:underline narrow:px-1 narrow:text-[9px]"
                          href={siteHref(`/design-system/components/#component-${component.split(".")[0]}`)}
                        >
                          <code>{component}</code>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-muted narrow:text-[10px]">
                    <strong className="text-foreground">Composition.</strong> {kind.rule}
                  </p>
                  <p className="mt-3 text-[11px] text-muted narrow:text-[10px]">
                    <strong className="text-foreground">Avoid.</strong> {kind.avoid}
                  </p>
                </div>
              </section>
            ))}
          </article>
          <aside
            aria-label="Page pattern metadata"
            className="min-w-0 border-l border-border pl-6 text-[11px] narrow:border-t narrow:border-l-0 narrow:pt-6 narrow:pl-0"
          >
            <Heading as="h2" id="guide-metadata" title="Guide metadata" className="mb-3 text-[14px]" />
            <dl className="space-y-3">
              <div>
                <dt className="text-[10px] text-muted">Scope</dt>
                <dd className="mt-1">{pageKinds.length} page kinds</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted">Outer layout</dt>
                <dd className="mt-1">Skill reference</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted">Article width</dt>
                <dd className="mt-1">Remaining space</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted">Metadata rail</dt>
                <dd className="mt-1">280px on desktop</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted">On narrow screens</dt>
                <dd className="mt-1">Rail follows the article</dd>
              </div>
            </dl>
            <Heading as="h3" id="page-kind-index" title="On this page" className="mt-7 mb-3 text-[14px]" />
            <nav aria-label="Page kinds">
              {pageKinds.map((kind, index) => (
                <a
                  key={kind.id}
                  href={`#kind-${kind.id}`}
                  className="flex min-h-9 items-center gap-3 text-[11px] no-underline hover:underline"
                >
                  <span className="text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span>
                  {kind.name}
                </a>
              ))}
            </nav>
            <Heading as="h3" id="page-kind-components" title="Component mapping" className="mt-7 mb-3 text-[14px]" />
            <p className="text-[10px] leading-[1.9] text-primary">
              Page.Main + Page.Header
              <br />
              Article + layout list
              <br />
              PageLayoutThumbnail
              <br />
              Guide metadata rail
              <br />
              SiteFooter
            </p>
            <p className="mt-3 text-[10px] text-muted">
              This guide uses the skill-reference layout, not its skill schema fields. It is not an installed skill.
            </p>
            <Heading as="h3" id="shared-rules" title="Shared rules" className="mt-7 mb-3 text-[14px]" />
            <ul className="list-disc space-y-2 pl-4 text-[10px] leading-[1.9] text-muted">
              <li>Use one shell, one main region and one page title.</li>
              <li>Keep heading levels ordered and fragment IDs unique.</li>
              <li>Use links for destinations and native buttons for actions.</li>
              <li>Keep required instructions visible.</li>
              <li>Use colour with text, never instead of text.</li>
            </ul>
          </aside>
        </div>
        <SourceNote
          label="Pattern scope"
          html="<p>The thumbnails describe page recipes. They do not add colour-coded panels to the actual pages. The component reference remains the source for APIs and live examples.</p>"
        />
        <SiteFooter />
      </Page.Main>
    </>
  );
}
