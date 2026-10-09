#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Type check the site and its tasks"
//MISE depends=["deps"]

/*!
 * `tsc --noEmit` over tsconfig.json.
 *
 * tsc is spawned rather than imported, because its Node API and its CLI do not
 * report the same way and the CLI output is the one a person reads.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const result = Bun.spawnSync([path.join(repoRoot, "node_modules", ".bin", "tsc"), "--noEmit"], {
  cwd: repoRoot,
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(result.exitCode);
