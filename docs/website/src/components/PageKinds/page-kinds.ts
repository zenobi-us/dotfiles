// The recipes and schematic regions share one record so their descriptions cannot drift into separate catalogues.
export const layoutRoles = {
  shell: { label: "Shell", className: "text-muted" },
  identity: { label: "Identity", className: "text-primary" },
  navigation: { label: "Navigation", className: "text-success" },
  content: { label: "Content", className: "text-foreground" },
  metadata: { label: "Metadata", className: "text-[#e8b88b]" },
  interaction: { label: "Interaction", className: "text-error" },
};

export type LayoutRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  role: keyof typeof layoutRoles;
  label: string;
};

export type PageKind = {
  id: string;
  name: string;
  intent: string;
  use: string;
  components: string[];
  rule: string;
  avoid: string;
  description: string;
  regions: LayoutRegion[];
};

const header: LayoutRegion = { x: 6, y: 6, width: 188, height: 14, role: "shell", label: "SiteHeader" };
const footer: LayoutRegion = { x: 6, y: 166, width: 188, height: 12, role: "shell", label: "SiteFooter" };
const identity: LayoutRegion = { x: 6, y: 27, width: 188, height: 26, role: "identity", label: "Page.Header" };

export const pageKinds: PageKind[] = [
  {
    id: "landing",
    name: "Landing page",
    intent: "Orient a new reader and offer one clear starting point.",
    use: "Use for the website home or a major area’s introduction, not for a detailed procedure.",
    components: ["Landing", "Button", "DocSection"],
    rule: "Keep one primary destination. Use the index for secondary routes and put supporting chapters below the introduction.",
    avoid: "Avoid a hero treatment on every documentation page.",
    description:
      "A shared header, a large introduction beside an index, linked actions, supporting chapters and a footer.",
    regions: [
      header,
      { x: 6, y: 27, width: 112, height: 66, role: "identity", label: "Introduction" },
      { x: 124, y: 27, width: 70, height: 66, role: "navigation", label: "Index" },
      { x: 12, y: 68, width: 80, height: 17, role: "interaction", label: "Primary link" },
      { x: 6, y: 101, width: 188, height: 25, role: "content", label: "Supporting chapter" },
      { x: 6, y: 133, width: 188, height: 25, role: "content", label: "Supporting chapter" },
      footer,
    ],
  },
  {
    id: "directory",
    name: "Index or directory",
    intent: "Help a reader choose a destination from a collection.",
    use: "Use for bundles, guides or reference collections that lead to dedicated pages.",
    components: ["Page.Header", "ReferenceList", "DataTable"],
    rule: "Use linked rows by default. Switch to a table only when readers need to compare the same attributes across entries.",
    avoid: "Avoid a grid of promotional cards for a simple link list.",
    description: "A shared header and page identity above four linked reference rows and a footer.",
    regions: [
      header,
      identity,
      { x: 6, y: 60, width: 188, height: 19, role: "navigation", label: "ReferenceList.Item" },
      { x: 6, y: 85, width: 188, height: 19, role: "navigation", label: "ReferenceList.Item" },
      { x: 6, y: 110, width: 188, height: 19, role: "navigation", label: "ReferenceList.Item" },
      { x: 6, y: 135, width: 188, height: 19, role: "navigation", label: "ReferenceList.Item" },
      footer,
    ],
  },
  {
    id: "bundle",
    name: "Bundle overview",
    intent: "Introduce one bundle and connect its learning and reference material.",
    use: "Use for a bundle’s explanation, tutorial, how-to guides and technical reference.",
    components: ["Page.Header", "SectionLinks", "DocSection", "SkillIndex"],
    rule: "Keep four predictable chapters. Use the section rail for context and the content column for prose, guides and searchable skills.",
    avoid: "Avoid mixing procedural steps into the searchable reference inventory.",
    description: "A page header followed by chapter navigation and paired section notes and content.",
    regions: [
      header,
      identity,
      { x: 6, y: 59, width: 188, height: 15, role: "navigation", label: "SectionLinks" },
      { x: 6, y: 81, width: 53, height: 77, role: "navigation", label: "Notes" },
      { x: 65, y: 81, width: 129, height: 35, role: "content", label: "Chapter content" },
      { x: 65, y: 122, width: 129, height: 36, role: "content", label: "SkillIndex / table" },
      footer,
    ],
  },
  {
    id: "skill",
    name: "Skill reference",
    intent: "Make instructions readable while keeping provenance close.",
    use: "Use for an installed skill’s instructions, schema details, references and inferred outputs.",
    components: ["SkillDocument", "Page.Header", "Prose", "SkillMetadata"],
    rule: "Use the SkillDocument shell once. Keep the instructions in the article and metadata in the 280px right rail. State missing values explicitly.",
    avoid: "Avoid repeating the shell or presenting inferred metadata as declared facts.",
    description:
      "A page identity block above a wide instructions article and a narrower metadata column, followed by a footer.",
    regions: [
      header,
      identity,
      { x: 6, y: 60, width: 120, height: 98, role: "content", label: "Prose / instructions" },
      { x: 133, y: 60, width: 61, height: 98, role: "metadata", label: "Metadata" },
      footer,
    ],
  },
  {
    id: "howto",
    name: "How-to guide",
    intent: "Help an experienced reader complete one concrete task.",
    use: "Use when the reader knows the goal and needs the shortest safe path to completion. Skill-specific guides use SkillDocument.",
    components: ["SkillDocument", "Heading", "Prose"],
    rule: "Show the intended result, prerequisites, ordered steps, verification and recovery. Keep required commands and warnings visible.",
    avoid: "Avoid hiding consecutive steps in tabs or disclosures.",
    description:
      "A page header, prerequisites, numbered instructions, a code example and verification above the footer.",
    regions: [
      header,
      { ...identity, label: "Result / Page.Header" },
      { x: 6, y: 60, width: 188, height: 18, role: "content", label: "Prerequisites" },
      { x: 6, y: 85, width: 188, height: 18, role: "content", label: "1. Do the task" },
      { x: 19, y: 110, width: 175, height: 17, role: "interaction", label: "Code / command" },
      { x: 6, y: 134, width: 188, height: 24, role: "content", label: "2. Verify / recover" },
      footer,
    ],
  },
  {
    id: "tutorial",
    name: "Tutorial",
    intent: "Teach a new reader through a guided sequence.",
    use: "Use when the reader needs a learning path, a known starting point and observable checkpoints.",
    components: ["Page.Header", "Prose", "DocSection"],
    rule: "Explain the learning outcome first. Group substantial stages into sections and give a checkpoint before the reader moves on.",
    avoid: "Avoid optional branches that interrupt the main learning path.",
    description: "A learning outcome header above two guided stages, a checkpoint and a recap.",
    regions: [
      header,
      { ...identity, label: "Learning outcome" },
      { x: 6, y: 60, width: 188, height: 26, role: "content", label: "Stage 1 / instruction" },
      { x: 19, y: 93, width: 175, height: 17, role: "interaction", label: "Checkpoint" },
      { x: 6, y: 117, width: 188, height: 24, role: "content", label: "Stage 2 / instruction" },
      { x: 6, y: 147, width: 188, height: 11, role: "content", label: "Recap" },
      footer,
    ],
  },
  {
    id: "explanation",
    name: "Explanation",
    intent: "Build a mental model and explain why the system works this way.",
    use: "Use for concepts, design decisions, relationships and tradeoffs rather than task instructions.",
    components: ["Page.Header", "Prose", "DiagramBlock", "SourceNote"],
    rule: "Lead with the question. Use diagrams for real relationships, pair them with descriptions and finish with links to related reference.",
    avoid: "Avoid a numbered procedure when the purpose is understanding.",
    description: "A question-led header, explanatory prose, a relationship diagram with caption and a source note.",
    regions: [
      header,
      { ...identity, label: "Question / Page.Header" },
      { x: 6, y: 60, width: 188, height: 28, role: "content", label: "Concept / Prose" },
      { x: 6, y: 95, width: 188, height: 39, role: "content", label: "Diagram + caption" },
      { x: 6, y: 141, width: 188, height: 17, role: "metadata", label: "SourceNote" },
      footer,
    ],
  },
  {
    id: "component",
    name: "Component guide",
    intent: "Help a contributor choose and correctly compose a reusable part.",
    use: "Use for component usage, APIs, variants and working examples, including this design-system family.",
    components: ["SectionLinks", "DocSection", "ComponentExample"],
    rule: "Keep usage notes beside a real demo. Preview and Code show equivalent representations; props and state coverage stay nearby.",
    avoid: "Avoid making screenshots stand in for working component examples.",
    description:
      "Page identity and chapter navigation above side-by-side usage notes and a tabbed demo, with an API block below.",
    regions: [
      header,
      identity,
      { x: 6, y: 59, width: 188, height: 15, role: "navigation", label: "SectionLinks" },
      { x: 6, y: 81, width: 53, height: 53, role: "navigation", label: "Usage" },
      { x: 66, y: 81, width: 128, height: 15, role: "interaction", label: "Preview / Code" },
      { x: 66, y: 101, width: 128, height: 33, role: "content", label: "Live demo" },
      { x: 6, y: 141, width: 188, height: 17, role: "metadata", label: "Props / states" },
      footer,
    ],
  },
  {
    id: "missing",
    name: "Missing page",
    intent: "Explain the missing destination and offer a clear route back.",
    use: "Use only when no route or configured redirect matches the requested address.",
    components: ["NotFound", "Page.Header", "Button"],
    rule: "Say what happened in plain language and offer links to the workstation guide and agent bundles. Keep the page short.",
    avoid: "Avoid a full catalogue, promotional hero or unrelated content in the recovery path.",
    description:
      "A compact missing-page identity block, a short explanation and two recovery links; no full site shell.",
    regions: [
      { x: 25, y: 32, width: 150, height: 38, role: "identity", label: "404 / NotFound" },
      { x: 25, y: 77, width: 150, height: 28, role: "content", label: "Explanation" },
      { x: 25, y: 114, width: 72, height: 22, role: "interaction", label: "Home" },
      { x: 103, y: 114, width: 72, height: 22, role: "interaction", label: "Bundles" },
    ],
  },
];
