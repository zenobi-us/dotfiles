// Covers byte boundaries and artifact identity without depending on producer wording.
import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateReceiptArtifacts, validateReceiptSize } from "./receipt-size";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const receipt = { schemaVersion: "worktree-receipt/v4", inputs: [], outputs: [] };

test("narrative uses UTF-8 byte boundaries rather than character counts", () => {
  validateReceiptSize({ ...receipt, summary: "😀".repeat(512) });
  expect(() => validateReceiptSize({ ...receipt, summary: "😀".repeat(513) })).toThrow("2052 bytes");
  validateReceiptSize({ ...receipt, notes: Array.from({ length: 4 }, () => "x".repeat(2048)) });
  expect(() => validateReceiptSize({ ...receipt, notes: [...Array.from({ length: 4 }, () => "x".repeat(2048)), "x"] })).toThrow("8193 bytes");
});

test("limits cover complete metadata serialization and JSON expansion", () => {
  const yamlOverflow = { ...receipt, changed_files: Array.from({ length: 100 }, (_, i) => `${i}/` + "x".repeat(1000)) };
  expect(() => validateReceiptSize(yamlOverflow)).toThrow("limit is 65536");
  const jsonOverflow = { ...receipt, changed_files: Array.from({ length: 9000 }, () => "") };
  expect(Buffer.byteLength(Bun.YAML.stringify(jsonOverflow))).toBeLessThan(65536);
  expect(() => validateReceiptSize(jsonOverflow)).toThrow("Receipt transport");
  expect(() => validateReceiptSize({ ...receipt, inherited: { schema: "worktree-receipt/v1" } })).toThrow("embeds evidence");
  expect(() => validateReceiptSize({ ...receipt, inputs: [{ kind: "receipt", ref: "old", summary: "copied record" }] })).toThrow("metadata only");
});

test("artifact validation binds independently resolved evidence bytes and rejects escaping paths", async () => {
  const directory = await mkdtemp(join(tmpdir(), "receipt-artifacts-"));
  temporary.push(directory);
  const workflow = { path: join(directory, "workflow"), ref: "workflows/T-1", store: "repository" };
  const evidence = { path: join(directory, "separate-evidence"), ref: "shared://workflows/T-1/artifacts/evidence/run-1", store: "shared" };
  await mkdir(join(workflow.path, "artifacts"), { recursive: true });
  await mkdir(evidence.path);
  const bytes = Buffer.from([0, 255, 10, 128]);
  await writeFile(join(evidence.path, "capture.bin"), bytes);
  const artifact = { kind: "artifact", ref: evidence.ref + "/capture.bin", store: "shared", bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), media_type: "application/octet-stream" };
  await validateReceiptArtifacts({ ...receipt, outputs: [artifact] }, workflow, evidence);
  await expect(validateReceiptArtifacts({ ...receipt, outputs: [artifact] }, workflow)).rejects.toThrow("resolved workflow");
  await expect(validateReceiptArtifacts({ ...receipt, outputs: [{ ...artifact, bytes: 3 }] }, workflow, evidence)).rejects.toThrow("SHA-256");
  await symlink(join(evidence.path, "capture.bin"), join(workflow.path, "artifacts/escape.bin"));
  await expect(validateReceiptArtifacts({ ...receipt, outputs: [{ ...artifact, store: "repository", ref: "artifacts/escape.bin" }] }, workflow, evidence)).rejects.toThrow("symlink escapes");
  await expect(validateReceiptArtifacts({ ...receipt, outputs: [{ ...artifact, ref: evidence.ref + "/../capture.bin" }] }, workflow, evidence)).rejects.toThrow("escapes");
});

test("evidence run directories stay metadata while evidence files require artifact identity", async () => {
  const evidence = { store: "repository", ref: "workflows/T-1/artifacts/evidence/run-1" };
  const runOnly = { ...receipt, evidence, inputs: [{ kind: "evidence", ref: evidence.ref }] };
  validateReceiptSize(runOnly);
  await validateReceiptArtifacts(runOnly, {});
  expect(() => validateReceiptSize({ ...runOnly, inputs: [{ kind: "evidence", ref: evidence.ref + "/check.log" }] })).toThrow("sha256");
  expect(() => validateReceiptSize({ ...runOnly, inputs: [{ kind: "evidence", ref: "https://example.invalid/log" }] })).toThrow("sha256");
});

test("integration helper output must be externalized rather than copied into a receipt", () => {
  expect(() => validateReceiptSize({ ...receipt, validation_results: [{ argv: ["bun", "test"], output: "raw command output" }] })).toThrow("embeds evidence");
});
