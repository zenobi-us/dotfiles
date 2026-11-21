#!/usr/bin/env -S mise x -- bun --install=fallback
// Resolve record stores before rendering; Copier never writes directly into the repository.
import { createHash, randomUUID } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { safeUpgrade, type UpgradeOwner } from "../../../../agent-core/skills/skill-contracts/scripts/upgrades.ts";

const VERSION = "2.0.0";
const COPIER_VERSION = "9.15.1";
const SKILL_ROOT = path.resolve(import.meta.dir, "..");
const STATE_NAME = "docs/agents/setup-state.json";
const START = "<!-- matt-pocock:setup start -->";
const END = "<!-- matt-pocock:setup end -->";
const ROLES = ["needs-triage", "needs-info", "ready-for-agent", "ready-for-human", "wontfix"] as const;
type Backend = "local-markdown" | "github" | "gitlab";
type Answers = {
  schemaVersion: "tracker-setup-answers/v2";
  tracker_backend: Backend;
  domain_mode: "single" | "multi";
  triage_enabled: boolean;
  triage_labels: Record<string, string>;
  domains: string[];
  instruction_file?: "AGENTS.md" | "CLAUDE.md";
};
type RecordTarget = { kind: string; adapter: string; store?: string; root?: string; path?: string; ref: string; publication: string };
type ManagedFile = { path: string; root: string; hash: string; kind: "file" | "region" };
type State = { schemaVersion: "tracker-setup-state/v2"; version: string; copierVersion: string; templateHash: string; answers: Answers; files: ManagedFile[]; directories: string[] };
type Change = { path: string; action: "create" | "unchanged" | "managed-update" | "conflict"; before: string | null; after: string | null; reason?: string };
type Result = { schemaVersion: "tracker-setup-result/v1"; command: string; target: string; alignmentRoot: string; routes: Record<string, RecordTarget>; changes: Change[]; errors: string[]; publication: string[] };
type Options = { command: "plan" | "init" | "check"; target: string; answers?: string; templates: string; resolver: string; dryRun: boolean; json: boolean };

class SetupError extends Error {
  constructor(message: string, readonly code = 1) { super(message); }
}

const HELP = `Matt Pocock deterministic setup ${VERSION}

Usage:
  setup.ts plan TARGET --answers FILE [options]
  setup.ts init TARGET --answers FILE [--dry-run] [options]
  setup.ts check TARGET [options]

Options:
  --answers FILE         YAML configuration; required for plan and init
  --templates DIR        Copier assets directory (default: this skill's assets/)
  --shared-context FILE  Absolute shared-context CLI path (default: installed agent-core)
  --dry-run              Plan without changing the target (init only)
  --json                 Write one structured result to stdout
  -h, --help             Show this help
  --version              Show the setup CLI version

No prompts, overwrites of authored files, storage migrations, commits, or pushes.
Copier ${COPIER_VERSION} runs through uvx; first use can require network access.
Exit codes: 0 success; 1 runtime; 2 invalid input; 3 conflict; 4 failed check.
`;

function hash(text: string | Buffer): string {
  return createHash("sha256").update(text).digest("hex");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readOptional(file: string): Promise<string | null> {
  try { return await fs.readFile(file, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function parseAnswers(raw: unknown): Answers {
  if (!isObject(raw)) throw new SetupError("Answers must be a YAML mapping.", 2);
  const fields: Record<string, true> = { schemaVersion: true, schema: true, tracker_backend: true, domain_mode: true, triage_enabled: true, triage_labels: true, domains: true, instruction_file: true };
  for (const key of Object.keys(raw)) if (!Object.hasOwn(fields, key)) throw new SetupError(`Unknown answer: ${key}`, 2);
  const historical = !Object.hasOwn(raw, "schemaVersion") && raw.schema === 1;
  if (!historical && (raw.schemaVersion !== "tracker-setup-answers/v2" || Object.hasOwn(raw, "schema"))) throw new SetupError("Answers require schemaVersion: tracker-setup-answers/v2; historical schema: 1 is read-only input.", 2);
  if (!["local-markdown", "github", "gitlab"].includes(String(raw.tracker_backend))) throw new SetupError("tracker_backend must be local-markdown, github, or gitlab.", 2);
  const domain = raw.domain_mode === undefined ? "single" : raw.domain_mode;
  if (domain !== "single" && domain !== "multi") throw new SetupError("domain_mode must be single or multi.", 2);
  if (raw.triage_enabled !== undefined && typeof raw.triage_enabled !== "boolean") throw new SetupError("triage_enabled must be a boolean.", 2);
  const labels: Record<string, string> = Object.fromEntries(ROLES.map((role) => [role, role]));
  if (raw.triage_labels !== undefined) {
    if (!isObject(raw.triage_labels)) throw new SetupError("triage_labels must be a mapping.", 2);
    for (const [key, value] of Object.entries(raw.triage_labels)) {
      if (!ROLES.includes(key as typeof ROLES[number]) || typeof value !== "string" || !value.trim() || /[\r\n|`]/.test(value)) throw new SetupError(`Invalid triage label: ${key}`, 2);
      labels[key] = value;
    }
  }
  if (new Set(Object.values(labels)).size !== ROLES.length) throw new SetupError("Triage labels must be distinct.", 2);
  const domains = raw.domains === undefined ? [] : raw.domains;
  if (!Array.isArray(domains) || domains.some((value) => typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) || new Set(domains).size !== domains.length) throw new SetupError("domains must contain distinct lowercase domain IDs.", 2);
  if (domain === "multi" && domains.length === 0) throw new SetupError("Multi-context setup requires domains.", 2);
  if (domain === "single" && domains.length !== 0) throw new SetupError("domains is only valid with domain_mode: multi.", 2);
  if (raw.instruction_file !== undefined && raw.instruction_file !== "AGENTS.md" && raw.instruction_file !== "CLAUDE.md") throw new SetupError("instruction_file must be AGENTS.md or CLAUDE.md.", 2);
  return { schemaVersion: "tracker-setup-answers/v2", tracker_backend: raw.tracker_backend as Backend, domain_mode: domain, triage_enabled: raw.triage_enabled ?? true, triage_labels: labels, domains: [...domains].sort(), ...(raw.instruction_file ? { instruction_file: raw.instruction_file } : {}) };
}

function locateResolver(explicit?: string): string {
  if (explicit) {
    if (!path.isAbsolute(explicit)) throw new SetupError("--shared-context requires an absolute CLI path.", 2);
    return explicit;
  }
  const relative = path.resolve(SKILL_ROOT, "../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts");
  if (existsSync(relative)) return relative;
  try {
    const pkg = Bun.resolveSync("@zenobis/agent-bundle-agent-core/package.json", SKILL_ROOT);
    const candidate = path.join(path.dirname(pkg), "skills/shared-context/scripts/shared-context/cli.ts");
    if (existsSync(candidate)) return candidate;
  } catch { /* An explicit path is required when agent-core is installed elsewhere. */ }
  throw new SetupError("Cannot locate agent-core. Pass --shared-context with its absolute CLI path.");
}

function options(): Options | null {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); return null; }
  if (argv.includes("--version")) { console.log(VERSION); return null; }
  let parsed: { positionals: string[]; values: Record<string, string | boolean | undefined> };
  try {
    parsed = parseArgs({ args: argv, allowPositionals: true, strict: true, options: {
      answers: { type: "string" }, templates: { type: "string" }, "shared-context": { type: "string" },
      "dry-run": { type: "boolean" }, json: { type: "boolean" },
    } });
  } catch (error) { throw new SetupError((error as Error).message, 2); }
  const [command, target, ...rest] = parsed.positionals;
  if (!["plan", "init", "check"].includes(command) || !target || rest.length) throw new SetupError("Use plan|init|check TARGET. See --help.", 2);
  const values = parsed.values;
  if (command !== "check" && !values.answers) throw new SetupError("plan and init require --answers FILE.", 2);
  if (command === "check" && (values.answers || values.templates || values["dry-run"])) throw new SetupError("check uses the saved setup state; --answers, --templates, and --dry-run are not valid.", 2);
  if (command === "plan" && values["dry-run"]) throw new SetupError("plan is already read-only; --dry-run is only valid for init.", 2);
  return { command: command as Options["command"], target: path.resolve(target), answers: values.answers as string | undefined,
    templates: path.resolve(values.templates as string ?? path.join(SKILL_ROOT, "assets")),
    resolver: locateResolver(values["shared-context"] as string | undefined), dryRun: Boolean(values["dry-run"]), json: Boolean(values.json) };
}

function run(command: string[], cwd: string): string {
  const child = Bun.spawnSync(command, { cwd, stdout: "pipe", stderr: "pipe", stdin: "ignore", env: { ...process.env, NO_COLOR: "1" } });
  if (child.exitCode !== 0) throw new SetupError(`${path.basename(command[0])} failed (${child.exitCode}): ${child.stderr.toString().trim() || child.stdout.toString().trim()}`);
  return child.stdout.toString();
}

function resolveRecord(opts: Options, kind: string, args: string[] = []): RecordTarget {
  const raw = run([opts.resolver, "resolve", kind, ...args, "--json"], opts.target);
  let record: RecordTarget;
  try { record = JSON.parse(raw); }
  catch { throw new SetupError(`shared-context returned invalid JSON for ${kind}.`); }
  if (!record || typeof record.ref !== "string" || typeof record.adapter !== "string") throw new SetupError(`shared-context returned an invalid ${kind} target.`);
  return record;
}

function fileTarget(record: RecordTarget): string {
  if (!record.path || !record.root) throw new SetupError(`${record.kind} does not resolve to a file-backed target.`);
  return record.path;
}

function within(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function safePath(root: string, file: string): Promise<void> {
  if (!within(root, file)) throw new SetupError(`Path escapes its resolved store: ${file}`, 2);
  const relative = path.relative(root, file);
  let current = root;
  for (const part of ["", ...relative.split(path.sep).filter(Boolean)]) {
    if (part) current = path.join(current, part);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw new SetupError(`Symlink destination is not allowed: ${current}`, 2);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }
}

async function walk(root: string): Promise<string[]> {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of (await fs.readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new SetupError(`Template or generated symlink is not allowed: ${file}`, 2);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
    else throw new SetupError(`Unsupported template entry: ${file}`, 2);
  }
  return files;
}

async function templateHash(root: string): Promise<string> {
  const digest = createHash("sha256");
  const files = await walk(root);
  if (!files.length || !existsSync(path.join(root, "copier.yml"))) throw new SetupError("--templates must name a Copier asset tree with copier.yml.", 2);
  for (const file of files) { digest.update(path.relative(root, file)); digest.update("\0"); digest.update(await fs.readFile(file)); digest.update("\0"); }
  return digest.digest("hex");
}

function region(text: string): string | null {
  const start = text.indexOf(START), end = text.indexOf(END);
  if (start < 0 && end < 0) return null;
  if (start < 0 || end < start || text.indexOf(START, start + START.length) >= 0 || text.indexOf(END, end + END.length) >= 0) throw new SetupError("Malformed or duplicate setup region markers.", 3);
  return text.slice(start, end + END.length);
}

function wrap(body: string): string { return `${START}\n${body.trim()}\n${END}`; }

function mergeInstructions(before: string, body: string): string {
  const managed = region(before);
  if (managed) return before.replace(managed, wrap(body));
  const headings: { start: number; end: number; depth: number; title: string }[] = [];
  let fence: string | null = null;
  let offset = 0;
  for (const line of before.split(/(?<=\n)/)) {
    const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (delimiter) {
      if (!fence) fence = delimiter[1];
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && line.slice(delimiter[0].length).trim() === "") fence = null;
    } else if (!fence) {
      const heading = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*\r?\n?$/.exec(line);
      if (heading) headings.push({ start: offset, end: offset + line.length, depth: heading[1].length, title: heading[2] });
    }
    offset += line.length;
  }
  const sectionIndex = headings.findIndex((heading) => heading.depth === 2 && heading.title === "Agent skills");
  if (sectionIndex < 0) return `${before}${before.endsWith("\n\n") || !before ? "" : before.endsWith("\n") ? "\n" : "\n\n"}## Agent skills\n\n${wrap(body)}\n`;
  const section = headings[sectionIndex];
  const end = headings.slice(sectionIndex + 1).find((heading) => heading.depth <= 2)?.start ?? before.length;
  const replacements: { start: number; end: number }[] = [];
  for (let index = sectionIndex + 1; index < headings.length && headings[index].start < end; index++) {
    const heading = headings[index];
    if (heading.depth === 3 && ["Issue tracker", "Triage labels", "Domain docs"].includes(heading.title)) {
      replacements.push({ start: heading.start, end: headings.slice(index + 1).find((next) => next.depth <= 3)?.start ?? end });
    }
  }
  let contents = before.slice(section.end, end);
  for (const replacement of replacements.reverse()) contents = contents.slice(0, replacement.start - section.end) + contents.slice(replacement.end - section.end);
  return `${before.slice(0, section.end)}${contents}${contents.endsWith("\n\n") ? "" : "\n"}${wrap(body)}\n\n${before.slice(end)}`;
}

function contentErrors(file: string, body: string, exists: (destination: string) => boolean): string[] {
  const errors: string[] = [];
  if (/\{\{|\{%/.test(body)) errors.push(`Unrendered template expression: ${file}`);
  for (const match of body.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|#|SharedContext\/)/i.test(href)) continue;
    let destination: string;
    try { destination = path.resolve(path.dirname(file), decodeURIComponent(href.split("#")[0])); }
    catch { errors.push(`Invalid navigation link in ${file}: ${href}`); continue; }
    if (!exists(destination)) errors.push(`Broken navigation link in ${file}: ${href}`);
  }
  return errors;
}

function trackerMetadata(body: string | null): Record<string, unknown> | null {
  const frontmatter = body?.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  try {
    const metadata: unknown = frontmatter ? Bun.YAML.parse(frontmatter) : null;
    return isObject(metadata) ? metadata : null;
  } catch { return null; }
}

function parseState(raw: unknown, file: string): State {
  if (!isObject(raw)) throw new SetupError(`Invalid setup state: ${file}`, 4);
  const historical = !Object.hasOwn(raw, "schemaVersion") && raw.schema === 1;
  if (!historical && (raw.schemaVersion !== "tracker-setup-state/v2" || Object.hasOwn(raw, "schema"))) throw new SetupError(`Unsupported setup state: ${file}`, 4);
  const allowed: Record<string, true> = { schema: true, schemaVersion: true, version: true, copierVersion: true, templateHash: true, answers: true, files: true, directories: true };
  if (Object.keys(raw).some((key) => !Object.hasOwn(allowed, key))) throw new SetupError(`Unknown setup state field: ${file}`, 4);
  if (!Array.isArray(raw.files) || !Array.isArray(raw.directories) || raw.directories.some((entry) => typeof entry !== "string") || typeof raw.templateHash !== "string" || typeof raw.version !== "string" || typeof raw.copierVersion !== "string") throw new SetupError(`Invalid setup state: ${file}`, 4);
  const managedFields: Record<string, true> = { path: true, root: true, hash: true, kind: true };
  if (raw.files.some((entry) => !isObject(entry) || Object.keys(entry).some((key) => !Object.hasOwn(managedFields, key)) || typeof entry.path !== "string" || typeof entry.root !== "string" || typeof entry.hash !== "string")) throw new SetupError(`Unknown or malformed managed-file fields: ${file}`, 4);
  if (!isObject(raw.answers) || (historical ? raw.answers.schema !== 1 || Object.hasOwn(raw.answers, "schemaVersion") : raw.answers.schemaVersion !== "tracker-setup-answers/v2" || Object.hasOwn(raw.answers, "schema"))) throw new SetupError(`Setup state answers use a different contract generation: ${file}`, 4);
  const { schema: _historicalSchema, ...fields } = raw;
  const state = { ...fields, schemaVersion: "tracker-setup-state/v2", answers: parseAnswers(raw.answers) } as State;
  if (new Set(state.files.map((entry) => entry.path)).size !== state.files.length || state.files.some((entry) => !entry.path || !entry.root || !/^[a-f0-9]{64}$/.test(entry.hash) || !["file", "region"].includes(entry.kind))) throw new SetupError(`Invalid managed-file records: ${file}`, 4);
  return state;
}

async function normalizeSetupInput(raw: unknown, kind: "answers" | "state"): Promise<unknown> {
  if (!isObject(raw) || Object.hasOwn(raw, "schemaVersion") || raw.schema !== 1) return raw;
  if (kind === "answers") parseAnswers(raw);
  // Shared conversion validates declarations and preservation on a staging copy;
  // the existing setup transaction remains the only writer of the target files.
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-contract-upgrade-"));
  try {
    const artifact = path.join(stage, kind === "state" ? "setup-state.json" : "setup-answers.yml");
    await fs.writeFile(artifact, JSON.stringify(raw));
    await safeUpgrade({ skill: SKILL_ROOT, owner: "file:scripts/setup.ts", artifact, operation: "upgrade" });
    return JSON.parse(await fs.readFile(artifact, "utf8"));
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
}

async function loadState(file: string, authorizedUpgrade = false): Promise<State | null> {
  const text = await readOptional(file);
  if (text === null) return null;
  let raw: unknown;
  try { raw = JSON.parse(text); }
  catch { throw new SetupError(`Invalid setup state: ${file}`, 4); }
  parseState(raw, file);
  return parseState(authorizedUpgrade ? await normalizeSetupInput(raw, "state") : raw, file);
}

function setupArtifact(content: string): Record<string, unknown> {
  const raw: unknown = Bun.YAML.parse(content);
  if (!isObject(raw)) throw new SetupError("Setup artifact must be a mapping.", 2);
  return raw;
}

const setupUpgradeOwner: UpgradeOwner = {
  identify(content) {
    const raw = setupArtifact(content);
    if (Object.hasOwn(raw, "schemaVersion")) {
      if (typeof raw.schemaVersion !== "string" || Object.hasOwn(raw, "schema")) throw new SetupError("Invalid or mixed setup contract identity.", 2);
      return raw.schemaVersion;
    }
    if (raw.schema !== 1) throw new SetupError("Unsupported historical setup identity.", 2);
    return null;
  },
  detectLegacy(content) {
    const raw = setupArtifact(content);
    return raw.schema === 1 ? [Object.hasOwn(raw, "files") ? "tracker-setup-state/v1" : "tracker-setup-answers/v1"] : [];
  },
  validate(contract, content) {
    try {
      const raw = setupArtifact(content);
      const historical = contract.endsWith("/v1");
      if (historical ? raw.schema !== 1 || Object.hasOwn(raw, "schemaVersion") : raw.schemaVersion !== contract || Object.hasOwn(raw, "schema")) return false;
      if (contract === "tracker-setup-state/v1" || contract === "tracker-setup-state/v2") {
        parseState(raw, "setup-state.json");
        return true;
      }
      if (contract === "tracker-setup-answers/v1" || contract === "tracker-setup-answers/v2") {
        parseAnswers(raw);
        return true;
      }
      return false;
    } catch { return false; }
  },
  preservation(contract, content) {
    const raw = setupArtifact(content);
    // The JSON converter cannot retain YAML comments. Reject before staging bytes.
    try { JSON.parse(content); }
    catch {
      if (content.includes("#")) throw new SetupError("Cannot losslessly upgrade YAML containing '#'; retain the authored file and convert it with a comment-preserving editor.", 2);
    }
    return contract.startsWith("tracker-setup-state/") ? parseState(raw, "setup-state.json") : parseAnswers(raw);
  },
  mutable(file) {
    return ["setup-state.json", "setup-answers.yml", "setup-answers.yaml", "answers.yml", "answers.yaml"].includes(path.basename(file)) && !file.split(path.sep).some((part) => ["events", "snapshots", "reviews"].includes(part));
  },
  destinations(operation) {
    if (operation !== "upgrade") throw new SetupError("Setup adapter supports pure upgrade only.", 2);
    return ["tracker-setup-answers/v2", "tracker-setup-state/v2"];
  },
  convert(procedure, from, to, content) {
    if (procedure !== "file:references/setup-contracts/upgrade-v1-v2.md" || !((from === "tracker-setup-answers/v1" && to === "tracker-setup-answers/v2") || (from === "tracker-setup-state/v1" && to === "tracker-setup-state/v2"))) throw new SetupError("Unsupported setup upgrade procedure or endpoints.", 2);
    const raw = setupArtifact(content);
    const converted = to === "tracker-setup-state/v2" ? parseState(raw, "setup-state.json") : parseAnswers(raw);
    return { content: `${JSON.stringify(converted, null, 2)}\n`, lossless: true, requiresDecision: false };
  },
  mutate() { throw new SetupError("Setup mutations require the owning multi-file transaction.", 2); },
};

export default setupUpgradeOwner;

async function directoryEntries(directory: string): Promise<Dirent[]> {
  try { return (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

function link(from: string, destination: string): string {
  return (path.relative(from, destination) || ".").split(path.sep).map(encodeURIComponent).join("/");
}

type Link = { title: string; href: string; cross_store?: boolean };
async function recordLinks(directory: string, from = directory): Promise<Link[]> {
  return (await directoryEntries(directory)).filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => ({ title: entry.name.slice(0, -3), href: link(from, path.join(directory, entry.name)) }));
}

async function context(opts: Options): Promise<{ routes: Record<string, RecordTarget>; alignment: string; tracker: string | null; tickets: string | null; initiatives: string; adr: string; workflows: string }> {
  const routes: Record<string, RecordTarget> = {};
  routes.alignment = resolveRecord(opts, "alignment");
  const report = run([opts.resolver, "report"], opts.target);
  const ticketRoute = /^tickets: ([^\r\n]+)$/m.exec(report)?.[1];
  if (ticketRoute === "repository" || ticketRoute === "shared") routes.tickets = resolveRecord(opts, "tracker");
  else if (ticketRoute === "github" || ticketRoute === "gitlab") {
    routes.tickets = { kind: "tracker", adapter: ticketRoute, ref: ticketRoute, publication: "external" };
  } else throw new SetupError(`Unsupported reported ticket route: ${ticketRoute ?? "(missing)"}`, 2);
  routes.initiatives = resolveRecord(opts, "initiatives");
  routes.workflows = resolveRecord(opts, "workflow", ["--id", "setup-navigation"]);
  routes.evidence = resolveRecord(opts, "evidence", ["--workflow", "setup-navigation", "--run", "setup-navigation"]);
  routes.sources = resolveRecord(opts, "sources");
  const alignment = fileTarget(routes.alignment);
  const adr = fileTarget(resolveRecord(opts, "adr", ["--id", "index"]));
  let tracker: string | null = null, tickets: string | null = null;
  if (routes.tickets.adapter === "local-markdown") {
    tracker = fileTarget(routes.tickets);
    const collection = resolveRecord(opts, "tickets");
    tickets = fileTarget(collection);
    routes.ticketCollection = collection;
  }
  return { routes, alignment, tracker, tickets, initiatives: fileTarget(routes.initiatives), adr, workflows: path.dirname(fileTarget(routes.workflows)) };
}

async function plan(opts: Options, answers: Answers): Promise<{ result: Result; roots: Map<string, string>; directories: string[] }> {
  const ctx = await context(opts);
  if (ctx.routes.tickets.adapter !== answers.tracker_backend) throw new SetupError(`tracker_backend ${answers.tracker_backend} conflicts with the resolved ${ctx.routes.tickets.adapter} route. Change tracker routes explicitly through shared-context first.`, 2);
  const statePath = path.join(ctx.alignment, STATE_NAME);
  await safePath(ctx.alignment, statePath);
  const previous = await loadState(statePath, opts.command === "init" && !opts.dryRun);
  const result: Result = { schemaVersion: "tracker-setup-result/v1", command: opts.command, target: opts.target, alignmentRoot: ctx.alignment, routes: ctx.routes, changes: [], errors: [], publication: [] };
  const roots = new Map<string, string>();
  const directories = ctx.tickets ? [ctx.tickets, ctx.initiatives] : [];
  const stores = new Set(Object.values(ctx.routes).map((record) => record.root).filter((root): root is string => Boolean(root)));
  for (const entry of previous?.files ?? []) if (!stores.has(entry.root) || !within(entry.root, entry.path)) throw new SetupError(`Saved path is outside current resolved stores: ${entry.path}`, 4);
  const oldFiles = new Map(previous?.files.map((entry) => [entry.path, entry]) ?? []);
  const nextFiles: ManagedFile[] = [];
  const desiredPaths = new Set<string>();
  const add = async (file: string, root: string, body: string, kind: "file" | "region", instructions = false): Promise<void> => {
    if (file === statePath) throw new SetupError("Templates cannot replace setup-state.json.", 2);
    if (desiredPaths.has(file)) throw new SetupError(`Multiple templates target the same file: ${file}`, 2);
    desiredPaths.add(file);
    roots.set(file, root);
    await safePath(root, file);
    const before = await readOptional(file);
    const old = oldFiles.get(file);
    let after = body;
    let ownedBefore: string | null = before;
    let conflict: string | undefined;
    if (kind === "region") {
      const existingRegion = before === null ? null : region(before);
      ownedBefore = existingRegion;
      if (before === null) after = instructions ? `## Agent skills\n\n${wrap(body)}\n` : `${wrap(body)}\n`;
      else if (existingRegion) after = before.replace(existingRegion, wrap(body));
      else if (instructions) after = mergeInstructions(before, body);
      else { after = before; conflict = "Authored index has no setup-owned region. Add the setup markers around the region you want to manage."; }
    }
    const ownedAfter = kind === "region" ? region(after) : after;
    if (old && ownedBefore !== null && hash(ownedBefore) !== old.hash) conflict = "The setup-owned content was edited. Preserve or reconcile it before setup.";
    if (before !== null && before !== after && kind === "file" && !old) conflict = "Existing authored file is not owned by setup.";
    if (old && ownedBefore === null) conflict = "A previously managed file or region was removed. Restore or reconcile it before setup.";
    const action = conflict ? "conflict" : before === null ? "create" : before === after ? "unchanged" : "managed-update";
    result.changes.push({ path: file, action, before, after, ...(conflict ? { reason: conflict } : {}) });
    if (ownedAfter !== null) nextFiles.push({ path: file, root, hash: hash(ownedAfter), kind });
  };
  if (ctx.routes.alignment.store === "shared") {
    const manifest = path.join(ctx.alignment, ".context-routes.toml");
    await safePath(ctx.alignment, manifest);
    const sharedRoutes = await readOptional(manifest);
    const repository = run(["git", "rev-parse", "--show-toplevel"], opts.target).trim();
    const repositoryRoutes = await readOptional(path.join(repository, ".context-routes.toml"));
    // Shared instructions change resolver precedence; carry the existing routes, not new routes.
    if (sharedRoutes === null && repositoryRoutes !== null) await add(manifest, ctx.alignment, repositoryRoutes, "file");
    else if (oldFiles.has(manifest) && sharedRoutes !== null) await add(manifest, ctx.alignment, sharedRoutes, "file");
  }
  const templateDigest = await templateHash(opts.templates);
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), "matt-pocock-render-"));
  try {
    const claude = path.join(ctx.alignment, "CLAUDE.md"), agents = path.join(ctx.alignment, "AGENTS.md");
    let instructions: string;
    if (ctx.routes.alignment.store === "shared") instructions = agents;
    else if (existsSync(claude)) instructions = claude;
    else if (existsSync(agents)) instructions = agents;
    else if (answers.instruction_file) instructions = path.join(ctx.alignment, answers.instruction_file);
    else throw new SetupError("Neither AGENTS.md nor CLAUDE.md exists. Set instruction_file in the answers.", 2);
    const adrDirectory = path.dirname(ctx.adr);
    const contextLinks: Link[] = [];
    const knownLinks: [string, string][] = [["Agent configuration", path.join(ctx.alignment, "docs/agents")], ["Architecture decisions", ctx.adr], ["Issue tracker configuration", path.join(ctx.alignment, "docs/agents/issue-tracker.md")], ["Domain configuration", path.join(ctx.alignment, "docs/agents/domain.md")]];
    if (ctx.tracker) {
      if (ctx.routes.tickets.root === ctx.alignment) knownLinks.push(["Local Markdown tracker", path.join(ctx.tracker, "index.md")]);
      else contextLinks.push({ title: "Local Markdown tracker", href: `${ctx.routes.tickets.ref}/index.md`, cross_store: true });
    }
    if (existsSync(path.join(ctx.alignment, "CONTEXT.md"))) knownLinks.push(["Domain context", path.join(ctx.alignment, "CONTEXT.md")]);
    for (const domain of answers.domains) if (existsSync(path.join(ctx.alignment, "domains", domain, "CONTEXT.md"))) knownLinks.push([`${domain} context`, path.join(ctx.alignment, "domains", domain, "CONTEXT.md")]);
    for (const [title, destination] of knownLinks) contextLinks.push({ title, href: link(ctx.alignment, destination) });
    const initiativeLinks: Link[] = [];
    const initiativeTargets: RecordTarget[] = [];
    for (const entry of await directoryEntries(ctx.initiatives)) if (entry.isDirectory()) {
      const record = resolveRecord(opts, "initiative", ["--id", entry.name]);
      initiativeTargets.push(record);
      const crossStore = (ctx.tracker ? ctx.routes.tickets.root : ctx.alignment) !== record.root;
      initiativeLinks.push({ title: entry.name,
        href: crossStore ? `${record.ref}/index.md` : link(ctx.tracker ?? ctx.alignment, path.join(fileTarget(record), "index.md")),
        ...(crossStore ? { cross_store: true } : {}) });
    }
    const workflowLinks: Link[] = [];
    for (const entry of await directoryEntries(ctx.workflows)) if (entry.isDirectory()) workflowLinks.push({ title: entry.name, href: `${encodeURIComponent(entry.name)}/` });
    const data = {
      ...answers, issue_root: ctx.tickets ? path.relative(ctx.routes.ticketCollection.root!, ctx.tickets).split(path.sep).join("/") : "",
      initiative_root: path.relative(ctx.routes.initiatives.root!, ctx.initiatives).split(path.sep).join("/"),
      tracker_ref: ctx.tracker ? `${ctx.routes.tickets.ref}/index.md` : ctx.routes.tickets.ref,
      tickets_ref: ctx.tickets && ctx.tracker ? `${link(ctx.tracker, ctx.tickets)}/` : "",
      initiatives_ref: ctx.tracker && ctx.routes.tickets.root === ctx.routes.initiatives.root ? `${link(ctx.tracker, ctx.initiatives)}/` : ctx.routes.initiatives.ref,
      initiatives_cross_store: Boolean(ctx.tracker && ctx.routes.tickets.root !== ctx.routes.initiatives.root),
      adr_links: await recordLinks(adrDirectory), workflow_links: workflowLinks, initiative_links: initiativeLinks,
      ticket_links: ctx.tickets ? await recordLinks(ctx.tickets, ctx.tracker!) : [], context_links: contextLinks,
      initiative_records: [] as Link[],
      origin: run(["git", "remote", "get-url", "origin"], opts.target).trim(),
    };
    const dataFile = path.join(stage, "answers.json");
    await fs.writeFile(dataFile, JSON.stringify(data));
    const output = path.join(stage, "rendered");
    run(["uvx", "--from", `copier==${COPIER_VERSION}`, "copier", "copy", "--defaults", "--skip-tasks", "--data-file", dataFile, opts.templates, output], stage);
    const rendered = await walk(output);
    let fragment: string | null = null;
    for (const source of rendered) {
      const relative = path.relative(output, source);
      const [group, ...parts] = relative.split(path.sep);
      const tail = parts.join(path.sep);
      const body = await fs.readFile(source, "utf8");
      if (group === "fragments" && tail === "agent-skills.md") { fragment = body; continue; }
      if (group === "initiatives" && tail === "index.md") continue;
      if (group === "alignment") {
        if (!answers.triage_enabled && tail === "docs/agents/triage-labels.md") continue;
        await add(path.join(ctx.alignment, tail), ctx.alignment, body, tail === "CONTEXT-MAP.md" ? "region" : "file");
      } else if (group === "tracker") {
        if (ctx.tracker) await add(path.join(ctx.tracker, tail), ctx.routes.tickets.root!, body, "region");
      } else if (group === "adr" && tail === "index.md") await add(ctx.adr, ctx.routes.alignment.root!, body, "region");
      else if (group === "workflows") {
        if (existsSync(ctx.workflows)) await add(path.join(ctx.workflows, tail), ctx.routes.workflows.root!, body, "region");
      } else throw new SetupError(`Unsupported rendered target group: ${relative}`, 2);
    }
    for (const [index, target] of initiativeTargets.entries()) {
      const directory = fileTarget(target);
      await fs.writeFile(dataFile, JSON.stringify({ ...data, initiative_records: await recordLinks(directory) }));
      const renderedInitiative = path.join(stage, `initiative-${index}`);
      run(["uvx", "--from", `copier==${COPIER_VERSION}`, "copier", "copy", "--defaults", "--skip-tasks", "--data-file", dataFile,
        "--exclude", "alignment", "--exclude", "fragments", "--exclude", "tracker", "--exclude", "adr", "--exclude", "workflows",
        opts.templates, renderedInitiative], stage);
      const body = await fs.readFile(path.join(renderedInitiative, "initiatives/index.md"), "utf8");
      await add(path.join(directory, "index.md"), target.root!, body, "region");
    }
    if (fragment === null) throw new SetupError("Template tree must render fragments/agent-skills.md.", 2);
    await add(instructions, ctx.alignment, fragment, "region", true);
  } finally { await fs.rm(stage, { recursive: true, force: true }); }
  for (const old of oldFiles.values()) if (!desiredPaths.has(old.path)) {
    await safePath(old.root, old.path);
    roots.set(old.path, old.root);
    const before = await readOptional(old.path);
    const owned = before === null ? null : old.kind === "region" ? region(before) : before;
    if (owned === null || hash(owned) !== old.hash) {
      result.changes.push({ path: old.path, action: "conflict", before, after: before, reason: "Retired setup content was edited or removed." });
      continue;
    }
    const remaining = old.kind === "region" ? before!.replace(owned, "") : "";
    const after = remaining.trim() ? remaining : null;
    result.changes.push({ path: old.path, action: "managed-update", before, after });
  }
  nextFiles.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const state: State = { schemaVersion: "tracker-setup-state/v2", version: VERSION, copierVersion: COPIER_VERSION, templateHash: templateDigest, answers, files: nextFiles, directories: directories.sort() };
  const stateText = `${JSON.stringify(state, null, 2)}\n`;
  const oldState = await readOptional(statePath);
  roots.set(statePath, ctx.alignment);
  result.changes.push({ path: statePath, action: oldState === stateText ? "unchanged" : oldState === null ? "create" : "managed-update", before: oldState, after: stateText });
  result.changes.sort((a, b) => a.path.localeCompare(b.path, "en"));
  result.publication = [...new Set(Object.values(ctx.routes).filter((record) => record.store === "shared").map((record) => record.root!))].sort();
  const overlay = new Map(result.changes.map((change) => [change.path, change.after]));
  const projectedDirectories = new Set(directories);
  for (const change of result.changes) if (change.after !== null) {
    let parent = path.dirname(change.path);
    while (!projectedDirectories.has(parent) && parent !== path.dirname(parent)) {
      projectedDirectories.add(parent);
      parent = path.dirname(parent);
    }
  }
  const projectedExists = (file: string): boolean => overlay.has(file) ? overlay.get(file) !== null : projectedDirectories.has(file) || existsSync(file);
  for (const entry of nextFiles) {
    const text = overlay.get(entry.path)!;
    const owned = entry.kind === "region" ? region(text!) : text;
    if (owned !== null) result.errors.push(...contentErrors(entry.path, owned, projectedExists));
  }
  const metadata = trackerMetadata(overlay.get(path.join(ctx.alignment, "docs/agents/issue-tracker.md")) ?? null);
  if (metadata?.backend !== answers.tracker_backend) result.errors.push("Rendered tracker frontmatter must name the resolved backend.");
  if (ctx.tickets && (metadata?.["issue-root"] !== path.relative(ctx.routes.ticketCollection.root!, ctx.tickets).split(path.sep).join("/")
    || metadata?.["initiative-root"] !== path.relative(ctx.routes.initiatives.root!, ctx.initiatives).split(path.sep).join("/"))) {
    result.errors.push("Rendered tracker roots must preserve the resolved ticket and initiative collections.");
  }
  return { result, roots, directories };
}

async function apply(changes: Change[], roots: Map<string, string>, directories: string[]): Promise<void> {
  for (const change of changes) {
    await safePath(roots.get(change.path)!, change.path);
    if (await readOptional(change.path) !== change.before) throw new SetupError(`File changed after planning: ${change.path}`, 3);
  }
  const staged: { change: Change; temporary: string | null }[] = [];
  const createdDirectories: string[] = [];
  const makeDirectory = async (directory: string): Promise<void> => {
    if (existsSync(directory)) return;
    await makeDirectory(path.dirname(directory));
    await fs.mkdir(directory);
    createdDirectories.push(directory);
  };
  try {
    for (const directory of directories) await makeDirectory(directory);
    for (const change of changes) if (change.action !== "unchanged") {
      await makeDirectory(path.dirname(change.path));
      let temporary: string | null = null;
      if (change.after !== null) {
        temporary = path.join(path.dirname(change.path), `.${path.basename(change.path)}.setup-${randomUUID()}`);
        const mode = change.before === null ? 0o644 : (await fs.stat(change.path)).mode;
        const handle = await fs.open(temporary, "wx", mode);
        try { await handle.writeFile(change.after, "utf8"); await handle.sync(); } finally { await handle.close(); }
      }
      staged.push({ change, temporary });
    }
    const applied: Change[] = [];
    try {
      for (const { change, temporary } of staged) {
        if (await readOptional(change.path) !== change.before) throw new SetupError(`File changed during setup: ${change.path}`, 3);
        if (temporary) await fs.rename(temporary, change.path);
        else await fs.unlink(change.path);
        applied.push(change);
      }
    } catch (error) {
      for (const change of applied.reverse()) {
        if (change.before === null) await fs.rm(change.path, { force: true });
        else await fs.writeFile(change.path, change.before);
      }
      throw error;
    }
  } catch (error) {
    for (const directory of createdDirectories.reverse()) {
      try { await fs.rmdir(directory); } catch { /* Keep directories that acquired user content. */ }
    }
    throw error;
  } finally {
    for (const { temporary } of staged) if (temporary) await fs.rm(temporary, { force: true });
  }
}

async function check(opts: Options): Promise<Result> {
  const ctx = await context(opts);
  const result: Result = { schemaVersion: "tracker-setup-result/v1", command: "check", target: opts.target, alignmentRoot: ctx.alignment, routes: ctx.routes, changes: [], errors: [], publication: [] };
  const statePath = path.join(ctx.alignment, STATE_NAME);
  await safePath(ctx.alignment, statePath);
  const state = await loadState(statePath);
  if (!state) { result.errors.push("Setup state is missing. Run plan and init first."); return result; }
  const allowed = new Set(Object.values(ctx.routes).map((record) => record.root).filter(Boolean));
  for (const entry of state.files) {
    if (!allowed.has(entry.root)) { result.errors.push(`Managed store is no longer routed: ${entry.root}`); continue; }
    await safePath(entry.root, entry.path);
    const body = await readOptional(entry.path);
    const owned = body === null ? null : entry.kind === "region" ? region(body) : body;
    if (owned === null || hash(owned) !== entry.hash) result.errors.push(`Managed content differs: ${entry.path}`);
    if (owned !== null) result.errors.push(...contentErrors(entry.path, owned, existsSync));
  }
  if (state.answers.tracker_backend !== ctx.routes.tickets.adapter) result.errors.push("Saved tracker backend conflicts with the current route.");
  const tracker = await readOptional(path.join(ctx.alignment, "docs/agents/issue-tracker.md"));
  const metadata = trackerMetadata(tracker);
  if (metadata?.backend !== state.answers.tracker_backend) result.errors.push("Tracker frontmatter does not name the configured backend.");
  for (const directory of state.directories) {
    const root = [...allowed].find((candidate) => candidate && within(candidate, directory));
    if (!root) { result.errors.push(`Collection is outside current stores: ${directory}`); continue; }
    await safePath(root, directory);
    try { if (!(await fs.stat(directory)).isDirectory()) result.errors.push(`Collection is not a directory: ${directory}`); }
    catch { result.errors.push(`Collection directory is missing: ${directory}`); }
  }
  if (ctx.tickets && !state.directories.includes(ctx.tickets)) result.errors.push("Ticket collection resolution changed since setup.");
  if (ctx.tickets && !state.directories.includes(ctx.initiatives)) result.errors.push("Initiative collection resolution changed since setup.");
  return result;
}

function output(opts: Options, result: Result): void {
  if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }
  console.log(`Alignment: ${result.alignmentRoot}`);
  for (const [name, record] of Object.entries(result.routes)) console.log(`${name}: ${record.store ?? record.adapter} ${record.path ?? record.ref}`);
  for (const change of result.changes) {
    console.log(`${change.action.toUpperCase()} ${change.path}${change.reason ? `: ${change.reason}` : ""}`);
    if (opts.command === "plan" || opts.dryRun) if (change.before !== change.after) {
      console.log(`--- before ${change.path}\n${change.before ?? "(absent)"}\n+++ after ${change.path}\n${change.after ?? "(removed)"}`);
    }
  }
  for (const error of result.errors) console.error(error);
  for (const root of result.publication) console.error(`Shared store changed only locally. Follow shared-context publication rules: ${root}`);
  if (opts.command === "check" && !result.errors.length) console.log("Setup check passed.");
}

async function main(): Promise<void> {
  const opts = options();
  if (!opts) return;
  opts.target = await fs.realpath(opts.target);
  if (opts.command === "check") {
    const result = await check(opts); output(opts, result); if (result.errors.length) process.exitCode = 4; return;
  }
  let raw: unknown;
  try { raw = Bun.YAML.parse(await fs.readFile(path.resolve(opts.answers!), "utf8")); }
  catch (error) { throw new SetupError(`Cannot read YAML answers: ${(error as Error).message}`, 2); }
  const authorizedUpgrade = opts.command === "init" && !opts.dryRun;
  const planned = await plan(opts, parseAnswers(authorizedUpgrade ? await normalizeSetupInput(raw, "answers") : raw));
  const conflicts = planned.result.changes.some((change) => change.action === "conflict");
  if (conflicts) { output(opts, planned.result); process.exitCode = 3; return; }
  if (planned.result.errors.length) { output(opts, planned.result); process.exitCode = 4; return; }
  if (opts.command === "init" && !opts.dryRun) {
    await apply(planned.result.changes, planned.roots, planned.directories);
    const verified = await check(opts);
    planned.result.errors.push(...verified.errors);
    if (verified.errors.length) process.exitCode = 4;
  }
  output(opts, planned.result);
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const code = error instanceof SetupError ? error.code : 1;
    const message = error instanceof Error ? error.message : String(error);
    if (process.argv.includes("--json")) console.log(JSON.stringify({ schemaVersion: "tracker-setup-error/v1", error: message, code }));
    console.error(message);
    process.exitCode = code;
  });
}
