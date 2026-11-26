// Merge corpus findings, evidence, and maturity into the gap report, and
// append a snapshot to the audit state. State is append-only: history is
// never rewritten, so successive audits prove (or disprove) progress.

import type { AuditState, Evidence, Findings, Maturity } from "./lib/types.ts";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { authored, parseRecord, readRecord } from "./lib/contracts.ts";
import { checkDestinations } from "./lib/destinations.ts";
import { safeUpgrade } from "../../skill-contracts/scripts/upgrades.ts";
import { resolve } from "node:path";

export interface ReportInput {
  findings: Findings;
  evidence: Evidence;
  maturity: Maturity;
  state: AuditState | null;
  /** ISO 8601 timestamp for this audit, passed in so runs are reproducible. */
  now: string;
}

export function generateReport(input: ReportInput): { report: string; state: AuditState } {
  readRecord("findings", input.findings);
  readRecord("evidence", input.evidence);
  readRecord("maturity", input.maturity);
  if (input.state !== null) readRecord("state", input.state);
  if (!Number.isFinite(Date.parse(input.now))) throw new Error("Audit timestamp must be a valid date.");
  const { findings, evidence, maturity, now } = input;
  const snapshots = input.state ? structuredClone(input.state.snapshots) : [];
  snapshots.push({
    timestamp: now,
    totals: structuredClone(findings.totals),
    overall: maturity.overall,
  });
  const state: AuditState = { ...input.state, schemaVersion: "plain-language-audit-state/v2", snapshots };

  const lines: string[] = [];
  lines.push("# Plain Language Gap Analysis");
  lines.push("");
  lines.push(
    `> Provisional: this analysis is based on the public scope of ISO/CD 24495-4 (committee draft, unpublished). It is not a compliance statement and confers no certification. Audit date: ${now}.`,
  );
  lines.push("");
  lines.push("## Maturity");
  lines.push("");
  lines.push("| Dimension | Level | Blocking criteria |");
  lines.push("|-----------|-------|-------------------|");
  for (const [dimension, result] of Object.entries(maturity.dimensions)) {
    lines.push(`| ${dimension} | ${result.level} | ${result.missing.join(", ") || "-"} |`);
  }
  lines.push("");
  lines.push(`Overall maturity (weakest dimension): **${maturity.overall}**.`);
  lines.push("");
  lines.push("## Evidence");
  lines.push("");
  lines.push("| Artefact category | Found | Paths |");
  lines.push("|-------------------|-------|-------|");
  for (const [category, artefact] of Object.entries(evidence.artefacts)) {
    lines.push(
      `| ${category} | ${artefact.found ? "yes" : "no"} | ${artefact.paths.join("<br>") || "-"} |`,
    );
  }
  lines.push("");
  lines.push("## Corpus findings");
  lines.push("");
  lines.push("| Rule | Violations |");
  lines.push("|------|------------|");
  for (const [rule, count] of Object.entries(findings.totals)) {
    lines.push(`| ${rule} | ${count} |`);
  }
  lines.push("");
  lines.push(
    "Corpus metrics are proxies for the Measurement dimension only. Text quality alone never raises a maturity level.",
  );
  if (snapshots.length >= 2) {
    lines.push("");
    lines.push("## Trend");
    lines.push("");
    lines.push("| Audit date | Overall | Total violations |");
    lines.push("|------------|---------|------------------|");
    for (const snapshot of snapshots) {
      const total = Object.values(snapshot.totals).reduce((a, b) => a + b, 0);
      lines.push(`| ${snapshot.timestamp} | ${snapshot.overall} | ${total} |`);
    }
  }
  lines.push("");
  lines.push("## Limitations");
  lines.push("");
  lines.push("- The underlying standard is an unpublished committee draft; criteria may change.");
  lines.push("- Text heuristics are English-centric and approximate.");
  lines.push("- Maturity levels reflect the evidence supplied; absent evidence scores as absent.");
  lines.push("- A human reviewer must validate this report before the organisation acts on it.");
  lines.push("");

  return { report: lines.join("\n"), state };
}

export async function runCli(
  argv: string[],
  stdout: (text: string) => void,
  stderr: (text: string) => void,
  now: () => string = () => new Date().toISOString(),
): Promise<number> {
  const [findingsPath, evidencePath, maturityPath] = argv.slice(2);
  if (!findingsPath || !evidencePath || !maturityPath) {
    stderr(
      "Usage: bun generate-report-cli.ts <findings.json> <evidence.json> <maturity.json> [--state <state.json>] [--out <report.md>]",
    );
    return 2;
  }
  const stateFlag = argv.indexOf("--state");
  const outFlag = argv.indexOf("--out");
  if (stateFlag !== -1 && !argv[stateFlag + 1]) {
    stderr("generate-report: --state requires a state file");
    return 2;
  }
  if (outFlag !== -1 && !argv[outFlag + 1]) {
    stderr("generate-report: --out requires a report file");
    return 2;
  }
  try {
    const statePath = stateFlag !== -1 ? argv[stateFlag + 1] : null;
    const priorState = statePath && existsSync(statePath)
      ? readRecord("state", parseRecord(readFileSync(statePath, "utf8")))
      : null;
    const { report, state } = generateReport({
      findings: readRecord("findings", parseRecord(readFileSync(findingsPath, "utf8"))),
      evidence: readRecord("evidence", parseRecord(readFileSync(evidencePath, "utf8"))),
      maturity: readRecord("maturity", parseRecord(readFileSync(maturityPath, "utf8"))),
      state: priorState,
      now: now(),
    });
    const reportPath = outFlag !== -1 ? argv[outFlag + 1] : null;
    checkDestinations(
      [statePath, reportPath].filter((path): path is string => path !== null),
      [findingsPath, evidencePath, maturityPath],
    );
    if (statePath) {
      if (priorState) {
        const result = await safeUpgrade({
          skill: resolve(import.meta.dir, ".."),
          owner: "file:scripts/assessment-contracts.ts",
          artifact: statePath,
          operation: "append",
          request: { snapshot: state.snapshots.at(-1), expected: authored(priorState as unknown as Record<string, unknown>) },
        });
        if (result.status !== "completed") throw new Error("Audit-state append committed but cleanup failed.");
      } else {
        // An absent destination is new output, never an upgrade candidate.
        writeFileSync(statePath, JSON.stringify(state, null, 2), { flag: "wx" });
      }
    }
    if (outFlag !== -1) {
      writeFileSync(argv[outFlag + 1], report);
    } else {
      stdout(report);
    }
    return 0;
  } catch (error) {
    stderr(`generate-report: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
