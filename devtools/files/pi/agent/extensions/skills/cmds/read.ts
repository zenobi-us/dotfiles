import type { Skill } from "../service/skill-registry.js";

export function formatReadSkillOutput(skill: Skill, body: string): string {
  return `---
qualified_name: ${skill.qualifiedName}
shortname: ${skill.name}
location: ${skill.filePath}
base_dir: ${skill.baseDir}
---

> **Path Resolution**: Scripts, references, and assets use relative paths.
> Resolve from: \`${skill.baseDir}\`
> Example: \`./scripts/foo.sh\` → \`${skill.baseDir}/scripts/foo.sh\`
${body}`;
}

export function buildSkillUserMessage(
  skill: Skill,
  body: string,
  args?: string,
): string {
  const text = formatReadSkillOutput(skill, body);
  return args ? `${text}\n\nUser: ${args}` : text;
}
