// This inventory documents the public component families, including their compound parts.
export type ComponentDoc = {
  name: string;
  source: string;
  usedBy: string;
  parts: string;
  props: string;
  guidance: string;
  states: string;
  isolated?: boolean;
};

const shared = (name: string) => `src/components/${name}/${name}.tsx`;
export const chapters: { id: string; title: string; summary: string; components: ComponentDoc[] }[] = [
  {
    id: "shell",
    title: "Site shell & navigation",
    summary: "Keep the brand, destinations and keyboard entry points consistent.",
    components: [
      {
        name: "SiteHeader",
        source: shared("SiteHeader"),
        usedBy: "HomePage, BundlesPage, BundlePage, SkillDocument, PageKinds, DesignSystemOverview",
        parts: "Root, Brand, Nav, NavLink, Repository",
        props:
          "Root: className?, children. Brand: href, mark, label. Nav: label, children. NavLink: href, icon?, current?, children: string. Repository: href, children: string.",
        guidance:
          "Use one sticky header per page. Its contents align with the centred page column; the bottom border spans the viewport. Set current on the active destination. The narrow layout puts navigation on a second row. NavLink does not accept iconBefore.",
        states: "Default link, current page, icon link; desktop and narrow navigation.",
        isolated: true,
      },
      {
        name: "SkipLink",
        source: shared("SkipLink"),
        usedBy: "HomePage, BundlesPage, BundlePage, SkillDocument, PageKinds, DesignSystemOverview",
        parts: "SkipLink",
        props: "href, children: string",
        guidance:
          "Place this first in the page. Its target must exist and accept focus. Focus the frame, then press Tab to reveal the link.",
        states: "Hidden at rest; visible on keyboard focus.",
        isolated: true,
      },
      {
        name: "SectionLinks",
        source: shared("SectionLinks"),
        usedBy: "BundlePage, SkillPage, DesignSystemOverview",
        parts: "Root, Link",
        props: "Root: label, children. Link: href, number, children: string.",
        guidance:
          "Put a wrapping jump list below a page header. Each link needs a stable section ID. The list is hidden in print.",
        states: "Short and long labels; wrapping links.",
      },
      {
        name: "SiteFooter",
        source: shared("SiteFooter"),
        usedBy: "HomePage, BundlesPage, BundlePage, SkillDocument, PageKinds, DesignSystem, DesignSystemOverview",
        parts: "Root, Brand, Group, Link, Bottom",
        props:
          "Root, Brand and Bottom: no props. Group: label: string, children: ReactNode. Link: href: string, children: string.",
        guidance:
          "Use the shared grouped footer on documentation pages. Root reads the brand and destination groups from navigation.yaml. Keep page-specific navigation in the page header or breadcrumb, not in a second footer.",
        states: "Brand column, three navigation groups, utility row and a two-column narrow layout.",
        isolated: true,
      },
    ] satisfies ComponentDoc[],
  },
  {
    id: "layout",
    title: "Page & section layouts",
    summary: "Use compound components to assemble headers, introductions and numbered chapters.",
    components: [
      {
        name: "Page",
        source: shared("Page"),
        usedBy:
          "HomePage, BundlesPage, BundlePage, SkillPage, HowToPage, SkillDocument, NotFound, PageKinds, DesignSystemOverview",
        parts: "Main (root), Header, Eyebrow, Title, Description, Details",
        props:
          "Main: id, width?: contained | full, children. Header: children. Eyebrow and Title: children: string. Description: html. Details: items: string[].",
        guidance:
          "Use one Main and one Title per page. Title owns the fixed page-title ID. Description accepts trusted compiled HTML. Main is focusable for skip links.",
        states: "Contained and full widths; bordered header and detail list.",
        isolated: true,
      },
      {
        name: "Landing",
        source: shared("Landing"),
        usedBy: "HomePage",
        parts: "Root, Bar, Badge, Body, Introduction, Eyebrow, Title, Lead, Actions, Note, Index, IndexItem",
        props:
          "Root: labelledBy, children. Bar: position?: top | bottom, children. Title: id, children: string. Index: label, eyebrow, children. IndexItem: href, number, title, summary. Badge, Eyebrow, Lead, Note: children: string. Body, Introduction, Actions: children.",
        guidance:
          "Use this composition for the home-page introduction. Connect labelledBy to Title.id. Body has two columns on wide screens and one on narrow screens.",
        states: "Top and bottom bars; badge, actions and linked index.",
        isolated: true,
      },
      {
        name: "DocSection",
        source: shared("DocSection"),
        usedBy: "HomePage, BundlesPage, BundlePage, DesignSystemOverview",
        parts: "Root, Heading, Content, Article",
        props:
          "Root: id, children. Heading: number, eyebrow, title, summary. Content: className?, children. Article: id?, title, children.",
        guidance:
          "Keep Heading and Content inside Root. The heading stays beside the content until the narrow breakpoint. Article builds its heading ID from the parent section and title. Use unique titles within each section.",
        states: "Numbered heading; multiple articles; stacked narrow layout.",
      },
      {
        name: "SkillDocument",
        source: shared("SkillDocument"),
        usedBy: "SkillPage, HowToPage",
        parts: "SkillDocument",
        props: "skill: BundleSkill, children",
        guidance:
          "This full-page composition owns the skip link, header, breadcrumb, main region and shared grouped footer. Pass a real build-time skill summary, not a second copy of bundle data.",
        states: "Bundle and skill breadcrumb; shared skill-page navigation.",
        isolated: true,
      },
      {
        name: "NotFound",
        source: shared("NotFound"),
        usedBy: "Root route notFoundComponent, /404 route",
        parts: "NotFound",
        props: "No props.",
        guidance:
          "Use this when no route or redirect matches. The /404 route runs redirect rules before the reader sees the fallback. The component provides links to the home page and bundle hub.",
        states: "Missing-page message and both recovery links.",
        isolated: true,
      },
    ] satisfies ComponentDoc[],
  },
  {
    id: "content",
    title: "Typography, links & source content",
    summary: "Use clear headings, trusted prose and links with explicit destinations.",
    components: [
      {
        name: "Heading",
        source: shared("Heading"),
        usedBy: "Page, Landing, DocSection, DiagramBlock, SkillMetadata, SkillPage, HowToPage, PageKinds",
        parts: "Heading",
        props: "as: h1 | h2 | h3, id, title, className?, children?: ReactNode",
        guidance:
          "Choose the heading level from document structure, not appearance. Keep IDs unique. title names the permalink even when children supplies different heading content.",
        states: "Heading sizes and levels; custom children; permalink on hover, focus and touch.",
      },
      {
        name: "Prose",
        source: shared("Prose"),
        usedBy:
          "Page.Description, SourceNote, DiagramBlock.Caption, HomePage, BundlesPage, BundlePage, SkillPage, HowToPage",
        parts: "Prose",
        props: "html: string, className?: string",
        guidance:
          "Only pass trusted repository HTML compiled at build time. This is not an HTML sanitizer. Root-relative links receive the /dotfiles/ base; protocol-relative URLs remain unchanged. Use skill-prose for complete skill documents.",
        states: "Paragraphs, headings, lists, inline code, code blocks, tables and blockquotes.",
      },
      {
        name: "Glyph",
        source: shared("Glyph"),
        usedBy: "SiteHeader, SiteFooter, Landing, ReferenceList, SupportMatrix, HomePage",
        parts: "Glyph",
        props: "children?: string",
        guidance:
          "Use this for decorative arrows and marks next to meaningful text. Screen readers skip the glyph. Empty children render nothing. Never use a glyph as the only accessible label.",
        states: "Arrow, success mark, failure mark and empty output.",
      },
      {
        name: "Button",
        source: shared("Button"),
        usedBy: "HomePage, NotFound",
        parts: "Button",
        props: "href: string, variant?: default | primary, children: ReactNode",
        guidance:
          "This component is an anchor. Use it for navigation, not submission or an onClick action. Use primary for the main destination. There is no disabled or loading variant.",
        states: "Default and primary; hover and keyboard focus.",
      },
      {
        name: "ReferenceList",
        source: shared("ReferenceList"),
        usedBy: "HomePage SectionContent, BundlesPage, DesignSystemOverview",
        parts: "Root, Item",
        props: "Root: children. Item: href, title, description?: string.",
        guidance:
          "Use linked rows for source material and bundle destinations. Omit description when the title already gives enough context. Adjacent rows get separators.",
        states: "With and without a description; linked row hover.",
      },
      {
        name: "SourceNote",
        source: shared("SourceNote"),
        usedBy: "SkillPage, PageKinds",
        parts: "SourceNote",
        props: "label: string, html: string",
        guidance:
          "Use a labelled aside for source provenance or scope limits. Pass trusted compiled HTML. Keep source links beside the facts they support.",
        states: "Labelled note with a source link.",
      },
    ] satisfies ComponentDoc[],
  },
  {
    id: "reference",
    title: "Data, disclosure & skill reference",
    summary: "Keep large reference sets searchable, readable and clear about missing information.",
    components: [
      {
        name: "Disclosure",
        source: shared("Disclosure"),
        usedBy: "SkillIndex.Groups",
        parts: "Root, Summary, Content",
        props:
          "Root: open?: boolean, onToggle?: (open: boolean) => void, children. Summary: title: string, count: number. Content: children.",
        guidance:
          "Use native details for long lists. Omit open for an uncontrolled disclosure. Pair open and onToggle when a filter or fragment must control it. Keep the summary meaningful when closed.",
        states: "Uncontrolled and controlled; open and closed; count zero and long label.",
      },
      {
        name: "DataTable",
        source: shared("DataTable"),
        usedBy: "SupportMatrix, BundlesPage, BundlePage Reference and reload instructions",
        parts: "Root, Head, Body, Row, Cell",
        props:
          "Root: label, children. Head: columns: string[]. Body: children. Row: id?, children. Cell: code?: boolean, muted?: boolean, children.",
        guidance:
          "Supply an accessible table label. Use code cells for identifiers and muted cells for context. Set row IDs for deep links; the target row is highlighted. Wide tables scroll within their own frame.",
        states: "Default, code and muted cells; targeted row; long content and narrow scrolling.",
      },
      {
        name: "SupportMatrix",
        source: shared("SupportMatrix"),
        usedBy: "BundlesPage, BundlePage Reference",
        parts: "SupportMatrix",
        props: "parts: { id: string; name: string; description: string; harnesses: string[] }[]",
        guidance:
          "Pass bundle parts or harnessSupport.parts. Columns come from the build-time harness configuration. Status uses text and a glyph, not colour alone.",
        states: "Supported and not-supported cells; configured harness columns.",
      },
      {
        name: "SkillIndex",
        source: shared("SkillIndex"),
        usedBy: "BundlePage Reference",
        parts: "Root, Filter, Groups; exported SkillIndexItem type",
        props:
          "Root: children. Filter: label, placeholder. Groups<T extends SkillIndexItem>: categories: (readonly [string, T[]])[], children: (category, items) => ReactNode. SkillIndexItem: name, anchor.",
        guidance:
          "Keep Filter and Groups inside Root. Search fuzzy-matches names or category/name, ranks results and opens matching categories. A fragment to an item clears the filter and opens its category. Anchors must identify rendered rows.",
        states: "Closed categories, open categories, filtered results, no matches and fragment reveal.",
      },
      {
        name: "SkillMetadata",
        source: shared("SkillMetadata"),
        usedBy: "SkillPage",
        parts: "SkillMetadata",
        props:
          "skill: BundleSkill & SkillDocumentContent (html, source, schemaVersion, version, references, artifacts)",
        guidance:
          "Pass the summary plus loaded document metadata. The rail distinguishes declared versions, local references and inferred outputs. Missing versions and empty reference/output lists are explicit. Its fixed IDs need one instance per document.",
        states: "Declared and missing versions; populated and empty references and outputs.",
        isolated: true,
      },
    ] satisfies ComponentDoc[],
  },
  {
    id: "diagrams",
    title: "Diagram primitives & complete drawings",
    summary: "Use diagrams for ownership, state and handoff relationships. Keep a text description with each drawing.",
    components: [
      {
        name: "Diagram",
        source: shared("Diagram"),
        usedBy: "Ownership, Handoff, Lifecycle, Records",
        parts: "Svg (root), Node, Edge, Text, Lane; exported useDiagram hook",
        props:
          "Svg: id, title, description, height, children. Node: x, y, width, title, subtitle?, highlighted?. Edge: d, dashed?, failure?. Text: x, y, tone?: default | small | label | key | success | failure, anchor?: start | middle | end, children: string. Lane: x, from, to.",
        guidance:
          "Place drawing parts inside Svg so marker IDs resolve through context. Use a unique diagram ID. Coordinates use a 1120-unit viewBox; nodes are 64 units high. The 980px minimum width belongs inside DiagramBlock.Viewport.",
        states:
          "Default and highlighted nodes; normal, dashed and failure edges; six text tones; lanes and text anchors.",
      },
      {
        name: "DiagramBlock",
        source: shared("DiagramBlock"),
        usedBy: "SkillPage",
        parts: "Root, Head, Title, Kind, Figure, Viewport, Caption; useOverflowHint module",
        props:
          "Root: id, children. Head and Figure: children. Title: id, number, children: string. Kind: children: string. Viewport: label, children. Caption: html.",
        guidance:
          "Use the same id for Root and Title. Put the diagram inside Viewport. It exposes a keyboard-focusable scroll region and shows a hint only when content overflows. Caption accepts trusted HTML.",
        states: "Overflow hint on narrow frames; scroll region; title, kind and caption.",
      },
      {
        name: "Ownership",
        source: "src/diagrams/ownership.tsx",
        usedBy: "diagramComponents.ownership → SkillPage",
        parts: "Ownership",
        props: "title: string, description: string (DiagramProps)",
        guidance:
          "Use the registered ownership drawing for workflow authority and file ownership. Each drawing uses its own fixed marker prefix; render only one instance of each drawing per document.",
        states: "Complete ownership drawing.",
      },
      {
        name: "Handoff",
        source: "src/diagrams/handoff.tsx",
        usedBy: "diagramComponents.handoff → SkillPage",
        parts: "Handoff",
        props: "title: string, description: string (DiagramProps)",
        guidance:
          "Use the registered handoff drawing to show which information crosses between workflow roles. Keep the description tied to the actual relationship.",
        states: "Complete handoff drawing.",
      },
      {
        name: "Lifecycle",
        source: "src/diagrams/lifecycle.tsx",
        usedBy: "diagramComponents.lifecycle → SkillPage",
        parts: "Lifecycle",
        props: "title: string, description: string (DiagramProps)",
        guidance:
          "Use this drawing for implementation, review, approval, submission and completion. Failure paths and changed commits return work to review.",
        states: "Success, failure, repeat-review and completion paths.",
      },
      {
        name: "Records",
        source: "src/diagrams/records.tsx",
        usedBy: "diagramComponents.records → SkillPage",
        parts: "Records",
        props: "title: string, description: string (DiagramProps)",
        guidance:
          "Use the registered records drawing to explain durable workflow records and their relationships. The component is selected through a diagram key in content frontmatter.",
        states: "Complete records drawing.",
      },
    ] satisfies ComponentDoc[],
  },
  {
    id: "guide-components",
    title: "Guide components",
    summary: "Authoring guides and their live examples use the same compound composition and spacing rules.",
    components: [
      {
        name: "ComponentExample",
        source: shared("ComponentExample"),
        usedBy: "DesignSystem",
        parts: "ComponentExample",
        props: "id, title, code, isolated?: boolean, children",
        guidance:
          "Use Preview and Code tabs for one working example. Arrow keys, Home and End move between tabs. Both panels stay mounted so demo state survives tab changes. Copy reports success or a readable fallback.",
        states: "Preview, code, copied and clipboard-unavailable feedback. Isolated full-document demos.",
      },
      {
        name: "DesignSystem",
        source: shared("DesignSystem"),
        usedBy: "/design-system/components/ route",
        parts: "DesignSystem",
        props: "No props.",
        guidance:
          "This page uses numbered chapters with usage notes beside live examples. Add new component documentation to this inventory, its live demo and its code example together.",
        states: "Foundation tokens, exhaustive component chapters and route-composition appendix.",
      },
      {
        name: "PageLayoutThumbnail",
        source: shared("PageLayoutThumbnail"),
        usedBy: "PageKinds",
        parts: "PageLayoutThumbnail",
        props: "kind: PageKind (name, description and labelled regions, alongside its recipe)",
        guidance:
          "Use the schematic to explain page anatomy, not to replace a live component demo. Each instance creates unique title and description IDs. Region labels and descriptions preserve meaning without colour.",
        states: "Nine page layouts; six consistent region roles; compact mobile thumbnails.",
      },
      {
        name: "PageKinds",
        source: shared("PageKinds"),
        usedBy: "/page-kinds/ route",
        parts: "PageKinds",
        props: "No props.",
        guidance:
          "Use this authoring reference to select a page composition. Thumbnails stay to the left of always-visible guidance. The skill-reference layout uses a 280px metadata rail that follows the article on narrow screens.",
        states: "Nine page kinds, component-reference links, page anchors and shared composition rules.",
      },
      {
        name: "DesignSystemOverview",
        source: shared("DesignSystemOverview"),
        usedBy: "/design-system/ route",
        parts: "DesignSystemOverview",
        props: "No props.",
        guidance:
          "Use the overview as the entry point to the design system. It explains the shared visual language, then directs readers to page-kind guidance or the live component catalogue.",
        states: "Explanation, section links, page-guidance links and component-reference links.",
      },
    ] satisfies ComponentDoc[],
  },
];

export const componentCount = chapters.reduce((total, chapter) => total + chapter.components.length, 0);

export const routeCompositions = [
  [
    "RootDocument",
    "src/routes/__root.tsx",
    "HTML shell, metadata, stylesheet, font preload and scripts. NotFound handles unmatched routes.",
  ],
  [
    "HomePage / SectionContent",
    "src/routes/index.tsx",
    "Landing composition, article/reference section switch and shared footer.",
  ],
  ["BundlesPage", "src/routes/bundles/index.tsx", "Bundle links, support matrix, harness table and explanatory prose."],
  [
    "BundlePage / Articles / HowTos / Reference",
    "src/routes/bundles/$bundle/index.tsx",
    "Four Diátaxis chapters. Private helpers render docs, guide links, skill search, agents and hooks.",
  ],
  [
    "SkillPage",
    "src/routes/bundles/$bundle/skill/$skill/index.tsx",
    "SkillDocument with compiled prose, metadata, optional explanation, diagrams and source note.",
  ],
  [
    "HowToPage",
    "src/routes/bundles/$bundle/skill/$skill/how-to.tsx",
    "SkillDocument with one or more guides and conditional guide navigation.",
  ],
  ["/404 route", "src/routes/404.tsx", "Redirect-aware route with NotFound as its component."],
  [
    "/design-system route",
    "src/routes/design-system/index.tsx",
    "DesignSystemOverview explanation and resource links.",
  ],
  [
    "/design-system/components route",
    "src/routes/design-system/components.tsx",
    "DesignSystem component catalogue and page metadata.",
  ],
  ["/page-kinds route", "src/routes/page-kinds.tsx", "PageKinds authoring reference and page metadata."],
];

export const supportingModules = [
  ["useDocSection", "DocSection context; Heading, Content and Article stay inside the root."],
  ["useDiagram", "Diagram context; drawing parts stay inside Svg."],
  ["useSkillIndex", "SkillIndex context; Filter and Groups stay inside the root."],
  ["useOverflowHint", "ResizeObserver-based overflow detection for DiagramBlock.Viewport."],
  ["diagramComponents / DiagramProps", "Four registered drawings with shared title and description props."],
  [
    "siteHref / cx / headingSlug",
    "Base-aware links, conditional classes and stable heading slugs. These are utilities, not components.",
  ],
];
