import { type ReactNode, useState } from "react";
import { bundleOf, bundles, harnessSupport, navigation } from "../../content";
import { siteHref } from "../../lib/siteHref";
import { diagramComponents } from "../../diagrams";
import { Button } from "../Button";
import { ComponentExample } from "../ComponentExample/ComponentExample";
import { DataTable } from "../DataTable";
import { Diagram } from "../Diagram";
import { DiagramBlock } from "../DiagramBlock";
import { Disclosure } from "../Disclosure";
import { DocSection } from "../DocSection";
import { Glyph } from "../Glyph";
import { Heading } from "../Heading";
import { Landing } from "../Landing";
import { NotFound } from "../NotFound";
import { Page } from "../Page";
import { PageLayoutThumbnail } from "../PageLayoutThumbnail/PageLayoutThumbnail";
import { pageKinds } from "../PageKinds/page-kinds";
import { Prose } from "../Prose";
import { ReferenceList } from "../ReferenceList";
import { SectionLinks } from "../SectionLinks";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { SkillDocument } from "../SkillDocument";
import { SkillIndex } from "../SkillIndex";
import { SkillMetadata } from "../SkillMetadata";
import { SkipLink } from "../SkipLink";
import { SourceNote } from "../SourceNote";
import { SupportMatrix } from "../SupportMatrix";

export function componentDemo(name: string): ReactNode {
  switch (name) {
    case "SiteHeader":
      return (
        <>
          <SiteHeader>
            <SiteHeader.Brand href={siteHref("/")} {...navigation.brand} />
            <SiteHeader.Nav label="Example navigation">
              <SiteHeader.NavLink href={siteHref("/")}>Home</SiteHeader.NavLink>
              <SiteHeader.NavLink href={siteHref("/design-system/")} current>
                Design system
              </SiteHeader.NavLink>
              <SiteHeader.NavLink href={navigation.repository.href} icon="↗">
                Source
              </SiteHeader.NavLink>
            </SiteHeader.Nav>
            <SiteHeader.Repository href={navigation.repository.href}>GitHub</SiteHeader.Repository>
          </SiteHeader>
          <p className="p-4 text-[11px] text-muted">Resize the page to inspect the real responsive header.</p>
        </>
      );
    case "SkipLink":
      return (
        <>
          <SkipLink href="#skip-demo-main">Skip to demo content</SkipLink>
          <a href="#skip-demo-main">Example navigation link</a>
          <main
            id="skip-demo-main"
            tabIndex={-1}
            className="mt-6 border border-border p-4 focus:outline-2 focus:outline-primary"
          >
            Tab into this frame to reveal the skip link. Activate it to focus this main region.
          </main>
        </>
      );
    case "SectionLinks":
      return (
        <>
          <SectionLinks label="Example chapter links">
            <SectionLinks.Link href="#component-Button" number="01">
              Actions
            </SectionLinks.Link>
            <SectionLinks.Link href="#component-SkillMetadata" number="02">
              Metadata and longer reference labels
            </SectionLinks.Link>
          </SectionLinks>
          <p className="mt-3 text-[11px] text-muted">Both links go to components on this page.</p>
        </>
      );
    case "SiteFooter":
      return <SiteFooter />;
    case "Page":
      return <PageDemo />;
    case "Landing":
      return (
        <Landing labelledBy="landing-demo-title">
          <Landing.Bar>
            <span>Workstation documentation</span>
            <Landing.Badge>Reference</Landing.Badge>
          </Landing.Bar>
          <Landing.Body>
            <Landing.Introduction>
              <Landing.Eyebrow>dotfiles / website</Landing.Eyebrow>
              <Landing.Title id="landing-demo-title">A consistent starting point.</Landing.Title>
              <Landing.Lead>Build with the existing parts.</Landing.Lead>
              <Prose html="<p>Keep navigation, prose and examples consistent.</p>" />
              <Landing.Actions>
                <Button href={siteHref("/design-system/")} variant="primary">
                  Read the guide <Glyph>→</Glyph>
                </Button>
              </Landing.Actions>
              <Landing.Note>This is the live home-page composition.</Landing.Note>
            </Landing.Introduction>
            <Landing.Index label="Example landing index" eyebrow="Explore">
              <Landing.IndexItem
                href={siteHref("/")}
                number="01"
                title="Workstation guide"
                summary="Install and configure the workstation."
              />
              <Landing.IndexItem
                href={siteHref("/bundles/")}
                number="02"
                title="Agent bundles"
                summary="Browse skills and harness support."
              />
            </Landing.Index>
          </Landing.Body>
          <Landing.Bar position="bottom">
            <span>Linux / macOS</span>
            <a href={navigation.repository.href}>Browse source ↗</a>
          </Landing.Bar>
        </Landing>
      );
    case "DocSection":
      return (
        <DocSection id="demo-doc-section">
          <DocSection.Heading
            number="01"
            eyebrow="Reference"
            title="Example chapter"
            summary="The heading and explanation stay beside the content on a wide screen."
          />
          <DocSection.Content>
            <DocSection.Article title="First article">
              <p>Each article gets a permalink.</p>
            </DocSection.Article>
            <DocSection.Article id="demo-article" title="Second article">
              <p>Adjacent articles get a separator.</p>
            </DocSection.Article>
          </DocSection.Content>
        </DocSection>
      );
    case "SkillDocument":
      return (
        <SkillDocument skill={exampleSkill}>
          <Page.Header>
            <Page.Eyebrow>Live skill summary</Page.Eyebrow>
            <Page.Title>{exampleSkill.name}</Page.Title>
            <p>{exampleSkill.description}</p>
          </Page.Header>
          <p className="mt-4 text-[11px] text-muted">
            This frame uses a real installed skill summary. The page wrapper owns the breadcrumb and footer.
          </p>
        </SkillDocument>
      );
    case "NotFound":
      return <NotFound />;
    case "Heading":
      return (
        <div className="space-y-4">
          <Heading as="h3" id="demo-heading-default" title="A linked heading" className="text-[18px]" />
          <Heading as="h3" id="demo-heading-custom" title="Custom heading" className="text-[14px]">
            A heading with <code className="text-primary">inline code</code>
          </Heading>
          <p className="text-[11px] text-muted">
            Hover or focus the permalink. Use h1 and h2 where the document hierarchy requires them.
          </p>
        </div>
      );
    case "Prose":
      return (
        <Prose
          className="skill-prose text-[12px]"
          html={
            '<h3>Compiled repository content</h3><p>Use <strong>clear labels</strong>, <em>short instructions</em> and <code>inline code</code>.</p><ul><li>Keep lists readable.</li><li><a href="/bundles/">Root-relative links keep the site base.</a></li></ul><blockquote>This sample is trusted HTML, not user input.</blockquote><pre><code>mise run website:dev</code></pre><table><thead><tr><th>Token</th><th>Use</th></tr></thead><tbody><tr><td>primary</td><td>Links and focus</td></tr></tbody></table>'
          }
        />
      );
    case "Glyph":
      return (
        <div className="flex flex-wrap gap-6">
          <span>
            Continue <Glyph>→</Glyph>
          </span>
          <span>
            Supported <Glyph>✓</Glyph>
          </span>
          <span>
            Not supported <Glyph>✗</Glyph>
          </span>
          <Glyph />
          <p className="basis-full text-[11px] text-muted">
            The text carries the meaning. The glyphs are hidden from assistive technology.
          </p>
        </div>
      );
    case "Button":
      return (
        <div className="flex flex-wrap gap-3">
          <Button href="#component-ReferenceList" variant="primary">
            Read references <Glyph>→</Glyph>
          </Button>
          <Button href="#component-SourceNote">View source note</Button>
        </div>
      );
    case "ReferenceList":
      return (
        <ReferenceList>
          <ReferenceList.Item
            href={siteHref("/bundles/")}
            title="Agent bundles"
            description="Skills, agents, hooks and harness support."
          />
          <ReferenceList.Item href={siteHref("/")} title="Workstation guide" />
        </ReferenceList>
      );
    case "SourceNote":
      return (
        <SourceNote
          label="Example source provenance"
          html='<p>Built from repository content. <a href="https://github.com/zenobi-us/dotfiles/tree/master/docs/website/src">Read the component source</a>.</p>'
        />
      );
    case "Disclosure":
      return <DisclosureDemo />;
    case "DataTable":
      return (
        <>
          <a href="#demo-table-target" className="mb-3 inline-flex min-h-6 items-center text-[11px]">
            Highlight the second row ↓
          </a>
          <DataTable label="Example component contracts">
            <DataTable.Head columns={["Component", "Purpose", "Source path"]} />
            <DataTable.Body>
              <DataTable.Row>
                <DataTable.Cell code>Button</DataTable.Cell>
                <DataTable.Cell>Navigation action</DataTable.Cell>
                <DataTable.Cell muted>src/components/Button/Button.tsx</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row id="demo-table-target">
                <DataTable.Cell code>ComponentExample</DataTable.Cell>
                <DataTable.Cell>Live example and usage code</DataTable.Cell>
                <DataTable.Cell muted>src/components/ComponentExample/ComponentExample.tsx</DataTable.Cell>
              </DataTable.Row>
            </DataTable.Body>
          </DataTable>
        </>
      );
    case "SupportMatrix":
      return <SupportMatrix parts={harnessSupport.parts} />;
    case "SkillIndex":
      return (
        <SkillIndex>
          <SkillIndex.Filter label="Filter example skills" placeholder="Try review, workflow or an unmatched name" />
          <SkillIndex.Groups categories={exampleCategories}>
            {(category, items) => (
              <DataTable label={`${category} example skills`}>
                <DataTable.Head columns={["Skill", "Category"]} />
                <DataTable.Body>
                  {items.map((item) => (
                    <DataTable.Row key={item.anchor} id={item.anchor}>
                      <DataTable.Cell code>
                        <a href={`#${item.anchor}`}>{item.name}</a>
                      </DataTable.Cell>
                      <DataTable.Cell muted>{category}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable.Body>
              </DataTable>
            )}
          </SkillIndex.Groups>
          {/* react-doctor-disable-next-line react-doctor/anchor-target-exists -- SkillIndex.Groups renders this target from exampleCategories and reveals it on hashchange. */}
          <a className="mt-4 inline-flex min-h-6 items-center text-[11px]" href="#demo-skill-review">
            Reveal review by fragment →
          </a>
        </SkillIndex>
      );
    case "SkillMetadata":
      return <MetadataDemo />;
    case "Diagram":
      return (
        <DiagramBlock.Viewport label="Diagram primitive states">
          <Diagram.Svg
            id="demo-primitives"
            title="Diagram primitive states"
            description="Two nodes, normal and failure paths, a dashed return and a lane."
            height={280}
          >
            <Diagram.Lane x={100} from={20} to={260} />
            <Diagram.Node x={180} y={40} width={240} title="Implement" subtitle="Default node" />
            <Diagram.Edge d="M420 72H650" />
            <Diagram.Node x={650} y={40} width={240} title="Review" subtitle="Highlighted node" highlighted />
            <Diagram.Edge d="M770 104V170H300" failure />
            <Diagram.Edge d="M300 170V104" dashed />
            {(["default", "small", "label", "key", "success", "failure"] as const).map((tone, index) => (
              <Diagram.Text key={tone} x={180 + index * 150} y={240} tone={tone} anchor={index === 5 ? "end" : "start"}>
                {tone}
              </Diagram.Text>
            ))}
          </Diagram.Svg>
        </DiagramBlock.Viewport>
      );
    case "DiagramBlock":
      return (
        <DiagramBlock id="demo-diagram-block">
          <DiagramBlock.Head>
            <DiagramBlock.Title id="demo-diagram-block" number="01">
              Implementation to review
            </DiagramBlock.Title>
            <DiagramBlock.Kind>State transition</DiagramBlock.Kind>
          </DiagramBlock.Head>
          <DiagramBlock.Figure>
            <DiagramBlock.Viewport label="Implementation to review">
              <Diagram.Svg
                id="demo-block-flow"
                title="Implementation to review"
                description="Implementation produces work for review."
                height={160}
              >
                <Diagram.Node x={180} y={40} width={240} title="Implement" />
                <Diagram.Edge d="M420 72H650" />
                <Diagram.Node x={650} y={40} width={240} title="Review" highlighted />
              </Diagram.Svg>
            </DiagramBlock.Viewport>
            <DiagramBlock.Caption html="<p>Implementation moves to independent review.</p>" />
          </DiagramBlock.Figure>
        </DiagramBlock>
      );
    case "Ownership":
    case "Handoff":
    case "Lifecycle":
    case "Records": {
      const Drawing = diagramComponents[name.toLowerCase() as keyof typeof diagramComponents];
      return (
        <DiagramBlock.Viewport label={`${name} drawing`}>
          <Drawing title={`${name} workflow drawing`} description={drawingDescriptions[name]} />
        </DiagramBlock.Viewport>
      );
    }
    case "ComponentExample":
      return (
        <ComponentExample
          id="nested-example"
          title="Nested action"
          code={'<Button href="#component-Button">Read action guidance</Button>'}
        >
          <Button href="#component-Button">Read action guidance</Button>
        </ComponentExample>
      );
    case "DesignSystem":
      return (
        <p className="text-[12px] text-muted">
          This page is the live DesignSystem instance. <a href="#main">Return to its header ↑</a>. Its route composes
          this guide without nesting a second guide.
        </p>
      );
    case "PageLayoutThumbnail":
      return (
        <div className="grid grid-cols-2 gap-6">
          {pageKinds
            .filter((kind) => kind.id === "skill" || kind.id === "missing")
            .map((kind) => (
              <figure key={kind.id} className="m-0 w-full max-w-[200px]">
                <PageLayoutThumbnail kind={kind} />
                <figcaption className="mt-2 text-[10px] text-muted">{kind.name}</figcaption>
              </figure>
            ))}
        </div>
      );
    case "PageKinds":
      return (
        <p className="text-[12px] text-muted">
          <a href={siteHref("/page-kinds/")}>Open the Page kinds guide →</a> to inspect the full composition, all nine
          layouts and their guidance.
        </p>
      );
    case "DesignSystemOverview":
      return (
        <p className="text-[12px] text-muted">
          <a href={siteHref("/design-system/")}>Open the design-system overview →</a> for the explanation and section
          links to page guidance and this catalogue.
        </p>
      );
    default:
      throw new Error(
        `No design-system demo exists for ${name}. Add a live demo before publishing its inventory entry.`,
      );
  }
}

function PageDemo() {
  const [full, setFull] = useState(false);
  return (
    <>
      <label className="flex min-h-11 items-center gap-3 text-[11px]">
        <input
          type="checkbox"
          checked={full}
          onChange={(event) => setFull(event.currentTarget.checked)}
          className="accent-primary"
        />
        Use full page width
      </label>
      <Page.Main id="example-main" width={full ? "full" : "contained"}>
        <Page.Header>
          <Page.Eyebrow>Website / Reference</Page.Eyebrow>
          <Page.Title>Page anatomy</Page.Title>
          <Page.Description html="<p>One clear title and a short description.</p>" />
          <Page.Details items={[full ? "Full width" : "Contained width", "Focusable main"]} />
        </Page.Header>
      </Page.Main>
    </>
  );
}

function DisclosureDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <Disclosure>
        <Disclosure.Summary title="Reference files (uncontrolled)" count={2} />
        <Disclosure.Content>
          <p>SKILL.md — instructions</p>
          <p>howto.md — usage guide</p>
        </Disclosure.Content>
      </Disclosure>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="min-h-11 cursor-pointer border border-border px-3 text-[11px] focus-visible:outline-2 focus-visible:outline-primary"
      >
        {open ? "Close" : "Open"} controlled disclosure
      </button>
      <Disclosure open={open} onToggle={setOpen}>
        <Disclosure.Summary title="A longer controlled reference title with no matching files" count={0} />
        <Disclosure.Content>
          <p>No reference files are available for this example.</p>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}

function MetadataDemo() {
  const [populated, setPopulated] = useState(false);
  return (
    <>
      <label className="mb-5 flex min-h-11 items-center gap-3 text-[11px]">
        <input
          type="checkbox"
          checked={populated}
          onChange={(event) => setPopulated(event.currentTarget.checked)}
          className="accent-primary"
        />
        Show populated sample metadata
      </label>
      <p className="mb-4 text-[10px] text-muted">Sample metadata states, not claims about the installed skill.</p>
      <SkillMetadata
        skill={{
          ...exampleSkill,
          html: "",
          source: navigation.repository.href,
          schemaVersion: populated ? "1.0" : null,
          version: populated ? "2.0" : null,
          references: populated
            ? [{ label: "Component source", href: navigation.repository.href, path: "src/components" }]
            : [],
          artifacts: populated ? [{ path: "reports/example.html", source: navigation.repository.href }] : [],
        }}
      />
    </>
  );
}

function installedExampleSkill() {
  for (const manifest of bundles) {
    const skill = bundleOf(manifest.name)?.skills[0];
    if (skill) return skill;
  }
  throw new Error("The design-system SkillDocument demo requires an installed bundle skill.");
}
const exampleSkill = installedExampleSkill();
const exampleCategories = [
  [
    "workflow",
    [
      { name: "review", anchor: "demo-skill-review" },
      { name: "implement", anchor: "demo-skill-implement" },
    ],
  ],
  ["documentation", [{ name: "write-guide", anchor: "demo-skill-write-guide" }]],
] satisfies (readonly [string, { name: string; anchor: string }[]])[];
const drawingDescriptions: Record<string, string> = {
  Ownership:
    "The worktree playbook coordinates shared-context, muxer-subagents, Worktrunk and the ticket skill. Each tool owns its own records, sessions or Git lifecycle.",
  Handoff:
    "A user requests implementation and review. The playbook starts fresh agents and verifies durable receipts and the review verdict.",
  Lifecycle:
    "Implementation moves through review and approval to optional submission or completion. Fixes and new commits require another review.",
  Records:
    "Phase-start, phase-result and phase-complete events feed append-only records, immutable reviews and snapshots, and replaceable projections.",
};
