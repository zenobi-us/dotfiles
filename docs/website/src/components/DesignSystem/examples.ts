// Usage snippets accompany live demos; production implementation links stay in the inventory.
export const examples: Record<string, string> = {
  SiteHeader: `import { SiteHeader } from "./components/SiteHeader";
import { navigation } from "./content";
import { siteHref } from "./lib/siteHref";

<SiteHeader>
  <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
  <SiteHeader.Nav label="Website navigation">
    <SiteHeader.NavLink href={siteHref("/")}>Home</SiteHeader.NavLink>
    <SiteHeader.NavLink href={siteHref("/design-system/")} current>
      Design system
    </SiteHeader.NavLink>
  </SiteHeader.Nav>
  <SiteHeader.Repository href={navigation.repository.href}>
    GitHub
  </SiteHeader.Repository>
</SiteHeader>`,
  SkipLink: `<SkipLink href="#main">Skip to content</SkipLink>
{/* Header and navigation go here. */}
<Page.Main id="main">Page content</Page.Main>`,
  SectionLinks: `<SectionLinks label="Jump to a chapter">
  <SectionLinks.Link href="#actions" number="01">
    Actions
  </SectionLinks.Link>
  <SectionLinks.Link href="#reference" number="02">
    Reference
  </SectionLinks.Link>
</SectionLinks>
<section id="actions">Action guidance</section>
<section id="reference">Reference guidance</section>`,
  SiteFooter: `<SiteFooter />
// Shared content comes from content/navigation.yaml:
// brand, Workstation / Design system / Source groups, and a utility row.
// Root composes Brand, Group, Link and Bottom.
// Links remain visible and the grid wraps to two columns on narrow screens.`,
  Page: `<Page.Main id="main" width="contained">
  <Page.Header>
    <Page.Eyebrow>Website / Reference</Page.Eyebrow>
    <Page.Title>Page anatomy</Page.Title>
    <Page.Description html="<p>One clear title and a short description.</p>" />
    <Page.Details items={["Contained width", "Focusable main"]} />
  </Page.Header>
</Page.Main>
// Use width="full" for wide content.
// Page itself is an alias for Page.Main.`,
  Landing: `<Landing labelledBy="landing-title">
  <Landing.Bar>
    <span>Workstation documentation</span>
    <Landing.Badge>Reference</Landing.Badge>
  </Landing.Bar>
  <Landing.Body>
    <Landing.Introduction>
      <Landing.Eyebrow>dotfiles / website</Landing.Eyebrow>
      <Landing.Title id="landing-title">A consistent starting point.</Landing.Title>
      <Landing.Lead>Build with the existing parts.</Landing.Lead>
      <Landing.Actions>
        <Button href={siteHref("/bundles/")} variant="primary">
          Agent bundles
        </Button>
      </Landing.Actions>
      <Landing.Note>Keep source links close.</Landing.Note>
    </Landing.Introduction>
    <Landing.Index label="Explore" eyebrow="On this page">
      <Landing.IndexItem href={siteHref("/bundles/")} number="01"
        title="Agent bundles" summary="Skills and harness support." />
    </Landing.Index>
  </Landing.Body>
  <Landing.Bar position="bottom">
    <span>Linux / macOS</span>
  </Landing.Bar>
</Landing>`,
  DocSection: `<DocSection id="example-chapter">
  <DocSection.Heading number="01" eyebrow="Reference"
    title="Example chapter" summary="Explain the part beside its content." />
  <DocSection.Content>
    <DocSection.Article title="First article">
      <p>Each article gets a permalink.</p>
    </DocSection.Article>
    <DocSection.Article title="Second article">
      <p>Adjacent articles get a separator.</p>
    </DocSection.Article>
  </DocSection.Content>
</DocSection>`,
  SkillDocument: `// In a skill route, pass the summary returned by its loader.
const document = Route.useLoaderData();

<SkillDocument skill={document.skill}>
  <Page.Header>
    <Page.Eyebrow>Skill instructions</Page.Eyebrow>
    <Page.Title>{document.skill.name}</Page.Title>
    <p>{document.skill.description}</p>
  </Page.Header>
  <Prose html={document.skill.html} className="skill-prose" />
</SkillDocument>`,
  NotFound: `import { NotFound } from "./components/NotFound";

// In the root route configuration:
createRootRoute({
  notFoundComponent: NotFound,
});

// Or render the fallback directly:
<NotFound />`,
  Heading: `<Heading as="h2" id="installation" title="Installation"
  className="mb-4 text-[18px]" />
<Heading as="h3" id="install-command" title="Install command"
  className="text-[14px]">
  Run <code>mise install</code>
</Heading>`,
  Prose: `// Use HTML compiled from trusted repository content.
<Prose html={document.skill.html} className="skill-prose" />

// Root-relative links receive the site's base path:
<Prose html='<p><a href="/bundles/">Agent bundles</a></p>' />
// Do not pass untrusted HTML. Prose does not sanitize it.`,
  Glyph: `<span>Continue <Glyph>→</Glyph></span>
<span>Supported <Glyph>✓</Glyph></span>
<span>Not supported <Glyph>✗</Glyph></span>
<Glyph /> // Renders nothing.
// Each non-empty glyph has aria-hidden="true".`,
  Button: `<Button href="#reference" variant="primary">
  Read references <Glyph>→</Glyph>
</Button>
<Button href="#source">View source note</Button>
// Both render <a>, not <button>.
// Use a native button for an in-page action.`,
  ReferenceList: `<ReferenceList>
  <ReferenceList.Item href={siteHref("/bundles/")}
    title="Agent bundles"
    description="Skills, agents, hooks and harness support." />
  <ReferenceList.Item href={siteHref("/")} title="Workstation guide" />
</ReferenceList>`,
  SourceNote: `<SourceNote label="Source provenance"
  html='<p>Built from repository content. <a href="https://github.com/zenobi-us/dotfiles">Read the source</a>.</p>' />`,
  Disclosure: `const [open, setOpen] = useState(false);

<Disclosure>
  <Disclosure.Summary title="Reference files" count={2} />
  <Disclosure.Content>
    <p>SKILL.md — instructions</p>
    <p>howto.md — usage guide</p>
  </Disclosure.Content>
</Disclosure>
<Disclosure open={open} onToggle={setOpen}>
  <Disclosure.Summary title="Controlled reference" count={0} />
  <Disclosure.Content>
    <p>No reference files are available.</p>
  </Disclosure.Content>
</Disclosure>`,
  DataTable: `<DataTable label="Component contracts">
  <DataTable.Head columns={["Component", "Purpose", "Source"]} />
  <DataTable.Body>
    <DataTable.Row id="component-button">
      <DataTable.Cell code>Button</DataTable.Cell>
      <DataTable.Cell>Navigation action</DataTable.Cell>
      <DataTable.Cell muted>src/components/Button/Button.tsx</DataTable.Cell>
    </DataTable.Row>
  </DataTable.Body>
</DataTable>
<a href="#component-button">Highlight the Button row</a>`,
  SupportMatrix: `import { harnessSupport, partsOf } from "./content";

// The full site matrix:
<SupportMatrix parts={harnessSupport.parts} />

// Only the parts present in a loaded bundle:
<SupportMatrix parts={partsOf(bundle)} />`,
  SkillIndex: `const categories = [
  ["workflow", [
    { name: "review", anchor: "example-review" },
    { name: "implement", anchor: "example-implement" },
  ]],
] satisfies (readonly [string, { name: string; anchor: string }[]])[];

<SkillIndex>
  <SkillIndex.Filter label="Filter skills" placeholder="Try review" />
  <SkillIndex.Groups categories={categories}>
    {(category, items) => (
      <ul aria-label={category}>
        {items.map(item => (
          <li key={item.anchor} id={item.anchor}>{item.name}</li>
        ))}
      </ul>
    )}
  </SkillIndex.Groups>
</SkillIndex>
<a href="#example-review">Reveal review</a>`,
  SkillMetadata: `// skillPageOf loads the summary plus document metadata.
const document = Route.useLoaderData();

<div className="grid grid-cols-[minmax(0,1fr)_280px] gap-8 narrow:grid-cols-1">
  <article className="min-w-0">
    <Prose html={document.skill.html} className="skill-prose" />
  </article>
  <SkillMetadata skill={document.skill} />
</div>
// null versions render "Not declared".
// Empty references and artifacts get explicit empty-state text.`,
  Diagram: `<DiagramBlock.Viewport label="Review flow">
  <Diagram.Svg id="review-flow" title="Review flow"
    description="Implementation moves to review." height={280}>
    <Diagram.Lane x={100} from={20} to={260} />
    <Diagram.Node x={180} y={40} width={240}
      title="Implement" subtitle="Default node" />
    <Diagram.Edge d="M420 72H650" />
    <Diagram.Node x={650} y={40} width={240}
      title="Review" subtitle="Highlighted node" highlighted />
    <Diagram.Edge d="M770 104V170H300" failure />
    <Diagram.Edge d="M300 170V104" dashed />
    <Diagram.Text x={180} y={240} tone="success" anchor="start">
      Approved
    </Diagram.Text>
  </Diagram.Svg>
</DiagramBlock.Viewport>`,
  DiagramBlock: `<DiagramBlock id="review-example">
  <DiagramBlock.Head>
    <DiagramBlock.Title id="review-example" number="01">
      Implementation to review
    </DiagramBlock.Title>
    <DiagramBlock.Kind>State transition</DiagramBlock.Kind>
  </DiagramBlock.Head>
  <DiagramBlock.Figure>
    <DiagramBlock.Viewport label="Implementation to review">
      <Diagram.Svg id="review-drawing" title="Review flow"
        description="Implementation moves to review." height={160}>
        <Diagram.Node x={180} y={40} width={240} title="Implement" />
        <Diagram.Edge d="M420 72H650" />
        <Diagram.Node x={650} y={40} width={240} title="Review" highlighted />
      </Diagram.Svg>
    </DiagramBlock.Viewport>
    <DiagramBlock.Caption html="<p>Work moves to independent review.</p>" />
  </DiagramBlock.Figure>
</DiagramBlock>`,
  Ownership: `import { Ownership } from "./diagrams/ownership";

<DiagramBlock.Viewport label="Workflow ownership">
  <Ownership title="Workflow ownership"
    description="The playbook coordinates tools that own storage, sessions, Git and tickets." />
</DiagramBlock.Viewport>`,
  Handoff: `import { Handoff } from "./diagrams/handoff";

<DiagramBlock.Viewport label="Agent handoff">
  <Handoff title="Agent handoff"
    description="The playbook starts fresh implementers and reviewers and verifies receipts." />
</DiagramBlock.Viewport>`,
  Lifecycle: `import { Lifecycle } from "./diagrams/lifecycle";

<DiagramBlock.Viewport label="Work lifecycle">
  <Lifecycle title="Work lifecycle"
    description="Implementation moves through review and approval to submission or completion; changes require new review." />
</DiagramBlock.Viewport>`,
  Records: `import { Records } from "./diagrams/records";

<DiagramBlock.Viewport label="Workflow records">
  <Records title="Workflow records"
    description="Append-only events link to immutable artifacts and replaceable projections." />
</DiagramBlock.Viewport>`,
  ComponentExample: `<ComponentExample id="action-example" title="Action"
  code={'<Button href="#reference">Read reference</Button>'}>
  <Button href="#reference">Read reference</Button>
</ComponentExample>
// Add isolated for a full-document demo with its own landmarks or IDs.`,
  DesignSystem: `import { createFileRoute } from "@tanstack/react-router";
import { DesignSystem } from "../../components/DesignSystem/DesignSystem";

export const Route = createFileRoute("/design-system/components")({
  head: () => ({
    meta: [{ title: "Components — design system — dotfiles" }],
  }),
  component: DesignSystem,
});
// inventory.ts owns chapters and component contracts.
// demos.tsx owns live examples. examples.ts owns usage snippets.`,
  PageLayoutThumbnail: `import { PageLayoutThumbnail } from "./components/PageLayoutThumbnail/PageLayoutThumbnail";
import { pageKinds } from "./components/PageKinds/page-kinds";

{pageKinds.map(kind => (
  <figure key={kind.id}>
    <PageLayoutThumbnail kind={kind} />
    <figcaption>{kind.name}</figcaption>
  </figure>
))}`,
  PageKinds: `import { PageKinds } from "./components/PageKinds/PageKinds";

<PageKinds />
// Full page: owns its shell, page title, article, metadata rail and footer.
// page-kinds.ts defines the nine recipes and their labelled schematic regions.`,
  DesignSystemOverview: `import { DesignSystemOverview } from "./components/DesignSystemOverview/DesignSystemOverview";

<DesignSystemOverview />
// Overview page: explains the system and links page guidance and components.`,
};
