// Uses real disposable child processes; never signals a process discovered from cwd.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { observeResources, type ProcessAccess } from "./resources.ts";
import { createRun, readRun, runSignalPath, writeRunSignal } from "./signals.ts";
import { waitForAgent } from "./wait.ts";

let directory: string;
const savedState = process.env.XDG_STATE_HOME;
const children: Bun.Subprocess[] = [];
const servicePids: number[] = [];
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "muxer-resources-"));
  process.env.XDG_STATE_HOME = directory;
});
afterEach(async () => {
  for (const child of children.splice(0)) { child.kill(); await child.exited; }
  for (const pid of servicePids.splice(0)) {
    try { process.kill(pid, "SIGTERM"); }
    catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error; }
  }
  if (savedState === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = savedState;
  await rm(directory, { recursive: true, force: true });
});

test("completion retains owned services until shutdown without claiming unrelated cwd processes", async () => {
  const run = await createRun("tmux", "omp", { cwd: directory, operationId: "phase-review", parentRunId: "parent" });
  const owned = Bun.spawn(["sleep", "30"], { cwd: directory, env: { ...process.env, MUXER_SUBAGENT_RUN_ID: run.runId } });
  const unrelated = Bun.spawn(["sleep", "30"], { cwd: directory, env: { ...process.env, MUXER_SUBAGENT_RUN_ID: "another-run" } });
  children.push(owned, unrelated);
  const running = await observeResources(run.runId);
  expect(running.shutdown).toBe("pending");
  expect(running.processes).toContainEqual(expect.objectContaining({ pid: owned.pid, state: "running", startTicks: expect.stringMatching(/^\d+$/), bootId: expect.any(String) }));
  expect(running.processes.some(item => item.pid === unrelated.pid)).toBe(false);

  await writeRunSignal(run.runId, "completed", "agent");
  expect(await waitForAgent({ runId: run.runId, afterSequence: 0 })).toMatchObject({ state: "completed" });
  expect((await observeResources(run.runId)).shutdown).toBe("pending");
  owned.kill();
  await owned.exited;
  const stopped = await observeResources(run.runId);
  expect(stopped.shutdown).toBe("confirmed");
  expect(stopped.processes.find(item => item.pid === owned.pid)?.state).toBe("stopped");
  expect((await readRun(run.runId)).manifest).toMatchObject({ cwd: directory, operationId: "phase-review", parentRunId: "parent" });
  expect(() => process.kill(unrelated.pid, 0)).not.toThrow();
});

test("an empty registry does not prove shutdown", async () => {
  const run = await createRun("tmux", "omp");
  expect(await observeResources(run.runId)).toMatchObject({ shutdown: "unconfirmed", processes: [] });
});

test("PID reuse cannot claim or signal the current unrelated process", async () => {
  const run = await createRun("tmux", "omp");
  const unrelated = Bun.spawn(["sleep", "30"], { env: { ...process.env, MUXER_SUBAGENT_RUN_ID: "another-run" } });
  children.push(unrelated);
  const stat = await readFile(`/proc/${unrelated.pid}/stat`, "utf8");
  const ticks = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/)[19]!;
  const bootId = (await readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim();
  await writeFile(join(dirname(runSignalPath(run.runId)), "resources.json"), JSON.stringify({
    version: 1, runId: run.runId, observedAt: new Date().toISOString(), shutdown: "pending",
    processes: [{ pid: unrelated.pid, bootId, startTicks: String(BigInt(ticks) + 1n), command: "old-owner", state: "running" }],
  }));
  const result = await observeResources(run.runId);
  expect(result).toMatchObject({ shutdown: "confirmed", processes: [{ pid: unrelated.pid, command: "old-owner", state: "stopped" }] });
  expect(() => process.kill(unrelated.pid, 0)).not.toThrow();
});

test("immutable ownership survives a stale observation overwriting the summary", async () => {
  const run = await createRun("tmux", "omp");
  const owned = Bun.spawn(["sleep", "30"], { env: { ...process.env, MUXER_SUBAGENT_RUN_ID: run.runId } });
  children.push(owned);
  await observeResources(run.runId);
  await writeFile(join(dirname(runSignalPath(run.runId)), "resources.json"), JSON.stringify({ version: 1, runId: run.runId, processes: [] }));
  owned.kill();
  await owned.exited;
  expect(await observeResources(run.runId)).toMatchObject({ shutdown: "confirmed", processes: [expect.objectContaining({ pid: owned.pid, state: "stopped" })] });
});

test("a worker descendant remains owned after its launcher exits", async () => {
  const run = await createRun("tmux", "omp");
  const launcher = Bun.spawn(["/bin/sh", "-c", 'sleep 30 & echo "$!"; wait'], {
    env: { ...process.env, MUXER_SUBAGENT_RUN_ID: run.runId }, stdout: "pipe",
  });
  children.push(launcher);
  const reader = launcher.stdout.getReader();
  const first = await reader.read();
  reader.releaseLock();
  const servicePid = Number(new TextDecoder().decode(first.value).trim());
  if (!Number.isSafeInteger(servicePid) || servicePid <= 0) throw new Error("Launcher did not report its service PID");
  servicePids.push(servicePid);
  await observeResources(run.runId);
  launcher.kill("SIGKILL");
  await launcher.exited;
  const remaining = await observeResources(run.runId);
  expect(remaining.shutdown).toBe("pending");
  expect(remaining.processes).toContainEqual(expect.objectContaining({ pid: launcher.pid, state: "stopped" }));
  expect(remaining.processes).toContainEqual(expect.objectContaining({ pid: servicePid, state: "running" }));
});

for (const uncertainty of ["unrelated", "registered", "tagged"] as const) {
  test(`permission failures stay scoped to ${uncertainty} processes`, async () => {
    const run = await createRun("tmux", "omp");
    let stopped = false;
    const denied = () => Object.assign(new Error("Permission denied"), { code: "EACCES" });
    const access: ProcessAccess = {
      async readdir() { return ["11", "22"]; },
      async readlink() { return directory; },
      async readFile(path) {
        if (path === "/proc/sys/kernel/random/boot_id") return "00000000-0000-4000-8000-000000000000";
        if (path === "/proc/11/stat") {
          if (stopped && uncertainty === "registered") throw denied();
          return `11 (owned) ${stopped ? "Z" : "S"} 1 ${"0 ".repeat(17)}123`;
        }
        if (path === "/proc/11/environ") {
          if (stopped) throw denied();
          return `MUXER_SUBAGENT_RUN_ID=${run.runId}\0`;
        }
        if (path === "/proc/22/stat") throw denied();
        if (path === "/proc/22/environ") return uncertainty === "tagged" ? `MUXER_SUBAGENT_RUN_ID=${run.runId}\0` : "";
        throw new Error("Unexpected process fixture path");
      },
    };
    expect((await observeResources(run.runId, undefined, access)).shutdown).toBe("pending");
    stopped = true;
    const result = await observeResources(run.runId, undefined, access);
    expect(result.shutdown).toBe(uncertainty === "unrelated" ? "confirmed" : "unconfirmed");
    expect(result.processes[0]?.state).toBe(uncertainty === "registered" ? "unconfirmed" : "stopped");
  });
}
