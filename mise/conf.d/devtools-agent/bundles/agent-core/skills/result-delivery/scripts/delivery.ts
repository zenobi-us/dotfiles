// Delivers unchanged domain results as human text, JSON, or immutable local artifacts.
// Directory handles keep publication inside the assigned directory during path races.
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, open, unlink, type FileHandle } from "node:fs/promises";
import { basename, dirname, isAbsolute, normalize } from "node:path";

export interface DeliveryContext {
  schema: "result-delivery/v1";
  kind: "context";
  audience: "human" | "agent" | "machine";
  mode: "human" | "json" | "artifact-reference";
  runId?: string;
  operationId?: string;
  target?: { path: string; ref: string; schema: string };
}

type ArtifactContext = DeliveryContext & {
  runId: string;
  operationId: string;
  target: { path: string; ref: string; schema: string };
};
const SCHEMA = "result-delivery/v1";

/** Rejects malformed contexts, including incomplete artifact identities. */
export function parseDeliveryContext(value: unknown): DeliveryContext {
  const context = object(value, "Delivery context");
  if (context.schema !== SCHEMA || context.kind !== "context") {
    throw new Error("Delivery context must use schema result-delivery/v1 and kind context.");
  }
  if (!["human", "agent", "machine"].includes(context.audience as string)) {
    throw new Error("Delivery audience must be human, agent, or machine.");
  }
  if (!["human", "json", "artifact-reference"].includes(context.mode as string)) {
    throw new Error("Delivery mode must be human, json, or artifact-reference.");
  }
  const expectedAudience = context.mode === "human" ? "human" : context.mode === "json" ? "machine" : "agent";
  if (context.audience !== expectedAudience) throw new Error("Delivery audience must match mode: human/human, machine/json, or agent/artifact-reference.");
  const parsed: DeliveryContext = {
    schema: SCHEMA,
    kind: "context",
    audience: context.audience as DeliveryContext["audience"],
    mode: context.mode as DeliveryContext["mode"],
  };
  for (const field of ["runId", "operationId"] as const) {
    if (context[field] !== undefined) parsed[field] = text(context[field], field);
  }
  if (context.target !== undefined) {
    const target = object(context.target, "Delivery target");
    parsed.target = {
      path: absoluteFilePath(target.path),
      ref: text(target.ref, "target.ref"),
      schema: text(target.schema, "target.schema"),
    };
  }
  if (parsed.mode === "artifact-reference") artifactContext(parsed);
  return parsed;
}

/** Explicit paths take precedence over RESULT_DELIVERY_CONTEXT; otherwise use human output. */
export async function loadDeliveryContext(file?: string): Promise<DeliveryContext> {
  const path = file ?? process.env.RESULT_DELIVERY_CONTEXT;
  if (path === undefined) {
    if (process.env.MUXER_SUBAGENT_ROLE === "child") throw new Error("Child result delivery requires an explicit context file or RESULT_DELIVERY_CONTEXT.");
    return { schema: SCHEMA, kind: "context", audience: "human", mode: "human" };
  }
  if (!isAbsolute(path)) throw new Error("Delivery context file must be an absolute path.");
  return parseDeliveryContext(await readJsonFile(path));
}

/** Returns display text, or a reference only after durable artifact publication. */
export async function deliverResult(result: Record<string, unknown>, context: DeliveryContext): Promise<string> {
  const parsed = parseDeliveryContext(context);
  object(result, "Domain result");
  const canonical = canonicalJson(result);
  if (parsed.mode === "json") return JSON.stringify(JSON.parse(canonical), null, 2);
  if (parsed.mode === "human") return humanResult(JSON.parse(canonical));
  const artifact = artifactContext(parsed);
  validateResult(result, artifact);
  const sha256 = digest(canonical);
  const envelope = { schema: SCHEMA, kind: "result", runId: artifact.runId, operationId: artifact.operationId, sha256, ref: artifact.target.ref, resultSchema: artifact.target.schema, result: JSON.parse(canonical) };
  const directory = await openParent(artifact.target.path);
  try {
    await publishImmutableAt(directory, basename(artifact.target.path), `${canonicalJson(envelope)}\n`);
    await readEnvelope(directory, basename(artifact.target.path), artifact);
  } finally {
    await directory.close();
  }
  return JSON.stringify(reference(artifact, sha256));
}

/** Verifies identity, expected domain schema, and canonical content hash before returning data. */
export async function readDeliveredResult(context: DeliveryContext): Promise<{ result: Record<string, unknown>; reference: Record<string, unknown> }> {
  const artifact = artifactContext(parseDeliveryContext(context));
  const directory = await openParent(artifact.target.path);
  try {
    return await readEnvelope(directory, basename(artifact.target.path), artifact);
  } finally {
    await directory.close();
  }
}

/** Writes an immutable matching .ack.json sidecar; never removes the canonical result. */
export async function acknowledgeResult(context: DeliveryContext, sha256: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error("Acknowledgement sha256 must be 64 lowercase hexadecimal characters.");
  const artifact = artifactContext(parseDeliveryContext(context));
  const directory = await openParent(artifact.target.path);
  try {
    const delivered = await readEnvelope(directory, basename(artifact.target.path), artifact);
    if (delivered.reference.sha256 !== sha256) throw new Error("Acknowledgement hash does not match the delivered result.");
    await publishImmutableAt(directory, `${basename(artifact.target.path)}.ack.json`, `${canonicalJson({ ...delivered.reference, kind: "acknowledgement" })}\n`);
  } finally {
    await directory.close();
  }
}

/** Publishes UTF-8 bytes without replacement; returns false only for identical existing content. */
export async function publishImmutableFile(path: string, content: string): Promise<boolean> {
  const target = absoluteFilePath(path);
  if (typeof content !== "string") throw new Error("Immutable file content must be a string.");
  const directory = await openParent(target);
  try {
    return await publishImmutableAt(directory, basename(target), content);
  } finally {
    await directory.close();
  }
}

function absoluteFilePath(value: unknown): string {
  const path = text(value, "target.path");
  if (!isAbsolute(path) || path.endsWith("/") || basename(path) === "." || basename(path) === "..") {
    throw new Error("Delivery target.path must be an absolute file path.");
  }
  if (path.split("/").includes("..")) throw new Error("Delivery target.path must not contain parent traversal.");
  return normalize(path);
}

function artifactContext(context: DeliveryContext): ArtifactContext {
  if (context.mode !== "artifact-reference" || !context.target || !context.runId || !context.operationId) {
    throw new Error("Artifact delivery requires mode artifact-reference, runId, operationId, and target.");
  }
  return context as ArtifactContext;
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new Error(`${field} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Delivery ${field} must be a nonempty string without control characters.`);
  }
  return value;
}

function validateResult(result: Record<string, unknown>, context: ArtifactContext): void {
  if (result.schema !== context.target.schema) throw new Error("Domain result schema does not match target.schema.");
}

function canonicalJson(value: unknown, ancestors = new Set<object>()): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== "object" || value === null) throw new Error("Result must contain only JSON values.");
  if (ancestors.has(value)) throw new Error("Result must not contain circular values.");
  if (!Array.isArray(value)) object(value, "Result value");
  if (Object.getOwnPropertySymbols(value).length) throw new Error("Result must not contain symbol keys.");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) throw new Error("Result arrays must not contain holes or extra properties.");
      return `[${Array.from({ length: value.length }, (_, index) => canonicalJson(dataProperty(value, String(index)), ancestors)).join(",")}]`;
    }
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(dataProperty(value, key), ancestors)}`).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

function dataProperty(value: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !("value" in descriptor)) throw new Error("Result must not contain accessors or missing array entries.");
  return descriptor.value;
}

function digest(canonical: string): string {
  return createHash("sha256").update(canonical).digest("hex");
}

function reference(context: ArtifactContext, sha256: string): Record<string, unknown> {
  return { schema: SCHEMA, kind: "reference", runId: context.runId, operationId: context.operationId, sha256, ref: context.target.ref, resultSchema: context.target.schema };
}

async function readEnvelope(directory: FileHandle, name: string, context: ArtifactContext): Promise<{ result: Record<string, unknown>; reference: Record<string, unknown> }> {
  const envelope = object(await readJsonFile(at(directory, name)), "Result envelope");
  if (envelope.schema !== SCHEMA || envelope.kind !== "result") throw new Error("Invalid result envelope schema or kind.");
  if (envelope.runId !== context.runId || envelope.operationId !== context.operationId || envelope.ref !== context.target.ref || envelope.resultSchema !== context.target.schema) throw new Error("Result envelope identity does not match the delivery context.");
  const result = object(envelope.result, "Domain result");
  validateResult(result, context);
  const sha256 = digest(canonicalJson(result));
  if (envelope.sha256 !== sha256) throw new Error("Result envelope hash does not match its content.");
  return { result, reference: reference(context, sha256) };
}

async function openParent(path: string): Promise<FileHandle> {
  if (process.platform !== "linux") throw new Error("Safe artifact storage requires Linux /proc/self/fd directory handles.");
  let directory = await open("/", constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    for (const component of dirname(path).split("/").filter(Boolean)) {
      const child = await open(at(directory, component), constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
      await directory.close();
      directory = child;
    }
    return directory;
  } catch (error) {
    await directory.close();
    throw error;
  }
}

function at(directory: FileHandle, name: string): string {
  return `/proc/self/fd/${directory.fd}/${name}`;
}

async function readJsonFile(path: string): Promise<unknown> {
  const bytes = await readBytesFile(path);
  let contents: string;
  try {
    contents = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Input must contain valid UTF-8 JSON.");
  }
  return parseJson(contents);
}

async function readBytesFile(path: string): Promise<Buffer> {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    if (!(await file.stat()).isFile()) throw new Error("Input must be a regular file.");
    return await file.readFile();
  } finally {
    await file.close();
  }
}

function parseJson(contents: string): unknown {
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error("Input must contain valid JSON.");
  }
}

async function publishImmutableAt(directory: FileHandle, name: string, content: string): Promise<boolean> {
  const temporary = at(directory, `.${name}.${randomUUID()}.tmp`);
  const destination = at(directory, name);
  const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  let created = false;
  try {
    try {
      await file.writeFile(content, "utf8");
      await file.sync();
    } finally {
      await file.close();
    }
    try {
      // A hard link publishes complete bytes atomically without replacing an existing entry.
      await link(temporary, destination);
      created = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (!(await readBytesFile(destination)).equals(Buffer.from(content, "utf8"))) throw new Error("Delivery conflict: the assigned artifact already contains different data or identity.");
    }
    await directory.sync();
    return created;
  } finally {
    await unlink(temporary);
  }
}

function safeText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function humanResult(result: Record<string, unknown>): string {
  const validation = resultObject(result.validation);
  const publication = resultObject(result.publication);
  const plan = resultObject(result.plan);
  const state = explicitState(result) ?? (result.ok === true ? "succeeded" : result.ok === false ? "failed" : undefined);
  const operation = [result.operation, result.phase, result.event, result.name, result.summary, result.schema].find((value) => typeof value === "string" && value.trim()) ?? "Result";
  const lines = [`${safeText(String(operation))}: ${state ? safeText(state) : "result available; use --format json for full details"}`];
  if (result.operation && typeof result.summary === "string") lines.push(`Summary: ${safeText(result.summary)}`);
  if (typeof result.verdict === "string" && result.verdict.trim()) lines.push(`Verdict: ${safeText(result.verdict)}`);
  const findings = Array.isArray(result.findings) ? result.findings.filter((value) => {
    const finding = resultObject(value);
    if (!finding) return result.verdict === "FAILURE";
    if (finding.blocking === false) return false;
    return finding.blocking === true || result.verdict === "FAILURE" || ["blocker", "blocking", "critical", "high", "P0", "P1"].includes(String(finding.severity));
  }) : [];
  const blockingFindings = [...findings, ...[result.blocking_findings, result.blockingFindings].flatMap((value) => Array.isArray(value) ? value : [])]
    .map((value) => findingSummary(value)).filter(Boolean);
  if (blockingFindings.length) lines.push(`Findings: ${[...new Set(blockingFindings)].join("; ")}`);

  const references = new Set<string>();
  for (const value of [result.ref, result.ticket_ref, result.ticket, result.workflow, result.references, result.initiatives, result.tickets, result.outputs]) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      const ref = typeof entry === "string" ? entry : resultObject(entry)?.ref;
      if (typeof ref === "string" && ref.trim()) references.add(safeText(ref));
    }
  }
  if (references.size) lines.push(`Records: ${[...references].join("; ")}`);

  const validationState = explicitState(validation) ?? (validation?.ok === false || validation?.passed === false ? "failed" : undefined);
  const validationDetails = diagnosticText([
    validation?.errors, validation?.failures,
    validationState && ["passed", "valid", "planned", "succeeded", "success"].includes(validationState) ? null
      : validationState || result.ok === false || result.verdict === "FAILURE" ? validation?.details : null,
  ]);
  if (validationState || validationDetails) {
    lines.push(`Validation: ${safeText(validationState ?? "status not reported")}${validationDetails ? `; ${validationDetails}` : ""}`);
  }
  const checks = [...(Array.isArray(result.validation) ? result.validation : []), ...(Array.isArray(result.checks) ? result.checks : [])];
  if (checks.length) {
    const failed: string[] = [];
    let passed = 0;
    let unknown = 0;
    for (const check of checks) {
      const entry = resultObject(check);
      const checkState = explicitState(entry) ?? explicitState(entry?.result);
      if (entry?.passed === false || entry?.ok === false || (checkState && !["passed", "success", "succeeded", "completed"].includes(checkState))) {
        const name = entry?.name ?? entry?.command ?? "check";
        const detail = diagnosticText(entry?.details ?? entry?.error ?? entry?.reason ?? entry?.output);
        failed.push(`${safeText(String(name))}: ${safeText(checkState ?? "failed")}${detail ? ` (${detail})` : ""}`);
      } else if (entry?.passed === true || entry?.ok === true || (checkState && ["passed", "success", "succeeded", "completed"].includes(checkState))) passed++;
      else unknown++;
    }
    if (failed.length || !validationState) lines.push(`${Array.isArray(result.validation) ? "Validation checks" : "Checks"}: ${passed} passed${unknown ? `, ${unknown} not reported` : ""}${failed.length ? `; ${failed.join("; ")}` : ""}`);
  }

  const publicationState = explicitState(result.publication);
  const publicationRequired = publication?.required === true || (typeof publication?.required === "string" && publication.required.trim().length > 0);
  if (publicationState || publicationRequired) {
    const details = new Set<string>();
    if (publicationRequired || (publicationState && !["published", "local-only", "not-required"].includes(publicationState))) {
      for (const value of [publication?.details, typeof publication?.required === "string" ? publication.required : null]) {
        const detail = diagnosticText(value);
        if (detail) details.add(detail);
      }
      if (Array.isArray(publication?.stores)) {
        for (const value of publication.stores) {
          const store = resultObject(value);
          const storeState = explicitState(store);
          if (store && storeState && !["published", "local-only"].includes(storeState)) {
            const detail = diagnosticText(store.required);
            if (detail) details.add(detail);
          }
        }
      }
    }
    lines.push(`Publication: ${safeText(publicationState ?? "state not reported")}${publicationRequired ? "; required before further work" : ""}${details.size ? `; ${[...details].join("; ")}` : ""}`);
  }
  for (const [label, values] of [
    ["Failure", [result.error, result.errors, result.failure, result.failures]],
    ["Blocked", [result.blocker, result.blockers, result.blocked_by, result.blockedBy, typeof result.blocked !== "boolean" ? result.blocked : null]],
    ["Limits", [result.limits, result.limitations, validation?.limits, validation?.limitations, result.writerSafety, plan?.writerSafety, resultObject(result.coverage ?? plan?.coverage)?.scope, resultObject(result.coverage ?? plan?.coverage)?.excluded]],
    ["Action", [result.action, result.nextAction, result.next_action, result.requiredAction]],
    ["Open questions", [result.openQuestions, result.open_questions, result.questions]],
  ] as const) {
    const details = [...new Set(values.map((value) => diagnosticText(value)).filter(Boolean))];
    if (details.length) lines.push(`${label}: ${details.join("; ")}`);
  }
  if (result.furtherWorkBlocked === true || result.blocked === true) lines.push("Blocked: further work is blocked.");
  return lines.join("\n");
}

function findingSummary(value: unknown): string {
  const finding = resultObject(value);
  if (!finding) return diagnosticText(value);
  const location = resultObject(finding.location);
  const id = finding.id ?? finding.finding_id;
  const file = finding.file ?? finding.path ?? location?.file ?? location?.path;
  const line = finding.line ?? finding.start_line ?? location?.line ?? location?.start_line;
  const parts: string[] = [];
  if (typeof id === "string" || typeof id === "number") parts.push(safeText(String(id)));
  if (typeof finding.severity === "string") parts.push(`[${safeText(finding.severity)}]`);
  if (typeof file === "string") parts.push(`${safeText(file)}${typeof line === "string" || typeof line === "number" ? `:${safeText(String(line))}` : ""}`);
  const message = finding.message ?? finding.summary ?? finding.title;
  if (typeof message === "string") parts.push(safeText(message));
  return parts.join(" ") || "Blocking finding reported; use --format json for full details.";
}

function resultObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function explicitState(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  const entry = resultObject(value);
  for (const state of [entry?.status, entry?.state, entry?.outcome]) {
    if (typeof state === "string" && state.trim()) return state;
  }
  return undefined;
}

function diagnosticText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map((entry) => diagnosticText(entry)).filter(Boolean).join("; ");
  if (typeof value === "object") return Object.entries(value).map(([key, entry]) => {
    const detail = diagnosticText(entry);
    return detail ? `${safeText(key)}: ${detail}` : "";
  }).filter(Boolean).join("; ");
  return safeText(String(value));
}
