// Contract regressions cover reader precedence, append preservation, and
// refusal before persistence, rather than manifest wiring or source wording.
import { expect, test } from "bun:test";
import { linkSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runCli as reportCli } from "../scripts/generate-report.ts";
import { scoreMaturity } from "../scripts/score-maturity.ts";
import { readRecord } from "../scripts/lib/contracts.ts";
import { safeUpgrade, bulkUpgrade } from "../../skill-contracts/scripts/upgrades.ts";

const skill = resolve(import.meta.dir, "..");
const owner = "file:scripts/assessment-contracts.ts";
const historical = {
  findings: { configHash: "fixture", files: { "policy.txt": { violations: [{ rule: "legalese", line: 1, detail: "Use plain words." }] } }, totals: { legalese: 1 }, skipped: ["unreadable.txt"] },
  evidence: { artefacts: { policy: { found: true, paths: ["policy.txt"], citation: "Interview A" } } },
  maturity: scoreMaturity({ dimensions: {} }),
  state: { snapshots: [{ timestamp: "2026-01-01T00:00:00Z", totals: { legalese: 3 }, overall: 0, source: "historic/report.md", notes: { author: "Fixture" } }], notes: { reviewer: "Fixture", citations: ["historic/evidence.json"] } },
};

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "plain-contracts-"));
  const paths = Object.fromEntries(Object.keys(historical).map((key) => [key, join(dir, `${key}.json`)]));
  for (const [key, value] of Object.entries(historical)) writeFileSync(paths[key], JSON.stringify(value, null, 2));
  const report = join(dir, "report.md");
  writeFileSync(report, "Prior report must survive refusal.");
  return { dir, paths, report, argv: ["bun", "generate-report-cli.ts", paths.findings, paths.evidence, paths.maturity, "--state", paths.state, "--out", report] };
}

const now = () => "2026-02-01T00:00:00Z";

test("historical findings and evidence remain byte-identical while state appends retain authored history", async () => {
  const f = fixture();
  try {
    const inputs = ["findings", "evidence", "maturity"].map((key) => readFileSync(f.paths[key]));
    const errors: string[] = [];
    expect(await reportCli(f.argv, () => { }, (text) => errors.push(text), now)).toBe(0);
    expect(errors).toEqual([]);
    const state = JSON.parse(readFileSync(f.paths.state, "utf8"));
    expect(state.schemaVersion).toBe("plain-language-audit-state/v2");
    expect(state.notes).toEqual(historical.state.notes);
    expect(state.snapshots).toEqual([...historical.state.snapshots, { timestamp: now(), totals: { legalese: 1 }, overall: 0 }]);
    for (const [index, key] of ["findings", "evidence", "maturity"].entries()) expect(readFileSync(f.paths[key])).toEqual(inputs[index]);
    const report = readFileSync(f.report, "utf8");
    expect(report).toContain("| 2026-01-01T00:00:00Z | 0 | 3 |");
    expect(report).toContain("| 2026-02-01T00:00:00Z | 0 | 1 |");
    expect(report).toContain("| policy | yes | policy.txt |");
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test("unknown and mixed identities in any consumed record leave every destination unchanged", async () => {
  for (const key of Object.keys(historical)) {
    for (const identity of [{ schemaVersion: "future-assessment/v99" }, { schema: "old/v1", schemaVersion: "plain-language-findings/v2" }, { schemaVersion: null }]) {
      const f = fixture();
      try {
        writeFileSync(f.paths[key], JSON.stringify({ ...historical[key as keyof typeof historical], ...identity }));
        const paths = [...Object.values(f.paths), f.report];
        const before = paths.map((path) => readFileSync(path));
        const errors: string[] = [];
        expect(await reportCli(f.argv, () => { }, (text) => errors.push(text), now)).toBe(1);
        expect(errors.join("\n")).toMatch(/identity|schemaVersion|contract/);
        paths.forEach((path, index) => expect(readFileSync(path)).toEqual(before[index]));
      } finally { rmSync(f.dir, { recursive: true, force: true }); }
    }
  }
});

test("invalid semantic content and ambiguous historical shapes fail before report or state writes", async () => {
  for (const [key, invalid] of [
    ["findings", { ...historical.findings, totals: { legalese: 2 } }],
    ["findings", { ...historical.findings, snapshots: [] }],
    ["evidence", { artefacts: { policy: { found: false, paths: ["invented.txt"] } } }],
    ["maturity", { ...historical.maturity, overall: 4 }],
    ["state", { snapshots: [{ timestamp: "invalid", totals: {}, overall: 0 }] }],
  ] as const) {
    const f = fixture();
    try {
      writeFileSync(f.paths[key], JSON.stringify(invalid));
      const before = [readFileSync(f.paths.state), readFileSync(f.report)];
      const errors: string[] = [];
      expect(await reportCli(f.argv, () => { }, (text) => errors.push(text), now)).toBe(1);
      expect(errors.join("\n")).toMatch(/Invalid|historical shape/);
      expect(readFileSync(f.paths.state)).toEqual(before[0]);
      expect(readFileSync(f.report)).toEqual(before[1]);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});

test("unsafe destinations do not append state or overwrite inputs", async () => {
  for (const kind of ["alias", "symlink", "hardlink", "immutable"] as const) {
    const f = fixture();
    try {
      if (kind === "alias") f.argv[f.argv.length - 1] = f.paths.findings;
      if (kind === "symlink" || kind === "hardlink") {
        const alias = join(f.dir, "alias.md");
        if (kind === "symlink") symlinkSync(f.report, alias);
        else linkSync(f.report, alias);
        f.argv[f.argv.length - 1] = alias;
      }
      if (kind === "immutable") writeFileSync(f.paths.state, JSON.stringify({ ...historical.state, immutable: true }));
      const paths = [...Object.values(f.paths), f.report];
      const before = paths.map((path) => readFileSync(path));
      const errors: string[] = [];
      expect(await reportCli(f.argv, () => { }, (text) => errors.push(text), now)).toBe(1);
      expect(errors.join("\n")).toMatch(/distinct|regular|Immutable/);
      paths.forEach((path, index) => expect(readFileSync(path)).toEqual(before[index]));
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});

test("bulk upgrade preserves selected authored content and reports immutable refusal separately", async () => {
  const f = fixture();
  try {
    const answersPath = join(f.dir, "answers.json");
    const answers = { dimensions: { governance: { "policy-documented": true } }, citations: ["policy.txt"], reviewer: { name: "Fixture" } };
    writeFileSync(answersPath, JSON.stringify(answers));
    const immutable = JSON.stringify({ ...historical.findings, immutable: true });
    writeFileSync(f.paths.findings, immutable);
    const result = await bulkUpgrade({ skill, owner }, [answersPath, f.paths.findings]);
    expect(result.status).toBe("partial");
    expect(JSON.parse(readFileSync(answersPath, "utf8"))).toEqual({ ...answers, schemaVersion: "plain-language-answers/v2" });
    expect(readFileSync(f.paths.findings, "utf8")).toBe(immutable);
    expect(result.results.map((item) => item.status)).toEqual(["completed", "failed"]);
    expect(scoreMaturity(JSON.parse(readFileSync(answersPath, "utf8"))).dimensions.governance.level).toBe(1);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test("lossy authored numbers and duplicate keys cannot be upgraded", async () => {
  const f = fixture();
  try {
    for (const raw of [
      '{"snapshots":[],"authored":9007199254740993}',
      '{"snapshots":[],"authored":-0}',
      '{"snapshots":[],"notes":"first","notes":"second"}',
    ]) {
      writeFileSync(f.paths.state, raw);
      await expect(safeUpgrade({ skill, owner, artifact: f.paths.state, operation: "upgrade" })).rejects.toThrow(/round-trip|Duplicate/);
      expect(readFileSync(f.paths.state, "utf8")).toBe(raw);
    }
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test("unknown explicit answers never enter historical scoring", () => {
  expect(() => scoreMaturity({ dimensions: {}, schemaVersion: "future/v3" } as never)).toThrow("Unsupported");
  expect(() => readRecord("answers", { dimensions: {}, schemaVersion: "plain-language-answers/v1" })).toThrow("Invalid");
});
