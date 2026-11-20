// Owners interpret content. This module plans declared paths and commits only validated bytes.
import { lstat, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { loadContracts, type ResolvedContracts } from "./contracts.ts";

type Awaitable<T> = T | Promise<T>;
export interface UpgradeOwner {
  identify(content: string): Awaitable<string | null>;
  detectLegacy(content: string): Awaitable<string[]>;
  validate(contract: string, content: string): Awaitable<boolean>;
  preservation(contract: string, content: string): Awaitable<unknown>;
  mutable(path: string, content: string): Awaitable<boolean>;
  destinations(operation: string): Awaitable<string[]>;
  convert(procedure: string, from: string, to: string, content: string): Awaitable<{ content: string; lossless: boolean; requiresDecision: boolean }>;
  mutate(operation: string, contract: string, content: string, request: unknown): Awaitable<string>;
}
export interface UpgradeRequest {
  skill: string;
  owner: string;
  artifact: string;
  operation: string;
  request?: unknown;
}
export interface UpgradeResult {
  status: "completed" | "failed";
  cleanup_errors?: string[];
  artifact: string;
  changed: boolean;
  from: string;
  to: string;
}
export interface BulkUpgradeResult {
  status: "completed" | "partial" | "failed";
  results: (UpgradeResult | { artifact: string; status: "failed"; changed: false; error: string })[];
}

/** Caller authorization precedes this operation. Owner hooks must be pure, trusted installed code. */
export async function safeUpgrade(request: UpgradeRequest): Promise<UpgradeResult> {
  const contracts = await loadContracts(request.skill);
  const owner = await loadOwner(request.skill, request.owner);
  const path = resolve(request.artifact);
  const lock = await open(`${path}.contract-upgrade.lock`, "wx", 0o600);
  let temporary: string | undefined;
  let outcome: Omit<UpgradeResult, "status" | "cleanup_errors"> | undefined;
  let failure: { error: unknown } | undefined;
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error("Artifact must be a regular, non-symlink, singly linked file.");
    const original = await readFile(path);
    const content = original.toString("utf8");
    if (!Buffer.from(content).equals(original)) throw new Error("Artifact must contain losslessly decoded UTF-8 text.");
    if (await owner.mutable(path, content) !== true) throw new Error("Immutable artifact requires a historical reader; conversion is forbidden.");
    const from = await sourceContract(owner, contracts, content);
    await validateContent(owner, from, content, "source");
    const destinations = await owner.destinations(request.operation);
    if (!Array.isArray(destinations) || destinations.length === 0 || new Set(destinations).size !== destinations.length || destinations.some((id) => !contracts.manifest.produces.includes(id))) {
      throw new Error("Operation destinations must be distinct declared produced contracts.");
    }
    const paths = upgradePaths(contracts, from, new Set(destinations));
    if (paths.length !== 1) throw new Error(paths.length === 0 ? "No declared upgrade path for this operation." : "Ambiguous upgrade destination or path for this operation.");
    let converted = content;
    let current = from;
    for (const edge of paths[0]) {
      const result = await owner.convert(edge.procedure, edge.from, edge.to, converted);
      if (result.lossless !== true || result.requiresDecision !== false || typeof result.content !== "string") {
        throw new Error("Conversion loses data or requires a user decision.");
      }
      await validateContent(owner, edge.to, result.content, "destination");
      if (await owner.identify(result.content) !== edge.to) throw new Error("Conversion did not produce the declared destination identifier.");
      const before = await owner.preservation(current, converted);
      const after = await owner.preservation(edge.to, result.content);
      if (before === undefined || after === undefined || !isDeepStrictEqual(before, after)) {
        throw new Error("Conversion changed meaning or authored content.");
      }
      converted = result.content;
      current = edge.to;
    }
    if (request.operation !== "upgrade") {
      converted = await owner.mutate(request.operation, current, converted, request.request);
      if (typeof converted !== "string" || await owner.identify(converted) !== current) throw new Error("Mutation changed the destination contract.");
      await validateContent(owner, current, converted, "mutation");
    }
    const changed = converted !== content;
    if (changed) {
      temporary = resolve(dirname(path), `.contract-upgrade-${crypto.randomUUID()}`);
      const output = await open(temporary, "wx", stat.mode & 0o777);
      try { await output.writeFile(converted, "utf8"); await output.sync(); } finally { await output.close(); }
      const latest = await lstat(path);
      if (latest.dev !== stat.dev || latest.ino !== stat.ino || latest.mtimeMs !== stat.mtimeMs || latest.ctimeMs !== stat.ctimeMs || !(await readFile(path)).equals(original)) {
        throw new Error("Artifact changed during conversion; no conversion was persisted.");
      }
      await rename(temporary, path);
      temporary = undefined;
    }
    outcome = { artifact: path, changed, from, to: current };
  } catch (error) {
    failure = { error };
  }
  // Cleanup cannot undo a rename. Report its failure independently of persisted bytes.
  const cleanup = await Promise.allSettled([
    temporary ? unlink(temporary) : Promise.resolve(),
    lock.close(),
    unlink(`${path}.contract-upgrade.lock`),
  ]);
  const messages = ["Cannot remove the temporary upgrade file.", "Cannot close the artifact upgrade lock.", "Cannot remove the artifact upgrade lock."];
  const cleanupErrors = cleanup.flatMap((result, index) => result.status === "rejected" ? [messages[index]] : []);
  if (failure) {
    if (cleanupErrors.length) throw new Error(`${failure.error instanceof Error ? failure.error.message : "Conversion failed."} ${cleanupErrors.join(" ")}`);
    throw failure.error;
  }
  if (!outcome) throw new Error("Upgrade did not produce an outcome.");
  return { ...outcome, status: cleanupErrors.length ? "failed" : "completed", ...(cleanupErrors.length ? { cleanup_errors: cleanupErrors } : {}) };
}

/** Each item commits independently. Partial persistence is explicitly unsuccessful overall. */
export async function bulkUpgrade(request: Omit<UpgradeRequest, "artifact" | "operation">, artifacts: string[]): Promise<BulkUpgradeResult> {
  if (!Array.isArray(artifacts) || artifacts.some((path) => typeof path !== "string") || new Set(artifacts.map((path) => resolve(path))).size !== artifacts.length) {
    throw new Error("Bulk input must contain distinct artifact paths.");
  }
  const results: BulkUpgradeResult["results"] = [];
  for (const artifact of artifacts) {
    try { results.push(await safeUpgrade({ ...request, artifact, operation: "upgrade" })); }
    catch (error) { results.push({ artifact: resolve(artifact), status: "failed", changed: false, error: error instanceof Error ? error.message : "Conversion failed." }); }
  }
  const failures = results.filter((result) => result.status === "failed").length;
  return { status: failures === 0 ? "completed" : failures === results.length ? "failed" : "partial", results };
}

async function loadOwner(skill: string, reference: string): Promise<UpgradeOwner> {
  if (!reference.startsWith("file:")) throw new Error("Owner adapter must be an installed file: module, never historical executable code.");
  const local = reference.slice(5);
  const root = resolve(skill);
  const path = resolve(root, local);
  if (!local || isAbsolute(local) || relative(root, path).startsWith("..")) throw new Error("Owner adapter must be inside the installed skill directory.");
  // The owner module is runtime-selected from the installed skill.
  const owner = (await import(pathToFileURL(path).href)).default;
  for (const method of ["identify", "detectLegacy", "validate", "preservation", "mutable", "destinations", "convert", "mutate"]) {
    if (typeof owner?.[method] !== "function") throw new Error("Owner adapter must implement every upgrade hook.");
  }
  return owner;
}

async function sourceContract(owner: UpgradeOwner, contracts: ResolvedContracts, content: string): Promise<string> {
  const explicit = await owner.identify(content);
  if (explicit !== null) {
    if (!contracts.manifest.accepts.includes(explicit)) throw new Error("Unsupported explicit contract identifier; legacy detection is forbidden.");
    return explicit;
  }
  const matches = await owner.detectLegacy(content);
  if (!Array.isArray(matches) || matches.length !== 1 || !contracts.manifest.accepts.includes(matches[0])) {
    throw new Error("Legacy detection must match exactly one supported source contract.");
  }
  return matches[0];
}

async function validateContent(owner: UpgradeOwner, contract: string, content: string, phase: string): Promise<void> {
  if (await owner.validate(contract, content) !== true) throw new Error(`Failed ${phase} content validation.`);
}

type Edge = ResolvedContracts["manifest"]["upgrades"][number];
function upgradePaths(contracts: ResolvedContracts, source: string, destinations: Set<string>): Edge[][] {
  const paths: Edge[][] = [];
  function visit(current: string, path: Edge[], seen: Set<string>): void {
    if (destinations.has(current)) paths.push(path);
    if (paths.length > 1) return;
    for (const edge of contracts.manifest.upgrades) {
      if (edge.from === current && !seen.has(edge.to)) visit(edge.to, [...path, edge], new Set([...seen, edge.to]));
      if (paths.length > 1) return;
    }
  }
  visit(source, [], new Set([source]));
  return paths;
}
