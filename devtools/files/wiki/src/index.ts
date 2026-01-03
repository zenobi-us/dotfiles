#!/usr/bin/env bun
/* eslint-disable @typescript-eslint/no-explicit-any */
/* ts-node-skip */
/* ts-skip */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { TOML } from "bun";

// ============================================================================
// Type Definitions
// ============================================================================

interface ProjectConfig {
  project?: {
    name?: string;
    contexts?: string[];
  };
  notebook?: {
    dir?: string;
  };
}

interface NotebookEntry {
  name: string;
  path: string;
}

interface ProjectId {
  projectId: string;
  repo: string;
  remote: string;
  path: string;
}

// ============================================================================
// Configuration
// ============================================================================

const GLOBAL_NOTEBOOKS_DIR = process.env.NOTEBOOKS || join(homedir(), "Notes");
const NOTEBOOK_ZK_CONFIG = ".zk/config.toml";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Slugify text: convert to lowercase, remove special chars, replace spaces with hyphens
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\n/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Remove leading whitespace from multiline strings
 */
function dedent(text: string): string {
  const lines = text.split("\n");
  const indent = lines
    .find((line) => line.trim())
    ?.match(/^\s*/)?.[0]?.length ?? 0;
  return lines.map((line) => line.slice(indent)).join("\n");
}

/**
 * Remove leading dashes from flag strings
 */
function trimFlag(text: string): string {
  return text.replace(/^-+/, "");
}

/**
 * Execute a shell command using Bun.$
 */
async function exec(command: string): Promise<string> {
  try {
    const result = await Bun.$`${command}`.quiet();
    return result.stdout.toString().trim();
  } catch {
    return "";
  }
}

// ============================================================================
// TOML File Operations
// ============================================================================

/**
 * Read a TOML file and navigate to a selector path
 * Returns the value at the path or null if not found
 * Uses dynamic import for native Bun TOML support
 */
async function readToml(file: string, selector: string = ""): Promise<any> {
  if (!existsSync(file)) {
    return null;
  }

  try {
    // Use dynamic import with Bun's native TOML support
    const parsed = await import(resolve(file), { with: { type: "toml" } }).then(
      (m) => m.default as ProjectConfig
    );

    if (!selector) {
      return parsed;
    }

    // Navigate the path: ".project.contexts" → project.contexts
    const path = selector.split(".").filter((p) => p);
    let current: any = parsed;

    for (const key of path) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }

    return current;
  } catch {
    return null;
  }
}

/**
 * Write a TOML file with atomic writes (temp file + move)
 * Merges the provided data with existing content
 */
function writeToml(file: string, data: ProjectConfig): void {
  try {
    // Read existing config or start fresh
    let config: ProjectConfig = {};
    if (existsSync(file)) {
      const content = readFileSync(file, "utf-8");
      config = TOML.parse(content) as ProjectConfig;
    }

    // Deep merge
    if (data.project) {
      config.project = { ...config.project, ...data.project };
    }
    if (data.notebook) {
      config.notebook = { ...config.notebook, ...data.notebook };
    }

    // Ensure directory exists
    mkdirSync(dirname(file), { recursive: true });

    // Write to temp file first
    const tmpFile = `${file}.tmp`;
    const tomlString = TOML.stringify(config as any);
    writeFileSync(tmpFile, tomlString, "utf-8");

    // Atomic move
    if (Bun.env.BUN_PLATFORM !== "win32") {
      require("fs").renameSync(tmpFile, file);
    } else {
      const fs = require("fs");
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      fs.renameSync(tmpFile, file);
    }
  } catch (err) {
    console.error(`Failed to write TOML file: ${file}`, err);
    throw err;
  }
}

/**
 * Get the config file path for a notebook
 */
function getConfigPath(notebookPath: string): string {
  return join(notebookPath, NOTEBOOK_ZK_CONFIG);
}

// ============================================================================
// Core Discovery & Project Functions
// ============================================================================

/**
 * Discover notebook path following priority:
 * 1. NOTEBOOK_PATH env var
 * 2. Matching contexts in global notebooks
 * 3. Ancestor directories with .zk/config.toml
 * 4. Global notebook at ~/.config/.zk/config.toml
 */
async function discoverNotebookPath(cwd: string = process.cwd()): Promise<string | null> {
  // Step 1: Check NOTEBOOK_PATH environment variable
  if (process.env.NOTEBOOK_PATH) {
    return process.env.NOTEBOOK_PATH;
  }

  // Step 2: Scan $NOTEBOOKS_DIR for matching contexts
  if (existsSync(GLOBAL_NOTEBOOKS_DIR)) {
    const notebooks = findNotebookConfigs(GLOBAL_NOTEBOOKS_DIR);

    for (const configFile of notebooks) {
      const contexts = await readToml(configFile, ".project.contexts");

      if (Array.isArray(contexts)) {
        for (const context of contexts) {
          if (cwd.startsWith(context)) {
            return dirname(dirname(configFile)); // Parent of .zk folder
          }
        }
      }
    }
  }

  // Step 3: Search ancestor directories
  let current = cwd;
  while (current !== "/") {
    const configPath = join(current, NOTEBOOK_ZK_CONFIG);
    if (existsSync(configPath)) {
      return current;
    }
    current = dirname(current);
  }

  // Step 4: Fall back to global notebook
  const globalConfig = join(homedir(), ".config", NOTEBOOK_ZK_CONFIG);
  if (existsSync(globalConfig)) {
    const dir = await readToml(globalConfig, ".notebook.dir");
    if (dir) {
      return dir;
    }
  }

  return null;
}

/**
 * Recursively find all notebook config files
 */
function findNotebookConfigs(dir: string): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Look for .zk/config.toml pattern
        const zkPath = join(fullPath, NOTEBOOK_ZK_CONFIG);
        if (existsSync(zkPath)) {
          results.push(zkPath);
        }
        // Recursively search subdirectories
        results.push(...findNotebookConfigs(fullPath));
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return results;
}

/**
 * Get project name from config file
 */
async function getProjectName(configFile: string): Promise<string | null> {
  if (!existsSync(configFile)) {
    return null;
  }

  return (await readToml(configFile, ".project.name")) ?? null;
}

/**
 * Get project ID information (uses git if available)
 */
async function getProjectId(cwd: string = process.cwd()): Promise<ProjectId> {
  let gitRoot: string = "";
  let remote: string = "origin";
  let repoUrl: string = "";

  try {
    gitRoot = await exec(`git -C ${cwd} rev-parse --show-toplevel`);

    if (gitRoot) {
      const remotes = await exec(`git -C ${cwd} remote`);
      remote = remotes.split("\n")[0] || "origin";

      repoUrl = await exec(`git -C ${cwd} remote get-url ${remote}`);
    }
  } catch {
    // Not in a git repo, use cwd as fallback
    gitRoot = cwd;
  }

  const repoSlug = slugify(repoUrl || gitRoot);
  const pathSlug = slugify(gitRoot || cwd);
  const projectId = repoSlug;

  return {
    projectId,
    repo: repoSlug,
    remote: repoUrl ? remote : "",
    path: pathSlug,
  };
}

/**
 * List all global notebooks as JSON
 */
async function listGlobalNotebooksJson(): Promise<NotebookEntry[]> {
  const notebooks: NotebookEntry[] = [];
  const configs = findNotebookConfigs(GLOBAL_NOTEBOOKS_DIR);

  for (const configFile of configs) {
    const name = await getProjectName(configFile);
    if (name) {
      const path = dirname(dirname(configFile)); // Parent of .zk folder
      notebooks.push({ name, path });
    }
  }

  return notebooks;
}

/**
 * Add a path as a context for a project
 */
async function addNotebookPathAsContext(
  notebookPath: string,
  contextPath: string = process.cwd()
): Promise<void> {
  if (!notebookPath) {
    throw new Error("No notebook path provided. Cannot add context.");
  }

  const configFile = getConfigPath(notebookPath);

  // Ensure config file exists
  mkdirSync(dirname(configFile), { recursive: true });
  if (!existsSync(configFile)) {
    writeToml(configFile, {
      project: {
        contexts: [],
      },
    });
  }

  // Read current contexts
  let contexts = (await readToml(configFile, ".project.contexts")) || [];
  if (!Array.isArray(contexts)) {
    contexts = [];
  }

  // Check if context already exists
  if (contexts.includes(contextPath)) {
    console.log(`Context '${contextPath}' already exists in notebook config at '${configFile}'.`);
    return;
  }

  // Add the context
  contexts.push(contextPath);
  writeToml(configFile, {
    project: {
      contexts,
    },
  });

  console.log(`Added context '${contextPath}' to notebook config at '${configFile}'.`);
}

/**
 * Create a new project
 */
async function createProject(name: string, location: "local" | "global" = "local"): Promise<void> {
  if (!name) {
    throw new Error("Project name is required.");
  }

  let configPath: string;
  if (location === "global") {
    configPath = getConfigPath(join(GLOBAL_NOTEBOOKS_DIR, name));
  } else {
    configPath = getConfigPath(process.cwd());
  }

  mkdirSync(dirname(configPath), { recursive: true });

  writeToml(configPath, {
    project: {
      name,
      contexts: location === "global" ? [process.cwd()] : [],
    },
  });

  console.log(`Created project '${name}' at '${configPath}'.`);
  const config = await readToml(configPath, ".project");
  console.log(JSON.stringify(config, null, 2));
}

// ============================================================================
// CLI Handler
// ============================================================================

async function main(): Promise<void> {
  // Bun.argv format: [bun_path, script_path, ...args]
  // For compiled binary: [binary_path, ...args]
  const args = Bun.argv.length > 2 ? Bun.argv.slice(2) : Bun.argv.slice(1);
  const cmd = args[0];

  try {
    if (cmd === "project") {
      const subcmd = args[1];
      const subargs = args.slice(2);

      switch (subcmd) {
        case "discover": {
          const notebookPath = await discoverNotebookPath(subargs[0]);
          if (notebookPath) {
            console.log(notebookPath);
          } else {
            console.error("No notebook path found.");
            process.exit(1);
          }
          break;
        }

        case "create": {
          const name = subargs[0];
          const location = (trimFlag(subargs[1] || "local") as "local" | "global") || "local";
          await createProject(name, location);
          break;
        }

        case "add": {
          const notebookPath = subargs[0];
          const contextPath = subargs[1];
          await addNotebookPathAsContext(notebookPath, contextPath);
          break;
        }

        case "list": {
          const format = trimFlag(subargs[0] || "table");
          const notebooks = await listGlobalNotebooksJson();

          if (format === "json") {
            console.log(JSON.stringify(notebooks, null, 2));
          } else {
            // Table format with markdown
            console.log("| Name | Path |");
            console.log("|------|------|");
            for (const nb of notebooks) {
              console.log(`| ${nb.name} | ${nb.path} |`);
            }
          }
          break;
        }

        case "id": {
          const projectId = await getProjectId(subargs[0]);
          console.log(JSON.stringify(projectId, null, 2));
          break;
        }

        default: {
          const usage = dedent(`
            ## Usage

            \`wiki-cli project {discover|add|id|list|create}\`

            | Command | Arguments | Description |
            |---------|-----------|-------------|
            | discover | [path] | Discover the notebook path for the current project. |
            | create | [project_name] [--global\|--local] | Create a new project configuration with the given project_name. By default, creates a local project. Use --global to create a global project. |
            | add | [notebook_path] [context_path] | Add the current path (or provided context_path) as a context to the notebook at notebook_path. |
            | id | [path] | Get the project ID information for the current project. |
            | list | [--json\|--table] | List all global notebooks available. |
          `);
          console.error(usage);
          process.exit(1);
        }
      }
    } else {
      // Default: discover and run zk
      const notebookPath = await discoverNotebookPath();
      if (!notebookPath) {
        console.error("No notebook path found.");
        process.exit(1);
      }

      // Forward to zk command
      const zkArgs = ["-W", notebookPath, ...args];
      const proc = Bun.spawn(["zk", ...zkArgs]);
      await proc.exited;
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
