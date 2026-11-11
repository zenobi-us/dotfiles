#!/usr/bin/env -S mise exec -- bun run --install=fallback
// The GUI needs explicit Bun and mq paths even when its login environment differs.
import path from "node:path";
import { appHome, atomicWrite } from "./files";

let mq = Bun.which("mq");
if (!mq) {
  const lookup = Bun.spawn(["mise", "which", "mq"], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(lookup.stdout).text(), new Response(lookup.stderr).text(), lookup.exited]);
  if (code) throw new Error(stderr || "Install mq with mise before preparing the panels.");
  mq = stdout.trim();
}
const runtime = {
  binary: process.execPath,
  path: [path.dirname(process.execPath), path.dirname(mq), process.env.PATH ?? ""].join(path.delimiter),
};
await atomicWrite(path.join(appHome, "data/shared-context-runtime.json"), JSON.stringify(runtime) + "\n");
console.log("Prepared the Context request runtime.");
