#!/usr/bin/env bun
// Core invokes this target helper with argv, never a shell-interpolated request.
import { QueryJobs } from "./jobs";
import { QueryError, withDeadline } from "./native";
import { dispatch, encodeEnvelope, failure, parseRequest, type Envelope } from "./protocol";

await main();

async function main(): Promise<never> {
  let envelope: Envelope, exitCode = 0;
  try {
    const [command, ...args] = process.argv.slice(2);
    if (process.platform !== "linux" && command !== "--help" && command !== "-h") throw new QueryError("UNSUPPORTED_TARGET", "Shared Context queries currently require a GNU/Linux Core target.");
    const jobs = new QueryJobs();
    let value: unknown;
    switch (command) {
      case "--help":
      case "-h":
        value = {
          description: "Run Shared Context queries on this Core target.",
          usage: [
            "herdr-context request <request-json>",
            "herdr-context job-create <tracker-request-json>",
            "herdr-context job-run <job-uuid>",
            "herdr-context job-status <job-uuid> [afterSeq] [waitMs]",
            "herdr-context job-remove <job-uuid>",
          ],
          request: { protocol: 1, operation: "context", cwd: "/absolute/repository", fields: {} },
          output: "One protocol 1 JSON envelope. Exit 0 on success, 1 on failure.",
          jobs: "Tracker reads only. Status wait is 0..1000 ms. Failed jobs return an error state from job-status.",
        };
        break;
      case "request":
        if (args.length !== 1) throw new QueryError("INVALID_REQUEST", "Use request with one JSON request argument.");
        value = await withDeadline(() => dispatch(parseRequest(args[0])));
        break;
      case "job-create":
        if (args.length !== 1) throw new QueryError("INVALID_REQUEST", "Use job-create with one JSON tracker request argument.");
        value = await jobs.create(parseRequest(args[0]));
        break;
      case "job-run": {
        if (args.length !== 1) throw new QueryError("INVALID_REQUEST", "Use job-run with one owned job UUID.");
        const result = await jobs.run(args[0]!);
        if (result.state === "error") {
          const status = await jobs.status(args[0]!);
          throw new QueryError(status.error?.code ?? "QUERY_FAILED", status.error?.message ?? "The target query failed.");
        }
        value = result;
        break;
      }
      case "job-status":
        if (args.length < 1 || args.length > 3) throw new QueryError("INVALID_REQUEST", "Use job-status with a job UUID, optional sequence, and optional wait in ms.");
        if (args.slice(1).some(value => !/^\d+$/.test(value))) throw new QueryError("INVALID_REQUEST", "Job status sequence and wait must be non-negative integers.");
        value = await jobs.status(args[0]!, args[1] === undefined ? 0 : Number(args[1]), args[2] === undefined ? 0 : Number(args[2]));
        break;
      case "job-remove":
        if (args.length !== 1) throw new QueryError("INVALID_REQUEST", "Use job-remove with one owned job UUID.");
        value = await jobs.remove(args[0]!);
        break;
      default: throw new QueryError("INVALID_REQUEST", "Use request, job-create, job-run, job-status, or job-remove.");
    }
    envelope = { protocol: 1, ok: true, value: value ?? null };
  } catch (error) {
    envelope = { protocol: 1, ok: false, error: failure(error) };
    exitCode = 1;
  }
  let output: string;
  try { output = encodeEnvelope(envelope); }
  catch (error) {
    output = encodeEnvelope({ protocol: 1, ok: false, error: failure(error) });
    exitCode = 1;
  }
  await Bun.write(Bun.stdout, output);
  // A timed-out domain operation must not retain the worker through pending I/O.
  process.exit(exitCode);
}
