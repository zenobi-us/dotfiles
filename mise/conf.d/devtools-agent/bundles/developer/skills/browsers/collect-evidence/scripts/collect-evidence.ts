#!/usr/bin/env -S mise x -- bun --install=fallback
// Installed public boundary. Output flags never change capture approval or stores.
import { Crust } from "@crustjs/core@0.0.19";
import { helpPlugin } from "@crustjs/plugins@0.1.2";
import { resolve } from "node:path";
import { CliError } from "./browser-evidence/sh.ts";
import { schema, doctor, initWorkspace, renderWorkspace, compileWorkspace, collect, validate, reportRun, generatedComment, type Options } from "./browser-evidence/pipeline.ts";

const VERSION = "1.1.0";
const flags = {
  json: { type: "boolean", description: "Emit versioned JSON on stdout" },
  plain: { type: "boolean", description: "Emit uncoloured text" },
  quiet: { type: "boolean", short: "q", description: "Suppress successful output" },
  color: { type: "boolean", description: "Colour output; use --no-color (output is plain by default)" },
  input: { type: "boolean", description: "Interactive input; use --no-input (commands never prompt)" },
  "dry-run": { type: "boolean", description: "Validate intent without writes or driver execution" },
  force: { type: "boolean", description: "Replace selected generated plan/compilation only" },
  repository: { type: "string", description: "Repository whose shared-context evidence route applies" },
  workflow: { type: "string", description: "Workflow ID" },
  run: { type: "string", description: "New immutable run ID" },
  driver: { type: "string", description: "surf, playwright, tui or gui (native Linux X11)" },
  display: { type: "string", description: "Approved local X11 display for GUI doctor" },
  window: { type: "string", description: "Approved X11 window ID or root for GUI doctor" },
  test: { type: "string", description: "Collect only this case ID" },
  url: { type: "string", description: "Explicit published evidence URL for a generated comment" },
  title: { type: "string", description: "Exact approved GUI window title for doctor, or generated comment heading" },
} as const;

type Output = { verdicts?: Array<{ verdict: string }>; html?: string; markdown?: string; dryRun?: boolean; driver?: string };
async function execute(command: string, dir: string | undefined, raw: Record<string, unknown>): Promise<void> {
  const options: Options = {
    repository: typeof raw.repository === "string" ? raw.repository : process.env.COLLECT_EVIDENCE_REPOSITORY,
    workflow: raw.workflow as string | undefined,
    run: raw.run as string | undefined,
    driver: typeof raw.driver === "string" ? raw.driver : process.env.COLLECT_EVIDENCE_DRIVER,
    test: raw.test as string | undefined, url: raw.url as string | undefined, title: raw.title as string | undefined,
    display: raw.display as string | undefined, window: raw.window as string | undefined,
    dryRun: Boolean(raw["dry-run"]), force: Boolean(raw.force),
  };
  try {
    if (options.force && command !== "render" && command !== "compile") throw new CliError("--force applies only to generated render and compile outputs", 2);
    const path = dir ? resolve(dir) : "";
    let data: Output;
    if (options.dryRun && command === "doctor") data = { dryRun: true, driver: options.driver ?? "playwright" };
    else switch (command) {
      case "doctor": data = await doctor(options); break;
      case "init": data = await initWorkspace(path, options); break;
      case "render": data = await renderWorkspace(path, options); break;
      case "compile": data = await compileWorkspace(path, options); break;
      case "run": data = await collect(path, options); break;
      case "validate": data = await validate(path); break;
      case "report": data = await reportRun(path); break;
      case "comment": data = await generatedComment(path, options.url, options.title); break;
      case "verdicts": {
        data = { verdicts: (await reportRun(path)).verdicts };
        break;
      }
      default: throw new CliError(`Unknown command ${command}`, 2);
    }
    if (!raw.quiet) {
      if (raw.json) console.log(JSON.stringify({ schema, kind: "event", command, success: true, ...data }));
      else if (command === "report") console.log(data.html);
      else if (command === "comment") console.log(data.markdown);
      else console.log(JSON.stringify(data, null, raw.plain ? undefined : 2));
    }
    const verdicts = data.verdicts ?? [];
    process.exitCode = command === "run"
      ? verdicts.some(v => v.verdict === "FAIL") ? 1 : verdicts.some(v => v.verdict === "BLOCKED") ? 3 : 0
      : 0;
  } catch (error) {
    const code = error instanceof CliError ? error.exitCode : error instanceof SyntaxError ? 2 : 1;
    const message = error instanceof Error ? error.message : String(error);
    if (raw.json) console.log(JSON.stringify({ schema, kind: "error", command, success: false, code, message }));
    console.error(message);
    process.exitCode = code;
  }
}

if (process.argv.includes("--version") && !process.argv.some(arg => arg === "--help" || arg === "-h")) {
  console.log(process.argv.includes("--json") ? JSON.stringify({ schema, kind: "event", version: VERSION }) : VERSION);
} else {
  let cli = new Crust("collect-evidence").meta({ description: "Collect immutable, versioned web, terminal and GUI evidence" })
    .use({
      name: "versioned-errors", middleware: async (_context, next) => {
        try { await next(); }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (process.argv.includes("--json")) console.log(JSON.stringify({ schema, kind: "error", success: false, code: 2, message }));
          console.error(message);
          process.exitCode = 2;
        }
      }
    })
    .use(helpPlugin());
  for (const name of ["doctor", "init", "render", "compile", "run", "validate", "report", "verdicts", "comment"]) {
    const command = new Crust(name).meta({
      description: {
        doctor: "Check installed driver and connection; never install tools",
        init: "Create an external working plan and resolve its evidence destination",
        render: "Generate the versioned plan and human procedure",
        compile: "Compile the typed plan for its existing driver",
        run: "Collect in private temporary storage and finalize a new immutable run",
        validate: "Verify record contracts, references and media hashes",
        report: "Render a read-only HTML export from validated common records",
        verdicts: "Read the case outcomes from validated common records",
        comment: "Generate manual steps and a report link; never publish",
      }[name]!
    }).flags(flags);
    cli = cli.command(name === "doctor"
      ? command.run(({ flags }) => execute(name, undefined, flags))
      : command.args([{ name: "dir", type: "string", required: true, description: "Working plan directory, or sealed run for consumers" }]).run(({ args, flags }) => execute(name, args.dir, flags)));
  }
  try { await cli.execute(); }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.argv.includes("--json")) console.log(JSON.stringify({ schema, kind: "error", success: false, code: 2, message }));
    console.error(message);
    process.exitCode = 2;
  }
}
