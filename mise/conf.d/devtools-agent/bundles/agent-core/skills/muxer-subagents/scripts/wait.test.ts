import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { waitForAgent } from "./wait.ts";
import { createRun, readRun, updateRunTarget } from "./signals.ts";

let directory: string;
let runId: string;
const saved = { PATH: process.env.PATH, XDG_STATE_HOME: process.env.XDG_STATE_HOME };
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "herdr-app-wait-"));
  process.env.PATH = `${directory}:${saved.PATH}`;
  process.env.XDG_STATE_HOME = directory;
  const run = await createRun("herdr-app", "omp");
  runId = run.runId;
  await updateRunTarget(runId, "t7");
});
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(directory, { recursive: true, force: true });
});

function reply(value: unknown): void {
  const path = join(directory, "hc");
  writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' '${JSON.stringify(value)}'\n`);
  chmodSync(path, 0o700);
}

for (const [status, state] of [["done", "completed"], ["blocked", "blocked"], ["error", "failed"]] as const) {
  test(`maps native ${status} without relying on pane text`, async () => {
    reply({ reason: "status", status, ended: true });
    expect(await waitForAgent({ runId, afterSequence: 0 })).toMatchObject({ state, source: "agent" });
  });
}
for (const [exitCode, state] of [[0, "completed"], [42, "failed"]] as const) {
  test(`preserves program exit ${exitCode}`, async () => {
    reply({ reason: "exit", exit_code: exitCode });
    expect(await waitForAgent({ runId, afterSequence: 0 })).toMatchObject({ state, source: "process", exitCode });
  });
}

test("does not call startup idle or unconfirmed terminal loss successful", async () => {
  reply({ reason: "status", status: "idle" });
  await expect(waitForAgent({ runId, afterSequence: 0 })).rejects.toThrow("did not confirm completion");
  reply({ reason: "exit", exit_code: null, signal: null });
  await expect(waitForAgent({ runId, afterSequence: 0 })).rejects.toThrow("completion is unconfirmed");
  expect((await readRun(runId)).signal.state).toBe("starting");
});

for (const reason of ["timeout", "message"]) {
  test(`${reason} does not publish completion`, async () => {
    reply({ reason, status: "working", ended: false });
    expect(await waitForAgent({ runId, afterSequence: 0 })).toBeNull();
    expect((await readRun(runId)).signal.state).toBe("starting");
  });
}
