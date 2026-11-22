// Exercise owning commands in Bun and Node; fixtures never invoke live research or judges.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, linkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("./", import.meta.url));
const configuration = readFileSync(join(directory, "contract.json"), "utf8");
for (const [runtime, extension] of [["bun", "ts"], ["node", "mjs"]]) {
  test(`${runtime}: preserve run meaning and immutable history through owning commands`, () => {
    const root = mkdtempSync(join(tmpdir(), "twg-contract-test-"));
    const command = (...args) => {
      const result = spawnSync(runtime, [join(directory, `runner.${extension}`), ...args], { encoding: "utf8", cwd: root });
      assert.equal(result.error, undefined);
      return result;
    };
    const succeeds = (...args) => { const result = command(...args); assert.equal(result.status, 0, result.stderr); return result.stdout; };
    const rejectsUnchanged = (path, ...args) => {
      const before = readFileSync(path);
      const result = command(...args);
      assert.notEqual(result.status, 0, result.stdout);
      assert.deepEqual(readFileSync(path), before);
      return result;
    };
    const save = (name, value) => { const path = join(root, name); writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value)); return path; };
    try {
      const config = save("configuration.json", configuration.replace('"twg-benchmark-configuration/v2"', "1"));
      const oldConfig = readFileSync(config, "utf8");
      succeeds("check", "configuration", config);
      assert.equal(readFileSync(config, "utf8"), oldConfig);
      // Conversion must retain number lexemes and unknown authored content, not round-trip JSON.
      const authored = oldConfig.replace('"schemaVersion": 1', '"metadata": {"large": 9007199254740993, "decimal": 0.100000000000000001, "negativeZero": -0, "prompt": "keep me"}, "schemaVersion": 1');
      writeFileSync(config, authored);
      succeeds("upgrade", config);
      assert.equal(readFileSync(config, "utf8"), authored.replace('"schemaVersion": 1', '"schemaVersion": "twg-benchmark-configuration/v2"'));
      const upgraded = readFileSync(config, "utf8");
      succeeds("upgrade", config);
      assert.equal(readFileSync(config, "utf8"), upgraded);
      const immutableConfig = save("immutable.json", { ...JSON.parse(oldConfig), immutable: true });
      rejectsUnchanged(immutableConfig, "upgrade", immutableConfig);
      for (const id of [null, 2, "twg-benchmark-configuration/v99"]) {
        const unknown = save("unknown-config.json", { ...JSON.parse(oldConfig), schemaVersion: id });
        rejectsUnchanged(unknown, "check", "configuration", unknown);
        rejectsUnchanged(unknown, "upgrade", unknown);
      }
      const prompt = "Compare stored evidence only.\nPreserve café and trailing spaces.  \n";
      const control = save("control.json", { prompt, final_response: "Control evidence", tokens: 27, wall_clock_seconds: 1.25, tool_calls: 2, twg_call_count: 0, tool_errors: 0, model: "fixture-model" });
      const treatment = save("test.json", { prompt, final_response: "Test evidence", tokens: 19, wall_clock_seconds: 0.75, tool_calls: 1, twg_call_count: 1, tool_errors: 0, model: "fixture-model" });
      const quality = save("quality.json", { classification: "twg-better", summary: "Test includes more linked evidence.", dimensions: [{ name: "Evidence", winner: "test", explanation: "More linked evidence." }], authored: { finding: "retain this finding" } });
      const out = join(root, "run");
      const runArgs = ["run", "--control-result-file", control, "--test-result-file", treatment, "--quality-file", quality, "--output-dir", out, "--no-judge"];
      const qualityBefore = readFileSync(quality);
      const payload = JSON.parse(succeeds(...runArgs));
      assert.deepEqual(readFileSync(quality), qualityBefore);
      const resultPath = join(out, "result.json");
      const result = JSON.parse(readFileSync(resultPath, "utf8"));
      assert.equal(result.schemaVersion, "twg-benchmark-result/v2");
      assert.equal(result.manifest.schemaVersion, "twg-benchmark-manifest/v2");
      assert.equal(result.quality.schemaVersion, "twg-benchmark-judgement/v2");
      assert.equal(result.prompt.text, prompt);
      assert.equal(result.control.output, "Control evidence");
      assert.equal(result.test.output, "Test evidence");
      assert.deepEqual([result.control.tokens, result.test.tokens, result.control.durationMs, result.test.durationMs], [27, 19, 1250, 750]);
      assert.equal(result.integrity.checks.testUsedTwg, true);
      assert.equal(result.integrity.valid, false); // Unobserved isolation remains a finding, not invented success.
      assert.deepEqual(result.quality.authored, { finding: "retain this finding" });
      const payloadPath = save("payload.json", payload);
      const resultBefore = readFileSync(resultPath);
      succeeds("check", "run", payloadPath);
      succeeds("check", "manifest", join(out, "manifest.json"));
      succeeds("check", "progress", join(out, "progress.jsonl"));
      succeeds("render", resultPath);
      assert.match(readFileSync(join(out, "report.html"), "utf8"), /Test evidence/u);
      assert.deepEqual(readFileSync(resultPath), resultBefore);
      rejectsUnchanged(resultPath, ...runArgs);
      rejectsUnchanged(resultPath, "render", resultPath, "--report-file", resultPath);
      rejectsUnchanged(resultPath, "upgrade", resultPath);
      const historical = structuredClone(result);
      historical.schemaVersion = 1;
      historical.manifest.schemaVersion = 1;
      delete historical.quality.schemaVersion;
      const historyPath = save("historical.json", historical);
      const historyBefore = readFileSync(historyPath);
      succeeds("render", historyPath, "--report-file", join(root, "history.html"));
      assert.deepEqual(readFileSync(historyPath), historyBefore);
      assert.match(readFileSync(join(root, "history.html"), "utf8"), /Test evidence/u);
      for (const change of [
        value => { value.schemaVersion = "twg-benchmark-result/v99"; },
        value => { delete value.schemaVersion; },
        value => { value.prompt.text = "A different task"; },
        value => { value.manifest.promptHash = "0".repeat(64); },
        value => { value.test.label = value.control.label; },
        value => { value.quality.schemaVersion = null; },
      ]) {
        const invalid = structuredClone(result); change(invalid);
        const path = save("invalid.json", invalid);
        const report = save("unchanged.html", "retained report");
        rejectsUnchanged(path, "render", path, "--report-file", report);
        assert.equal(readFileSync(report, "utf8"), "retained report");
      }
      for (const [name, makeLink] of [["symlink.html", symlinkSync], ["hardlink.html", linkSync]]) {
        const alias = join(root, name); makeLink(resultPath, alias);
        rejectsUnchanged(resultPath, "render", resultPath, "--report-file", alias);
      }
      const mutable = save("bulk-config.json", oldConfig);
      const list = save("paths.json", [mutable, historyPath]);
      const partial = command("bulk-upgrade", list);
      assert.notEqual(partial.status, 0);
      assert.equal(JSON.parse(readFileSync(mutable, "utf8")).schemaVersion, "twg-benchmark-configuration/v2");
      assert.deepEqual(readFileSync(historyPath), historyBefore);
      const historicalProgress = readFileSync(join(out, "progress.jsonl"), "utf8").trim().split("\n").map(line => { const value = JSON.parse(line); delete value.schemaVersion; return JSON.stringify(value); }).join("\n");
      const progressPath = save("historical-progress.jsonl", historicalProgress);
      succeeds("check", "progress", progressPath);
      const noDimensions = save("old-quality.json", { classification: "equivalent", summary: "Equal evidence" });
      succeeds("check", "judgement", noDimensions);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
