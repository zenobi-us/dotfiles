#!/usr/bin/env -S mise exec -- bun run --install=fallback

//MISE description="Scan for credentials with trufflehog and gitleaks"

/*!
 * A share repository publishes whatever an artifact carried. A screenshot of a
 * terminal, a HAR file, a log with an Authorization header: each one reaches a
 * public URL the moment the deploy workflow finishes.
 *
 * Two scanners, because they miss different things. trufflehog matches known
 * credential shapes per provider; gitleaks matches regular expressions and
 * entropy. Both run offline by default, so the same bytes give the same answer.
 *
 * The whole repository is scanned every run, not only the newest share. A scan
 * that skips old shares reports a repository clean when it is not.
 *
 *   checks/secrets.ts                 offline, every commit
 *   checks/secrets.ts --verify        asks each provider whether the credential
 *                                     is live. Makes network calls. CI only.
 *   checks/secrets.ts --root <dir>    scan somewhere else, for `share --dry-run`
 *
 * Exit 0 means no finding. It does not mean there is no secret.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(taskDir, "..", "..", "..");

const argv = process.argv.slice(2);
const verify = argv.includes("--verify");
const rootFlag = argv.indexOf("--root");
const root = rootFlag === -1 ? repoRoot : path.resolve(argv[rootFlag + 1] ?? repoRoot);

if (!existsSync(root)) {
  console.error(`secrets check: ${root} does not exist`);
  process.exit(1);
}

// The ignore files live in the repository, never in this task, so a person can
// add a path without editing a check.
const trufflehogIgnore = path.join(repoRoot, ".trufflehogignore");
const gitleaksConfig = path.join(repoRoot, ".gitleaks.toml");

function require_(tool: string): void {
  const found = Bun.spawnSync(["sh", "-c", `command -v ${tool}`]).exitCode === 0;
  if (found) return;
  console.error(`secrets check: ${tool} is not installed.`);
  console.error(`mise.toml pins it. Run: mise install`);
  process.exit(1);
}

require_("trufflehog");
require_("gitleaks");

let failed = false;

// --fail exits 183 when it finds something. Any other non-zero status is the
// scanner itself failing, which is also not a pass.
const truffleArgs = [
  "trufflehog",
  "filesystem",
  root,
  "--fail",
  "--no-update",
  "--json",
  ...(verify ? ["--results=verified"] : ["--no-verification"]),
  ...(existsSync(trufflehogIgnore) ? ["--exclude-paths", trufflehogIgnore] : []),
];

const truffle = Bun.spawnSync(truffleArgs, { stdout: "pipe", stderr: "pipe" });
const truffleFindings = new TextDecoder()
  .decode(truffle.stdout)
  .split("\n")
  .filter((line) => line.trim().startsWith("{"));

if (truffleFindings.length > 0 || truffle.exitCode !== 0) {
  failed = true;
  console.error(`secrets check: trufflehog reported ${truffleFindings.length} finding(s)`);
  for (const line of truffleFindings) {
    try {
      const found = JSON.parse(line) as {
        DetectorName?: string;
        Verified?: boolean;
        SourceMetadata?: { Data?: { Filesystem?: { file?: string; line?: number } } };
      };
      const where = found.SourceMetadata?.Data?.Filesystem;
      const file = where?.file ? path.relative(root, where.file) : "unknown file";
      const state = found.Verified ? "VERIFIED LIVE" : "unverified";
      console.error(`  ${found.DetectorName ?? "unknown"} (${state}) in ${file}:${where?.line ?? "?"}`);
    } catch {
      console.error(`  ${line.slice(0, 200)}`);
    }
  }
  if (truffleFindings.length === 0) {
    console.error(new TextDecoder().decode(truffle.stderr).trim());
  }
}

const gitleaksArgs = [
  "gitleaks",
  "dir",
  root,
  "--no-banner",
  "--redact",
  "--report-format",
  "json",
  "--report-path",
  "-",
  ...(existsSync(gitleaksConfig) ? ["--config", gitleaksConfig] : []),
];

const gitleaks = Bun.spawnSync(gitleaksArgs, { stdout: "pipe", stderr: "pipe" });

if (gitleaks.exitCode !== 0) {
  failed = true;
  const report = new TextDecoder().decode(gitleaks.stdout).trim();
  let findings: { RuleID?: string; File?: string; StartLine?: number }[] = [];
  try {
    findings = JSON.parse(report || "[]") as typeof findings;
  } catch {
    findings = [];
  }
  console.error(`secrets check: gitleaks reported ${findings.length} finding(s)`);
  for (const found of findings) {
    const file = found.File ? path.relative(root, path.resolve(found.File)) : "unknown file";
    console.error(`  ${found.RuleID ?? "unknown"} in ${file}:${found.StartLine ?? "?"}`);
  }
  if (findings.length === 0) console.error(new TextDecoder().decode(gitleaks.stderr).trim());
}

if (failed) {
  console.error("");
  console.error("Nothing is committed. Fix the artifact at its source, then share it again.");
  console.error("A fixed artifact has different bytes, so it gets a new hash and a new page.");
  console.error("If this already reached GitHub, rotate the credential, then read:");
  console.error("  artifact-shares redact <hash> --into <name>");
  process.exit(1);
}

const where = root === repoRoot ? "." : path.relative(repoRoot, root).startsWith("..") ? root : path.relative(repoRoot, root);
console.log(`secrets check: ok (${verify ? "verified" : "offline"} scan of ${where})`);
