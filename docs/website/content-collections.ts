import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineCollection, defineConfig, defineSingleton } from "@content-collections/core";
import { compileDocument } from "./src/lib/markdown";
import type { SkillDocumentContent } from "./src/lib/skill-document";
import { skillMetadata, skillSource } from "./src/lib/skill-metadata";
import { z } from "zod";

/** The agent bundles. The bundle pages read their skills, agents, hooks and manifests from here at build time. */
const bundlesDirectory = "../../mise/conf.d/devtools-agent/bundles";

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
    bundles: pageNavigation,
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
    html: await compileDocument(context, document),
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
    layout: z.enum(["articles", "references"]),
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
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileDocument(context, document),
  }),
});

const redirectConfig = defineSingleton({
  name: "redirectConfig",
  filePath: "content/redirects.yaml",
  parser: "yaml",
  schema: z.object({
    rules: z.array(
      z.object({
        pattern: z.string().refine(
          (pattern) => {
            try {
              return Boolean(new RegExp(pattern));
            } catch {
              return false;
            }
          },
          { message: "pattern must be a valid JavaScript regular expression" },
        ),
        to: z.string(),
        reason: z.string(),
      }),
    ),
  }),
});

const harnessId = z.enum(["claude", "omp", "pi", "zot", "codex"]);

const harnessSupport = defineSingleton({
  name: "harnessSupport",
  filePath: "content/bundles/harnesses.yaml",
  parser: "yaml",
  schema: z.object({
    harnesses: z.array(
      z.object({
        id: harnessId,
        name: z.string(),
        status: z.enum(["supported", "not-supported"]),
        module: z.string().nullable(),
        install: z.string(),
        reads: z.array(z.string()),
        reload: z.string(),
        hooks: z.string(),
      }),
    ),
    parts: z.array(
      z.object({ id: z.string(), name: z.string(), description: z.string(), harnesses: z.array(harnessId) }),
    ),
  }),
});

const bundlesHub = defineSingleton({
  name: "bundlesHub",
  filePath: "content/bundles/index.md",
  schema: z.object({
    meta: pageMeta,
    skipLabel: z.string(),
    eyebrow: z.string(),
    title: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    html: await compileDocument(context, document),
  }),
});

/** Hand-written tutorial and explanation text for one bundle: `content/bundles/<bundle>/NN-*.md`. How-to guides live with their skill. */
const bundleDocs = defineCollection({
  name: "bundleDocs",
  directory: "content/bundles",
  include: "*/[0-9]*.md",
  schema: z.object({
    kind: z.enum(["tutorial", "explanation"]),
    title: z.string(),
    content: z.string(),
  }),
  transform: async (document, context) => ({
    ...document,
    bundle: document._meta.directory,
    html: await compileDocument(context, document),
  }),
});

const bundleManifests = defineCollection({
  name: "bundleManifests",
  directory: bundlesDirectory,
  include: "*/.claude-plugin/plugin.json",
  parser: "yaml",
  schema: z.object({ name: z.string(), description: z.string(), version: z.string() }),
});

const bundleSkills = defineCollection({
  name: "bundleSkills",
  directory: bundlesDirectory,
  include: "*/skills/**/SKILL.md",
  exclude: "**/node_modules/**",
  schema: z.object({
    name: z.string(),
    description: z.string(),
    content: z.string(),
    version: z.union([z.string(), z.number()]).optional(),
    "schema-version": z.union([z.string(), z.number()]).optional(),
    metadata: z
      .looseObject({
        version: z.union([z.string(), z.number()]).optional(),
        "schema-version": z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
    "user-invocable": z.boolean().optional(),
    "model-invocable": z.boolean().optional(),
    "disable-model-invocation": z.boolean().optional(),
  }),
  transform: async (document, context) => {
    // `<bundle>/skills/<category>/<skill>`, or `<bundle>/skills/<skill>` for a skill with no category.
    const parts = document._meta.directory.split("/");
    const rendered: SkillDocumentContent = {
      html: await compileDocument(context, document, `${skillSource(document._meta.directory)}/`),
      source: skillSource(`${document._meta.directory}/SKILL.md`),
      schemaVersion: document["schema-version"] ?? document.metadata?.["schema-version"] ?? null,
      version: document.version ?? document.metadata?.version ?? null,
      ...skillMetadata(document.content, document._meta.directory, bundlesDirectory),
    };
    const output = join(".content-collections/skill-documents", parts[0] ?? "");
    await mkdir(output, { recursive: true });
    await writeFile(join(output, `${document.name}.json`), JSON.stringify(rendered));
    return {
      name: document.name,
      description: document.description,
      bundle: parts[0] ?? "",
      category: parts.length > 3 ? parts[2] : "general",
      path: document._meta.directory,
      // The id of the skill's row in the bundle reference, so other parts of the page can link to it.
      anchor: `skill-${document.name}`,
      userInvocable: document["user-invocable"] ?? true,
      modelInvocable: !(document["model-invocable"] === false || document["disable-model-invocation"] === true),
      hasScripts: existsSync(join(bundlesDirectory, document._meta.directory, "scripts")),
    };
  },
});

/** A how-to guide that sits next to a skill's SKILL.md: `<bundle>/skills/[<category>/]<skill>/how-to-*.md`. */
const skillHowTos = defineCollection({
  name: "skillHowTos",
  directory: bundlesDirectory,
  include: "*/skills/**/how-to-*.md",
  exclude: "**/node_modules/**",
  schema: z.object({ title: z.string(), content: z.string() }),
  transform: async (document, context) => ({
    ...document,
    bundle: document._meta.directory.split("/")[0] ?? "",
    // Matches `path` of the skill in the same folder. A guide in a skill's subfolder matches no skill and is not shown.
    skillPath: document._meta.directory,
    html: await compileDocument(context, document, `${skillSource(document._meta.directory)}/`),
  }),
});

const bundleAgents = defineCollection({
  name: "bundleAgents",
  directory: bundlesDirectory,
  include: "*/agents/*.md",
  parser: "frontmatter-only",
  schema: z.object({ name: z.string(), description: z.string().optional(), tools: z.string().optional() }),
  transform: (document) => ({
    name: document.name,
    description: document.description ?? "",
    tools: document.tools ?? "all tools",
    bundle: document._meta.directory.split("/")[0] ?? "",
  }),
});

const hookCommand = z.object({ type: z.string(), command: z.string() });

const bundleHooks = defineCollection({
  name: "bundleHooks",
  directory: bundlesDirectory,
  include: "*/hooks/hooks.json",
  parser: "yaml",
  schema: z.object({
    hooks: z.record(z.string(), z.array(z.object({ matcher: z.string().optional(), hooks: z.array(hookCommand) }))),
  }),
  transform: (document) => ({
    bundle: document._meta.directory.split("/")[0] ?? "",
    // One row for each command, so the reference table needs no nesting.
    commands: Object.entries(document.hooks).flatMap(([event, groups]) =>
      groups.flatMap((group) =>
        group.hooks.map((hook) => ({ event, matcher: group.matcher ?? null, command: hook.command })),
      ),
    ),
  }),
});

/** `<bundle>/skills/<skill>/...` gives the bundle and skill that a skill page file belongs to. */
function skillOf(directory: string) {
  const parts = directory.split("/");
  return { bundle: parts[0] ?? "", skill: parts[2] ?? "" };
}

/** A dedicated page for one skill: `content/bundles/<bundle>/skills/<skill>/page.md`, served at `/bundles/<bundle>/skill/<skill>`. */
const skillPages = defineCollection({
  name: "skillPages",
  directory: "content/bundles",
  include: "*/skills/*/page.md",
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
    ...skillOf(document._meta.directory),
    html: await compileDocument(context, document),
  }),
});

const skillSourceNotes = defineCollection({
  name: "skillSourceNotes",
  directory: "content/bundles",
  include: "*/skills/*/source-note.md",
  schema: z.object({ label: z.string(), content: z.string() }),
  transform: async (document, context) => ({
    ...document,
    ...skillOf(document._meta.directory),
    html: await compileDocument(context, document),
  }),
});

const skillDiagrams = defineCollection({
  name: "skillDiagrams",
  directory: "content/bundles",
  include: "*/skills/*/diagrams/*.md",
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
    ...skillOf(document._meta.directory),
    html: await compileDocument(context, document),
  }),
});

export default defineConfig({
  content: [
    navigation,
    landing,
    sections,
    entries,
    redirectConfig,
    harnessSupport,
    bundlesHub,
    bundleDocs,
    bundleManifests,
    bundleSkills,
    skillHowTos,
    bundleAgents,
    bundleHooks,
    skillPages,
    skillSourceNotes,
    skillDiagrams,
  ],
});
