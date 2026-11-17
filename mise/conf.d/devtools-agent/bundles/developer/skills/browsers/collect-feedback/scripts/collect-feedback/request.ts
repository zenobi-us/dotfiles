// Requests compose the installed collector and existing importer/server.
// No capture implementation or approval policy lives in the feedback layer.
import { join, resolve } from "node:path";
import { CliError } from "../../../collect-evidence/scripts/browser-evidence/sh.ts";
import { boundedFile, checkId, importSession, requireValue, validateSession, type ImportOptions } from "./records.ts";
import { serveSession } from "./server.ts";

type RequestOptions = ImportOptions & { port: number };

export async function requestFeedback(directory: string, options: RequestOptions, ready: (data: object) => void): Promise<void> {
  checkId(options.workflow); checkId(options.session);
  requireValue(Number.isInteger(options.port) && options.port >= 1 && options.port <= 65535, "request requires --port from 1 to 65535");
  let interrupted = false;
  let child: Bun.Subprocess | undefined;
  const stop = () => { if (!interrupted) { interrupted = true; child?.kill("SIGTERM"); } };
  const check = () => { if (interrupted) throw new CliError("Feedback request interrupted; retained records are not a completed request", 1); };
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
  try {
    let source = directory;
    let collection: object | undefined;
    if (!options.historical) {
      const workspace = JSON.parse((await boundedFile(directory, "workspace.json", 4 * 1024 * 1024)).toString("utf8"));
      requireValue(workspace?.schema === "collect-evidence/v1" && workspace.kind === "event" && typeof workspace.repository === "string", "Fresh request requires a collector workspace; use --historical for an earlier sealed run");
      requireValue(resolve(workspace.repository) === resolve(options.repository) && workspace.workflow === options.workflow, "Request repository and workflow must match the approved collector workspace");
      const executable = resolve(import.meta.dir, "../../../collect-evidence/scripts/collect-evidence.ts");
      const args = [executable, "run", directory, "--json", "--no-input", ...(options.dryRun ? ["--dry-run"] : [])];
      check();
      child = Bun.spawn(args, { stdout: "pipe", stderr: "inherit" });
      const output = await new Response(child.stdout).text();
      const code = await child.exited;
      child = undefined;
      check();
      const result = JSON.parse(output);
      const blocked = result.verdicts?.some((v: { verdict: string }) => v.verdict === "BLOCKED");
      // Only assertion-only failures are reviewable; collector exit 1 can also include blocked cases.
      const reviewableFailure = code === 1 && result.success && !blocked && result.verdicts?.some((v: { verdict: string }) => v.verdict === "FAIL");
      if (blocked || (code !== 0 && !reviewableFailure) || !result.success) {
        if (result.destination) ready({ success: false, stage: "capture-stopped", completed: false, source: result.destination, verdicts: result.verdicts });
        throw new CliError(result.message ?? "Collector stopped; no feedback session was created. Inspect retained evidence and use a new run identity for retry", blocked || code === 3 ? 3 : code === 2 ? 2 : 1);
      }
      requireValue(typeof result.destination?.path === "string", "Collector did not return its resolved evidence destination");
      source = result.destination.path;
      collection = { capability: result.capability, verdicts: result.verdicts };
      if (options.dryRun) {
        ready({ dryRun: true, historical: false, source: result.destination, driver: result.driver, sessionId: options.session, port: options.port });
        return;
      }
    }
    check();
    // importSession validates the sealed source and copied records before finalization.
    const imported = await importSession(source, options) as { destination: { path: string; ref: string }; session?: { id: string } };
    check();
    if (options.dryRun) { ready({ ...imported, historical: true, port: options.port }); return; }
    const session = imported.destination.path;
    await validateSession(session);
    check();
    // The existing server takes signal ownership only after capture/import finish.
    process.off("SIGINT", stop); process.off("SIGTERM", stop);
    await serveSession(session, options.port, data => ready({
      ...data, historical: Boolean(options.historical), source: resolve(source), destination: imported.destination,
      records: { session: join(session, "session.json"), index: join(session, "index.md"), cases: join(session, "cases") },
      ...(collection ? { collection } : {}),
    }));
  } finally {
    process.off("SIGINT", stop); process.off("SIGTERM", stop);
  }
}
