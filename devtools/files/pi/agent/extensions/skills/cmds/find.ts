import type { Skill } from "../service/skill-registry.js";

export function parseSkillQuery(query: string | string[]): {
  include: string[];
  exclude: string[];
  listAll: boolean;
} {
  const raw = (Array.isArray(query) ? query : [query]).join(" ").trim();

  if (!raw || raw === "*") {
    return { include: [], exclude: [], listAll: true };
  }

  const parts = raw
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const include: string[] = [];
  const exclude: string[] = [];

  for (const part of parts) {
    if (part.startsWith("-") && part.length > 1) {
      exclude.push(part.slice(1).toLowerCase());
      continue;
    }
    include.push(part.toLowerCase());
  }

  return { include, exclude, listAll: include.length === 0 };
}

export function searchSkills(skills: Skill[], query: string | string[]) {
  const parsed = parseSkillQuery(query);
  const visibleSkills = skills.filter((s) => !s.disableModelInvocation);

  let matches = visibleSkills;

  if (!parsed.listAll) {
    matches = matches.filter((skill) => {
      const haystack =
        `${skill.qualifiedName} ${skill.name} ${skill.description}`.toLowerCase();
      return parsed.include.every((term) => haystack.includes(term));
    });
  }

  if (parsed.exclude.length > 0) {
    matches = matches.filter((skill) => {
      const haystack =
        `${skill.qualifiedName} ${skill.name} ${skill.description}`.toLowerCase();
      return !parsed.exclude.some((term) => haystack.includes(term));
    });
  }

  return {
    query,
    skills: matches.map((skill) => ({
      name: skill.qualifiedName,
      shortname: skill.name,
      description: skill.description,
      location: skill.filePath,
    })),
    summary: {
      total: visibleSkills.length,
      matches: matches.length,
      feedback:
        matches.length === 0
          ? "No skills matched. Try broader terms or query '*' to list all skills."
          : parsed.listAll
            ? `Listing all ${matches.length} skills`
            : `Found ${matches.length} matching skill(s)`,
    },
  };
}
