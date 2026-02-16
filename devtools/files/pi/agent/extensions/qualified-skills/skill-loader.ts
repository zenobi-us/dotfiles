/**
 * Custom skill loader with qualified kebab-case names from paths
 *
 * Example: skills/experts/data-ai/data-analyst/SKILL.md
 *   -> qualifiedName: "experts-data-ai-data-analyst"
 *   -> name: "data-analyst"
 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

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

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, yamlBlock, body] = match;
  const frontmatter: SkillFrontmatter = {};

  // Simple YAML parsing for key: value pairs
  for (const line of yamlBlock.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: string | boolean = line.slice(colonIdx + 1).trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Handle booleans
    else if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Convert path to kebab-case qualified name
 * e.g., "experts/data-ai/data-analyst" -> "experts-data-ai-data-analyst"
 */
function pathToKebabName(relativePath: string): string {
  return relativePath
    .split(/[/\\]/)
    .filter(Boolean)
    .join("-");
}

/**
 * Validate skill name per Agent Skills spec
 */
function validateName(name: string, parentDirName: string): string[] {
  const errors: string[] = [];

  if (name !== parentDirName) {
    errors.push(`name "${name}" does not match parent directory "${parentDirName}"`);
  }
  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`name exceeds ${MAX_NAME_LENGTH} characters (${name.length})`);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push(`name contains invalid characters (must be lowercase a-z, 0-9, hyphens only)`);
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    errors.push(`name must not start or end with a hyphen`);
  }
  if (name.includes("--")) {
    errors.push(`name must not contain consecutive hyphens`);
  }

  return errors;
}

/**
 * Validate description per Agent Skills spec
 */
function validateDescription(description: string | undefined): string[] {
  const errors: string[] = [];

  if (!description || description.trim() === "") {
    errors.push("description is required");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${description.length})`);
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

interface LoadFromDirOptions {
  dir: string;
  source: string;
  skillsRoot: string; // Root to compute relative path from
}

function loadSkillFromFile(
  filePath: string,
  source: string,
  skillsRoot: string
): { skill: Skill | null; diagnostics: SkillDiagnostic[] } {
  const diagnostics: SkillDiagnostic[] = [];

  try {
    const rawContent = readFileSync(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(rawContent);

    const skillDir = dirname(filePath);
    const parentDirName = basename(skillDir);

    // Validate description
    const descErrors = validateDescription(frontmatter.description);
    for (const error of descErrors) {
      diagnostics.push({ type: "warning", message: error, path: filePath });
    }

    // Use name from frontmatter, or fall back to parent directory name
    const name = (frontmatter.name as string) || parentDirName;

    // Validate name
    const nameErrors = validateName(name, parentDirName);
    for (const error of nameErrors) {
      diagnostics.push({ type: "warning", message: error, path: filePath });
    }

    // Skip if no description
    if (!frontmatter.description || (frontmatter.description as string).trim() === "") {
      return { skill: null, diagnostics };
    }

    // Compute qualified name from relative path
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
        disableModelInvocation: frontmatter["disable-model-invocation"] === true,
      },
      diagnostics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to parse skill file";
    diagnostics.push({ type: "warning", message, path: filePath });
    return { skill: null, diagnostics };
  }
}

function loadSkillsFromDirInternal(
  dir: string,
  source: string,
  skillsRoot: string,
  includeRootFiles: boolean
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

      // Handle symlinks
      let isDirectory = entry.isDirectory();
      let isFile = entry.isFile();

      if (entry.isSymbolicLink()) {
        try {
          const stats = statSync(fullPath);
          isDirectory = stats.isDirectory();
          isFile = stats.isFile();
        } catch {
          continue; // Broken symlink
        }
      }

      if (isDirectory) {
        const subResult = loadSkillsFromDirInternal(fullPath, source, skillsRoot, false);
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

/**
 * Load skills from all configured locations with qualified names
 */
export function loadSkills(options: LoadSkillsOptions = {}): LoadSkillsResult {
  const {
    cwd = process.cwd(),
    agentDir = join(homedir(), CONFIG_DIR_NAME, "agent"),
    skillPaths = [],
    includeDefaults = true,
  } = options;

  // Use qualifiedName as the key to prevent collisions
  const skillMap = new Map<string, Skill>();
  const realPathSet = new Set<string>();
  const allDiagnostics: SkillDiagnostic[] = [];
  const collisionDiagnostics: SkillDiagnostic[] = [];

  function addSkills(result: LoadSkillsResult) {
    allDiagnostics.push(...result.diagnostics);

    for (const skill of result.skills) {
      // Resolve symlinks to detect duplicates
      let realPath: string;
      try {
        realPath = realpathSync(skill.filePath);
      } catch {
        realPath = skill.filePath;
      }

      if (realPathSet.has(realPath)) continue;

      // Use qualifiedName for collision detection
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

    addSkills(loadSkillsFromDirInternal(userSkillsDir, "user", userSkillsDir, true));
    addSkills(loadSkillsFromDirInternal(projectSkillsDir, "project", projectSkillsDir, true));
  }

  // Handle explicit skill paths
  for (const rawPath of skillPaths) {
    const resolvedPath = resolveSkillPath(rawPath, cwd);

    if (!existsSync(resolvedPath)) {
      allDiagnostics.push({ type: "warning", message: "skill path does not exist", path: resolvedPath });
      continue;
    }

    try {
      const stats = statSync(resolvedPath);

      if (stats.isDirectory()) {
        addSkills(loadSkillsFromDirInternal(resolvedPath, "path", resolvedPath, true));
      } else if (stats.isFile() && resolvedPath.endsWith(".md")) {
        const result = loadSkillFromFile(resolvedPath, "path", dirname(resolvedPath));
        if (result.skill) {
          addSkills({ skills: [result.skill], diagnostics: result.diagnostics });
        } else {
          allDiagnostics.push(...result.diagnostics);
        }
      } else {
        allDiagnostics.push({ type: "warning", message: "skill path is not a markdown file", path: resolvedPath });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to read skill path";
      allDiagnostics.push({ type: "warning", message, path: resolvedPath });
    }
  }

  return {
    skills: Array.from(skillMap.values()),
    diagnostics: [...allDiagnostics, ...collisionDiagnostics],
  };
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format skills for system prompt with qualified names
 */
export function formatSkillsForPrompt(skills: Skill[]): string {
  const visibleSkills = skills.filter((s) => !s.disableModelInvocation);

  if (visibleSkills.length === 0) {
    return "";
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
    lines.push(`    <description>${escapeXml(skill.description)}</description>`);
    lines.push(`    <location>${escapeXml(skill.filePath)}</location>`);
    lines.push("  </skill>");
  }

  lines.push("</available_skills>");
  return lines.join("\n");
}

/**
 * Read skill content for injection
 */
export function readSkillContent(skill: Skill): string {
  try {
    const content = readFileSync(skill.filePath, "utf-8");
    const { body } = parseFrontmatter(content);
    return body;
  } catch {
    return "";
  }
}
