import { createFileRoute } from "@tanstack/react-router";
import { DiagramBlock } from "../components/DiagramBlock";
import { Page } from "../components/Page";
import { SectionLinks } from "../components/SectionLinks";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SkipLink } from "../components/SkipLink";
import { SourceNote } from "../components/SourceNote";
import { diagrams, navigation, sourceNote, workflowPage } from "../content";
import { diagramComponents } from "../diagrams";

export const Route = createFileRoute("/worktree-workflow")({
  head: () => ({
    meta: [{ title: workflowPage.meta.title }, { name: "description", content: workflowPage.meta.description }],
  }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const nav = navigation.workflow;
  return (
    <>
      <SkipLink href="#workflow">{workflowPage.skipLabel}</SkipLink>
      <SiteHeader className="print:hidden">
        <SiteHeader.Brand href="./" {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink key={link.href} {...link}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="workflow" width="full">
        <Page.Header>
          <Page.Eyebrow>{workflowPage.eyebrow}</Page.Eyebrow>
          <Page.Title>{workflowPage.title}</Page.Title>
          <Page.Description html={workflowPage.html} />
          <Page.Details items={workflowPage.details} />
        </Page.Header>
        <SectionLinks label={workflowPage.sectionLinksLabel}>
          {diagrams.map((diagram) => (
            <SectionLinks.Link key={diagram.id} href={`#${diagram.id}`} number={diagram.number}>
              {diagram.shortTitle}
            </SectionLinks.Link>
          ))}
        </SectionLinks>
        {diagrams.map((diagram) => {
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
        <SourceNote label={sourceNote.label} html={sourceNote.html} />
        <SiteFooter spacing="compact">
          <SiteFooter.Label>{nav.footer.label}</SiteFooter.Label>
          {nav.footer.links.map((link) => (
            <SiteFooter.Link key={link.href} {...link}>
              {link.label}
            </SiteFooter.Link>
          ))}
        </SiteFooter>
      </Page.Main>
    </>
  );
}
