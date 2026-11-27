import { ComponentExample } from "../ComponentExample/ComponentExample";
import { DataTable } from "../DataTable";
import { DocSection } from "../DocSection";
import { Heading } from "../Heading";
import { Page } from "../Page";
import { SectionLinks } from "../SectionLinks";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkipLink } from "../SkipLink";
import { navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";
import { componentDemo } from "./demos";
import { examples } from "./examples";
import { chapters, componentCount, routeCompositions, supportingModules } from "./inventory";

/** The published inventory is also the live component guide. */
export function DesignSystem() {
  return (
    <>
      <SkipLink href="#main">Skip to the component catalogue</SkipLink>
      <SiteHeader>
        <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
        <SiteHeader.Nav label="Design system navigation">
          <SiteHeader.NavLink href={siteHref("/")}>Workstation guide</SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/bundles/")}>Agent bundles</SiteHeader.NavLink>
          <SiteHeader.NavLink href={siteHref("/design-system/components/")} current>
            Components
          </SiteHeader.NavLink>
        </SiteHeader.Nav>
        <SiteHeader.Repository href={navigation.repository.href}>{navigation.repository.label}</SiteHeader.Repository>
      </SiteHeader>
      <Page.Main id="main">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted">
          <a href={siteHref("/design-system/")}>Design system</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Components</span>
        </nav>
        <Page.Header>
          <Page.Eyebrow>Design system / Component reference</Page.Eyebrow>
          <Page.Title>Components</Page.Title>
          <p>
            Build documentation with the website’s existing parts. Read the usage notes, try the live React example,
            then copy its code.
          </p>
          <Page.Details
            items={[
              `${componentCount} component families`,
              "Compound parts, props and states",
              "Chapter guide · one scrollable page",
            ]}
          />
          <p className="mt-3 text-[11px] text-muted">
            The “Used by” notes list consumers outside this guide’s demonstrations.
          </p>
          <a href={siteHref("/page-kinds/")} className="mt-4 inline-flex min-h-6 items-center text-[12px]">
            Choose a page kind →
          </a>
        </Page.Header>
        <SectionLinks label="Design system chapters">
          <SectionLinks.Link href="#foundations" number="00">
            Foundations
          </SectionLinks.Link>
          {chapters.map((chapter, index) => (
            <SectionLinks.Link key={chapter.id} href={`#${chapter.id}`} number={String(index + 1).padStart(2, "0")}>
              {chapter.title}
            </SectionLinks.Link>
          ))}
          <SectionLinks.Link href="#compositions" number="07">
            Route compositions
          </SectionLinks.Link>
        </SectionLinks>

        <DocSection id="foundations">
          <DocSection.Heading
            number="00"
            eyebrow="Visual language"
            title="Foundations"
            summary="Reuse the semantic tokens in src/styles/app.css. Keep borders flat, spacing regular and the mono typeface consistent."
          />
          <DocSection.Content>
            <ComponentExample id="foundation-tokens" title="Foundation tokens" code={foundationCode}>
              <div className="grid grid-cols-4 gap-4 narrow:grid-cols-2">
                {tokens.map((token) => (
                  <div key={token.name}>
                    <div
                      className="mb-2 h-16 border border-border"
                      style={{ background: `var(--color-${token.name})` }}
                    />
                    <code className="block text-[11px]">{token.name}</code>
                    <span className="text-[10px] text-muted">{token.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-border pt-5">
                <p className="text-[24px] leading-[1.2]">JetBrains Mono / 24</p>
                <p className="text-[18px]">Section heading / 18</p>
                <p className="text-[14px]">Article heading / 14</p>
                <p>Body / 13 · line height 1.7 · maximum prose width 72ch</p>
                <p className="text-[11px] text-muted">Supporting text / 11 · labels / 10 · weight 400 or 500</p>
              </div>
              <p className="mt-5 text-[11px] text-muted">
                Spacing uses a 4px base. The narrow breakpoint is 760px, tiny is 380px and wide is 1600px. The header is
                49px high, or 98px on narrow screens.
              </p>
            </ComponentExample>
          </DocSection.Content>
        </DocSection>

        {chapters.map((chapter, chapterIndex) => (
          <section key={chapter.id} id={chapter.id} aria-labelledby={`${chapter.id}-chapter-title`} className="mt-10">
            <p className="text-[10px] tracking-[.1em] text-muted uppercase">
              {String(chapterIndex + 1).padStart(2, "0")} / Component chapter
            </p>
            <Heading
              as="h2"
              id={`${chapter.id}-chapter-title`}
              title={chapter.title}
              className="mt-2 mb-3 text-[22px]"
            />
            <p className="mb-5 text-[12px] text-muted">{chapter.summary}</p>
            {chapter.components.map((component, componentIndex) => (
              <DocSection key={component.name} id={`component-${component.name}`}>
                <div className="sticky top-(--header-height) self-start p-6 narrow:static narrow:border-b narrow:border-border narrow:p-5">
                  <p className="text-[10px] text-primary">
                    {String(chapterIndex + 1).padStart(2, "0")}.{String(componentIndex + 1).padStart(2, "0")}
                  </p>
                  <Heading
                    as="h3"
                    id={`component-${component.name}-title`}
                    title={component.name}
                    className="mt-2 mb-3 text-[18px]"
                  />
                  <p className="text-[11px] text-muted">{component.guidance}</p>
                  <a
                    className="mt-4 block text-[10px] break-words"
                    href={`${navigation.repository.href}/blob/master/docs/website/${component.source}`}
                  >
                    {component.source}
                  </a>
                  <p className="mt-4 text-[10px] text-muted">
                    <strong className="text-foreground">Used by</strong>
                    <br />
                    {component.usedBy}
                  </p>
                </div>
                <DocSection.Content>
                  <ComponentExample
                    id={`example-${component.name}`}
                    title={component.name}
                    code={examples[component.name]!}
                    isolated={component.isolated}
                  >
                    {componentDemo(component.name)}
                  </ComponentExample>
                  <dl className="mt-5 space-y-3 text-[11px]">
                    <div>
                      <dt className="text-muted">Parts</dt>
                      <dd className="mt-1 break-words">
                        <code>{component.parts}</code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Props</dt>
                      <dd className="mt-1 break-words">
                        <code>{component.props}</code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">States & variants</dt>
                      <dd className="mt-1">{component.states}</dd>
                    </div>
                  </dl>
                </DocSection.Content>
              </DocSection>
            ))}
          </section>
        ))}

        <DocSection id="compositions">
          <DocSection.Heading
            number="07"
            eyebrow="Inventory boundaries"
            title="Route compositions & supporting modules"
            summary="The 22 original shared families and four complete drawings are all shown above. The authoring guides add five families. Route-local helpers compose those parts; they are not separate reusable APIs."
          />
          <DocSection.Content>
            <DocSection.Article title="Route-local compositions">
              <DataTable label="Route component inventory">
                <DataTable.Head columns={["Composition", "Source", "Role"]} />
                <DataTable.Body>
                  {routeCompositions.map((row) => (
                    <DataTable.Row key={row[0]}>
                      <DataTable.Cell code>{row[0]}</DataTable.Cell>
                      <DataTable.Cell muted>{row[1]}</DataTable.Cell>
                      <DataTable.Cell>{row[2]}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable.Body>
              </DataTable>
            </DocSection.Article>
            <DocSection.Article title="Hooks, context and utilities">
              <DataTable label="Supporting module inventory">
                <DataTable.Head columns={["Module", "Contract"]} />
                <DataTable.Body>
                  {supportingModules.map((row) => (
                    <DataTable.Row key={row[0]}>
                      <DataTable.Cell code>{row[0]}</DataTable.Cell>
                      <DataTable.Cell>{row[1]}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable.Body>
              </DataTable>
              <p className="mt-4 text-[11px] text-muted">
                ComponentExample also owns useComponentExample for isolated-frame sizing. The guide’s local PageDemo,
                DisclosureDemo and MetadataDemo show controlled sample states. Framework shell components (HeadContent
                and Scripts) and React context providers are integration dependencies, not website design primitives.
              </p>
            </DocSection.Article>
            <DocSection.Article title="Keep this inventory current">
              <p className="text-[12px] text-muted">
                When you add or change a component, update inventory.ts, demos.tsx and examples.ts in
                src/components/DesignSystem. Keep the source path, consumers, compound parts, props and state notes
                together. The examples use real components; labelled sample data demonstrates empty and populated
                states.
              </p>
            </DocSection.Article>
          </DocSection.Content>
        </DocSection>
        <SiteFooter />
      </Page.Main>
    </>
  );
}

const tokens = [
  { name: "background", value: "#191521" },
  { name: "card", value: "#241d33" },
  { name: "foreground", value: "#e6e1f2" },
  { name: "primary", value: "#c9a6ff" },
  { name: "muted", value: "foreground 70% + background" },
  { name: "border", value: "foreground 22% + background" },
  { name: "success", value: "#9ccfd8" },
  { name: "error", value: "#f58b92" },
];
const foundationCode = `// Semantic colour and type utilities from src/styles/app.css:
<div className="border border-border bg-card p-4 text-foreground">
  <h2 className="text-[18px]">Section heading</h2>
  <p className="text-[11px] text-muted">Supporting context.</p>
  <a href="#reference" className="text-primary">Read reference</a>
  <span className="text-success">Supported</span>
  <span className="text-error">Not supported</span>
</div>
// JetBrains Mono: weights 400 and 500.
// 4px spacing base. narrow ≤760px; tiny ≤380px; wide ≥1600px.
// Keep colour paired with meaningful text, never colour alone.`;
