#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import path from "node:path";

const bundleRoot = path.resolve(import.meta.dir, "../../..");
const result = spawnSync(process.execPath, [path.join(bundleRoot, "cli.ts"), ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
