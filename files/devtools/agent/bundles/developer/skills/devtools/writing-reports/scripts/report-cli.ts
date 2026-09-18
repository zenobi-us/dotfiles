#!/usr/bin/env -S mise x -- bun --install=fallback
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { dirname, join } from "node:path";

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
cli.use(helpPlugin()).command(newer).command(validate).command(imgsize).command(doctor).execute();
