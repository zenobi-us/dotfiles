import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const MAX_AGENTS_BYTES = 100_000;
const SHARED_CONTEXT_DIR = path.join(".pi", "shared-context");

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
  if (shared.instructions && shared.source) {
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
    return { agents, created: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return { agents, created: false };
  }
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

  pi.registerCommand("matt-context", {
    description: "Inspect or initialize the Matt Pocock shared context for this git origin",
    handler: async (args, ctx) => {
      const context = await resolveMattPocockContext(exec, ctx.cwd);
      if (!context) {
        ctx.ui.notify("No git repository with an origin remote found", "warning");
        return;
      }

      if (args.trim() === "init") {
        const { agents, created } = await initializeSharedContext(context);
        ctx.ui.notify(
          created ? `Created ${agents}. Shared storage activates on the next agent turn.` : `${agents} already exists`,
          "info",
        );
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
