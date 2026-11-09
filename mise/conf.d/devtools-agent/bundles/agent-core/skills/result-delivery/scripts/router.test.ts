// Exercise the executable CLI with isolated contexts, files, stdin and environment.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { DeliveryContext } from "./delivery.ts";

const router = fileURLToPath(new URL("./router.ts", import.meta.url));
let root: string;
let context: DeliveryContext;
let contextFile: string;
const result = { schema: "example-result/v1", summary: "Operation failed", status: "failed", checks: [{ name: "unit", passed: false }], publication: { state: "not-published" }, ref: "ticket://123" };

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "result-delivery-cli-"));
  const path = join(root, "result.json");
  context = { schema: "result-delivery/v1", kind: "context", audience: "agent", mode: "artifact-reference", runId: "cli-run", operationId: "cli-operation", target: { path, ref: pathToFileURL(path).href, schema: result.schema } };
  contextFile = join(root, "context.json");
  await writeFile(contextFile, JSON.stringify(context));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function cli(args: string[], options: { stdin?: string; context?: string; role?: string } = {}): Promise<{ code: number; stdout: string; stderr: string }> {
  const env = { ...process.env };
  delete env.RESULT_DELIVERY_CONTEXT;
  delete env.MUXER_SUBAGENT_ROLE;
  if (options.context !== undefined) env.RESULT_DELIVERY_CONTEXT = options.context;
  if (options.role !== undefined) env.MUXER_SUBAGENT_ROLE = options.role;
  const child = Bun.spawn([process.execPath, "--install=fallback", router, ...args], {
    cwd: root,
    env,
    stdin: new TextEncoder().encode(options.stdin ?? ""),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  return { code, stdout, stderr };
}

describe("public delivery CLI", () => {
  test("route defaults to human output without consulting terminal or muxer markers", async () => {
    const routed = await cli(["route"]);
    expect(routed.code).toBe(0);
    expect(routed.stderr).toBe("");
    expect(JSON.parse(routed.stdout)).toEqual({ schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" });
    expect(await readdir(root)).toEqual(["context.json"]);
  });

  test("explicit context overrides the environment and relative explicit paths fail", async () => {
    const humanFile = join(root, "human.json");
    const human = { schema: "result-delivery/v1", kind: "context", audience: "human", mode: "human" };
    await writeFile(humanFile, JSON.stringify(human));
    const routed = await cli(["route", "--context", humanFile], { context: contextFile });
    expect(routed.code).toBe(0);
    expect(JSON.parse(routed.stdout)).toEqual(human);
    const invalid = await cli(["route", "--context", "human.json"], { context: contextFile });
    expect(invalid.code).not.toBe(0);
    expect(invalid.stdout).toBe("");
    expect(invalid.stderr).toContain("absolute");
  });

  test("emit defaults to a readable summary and explicit JSON returns unchanged data", async () => {
    const human = await cli(["emit"], { stdin: JSON.stringify(result) });
    expect(human.code).toBe(0);
    expect(human.stderr).toBe("");
    expect(human.stdout).toContain("Operation failed");
    expect(human.stdout).toContain("unit: failed");
    expect(human.stdout).toContain("not-published");
    expect(human.stdout).toContain("ticket://123");
    expect(human.stdout.trim().startsWith("{")).toBe(false);
    const json = await cli(["emit", "--format", "json"], { stdin: JSON.stringify(result) });
    expect(json.code).toBe(0);
    expect(json.stderr).toBe("");
    expect(JSON.parse(json.stdout)).toEqual(result);
    expect(await readdir(root)).toEqual(["context.json"]);
  });

  test.each(["human", "json"])("format %s cannot erase assigned artifact delivery", async (format) => {
    const emitted = await cli(["emit", "--format", format], { context: contextFile, stdin: JSON.stringify(result) });
    expect(emitted.code).toBe(0);
    expect(emitted.stderr).toBe("");
    const reference = JSON.parse(emitted.stdout);
    expect(reference.kind).toBe("reference");
    expect(reference).not.toHaveProperty("result");
    expect(reference.ref).toBe(context.target!.ref);
    expect(JSON.parse(await readFile(context.target!.path, "utf8")).result).toEqual(result);
  });

  test("input file, verified read and hash acknowledgement complete the public handoff", async () => {
    const input = join(root, "input.json");
    await writeFile(input, JSON.stringify(result));
    const emitted = await cli(["emit", "--context", contextFile, "--input", input]);
    expect(emitted.code).toBe(0);
    const reference = JSON.parse(emitted.stdout);
    const read = await cli(["read"], { context: contextFile });
    expect(read.code).toBe(0);
    expect(read.stderr).toBe("");
    expect(JSON.parse(read.stdout)).toEqual(result);
    const ack = await cli(["ack", "--sha256", reference.sha256], { context: contextFile });
    expect(ack.code).toBe(0);
    expect(ack.stderr).toBe("");
    expect(JSON.parse(ack.stdout)).toEqual({ ...reference, kind: "acknowledgement" });
    expect(JSON.parse(await readFile(`${context.target!.path}.ack.json`, "utf8"))).toEqual({ ...reference, kind: "acknowledgement" });
    expect(JSON.parse(await readFile(context.target!.path, "utf8")).result).toEqual(result);
  });

  test("bad input and unsupported formats fail plainly without stdout or artifacts", async () => {
    for (const input of ["{", "null", "[]"]) {
      const invalid = await cli(["emit"], { context: contextFile, stdin: input });
      expect(invalid.code).not.toBe(0);
      expect(invalid.stdout).toBe("");
      expect(invalid.stderr).toContain("JSON");
      expect(invalid.stderr).not.toContain(" at ");
    }
    const invalidFormat = await cli(["emit", "--format", "xml"], { context: contextFile, stdin: JSON.stringify(result) });
    expect(invalidFormat.code).not.toBe(0);
    expect(invalidFormat.stdout).toBe("");
    expect(invalidFormat.stderr).toContain("--format must be human or json");
    expect(await readdir(root)).toEqual(["context.json"]);
  });

  test("missing artifacts, wrong identities and missing or mismatched ack hashes never succeed", async () => {
    const missing = await cli(["read"], { context: contextFile });
    expect(missing.code).not.toBe(0);
    expect(missing.stdout).toBe("");
    const emitted = await cli(["emit"], { context: contextFile, stdin: JSON.stringify(result) });
    expect(emitted.code).toBe(0);
    const missingHash = await cli(["ack"], { context: contextFile });
    expect(missingHash.code).not.toBe(0);
    expect(missingHash.stdout).toBe("");
    expect(missingHash.stderr).toContain("--sha256");
    const wrongHash = await cli(["ack", "--sha256", "0".repeat(64)], { context: contextFile });
    expect(wrongHash.code).not.toBe(0);
    expect(wrongHash.stdout).toBe("");
    expect(wrongHash.stderr).toContain("does not match");
    await writeFile(contextFile, JSON.stringify({ ...context, operationId: "other-operation" }));
    const wrongIdentity = await cli(["read"], { context: contextFile });
    expect(wrongIdentity.code).not.toBe(0);
    expect(wrongIdentity.stdout).toBe("");
    expect(wrongIdentity.stderr).toContain("identity");
    expect((await readdir(root)).sort()).toEqual(["context.json", "result.json"]);
  });

  test("failed writes do not emit a success reference or leave partial artifacts", async () => {
    await writeFile(contextFile, JSON.stringify({ ...context, target: { ...context.target!, path: join(root, "missing", "result.json") } }));
    const failed = await cli(["emit"], { context: contextFile, stdin: JSON.stringify(result) });
    expect(failed.code).not.toBe(0);
    expect(failed.stdout).toBe("");
    expect(failed.stderr.length).toBeGreaterThan(0);
    expect(await readdir(root)).toEqual(["context.json"]);
  });
});

describe("child context and concise CLI presentation", () => {
  test("an explicitly marked child cannot silently use human delivery without a context", async () => {
    const missing = await cli(["route"], { role: "child" });
    expect(missing.code).not.toBe(0);
    expect(missing.stdout).toBe("");
    expect(missing.stderr).toContain("Child result delivery requires");
    const emitted = await cli(["emit", "--format", "json"], { role: "child", stdin: JSON.stringify(result) });
    expect(emitted.code).not.toBe(0);
    expect(emitted.stdout).toBe("");
    expect(await readdir(root)).toEqual(["context.json"]);
  });

  test("explicit context takes precedence even when reading another child result", async () => {
    const emitted = await cli(["emit"], { context: contextFile, role: "child", stdin: JSON.stringify(result) });
    expect(emitted.code).toBe(0);
    const read = await cli(["read", "--context", contextFile], { context: join(root, "other-child-context.json"), role: "child" });
    expect(read.code).toBe(0);
    expect(read.stderr).toBe("");
    expect(JSON.parse(read.stdout)).toEqual(result);
  });

  test("ordinary successful checks print only a few useful lines", async () => {
    const domain = {
      schema: "tracker-record-result/v1", operation: "check", ok: true, ref: "initiative://one",
      initiatives: [{ id: "one", ref: "initiative://one", children: [] }], tickets: [],
      validation: { status: "passed", details: ["Detailed graph implementation evidence"] },
      publication: null, graph: { nodes: [1, 2, 3], edges: [] }, rendered: "large graph", transportId: "hidden",
    };
    const human = await cli(["emit", "--format", "human"], { stdin: JSON.stringify(domain) });
    expect(human.code).toBe(0);
    expect(human.stderr).toBe("");
    expect(human.stdout).toBe("check: succeeded\nRecords: initiative://one\nValidation: passed\n");
    const json = await cli(["emit", "--format", "json"], { stdin: JSON.stringify(domain) });
    expect(json.code).toBe(0);
    expect(JSON.parse(json.stdout)).toEqual(domain);
  });
});

test("human CLI output distinguishes a completed process from a failed review verdict", async () => {
  const receipt = {
    schema: "worktree-receipt/v1", phase: "review", status: "completed", verdict: "FAILURE",
    findings: [{ id: "REVIEW-1", severity: "blocking", file: "src/main.ts", line: 23, message: "Validation failed." }],
    validation: [{ command: "domain validation", result: "failed", error: "Required field is missing." }],
  };
  const human = await cli(["emit", "--format", "human"], { stdin: JSON.stringify(receipt) });
  expect(human.code).toBe(0);
  expect(human.stderr).toBe("");
  for (const expected of ["review: completed", "Verdict: FAILURE", "REVIEW-1 [blocking] src/main.ts:23", "domain validation: failed", "Required field is missing."]) expect(human.stdout).toContain(expected);
  expect(human.stdout).not.toContain("worktree-receipt/v1");
});
