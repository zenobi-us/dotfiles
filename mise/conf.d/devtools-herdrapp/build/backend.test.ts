// These tests use private real directories and real child processes, not transport mocks.
import { afterAll, afterEach, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Request } from "./protocol";

const isolated = await mkdtemp(path.join(os.tmpdir(), "herdr-backend-home-"));
const originalEnvironment = { HOME: process.env.HOME, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, XDG_STATE_HOME: process.env.XDG_STATE_HOME };
for (const [key, name] of [["HOME", "home"], ["XDG_CONFIG_HOME", "config"], ["XDG_STATE_HOME", "state"]]) {
  process.env[key!] = path.join(isolated, name!);
  await mkdir(process.env[key!]!, { recursive: true, mode: 0o700 });
}
// Canonical configuration captures HOME at import time.
const { QueryJobs } = await import("./jobs");
const { executor, QueryError, withDeadline } = await import("./native");
const { encodeEnvelope, MAX_ENVELOPE_BYTES, parseRequest } = await import("./protocol");
afterAll(async () => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  await rm(isolated, { recursive: true, force: true });
});

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });

async function fixture(): Promise<{ directory: string; jobs: InstanceType<typeof QueryJobs>; request: Request }> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "herdr-backend-test-"));
  temporary.push(directory);
  return { directory, jobs: new QueryJobs(path.join(directory, "jobs")), request: { protocol: 1, operation: "tracker", cwd: directory, fields: {} } };
}

test("jobs have isolated UUID state and removal does not affect another job", async () => {
  const { jobs, request } = await fixture();
  const first = await jobs.create(request), second = await jobs.create(request);
  expect(first.job).not.toBe(second.job);
  expect(await jobs.status(first.job)).toEqual({ state: "pending", progress: [] });
  await jobs.remove(first.job);
  expect(await jobs.status(second.job)).toEqual({ state: "pending", progress: [] });
  expect(await jobs.remove(first.job)).toEqual({ removed: true });
  await expect(jobs.status(first.job)).rejects.toMatchObject({ code: "JOB_NOT_FOUND" });
});

test("job cleanup rejects traversal, symlinks and UUID directories without ownership", async () => {
  const { directory, jobs, request } = await fixture();
  await jobs.create(request);
  const outside = path.join(directory, "outside");
  await mkdir(outside);
  const marker = path.join(outside, "marker");
  await writeFile(marker, "keep");
  const linked = randomUUID();
  await symlink(outside, path.join(directory, "jobs", linked));
  await expect(jobs.remove(linked)).rejects.toMatchObject({ code: "UNSAFE_PATH" });
  await expect(jobs.remove("../outside")).rejects.toMatchObject({ code: "INVALID_JOB" });
  const unrelated = randomUUID();
  await mkdir(path.join(directory, "jobs", unrelated), { mode: 0o700 });
  await expect(jobs.remove(unrelated)).rejects.toThrow();
  expect(await readFile(marker, "utf8")).toBe("keep");
});

test("worker errors remain readable as status and retain actual context progress", async () => {
  const { jobs, request } = await fixture();
  const { job } = await jobs.create(request);
  expect(await jobs.run(job)).toEqual({ state: "error" });
  const status = await jobs.status(job);
  expect(status.state).toBe("error");
  expect(status.error?.code).toBe("QUERY_FAILED");
  expect(status.progress[0]).toEqual({ seq: 1, phase: "context", completed: 0, total: null });
  expect((await jobs.status(job, 1)).progress).toEqual([]);
  await expect(jobs.run(job)).rejects.toMatchObject({ code: "JOB_ALREADY_STARTED" });
});

test("status validates wait and sequence bounds", async () => {
  const { jobs, request } = await fixture();
  const { job } = await jobs.create(request);
  await expect(jobs.status(job, -1)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
  await expect(jobs.status(job, 0, 1001)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
});

test("native execution uses the selected directory and disables runtime installation", async () => {
  const { directory } = await fixture();
  const result = await withDeadline(() => executor(directory)(process.execPath, ["-e", 'process.stdout.write(JSON.stringify([process.cwd(),process.env.MISE_AUTO_INSTALL,process.env.MISE_EXEC_AUTO_INSTALL]))']));
  expect(result.code).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual([directory, "0", "0"]);
});

test("native deadline cancels its owned process", async () => {
  const { directory } = await fixture();
  // This checks cancellation of a real subprocess; a fake clock cannot stop it.
  await expect(withDeadline(() => executor(directory)(process.execPath, ["-e", "await Bun.sleep(60000)"]), 25)).rejects.toMatchObject({ code: "DEADLINE_EXCEEDED" });
});

test("native command output and protocol envelopes fail instead of truncating", async () => {
  const { directory } = await fixture();
  await expect(withDeadline(() => executor(directory)(process.execPath, ["-e", "process.stdout.write(Buffer.alloc(17*1024*1024,97))"]))).rejects.toMatchObject({ code: "OUTPUT_TOO_LARGE" });
  expect(() => encodeEnvelope({ protocol: 1, ok: true, value: "x".repeat(MAX_ENVELOPE_BYTES) })).toThrow(QueryError);
});

test("request validation rejects incompatible protocols and unsupported actions", () => {
  expect(() => parseRequest(JSON.stringify({ protocol: 2, operation: "context", cwd: "/", fields: {} }))).toThrow("protocol 1");
  expect(() => parseRequest(JSON.stringify({ protocol: 1, operation: "prepare", cwd: "/", fields: { id: "T-1", kind: "ticket", harness: "omp", action: "__proto__" } }))).toThrow("supported action");
});
