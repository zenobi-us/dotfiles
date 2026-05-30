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

import { writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import Type from "typebox";
import type { TSchema } from "typebox";
import Value from "typebox/value";
import nconf, { Provider } from "nconf";




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

const ContextMapProjectSchema = Type.Object({
  project: Type.String({ minLength: 1 }),
  paths: Type.Array(Type.String({ minLength: 1 })),
});
type ContextMapProject = Type.Static<typeof ContextMapProjectSchema>;

const ContextMapSchema = Type.Object({
  projects: Type.Array(ContextMapProjectSchema),
});

class ContextMapConfig<T extends typeof ContextMapSchema> extends Provider {
  public schema: T = ContextMapSchema as T

  constructor() {
    super();

    this
      .argv({
        parseValues: true,
      })
      .env()
      .file({
        file: join(homedir(), ".basic-memory", "project-context.json"),
        format: { parse: JSON.parse, stringify: (data) => JSON.stringify(data, null, 2) }
      });
  }

  get(): Type.Static<T> | undefined;
  get<K extends keyof Type.Static<T>>(key: K): Type.Static<T>[K] | undefined;
  get(key?: string): unknown {
    const value = super.get(key);
    if (value === undefined) return undefined;

    if (!key) {
      if (!Value.Check(this.schema, value)) {
        console.error("Configuration validation error:", value);
        process.exit(2);
      }
      return value as Type.Static<T>;
    }

    const propertySchema = this.schema.properties[key as keyof typeof this.schema.properties] as TSchema;

    if (!Value.Check(propertySchema, value)) {
      console.error(`Configuration validation error for key "${key}":`, value);
      process.exit(2);
    }

    return value;
  }

  private persist(): void {
    const data = super.get();
    const configPath = join(homedir(), ".basic-memory", "project-context.json");
    writeFileSync(configPath, JSON.stringify(data, null, 2));
  }

  addProjectContext(args: { project: string, contextPath: string }): void {
    const entry = this.getProject(args.project);
    const projects = this.get("projects") || [];

    if (!entry) {
      // project not in map, add new entry
      this.set("projects", [
        ...projects,
        { project: args.project, paths: [args.contextPath] },
      ]);
    } else if (!entry.paths.includes(args.contextPath)) {
      // project exists but context not in paths, add context to paths
      // ensure no duplicates and sort paths
      // if the project already exists, we need to update it with the new paths array. nconf doesn't support deep merge, so we have to set the entire projects array again.
      // we can optimize this by only updating the relevant project entry instead of reconstructing the entire array, but for simplicity we'll just reconstruct it.
      // in practice, the number of projects should be small so this shouldn't be a performance issue.
      // also, we want to ensure that the paths are unique and sorted for consistency.
      const paths = [...new Set([...(entry.paths || []), args.contextPath])].sort((a, b) => a.localeCompare(b));
      const updatedEntry = { ...entry, paths };

      this.set("projects", [
        ...projects.filter(p => p.project !== args.project),
        updatedEntry,
      ]);
    }


    this.persist();
  }

  removeProjectContext(args: { project: string, contextPath: string }): void {
    const entry = this.getProject(args.project);

    // is the project in the map? if not, return
    if (!entry) return;

    // does the project have the context? if not, return
    if (!entry.paths.includes(args.contextPath)) return;

    // remove the context from the project
    entry.paths = entry.paths.filter(p => p !== args.contextPath);

    // if the project has no more contexts, remove the project
    if (entry.paths.length === 0) {
      const projects = this.get("projects")?.filter(p => p.project !== args.project) || [];
      this.set("projects", projects);
    } else {
      // otherwise, just update the project with the new paths
      this.set("projects", [
        ...(this.get("projects")?.filter(p => p.project !== args.project) || []),
        entry,
      ]);
    }

    this.persist();
  }

  getProject(project: string): ContextMapProject | null {
    // get project by name from config, return null if not found
    // return mutated, sort the context paths.
    const entry = this.get("projects")?.find(p => p.project === project) || null;
    if (!entry) return null;

    return {
      ...entry,
      paths: [...new Set(entry.paths)].sort((a, b) => a.localeCompare(b)),
    }
  }

  printContextMap(options: { format: "text" | "json" }): void {
    if (options.format === "json") {
      console.log(JSON.stringify(this.get("projects") || [], null, 2));
      return
    }

    for (const entry of this.get("projects") || []) {
      console.log(`Project: ${entry.project}`);
      for (const path of entry.paths) {
        console.log(`  - ${path}`);
      }
    }
  }

  matchProject(queryPath: string): ContextMapProject | null {
    // 1. use matching logic
    // 2. return this.getProject(project) if match found, else null


    const entries = this.get("projects") || [];

    const currentPath = normalizePath(queryPath);
    let bestProject: ContextMapProject | null = null;
    let bestLen = -1;

    for (const entry of entries) {
      for (const contextPath of entry.paths) {
        const contextRoot = normalizePath(contextPath);
        if (!matchesContextRoot(currentPath, contextRoot)) continue;
        if (contextRoot.length > bestLen) {
          bestLen = contextRoot.length;
          bestProject = entry
        }
      }
    }

    return bestProject;

  }

  /**
   * Resolve project using precedence: explicit arg > env var > context-map.
   */
  resolveProjectName(): string | null {
    const fromEnv = process.env.PROJECT_PLANNING_BM_PROJECT;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();

    const queryPath = process.env.PROJECT_PLANNING_BM_QUERY_PATH || process.cwd();
    const entry = this.matchProject(queryPath);
    return entry?.project ?? null;
  }
}

const store = new ContextMapConfig();

const FATAL_MESSAGE = "FATAL: Basic Memory unavailable. exit 1. get an adult.";

/**
 * Print canonical fatal message and terminate with exit code 1.
 */

function fatal(): never {
  console.error(FATAL_MESSAGE);
  process.exit(1);
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
 * Handle `initialise --name <name> [--cwd <path>]`.
 */
function handleInitialiseProject(args: string[]): boolean {

  const name = getRequiredFlagValue(args, "--name").trim();
  if (!name) {
    console.error("Missing required --name value.");
    process.exit(2);
  }

  const cwd = normalizePath(getOptionalFlagValue(args, "--cwd") || process.cwd());
  const existingProject = store.matchProject(cwd)?.project;
  if (existingProject) {
    console.error(`Context already mapped to project: ${existingProject}`);
    process.exit(1);
  }

  const basePath = process.env.BASIC_MEMORY_PROJECT_PATH || join(homedir(), "Notes");
  if (!basePath.trim()) {
    fatal();
  }

  const localPath = join(resolve(basePath.trim()), name);
  const bm = spawnSync("bm", ["project", "add", "research", localPath], {
    stdio: "inherit",
    env: process.env,
  });

  if (bm.error) fatal();
  if (typeof bm.status === "number" && bm.status !== 0) {
    process.exit(bm.status);
  }

  store.addProjectContext({
    project: name,
    contextPath: cwd,
  });
  return true;
}


function bmCommandNeedsInjectedArg(cmd: string): { project: boolean; local: boolean } {
  switch (true) {
    case cmd.startsWith("project"):
    case cmd === 'status':
    case cmd === 'reindex':
      return { project: true, local: true };
    case cmd === 'doctor':
      return { project: false, local: true };
    default:
      return { project: false, local: false };
  }
}

function resolveArgs() {
  const args = nconf.argv().get();
  const originalArgs = process.argv.slice(2);
  const requirements = bmCommandNeedsInjectedArg(args._.join(' '));

  if (requirements.project) {
    const project = args.project || store.resolveProjectName();
    if (!project) {
      console.error("Invalid --project argument. Provide a non-empty value.");
      process.exit(2);
    }

    if (originalArgs.indexOf("--project") === -1) {
      originalArgs.push("--project", project);
    }
  }

  if (requirements.local && !originalArgs.includes("--local")) {
    originalArgs.push("--local");
  }

  return originalArgs;
}


function handleBasicMemoryCommand() {

  const bmBinary = "basic-memory";

  const resolvedArgs = resolveArgs();

  console.log("Forwarding to basic-memory with args:", resolvedArgs);

  const child = spawnSync(bmBinary, resolvedArgs, {
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
  const args = nconf.argv().get()
  const cmd = args._[0];

  console.log("Basic Memory Project Resolver CLI");
  console.log("CWD:", process.cwd());
  console.log("Received args:", args);
  console.log('Cmd', cmd);

  switch (cmd) {
    case "initialise":
      handleInitialiseProject(args._) && process.exit(0);
      break;

    case "context":
      const subcmd = args._[1];
      console.log('Subcmd', subcmd);

      switch (subcmd) {
        case "list":
          store.printContextMap({
            format: args.format === "json" ? "json" : "text",
          });
          break;
        case "add":
          store.addProjectContext({
            project: args.project.trim(),
            contextPath: normalizePath(args.path.trim()),
          });
          break;
        case "remove":
          store.removeProjectContext({
            project: args.project.trim(),
            contextPath: normalizePath(args.path.trim()),
          });
          break;
      }
      break;

    default:
      handleBasicMemoryCommand();
  }
}

main();

