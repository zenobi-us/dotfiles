#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Fail when package.json grows a scripts block"

/*!
 * Every command in this repository is a mise file task under `.mise/tasks/`.
 * A command written twice drifts: the hook runs one version and CI runs the
 * other. This check keeps the task files the only place a command lives.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const manifest = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};

const names = Object.keys(manifest.scripts ?? {});

if (names.length > 0) {
  console.error(`package.json contains scripts, which is not allowed: ${names.join(", ")}`);
  console.error("Rewrite each one as a .mise/tasks/<name> file, then delete the scripts block.");
  process.exit(1);
}

console.log("package.json scripts check: ok");
