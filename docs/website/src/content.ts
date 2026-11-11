// Shared summaries and authored site content live here. Full skill documents load
// separately, so the index does not bundle every skill's instructions.
import {
  allBundleAgents,
  allBundleDocs,
  allBundleHooks,
  allBundleManifests,
  allBundleSkills,
  allSkillDiagrams,
  allSkillHowTos,
  allSkillPages,
  allSkillSourceNotes,
  allEntries,
  allSections,
  bundlesHub,
  harnessSupport,
  landing,
  navigation,
  redirectConfig,
  type BundleDoc,
  type BundleSkill,
  type Section,
} from "../.content-collections/generated";
import { loadSkillDocument } from "./skill-documents";

export type {
  BundleDoc,
  BundleSkill,
  Entry,
  Section,
  SkillDiagram,
  SkillHowTo,
  SkillPage,
} from "../.content-collections/generated";
export { bundlesHub, harnessSupport, landing, navigation, redirectConfig };

const byFilePath = (a: { _meta: { filePath: string } }, b: { _meta: { filePath: string } }) =>
  a._meta.filePath.localeCompare(b._meta.filePath);

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

/** Sections in folder-name order. */
export const sections = allSections.toSorted(byFilePath);

/** The entries in a section's folder, in file-name order. */
export function entriesOf(section: Section) {
  return allEntries.filter((entry) => entry._meta.directory === section._meta.directory).toSorted(byFilePath);
}

/** Agent bundles, one for each `.claude-plugin/plugin.json`, by name. */
export const bundles = allBundleManifests.toSorted(byName);

/** Everything one bundle page shows. Returns undefined for a name that is not a bundle. */
export function bundleOf(name: string) {
  const manifest = bundles.find((bundle) => bundle.name === name);
  if (!manifest) return undefined;
  const skills = allBundleSkills.filter((skill) => skill.bundle === name).toSorted(byName);
  const categories = new Map<string, BundleSkill[]>();
  for (const skill of skills) categories.set(skill.category, [...(categories.get(skill.category) ?? []), skill]);
  return {
    manifest,
    skills,
    // Categories by name, with "general" (skills with no category folder) first.
    categories: [...categories.entries()].toSorted(([a], [b]) =>
      a === "general" ? -1 : b === "general" ? 1 : a.localeCompare(b),
    ),
    agents: allBundleAgents.filter((agent) => agent.bundle === name).toSorted(byName),
    hooks: allBundleHooks.filter((hooks) => hooks.bundle === name).flatMap((hooks) => hooks.commands),
    docs: allBundleDocs.filter((doc) => doc.bundle === name).toSorted(byFilePath),
  };
}

export type Bundle = NonNullable<ReturnType<typeof bundleOf>>;

/** The docs of one Diátaxis kind for a bundle, in file-name order. */
export function docsOfKind(bundle: Bundle, kind: BundleDoc["kind"]) {
  return bundle.docs.filter((doc) => doc.kind === kind);
}

/** The bundle parts (skills, agents, hooks) that a bundle has, with the harnesses that load each one. */
export function partsOf(bundle: Bundle) {
  const counts: Record<string, number> = {
    skills: bundle.skills.length,
    agents: bundle.agents.length,
    hooks: bundle.hooks.length,
  };
  return harnessSupport.parts.filter((part) => (counts[part.id] ?? 0) > 0);
}

/** Who can start a skill: the user with a slash command, the agent by itself, or both. */
export function invocationOf(skill: BundleSkill) {
  if (skill.userInvocable && skill.modelInvocable) return "user and agent";
  if (skill.userInvocable) return "user only";
  return "agent only";
}

/** All guides next to one installed skill, in file-name order. */
export function howTosOfSkill(skill: BundleSkill) {
  return allSkillHowTos.filter((guide) => guide.skillPath === skill.path).toSorted(byFilePath);
}

/** Every installed skill has a page. Hand-written diagrams and notes remain supplementary. */
export async function skillPageOf(bundle: string, name: string) {
  const skill = allBundleSkills.find((candidate) => candidate.bundle === bundle && candidate.name === name);
  if (!skill) return undefined;
  const document = await loadSkillDocument(bundle, name);
  return {
    skill: { ...skill, ...document },
    page: allSkillPages.find((candidate) => candidate.bundle === bundle && candidate.skill === name),
    howTos: howTosOfSkill(skill),
    diagrams: allSkillDiagrams
      .filter((diagram) => diagram.bundle === bundle && diagram.skill === name)
      .toSorted(byFilePath),
    sourceNote: allSkillSourceNotes.find((note) => note.bundle === bundle && note.skill === name),
  };
}
