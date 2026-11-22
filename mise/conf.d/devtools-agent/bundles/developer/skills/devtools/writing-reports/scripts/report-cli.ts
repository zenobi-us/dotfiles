#!/usr/bin/env -S mise x -- bun --install=fallback
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { dirname, join, resolve } from "node:path";
import { reportRun, schemaVersion } from "../../../browsers/collect-evidence/scripts/browser-evidence/pipeline.ts";
import { CliError } from "../../../browsers/collect-evidence/scripts/browser-evidence/sh.ts";
import { AnnotationError, exportSession } from "../../../browsers/collect-feedback/scripts/collect-feedback/annotations.ts";

const scripts = dirname(import.meta.path);
async function forward(name: string, args: string[]) {
  const child = Bun.spawn([process.execPath, join(scripts, name), ...args], { stdout: "inherit", stderr: "inherit" });
  process.exit(await child.exited);
}
const cli = new Crust("writing-reports").meta({ description: "Create and validate evidence reports." });
const newer = cli.sub("new").meta({ description: "Create a report directory." }).flags({ destination: { type: "string" }, title: { type: "string" } }).run(({ flags }) => forward("new-report.ts", [String(flags.destination ?? ""), String(flags.title ?? "")]));
const validate = cli.sub("validate").meta({ description: "Validate a report." }).args([{ name: "page", type: "string", required: true }]).run(({ args }) => forward("validate-report.ts", [args.page]));
const imgsize = cli.sub("imgsize").meta({ description: "Read image dimensions." }).args([{ name: "files", type: "string", required: true }]).run(({ args }) => forward("imgsize.ts", [args.files]));
const doctor = cli.sub("doctor").meta({ description: "Report report-tool prerequisites." }).run(() => console.log(JSON.stringify({ bun: Bun.version, scripts }, null, 2)));
// Share the collector's report and feedback validation; neither consumer writes records.
const evidence = cli.sub("evidence").meta({ description: "Read common evidence, or an explicitly selected feedback session, without changing it." })
  .args([{ name: "directory", type: "string", required: true }])
  .flags({
    feedback: { type: "boolean", description: "Read a feedback session and its preserved source run" },
    historical: { type: "boolean", description: "Label a selected sealed run as historical; sessions retain their own label" },
    json: { type: "boolean", description: "Emit common cases, results, HTML and saved feedback as JSON" },
  }).run(async ({ args, flags }) => {
    try {
      if (flags.feedback && flags.historical !== undefined) throw new CliError("Feedback reports retain the session's historical selection; omit --historical", 2);
      const directory = resolve(args.directory);
      const feedback = flags.feedback ? await exportSession(directory) : undefined;
      const report = await reportRun(feedback ? join(directory, "source") : directory, feedback ? feedback.session.historical === true : Boolean(flags.historical));
      console.log(flags.json ? JSON.stringify({ schemaVersion, kind: "event", command: "report", success: true, ...report, ...(feedback ? { feedback } : {}) }) : report.html);
    } catch (error) {
      const code = error instanceof CliError ? error.exitCode : error instanceof SyntaxError || (error instanceof AnnotationError && error.status === 400) ? 2 : 1;
      const message = error instanceof Error ? error.message : String(error);
      if (flags.json) console.log(JSON.stringify({ schemaVersion, kind: "error", success: false, code, message }));
      console.error(message); process.exitCode = code;
    }
  });
// Crust parses inside middleware and consumes uncaught errors in execute().
await cli.use({
  name: "versioned-evidence-errors",
  middleware: async (context, next) => {
    try { await next(); }
    catch (error) {
      if (context.route?.command.meta.name !== "evidence") throw error;
      const message = error instanceof Error ? error.message : String(error);
      if (context.argv.includes("--json")) console.log(JSON.stringify({ schemaVersion, kind: "error", success: false, code: 2, message }));
      console.error(message);
      process.exitCode = 2;
    }
  },
}).use(helpPlugin()).command(newer).command(validate).command(imgsize).command(doctor).command(evidence).execute();
