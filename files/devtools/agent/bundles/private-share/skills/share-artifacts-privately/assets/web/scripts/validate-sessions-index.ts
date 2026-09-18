#!/usr/bin/env -S mise x -- bun --install=fallback

const indexFile = "sessions.jsonl";
const hashPattern = /^[a-f0-9]{12,64}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/;
const kinds = new Set(["html", "file", "directory"]);
const hashes = new Set<string>();
let failed = false;
const exists = (path: string) => Bun.file(path).exists();
function fail(message: string) { console.error(`sessions index validation: ${message}`); failed = true; }

if (!(await exists(indexFile))) fail(`${indexFile} does not exist`);
else {
  const lines = (await Bun.file(indexFile).text()).split(/\r?\n/);
  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1; const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    let entry: any;
    try { entry = JSON.parse(line); } catch (error) { fail(`${indexFile}:${lineNumber} invalid JSON: ${(error as Error).message}`); continue; }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) { fail(`${indexFile}:${lineNumber} must be an object`); continue; }
    const { hash, date, path, title, kind, zipPath } = entry;
    if (typeof hash !== "string" || !hashPattern.test(hash)) { fail(`${indexFile}:${lineNumber} hash must be 12-64 lowercase hex characters`); continue; }
    if (hashes.has(hash)) fail(`${indexFile}:${lineNumber} duplicate hash: ${hash}`); hashes.add(hash);
    if (typeof date !== "string" || !datePattern.test(date)) fail(`${indexFile}:${lineNumber} date must be YYYY-MM-DDTHH-MM-SSZ`);
    if (path !== `s/${hash}/`) fail(`${indexFile}:${lineNumber} path must be s/${hash}/`);
    if (typeof title !== "string" || !title.trim()) fail(`${indexFile}:${lineNumber} missing string title`);
    if (typeof kind !== "string" || !kinds.has(kind)) fail(`${indexFile}:${lineNumber} kind must be html, file, or directory`);
    if (!(await exists(`s/${hash}/index.html`))) fail(`${indexFile}:${lineNumber} missing share entrypoint: s/${hash}/index.html`);
    if (kind === "directory" && zipPath === undefined) fail(`${indexFile}:${lineNumber} directory share missing zipPath`);
    if (kind !== "directory" && zipPath !== undefined) fail(`${indexFile}:${lineNumber} only directory shares can include zipPath`);
    if (zipPath !== undefined) {
      if (zipPath !== `s/${hash}.zip`) fail(`${indexFile}:${lineNumber} zipPath must be s/${hash}.zip`);
      if (!(await exists(`s/${hash}.zip`))) fail(`${indexFile}:${lineNumber} missing zip file: s/${hash}.zip`);
    }
  }
}
if (failed) process.exit(1);
console.log("sessions index validation: ok");
