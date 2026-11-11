import type { SkillDocumentContent } from "./lib/skill-document";

const documents = import.meta.glob<{ default: SkillDocumentContent }>(
  "../.content-collections/skill-documents/*/*.json",
);

export async function loadSkillDocument(bundle: string, name: string): Promise<SkillDocumentContent> {
  const load = documents[`../.content-collections/skill-documents/${bundle}/${name}.json`];
  if (!load) throw new Error(`Skill document is missing from the build: ${bundle}/${name}`);
  return (await load()).default;
}
