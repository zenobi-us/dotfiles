#!/usr/bin/env -S mise x -- bun
// vim: set filetype=typescript:
// deps: npm:typebox
// deps: npm:nconf
// deps: npm:@types/nconf

/**
 * # BasicMemory Project Resolver
 *
 * This cli will help agents use the right basic-memory project based on a path query.
 *
 *
 * ## Usage 
 *
 * Agent should query this cli with a contextual path.
 * 
 * Because basic-memory projects can be associated with any path on the filesystem, we should always request a path query to resolve the right project.
 *
 *
 * ## Glossary 
 *
 * - **Basic Memory Project**:
 *   A project that is associated with a specific path on the filesystem. information is stored as markdown in that path. 
 *
 * - **Context map**:
 *   A mapping of basic-memory projects to associated contextual paths. This map is used to resolve which basic-memory project should be used for a given path query.
 *
 * - **Path Query**:
 *   A query that specifies path(s) on the filesystem that the agent is working with. These might be typescript files, other markdown files, or any other files. The query path is not markdown files in a basic-memory project, but rather the files that an agent is working with. The cli will use the context map to resolve which basic-memory project is most relevant to the query path.
 *
 * If no query path is given, we assume the agents CWD.
 **/

/**
 * TODO:: Create these services:
 *
 * - **Context Map Service**: A service that maintains the context map of basic-memory projects and their associated paths. This service should provide methods to add, remove, and query the context map. 
 *   Its constructor should accept a propmap, where { path = xdg.config('basic-memory')/project-context.json } is the default.
 *
 *   - **Project Resolver Service**: A service that takes a path query and uses the context map to resolve which basic-memory project is most relevant to that query. This service should provide a method that accepts a path query and returns the associated basic-memory project.
 *
 *   - **CLI Interface**: A command-line interface that allows agents to interact with the Project Resolver Service. This CLI should accept a path query as an argument and output the resolved basic-memory project.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import Type from "typebox";
import Value from "typebox/value";
import nconf from "nconf";


const FATAL_MESSAGE = "FATAL: Basic Memory unavailable. exit 1. get an adult.";

/**
 * Print canonical fatal message and terminate with exit code 1.
 */

function fatal(): never {
  console.error(FATAL_MESSAGE);
  process.exit(1);
}

/**
 * Detect whether argv already contains a --project flag and whether its value is valid.
 */

function getExplicitProjectArg(args: string[]): { has: boolean; valid: boolean } {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--project") {
      return { has: true, valid: Boolean(args[i + 1] && !args[i + 1].startsWith("-")) };
    }
    if (a.startsWith("--project=")) {
      return { has: true, valid: a.length > "--project=".length };
    }
  }
  return { has: false, valid: false };
}

/**
 * Resolve context-map config path from XDG config home.
 */

function getContextMapPath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdgConfigHome, "basic-memory", "project-context.json");
}

/**
 * Identify meta commands that should not require project resolution.
 */

function isMetaCommand(args: string[]): boolean {
  return args.includes("--help") || args.includes("-h") || args.includes("--version") || args.includes("-v");
}

type ContextMapEntry = { project: string; paths: string[] };

const ContextMapEntrySchema = Type.Object({
  project: Type.String({ minLength: 1 }),
  paths: Type.Array(Type.String({ minLength: 1 })),
});

const ContextMapArraySchema = Type.Array(ContextMapEntrySchema);
const ContextMapObjectSchema = Type.Object({
  projects: ContextMapArraySchema,
});
const ContextMapSchema = Type.Object({
  projects: ContextMapArraySchema,
});

/**
 * Read context map from disk; missing file resolves to empty map.
 */
function readContextMap(): { projects: ContextMapEntry[] } {
  const contextMapPath = getContextMapPath();
  if (!existsSync(contextMapPath)) return { projects: [] };

  try {
    const parsed = parseContextMap(readFileSync(contextMapPath, "utf8"));
    return { projects: parsed };
  } catch (error) {
    console.error(`Context map parse error at ${contextMapPath}:`, error);
    process.exit(2);
  }
}

/**
 * Sort context map deterministically by project then path.
 */
function sortContextMap(map: { projects: ContextMapEntry[] }): { projects: ContextMapEntry[] } {
  const projects = map.projects
    .map((entry) => ({
      project: entry.project,
      paths: [...new Set(entry.paths)].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.project.localeCompare(b.project));

  return { projects };
}

/**
 * Persist context map atomically.
 */
function writeContextMap(map: { projects: ContextMapEntry[] }): void {
  const contextMapPath = getContextMapPath();
  const parent = dirname(contextMapPath);
  mkdirSync(parent, { recursive: true });

  const normalized = sortContextMap(map);
  if (!Value.Check(ContextMapSchema, normalized)) {
    console.error("Context map validation failed before write.");
    process.exit(2);
  }

  const tmp = `${contextMapPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  renameSync(tmp, contextMapPath);
}

/**
 * Parse a required --flag value pair from argv.
 */
function getRequiredFlagValue(args: string[], flag: string): string {
  const i = args.indexOf(flag);
  if (i === -1 || !args[i + 1] || args[i + 1].startsWith("-")) {
    console.error(`Missing required ${flag} value.`);
    process.exit(2);
  }
  return args[i + 1];
}

/**
 * Parse optional --flag value pair from argv.
 */
function getOptionalFlagValue(args: string[], flag: string): string | null {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  if (!args[i + 1] || args[i + 1].startsWith("-")) {
    console.error(`Invalid ${flag} value.`);
    process.exit(2);
  }
  return args[i + 1];
}

/**
 * Handle `initialise-project --name <name> [--cwd <path>]`.
 */
function handleInitialiseProject(args: string[]): boolean {

  const name = getRequiredFlagValue(args, "--name").trim();
  if (!name) {
    console.error("Missing required --name value.");
    process.exit(2);
  }

  const cwd = normalizePath(getOptionalFlagValue(args, "--cwd") || process.cwd());
  const existingProject = resolveProjectFromContextMap(cwd);
  if (existingProject) {
    console.error(`Context already mapped to project: ${existingProject}`);
    process.exit(1);
  }

  const basePath = process.env.BASIC_MEMORY_PROJECT_PATH || join(homedir(), "Notes");
  if (!basePath.trim()) {
    fatal();
  }

  const localPath = join(resolve(basePath.trim()), name);
  const bm = spawnSync("bm", ["project", "add", "research", "--local-path", localPath], {
    stdio: "inherit",
    env: process.env,
  });

  if (bm.error) fatal();
  if (typeof bm.status === "number" && bm.status !== 0) {
    process.exit(bm.status);
  }

  const projectKey = name;
  const map = readContextMap();
  const existing = map.projects.find((p) => p.project === projectKey);
  if (existing) {
    if (!existing.paths.includes(cwd)) existing.paths.push(cwd);
  } else {
    map.projects.push({ project: projectKey, paths: [cwd] });
  }
  writeContextMap(map);
  return true;
}

/**
 * Handle `context-map list`.
 */
function handleContextMapList(): boolean {
  const map = sortContextMap(readContextMap());
  console.log(JSON.stringify(map, null, 2));
  return true;
}

/**
 * Handle `context-map add --project ... --path ...`.
 */
function handleContextMapAdd(args: string[]): boolean {
  const project = getRequiredFlagValue(args, "--project").trim();
  const contextPath = normalizePath(getRequiredFlagValue(args, "--path"));
  const map = readContextMap();
  const existing = map.projects.find((p) => p.project === project);
  if (existing) {
    if (!existing.paths.includes(contextPath)) existing.paths.push(contextPath);
  } else {
    map.projects.push({ project, paths: [contextPath] });
  }
  writeContextMap(map);
  return true;
}

/**
 * Handle `context-map remove --project ... --path ...`.
 */
function handleContextMapRemove(args: string[]): boolean {
  const project = getRequiredFlagValue(args, "--project").trim();
  const contextPath = normalizePath(getRequiredFlagValue(args, "--path"));
  const map = readContextMap();
  const existing = map.projects.find((p) => p.project === project);
  if (!existing) return true;
  existing.paths = existing.paths.filter((p) => normalizePath(p) !== contextPath);
  map.projects = map.projects.filter((p) => p.project !== project || p.paths.length > 0);
  writeContextMap(map);
  return true;
}

/**
 * Handle `context-map remove-project --project ...`.
 */
function handleContextMapRemoveProject(args: string[]): boolean {
  const project = getRequiredFlagValue(args, "--project").trim();
  const map = readContextMap();
  map.projects = map.projects.filter((p) => p.project !== project);
  writeContextMap(map);
  return true;
}


/**
 * Parse and validate context-map JSON into normalized entries.
 */
function parseContextMap(raw: string): ContextMapEntry[] {
  const parsed: unknown = JSON.parse(raw.trim());

  // accepted shapes:
  // - [{ project, paths }]
  // - { projects: [{ project, paths }] }
  if (Value.Check(ContextMapArraySchema, parsed)) {
    return parsed;
  }

  if (Value.Check(ContextMapObjectSchema, parsed)) {
    return parsed.projects;
  }

  return [];
}

/**
 * Normalize path to absolute form and expand ~/ prefix.
 */

function normalizePath(p: string): string {
  const expanded = p.startsWith("~/") ? join(homedir(), p.slice(2)) : p;
  return resolve(expanded);
}

/**
 * Check whether current path is equal to or nested under a context root path.
 */

function matchesContextRoot(currentPath: string, contextRoot: string): boolean {
  if (currentPath === contextRoot) return true;
  const withSep = contextRoot.endsWith(sep) ? contextRoot : `${contextRoot}${sep}`;
  return currentPath.startsWith(withSep);
}

/**
 * Resolve project from context-map using longest matching context-root prefix.
 */

function resolveProjectFromContextMap(queryPath: string): string | null {
  const map = readContextMap();
  const entries = map.projects;

  const currentPath = normalizePath(queryPath);
  let bestProject: string | null = null;
  let bestLen = -1;

  for (const entry of entries) {
    for (const contextPath of entry.paths) {
      const contextRoot = normalizePath(contextPath);
      if (!matchesContextRoot(currentPath, contextRoot)) continue;
      if (contextRoot.length > bestLen) {
        bestLen = contextRoot.length;
        bestProject = entry.project;
      }
    }
  }

  return bestProject;
}

/**
 * Resolve project using precedence: explicit arg > env var > context-map.
 */

function resolveProject(explicitProjectArgPresent: boolean): string | null {
  if (explicitProjectArgPresent) return null; // explicit wins; no injection

  const fromEnv = process.env.PROJECT_PLANNING_BM_PROJECT;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  const queryPath = process.env.PROJECT_PLANNING_BM_QUERY_PATH || process.cwd();
  return resolveProjectFromContextMap(queryPath);
}

function handleBasicMemoryCommand(argv: string[]) {
  const explicitProject = getExplicitProjectArg(argv);

  if (explicitProject.has && !explicitProject.valid) {
    console.error("Invalid --project argument. Provide a non-empty value.");
    process.exit(2);
  }

  const bmBinary = "basic-memory";
  const project = resolveProject(explicitProject.has);

  // If no explicit project in argv, we MUST resolve one unless this is help/version.
  if (!explicitProject.has && !project && !isMetaCommand(argv)) {
    fatal();
  }

  const forwardedArgs = explicitProject.has || !project ? argv : [...argv, "--project", project];

  const child = spawnSync(bmBinary, forwardedArgs, {
    stdio: "inherit",
    env: process.env,
  });

  if (child.error) {
    fatal();
  }

  if (typeof child.status === "number" && child.status !== 0) {
    process.exit(child.status);
  }
}

/**
 * Entry point: validate args, resolve project, forward to basic-memory, and propagate exit status.
 */

function main() {
  const argv = process.argv.slice(2);

  switch (argv[0]) {
    case "initialise-project":
      handleInitialiseProject(argv.slice(1)) && process.exit(0);
      break;

    case "context-map":
        const action = argv[1];
        const args = argv.slice(2);

      switch (action) {
        case "list":
          handleContextMapList() && process.exit(0);
          break;
        case "add":
          handleContextMapAdd(args) && process.exit(0);
          break;
        case "remove":
          handleContextMapRemove(args) && process.exit(0);
          break;
        case "remove-project":
          handleContextMapRemoveProject(args) && process.exit(0);
          break;
      }
      break;

    default:
      handleBasicMemoryCommand(argv);
  }
}

main();

