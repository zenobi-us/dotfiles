// Reads retained lifecycle evidence without observing processes or changing bytes.
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readRun, runSignalPath } from "./signals.ts";
import { readRecord, validateRecord } from "./records.ts";
/** Explicit historical input support never normalizes, observes, or deletes evidence. */
export async function readRunEvidence(runId: string, historical = false): Promise<Record<string, unknown>> {
  const run = await readRun(runId, historical);
  const directory = dirname(runSignalPath(runId));
  let resources: unknown;
  try {
    resources = await readRecord(resolve(directory, "resources.json"));
    validateRecord(resources, "muxer-resources", runId, historical);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  const completions: unknown[] = [];
  const processes: unknown[] = [];
  for (const name of (await readdir(directory)).sort()) {
    if (/^signal-\d+\.json$/.test(name)) {
      const record = await readRecord(resolve(directory, name));
      validateRecord(record, "muxer-completion", runId, historical);
      if (name !== `signal-${record.sequence}.json`) throw new Error("Completion sequence does not match filename");
      completions.push(record);
    } else if (/^owned-[0-9a-f-]+-\d+-\d+\.json$/.test(name)) {
      const record = await readRecord(resolve(directory, name));
      validateRecord(record, "muxer-owned-process", runId, historical);
      if (name !== `owned-${record.bootId}-${record.pid}-${record.startTicks}.json`) throw new Error("Process identity does not match filename");
      processes.push(record);
    }
  }
  return { schemaVersion: "muxer-evidence/v1", ...run, resources, completions, processes };
}
