import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { pathToKebabName } from "../core/strings.js";

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  "disable-model-invocation"?: boolean;
  [key: string]: unknown;
}

export interface Skill {
  /** Original short name from frontmatter or directory */
  name: string;
  /** Qualified kebab-case name from path (e.g., "experts-data-ai-data-analyst") */
  qualifiedName: string;
  /** Skill description */
  description: string;
  /** Full path to SKILL.md */
  filePath: string;
  /** Directory containing the skill */
  baseDir: string;
  /** Source: "user", "project", or "path" */
  source: string;
  /** If true, hidden from system prompt (only /skill:name works) */
  disableModelInvocation: boolean;
}

export interface SkillDiagnostic {
  type: "warning" | "collision";
  message: string;
  path: string;
  collision?: {
    name: string;
    qualifiedName: string;
    winnerPath: string;
    loserPath: string;
  };
}

export interface LoadSkillsResult {
  skills: Skill[];
  diagnostics: SkillDiagnostic[];
}

const CONFIG_DIR_NAME = ".pi";
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;

function parseFrontmatter(content: string): {
  frontmatter: SkillFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, yamlBlock, body] = match;
  const frontmatter: SkillFrontmatter = {};

  for (const line of yamlBlock.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: string | boolean = line.slice(colonIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function validateName(name: string, parentDirName: string): string[] {
  const errors: string[] = [];

  if (name !== parentDirName) {
    errors.push(
      `name "${name}" does not match parent directory "${parentDirName}"`,
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`name exceeds ${MAX_NAME_LENGTH} characters (${name.length})`);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push(
      "name contains invalid characters (must be lowercase a-z, 0-9, hyphens only)",
    );
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    errors.push("name must not start or end with a hyphen");
  }
  if (name.includes("--")) {
    errors.push("name must not contain consecutive hyphens");
  }

  return errors;
}

function validateDescription(description: string | undefined): string[] {
  const errors: string[] = [];

  if (!description || description.trim() === "") {
    errors.push("description is required");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${description.length})`,
    );
  }

  return errors;
}

function normalizePath(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "~") return homedir();
  if (trimmed.startsWith("~/")) return join(homedir(), trimmed.slice(2));
  if (trimmed.startsWith("~")) return join(homedir(), trimmed.slice(1));
  return trimmed;
}

function resolveSkillPath(p: string, cwd: string): string {
  const normalized = normalizePath(p);
  return isAbsolute(normalized) ? normalized : resolve(cwd, normalized);
}

function loadSkillFromFile(
  filePath: string,
  source: string,
  skillsRoot: string,
): { skill: Skill | null; diagnostics: SkillDiagnostic[] } {
  const diagnostics: SkillDiagnostic[] = [];

  try {
    const rawContent = readFileSync(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(rawContent);

    const skillDir = dirname(filePath);
    const parentDirName = basename(skillDir);

    const descErrors = validateDescription(frontmatter.description);
    for (const error of descErrors) {
      diagnostics.push({ type: "warning", message: error, path: filePath });
    }

    const name = (frontmatter.name as string) || parentDirName;

    const nameErrors = validateName(name, parentDirName);
    for (const error of nameErrors) {
      diagnostics.push({ type: "warning", message: error, path: filePath });
    }

    if (
      !frontmatter.description ||
      (frontmatter.description as string).trim() === ""
    ) {
      return { skill: null, diagnostics };
    }

    const relativeToRoot = relative(skillsRoot, skillDir);
    const qualifiedName = pathToKebabName(relativeToRoot) || name;

    return {
      skill: {
        name,
        qualifiedName,
        description: frontmatter.description as string,
        filePath,
        baseDir: skillDir,
        source,
        disableModelInvocation:
          frontmatter["disable-model-invocation"] === true,
      },
      diagnostics,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "failed to parse skill file";
    diagnostics.push({ type: "warning", message, path: filePath });
    return { skill: null, diagnostics };
  }
}

function loadSkillsFromDirInternal(
  dir: string,
  source: string,
  skillsRoot: string,
  includeRootFiles: boolean,
): LoadSkillsResult {
  const skills: Skill[] = [];
  const diagnostics: SkillDiagnostic[] = [];

  if (!existsSync(dir)) {
    return { skills, diagnostics };
  }

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;

      const fullPath = join(dir, entry.name);

      let isDirectory = entry.isDirectory();
      let isFile = entry.isFile();

      if (entry.isSymbolicLink()) {
        try {
          const stats = statSync(fullPath);
          isDirectory = stats.isDirectory();
          isFile = stats.isFile();
        } catch {
          continue;
        }
      }

      if (isDirectory) {
        const subResult = loadSkillsFromDirInternal(
          fullPath,
          source,
          skillsRoot,
          false,
        );
        skills.push(...subResult.skills);
        diagnostics.push(...subResult.diagnostics);
        continue;
      }

      if (!isFile) continue;

      const isRootMd = includeRootFiles && entry.name.endsWith(".md");
      const isSkillMd = !includeRootFiles && entry.name === "SKILL.md";

      if (!isRootMd && !isSkillMd) continue;

      const result = loadSkillFromFile(fullPath, source, skillsRoot);
      if (result.skill) {
        skills.push(result.skill);
      }
      diagnostics.push(...result.diagnostics);
    }
  } catch {
    // Directory read error
  }

  return { skills, diagnostics };
}

export interface LoadSkillsOptions {
  cwd?: string;
  agentDir?: string;
  skillPaths?: string[];
  includeDefaults?: boolean;
}

export function loadSkills(options: LoadSkillsOptions = {}): LoadSkillsResult {
  const {
    cwd = process.cwd(),
    agentDir = join(homedir(), CONFIG_DIR_NAME, "agent"),
    skillPaths = [],
    includeDefaults = true,
  } = options;

  const skillMap = new Map<string, Skill>();
  const realPathSet = new Set<string>();
  const allDiagnostics: SkillDiagnostic[] = [];
  const collisionDiagnostics: SkillDiagnostic[] = [];

  function addSkills(result: LoadSkillsResult) {
    allDiagnostics.push(...result.diagnostics);

    for (const skill of result.skills) {
      let realPath: string;
      try {
        realPath = realpathSync(skill.filePath);
      } catch {
        realPath = skill.filePath;
      }

      if (realPathSet.has(realPath)) continue;

      const existing = skillMap.get(skill.qualifiedName);
      if (existing) {
        collisionDiagnostics.push({
          type: "collision",
          message: `qualified name "${skill.qualifiedName}" collision`,
          path: skill.filePath,
          collision: {
            name: skill.name,
            qualifiedName: skill.qualifiedName,
            winnerPath: existing.filePath,
            loserPath: skill.filePath,
          },
        });
      } else {
        skillMap.set(skill.qualifiedName, skill);
        realPathSet.add(realPath);
      }
    }
  }

  if (includeDefaults) {
    const userSkillsDir = join(agentDir, "skills");
    const projectSkillsDir = resolve(cwd, CONFIG_DIR_NAME, "skills");

    addSkills(
      loadSkillsFromDirInternal(userSkillsDir, "user", userSkillsDir, true),
    );
    addSkills(
      loadSkillsFromDirInternal(
        projectSkillsDir,
        "project",
        projectSkillsDir,
        true,
      ),
    );
  }

  for (const rawPath of skillPaths) {
    const resolvedPath = resolveSkillPath(rawPath, cwd);

    if (!existsSync(resolvedPath)) {
      allDiagnostics.push({
        type: "warning",
        message: "skill path does not exist",
        path: resolvedPath,
      });
      continue;
    }

    try {
      const stats = statSync(resolvedPath);

      if (stats.isDirectory()) {
        addSkills(
          loadSkillsFromDirInternal(resolvedPath, "path", resolvedPath, true),
        );
      } else if (stats.isFile() && resolvedPath.endsWith(".md")) {
        const result = loadSkillFromFile(
          resolvedPath,
          "path",
          dirname(resolvedPath),
        );
        if (result.skill) {
          addSkills({
            skills: [result.skill],
            diagnostics: result.diagnostics,
          });
        } else {
          allDiagnostics.push(...result.diagnostics);
        }
      } else {
        allDiagnostics.push({
          type: "warning",
          message: "skill path is not a markdown file",
          path: resolvedPath,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "failed to read skill path";
      allDiagnostics.push({ type: "warning", message, path: resolvedPath });
    }
  }

  return {
    skills: Array.from(skillMap.values()),
    diagnostics: [...allDiagnostics, ...collisionDiagnostics],
  };
}
export function readSkillContent(skill: Skill): string {
  try {
    const content = readFileSync(skill.filePath, "utf-8");
    const { body } = parseFrontmatter(content);
    return body;
  } catch {
    return "";
  }
}

export type ResolvedSkill =
  | { kind: "found"; skill: Skill; usedShortnameFallback: boolean }
  | { kind: "ambiguous"; requestedName: string; options: string[] }
  | { kind: "not_found"; requestedName: string };

export function resolveSkill(
  requestedName: string,
  skills: Skill[],
  skillsByQualifiedName: Map<string, Skill>,
): ResolvedSkill {
  const byQualified = skillsByQualifiedName.get(requestedName);
  if (byQualified) {
    return {
      kind: "found",
      skill: byQualified,
      usedShortnameFallback: false,
    };
  }

  const matchingSkills = skills.filter((s) => s.name === requestedName);
  if (matchingSkills.length === 1) {
    return {
      kind: "found",
      skill: matchingSkills[0],
      usedShortnameFallback: true,
    };
  }

  if (matchingSkills.length > 1) {
    return {
      kind: "ambiguous",
      requestedName,
      options: matchingSkills.map((s) => s.qualifiedName).sort(),
    };
  }

  return { kind: "not_found", requestedName };
}
