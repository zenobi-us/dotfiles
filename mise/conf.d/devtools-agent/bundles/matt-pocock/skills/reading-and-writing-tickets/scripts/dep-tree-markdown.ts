import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord, resolveSharedContext } from "../../../../agent-core/skills/shared-context/scripts/shared-context/lib.ts";
import { buildDependencyForest, parseJson, record, renderDependencyGraph, run } from "./dep-tree-shared.ts";
import type { Ticket } from "./dep-tree-shared.ts";

type MarkdownTicket = { ticket: Ticket; blockedBy: string[]; parent?: string };
interface MarkdownInitiative { id: string; ticketIds: string[] }

export async function markdownGraph(
  repositoryRoot: string,
  ticketId: string | undefined,
  initiativeId: string | undefined,
  sharedContextBase?: string,
): Promise<string> {
  if (!isAbsolute(repositoryRoot)) throw new Error("Pass the absolute repository-root returned by shared-context.");
  if (Boolean(ticketId) === Boolean(initiativeId)) throw new Error("Pass exactly one of --ticket or --initiative.");
  const context = await resolveSharedContext(async (command, args) => {
    const result = spawnSync(command, args, { encoding: "utf8" });
    if (result.error) throw result.error;
    return { stdout: result.stdout ?? "", code: result.status ?? 1 };
  }, repositoryRoot, sharedContextBase);
  if (!context) throw new Error("The repository has no resolvable shared context.");
  if (context.error) throw new Error(context.error);
  const [ticketCollection, initiativeCollection] = await Promise.all([
    resolveContextRecord(context, { kind: "tickets" }),
    resolveContextRecord(context, { kind: "initiatives" }),
  ]);
  if (ticketCollection.adapter !== "local-markdown" || !ticketCollection.path || !initiativeCollection.path) {
    throw new Error("The Markdown graph requires file-backed tickets and initiatives.");
  }
  const tickets = new Map<string, MarkdownTicket>();
  const ticketIdsByPath = new Map<string, string>();
  for (const [index, value] of markdownRows(ticketCollection.path, "**/*.md", "frontmatter: okf::okf_parse(read_file(root + \"/\" + file))[\"frontmatter\"]").entries()) {
    const row = record(value, `Markdown ticket ${index + 1}`);
    const frontmatter = record(row.frontmatter, `Markdown ticket ${index + 1} frontmatter`);
    const id = scalar(frontmatter.id, `Markdown ticket ${index + 1} id`);
    if (tickets.has(id)) throw new Error(`duplicate ticket ID: ${id}`);
    const title = scalar(frontmatter.title, `Markdown ticket ${index + 1} title`);
    const type = typeof frontmatter.type === "string" ? frontmatter.type.trim() : "ticket";
    const status = typeof frontmatter.work_status === "string" ? frontmatter.work_status.trim() : undefined;
    const parent = typeof frontmatter.parent === "string" ? frontmatter.parent.trim() : undefined;
    const rawBlockers = frontmatter.blocked_by ?? [];
    if (!Array.isArray(rawBlockers)) throw new Error(`ticket ${id} has a non-list blocked_by value`);
    const blockedBy = rawBlockers.map((value) => scalar(value, `ticket ${id} blocker`));
    tickets.set(id, { ticket: { id, title, type: type || "ticket", ...(status ? { status } : {}) }, blockedBy, ...(parent ? { parent } : {}) });
    ticketIdsByPath.set(resolve(ticketCollection.path, scalar(row.path, `ticket ${id} path`)), id);
  }
  if (ticketId && !tickets.has(ticketId)) throw new Error(`Ticket ${ticketId} was not found in ${ticketCollection.path}`);
  const initiatives = markdownRows(initiativeCollection.path, "*/index.md", "links: okf::okf_extract_links(read_file(root + \"/\" + file))").map((value) => {
    const row = record(value, "initiative index");
    const relativePath = scalar(row.path, "initiative index path");
    const id = dirname(relativePath);
    if (!Array.isArray(row.links)) throw new Error(`initiative ${id} has no link list`);
    const indexPath = resolve(initiativeCollection.path!, relativePath);
    const ticketIds = row.links.flatMap((value) => {
      const link = record(value, `initiative ${id} link`);
      if (typeof link.url !== "string") return [];
      const target = localLinkPath(indexPath, link.url);
      const ticketId = target ? ticketIdsByPath.get(target) : undefined;
      if (target && !ticketId) {
        const relativeTarget = relative(ticketCollection.path!, target);
        if (relativeTarget.endsWith(".md") && !relativeTarget.startsWith("..") && !isAbsolute(relativeTarget)) {
          throw new Error(`initiative ${id} references a ticket that was not found: ${target}`);
        }
      }
      return ticketId ? [ticketId] : [];
    });
    return { id, ticketIds: [...new Set(ticketIds)] };
  });
  const initiative = initiativeId
    ? initiatives.find((candidate) => candidate.id === initiativeId)
    : discoverMarkdownInitiative(ticketId ?? "", tickets, initiatives);
  if (!initiative) throw new Error(initiativeId ? `initiative '${initiativeId}' was not found` : `No initiative found for ticket ${ticketId}`);
  const graph = await buildDependencyForest(initiative.ticketIds, async (id) => {
    const found = tickets.get(id);
    if (!found) throw new Error(`initiative ${initiative.id} references ticket ${id}, but that ticket was not found`);
    return found;
  });
  return renderDependencyGraph(graph);
}

function markdownRows(root: string, pattern: string, fields: string): unknown[] {
  const query = `
    import "github.com/harehare/okf.mq" |
    map(walk_files(root, pattern), fn(file): { path: file, ${fields} };)
  `;
  const parsed = parseJson(run("mq", ["--allow-http-import", `--allow-read=${root}`, "--args", "root", root, "--args", "pattern", pattern, "-I", "null", "-F", "json", query]), "mq");
  return Array.isArray(parsed) ? parsed : [parsed];
}

function localLinkPath(indexPath: string, url: string): string | undefined {
  if (url.startsWith("#")) return undefined;
  if (url.startsWith("file:")) return fileURLToPath(new URL(url));
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url) || url.startsWith("//")) return undefined;
  return resolve(dirname(indexPath), decodeURIComponent(url.split(/[?#]/, 1)[0]!));
}

function discoverMarkdownInitiative(ticketId: string, tickets: Map<string, MarkdownTicket>, initiatives: MarkdownInitiative[]): MarkdownInitiative | undefined {
  let current: string | undefined = ticketId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    visited.add(current);
    const currentId = current;
    const match = initiatives.find((initiative) => initiative.ticketIds.includes(currentId));
    if (match) return match;
    current = tickets.get(current)?.parent;
  }
  return undefined;
}

function scalar(value: unknown, label: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new Error(`${label} must be a non-empty string or number`);
}
