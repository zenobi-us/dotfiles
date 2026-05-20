import dedent from "dedent";
import { Skill } from "./skill-registry";
import { escapeXml } from "../core/strings";

export function injectSkillsIntoSystemPrompt(
  systemPrompt: string,
  skillPromptBlock: string,
): string {
  const cleanedPrompt = systemPrompt
    .replace(/\n?<available_skills>[\s\S]*?<\/available_skills>\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  const promptWithSkillsBeforeDate = cleanedPrompt.replace(
    /(\nCurrent date:\s*\d{4}-\d{2}-\d{2})/,
    `${skillPromptBlock}$1`,
  );

  return promptWithSkillsBeforeDate === cleanedPrompt
    ? cleanedPrompt + skillPromptBlock
    : promptWithSkillsBeforeDate;
}

export function formatSkillsForPrompt(
  skills: Map<string, Skill>,
  options: { lazySkills?: boolean } = {},
): string {
  const visibleSkills = Array.from(skills.values()).filter(
    (s) => !s.disableModelInvocation,
  );

  if (visibleSkills.length === 0) {
    return "";
  }

  if (options.lazySkills) {
    return `\n\n${dedent`
      ## Skills

      - Skills are available, but lazySkills=true so the full catalog is omitted from this prompt.
            - Use the find_skills tool to discover relevant skills and the read_skill tool to load one by name.
                `}`;
  }

  const lines = [
    "\n\nThe following skills provide specialized instructions for specific tasks.",
    "Use the read tool to load a skill's file when the task matches its description.",
    "When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md / dirname of the path) and use that absolute path in tool commands.",
    "",
    "<available_skills>",
  ];

  for (const skill of visibleSkills) {
    lines.push("  <skill>");
    lines.push(`    <name>${escapeXml(skill.qualifiedName)}</name>`);
    lines.push(`    <shortname>${escapeXml(skill.name)}</shortname>`);
    lines.push(
      `    <description>${escapeXml(skill.description)}</description>`,
    );
    lines.push(`    <location>${escapeXml(skill.filePath)}</location>`);
    lines.push("  </skill>");
  }

  lines.push("</available_skills>");
  return lines.join("\n");
}
