import { navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";
import { DocSection } from "../DocSection";
import { Page } from "../Page";
import { ReferenceList } from "../ReferenceList";
import { SectionLinks } from "../SectionLinks";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkipLink } from "../SkipLink";

/** Connects page-composition guidance with the live component reference. */
export function DesignSystemOverview() {
  return (
    <>
      <SkipLink href="#main">Skip to the design system overview</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label="Design system navigation">
          {navigation.bundles.links.map((link) => (
            <SiteHeader.NavLink key={link.href} href={siteHref(link.href)}>
              {link.label}
            </SiteHeader.NavLink>
          ))}
          <SiteHeader.NavLink href={siteHref("/design-system/")} current>
            Design system
          </SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <Page.Header>
          <Page.Eyebrow>Website / Reference</Page.Eyebrow>
          <Page.Title>Design system</Page.Title>
          <p className="text-[12px] text-muted">
            The website’s shared visual language: semantic colours, typography, reusable components and page patterns.
            Use it to build documentation that stays consistent and works on narrow screens.
          </p>
          <Page.Details items={["Page-composition guidance", "Live React examples", "Shared visual tokens"]} />
        </Page.Header>
        <SectionLinks label="Design system sections">
          <SectionLinks.Link href="#guidance" number="01">
            Page guidance
          </SectionLinks.Link>
          <SectionLinks.Link href="#components" number="02">
            Components
          </SectionLinks.Link>
        </SectionLinks>
        <DocSection id="guidance">
          <DocSection.Heading
            number="01"
            eyebrow="Choose a composition"
            title="Page guidance"
            summary="Start here when you need to decide how a page should be structured."
          />
          <DocSection.Content>
            <p className="text-[12px] text-muted">
              Choose a page kind by the reader’s task. The guidance pairs labelled layout thumbnails with the
              components, composition rules and pitfalls for each kind.
            </p>
            <ReferenceList>
              <ReferenceList.Item
                href={siteHref("/page-kinds/")}
                title="Page-kind guidance"
                description="Nine page kinds: landing pages, directories, bundle overviews, skill references, how-to guides, tutorials, explanations, component guides and missing pages."
              />
            </ReferenceList>
            <p className="text-[11px] text-muted">
              The thumbnails explain anatomy. Their colour coding is an annotation, not a requirement to add coloured
              panels to a page.
            </p>
          </DocSection.Content>
        </DocSection>
        <DocSection id="components">
          <DocSection.Heading
            number="02"
            eyebrow="Use the existing parts"
            title="Components"
            summary="Open the catalogue when you need a component API, state, variant or working example."
          />
          <DocSection.Content>
            <p className="text-[12px] text-muted">
              Use the shared components instead of creating another version of a header, table or navigation pattern.
              Each catalogue entry includes usage notes, a live React demo, example code and a source link.
            </p>
            <ReferenceList>
              <ReferenceList.Item
                href={siteHref("/design-system/components/")}
                title="Component catalogue"
                description="The complete inventory of component families, compound parts, props, variants and current consumers."
              />
            </ReferenceList>
            <p className="text-[11px] text-muted">
              Choose the composition in the page guidance, then use the catalogue to assemble and verify its parts.
            </p>
          </DocSection.Content>
        </DocSection>
        <SiteFooter />
      </Page.Main>
    </>
  );
}
