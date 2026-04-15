import {
  readSkillContent,
  resolveSkill,
  type Skill,
} from "../service/skill-registry.js";
import path from "path";

function dedent(strings: TemplateStringsArray, ...values: string[]): string {
  const raw = strings.reduce((acc, str, idx) => acc + str + (values[idx] ?? ""), "");
  const lines = raw.split("\n");
  const minIndent = lines.reduce((min, line) => {
    if (line.trim() === "") return min;
    const indent = line.match(/^ */)?.[0].length ?? 0;
    return min === null ? indent : Math.min(min, indent);
  }, null as number | null);

  if (minIndent && minIndent > 0) {
    return lines.map(line => line.slice(minIndent)).join("\n");
  }
  return raw;
}


const createPathReplacer = (type: 'skills' | 'references' | 'assets', baseDir: string) => {

  // regexp pattern that covers: 
  //  skills/foo/bar.txt
  //  ./skills/foo/bar.txt
  const pattern = new RegExp(`(?:\\.\\/)?${type}\\/([^\\s'"]+)`, 'g');


  // replacer that turns the above paths into a string that points to the original file, e.g.
  // skills/foo/bar.txt -> /actual/path/to/skills/foo/bar.txt
  // ./skills/foo/bar.txt -> /actual/path/to/skills/foo/bar.txt
  const replacer = (_match: string, p1: string) => {
    return path.join(baseDir, type, p1);
  };

  return {
    pattern,
    replacer,
  }
}

export function formatReadSkillOutput(skill: Skill, body: string): string {

  const scriptsPathReplacer = createPathReplacer('scripts', skill.baseDir);
  const referencePathReplacer = createPathReplacer('references', skill.baseDir);
  const assetPathReplacer = createPathReplacer('assets', skill.baseDir);
 
  return dedent`
     ---
     qualified_name: ${skill.qualifiedName}
     shortname: ${skill.name}
     location: ${skill.filePath}
     base_dir: ${skill.baseDir}
     scripts_dir: ${path.join(skill.baseDir, "scripts")}
     references_dir: ${path.join(skill.baseDir, "references")}
     assets_dir: ${path.join(skill.baseDir, "assets")}
     ---
     ${body.trim()
       .replace(scriptsPathReplacer.pattern, scriptsPathReplacer.replacer)
       .replace(referencePathReplacer.pattern, referencePathReplacer.replacer)
       .replace(assetPathReplacer.pattern, assetPathReplacer.replacer)
     }
  `;
 
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
