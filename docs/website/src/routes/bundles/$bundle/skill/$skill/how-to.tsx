import { createFileRoute, notFound } from "@tanstack/react-router";
import { Heading } from "../../../../../components/Heading";
import { Page } from "../../../../../components/Page";
import { Prose } from "../../../../../components/Prose";
import { SkillDocument } from "../../../../../components/SkillDocument";
import { bundleOf, howTosOfSkill } from "../../../../../content";
import { headingSlug } from "../../../../../lib/headings";
import { siteHref } from "../../../../../lib/siteHref";

export const Route = createFileRoute("/bundles/$bundle/skill/$skill/how-to")({
  loader: (context) => {
    const skill = bundleOf(context.params.bundle)?.skills.find((entry) => entry.name === context.params.skill);
    if (!skill) throw notFound();
    const guides = howTosOfSkill(skill);
    if (guides.length === 0) throw notFound();
    return { skill, guides };
  },
  head: (context) => ({
    meta: [
      { title: `${context.loaderData?.skill.name ?? "Skill"} how-to guides — dotfiles` },
      { name: "description", content: `How to use ${context.loaderData?.skill.name ?? "this skill"}.` },
    ],
  }),
  component: HowToPage,
});

function HowToPage() {
  const document = Route.useLoaderData();
  const skill = document.skill;
  return (
    <SkillDocument skill={skill}>
      <Page.Header>
        <Page.Eyebrow>{`${skill.bundle} / ${skill.name} / how-to`}</Page.Eyebrow>
        <Page.Title>
          {document.guides.length === 1 ? document.guides[0]!.title : `${skill.name} how-to guides`}
        </Page.Title>
        <a href={siteHref(`/bundles/${skill.bundle}/skill/${skill.name}/`)} className="text-[12px]">
          ← Read the skill
        </a>
      </Page.Header>
      {document.guides.length > 1 && (
        <nav aria-label="How-to guides" className="my-5 flex flex-wrap gap-5">
          {document.guides.map((guide) => (
            <a key={guide._meta.path} href={`#guide-${headingSlug(guide._meta.path)}`}>
              {guide.title}
            </a>
          ))}
        </nav>
      )}
      {document.guides.map((guide) => (
        <article
          key={guide._meta.path}
          id={`guide-${headingSlug(guide._meta.path)}`}
          className="mt-6 border-t border-border pt-6"
        >
          {document.guides.length > 1 && (
            <Heading
              as="h2"
              id={`guide-${headingSlug(guide._meta.path)}-title`}
              title={guide.title}
              className="mb-4 text-[20px]"
            />
          )}
          <Prose html={guide.html} className="skill-prose" />
        </article>
      ))}
    </SkillDocument>
  );
}
