// Core carries whole domain requests. Query workers own their files and publish bounded progress snapshots.
import { exec, hc } from "herdr";

const runners = new Map();
const PROTOCOL = 1;
const LIMIT = 6 * 1024 * 1024;
const JOB = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const READS = new Set(["context", "directory", "file", "tracker", "detail", "validate"]);

export async function runQuery(operation, where, fields = {}, onProgress, control = {}) {
  if (!READS.has(operation) && !["setup", "prepare", "discard-session"].includes(operation)) throw new Error("Unknown Shared Context operation.");
  checkTarget(where);
  const request = JSON.stringify({ protocol: PROTOCOL, operation, cwd: where.cwd, fields });
  // Requests travel in argv, not stdin. Keep them below the platform's single-argument limit.
  if (request.length > 24000) throw new Error("The Shared Context request is too large. Shorten the action prompt.");
  const target = { cwd: where.cwd, machine: where.machine ?? null };
  const runner = await resolveRunner(target);
  checkCancelled(control);
  if (operation === "tracker" || operation === "validate") return queryJob(target, runner, request, onProgress, control);
  const value = await invoke(target, runner, ["request", request], ["setup", "prepare"].includes(operation) ? 600000 : 60000);
  // A completed mutation must reach its caller so it can clean up a prepared session.
  if (READS.has(operation)) checkCancelled(control);
  return value;
}

export function forgetTarget(where) {
  runners.delete(targetKey(where));
}

export function targetKey(where) {
  return JSON.stringify([where.machine ?? null, where.cwd]);
}

export function cancelled() {
  const error = new Error("The query target or selection changed.");
  error.code = "CANCELLED";
  return error;
}

async function resolveRunner(where) {
  const key = targetKey(where);
  if (runners.has(key)) return runners.get(key);
  if (runners.size >= 32) runners.delete(runners.keys().next().value);
  const pending = (async () => {
    const script = 'helper=$(command -v herdr-context 2>/dev/null) || helper="$HOME/.local/bin/herdr-context"; [ -f "$helper" ] || { printf "%s\\n" "Shared Context helper is missing. Deploy herdr-context on the selected machine." >&2; exit 127; }; if runtime=$(command -v bun); then :; elif manager=$(command -v mise) && runtime=$(MISE_AUTO_INSTALL=0 MISE_EXEC_AUTO_INSTALL=0 "$manager" which bun); then :; else printf "%s\\n" "Bun is unavailable on the selected machine. Install it and trust the project mise configuration." >&2; exit 127; fi; printf "%s\\000%s" "$runtime" "$helper"';
    const result = await exec("sh", ["-c", script, "shared-context-query"], { on: where.machine, cwd: where.cwd, timeout: 10000 });
    if (result.code !== 0) throw new Error(result.stderr || "Cannot locate the Shared Context helper on the selected machine.");
    const [runtime, helper] = result.stdout.split("\0");
    if (!runtime?.startsWith("/") || !helper?.startsWith("/")) throw new Error("The selected machine returned an invalid query launcher.");
    return [runtime, helper];
  })();
  runners.set(key, pending);
  pending.catch(() => { if (runners.get(key) === pending) runners.delete(key); });
  return pending;
}

async function invoke(where, runner, args, timeout = 15000) {
  const [command, ...prefix] = runner;
  let result;
  try { result = await exec(command, [...prefix, ...args], { on: where.machine, cwd: args[0].startsWith("job-") ? undefined : where.cwd, timeout }); }
  catch (error) { forgetTarget(where); throw error; }
  if (result.code === 127) forgetTarget(where);
  if (result.stdout.length > LIMIT) throw new Error("The query response exceeds the transfer limit. Narrow the selected collection.");
  let envelope;
  try { envelope = JSON.parse(result.stdout); }
  catch { throw new Error(result.stderr || "The Shared Context helper returned invalid JSON. Rebuild and deploy the helper on the selected machine."); }
  if (!envelope || envelope.protocol !== PROTOCOL || typeof envelope.ok !== "boolean" || envelope.ok && !Object.hasOwn(envelope, "value")) throw new Error("The Shared Context helper protocol does not match this mod. Rebuild and deploy both together.");
  if (!envelope.ok) throw queryError(envelope.error);
  if (result.code !== 0) throw new Error(result.stderr || `The Shared Context helper exited with code ${result.code}.`);
  return envelope.value;
}

async function queryJob(where, runner, request, onProgress, control) {
  let job, address, terminalCleanup, jobCleanup;
  const removeTerminal = () => {
    if (!address) return Promise.resolve();
    terminalCleanup ??= stopTerminal();
    return terminalCleanup;
  };
  const removeJob = () => {
    if (!job || !JOB.test(job)) return Promise.resolve();
    jobCleanup ??= invoke(where, runner, ["job-remove", job]);
    return jobCleanup;
  };
  const stopTerminal = async () => {
    const result = await hc(["get", "--json", address]);
    if (result.code !== 0) {
      if (coreError(result)?.kind === "not_found") return;
      throw new Error(result.stderr || result.stdout || "Cannot inspect the query worker for cleanup.");
    }
    const terminal = JSON.parse(result.stdout);
    if (terminal.labels?.["shared-context.query"] !== job) throw new Error("Refusing to stop a terminal that does not belong to this query.");
    if (terminal.state === "live") {
      const stopped = await hc(["kill", "--json", address]);
      if (stopped.code !== 0 && !["not_found", "finished"].includes(coreError(stopped)?.kind)) throw new Error(stopped.stderr || stopped.stdout || "Cannot stop the query worker.");
    }
    const removed = await hc(["rm", "--json", address]);
    if (removed.code !== 0 && coreError(removed)?.kind !== "not_found") throw new Error(removed.stderr || removed.stdout || "Cannot remove the query worker.");
    address = null;
  };
  control.cancel = () => {
    control.cancelled = true;
    // Release must finish both cleanup steps even when a status response is
    // still pending and the view's final callback is about to end.
    // A late launch response remains owned by finally.
    if (address || terminalCleanup) return removeTerminal().then(removeJob);
  };
  try {
    checkCancelled(control);
    ({ job } = await invoke(where, runner, ["job-create", request]));
    if (typeof job !== "string" || !JOB.test(job)) throw new Error("The helper returned an invalid query job identity.");
    checkCancelled(control);
    const result = await hc(["run", "--json", "--bg", "--no-parent", "--no-notify", "--cwd", where.cwd, "--label", `shared-context.query=${job}`, ...(where.machine ? ["--on", where.machine] : []), "--", ...runner, "job-run", job]);
    if (result.code !== 0) throw new Error(result.stderr || result.stdout || "Core could not start the query worker.");
    const terminal = JSON.parse(result.stdout);
    if (typeof terminal.address !== "string" || !terminal.address) throw new Error("Core did not return a query worker address.");
    address = where.machine && !terminal.address.includes("/") ? `${where.machine}/${terminal.address}` : terminal.address;
    const deadline = Date.now() + 600000;
    let sequence = 0, first = true;
    for (; ;) {
      checkCancelled(control);
      const status = await invoke(where, runner, ["job-status", job, String(sequence), first ? "0" : "500"]);
      first = false;
      checkCancelled(control);
      for (const progress of status.progress ?? []) {
        if (!Number.isSafeInteger(progress.seq) || progress.seq <= sequence) continue;
        sequence = progress.seq;
        onProgress?.(progress);
      }
      if (status.state === "done") return status.value;
      if (status.state === "error") throw queryError(status.error);
      if (!["pending", "running"].includes(status.state)) throw new Error("The helper returned an invalid query job state.");
      if (Date.now() >= deadline) throw new Error("The tracker query exceeded its ten-minute deadline.");
      const state = await hc(["get", "--json", address]);
      if (state.code !== 0) throw new Error(state.stderr || state.stdout || "The query worker is unavailable.");
      if (JSON.parse(state.stdout).state !== "live") {
        const final = await invoke(where, runner, ["job-status", job, String(sequence), "0"]);
        for (const progress of final.progress ?? []) if (progress.seq > sequence) { sequence = progress.seq; onProgress?.(progress); }
        if (final.state === "done") return final.value;
        if (final.state === "error") throw queryError(final.error);
        throw new Error("The query worker exited without publishing its result. Refresh to start a new read query.");
      }
    }
  } catch (error) {
    checkCancelled(control);
    throw error;
  } finally {
    control.cancel = null;
    await removeTerminal();
    await removeJob();
  }
}

function checkTarget(where) {
  if (!where || typeof where.cwd !== "string" || !where.cwd.startsWith("/")) throw new Error("Select an absolute repository folder on the target machine.");
  if (where.machine != null && typeof where.machine !== "string") throw new Error("Select a named Herdr Core machine.");
}

function checkCancelled(control) {
  if (control.cancelled) throw cancelled();
}

function queryError(value) {
  const error = new Error(typeof value?.message === "string" ? value.message : "The target query failed.");
  error.code = typeof value?.code === "string" ? value.code : "QUERY_FAILED";
  return error;
}

function coreError(result) {
  for (const text of [result.stderr, result.stdout]) {
    try { const value = JSON.parse(text); if (value.error) return value.error; } catch { }
  }
  return null;
}
