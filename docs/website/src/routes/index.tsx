import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../components/Button";
import { DocSection } from "../components/DocSection";
import { Glyph } from "../components/Glyph";
import { Landing } from "../components/Landing";
import { Page } from "../components/Page";
import { Prose } from "../components/Prose";
import { ReferenceList } from "../components/ReferenceList";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { SkipLink } from "../components/SkipLink";
import { entriesOf, landing, navigation, sections, type Section } from "../content";
import { siteHref } from "../lib/siteHref";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: landing.meta.title }, { name: "description", content: landing.meta.description }],
  }),
  component: HomePage,
});

function HomePage() {
  const nav = navigation.home;
  return (
    <>
      <SkipLink href="#main">{landing.skipLabel}</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href="#top" {...navigation.brand} />
        <SiteHeader.Nav label={nav.label}>
          {nav.links.map((link) => (
            <SiteHeader.NavLink key={link.href} {...link} href={siteHref(link.href)}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <Landing labelledBy="title">
          <Landing.Bar>
            <span>{landing.barLabel}</span>
            <Landing.Badge>{landing.badge}</Landing.Badge>
          </Landing.Bar>
          <Landing.Body>
            <Landing.Introduction>
              <Landing.Eyebrow>{landing.eyebrow}</Landing.Eyebrow>
              <Landing.Title id="title">{landing.title}</Landing.Title>
              <Landing.Lead>{landing.lead}</Landing.Lead>
              <Prose html={landing.html} />
              <Landing.Actions>
                {landing.actions.map((action) => (
                  <Button key={action.href} href={siteHref(action.href)} variant={action.variant}>
                    {action.label} <Glyph>{action.icon}</Glyph>
                  </Button>
                ))}
              </Landing.Actions>
              <Landing.Note>{landing.note}</Landing.Note>
            </Landing.Introduction>
            <Landing.Index label={landing.indexLabel} eyebrow={landing.indexEyebrow}>
              {sections.map((section) => (
                <Landing.IndexItem
                  key={section.id}
                  href={`#${section.id}`}
                  number={section.number}
                  title={section.title}
                  summary={section.indexSummary}
                />
              ))}
            </Landing.Index>
          </Landing.Body>
          <Landing.Bar position="bottom">
            <span>{landing.platforms}</span>
            <a href={landing.guide.href}>
              {landing.guide.label} <Glyph>↗</Glyph>
            </a>
          </Landing.Bar>
        </Landing>

        {sections.map((section) => (
          <DocSection key={section.id} id={section.id}>
            <DocSection.Heading
              number={section.number}
              eyebrow={section.eyebrow}
              title={section.title}
              summary={section.summary}
            />
            <SectionContent section={section} />
          </DocSection>
        ))}

        <SiteFooter>
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

/** Renders a section's entries in the layout its `_section.md` names. */
function SectionContent(props: { section: Section }) {
  const entries = entriesOf(props.section);
  switch (props.section.layout) {
    case "articles":
      return (
        <DocSection.Content>
          {entries.map((entry) => (
            <DocSection.Article key={entry._meta.path} title={entry.title}>
              <Prose html={entry.html} />
            </DocSection.Article>
          ))}
        </DocSection.Content>
      );
    case "references":
      return (
        <DocSection.Content>
          <ReferenceList>
            {entries.map((entry) => (
              <ReferenceList.Item
                key={entry._meta.path}
                href={siteHref(entry.href ?? "#")}
                title={entry.title}
                description={entry.description}
              />
            ))}
          </ReferenceList>
        </DocSection.Content>
      );
  }
}
