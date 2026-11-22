// Records run-owned processes without signalling them. PID, boot and start ticks
// distinguish an exited process from an unrelated process that reuses its PID.
import { readdir, readFile, readlink, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { readRun, runSignalPath } from "./signals.ts";
import { readRecord, validateRecord, assertRunPath } from "./records.ts";

export interface OwnedProcess {
  pid: number;
  bootId: string;
  startTicks: string;
  command: string;
  cwd?: string;
  state: "running" | "stopped" | "unconfirmed";
}

export interface ResourceObservation {
  schemaVersion: "muxer-resources/v2";
  runId: string;
  observedAt: string;
  shutdown: "pending" | "confirmed" | "unconfirmed";
  processes: OwnedProcess[];
}

interface ProcessSnapshot extends OwnedProcess {
  parentPid: number;
}

// A narrow process-filesystem seam keeps permission and exit races testable
// without replacing the durable run-record filesystem.
export interface ProcessAccess {
  readFile(path: string): Promise<string>;
  readdir(): Promise<string[]>;
  readlink(path: string): Promise<string>;
}

const processAccess: ProcessAccess = {
  readFile: path => readFile(path, "utf8"),
  readdir: () => readdir("/proc"),
  readlink,
};

export async function observeResources(runId: string, launcherPid?: number, access: ProcessAccess = processAccess): Promise<ResourceObservation> {
  await readRun(runId);
  const path = join(dirname(runSignalPath(runId)), "resources.json");
  let previous: ResourceObservation | undefined;
  try {
    const record = await readRecord(path);
    validateRecord(record, "muxer-resources", runId);
    previous = record as unknown as ResourceObservation;
  }
  catch (error) { if (!isMissing(error)) throw error; }
  const owned = new Map((previous?.processes ?? []).map(item => [identity(item), item]));
  // Separate immutable identities prevent simultaneous launcher and parent
  // observations from erasing each other's newly discovered processes.
  for (const entry of await readdir(dirname(path))) {
    if (!/^owned-[0-9a-f-]+-\d+-\d+\.json$/.test(entry)) continue;
    const record = await readRecord(join(dirname(path), entry));
    validateRecord(record, "muxer-owned-process", runId);
    if (entry !== `owned-${record.bootId}-${record.pid}-${record.startTicks}.json`) throw new Error("Process identity does not match filename");
    const { schemaVersion: _, runId: __, ...item } = record;
    owned.set(identity(item as unknown as OwnedProcess), item as unknown as OwnedProcess);
  }
  let bootId: string;
  let entries: string[];
  try {
    bootId = (await access.readFile("/proc/sys/kernel/random/boot_id")).trim();
    entries = await access.readdir();
  } catch {
    return saveObservation(path, runId, [...owned.values()].map(item => ({ ...item, state: "unconfirmed" })), false);
  }
  const snapshots = new Map<number, ProcessSnapshot>();
  let complete = true;
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    try {
      const snapshot = await inspectProcess(pid, bootId, access);
      snapshots.set(pid, snapshot);
      let tagged = false;
      try {
        const environment = await access.readFile(`/proc/${pid}/environ`);
        tagged = environment.split("\0").includes(`MUXER_SUBAGENT_RUN_ID=${runId}`);
      } catch {
        // Unreadable environments do not undo a registered identity or prove
        // ownership of an unrelated process. Its stat still establishes state.
      }
      if (tagged || (pid === launcherPid && process.env.MUXER_SUBAGENT_RUN_ID === runId && pid === process.ppid)) {
        owned.set(identity(snapshot), snapshot);
      }
    } catch (error) {
      if (!isMissing(error)) {
        const known = [...owned.values()].some(item => item.pid === pid && item.bootId === bootId);
        const launcher = pid === launcherPid && pid === process.ppid && process.env.MUXER_SUBAGENT_RUN_ID === runId;
        const tagged = await access.readFile(`/proc/${pid}/environ`)
          .then(environment => environment.split("\0").includes(`MUXER_SUBAGENT_RUN_ID=${runId}`), () => false);
        // Permission failures for arbitrary unrelated processes cannot make a
        // known owner's confirmed exit uncertain.
        if (known || launcher || tagged) complete = false;
      }
    }
  }
  // Follow live owned ancestors too: a service can deliberately clear its environment.
  let changed = true;
  while (changed) {
    changed = false;
    for (const snapshot of snapshots.values()) {
      const parent = snapshots.get(snapshot.parentPid);
      if (parent && owned.has(identity(parent)) && !owned.has(identity(snapshot))) {
        owned.set(identity(snapshot), snapshot);
        changed = true;
      }
    }
  }
  const processes: OwnedProcess[] = [];
  for (const item of owned.values()) {
    const recordPath = join(dirname(path), `owned-${item.bootId}-${item.pid}-${item.startTicks}.json`);
    await assertRunPath(recordPath);
    const record = { schemaVersion: "muxer-owned-process/v2", runId, ...item };
    validateRecord(record, "muxer-owned-process", runId);
    try { await writeFile(recordPath, `${JSON.stringify(record)}\n`, { flag: "wx", mode: 0o600 }); }
    catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
      validateRecord(await readRecord(recordPath), "muxer-owned-process", runId);
    }
    const current = snapshots.get(item.pid);
    if (item.bootId !== bootId || (current && identity(current) !== identity(item))) {
      processes.push({ ...item, state: "stopped" });
    } else if (current) {
      const { parentPid: _, ...process } = current;
      processes.push(process);
    } else {
      try {
        await access.readFile(`/proc/${item.pid}/stat`);
        processes.push({ ...item, state: "unconfirmed" });
      } catch (error) {
        processes.push({ ...item, state: isMissing(error) ? "stopped" : "unconfirmed" });
      }
    }
  }
  return saveObservation(path, runId, processes, complete);
}

function identity(process: OwnedProcess): string {
  return `${process.bootId}:${process.pid}:${process.startTicks}`;
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ESRCH");
}

async function inspectProcess(pid: number, bootId: string, access: ProcessAccess): Promise<ProcessSnapshot> {
  const stat = await access.readFile(`/proc/${pid}/stat`);
  const end = stat.lastIndexOf(")");
  const fields = stat.slice(end + 2).trim().split(/\s+/);
  if (end < 0 || !/^\d+$/.test(fields[19] ?? "")) throw new Error("Invalid process start identity");
  const cwd = await access.readlink(`/proc/${pid}/cwd`).catch(() => undefined);
  return {
    pid, bootId, startTicks: fields[19]!, command: stat.slice(stat.indexOf("(") + 1, end),
    parentPid: Number(fields[1]), ...(cwd ? { cwd } : {}),
    state: fields[0] === "Z" || fields[0] === "X" ? "stopped" : "running",
  };
}

async function saveObservation(path: string, runId: string, processes: OwnedProcess[], complete: boolean): Promise<ResourceObservation> {
  const observation: ResourceObservation = {
    schemaVersion: "muxer-resources/v2", runId, observedAt: new Date().toISOString(), processes,
    shutdown: processes.some(item => item.state === "running") ? "pending"
      : complete && processes.length > 0 && processes.every(item => item.state === "stopped") ? "confirmed" : "unconfirmed",
  };
  validateRecord(observation, "muxer-resources", runId);
  await assertRunPath(path);
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(observation)}\n`, { mode: 0o600, flag: "wx" });
  await rename(temporary, path);
  return observation;
}

// Shell launchers register before running the agent, so short-lived agents still
// leave an ownership record. Other entry points use the shared observer directly.
if (import.meta.main) {
  const [runId, pid] = process.argv.slice(2);
  if (!runId || !pid || !/^\d+$/.test(pid) || Number(pid) !== process.ppid || process.env.MUXER_SUBAGENT_RUN_ID !== runId) {
    throw new Error("Launcher registration requires its parent PID and assigned run identity");
  }
  await observeResources(runId, Number(pid));
}
