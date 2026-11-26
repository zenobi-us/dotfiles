import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, linkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
const source = process.cwd();
const owner = resolve(source, "mise/conf.d/devtools-agent/bundles/agent-core/skills/iso-24495-4");
const textOwner = resolve(owner, "../iso-24495-text-audit");
const router = "/home/zenobius/.omp/agent/bundles/agent-core/skills/skill-contracts/scripts/router.ts";
const root = mkdtempSync(join(tmpdir(), "scm15-implementation-0014-"));
const retained = "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/implementation-0014/commands-and-observations.json";
const commands: unknown[] = [];
const artifacts: Record<string, string> = {};
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const put = (name: string, value: unknown) => { const path = join(root, name); writeFileSync(path, JSON.stringify(value, null, 2)); return path; };
const bytes = (paths: string[]) => paths.map((path) => readFileSync(path));
function unchanged(paths: string[], before: Buffer[]) { paths.forEach((path, i) => assert.deepEqual(readFileSync(path), before[i], `changed refused path ${path}`)); }
function run(argv: string[], expected = 0, error?: RegExp) {
  argv = ["env", "BUN_OPTIONS=--install=fallback", ...argv];
  const proc = Bun.spawnSync(argv, { cwd: root, stdout: "pipe", stderr: "pipe" });
  const stdout = proc.stdout.toString(); const stderr = proc.stderr.toString();
  commands.push({ argv, cwd: root, exit_code: proc.exitCode, expected_exit: expected, stdout, stderr });
  assert.equal(proc.exitCode, expected, `${argv.join(" ")}\n${stderr}`);
  if (error) assert.match(stderr, error);
  return stdout;
}
const cli = (name: string, args: string[], expected = 0, error?: RegExp) => run([process.execPath, join(owner, "scripts", name + "-cli.ts"), ...args], expected, error);
const strip = (value: Record<string, unknown>) => { const { schemaVersion, ...rest } = value; return rest; };
try {
  for (const dir of [owner, textOwner]) {
    run([router, "validate", "--skill", dir]);
    for (const contract of Object.keys(json(join(dir, "contracts.json")).contracts)) run([router, "resolve", "--skill", dir, "--contract", contract]);
  }

  const workspace = join(root, "workspace"); const corpus = join(root, "corpus");
  mkdirSync(join(workspace, "docs"), { recursive: true }); mkdirSync(corpus);
  writeFileSync(join(workspace, "docs", "plain-language-policy.md"), "# Policy\n\nUse plain words.\n");
  const selected = join(corpus, "policy.md");
  writeFileSync(selected, "# Policy\n\nThe party shall act.\n");
  const evidence = join(root, "evidence.json"); const findings = join(root, "findings.json");
  cli("audit-evidence", [workspace, "--json", evidence]);
  cli("audit-corpus", [corpus, "--json", findings]);
  assert.equal(json(evidence).schemaVersion, "plain-language-evidence/v2");
  assert.deepEqual(json(evidence).artefacts.policy, { found: true, paths: ["docs/plain-language-policy.md"] });
  assert.equal(json(findings).schemaVersion, "plain-language-findings/v2");
  assert.deepEqual(json(findings).totals, { legalese: 1 });
  const dimensions = { governance: { "policy-documented": true }, capability: { "style-guide-available": true }, process: { "review-step-exists": true }, measurement: { "corpus-baseline-taken": true }, culture: { "leadership-aware": true } };
  const answerLegacy = put("answers-legacy.json", { organisation: "Owned fixture", dimensions, citations: ["docs/plain-language-policy.md"] });
  const answerCurrent = put("answers-current.json", { schemaVersion: "plain-language-answers/v2", ...json(answerLegacy) });
  const maturity = join(root, "maturity.json"); const maturity2 = join(root, "maturity2.json");
  const answerBytes = bytes([answerLegacy, answerCurrent]);
  cli("score-maturity", [answerLegacy, "--json", maturity]);
  cli("score-maturity", [answerCurrent, "--json", maturity2]);
  unchanged([answerLegacy, answerCurrent], answerBytes);
  assert.deepEqual(json(maturity), json(maturity2)); assert.equal(json(maturity).overall, 1);
  assert.deepEqual(Object.values(json(maturity).dimensions).map((entry: unknown) => {
    assert.ok(entry && typeof entry === "object" && "level" in entry);
    return entry.level;
  }), [1, 1, 1, 1, 1]);
  const legacyFindings = put("findings-legacy.json", { ...strip(json(findings)), reviewer: { name: "Fixture" } });
  const legacyEvidence = put("evidence-legacy.json", strip(json(evidence)));
  const legacyMaturity = put("maturity-legacy.json", strip(json(maturity)));
  for (const path of [legacyFindings, legacyEvidence, legacyMaturity]) artifacts[path.slice(path.lastIndexOf("/") + 1)] = readFileSync(path, "utf8");
  const historic = { timestamp: "2026-01-01T00:00:00Z", totals: { legalese: 3 }, overall: 0, report_ref: "history/report.md", notes: { author: "Fixture", citations: ["history/evidence.json"] } };
  const state = put("state.json", { snapshots: [historic], reviewer: { name: "Fixture", sequence: ["A", "B"] } });
  const report = join(root, "report.md"); const legacyInputs = [legacyFindings, legacyEvidence, legacyMaturity]; const beforeLegacy = bytes(legacyInputs);
  cli("generate-report", [...legacyInputs, "--state", state, "--out", report]);
  unchanged(legacyInputs, beforeLegacy);
  const state1 = json(state); assert.equal(state1.schemaVersion, "plain-language-audit-state/v2");
  assert.deepEqual(state1.snapshots[0], historic); assert.equal(state1.snapshots[1].overall, 1); assert.deepEqual(state1.snapshots[1].totals, { legalese: 1 });
  assert.deepEqual(state1.reviewer, { name: "Fixture", sequence: ["A", "B"] });
  artifacts["state-first.json"] = readFileSync(state, "utf8"); artifacts["report-first.md"] = readFileSync(report, "utf8");
  writeFileSync(selected, "# Policy\n\nUse this form.\n");
  cli("audit-corpus", [corpus, "--json", findings]); assert.deepEqual(json(findings).totals, {});
  const currentInputs = [findings, evidence, maturity]; const beforeCurrent = bytes(currentInputs);
  cli("generate-report", [...currentInputs, "--state", state, "--out", report]);
  unchanged(currentInputs, beforeCurrent);
  assert.deepEqual(json(state).snapshots.slice(0, 2), state1.snapshots);
  assert.equal(json(state).snapshots[2].overall, 1); assert.deepEqual(json(state).snapshots[2].totals, {});
  const rendered = readFileSync(report, "utf8");
  assert.match(rendered, /## Trend/); assert.match(rendered, /\| 2026-01-01T00:00:00Z \| 0 \| 3 \|/);
  assert.match(rendered, /docs\/plain-language-policy.md/); assert.match(rendered, /committee draft, unpublished/);
  assert.match(rendered, /not a compliance statement/); assert.match(rendered, /English-centric/); assert.match(rendered, /human reviewer/);
  artifacts["state-second.json"] = readFileSync(state, "utf8"); artifacts["report-second.md"] = rendered;
  writeFileSync(selected, "---\ntitle: shall\n---\n# Policy\n\nUse this form.\n");
  symlinkSync(selected, join(corpus, "skipped.txt"));
  const textFindings = join(root, "text-findings.json"); const textVisible = join(root, "text-visible.json"); const textBefore = bytes([selected]);
  run([process.execPath, join(textOwner, "scripts/audit-text-cli.ts"), corpus, "--project-dir", corpus, "--json", textFindings]);
  assert.equal(json(textFindings).schemaVersion, "plain-language-findings/v2");
  assert.deepEqual(json(textFindings).skipped, [join(corpus, "skipped.txt")]); assert.deepEqual(json(textFindings).totals, {});
  run([process.execPath, join(textOwner, "scripts/audit-text-cli.ts"), selected, "--project-dir", corpus, "--no-front-matter", "--json", textVisible]);
  unchanged([selected], textBefore); assert.equal(json(textVisible).totals.legalese, 1);
  const textBytes = bytes([textFindings]);
  cli("generate-report", [textFindings, evidence, maturity, "--out", join(root, "text-report.md")]);
  unchanged([textFindings], textBytes);
  const legacyText = put("text-legacy.json", strip(json(textFindings)));
  cli("generate-report", [legacyText, legacyEvidence, legacyMaturity, "--out", join(root, "legacy-text-report.md")]);
  for (const target of currentInputs.concat(state)) {
    const original = readFileSync(target);
    for (const identity of [{ schemaVersion: "future-format/v99" }, { schemaVersion: null }, { schema: "retained/v1" }]) {
      writeFileSync(target, JSON.stringify({ ...json(target), ...identity }));
      const paths = [...currentInputs, state, report]; const before = bytes(paths);
      cli("generate-report", [...currentInputs, "--state", state, "--out", report], 1, /contract|schemaVersion|identity/);
      unchanged(paths, before); writeFileSync(target, original);
    }
  }
  const stateOriginal = readFileSync(state);
  for (const bad of ['{"snapshots":[],"number":9007199254740993}', '{"snapshots":[],"number":-0}', '{"snapshots":[],"a":1,"a":2}', JSON.stringify({ ...strip(json(findings)), snapshots: [] })]) {
    writeFileSync(state, bad); const paths = [state, report]; const before = bytes(paths);
    cli("generate-report", [...currentInputs, "--state", state, "--out", report], 1, /round-trip|Duplicate|historical shape/); unchanged(paths, before);
  }
  writeFileSync(state, stateOriginal);
  const inputBefore = bytes([...currentInputs, state, report]);
  cli("generate-report", [...currentInputs, "--state", state, "--out", findings], 1, /distinct/);
  unchanged([...currentInputs, state, report], inputBefore);
  const reportAlias = join(root, "report-alias.md"); symlinkSync(report, reportAlias);
  cli("generate-report", [...currentInputs, "--state", state, "--out", reportAlias], 1, /regular/);
  unchanged([...currentInputs, state, report], inputBefore);
  const stateAlias = join(root, "state-hardlink.json"); linkSync(state, stateAlias);
  cli("generate-report", [...currentInputs, "--state", stateAlias, "--out", report], 1, /regular/);
  unchanged([...currentInputs, state, report], inputBefore); rmSync(stateAlias);
  const converted = put("convert-answers.json", json(answerLegacy));
  run([router, "safe-upgrade", "--skill", owner, "--owner", "file:scripts/assessment-contracts.ts", "--artifact", converted, "--operation", "upgrade"]);
  assert.deepEqual(json(converted), { ...json(answerLegacy), schemaVersion: "plain-language-answers/v2" });
  const immutable = put("immutable.json", { ...json(legacyText), immutable: true }); const immutableBytes = bytes([immutable]);
  const batch = put("batch.json", [legacyEvidence, immutable]);
  const bulk = run([router, "bulk-upgrade", "--skill", owner, "--owner", "file:scripts/assessment-contracts.ts", "--artifacts", batch], 1);
  assert.equal(JSON.parse(bulk).status, "partial"); unchanged([immutable], immutableBytes);
  assert.deepEqual(strip(json(legacyEvidence)), strip(json(evidence)));
  assert.equal(json(legacyEvidence).schemaVersion, "plain-language-evidence/v2");
  for (const [name, path] of Object.entries({ "answers-legacy.json": answerLegacy, "answers-current.json": answerCurrent, "findings.json": findings, "evidence.json": evidence, "maturity.json": maturity, "text-findings.json": textFindings, "text-visible.json": textVisible, "state-final.json": state, "report-final.md": report })) artifacts[name] = readFileSync(path, "utf8");

  // Repeat the parent nine-command business baseline through current owners.
  const baseline = "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/skill-contract-manifests-15-plain-language/artifacts/evidence/parent-legacy-baseline-0001";
  const fixture = json(join(baseline, "fixture-inputs.json"));
  const baseRoot = join(root, "baseline"); const baseWorkspace = join(baseRoot, "workspace"); const baseCorpus = join(baseRoot, "corpus");
  mkdirSync(baseCorpus, { recursive: true }); mkdirSync(baseWorkspace);
  for (const [name, content] of Object.entries(fixture.workspace_files)) { const path = join(baseWorkspace, name); mkdirSync(resolve(path, ".."), { recursive: true }); writeFileSync(path, content as string); }
  const baseText = join(baseCorpus, "sample.txt"); writeFileSync(baseText, fixture.first_text);
  const bp = Object.fromEntries(["evidence", "findings1", "findings2", "text-findings1", "text-findings2", "maturity1", "maturity2", "answers1", "answers2", "state"].map(name => [name, join(baseRoot, name + ".json")]));
  for (const name of ["answers1", "answers2"]) writeFileSync(bp[name], readFileSync(join(baseline, name + ".json")));
  cli("audit-evidence", [baseWorkspace, "--json", bp.evidence]);
  cli("audit-corpus", [baseCorpus, "--json", bp.findings1]);
  run([process.execPath, join(textOwner, "scripts/audit-text-cli.ts"), baseText, "--project-dir", baseRoot, "--json", bp["text-findings1"]]);
  cli("score-maturity", [bp.answers1, "--json", bp.maturity1]);
  cli("generate-report", [bp["text-findings1"], bp.evidence, bp.maturity1, "--state", bp.state, "--out", join(baseRoot, "report1.md")]);
  const baselineFirst = json(bp.state);
  writeFileSync(baseText, fixture.second_text);
  cli("audit-corpus", [baseCorpus, "--json", bp.findings2]);
  run([process.execPath, join(textOwner, "scripts/audit-text-cli.ts"), baseText, "--project-dir", baseRoot, "--json", bp["text-findings2"]]);
  cli("score-maturity", [bp.answers2, "--json", bp.maturity2]);
  cli("generate-report", [bp["text-findings2"], bp.evidence, bp.maturity2, "--state", bp.state, "--out", join(baseRoot, "report2.md")]);
  for (const name of ["evidence", "findings1", "findings2", "text-findings1", "text-findings2", "maturity1", "maturity2"]) { assert.deepEqual(strip(json(bp[name])), json(join(baseline, name + ".json")), "legacy business baseline " + name); artifacts["baseline-" + name + ".json"] = readFileSync(bp[name], "utf8"); }
  assert.deepEqual(json(bp.state).snapshots[0], baselineFirst.snapshots[0]);
  const normalizeSnapshot = ({ timestamp, ...meaning }: Record<string, unknown>) => meaning;
  assert.deepEqual(json(bp.state).snapshots.map(normalizeSnapshot), json(join(baseline, "state.json")).snapshots.map(normalizeSnapshot));
  const baselineReport = readFileSync(join(baseRoot, "report2.md"), "utf8");
  assert.match(baselineReport, /Overall maturity .*\*\*2\*\*/); assert.match(baselineReport, /committee draft, unpublished/); assert.match(baselineReport, /plain-language-policy.txt/); assert.match(baselineReport, /human reviewer/);
  artifacts["baseline-state.json"] = readFileSync(bp.state, "utf8"); artifacts["baseline-report.md"] = baselineReport;
  console.log(JSON.stringify({ status: "passed", commands: commands.length, fixture_only: true, retained }));
  writeFileSync(retained, JSON.stringify({ status: "passed", source, commands, artifacts, assertions: ["actual scoring and report generation", "legacy/current read-only byte equality", "two state appends retain all historical fields", "trend totals 3 -> 1 -> 0", "evidence citations and limitations retained", "text frontmatter read behavior and skipped entries retained", "unknown/mixed/ambiguous/lossy/unsafe refusal byte equality", "explicit safe and partial bulk conversion preserve authored content"], artifact_sha256: Object.fromEntries(Object.entries(artifacts).map(([name, content]) => [name, createHash("sha256").update(content).digest("hex")])) }, null, 2));
} catch (error) {
  writeFileSync(retained, JSON.stringify({ status: "failed", source, commands, artifacts, error: String(error) }, null, 2));
  throw error;
} finally { rmSync(root, { recursive: true, force: true }); }