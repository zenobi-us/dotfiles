import {
  readSkillContent,
  resolveSkill,
  type Skill,
} from "../service/skill-registry.js";

export function formatReadSkillOutput(skill: Skill, body: string): string {
  return [
    "---",
    `qualified_name: ${skill.qualifiedName}`,
    `shortname: ${skill.name}`,
    `location: ${skill.filePath}`,
    `base_dir: ${skill.baseDir}`,
    "---",
    "",
    "> **Path Resolution**: Skill resources are resolved from `skill_dir`, the absolute path to the skill package root.",
    "> ",
    "> Derived locations:",
    `> - \`skill_dir\`: ${skill.baseDir}`,
    `> - \`script_dir\`: ${skill.baseDir}/scripts`,
    `> - \`references_dir\`: ${skill.baseDir}/references`,
    `> - \`assets_dir\`: ${skill.baseDir}/assets`,
    "> ",
    "> Examples:",
    `> - \`./scripts/foo.sh\` → ${skill.baseDir}/scripts/foo.sh`,
    `> - \`scripts/foo.sh\` → ${skill.baseDir}/scripts/foo.sh`,
    `> - \`references/something.md\` → ${skill.baseDir}/references/something.md`,
    `> - \`ambiguous.xml\` → search within ${skill.baseDir} for the matching file`,
    "",
    body,
  ].join("\n");
}

export function buildSkillUserMessage(
  skill: Skill,
  body: string,
  args?: string,
): string {
  const text = formatReadSkillOutput(skill, body);
  return args ? `${text}\n\nUser: ${args}` : text;
}

export function ReadSkillCommand(
  requestedName: string,
  skillsByQualifiedName: Map<string, Skill>,
) {
  const resolved = resolveSkill(requestedName, skillsByQualifiedName);

  if (resolved.kind === "ambiguous") {
    return {
      ok: false as const,
      error: {
        content: [
          {
            type: "text" as const,
            text:
              `Ambiguous shortname \"${resolved.requestedName}\". ` +
              `Use one of: ${resolved.options.join(", ")}`,
          },
        ],
        details: resolved,
        isError: true,
      },
    };
  }

  if (resolved.kind === "not_found") {
    return {
      ok: false as const,
      error: {
        content: [
          {
            type: "text" as const,
            text: `Skill not found: ${resolved.requestedName}`,
          },
        ],
        details: resolved,
        isError: true,
      },
    };
  }

  const body = readSkillContent(resolved.skill);
  const text = formatReadSkillOutput(resolved.skill, body);

  return {
    ok: true as const,
    value: {
      text,
      body,
      skill: resolved.skill,
      usedShortnameFallback: resolved.usedShortnameFallback,
    },
  };
}
