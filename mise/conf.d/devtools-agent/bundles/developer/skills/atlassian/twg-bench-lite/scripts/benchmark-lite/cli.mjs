// Both runtime entrypoints expose the same owning operations without launching live tasks on reads.
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { ids, readRecordFile, readRecord, sharedRouter, skillRoot } from "./records.mjs";
import { readFileSync } from "node:fs";

export function isEntrypoint(url) {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(url);
}

export async function runCli(operations) {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "help") {
    console.log("twg-bench-lite doctor | check <family> <file> | render <result> [--report-file <html>] | run --prompt <text> [--control-output-file <file> --test-output-file <file> --no-judge] | upgrade <configuration> | bulk-upgrade <path-list.json>");
    return;
  }
  if (command === "doctor") {
    if (args.length) throw new Error("doctor takes no arguments.");
    console.log(JSON.stringify(operations.doctorPayload(), null, 2));
  } else if (command === "check") {
    const [family, path, ...extra] = args;
    if (!ids[family] || !path || extra.length) throw new Error("Use check <configuration|result|manifest|judgement|run|progress> <file>.");
    const records = family === "progress"
      ? readFileSync(path, "utf8").trimEnd().split("\n").map(line => readRecord(JSON.parse(line), family))
      : readRecordFile(path, family);
    console.log(JSON.stringify(records, null, 2));
  } else if (command === "upgrade" || command === "bulk-upgrade") {
    if (args.length !== 1) throw new Error("Supply one configuration path or one JSON path list.");
    const sharedArgs = command === "upgrade"
      ? ["safe-upgrade", "--artifact", args[0], "--operation", "upgrade"]
      : ["bulk-upgrade", "--artifacts", args[0]];
    const result = execFileSync(sharedRouter, [...sharedArgs, "--skill", skillRoot, "--owner", "file:scripts/benchmark-lite/configuration-owner.mjs"], { encoding: "utf8" });
    process.stdout.write(result);
  } else if (command === "render" || command === "report") {
    const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { "report-file": { type: "string" } } });
    if (positionals.length !== 1) throw new Error("Supply one stored result path.");
    console.log((await operations.reportBenchmarkLite(positionals[0], { reportFile: values["report-file"] })).reportPath);
  } else if (command === "run") {
    const stringFlags = ["prompt", "prompt-file", "output-dir", "agent", "model", "effort", "judge-agent", "judge-model", "judge-effort", "judge-timeout-seconds", "arm-timeout-seconds", "control-output-file", "test-output-file", "control-result-file", "test-result-file", "control-status", "test-status", "control-tools", "test-tools", "quality-file", "classification", "summary"];
    const booleanFlags = ["judge", "no-judge", "control-used-twg", "test-used-twg"];
    const options = Object.fromEntries([...stringFlags.map(key => [key, { type: "string" }]), ...booleanFlags.map(key => [key, { type: "boolean" }])]);
    const { values } = parseArgs({ args, options });
    if (values.judge && values["no-judge"]) throw new Error("Use either --judge or --no-judge.");
    const normalized = Object.fromEntries(Object.entries(values).map(([key, value]) => [key.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase()), value]));
    if (values["no-judge"]) normalized.judge = false;
    const result = await operations.runBenchmarkLite(normalized);
    readRecord(result.payload, "run");
    console.log(JSON.stringify(result.payload, null, 2));
  } else throw new Error("Unsupported benchmark command. Use --help.");
}
