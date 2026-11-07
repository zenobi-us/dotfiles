import { createFileRoute, notFound } from "@tanstack/react-router";
import { DiagramBlock } from "../../../../components/DiagramBlock";
import { Page } from "../../../../components/Page";
import { SectionLinks } from "../../../../components/SectionLinks";
import { SiteFooter } from "../../../../components/SiteFooter";
import { SiteHeader } from "../../../../components/SiteHeader";
import { SkipLink } from "../../../../components/SkipLink";
import { SourceNote } from "../../../../components/SourceNote";
import { navigation, skillPageOf } from "../../../../content";
import { diagramComponents } from "../../../../diagrams";
import { siteHref } from "../../../../lib/siteHref";

// A dedicated page for one skill, from `content/bundles/<bundle>/skills/<skill>/`.
// Only skills with a `page.md` there have a page.
export const Route = createFileRoute("/bundles/$bundle/skill/$skill")({
  loader: (context) => {
    const skillPage = skillPageOf(context.params.bundle, context.params.skill);
    if (!skillPage) throw notFound();
    return skillPage;
  },
  head: (context) => ({
    meta: [
      { title: context.loaderData?.page.meta.title ?? "" },
      { name: "description", content: context.loaderData?.page.meta.description ?? "" },
    ],
  }),
  component: SkillPage,
});

function SkillPage() {
  const skillPage = Route.useLoaderData();
  const page = skillPage.page;
  const nav = navigation.bundles;
  const bundleHref = siteHref(`/bundles/${page.bundle}/`);
  return (
    <>
      <SkipLink href="#skill">{page.skipLabel}</SkipLink>
      <SiteHeader className="print:hidden">
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink key={link.href} {...link} href={siteHref(link.href)}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
          <SiteHeader.NavLink href={bundleHref}>{page.bundle}</SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="skill" width="full">
        <Page.Header>
          <Page.Eyebrow>{page.eyebrow}</Page.Eyebrow>
          <Page.Title>{page.title}</Page.Title>
          <Page.Description html={page.html} />
          <Page.Details items={page.details} />
        </Page.Header>
        {skillPage.diagrams.length > 0 && (
          <SectionLinks label={page.sectionLinksLabel}>
            {skillPage.diagrams.map((diagram) => (
              <SectionLinks.Link key={diagram.id} href={`#${diagram.id}`} number={diagram.number}>
                {diagram.shortTitle}
              </SectionLinks.Link>
            ))}
          </SectionLinks>
        )}
        {skillPage.diagrams.map((diagram) => {
          const Drawing = diagramComponents[diagram.diagram];
          return (
            <DiagramBlock key={diagram.id} id={diagram.id}>
              <DiagramBlock.Head>
                <DiagramBlock.Title id={diagram.id} number={diagram.number}>
                  {diagram.title}
                </DiagramBlock.Title>
                <DiagramBlock.Kind>{diagram.kind}</DiagramBlock.Kind>
              </DiagramBlock.Head>
              <DiagramBlock.Figure>
                <DiagramBlock.Viewport label={diagram.title}>
                  <Drawing title={diagram.title} description={diagram.description} />
                </DiagramBlock.Viewport>
                <DiagramBlock.Caption html={diagram.html} />
              </DiagramBlock.Figure>
            </DiagramBlock>
          );
        })}
        {skillPage.sourceNote && <SourceNote label={skillPage.sourceNote.label} html={skillPage.sourceNote.html} />}
        <SiteFooter spacing="compact">
          <SiteFooter.Label>{nav.footer.label}</SiteFooter.Label>
          <SiteFooter.Link href={bundleHref} iconBefore="←">{`The ${page.bundle} bundle`}</SiteFooter.Link>
          <SiteFooter.Link href="#skill" icon="↑">
            Back to top
          </SiteFooter.Link>
        </SiteFooter>
      </Page.Main>
    </>
  );
}
