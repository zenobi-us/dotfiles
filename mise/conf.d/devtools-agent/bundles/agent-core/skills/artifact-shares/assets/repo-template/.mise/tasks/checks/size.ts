#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Fail when a file or the site exceeds GitHub's published limits"

/*!
 * GitHub's own numbers, current at the time of writing:
 *
 *   50 MiB    git warns on a file
 *   100 MiB   GitHub blocks a file outright
 *   1 GB      the maximum size of a published Pages site
 *   1 GB      the recommended maximum size of a Pages source repository
 *   10 min    a Pages deployment times out
 *
 * https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
 * https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
 *
 * A share that breaks one of these fails at `git push` or at deploy, long
 * after the commit, with a message that does not name the artifact. This check
 * fails first and names the file.
 *
 *   checks/size.ts                  fail over 50 MiB
 *   checks/size.ts --allow-large    fail only over 100 MiB, which git rejects anyway
 *   checks/size.ts --root <dir>     check somewhere else
 */

import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(taskDir, "..", "..", "..");

const argv = process.argv.slice(2);
const allowLarge = argv.includes("--allow-large");
const rootFlag = argv.indexOf("--root");
const root = rootFlag === -1 ? repoRoot : path.resolve(argv[rootFlag + 1] ?? repoRoot);

const MiB = 1024 * 1024;
const WARN_FILE = 50 * MiB;
const BLOCK_FILE = 100 * MiB;
const SITE_LIMIT = 1000 * 1000 * 1000;
const SITE_WARN = 800 * 1000 * 1000;

// What the deploy workflow uploads comes from these two directories plus the
// generated HTML. They are the part that grows with every share.
const PUBLISHED = ["public", "content"];
const SKIP = new Set(["node_modules", "dist", ".source", ".git"]);

function walk(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(child);
    return entry.isFile() ? [child] : [];
  });
}

function human(bytes: number): string {
  if (bytes >= MiB) return `${(bytes / MiB).toFixed(1)} MiB`;
  return `${(bytes / 1024).toFixed(0)} KiB`;
}

let failed = false;
let total = 0;

for (const file of walk(root).sort()) {
  const bytes = statSync(file).size;
  total += bytes;
  const name = path.relative(root, file);

  if (bytes > BLOCK_FILE) {
    console.error(`size check: ${name} is ${human(bytes)}. GitHub blocks files over 100 MiB.`);
    failed = true;
    continue;
  }
  if (bytes > WARN_FILE && !allowLarge) {
    console.error(`size check: ${name} is ${human(bytes)}, over the 50 MiB warning limit.`);
    console.error("  A recording this size is usually a mistake. To publish it, pass --allow-large.");
    failed = true;
  }
}

// The measured directories are the ones that grow. Measuring the whole root
// would count a check's own scratch files on a dry run.
let published = 0;
for (const name of PUBLISHED) {
  for (const file of walk(path.join(root, name))) published += statSync(file).size;
}
const measured = published > 0 ? published : total;

if (measured > SITE_LIMIT) {
  console.error(`size check: published content is ${human(measured)}. A Pages site may not exceed 1 GB.`);
  console.error("  Redact the largest shares, or start a second share repository.");
  failed = true;
} else if (measured > SITE_WARN) {
  console.log(`size check: published content is ${human(measured)}, approaching the 1 GB Pages limit.`);
}

if (failed) process.exit(1);
console.log(`size check: ok (${human(measured)} published)`);
