import { promises as fs } from "node:fs";
import path from "node:path";

export const LAYOUT_FILE = "docs/agents/context-layout.toml";
export type ContextLayout = { tracker: string; sources: string; tickets: string; initiatives: string };
export const DEFAULT_LAYOUT: ContextLayout = {
  tracker: "tracker", sources: "sources", tickets: "tracker/tickets", initiatives: "tracker/initiatives",
};

export function validateRelativePath(value: unknown, label: string): string {
  if (typeof value !== "string" || !value || value.trim() !== value
    || path.isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.includes("\\")
    || value.includes("\0") || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`${label} must be a non-empty relative directory path without traversal`);
  }
  return value;
}

export async function readLayout(alignmentRoot: string): Promise<ContextLayout> {
  const file = path.join(alignmentRoot, LAYOUT_FILE);
  let source: string;
  await validateStorePath(alignmentRoot, LAYOUT_FILE);
  try { source = await fs.readFile(file, "utf8"); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ...DEFAULT_LAYOUT };
    throw error;
  }
  const raw = Bun.TOML.parse(source) as Record<string, unknown>;
  if (raw.schema !== 1 || Object.keys(raw).some((key) => key !== "schema" && key !== "paths")
    || (raw.paths !== undefined && (typeof raw.paths !== "object" || raw.paths === null || Array.isArray(raw.paths)))) {
    throw new Error(`${LAYOUT_FILE} requires schema = 1 and only an optional [paths] table`);
  }
  const paths = (raw.paths ?? {}) as Record<string, unknown>;
  if (Object.keys(paths).some((key) => key !== "tracker" && key !== "sources")) {
    throw new Error(`${LAYOUT_FILE} accepts only paths.tracker and paths.sources`);
  }
  const tracker = paths.tracker === undefined ? "tracker" : validateRelativePath(paths.tracker, "paths.tracker");
  const sources = paths.sources === undefined ? "sources" : validateRelativePath(paths.sources, "paths.sources");
  return { tracker, sources, tickets: `${tracker}/tickets`, initiatives: `${tracker}/initiatives` };
}

async function realExistingAncestor(target: string): Promise<string> {
  try { return await fs.realpath(target); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // A dangling symlink is not a missing directory and must not bypass validation.
    try {
      if ((await fs.lstat(target)).isSymbolicLink()) throw new Error("Configured path contains a dangling symlink");
    } catch (statError) {
      if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError;
    }
    const parent = path.dirname(target);
    if (parent === target) throw error;
    return path.join(await realExistingAncestor(parent), path.basename(target));
  }
}

export async function validateStorePath(root: string, relative: string): Promise<void> {
  validateRelativePath(relative, "Record path");
  const [rootReal, targetReal] = await Promise.all([
    realExistingAncestor(root), realExistingAncestor(path.join(root, relative)),
  ]);
  const inside = path.relative(rootReal, targetReal);
  if (inside === ".." || inside.startsWith(`..${path.sep}`) || path.isAbsolute(inside)) {
    throw new Error("Configured record path escapes its selected store through a symlink");
  }
}
