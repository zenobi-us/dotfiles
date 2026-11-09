// Exercise the public delivery boundary against isolated real filesystem artifacts.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { acknowledgeResult, deliverResult, loadDeliveryContext, parseDeliveryContext, publishImmutableFile, readDeliveredResult, type DeliveryContext } from "./delivery.ts";

let root: string;
let context: DeliveryContext;
const result = { schema: "example-result/v1", status: "failed", checks: [{ name: "unit", passed: false }], publication: { state: "not-published" }, ref: "ticket://123" };

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "result-delivery-"));
  const path = join(root, "result.json");
  context = { schema: "result-delivery/v1", kind: "context", audience: "agent", mode: "artifact-reference", runId: "run-1", operationId: "operation-1", target: { path, ref: pathToFileURL(path).href, schema: result.schema } };
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("durable artifact delivery", () => {
  test("publishes a complete private envelope and returns only its verified reference", async () => {
    const output = JSON.parse(await deliverResult(result, context));
    const canonical = '{"checks":[{"name":"unit","passed":false}],"publication":{"state":"not-published"},"ref":"ticket://123","schema":"example-result/v1","status":"failed"}';
    const sha256 = createHash("sha256").update(canonical).digest("hex");
    expect(output).toEqual({ schema: "result-delivery/v1", kind: "reference", runId: "run-1", operationId: "operation-1", sha256, ref: context.target!.ref, resultSchema: result.schema });
    expect(output).not.toHaveProperty("result");
    const envelope = JSON.parse(await readFile(context.target!.path, "utf8"));
    expect(envelope).toEqual({ schema: "result-delivery/v1", kind: "result", runId: "run-1", operationId: "operation-1", sha256, ref: context.target!.ref, resultSchema: result.schema, result });
    expect((await stat(context.target!.path)).mode & 0o777).toBe(0o600);
    expect(await readDeliveredResult(context)).toEqual({ result, reference: output });
    expect(await readdir(root)).toEqual(["result.json"]);
  });

  test("canonical key order makes identical duplicate publication idempotent", async () => {
    const initial = await deliverResult(result, context);
    const before = await readFile(context.target!.path, "utf8");
    const reordered = { ref: result.ref, publication: result.publication, checks: [{ passed: false, name: "unit" }], status: result.status, schema: result.schema };
    expect(await deliverResult(reordered, context)).toBe(initial);
    expect(await readFile(context.target!.path, "utf8")).toBe(before);
  });

  test("concurrent identical publishers converge without leftover temporary files", async () => {
    const outputs = await Promise.all(Array.from({ length: 6 }, () => deliverResult(result, context)));
    expect(new Set(outputs).size).toBe(1);
    expect((await readDeliveredResult(context)).result).toEqual(result);
    expect(await readdir(root)).toEqual(["result.json"]);
  });

  test("concurrent conflicting publishers produce one winner and a readable artifact", async () => {
    const outcomes = await Promise.allSettled([deliverResult(result, context), deliverResult({ ...result, status: "passed" }, context)]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    const winner = outcomes.find((outcome) => outcome.status === "fulfilled");
    if (winner?.status !== "fulfilled") throw new Error("Expected one publication winner.");
    expect((await readDeliveredResult(context)).reference).toEqual(JSON.parse(winner.value));
    expect(await readdir(root)).toEqual(["result.json"]);
  });

  test("rejects changed payload, run, operation, or reference without overwriting", async () => {
    await deliverResult(result, context);
    const original = await readFile(context.target!.path, "utf8");
    await expect(deliverResult({ ...result, status: "passed" }, context)).rejects.toThrow("conflict");
    await expect(deliverResult(result, { ...context, runId: "run-2" })).rejects.toThrow("conflict");
    await expect(deliverResult(result, { ...context, operationId: "operation-2" })).rejects.toThrow("conflict");
    await expect(deliverResult(result, { ...context, target: { ...context.target!, ref: "ticket://different" } })).rejects.toThrow("conflict");
    expect(await readFile(context.target!.path, "utf8")).toBe(original);
    expect(await readdir(root)).toEqual(["result.json"]);
  });

  test("validates expected domain schema before publishing anything", async () => {
    await expect(deliverResult({ schema: "wrong/v1" }, context)).rejects.toThrow("schema");
    await expect(deliverResult({ status: "passed" }, context)).rejects.toThrow("schema");
    expect(await readdir(root)).toEqual([]);
  });

  test.each([
    ["transport schema", { schema: "unknown/v1" }],
    ["transport kind", { kind: "reference" }],
    ["run identity", { runId: "other" }],
    ["operation identity", { operationId: "other" }],
    ["reference identity", { ref: "ticket://other" }],
    ["result schema identity", { resultSchema: "wrong/v1" }],
    ["hash", { sha256: "0".repeat(64) }],
    ["changed content", { result: { ...result, status: "passed" } }],
    ["domain schema", { result: { schema: "wrong/v1" } }],
    ["domain object", { result: [] }],
  ] satisfies Array<[string, Record<string, unknown>]>)("rejects corrupted %s on read and acknowledgement", async (_name, change) => {
    const reference = JSON.parse(await deliverResult(result, context));
    const envelope = JSON.parse(await readFile(context.target!.path, "utf8"));
    await writeFile(context.target!.path, JSON.stringify({ ...envelope, ...change }));
    await expect(readDeliveredResult(context)).rejects.toThrow();
    await expect(acknowledgeResult(context, reference.sha256)).rejects.toThrow();
    expect(await readdir(root)).toEqual(["result.json"]);
  });

  test("never accepts partial or non-object JSON as a successful read", async () => {
    for (const contents of ["{", "null", "[]"]) {
      await writeFile(context.target!.path, contents);
      await expect(readDeliveredResult(context)).rejects.toThrow();
      await expect(deliverResult(result, context)).rejects.toThrow();
      expect(await readFile(context.target!.path, "utf8")).toBe(contents);
    }
  });

  test("rejects missing or non-directory parents without creating artifacts", async () => {
    const missing = { ...context, target: { ...context.target!, path: join(root, "missing", "result.json") } };
    await expect(deliverResult(result, missing)).rejects.toThrow();
    await expect(readDeliveredResult(missing)).rejects.toThrow();
    expect(await readdir(root)).toEqual([]);
    await writeFile(join(root, "parent"), "not a directory");
    await expect(deliverResult(result, { ...context, target: { ...context.target!, path: join(root, "parent", "result.json") } })).rejects.toThrow();
    expect(await readFile(join(root, "parent"), "utf8")).toBe("not a directory");
  });

  test("failed publication against a directory leaves no partial files", async () => {
    await mkdir(context.target!.path);
    await expect(deliverResult(result, context)).rejects.toThrow();
    expect(await readdir(root)).toEqual(["result.json"]);
    expect(await readdir(context.target!.path)).toEqual([]);
  });
});

describe("matching immutable acknowledgement", () => {
  test("acknowledges only verified content, is idempotent, and retains the canonical artifact", async () => {
    const reference = JSON.parse(await deliverResult(result, context));
    const original = await readFile(context.target!.path, "utf8");
    await expect(acknowledgeResult(context, "not-a-hash")).rejects.toThrow("sha256");
    await expect(acknowledgeResult(context, "0".repeat(64))).rejects.toThrow("does not match");
    expect(await readdir(root)).toEqual(["result.json"]);
    await acknowledgeResult(context, reference.sha256);
    const acknowledgement = await readFile(`${context.target!.path}.ack.json`, "utf8");
    expect(JSON.parse(acknowledgement)).toEqual({ ...reference, kind: "acknowledgement" });
    await acknowledgeResult(context, reference.sha256);
    expect(await readFile(`${context.target!.path}.ack.json`, "utf8")).toBe(acknowledgement);
    expect(await readFile(context.target!.path, "utf8")).toBe(original);
    expect((await readDeliveredResult(context)).result).toEqual(result);
  });

  test("never replaces conflicting acknowledgement data", async () => {
    const reference = JSON.parse(await deliverResult(result, context));
    const path = `${context.target!.path}.ack.json`;
    await writeFile(path, '{"kind":"unexpected"}');
    await expect(acknowledgeResult(context, reference.sha256)).rejects.toThrow("conflict");
    expect(await readFile(path, "utf8")).toBe('{"kind":"unexpected"}');
  });
});

describe("symlink boundaries", () => {
  test("rejects a symlink artifact even when it points to identical valid content", async () => {
    const reference = JSON.parse(await deliverResult(result, context));
    const original = await readFile(context.target!.path, "utf8");
    const outside = join(root, "outside.json");
    await writeFile(outside, original);
    await rm(context.target!.path);
    await symlink(outside, context.target!.path);
    await expect(deliverResult(result, context)).rejects.toThrow();
    await expect(readDeliveredResult(context)).rejects.toThrow();
    await expect(acknowledgeResult(context, reference.sha256)).rejects.toThrow();
    expect(await readFile(outside, "utf8")).toBe(original);
  });

  test("rejects dangling artifact links and symlinked ancestor directories", async () => {
    const outside = join(root, "outside");
    await mkdir(outside);
    const alias = join(root, "alias");
    await symlink(outside, alias);
    const escaped = { ...context, target: { ...context.target!, path: join(alias, "result.json") } };
    await expect(deliverResult(result, escaped)).rejects.toThrow();
    await expect(readDeliveredResult(escaped)).rejects.toThrow();
    await expect(acknowledgeResult(escaped, "0".repeat(64))).rejects.toThrow();
    expect(await readdir(outside)).toEqual([]);
    await symlink(join(outside, "missing.json"), context.target!.path);
    await expect(deliverResult(result, context)).rejects.toThrow();
    expect(await readdir(outside)).toEqual([]);
  });

  test("rejects symlink acknowledgement without modifying its target", async () => {
    const reference = JSON.parse(await deliverResult(result, context));
    const outside = join(root, "outside-ack.json");
    await writeFile(outside, JSON.stringify({ ...reference, kind: "acknowledgement" }));
    const original = await readFile(outside, "utf8");
    await symlink(outside, `${context.target!.path}.ack.json`);
    await expect(acknowledgeResult(context, reference.sha256)).rejects.toThrow();
    expect(await readFile(outside, "utf8")).toBe(original);
  });
});

describe("context and JSON validation", () => {
  test("loads explicit absolute files and rejects malformed contexts", async () => {
    const path = join(root, "context.json");
    await writeFile(path, JSON.stringify(context));
    expect(await loadDeliveryContext(path)).toEqual(context);
    await expect(loadDeliveryContext("relative.json")).rejects.toThrow("absolute");
    for (const invalid of [null, [], {}, { ...context, schema: "unknown" }, { ...context, kind: "result" }, { ...context, audience: "unknown" }, { ...context, mode: "unknown" }, { ...context, runId: "" }, { ...context, operationId: undefined }, { ...context, target: undefined }, { ...context, target: { ...context.target!, path: "relative.json" } }, { ...context, target: { ...context.target!, path: `${root}/../escape.json` } }, { ...context, target: { ...context.target!, ref: "" } }, { ...context, target: { ...context.target!, schema: "" } }]) {
      expect(() => parseDeliveryContext(invalid)).toThrow();
    }
    await writeFile(path, "{");
    await expect(loadDeliveryContext(path)).rejects.toThrow("valid JSON");
  });

  test("rejects non-JSON payloads instead of silently changing them", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const sparse = new Array(1);
    let getterCalls = 0;
    const accessor = Object.defineProperty({}, "secret", { enumerable: true, get() { getterCalls++; return "unsafe"; } });
    for (const value of [undefined, () => 1, NaN, Infinity, 1n, new Date(0), circular, sparse, accessor]) {
      await expect(deliverResult({ ...result, value }, context)).rejects.toThrow();
    }
    await expect(deliverResult({ ...result, [Symbol("hidden")]: true }, context)).rejects.toThrow();
    expect(getterCalls).toBe(0);
    expect(await readdir(root)).toEqual([]);
  });
});

describe("human and machine presentation", () => {
  test("human output retains failures, checks, publication and canonical references without terminal controls", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const output = await deliverResult({ ...result, summary: "Operation failed\n\u001b[31mdo not rerun", errors: ["bad\routput\u202e"], nested: { failed: false, count: 0, absent: null }, notes: [] }, human);
    for (const expected of ["Operation failed\\u000a\\u001b[31mdo not rerun", "failed", "unit: failed", "not-published", "ticket://123", "bad\\u000doutput\\u202e"]) expect(output).toContain(expected);
    expect(output).not.toContain("\u001b");
    expect(output).not.toContain("\r");
    expect(output.trim().startsWith("{")).toBe(false);
    expect(await readdir(root)).toEqual([]);
    for (const omitted of ["nested", "absent", "notes", "count"]) expect(output).not.toContain(omitted);
  });

  test("ordinary ticket success is a short outcome, canonical record and validation summary", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const domain = {
      schema: "tracker-record-result/v1", operation: "check", ok: true, backend: "local-markdown",
      initiatives: [{ id: "initiative-1", title: "One initiative", ref: "initiative://1", children: [] }],
      tickets: [], changes: null, publication: null, rendered: "large graph output",
      ref: "initiative://1", recordSchema: "initiative/v1", legacy: false,
      validation: { status: "passed", details: ["Verbose implementation evidence not needed for ordinary success."] },
      graph: { nodes: ["initiative-1"], edges: [] }, normalTrackerDiscovery: { tickets: 100, initiatives: 12 },
    };
    const output = await deliverResult(domain, human);
    expect(output).toBe("check: succeeded\nRecords: initiative://1\nValidation: passed");
    expect(output.split("\n")).toHaveLength(3);
    for (const omitted of ["schema", "null", "graph", "discovery", "implementation evidence", "backend"]) expect(output).not.toContain(omitted);
    expect(JSON.parse(await deliverResult(domain, { ...human, audience: "machine", mode: "json" }))).toEqual(domain);
  });

  test("passed validation never hides required or unverified publication and blockers", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const output = await deliverResult({
      schema: "tracker-record-result/v1", operation: "migrate check", ok: true,
      workflow: "workflow://migration-1", validation: { status: "passed", details: ["Verbose success evidence"] },
      publication: { status: "committed", required: true, details: ["Remote publication is unverified."], stores: [{ root: "/records", status: "committed", required: "Configure an upstream and push." }] },
      furtherWorkBlocked: true, nextAction: "Publish all affected stores, then check publication.",
    }, human);
    for (const expected of ["migrate check: succeeded", "workflow://migration-1", "Validation: passed", "Publication: committed; required before further work", "Remote publication is unverified.", "Configure an upstream and push.", "Blocked: further work is blocked.", "Action: Publish all affected stores"]) expect(output).toContain(expected);
    expect(output).not.toContain("Publication: published");
    expect(output).not.toContain("Verbose success evidence");
  });

  test("failure details, limits and open questions survive concise presentation", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const output = await deliverResult({
      schema: "tracker-record-result/v1", operation: "migrate plan", ok: false,
      validation: { status: "conflict", details: ["Destination already exists.", { record: "ticket://1", reason: "Hash changed." }] },
      blockers: ["Coordinate active writers."], limits: ["External repositories were not searched."],
      openQuestions: ["Which store is authoritative?"], publication: { state: "not-published" },
      plan: { raw: { lots: ["of", "metadata"] }, writerSafety: "No automatic writer liveness check." },
    }, human);
    for (const expected of ["migrate plan: failed", "Validation: conflict", "Destination already exists.", "ticket://1", "Hash changed.", "Blocked: Coordinate active writers.", "External repositories were not searched.", "No automatic writer liveness check.", "Open questions: Which store is authoritative?", "Publication: not-published"]) expect(output).toContain(expected);
    expect(output).not.toContain("metadata");
  });

  test("unknown result fallback reports identity and explicit state without dumping payload", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    expect(await deliverResult({ schema: "unfamiliar-result/v1", status: "blocked", ref: "record://1", metadata: { secretNoise: "not part of summary" } }, human))
      .toBe("unfamiliar-result/v1: blocked\nRecords: record://1");
    expect(await deliverResult({ schema: "unfamiliar-result/v1", payload: [1, 2, 3] }, human))
      .toBe("unfamiliar-result/v1: result available; use --format json for full details");

  });

  test("JSON mode returns the entire unchanged domain object and does not access target directories", async () => {
    const json: DeliveryContext = { ...context, audience: "machine", mode: "json", target: { ...context.target!, path: join(root, "missing", "result.json") } };
    expect(JSON.parse(await deliverResult(result, json))).toEqual(result);
    expect(await readdir(root)).toEqual([]);
  });

  test("artifact read and acknowledgement require an artifact context", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    await expect(readDeliveredResult(human)).rejects.toThrow("artifact-reference");
    await expect(acknowledgeResult(human, "0".repeat(64))).rejects.toThrow("artifact-reference");
  });
});

describe("shared immutable file publication", () => {
  test("returns created or identical without changing authoritative YAML bytes", async () => {
    const path = join(root, "phase-result.yaml");
    const contents = "schema: phase-result/v1\nstatus: blocked\n";
    expect(await publishImmutableFile(path, contents)).toBe(true);
    const before = await stat(path);
    expect(await publishImmutableFile(path, contents)).toBe(false);
    expect((await stat(path)).ino).toBe(before.ino);
    await expect(publishImmutableFile(path, "schema: phase-result/v1\nstatus: done\n")).rejects.toThrow("conflict");
    expect(await readFile(path, "utf8")).toBe(contents);
    expect(await readdir(root)).toEqual(["phase-result.yaml"]);
  });

  test("compares raw bytes, not lossy Unicode decoding", async () => {
    const path = join(root, "bytes.txt");
    await writeFile(path, Buffer.from([0xff]));
    await expect(publishImmutableFile(path, "\ufffd")).rejects.toThrow("conflict");
    expect(await readFile(path)).toEqual(Buffer.from([0xff]));
  });

  test("rejects relative paths and symlink publication targets", async () => {
    await expect(publishImmutableFile("relative.yaml", "content")).rejects.toThrow("absolute");
    const original = join(root, "original.yaml");
    const alias = join(root, "alias.yaml");
    await writeFile(original, "content");
    await symlink(original, alias);
    await expect(publishImmutableFile(alias, "content")).rejects.toThrow();
    expect(await readFile(original, "utf8")).toBe("content");
    const parentAlias = join(root, "parent-alias");
    await symlink(root, parentAlias);
    await expect(publishImmutableFile(join(parentAlias, "new.yaml"), "content")).rejects.toThrow();
    expect((await readdir(root)).sort()).toEqual(["alias.yaml", "original.yaml", "parent-alias"]);
  });

  test("rejects malformed UTF-8 transport input instead of replacing bytes", async () => {
    const bytes = Buffer.concat([Buffer.from('{"schema":"'), Buffer.from([0xff]), Buffer.from('"}')]);
    await writeFile(context.target!.path, bytes);
    await expect(readDeliveredResult(context)).rejects.toThrow("UTF-8");
    expect(await readFile(context.target!.path)).toEqual(bytes);
  });
});

describe("consistent delivery audiences", () => {
  test("accepts only human/human, machine/json and agent/artifact-reference", () => {
    for (const audience of ["human", "agent", "machine"] as const) {
      for (const mode of ["human", "json", "artifact-reference"] as const) {
        const candidate = { ...context, audience, mode };
        if ((audience === "human" && mode === "human") || (audience === "machine" && mode === "json") || (audience === "agent" && mode === "artifact-reference")) {
          expect(parseDeliveryContext(candidate)).toEqual(candidate);
        } else {
          expect(() => parseDeliveryContext(candidate)).toThrow("audience must match mode");
        }
      }
    }
  });
});

describe("review verdict and domain validation presentation", () => {
  test("a completed review with a failure verdict exposes blocking findings and failed validation", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const receipt = {
      schema: "worktree-receipt/v1", event: "phase-result", phase: "review", status: "completed", verdict: "FAILURE",
      ticket_ref: "ticket://TASK-1", workflow: { ref: "workflow://review-1" },
      findings: [
        { id: "R-17", severity: "high", blocking: true, file: "src/delivery.ts", line: 42, message: "A failed review is hidden.", metadata: { verbose: "do not dump review metadata" } },
        { id: "R-18", severity: "low", blocking: false, file: "src/style.ts", line: 9, message: "Optional style suggestion." },
      ],
      validation: [
        { command: "receipt validation", result: "failed", details: "Required verdict was missing." },
        { command: "unit tests", result: "passed", output: "Verbose successful output" },
      ],
      open_questions: ["Who owns the blocking fix?"],
    };
    const output = await deliverResult(receipt, human);
    for (const expected of ["review: completed", "Verdict: FAILURE", "R-17 [high] src/delivery.ts:42", "A failed review is hidden.", "Validation checks: 1 passed; receipt validation: failed", "Required verdict was missing.", "ticket://TASK-1", "workflow://review-1", "Who owns the blocking fix?"]) expect(output).toContain(expected);
    for (const omitted of ["R-18", "Optional style suggestion", "Verbose successful output", "review metadata", "worktree-receipt/v1"]) expect(output).not.toContain(omitted);
    expect(JSON.parse(await deliverResult(receipt, { ...human, audience: "machine", mode: "json" }))).toEqual(receipt);
  });

  test("explicit blocking finding lists retain identifiers and nested locations without a verdict", async () => {
    const human: DeliveryContext = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    const output = await deliverResult({
      phase: "review", status: "blocked",
      blocking_findings: [{ finding_id: "R-3", severity: "medium", location: { file: "src/check.ts", line: 7 }, summary: "Validation cannot proceed." }],
      validation: { passed: false, errors: ["Domain schema rejected the receipt."], details: ["Missing required ticket reference."] },
    }, human);
    for (const expected of ["review: blocked", "R-3 [medium] src/check.ts:7", "Validation cannot proceed.", "Validation: failed", "Domain schema rejected the receipt.", "Missing required ticket reference."]) expect(output).toContain(expected);
  });
});
