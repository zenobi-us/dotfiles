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
import { SettingsManager } from "@mariozechner/pi-coding-agent";
import { fileURLToPath } from "node:url";

import { createRequire } from "node:module";
import { pathToKebabName } from "../core/strings.js";
import { formatSkillsForPrompt } from "./systemprompt.js";
import { createSkillWatcher } from "./skill-watcher.js";

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

function resolvePackageSkillPaths(agentDir: string): string[] {
  const skillPaths: string[] = [];

  try {
    const settingsManager = SettingsManager.create(undefined, agentDir);
    const packageSources = settingsManager.getPackages();

    for (const source of packageSources) {
      if (!source || typeof source !== "string") continue;
      skillPaths.push(...resolvePackage(source, agentDir));
    }
  } catch {
    // Ignore settings loading errors and keep existing default behavior.
  }

  return skillPaths;
}

function resolvePackage(source: string, agentDir: string): string[] {
  const packageUri = new URL(source, `file://${agentDir}/`);
  switch (packageUri.protocol) {
    case "npm:":
      return resolveNpmPackage(source, agentDir);
    case "ssh:":
    case "git:":
    case "http:":
    case "https:":
      return resolveGitPackage(source, agentDir);
    case "file:":
      return resolveLocalPackage(fileURLToPath(packageUri), agentDir);
    default:
      return resolveLocalPackage(source, agentDir);
  }
}

function parsePackageNameFromSource(source: string): string | null {
  const trimmed = source.trim();
  const spec = trimmed.startsWith("npm:") ? trimmed.slice(4) : trimmed;

  if (!spec || /^(git:|ssh:|https?:)/.test(spec)) return null;

  if (spec.startsWith("@")) {
    const slash = spec.indexOf("/");
    if (slash <= 1) return null;
    const versionAt = spec.indexOf("@", slash + 1);
    return versionAt === -1 ? spec : spec.slice(0, versionAt);
  }

  const versionAt = spec.indexOf("@");
  return versionAt === -1 ? spec : spec.slice(0, versionAt);
}

function stripGitRef(spec: string): string {
  const lastAt = spec.lastIndexOf("@");
  const boundary = Math.max(spec.lastIndexOf("/"), spec.lastIndexOf(":"));
  if (lastAt > boundary) return spec.slice(0, lastAt);
  return spec;
}

function parseGitInstallKey(
  source: string,
): { host: string; path: string } | null {
  const trimmed = source.trim();
  const withoutPrefix = trimmed.startsWith("git:") ? trimmed.slice(4) : trimmed;
  const withoutRef = stripGitRef(withoutPrefix);

  let host = "";
  let path = "";

  if (/^(https?:|ssh:|git:\/\/)/.test(withoutRef)) {
    try {
      const parsed = new URL(withoutRef);
      host = parsed.hostname;
      path = parsed.pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  } else if (/^[^@\s]+@[^:]+:.+/.test(withoutRef)) {
    const at = withoutRef.indexOf("@");
    const colon = withoutRef.indexOf(":", at + 1);
    if (colon === -1) return null;
    host = withoutRef.slice(at + 1, colon);
    path = withoutRef.slice(colon + 1);
  } else {
    const firstSlash = withoutRef.indexOf("/");
    if (firstSlash === -1) return null;
    host = withoutRef.slice(0, firstSlash);
    path = withoutRef.slice(firstSlash + 1);
  }

  const normalizedPath = path
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/, "");

  if (!host || !normalizedPath) return null;
  return { host, path: normalizedPath };
}

function resolveGitPackage(source: string, agentDir: string): string[] {
  const key = parseGitInstallKey(source);
  if (!key) return [];

  const candidateRoots = new Set<string>([
    join(agentDir, "git", key.host, key.path),
    join(process.cwd(), CONFIG_DIR_NAME, "git", key.host, key.path),
  ]);

  const output = new Set<string>();
  for (const packageRoot of candidateRoots) {
    if (!existsSync(packageRoot)) continue;
    for (const skillPath of resolveLocalPackage(packageRoot, agentDir)) {
      output.add(skillPath);
    }
  }

  return Array.from(output);
}

function resolveNpmPackage(source: string, baseDir: string): string[] {
  const packageName = parsePackageNameFromSource(source);
  if (!packageName) return [];
  const candidateRoots = new Set<string>();

  try {
    const req = createRequire(join(baseDir, "package.json"));
    const resolvedPackageJsonPath = req.resolve(`${packageName}/package.json`);
    candidateRoots.add(dirname(resolvedPackageJsonPath));
  } catch {
    // continue with path fallbacks
  }

  const nodeGlobalRoot = resolve(
    dirname(process.execPath),
    "..",
    "lib",
    "node_modules",
  );
  candidateRoots.add(join(nodeGlobalRoot, packageName));
  candidateRoots.add(
    join(homedir(), CONFIG_DIR_NAME, "agent", "npm", "node_modules", packageName),
  );
  candidateRoots.add(
    join(process.cwd(), CONFIG_DIR_NAME, "npm", "node_modules", packageName),
  );

  const output = new Set<string>();
  for (const packageRoot of candidateRoots) {
    if (!existsSync(packageRoot)) continue;
    for (const skillPath of resolveLocalPackage(packageRoot, baseDir)) {
      output.add(skillPath);
    }
  }

  return Array.from(output);
}

function resolveLocalPackage(source: string, baseDir: string): string[] {
  const output: string[] = [];

  const normalizedSource = normalizePath(source);
  const packageRoot = isAbsolute(normalizedSource)
    ? normalizedSource
    : resolve(baseDir, normalizedSource);

  if (!existsSync(packageRoot)) return output;

  const packageJsonPath = join(packageRoot, "package.json");

  if (!existsSync(packageJsonPath)) {
    return output;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const declaredSkills = packageJson?.pi?.skills;

    if (!Array.isArray(declaredSkills)) {
      output.push(join(packageRoot, "skills"));
      return output;
    }

    for (const declaredPath of declaredSkills) {
      if (typeof declaredPath !== "string") continue;
      const candidate = resolve(packageRoot, declaredPath);
      if (!existsSync(candidate)) continue;
      output.push(candidate);
    }
  } catch {
    // Ignore malformed package.json and try fallback.
    return output;
  }

  return output;
}

function loadSkillFromFile(filePath: string): {
  skill: Skill | null;
  diagnostics: SkillDiagnostic[];
} {
  const diagnostics: SkillDiagnostic[] = [];

  try {
    const rawContent = readFileSync(filePath, "utf-8");
    const { frontmatter } = parseFrontmatter(rawContent);

    const skillDir = dirname(filePath);
    const parentDirName = basename(skillDir);
    // the path should contain the word "skills" to be considered a skill root, otherwise we treat the parent dir as the skill root for name validation and qualified name generation
    const parentSkillRoot = skillDir.substring(
      0,
      skillDir.lastIndexOf("skills") + "skills".length,
    );
    const relativeToRoot = relative(parentSkillRoot, filePath);

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
    const qualifiedName = pathToKebabName(relativeToRoot) || name;

    return {
      skill: {
        name,
        qualifiedName,
        description: frontmatter.description as string,
        filePath,
        baseDir: skillDir,
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

function loadSkillsFromDirInternal(dir: string, includeRootFiles: boolean) {
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
        const subResult = loadSkillsFromDirInternal(fullPath, false);
        skills.push(...subResult.skills);
        diagnostics.push(...subResult.diagnostics);
        continue;
      }

      if (!isFile) continue;

      const isRootMd = includeRootFiles && entry.name.endsWith(".md");
      const isSkillMd = !includeRootFiles && entry.name === "SKILL.md";

      if (!isRootMd && !isSkillMd) continue;

      const result = loadSkillFromFile(fullPath);
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
  includeDefaults?: boolean;
  lazySkills?: boolean;
}

export function resolveSkillRoots(
  options: {
    cwd?: string;
    agentDir?: string;
    includeDefaults?: boolean;
  } = {},
): string[] {
  const {
    cwd = process.cwd(),
    agentDir = join(homedir(), CONFIG_DIR_NAME, "agent"),
    includeDefaults = true,
  } = options;

  if (!includeDefaults) return [];

  const userSkillsDir = join(agentDir, "skills");
  const projectSkillsDir = resolve(cwd, CONFIG_DIR_NAME, "skills");
  const packageSkillDirs = resolvePackageSkillPaths(agentDir);

  return [...packageSkillDirs, userSkillsDir, projectSkillsDir];
}

type SkillRegistryInternal = {
  skills: Map<string, Skill>;
  realPathSet: Set<string>;
  allDiagnostics: SkillDiagnostic[];
  collisionDiagnostics: SkillDiagnostic[];
  skillPromptBlock: string;
};

export function createSkillRegistry() {
  const registry: SkillRegistryInternal = {
    skills: new Map<string, Skill>(),
    realPathSet: new Set<string>(),
    allDiagnostics: [],
    collisionDiagnostics: [],
    skillPromptBlock: "",
  };

  let currentLazySkills: boolean | undefined = false;

  function removeSkillByPath(filePath: string) {
    const existing = Array.from(registry.skills.entries()).find(
      ([, skill]) => skill.filePath === filePath,
    );
    if (!existing) return;

    const [qualifiedName, skill] = existing;
    registry.skills.delete(qualifiedName);

    try {
      const realPath = realpathSync(skill.filePath);
      registry.realPathSet.delete(realPath);
    } catch {
      registry.realPathSet.delete(skill.filePath);
    }
  }

  function upsertSkillReplacing(skill: Skill) {
    removeSkillByPath(skill.filePath);

    const existingByQualified = registry.skills.get(skill.qualifiedName);
    if (
      existingByQualified &&
      existingByQualified.filePath !== skill.filePath
    ) {
      removeSkillByPath(existingByQualified.filePath);
    }

    registry.skills.set(skill.qualifiedName, skill);
    try {
      const realPath = realpathSync(skill.filePath);
      registry.realPathSet.add(realPath);
    } catch {
      registry.realPathSet.add(skill.filePath);
    }
  }

  const watcher = createSkillWatcher({
    onBatch(changes) {
      for (const change of changes) {
        if (change.type === "unlink") {
          removeSkillByPath(change.path);
          continue;
        }

        removeSkillByPath(change.path);
        const result = loadSkillFromFile(change.path);
        registry.allDiagnostics.push(...result.diagnostics);
        if (result.skill) {
          upsertSkillReplacing(result.skill);
        }
      }
      registry.skillPromptBlock = formatSkillsForPrompt(registry.skills, {
        lazySkills: currentLazySkills,
      });
    },
  });

  function addSkills(result: {
    skills: Skill[];
    diagnostics: SkillDiagnostic[];
  }) {
    registry.allDiagnostics.push(...result.diagnostics);

    for (const skill of result.skills) {
      let realPath: string;
      try {
        realPath = realpathSync(skill.filePath);
      } catch {
        realPath = skill.filePath;
      }

      if (registry.realPathSet.has(realPath)) continue;

      const existing = registry.skills.get(skill.qualifiedName);
      if (existing) {
        registry.collisionDiagnostics.push({
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
        registry.skills.set(skill.qualifiedName, skill);
        registry.realPathSet.add(realPath);
      }
    }
  }

  const load = async (options: LoadSkillsOptions = {}) => {
    await watcher.dispose();
    const {
      cwd = process.cwd(),
      agentDir = join(homedir(), CONFIG_DIR_NAME, "agent"),
      includeDefaults = true,
    } = options;

    currentLazySkills = options.lazySkills;
    registry.allDiagnostics = [];
    registry.collisionDiagnostics = [];
    registry.skills.clear();
    registry.realPathSet.clear();
    const dirs = resolveSkillRoots({ cwd, agentDir, includeDefaults });
    for (const packageSkillDir of dirs) {
      addSkills(loadSkillsFromDirInternal(packageSkillDir, true));
    }

    watcher.start(dirs);
    registry.skillPromptBlock = formatSkillsForPrompt(registry.skills, {
      lazySkills: currentLazySkills,
    });
  };

  const dispose = async () => {
    registry.skills.clear();
    registry.realPathSet.clear();
    registry.allDiagnostics = [];
    registry.collisionDiagnostics = [];
    await watcher.dispose();
  };

  return {
    load,
    dispose,
    get skills(): Skill[] {
      return Array.from(registry.skills.values());
    },
    skillMap: registry.skills,
    get systemPromptBlock(): string {
      return registry.skillPromptBlock;
    },
    get diagnostics(): SkillDiagnostic[] {
      return [...registry.allDiagnostics, ...registry.collisionDiagnostics];
    },
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

type FindSkillOptions = {
  requestedName: string;
  usedShortnameFallback: boolean;
  suggestedQualifiedNames?: string[];
};

export type ResolvedSkill =
  | { kind: "found"; skill: Skill; options?: FindSkillOptions }
  | { kind: "ambiguous"; skill?: undefined; options?: FindSkillOptions }
  | { kind: "not_found"; skill?: undefined; options?: FindSkillOptions };

export function resolveSkill(
  requestedName: string,
  skills: Map<string, Skill>,
): ResolvedSkill {
  const byQualified = skills.get(requestedName);
  if (byQualified) {
    return {
      kind: "found",
      skill: byQualified,
      options: {
        requestedName,
        usedShortnameFallback: false,
      }
    };
  }

  const matchingSkills = Array.from(skills.values()).filter(
    (s) => s.name === requestedName,
  );
  if (matchingSkills.length === 1) {
    return {
      kind: "found",
      skill: matchingSkills[0],
      options: {
        usedShortnameFallback: true,
        requestedName,
        suggestedQualifiedNames: [matchingSkills[0].qualifiedName],
      }
    };
  }

  if (matchingSkills.length > 1) {
    return {
      kind: "ambiguous",
      options: {
        usedShortnameFallback: true,
        requestedName,
        suggestedQualifiedNames: matchingSkills.map((s) => s.qualifiedName).sort(),
      }
    };
  }

  return { kind: "not_found", options: { requestedName, suggestedQualifiedNames: [], usedShortnameFallback: false } };
}
