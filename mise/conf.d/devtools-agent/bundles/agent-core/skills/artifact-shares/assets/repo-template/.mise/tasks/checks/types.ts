#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Check .types against content/shares/ and the kind registry"

/*!
 * `.types`, `content/shares/`, and `src/components/kinds.ts` must agree.
 *
 * Paths resolve from this file, not from the working directory, so the task
 * gives the same answer wherever it is started.
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isKnownKind } from "../../../src/components/kinds";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TYPES_FILE = path.join(repoRoot, ".types");
const SHARES_DIR = path.join(repoRoot, "content", "shares");
const HASH = /^[a-f0-9]{12}$/;

let failed = false;

function fail(message: string): void {
  console.error(`types validation: ${message}`);
  failed = true;
}

const typesFile = Bun.file(TYPES_FILE);
if (!(await typesFile.exists())) fail(".types does not exist");

const declared = new Map<string, string>();
const lines = (await typesFile.exists()) ? (await typesFile.text()).split(/\r?\n/) : [];

for (const [index, rawLine] of lines.entries()) {
  const lineNumber = index + 1;
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;

  const cut = line.indexOf("=");
  if (cut === -1) {
    fail(`.types:${lineNumber} must read <hash>=<kind>`);
    continue;
  }

  const hash = line.slice(0, cut).trim();
  const kind = line.slice(cut + 1).trim();

  if (!HASH.test(hash)) {
    fail(`.types:${lineNumber} hash must be 12 lowercase hex characters`);
    continue;
  }
  if (declared.has(hash)) fail(`.types:${lineNumber} duplicate hash: ${hash}`);
  if (!isKnownKind(kind)) {
    fail(`.types:${lineNumber} unknown kind: ${kind}. Add it to src/components/kinds.ts`);
  }

  declared.set(hash, kind);

  const page = Bun.file(path.join(SHARES_DIR, `${hash}.mdx`));
  if (!(await page.exists())) {
    fail(`.types:${lineNumber} missing page: content/shares/${hash}.mdx`);
    continue;
  }

  const text = await page.text();
  const front = text.startsWith("---") ? text.slice(3, text.indexOf("\n---", 3)) : "";
  const frontKind = /^kind:\s*(\S+)\s*$/m.exec(front)?.[1];
  const frontHash = /^hash:\s*(\S+)\s*$/m.exec(front)?.[1];

  if (frontKind !== kind) {
    fail(`content/shares/${hash}.mdx frontmatter kind is ${frontKind ?? "missing"}, .types says ${kind}`);
  }
  if (frontHash !== hash) {
    fail(`content/shares/${hash}.mdx frontmatter hash is ${frontHash ?? "missing"}, file name says ${hash}`);
  }
}

// Every share page needs its line. A page with no line has no kind, so the
// site would draw it with the fallback and no one would notice.
let pages: string[] = [];
try {
  pages = readdirSync(SHARES_DIR).filter((name) => name.endsWith(".mdx"));
} catch {
  pages = [];
}

for (const name of pages) {
  const hash = name.slice(0, -4);
  if (!declared.has(hash)) fail(`content/shares/${name} has no line in .types`);
}

if (failed) process.exit(1);
console.log(`types validation: ok (${declared.size} shares)`);
