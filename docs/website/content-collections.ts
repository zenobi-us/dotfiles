import { defineCollection, defineConfig, defineSingleton } from "@content-collections/core";
import { compileMarkdown } from "@content-collections/markdown";
import { z } from "zod";

const link = z.object({
  label: z.string(),
  href: z.string(),
  icon: z.string().optional(),
  iconBefore: z.string().optional(),
  current: z.boolean().optional(),
});

const pageNavigation = z.object({
  label: z.string(),
  links: z.array(link),
  footer: z.object({ label: z.string(), links: z.array(link) }),
});

const pageMeta = z.object({ title: z.string(), description: z.string() });

const navigation = defineSingleton({
  name: "navigation",
  filePath: "content/navigation.yaml",
  parser: "yaml",
  schema: z.object({
    brand: z.object({ mark: z.string(), label: z.string() }),
    repository: link,
    home: pageNavigation,
    workflow: pageNavigation,
  }),
});

const landing = defineSingleton({
  name: "landing",
  filePath: "content/landing.md",
  schema: z.object({
    meta: pageMeta,
    skipLabel: z.string(),
    barLabel: z.string(),
    badge: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    lead: z.string(),
    actions: z.array(link.extend({ variant: z.enum(["primary", "default"]).default("default") })),
    note: z.string(),
    indexLabel: z.string(),
    indexEyebrow: z.string(),
    platforms: z.string(),
    guide: link,
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileMarkdown(context, document),
  }),
});

const sections = defineCollection({
  name: "sections",
  directory: "content/sections",
  include: "*/_section.md",
  parser: "frontmatter-only",
  schema: z.object({
    id: z.string(),
    number: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    summary: z.string(),
    indexSummary: z.string(),
    layout: z.enum(["articles", "references", "cards"]),
  }),
});

const entries = defineCollection({
  name: "entries",
  directory: "content/sections",
  include: "*/[0-9]*.md",
  schema: z.object({
    title: z.string(),
    href: z.string().optional(),
    description: z.string().optional(),
    eyebrow: z.string().optional(),
    footer: z.string().optional(),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileMarkdown(context, document),
  }),
});

const workflowPage = defineSingleton({
  name: "workflowPage",
  filePath: "content/workflow/page.md",
  schema: z.object({
    meta: pageMeta,
    skipLabel: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    details: z.array(z.string()),
    sectionLinksLabel: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileMarkdown(context, document),
  }),
});

const sourceNote = defineSingleton({
  name: "sourceNote",
  filePath: "content/workflow/source-note.md",
  schema: z.object({ label: z.string(), content: z.string() }),
  transform: async (document, context) => ({
    ...document,
    html: await compileMarkdown(context, document),
  }),
});

const diagrams = defineCollection({
  name: "diagrams",
  directory: "content/workflow/diagrams",
  include: "*.md",
  schema: z.object({
    id: z.string(),
    number: z.string(),
    title: z.string(),
    shortTitle: z.string(),
    kind: z.string(),
    diagram: z.enum(["ownership", "handoff", "lifecycle", "records"]),
    description: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileMarkdown(context, document),
  }),
});

export default defineConfig({
  content: [navigation, landing, sections, entries, workflowPage, sourceNote, diagrams],
});
