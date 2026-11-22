// Consumer-visible boundaries: immutable completion, legacy reads and rejected inputs.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createRun, readRun, removeRun, runSignalPath, updateRunTarget, writeRunSignal } from "./signals.ts";
import { observeResources } from "./resources.ts";
import { readRunEvidence } from "./evidence.ts";
import { waitForAgent } from "./wait.ts";

let root: string;
const savedState = process.env.XDG_STATE_HOME;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "muxer-contracts-"));
  process.env.XDG_STATE_HOME = root;
});
afterEach(async () => {
  if (savedState === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = savedState;
  await rm(root, { recursive: true, force: true });
});
async function bytes(runId: string): Promise<Record<string, string>> {
  const directory = dirname(runSignalPath(runId));
  return Object.fromEntries(await Promise.all((await readdir(directory)).sort().map(async name => [name, await readFile(join(directory, name), "utf8")])));
}

test("terminal evidence survives repeated waits and prompt cleanup", async () => {
  const run = await createRun("tmux", "omp");
  await writeRunSignal(run.runId, "running", "process");
  const completed = await writeRunSignal(run.runId, "completed", "process", { exitCode: 0 });
  const directory = dirname(runSignalPath(run.runId));
  const terminalBytes = await readFile(join(directory, `signal-${completed.sequence}.json`), "utf8");
  await expect(writeRunSignal(run.runId, "failed", "agent")).rejects.toThrow("immutable");
  await removeRun(run.runId);
  expect(await waitForAgent({ runId: run.runId, afterSequence: 0 })).toEqual(completed);
  expect(await readFile(join(directory, `signal-${completed.sequence}.json`), "utf8")).toBe(terminalBytes);
  expect((await readRun(run.runId)).signal).toEqual(completed);
});

test("explicit historical reads and waits preserve every legacy byte; mutations stop", async () => {
  const run = await createRun("tmux", "omp");
  const directory = dirname(runSignalPath(run.runId));
  const { schemaVersion: _, ...manifest } = run;
  await writeFile(join(directory, "run.json"), JSON.stringify(manifest, null, 3));
  await writeFile(runSignalPath(run.runId), JSON.stringify({ version: 1, runId: run.runId, sequence: 4, state: "completed", source: "process", timestamp: new Date().toISOString(), exitCode: 0 }));
  await rm(join(directory, "signal-0.json"));
  await writeFile(join(directory, "resources.json"), JSON.stringify({ version: 1, runId: run.runId, observedAt: new Date().toISOString(), shutdown: "unconfirmed", processes: [] }));
  const before = await bytes(run.runId);
  await expect(readRun(run.runId)).rejects.toThrow("historical reader");
  expect((await readRunEvidence(run.runId, true)).manifest).toEqual(manifest);
  expect(await waitForAgent({ runId: run.runId, afterSequence: 0, historical: true })).toMatchObject({ version: 1, state: "completed" });
  await expect(updateRunTarget(run.runId, "other")).rejects.toThrow("historical reader");
  await expect(writeRunSignal(run.runId, "failed", "agent")).rejects.toThrow("historical reader");
  await expect(observeResources(run.runId)).rejects.toThrow("historical reader");
  await expect(removeRun(run.runId)).rejects.toThrow("historical reader");
  expect(await bytes(run.runId)).toEqual(before);
});

for (const [file, record] of [
  ["run.json", { schemaVersion: "muxer-run/v99" }],
  ["signal.json", { schemaVersion: "muxer-completion/v99" }],
  ["resources.json", { schemaVersion: "muxer-resources/v99" }],
] as const) {
  test(`unknown ${file} is rejected without rewriting evidence`, async () => {
    const run = await createRun("tmux", "omp");
    await writeFile(join(dirname(runSignalPath(run.runId)), file), JSON.stringify(record));
    const before = await bytes(run.runId);
    await expect(readRunEvidence(run.runId, true)).rejects.toThrow("Unsupported");
    await expect(observeResources(run.runId)).rejects.toThrow("Unsupported");
    expect(await bytes(run.runId)).toEqual(before);
  });
}

test("unsafe symlink and malformed resource identities cannot change evidence", async () => {
  const run = await createRun("tmux", "omp");
  const path = join(dirname(runSignalPath(run.runId)), "resources.json");
  const outside = join(root, "authoritative-result.json");
  const content = '{"schemaVersion":"unknown-result/v1","status":"failed"}\n';
  await writeFile(outside, content);
  await symlink(outside, path);
  await expect(observeResources(run.runId)).rejects.toThrow("Unsafe symlink");
  expect(await readFile(outside, "utf8")).toBe(content);
  await rm(path);
  await writeFile(path, JSON.stringify({ schemaVersion: "muxer-resources/v2", runId: run.runId, observedAt: new Date().toISOString(), shutdown: "confirmed", processes: [] }));
  const before = await bytes(run.runId);
  await expect(observeResources(run.runId)).rejects.toThrow("stopped process identities");
  expect(await bytes(run.runId)).toEqual(before);
});

test("a process record cannot claim a different filename identity", async () => {
  const run = await createRun("tmux", "omp");
  const bootId = "00000000-0000-4000-8000-000000000000";
  await writeFile(join(dirname(runSignalPath(run.runId)), `owned-${bootId}-1-123.json`), JSON.stringify({
    schemaVersion: "muxer-owned-process/v2", runId: run.runId, bootId,
    pid: 2, startTicks: "123", command: "unrelated", state: "running",
  }));
  const before = await bytes(run.runId);
  await expect(observeResources(run.runId)).rejects.toThrow("identity does not match filename");
  await expect(readRunEvidence(run.runId)).rejects.toThrow("identity does not match filename");
  expect(await bytes(run.runId)).toEqual(before);
});
