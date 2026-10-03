import { createHash } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config";

const MAX_AGENTS_BYTES = 100_000;
export const ROUTE_MANIFEST_FILE = ".context-routes.toml";
const LEGACY_STORAGE_FILE = ".storage";
const DEFAULT_CONTEXT_MAP = `# Context map

Use this file for stable entry points. Do not list individual workflow receipts.

## Stable entry points

- \`docs/agents/\`
- \`docs/adr/index.md\`
- \`domains/\`
`;
const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SOURCE_PATTERN = /^[a-z][a-z0-9-]*$/;

export type Store = "shared" | "repository";
export type RecordKind = "alignment" | "tickets" | "initiatives" | "workflows" | "evidence" | "sources";
export type RecordRoute = {
  adapter: string;
  store?: Store;
  inherits?: "alignment" | "workflows";
};
export type ContextRoutes = Record<RecordKind, RecordRoute>;

export type ResolvedRecord = {
  kind: RecordKind | "adr" | "tracker" | "ticket" | "initiative" | "workflow" | "source";
  adapter: string;
  store?: Store;
  root?: string;
  path?: string;
  ref: string;
  publication: "repository" | "push-if-remote" | "external";
};

export type SharedAgentContext = {
  repositoryRoot: string;
  origin: string;
  canonicalOrigin: string;
  slug: string;
  sharedRoot: string;
  candidateSharedRoot?: string;
  root: string;
  storage: Store;
  mode: "repository" | "shared" | "mixed";
  alignmentRoot: string;
  routes: ContextRoutes;
  source?: string;
  instructions?: string;
  error?: string;
};

export type Exec = (command: string, args: string[]) => Promise<{ stdout: string; code: number }>;

export type MigrationResult = {
  from: string;
  to: string;
  store: Store;
  kind: RecordKind;
  copied: string[];
};

async function readStoragePreference(sharedRoot: string): Promise<Store | undefined> {
  try {
    const value = (await fs.readFile(path.join(sharedRoot, LEGACY_STORAGE_FILE), "utf8")).trim();
    return value === "shared" || value === "repository" ? value : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}


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

function defaultRoutes(store: Store, trackerAdapter = "local-markdown"): ContextRoutes {
  return {
    alignment: { adapter: "markdown", store },
    tickets: trackerAdapter === "local-markdown"
      ? { adapter: "local-markdown", store }
      : { adapter: trackerAdapter },
    initiatives: { adapter: "markdown", store },
    workflows: { adapter: "files", store },
    evidence: { adapter: "files", store, inherits: "workflows" },
    sources: { adapter: "files", store, inherits: "alignment" },
  };
}

function parseRouteManifest(source: string): Partial<Record<RecordKind, RecordRoute>> {
  const raw = Bun.TOML.parse(source) as {
    schema?: number;
    records?: Partial<Record<RecordKind, { adapter?: string; store?: string }>>;
  };
  if (raw.schema !== 2 || !raw.records || typeof raw.records !== "object") {
    throw new Error(`${ROUTE_MANIFEST_FILE} must use schema = 2 and define [records.*]`);
  }

  const routes: Partial<Record<RecordKind, RecordRoute>> = {};
  for (const kind of ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"] as const) {
    const configured = raw.records[kind];
    if (!configured || typeof configured.adapter !== "string") {
      throw new Error(`${ROUTE_MANIFEST_FILE} must define records.${kind}.adapter`);
    }
    const route: RecordRoute = { adapter: configured.adapter };
    if (kind === "tickets" && ["local-markdown", "markdown"].includes(route.adapter)) {
      route.adapter = "local-markdown";
      if (configured.store !== "shared" && configured.store !== "repository") {
        throw new Error("records.tickets.store must be shared or repository for local-markdown");
      }
    } else if (kind === "tickets") {
      if (configured.store !== undefined) throw new Error(`records.tickets.store is not valid for ${route.adapter}`);
    } else if (kind === "evidence" || kind === "sources") {
      const parent = kind === "evidence" ? "workflows" : "alignment";
      if (configured.store === `inherit:${parent}`) {
        route.inherits = parent;
      } else if (configured.store === "shared" || configured.store === "repository") {
        route.store = configured.store;
      } else {
        throw new Error(`records.${kind}.store must be shared, repository, or inherit:${parent}`);
      }
    } else {
      if (configured.store !== "shared" && configured.store !== "repository") {
        throw new Error(`records.${kind}.store must be shared or repository`);
      }
      route.store = configured.store;
    }
    routes[kind] = route;
  }
  return routes;
}

function routeStore(routes: ContextRoutes, kind: RecordKind): Store | undefined {
  const route = routes[kind];
  if (route.store) return route.store;
  if (route.inherits) return routeStore(routes, route.inherits);
  return undefined;
}

function routeMode(routes: ContextRoutes): "repository" | "shared" | "mixed" {
  const stores = new Set((Object.keys(routes) as RecordKind[]).map((kind) => routeStore(routes, kind)).filter(Boolean));
  return stores.size === 1 ? [...stores][0]! : "mixed";
}

async function loadRoutes(candidateSharedRoot: string, repositoryRoot: string): Promise<ContextRoutes> {
  const manifest = path.join(candidateSharedRoot, ROUTE_MANIFEST_FILE);
  try {
    return parseRouteManifest(await fs.readFile(manifest, "utf8")) as ContextRoutes;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const legacy = await readStoragePreference(candidateSharedRoot);
  const store = legacy ?? ((await readSharedInstructions(candidateSharedRoot)).instructions ? "shared" : "repository");
  let trackerAdapter = "local-markdown";
  try {
    const trackerConfig = await fs.readFile(path.join(store === "shared" ? candidateSharedRoot : repositoryRoot, "docs", "agents", "issue-tracker.md"), "utf8");
    const backend = trackerConfig.match(/^backend:\s*([A-Za-z0-9-]+)/m)?.[1];
    if (backend && backend !== "local-markdown") trackerAdapter = backend;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return defaultRoutes(store, trackerAdapter);
}

export async function resolveSharedContext(
  exec: Exec,
  cwd: string,
  sharedContextBase?: string,
): Promise<SharedAgentContext | undefined> {
  const base = sharedContextBase ?? (await loadConfig()).storagePath;
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
    const routes = defaultRoutes("repository");
    return {
      repositoryRoot, origin, canonicalOrigin: "", slug: "", sharedRoot: repositoryRoot,
      root: repositoryRoot, storage: "repository", mode: "repository", alignmentRoot: repositoryRoot, routes,
      source: await existingRepositoryInstructions(repositoryRoot),
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const candidateSharedRoot = path.join(base, slug);
  const routes = await loadRoutes(candidateSharedRoot, repositoryRoot);
  const alignmentRoot = routeStore(routes, "alignment") === "shared" ? candidateSharedRoot : repositoryRoot;
  const shared = await readSharedInstructions(candidateSharedRoot);
  return {
    repositoryRoot,
    origin,
    canonicalOrigin,
    slug,
    sharedRoot: alignmentRoot,
    candidateSharedRoot,
    root: alignmentRoot,
    storage: routeStore(routes, "alignment")!,
    mode: routeMode(routes),
    alignmentRoot,
    routes,
    source: routeStore(routes, "alignment") === "shared" ? shared.source : await existingRepositoryInstructions(repositoryRoot),
    instructions: routeStore(routes, "alignment") === "shared" ? shared.instructions : undefined,
    error: shared.error,
  };
}

export async function initializeSharedContext(context: SharedAgentContext): Promise<{ agents: string; created: boolean }> {
  if (!context.candidateSharedRoot) throw new Error("Cannot initialize shared context without a canonical git origin");
  await fs.mkdir(context.candidateSharedRoot, { recursive: true });
  const agents = path.join(context.candidateSharedRoot, "AGENTS.md");
  let created = true;
  try {
    await fs.writeFile(agents, "# Shared agent context\n\nSee `docs/agents/` for engineering workflow configuration.\n", { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    created = false;
  }
  try {
    await fs.writeFile(path.join(context.candidateSharedRoot, "CONTEXT-MAP.md"), DEFAULT_CONTEXT_MAP, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  if (!await exists(path.join(context.candidateSharedRoot, ROUTE_MANIFEST_FILE))) {
    const routes = defaultRoutes("shared", context.routes.tickets.adapter);
    if (routes.tickets.adapter === "local-markdown") routes.tickets.store = "shared";
    await writeRouteManifest(context.candidateSharedRoot, routes);
  }
  return { agents, created };
}

async function writeRouteManifest(sharedRoot: string, routes: ContextRoutes): Promise<void> {
  const lines = ["schema = 2", ""];
  for (const kind of ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"] as const) {
    const route = routes[kind];
    lines.push(`[records.${kind}]`, `adapter = "${route.adapter}"`);
    if (kind === "tickets" && route.adapter !== "local-markdown") {
      // External trackers have no file store.
    } else {
      const store = route.inherits ? `inherit:${route.inherits}` : route.store ?? "repository";
      lines.push(`store = "${store}"`);
    }
    lines.push("");
  }
  await fs.writeFile(path.join(sharedRoot, ROUTE_MANIFEST_FILE), lines.join("\n"));
}

export async function resolveContextRecord(
  context: SharedAgentContext,
  options:
    | { kind: "alignment" }
    | { kind: "ticket"; id: string }
    | { kind: "initiative"; id: string }
    | { kind: "workflow"; id: string }
    | { kind: "evidence"; workflow: string; run: string }
    | { kind: "source"; source: string; ticket?: string; library?: boolean }
    | { kind: "adr"; id: string },
): Promise<ResolvedRecord> {
  const kind: RecordKind = options.kind === "adr" ? "alignment"
    : options.kind === "ticket" ? "tickets"
      : options.kind === "initiative" ? "initiatives"
        : options.kind === "workflow" ? "workflows"
          : options.kind === "source" ? "sources"
            : options.kind;
  const route = context.routes[kind];
  if (kind === "tickets" && route.adapter !== "local-markdown") {
    throw new Error(`${route.adapter} owns tickets; resolve ticket references through the ticket skill`);
  }
  const store = routeStore(context.routes, kind)!;
  const root = store === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
  if (!root) throw new Error(`No ${store} root is available for ${kind}`);
  let relative: string;
  if (options.kind === "alignment") relative = "";
  else if (options.kind === "ticket") {
    assertSegment(options.id, "id");
    relative = path.join("tracker", "tickets", `${options.id}.md`);
  } else if (options.kind === "initiative") {
    assertSegment(options.id, "id");
    relative = path.join("tracker", "initiatives", options.id);
  } else if (options.kind === "workflow") {
    assertSegment(options.id, "id");
    relative = path.join("workflows", options.id);
  } else if (options.kind === "evidence") {
    assertSegment(options.workflow, "workflow");
    assertSegment(options.run, "run");
    relative = path.join("workflows", options.workflow, "artifacts", "evidence", options.run);
  } else if (options.kind === "source") {
    if (!SOURCE_PATTERN.test(options.source)) throw new Error(`Invalid source "${options.source}"`);
    if (Boolean(options.ticket) === Boolean(options.library)) throw new Error("Source paths require exactly one of ticket or library");
    if (options.ticket) {
      assertSegment(options.ticket, "ticket");
      relative = path.join("sources", "tickets", options.ticket, options.source);
    } else relative = path.join("sources", "library", options.source);
  } else {
    assertSegment(options.id, "id");
    const dir = path.join(root, "docs", "adr");
    let names: string[] = [];
    try { names = await fs.readdir(dir); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const matches = names.filter((name) => name === `${options.id}.md` || (name.startsWith(`${options.id}-`) && name.endsWith(".md")));
    if (matches.length > 1) throw new Error(`ADR id "${options.id}" is ambiguous: ${matches.join(", ")}`);
    relative = path.join("docs", "adr", matches[0] ?? `${options.id}.md`);
  }
  const ref = relative
    ? store === "shared" ? `shared://${relative.split(path.sep).join("/")}` : relative.split(path.sep).join("/")
    : store === "shared" ? "shared://." : ".";
  return {
    kind: options.kind,
    adapter: route.adapter,
    store,
    root,
    path: path.join(root, relative),
    ref,
    publication: store === "shared" ? "push-if-remote" : "repository",
  };
}

export function renderContextReport(context: SharedAgentContext): string {
  const storeText = (kind: RecordKind) => routeStore(context.routes, kind);
  const inheritedStore = (kind: "evidence" | "sources") => {
    const route = context.routes[kind];
    return route.inherits ? `${route.inherits} -> ${storeText(kind)}` : storeText(kind);
  };
  return [
    `mode: ${context.mode}`,
    `origin: ${context.origin}`,
    `slug: ${context.slug}`,
    "",
    `alignment: ${storeText("alignment")}`,
    `tickets: ${context.routes.tickets.adapter === "local-markdown" ? storeText("tickets") : context.routes.tickets.adapter}`,
    `initiatives: ${storeText("initiatives")}`,
    `workflows: ${storeText("workflows")}`,
    `evidence: ${inheritedStore("evidence")}`,
    `sources: ${inheritedStore("sources")}`,
  ].join("\n");
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


function routeWithStore(routes: ContextRoutes, kind: RecordKind, store: Store): ContextRoutes {
  const updated: ContextRoutes = {
    ...routes,
    [kind]: { ...routes[kind], store, inherits: undefined },
  };
  for (const child of Object.keys(routes) as RecordKind[]) {
    if (routes[child].inherits !== kind) continue;
    updated[child] = { ...routes[child], store: routeStore(routes, child), inherits: undefined };
  }
  return updated;
}

export async function migrateContextRoute(
  context: SharedAgentContext,
  kind: RecordKind,
  targetStore: Store,
): Promise<MigrationResult> {
  if (!context.candidateSharedRoot) throw new Error("Cannot migrate context without a canonical git origin");
  if (kind === "tickets" && context.routes.tickets.adapter !== "local-markdown") {
    throw new Error(`${context.routes.tickets.adapter} owns tickets; there are no local ticket files to migrate`);
  }
  const sourceStore = routeStore(context.routes, kind);
  if (!sourceStore) throw new Error(`No file store is configured for ${kind}`);
  if (sourceStore === targetStore) throw new Error(`${kind} already uses ${targetStore}`);

  const from = sourceStore === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
  const to = targetStore === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
  const relatives: Record<RecordKind, string[]> = {
    alignment: ["docs/agents", "CONTEXT.md", "CONTEXT-MAP.md", "docs/adr", "domains"],
    tickets: ["tracker/tickets"],
    initiatives: ["tracker/initiatives"],
    workflows: ["workflows"],
    evidence: [],
    sources: ["sources"],
  };
  const entries: Array<{ relative: string; source: string; target: string }> = [];
  if (kind === "evidence") {
    const workflows = path.join(from, "workflows");
    if (await exists(workflows)) {
      for (const workflow of await fs.readdir(workflows, { withFileTypes: true })) {
        if (!workflow.isDirectory()) continue;
        const relative = path.join("workflows", workflow.name, "artifacts", "evidence");
        const source = path.join(from, relative);
        if (await exists(source)) entries.push({ relative, source, target: path.join(to, relative) });
      }
    }
  } else {
    for (const relative of relatives[kind]) {
      const source = path.join(from, relative);
      if (await exists(source)) entries.push({ relative, source, target: path.join(to, relative) });
    }
  }
  if (kind === "alignment") {
    const instructions = sourceStore === "shared"
      ? path.join(from, "AGENTS.md")
      : await existingRepositoryInstructions(context.repositoryRoot);
    if (instructions && await exists(instructions)) {
      entries.unshift({
        relative: path.relative(from, instructions) || path.basename(instructions),
        source: instructions,
        target: sourceStore === "shared"
          ? (await existingRepositoryInstructions(context.repositoryRoot)) ?? path.join(to, path.basename(instructions))
          : path.join(to, "AGENTS.md"),
      });
    }
  }
  const files = (await Promise.all(entries.map((entry) => filesUnder(entry.source, entry.target)))).flat()
    .filter((file) => {
      if (kind !== "workflows") return true;
      const segments = path.relative(from, file.source).split(path.sep);
      return !segments.some((segment, index) => segment === "artifacts" && segments[index + 1] === "evidence");
    });
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
  const updatedRoutes = routeWithStore(context.routes, kind, targetStore);
  await writeRouteManifest(context.candidateSharedRoot, updatedRoutes);
  return { from, to, store: targetStore, kind, copied: entries.map((entry) => entry.relative) };
}

export async function migrateAlignmentContext(context: SharedAgentContext): Promise<MigrationResult> {
  const targetStore = context.routes.alignment.store === "shared" ? "repository" : "shared";
  return migrateContextRoute(context, "alignment", targetStore);
}

export async function migrateLegacyStorage(context: SharedAgentContext): Promise<void> {
  if (!context.candidateSharedRoot) throw new Error("Cannot migrate storage without a canonical git origin");
  if (await exists(path.join(context.candidateSharedRoot, ROUTE_MANIFEST_FILE))) {
    throw new Error(`${ROUTE_MANIFEST_FILE} already exists`);
  }
  await writeRouteManifest(context.candidateSharedRoot, context.routes);
  await fs.rm(path.join(context.candidateSharedRoot, LEGACY_STORAGE_FILE), { force: true });
}

export async function listSharedContextFiles(
  exec: Exec,
  cwd: string,
  sharedContextBase?: string,
): Promise<{ stdout: string; code: number }> {
  const context = await resolveSharedContext(exec, cwd, sharedContextBase);
  if (!context) return { stdout: "", code: 0 };

  return exec("fd", [
    "--type", "f",
    "--hidden",
    "--absolute-path",
    "--exclude", ".git",
    "--exclude", ".DS_Store",
    "--exclude", ".env.local",
    ".",
    context.root,
  ]);
}

export async function listSharedContexts(
  sharedContextBase?: string,
): Promise<Array<{ slug: string; root: string; storage?: "shared" | "repository" }>> {
  const base = sharedContextBase ?? (await loadConfig()).storagePath;
  let entries;
  try {
    entries = await fs.readdir(base, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const contexts = await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      const root = path.join(base, entry.name);
      const preference = await readStoragePreference(root);
      const storage = preference ?? ((await readSharedInstructions(root)).instructions ? "shared" : undefined);
      return { slug: entry.name, root, storage };
    }));
  return contexts.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function renderSharedContext(context: SharedAgentContext): string {
  const routes = [
    `alignment=${routeStore(context.routes, "alignment")}`,
    `tickets=${context.routes.tickets.adapter === "local-markdown" ? routeStore(context.routes, "tickets") : context.routes.tickets.adapter}`,
    `initiatives=${routeStore(context.routes, "initiatives")}`,
    `workflows=${routeStore(context.routes, "workflows")}`,
    `evidence=${context.routes.evidence.inherits ? `${context.routes.evidence.inherits}->` : ""}${routeStore(context.routes, "evidence")}`,
    `sources=${context.routes.sources.inherits ? `${context.routes.sources.inherits}->` : ""}${routeStore(context.routes, "sources")}`,
  ].join(",");
  const attributes = [
    `storage="${context.storage}"`,
    `mode="${context.mode}"`,
    `root="${escapeXml(context.alignmentRoot)}"`,
    `alignment-root="${escapeXml(context.alignmentRoot)}"`,
    `routes="${escapeXml(routes)}"`,
    `shared-root="${escapeXml(context.sharedRoot)}"`,
    `repository-root="${escapeXml(context.repositoryRoot)}"`,
    `origin="${escapeXml(context.origin)}"`,
    `slug="${escapeXml(context.slug)}"`,
    `tickets="${escapeXml(context.routes.tickets.adapter)}"`,
    `initiatives="${routeStore(context.routes, "initiatives")}"`,
    `workflows="${routeStore(context.routes, "workflows")}"`,
    `evidence="${routeStore(context.routes, "evidence")}"`,
    `sources="${routeStore(context.routes, "sources")}"`,
  ];
  if (context.source) attributes.push(`source="${escapeXml(context.source)}"`);

  const instructions = context.storage === "shared" && context.instructions && context.source
    ? `<instructions source="${escapeXml(context.source)}">\n${escapeXml(context.instructions)}\n</instructions>`
    : `<instructions${context.source ? ` source="${escapeXml(context.source)}"` : ""} already-loaded="true" />`;

  return `\n\n<shared-agent-context ${attributes.join(" ")}>\n${instructions}\n</shared-agent-context>`;
}

export type ContextPathOptions =
  | { kind: "tracker" }
  | { kind: "ticket"; id: string }
  | { kind: "initiative"; id: string }
  | { kind: "workflow"; id: string }
  | { kind: "source"; source: string; ticket?: string; library?: boolean }
  | { kind: "adr"; id: string };

function assertSegment(value: string, label: string): void {
  if (!SEGMENT_PATTERN.test(value)) {
    throw new Error(`Invalid ${label} "${value}": use letters, numbers, dot, dash, or underscore`);
  }
}

export async function resolveContextPath(context: SharedAgentContext, options: ContextPathOptions): Promise<string> {
  if (options.kind === "tracker") {
    if (context.routes.tickets.adapter !== "local-markdown") {
      throw new Error(`${context.routes.tickets.adapter} owns tickets; there is no local tracker path`);
    }
    const root = context.routes.tickets.store === "shared" ? context.candidateSharedRoot : context.repositoryRoot;
    if (!root) throw new Error("No tracker store is configured");
    return path.join(root, "tracker");
  }
  return (await resolveContextRecord(context, options)).path!;
}

export function parseFrontmatter(text: string): Record<string, string> {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!block) return {};

  const fields: Record<string, string> = {};
  for (const line of block[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z0-9_]+):[ \t]*(.*)$/);
    if (!entry) continue;
    fields[entry[1]] = entry[2].trim().replace(/^"([\s\S]*)"$/, "$1").replace(/^'([\s\S]*)'$/, "$1");
  }
  return fields;
}

export type ContextIndexEntry = {
  file: string;
  title: string;
  url?: string;
};

function isWithinRoot(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

/**
 * Check an index target after resolving both paths through symlinks.
 * Lexical checks alone allow a directory inside the root to point outside it.
 */
export async function validateIndexTarget(root: string, directory: string): Promise<void> {
  const [rootReal, directoryReal] = await Promise.all([fs.realpath(root), fs.realpath(directory)]);
  if (!isWithinRoot(rootReal, directoryReal) || rootReal === directoryReal) {
    throw new Error(`Index target ${directory} must be a directory below resolved root ${root}`);
  }
  const stat = await fs.stat(directoryReal);
  if (!stat.isDirectory()) throw new Error(`Index target ${directory} is not a directory`);
}

export const INDEX_MARKER_START = "<!-- shared-context:index start -->";
export const INDEX_MARKER_END = "<!-- shared-context:index end -->";

export async function buildContextIndex(
  directory: string,
  options: { force?: boolean; root?: string } = {},
): Promise<{ path: string; entries: ContextIndexEntry[]; preserved: boolean }> {
  if (options.root) await validateIndexTarget(options.root, directory);

  const directoryReal = await fs.realpath(directory);
  const names = (await fs.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => entry.name)
    .sort();

  for (const file of names) {
    const fileReal = await fs.realpath(path.join(directory, file));
    if (!isWithinRoot(directoryReal, fileReal)) {
      throw new Error(`Index source ${path.join(directory, file)} escapes its target through a symlink`);
    }
  }

  let source = path.basename(directory);
  const entries = await Promise.all(names.map(async (file): Promise<ContextIndexEntry> => {
    const fields = parseFrontmatter(await fs.readFile(path.join(directory, file), "utf8"));
    if (fields.source) source = fields.source;
    return { file, title: fields.title || path.basename(file, ".md"), url: fields.url || undefined };
  }));

  const scope = path.basename(path.dirname(directory));
  const lines = entries.map((entry) => (entry.url
    ? `- [${entry.title}](${entry.url}) — local copy: [${entry.file}](${entry.file})`
    : `- ${entry.title} — local copy: [${entry.file}](${entry.file})`));
  const block = [INDEX_MARKER_START, lines.length > 0 ? lines.join("\n") : "No files recorded yet.", INDEX_MARKER_END].join("\n");
  const indexPath = path.join(directory, "index.md");
  try {
    const indexReal = await fs.realpath(indexPath);
    if (!isWithinRoot(directoryReal, indexReal)) {
      throw new Error(`Index file ${indexPath} escapes its target through a symlink`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const existing = await readIfPresent(indexPath);
  if (existing !== undefined) {
    const start = existing.indexOf(INDEX_MARKER_START);
    const end = existing.indexOf(INDEX_MARKER_END);
    if (start !== -1 && end > start) {
      const updated = `${existing.slice(0, start)}${block}${existing.slice(end + INDEX_MARKER_END.length)}`;
      await fs.writeFile(indexPath, updated);
      return { path: indexPath, entries, preserved: true };
    }
    if (!options.force) {
      throw new Error([
        `${indexPath} was written by hand and has no managed block.`,
        `Add ${INDEX_MARKER_START} and ${INDEX_MARKER_END} around the generated list to keep your own notes,`,
        "or pass --force to replace the whole file.",
      ].join("\n"));
    }
  }

  await fs.writeFile(indexPath, [
    "---",
    `source: "${source}"`,
    `scope: "${scope}"`,
    `generated_by: "shared-context"`,
    `generated_at: "${new Date().toISOString()}"`,
    "---",
    "",
    `# ${source} sources for ${scope}`,
    "",
    block,
    "",
  ].join("\n"));
  return { path: indexPath, entries, preserved: false };
}

async function readIfPresent(file: string): Promise<string | undefined> {
  try {
    return await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
