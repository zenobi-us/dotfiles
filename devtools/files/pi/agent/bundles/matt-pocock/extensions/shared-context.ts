import { createHash } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const MAX_AGENTS_BYTES = 100_000;
const SHARED_CONTEXT_DIR = path.join(".pi", "shared-context");
const STORAGE_FILE = ".storage";
const ALIGNMENT_PATHS = ["docs/agents", "CONTEXT.md", "CONTEXT-MAP.md", "docs/adr"];

export type MattPocockContext = {
  repositoryRoot: string;
  origin: string;
  canonicalOrigin: string;
  slug: string;
  sharedRoot: string;
  candidateSharedRoot?: string;
  root: string;
  storage: "shared" | "repository";
  source?: string;
  instructions?: string;
  error?: string;
};

type Exec = (command: string, args: string[]) => Promise<{ stdout: string; code: number }>;

export type MigrationResult = {
  from: string;
  to: string;
  storage: "shared" | "repository";
  copied: string[];
};

export function canonicalizeGitRemote(remote: string): string {
  let value = remote.trim();
  const scp = value.match(/^(?:[^@/]+@)?([^/:]+):(.+)$/);
  if (scp && !value.includes("://")) value = `ssh://${scp[1]}/${scp[2]}`;

  const url = new URL(value);
  const pathname = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "");
  if (!url.hostname || !pathname) throw new Error(`Unsupported git origin: ${remote}`);
  return `${url.hostname.toLowerCase()}/${pathname}`;
}

export function slugifyGitRemote(remote: string): string {
  const canonical = canonicalizeGitRemote(remote);
  const base = canonical.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const hash = createHash("sha256").update(canonical).digest("hex").slice(0, 8);
  return `${base}--${hash}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function existingRepositoryInstructions(repositoryRoot: string): Promise<string | undefined> {
  for (const name of ["CLAUDE.md", "AGENTS.md"]) {
    const candidate = path.join(repositoryRoot, name);
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next supported repository instruction file.
    }
  }
}

async function readSharedInstructions(sharedRoot: string): Promise<{ source?: string; instructions?: string; error?: string }> {
  const source = path.join(sharedRoot, "AGENTS.md");
  try {
    const [rootReal, sourceReal, stat] = await Promise.all([
      fs.realpath(sharedRoot),
      fs.realpath(source),
      fs.stat(source),
    ]);
    if (sourceReal !== path.join(rootReal, "AGENTS.md")) return { error: `${source} resolves outside its shared-context root` };
    if (!stat.isFile()) return {};
    if (stat.size > MAX_AGENTS_BYTES) return { error: `${source} exceeds ${MAX_AGENTS_BYTES} bytes` };
    const instructions = await fs.readFile(sourceReal, "utf8");
    return instructions.trim() ? { source: sourceReal, instructions } : {};
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ENOENT" ? {} : { error: error instanceof Error ? error.message : String(error) };
  }
}

async function readStoragePreference(sharedRoot: string): Promise<"shared" | "repository" | undefined> {
  try {
    const value = (await fs.readFile(path.join(sharedRoot, STORAGE_FILE), "utf8")).trim();
    return value === "shared" || value === "repository" ? value : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

export async function resolveMattPocockContext(
  exec: Exec,
  cwd: string,
  sharedContextBase = path.join(os.homedir(), SHARED_CONTEXT_DIR),
): Promise<MattPocockContext | undefined> {
  const rootResult = await exec("git", ["-C", cwd, "rev-parse", "--show-toplevel"]);
  if (rootResult.code !== 0 || !rootResult.stdout.trim()) return;

  const repositoryRoot = rootResult.stdout.trim();
  const originResult = await exec("git", ["-C", repositoryRoot, "remote", "get-url", "origin"]);
  if (originResult.code !== 0 || !originResult.stdout.trim()) return;

  const origin = originResult.stdout.trim();
  let canonicalOrigin: string;
  let slug: string;
  try {
    canonicalOrigin = canonicalizeGitRemote(origin);
    slug = slugifyGitRemote(origin);
  } catch (error) {
    return {
      repositoryRoot,
      origin,
      canonicalOrigin: "",
      slug: "",
      sharedRoot: repositoryRoot,
      root: repositoryRoot,
      storage: "repository",
      source: await existingRepositoryInstructions(repositoryRoot),
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const candidateSharedRoot = path.join(sharedContextBase, slug);
  const shared = await readSharedInstructions(candidateSharedRoot);
  const storagePreference = await readStoragePreference(candidateSharedRoot);
  if (storagePreference !== "repository" && shared.instructions && shared.source) {
    return {
      repositoryRoot,
      origin,
      canonicalOrigin,
      slug,
      sharedRoot: candidateSharedRoot,
      candidateSharedRoot,
      root: candidateSharedRoot,
      storage: "shared",
      source: shared.source,
      instructions: shared.instructions,
    };
  }

  return {
    repositoryRoot,
    origin,
    canonicalOrigin,
    slug,
    sharedRoot: repositoryRoot,
    candidateSharedRoot,
    root: repositoryRoot,
    storage: "repository",
    source: await existingRepositoryInstructions(repositoryRoot),
    error: shared.error,
  };
}

export async function initializeSharedContext(context: MattPocockContext): Promise<{ agents: string; created: boolean }> {
  if (!context.candidateSharedRoot) throw new Error("Cannot initialize shared context without a canonical git origin");

  await fs.mkdir(context.candidateSharedRoot, { recursive: true });
  const agents = path.join(context.candidateSharedRoot, "AGENTS.md");
  try {
    await fs.writeFile(agents, "# Matt Pocock shared context\n\nSee `docs/agents/` for engineering workflow configuration.\n", { flag: "wx" });
    await fs.writeFile(path.join(context.candidateSharedRoot, STORAGE_FILE), "shared\n");
    return { agents, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    await fs.writeFile(path.join(context.candidateSharedRoot, STORAGE_FILE), "shared\n");
    return { agents, created: false };
  }
}

async function contextAdrPaths(root: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(directory: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(directory, entry.name);
      if (entry.name === "adr" && path.basename(path.dirname(child)) === "docs") {
        found.push(path.relative(root, child));
      } else {
        await walk(child);
      }
    }
  }

  await walk(path.join(root, "src"));
  return found;
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function trackerBackend(root: string): Promise<string | undefined> {
  try {
    const config = await fs.readFile(path.join(root, "docs", "agents", "issue-tracker.md"), "utf8");
    const frontmatter = config.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1];
    return frontmatter?.match(/^backend:\s*(\S+)\s*$/m)?.[1];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

async function filesUnder(source: string, target: string): Promise<Array<{ source: string; target: string }>> {
  const stat = await fs.stat(source);
  if (stat.isFile()) return [{ source, target }];

  const files: Array<{ source: string; target: string }> = [];
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...await filesUnder(path.join(source, entry.name), path.join(target, entry.name)));
    } else if (entry.isFile()) {
      files.push({ source: path.join(source, entry.name), target: path.join(target, entry.name) });
    }
  }
  return files;
}

export async function migrateAlignmentContext(context: MattPocockContext): Promise<MigrationResult> {
  if (!context.candidateSharedRoot) throw new Error("Cannot migrate context without a canonical git origin");

  const storage = context.storage === "shared" ? "repository" : "shared";
  const from = context.storage === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
  const to = storage === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
  const sourceInstructions = context.storage === "shared"
    ? path.join(from, "AGENTS.md")
    : await existingRepositoryInstructions(context.repositoryRoot);
  const targetInstructions = storage === "shared"
    ? path.join(to, "AGENTS.md")
    : (await existingRepositoryInstructions(context.repositoryRoot)) ?? path.join(to, "AGENTS.md");

  const entries: Array<{ relative: string; source: string; target: string }> = [];
  if (sourceInstructions && await exists(sourceInstructions)) {
    entries.push({
      relative: path.relative(from, sourceInstructions) || path.basename(sourceInstructions),
      source: sourceInstructions,
      target: targetInstructions,
    });
  }
  const alignmentPaths = [...ALIGNMENT_PATHS, ...await contextAdrPaths(from)];
  const scratch = path.join(from, ".scratch");
  if (await exists(scratch)) {
    const backend = await trackerBackend(from);
    if (!backend) {
      throw new Error(`Cannot migrate .scratch without backend metadata in ${path.join(from, "docs", "agents", "issue-tracker.md")}`);
    }
    if (backend === "local-markdown") alignmentPaths.push(".scratch");
  }
  for (const relative of alignmentPaths) {
    const source = path.join(from, relative);
    if (await exists(source)) entries.push({ relative, source, target: path.join(to, relative) });
  }

  if (entries.length === 0) throw new Error(`No alignment files found beneath ${from}`);
  const files = (await Promise.all(entries.map((entry) => filesUnder(entry.source, entry.target)))).flat();
  const conflicts: string[] = [];
  const missing: Array<{ source: string; target: string }> = [];
  for (const file of files) {
    if (!await exists(file.target)) {
      missing.push(file);
      continue;
    }
    const [sourceContent, targetContent] = await Promise.all([fs.readFile(file.source), fs.readFile(file.target)]);
    if (!sourceContent.equals(targetContent)) conflicts.push(file.target);
  }
  if (conflicts.length > 0) throw new Error(`Migration target differs:\n${conflicts.join("\n")}`);

  for (const file of missing) {
    await fs.mkdir(path.dirname(file.target), { recursive: true });
    await fs.copyFile(file.source, file.target, constants.COPYFILE_EXCL);
  }
  await fs.mkdir(context.candidateSharedRoot, { recursive: true });
  await fs.writeFile(path.join(context.candidateSharedRoot, STORAGE_FILE), `${storage}\n`);
  return { from, to, storage, copied: entries.map((entry) => entry.relative) };
}

export async function listSharedContexts(
  sharedContextBase = path.join(os.homedir(), SHARED_CONTEXT_DIR),
): Promise<Array<{ slug: string; root: string; storage?: "shared" | "repository" }>> {
  let entries;
  try {
    entries = await fs.readdir(sharedContextBase, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const contexts = await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      const root = path.join(sharedContextBase, entry.name);
      const preference = await readStoragePreference(root);
      const storage = preference ?? ((await readSharedInstructions(root)).instructions ? "shared" : undefined);
      return { slug: entry.name, root, storage };
    }));
  return contexts.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function renderMattPocockContext(context: MattPocockContext): string {
  const attributes = [
    `storage="${context.storage}"`,
    `root="${escapeXml(context.root)}"`,
    `shared-root="${escapeXml(context.sharedRoot)}"`,
    `repository-root="${escapeXml(context.repositoryRoot)}"`,
    `origin="${escapeXml(context.origin)}"`,
    `slug="${escapeXml(context.slug)}"`,
  ];
  if (context.source) attributes.push(`source="${escapeXml(context.source)}"`);

  const instructions = context.storage === "shared" && context.instructions && context.source
    ? `<instructions source="${escapeXml(context.source)}">\n${escapeXml(context.instructions)}\n</instructions>`
    : `<instructions${context.source ? ` source="${escapeXml(context.source)}"` : ""} already-loaded="true" />`;

  return `\n\n<matt-pocock-context ${attributes.join(" ")}>\n${instructions}\n</matt-pocock-context>`;
}

export default function mattPocockSharedContext(pi: ExtensionAPI): void {
  const warned = new Set<string>();
  const exec: Exec = async (command, args) => {
    const result = await pi.exec(command, args);
    return { stdout: result.stdout, code: result.code };
  };

  pi.on("before_agent_start", async (event, ctx) => {
    const context = await resolveMattPocockContext(exec, ctx.cwd);
    if (!context) return;
    if (context.error && !warned.has(context.error)) {
      warned.add(context.error);
      ctx.ui.notify(`Matt Pocock shared context: ${context.error}`, "warning");
    }
    return { systemPrompt: event.systemPrompt + renderMattPocockContext(context) };
  });

  pi.registerCommand("eng-context", {
    description: "Report, initialize, list, or migrate engineering context storage",
    getArgumentCompletions: (prefix) => {
      const commands = ["report", "init", "list", "migrate"];
      const items = commands
        .filter((command) => command.startsWith(prefix))
        .map((command) => ({ value: command, label: command }));
      return items.length > 0 ? items : null;
    },
    handler: async (args, ctx) => {
      const command = args.trim().split(/\s+/, 1)[0] || "report";

      if (command === "list") {
        const contexts = await listSharedContexts();
        ctx.ui.notify(
          contexts.length > 0
            ? contexts.map((item) => `${item.slug}${item.storage ? ` [${item.storage}]` : ""}\n  ${item.root}`).join("\n")
            : "No shared engineering contexts found",
          "info",
        );
        return;
      }

      const context = await resolveMattPocockContext(exec, ctx.cwd);
      if (!context) {
        ctx.ui.notify("No git repository with an origin remote found", "warning");
        return;
      }

      if (command === "init") {
        const { agents, created } = await initializeSharedContext(context);
        ctx.ui.notify(
          created ? `Created ${agents}. Shared storage activates on the next agent turn.` : `${agents} already exists`,
          "info",
        );
        return;
      }

      if (command === "migrate") {
        try {
          const result = await migrateAlignmentContext(context);
          ctx.ui.notify(
            `Copied ${result.copied.length} alignment path(s) to ${result.storage} storage:\n${result.copied.join("\n")}`,
            "info",
          );
        } catch (error) {
          ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
        }
        return;
      }

      if (command !== "report") {
        ctx.ui.notify(`Unknown subcommand: ${command}`, "warning");
        return;
      }

      ctx.ui.notify([
        `storage: ${context.storage}`,
        `root: ${context.root}`,
        `shared root: ${context.sharedRoot}`,
        ...(context.candidateSharedRoot && context.candidateSharedRoot !== context.sharedRoot
          ? [`shared candidate: ${context.candidateSharedRoot}`]
          : []),
        `origin: ${context.origin}`,
        `slug: ${context.slug}`,
      ].join("\n"), context.error ? "warning" : "info");
    },
  });
}
