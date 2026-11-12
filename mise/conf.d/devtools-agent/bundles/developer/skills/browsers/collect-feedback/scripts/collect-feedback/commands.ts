// Both serve entrypoints execute this command definition and error boundary.
import { Crust } from "@crustjs/core@0.0.19";
import { helpPlugin } from "@crustjs/plugins@0.1.2";
import { resolve } from "node:path";
import { CliError } from "../../../collect-evidence/scripts/browser-evidence/sh.ts";
import { importSession, requireValue, schema, validateSession } from "./records.ts";
import { serveSession } from "./server.ts";

const flags = {
  json: { type: "boolean", description: "Emit versioned JSON" },
  plain: { type: "boolean", description: "Emit plain output" },
  quiet: { type: "boolean", short: "q", description: "Suppress successful output" },
  color: { type: "boolean", description: "Use --no-color; output is uncoloured" },
  input: { type: "boolean", description: "Use --no-input; commands never prompt" },
  "dry-run": { type: "boolean", description: "Validate without writes or server startup" },
  repository: { type: "string", description: "Repository whose evidence route applies" },
  workflow: { type: "string", description: "Workflow ID" },
  session: { type: "string", description: "New immutable feedback session ID" },
  port: { type: "number", description: "Explicit loopback port; no fallback" },
} as const;

export async function runCli(directServe = false): Promise<void> {
  if (process.argv.includes("--version") && !process.argv.some(a => a === "--help" || a === "-h")) {
    console.log(process.argv.includes("--json") ? JSON.stringify({ schema, kind: "event", success: true, version: "1.0.0" }) : "1.0.0");
    return;
  }
  const errors = { name: "versioned-errors", middleware: async (_context: unknown, next: () => Promise<void>) => {
    try { await next(); } catch (error) { failure(error, 2); }
  } };
  const root = directServe ? command("serve").use(errors).use(helpPlugin()) : new Crust("collect-feedback")
    .meta({ description: "Import and browse immutable evidence; read-only viewer" }).use(errors).use(helpPlugin())
    .command(command("init")).command(command("validate")).command(command("serve"));
  try { await root.execute(); } catch (error) { failure(error, 2); }
}
function command(name: string) {
  return new Crust(name).meta({ description: name === "init" ? "Import a sealed run into a new resolved feedback session" : name === "serve" ? "Serve the bundled read-only viewer on loopback" : "Validate feedback and original media hashes" })
    .flags(flags).args([{ name: "dir", type: "string", required: true, description: name === "init" ? "Sealed evidence run" : "Feedback session directory" }])
    .run(async ({ args, flags: options }) => {
      try {
        const directory = resolve(args.dir);
        if (name !== "init" && (options.repository || options.workflow || options.session)) throw new CliError("Store flags apply only to init", 2);
        if (name !== "serve" && options.port !== undefined) throw new CliError("--port applies only to serve", 2);
        const emit = (data: object) => {
          if (options.quiet) return;
          const result = { schema, kind: "event", command: name, success: true, ...data };
          console.log(options.plain && !options.json ? plainResult(result) : JSON.stringify(result, null, options.json ? undefined : 2));
        };
        if (name === "init") {
          const repository = options.repository ?? process.env.COLLECT_FEEDBACK_REPOSITORY;
          requireValue(repository && options.workflow && options.session, "init requires --repository, --workflow and --session");
          emit(await importSession(directory, { repository, workflow: options.workflow, session: options.session, dryRun: options["dry-run"] }));
        } else if (name === "validate") {
          const view = await validateSession(directory);
          emit({ valid: true, session: view.session, cases: view.cases });
        } else {
          requireValue(options.port !== undefined, "serve requires --port");
          if (options["dry-run"]) {
            requireValue(Number.isInteger(options.port) && options.port > 0 && options.port <= 65535, "Invalid explicit port");
            const view = await validateSession(directory); emit({ dryRun: true, sessionId: view.session.id, port: options.port });
          } else await serveSession(directory, options.port, emit);
        }
      } catch (error) { failure(error); }
    });
}
function plainResult(data: object, prefix = ""): string {
  return Object.entries(data).map(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") return plainResult(value, label);
    return `${label}: ${String(value).replaceAll("\n", "\\n").replaceAll("\r", "\\r")}`;
  }).filter(Boolean).join("\n");
}
function failure(error: unknown, fallback = 1): void {
  const code = error instanceof CliError ? error.exitCode : error instanceof SyntaxError ? 2 : fallback;
  const message = error instanceof CliError ? error.message : "Feedback operation failed; check input files, permissions and explicit port availability";
  if (process.argv.includes("--json")) console.log(JSON.stringify({ schema, kind: "error", success: false, code, message }));
  console.error(message); process.exitCode = code;
}
