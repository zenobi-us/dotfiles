import { createFileRoute, notFound } from "@tanstack/react-router";
import { DiagramBlock } from "../../../../../components/DiagramBlock";
import { Heading } from "../../../../../components/Heading";
import { Page } from "../../../../../components/Page";
import { Prose } from "../../../../../components/Prose";
import { SectionLinks } from "../../../../../components/SectionLinks";
import { SkillDocument } from "../../../../../components/SkillDocument";
import { SkillMetadata } from "../../../../../components/SkillMetadata";
import { SourceNote } from "../../../../../components/SourceNote";
import { invocationOf, skillPageOf } from "../../../../../content";
import { diagramComponents } from "../../../../../diagrams";
import { siteHref } from "../../../../../lib/siteHref";

export const Route = createFileRoute("/bundles/$bundle/skill/$skill/")({
  loader: async (context) => {
    const document = await skillPageOf(context.params.bundle, context.params.skill);
    if (!document) throw notFound();
    return document;
  },
  head: (context) => ({
    meta: [
      { title: `${context.loaderData?.skill.name ?? "Skill"} — dotfiles` },
      { name: "description", content: context.loaderData?.skill.description ?? "" },
    ],
  }),
  component: SkillPage,
});

function SkillPage() {
  const document = Route.useLoaderData();
  const skill = document.skill;
  return (
    <SkillDocument skill={skill}>
      <Page.Header>
        <Page.Eyebrow>{`${skill.bundle} / skill instructions`}</Page.Eyebrow>
        <Page.Title>{skill.name}</Page.Title>
        <p className="text-[12px] text-muted">{skill.description}</p>
        <Page.Details items={[`Invoked by ${invocationOf(skill)}`, `Category: ${skill.category}`]} />
        <div className="mt-4 flex flex-wrap gap-5 text-[12px]">
          {document.howTos.length > 0 ? (
            <a href={siteHref(`/bundles/${skill.bundle}/skill/${skill.name}/how-to/`)}>
              How-to guides ({document.howTos.length}) →
            </a>
          ) : (
            <span className="text-muted">No how-to guide published</span>
          )}
          <a href={skill.source}>View SKILL.md ↗</a>
        </div>
      </Page.Header>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_280px] gap-8 narrow:grid-cols-1">
        <article className="min-w-0">
          <Prose html={skill.html} className="skill-prose" />
        </article>
        <SkillMetadata skill={skill} />
      </div>
      {document.page && (
        <section className="mt-8 border-t border-border pt-6">
          <Heading as="h2" id="explanation" title={document.page.title} className="mb-4 text-[20px]" />
          <Page.Description html={document.page.html} />
          <Page.Details items={document.page.details} />
        </section>
      )}
      {document.diagrams.length > 0 && (
        <SectionLinks label={document.page?.sectionLinksLabel ?? "Skill diagrams"}>
          {document.diagrams.map((diagram) => (
            <SectionLinks.Link key={diagram.id} href={`#${diagram.id}`} number={diagram.number}>
              {diagram.shortTitle}
            </SectionLinks.Link>
          ))}
        </SectionLinks>
      )}
      {document.diagrams.map((diagram) => {
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
      {document.sourceNote && <SourceNote label={document.sourceNote.label} html={document.sourceNote.html} />}
    </SkillDocument>
  );
}
