#!/usr/bin/env -S mise x -- bun --install=fallback
import { fileURLToPath } from "node:url";

// Compatibility entry point. The implementation is TypeScript so the original
// executable path remains valid for installed copies of this skill.
const implementation = fileURLToPath(new URL("./render-graphs.ts", import.meta.url));
const result = Bun.spawnSync([process.execPath, implementation, ...process.argv.slice(2)], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});
process.exitCode = result.exitCode;
