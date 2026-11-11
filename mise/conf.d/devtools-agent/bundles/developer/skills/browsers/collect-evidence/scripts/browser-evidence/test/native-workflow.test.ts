// Opt-in public regression for sparse native text and a delayed rendered frame.
// Requires the prepared Linux foot/Cage/grim toolchain; never installs tools.
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import type { Plan } from "../plan.ts";

const cli = resolve(import.meta.dir, "../../collect-evidence.ts");

test.skipIf(process.env.RUN_NATIVE_EVIDENCE_TESTS !== "1")("native sparse text survives a delayed screen transition and owned cleanup", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-native-test-"));
  const repository = join(root, "repository");
  try {
    await mkdir(repository);
    await checked(["git", "init", "--quiet", repository], root);
    await checked(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/native-test.git"], root);
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    const fixture = join(root, "fixture.ts");
    await writeFile(fixture, `process.stdin.setRawMode(true);
const screen = (title: string) => process.stdout.write("\\x1b[?25l\\x1b[2J\\x1b[H\\x1b[38;2;230;225;242m" + title + "\\r\\nSelected item\\r\\n\\x1b[48;2;201;166;255m" + " ".repeat(30) + "\\x1b[0m");
screen("Ready screen");
// The separate terminal process must paint a genuinely delayed frame.
// Fake timers in this test cannot drive foot or the compositor.
process.stdin.on("data", () => { screen("Loading screen"); setTimeout(() => screen("Details screen"), 1500); });
`);
    const directory = join(root, "working");
    await checked([cli, "init", directory, "--repository", repository, "--workflow", "native", "--run", "transition", "--driver", "tui", "--json"], root);
    const command = [process.execPath, fixture];
    const image = { width: 1280, height: 720, pixels: [{ x: 10, y: 55, rgb: [201, 166, 255] as [number, number, number] }], lines: [{ text: "Ready screen", top: 11 }, { text: "Selected item", top: 31 }] };
    const plan: Plan = {
      schema: "collect-evidence/v1", kind: "plan", workId: "native", driver: "tui", base: "terminal://private",
      terminal: { command, cwd: root, columns: 80, rows: 24, font: "monospace:size=12", lineHeight: 20 },
      approval: { origins: [], confirmations: ["transition.2"], terminal: { command, cwd: root } },
      tests: [{ id: "transition", claim: "Native delayed transition", pass: "Both frames match", fail: "A frame differs", steps: [
        { do: "expect", says: "Inspect ready.", locator: "screen", text: "Ready screen", shot: "ready", image },
        { do: "press", says: "Open details.", key: "n", screen: "Ready screen" },
        { do: "expect", says: "Inspect details.", locator: "screen", text: "Details screen", shot: "details", image: { ...image, lines: [{ text: "Details screen", top: 11 }, { text: "Selected item", top: 31 }] } },
      ] }],
    };
    await writeFile(join(directory, "plan.ts"), `export const plan = ${JSON.stringify(plan)};`);
    for (const operation of ["render", "compile", "run"]) await checked([cli, operation, directory, "--json"], root);
    const run = join(repository, "workflows/native/artifacts/evidence/transition");
    const verdicts = JSON.parse(await checked([cli, "verdicts", run, "--json"], root));
    expect(verdicts.verdicts).toEqual([{ caseId: "transition", verdict: "PASS" }]);
    await checked([cli, "validate", run, "--json"], root);
    const result = JSON.parse(await readFile(join(run, "cases/transition/case.json"), "utf8"));
    expect(result.steps.map((step: { assertionResult: string }) => step.assertionResult)).toEqual(["passed", "not-applicable", "passed"]);
    expect(result.assets.map((asset: { stepId: string }) => asset.stepId)).toEqual(["transition.1", "transition.3"]);
    expect(result.assets[0].sha256).not.toBe(result.assets[1].sha256);
    expect(result.assets[0].terminal).toEqual(result.assets[1].terminal);
    for (const asset of result.assets) {
      expect(createHash("sha256").update(await readFile(join(run, asset.path))).digest("hex")).toBe(asset.sha256);
      expect(asset.terminal.cleanup).toBe("released");
      expect(await stat(asset.terminal.runtime).then(() => true, () => false)).toBe(false);
    }
  } finally {
    // Sealed evidence is read-only. This throwaway store belongs to this test.
    await checked(["chmod", "-R", "u+w", root], root);
    await rm(root, { recursive: true, force: true });
  }
}, 60000);

const credentialPrompts = ["API token:", "Token:", "API-key:", "PIN:", "OTP:", "Enter your access token"];
const credentialScenarios = credentialPrompts.flatMap((prompt, index) =>
  (["expect", "fill", "press"] as const).map(action => ({ id: `credential-${index}-${action}`, prompt, action })));
for (const scenario of ["capture", "precondition", "unexpected", "approved", "assertion", "expect-confirmation", "precondition-confirmation", "wait-confirmation", "credential-words", ...credentialScenarios.map(scenario => scenario.id)]) {
  test.skipIf(process.env.RUN_NATIVE_EVIDENCE_TESTS !== "1")(`native public workflow preserves ${scenario} outcomes`, async () => {
    const root = await mkdtemp(join(tmpdir(), "evidence-native-regression-"));
    try {
      const repository = join(root, "repository");
      await mkdir(repository);
      await checked(["git", "init", "--quiet", repository], root);
      await checked(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/native-regression.git"], root);
      await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
      const fixture = join(root, "fixture.ts");
      const unapprovedConfirmation = scenario.endsWith("-confirmation");
      const credential = credentialScenarios.find(entry => entry.id === scenario);
      const blocked = scenario === "precondition" || scenario === "unexpected" || unapprovedConfirmation || !!credential;
      const precondition = scenario === "precondition" || scenario === "precondition-confirmation";
      const prompt = credential?.prompt ?? (scenario === "credential-words" ? "Token count 3. API-key documentation. PIN settings. OTP support." : scenario === "unexpected" || scenario === "approved" || unapprovedConfirmation ? "Delete files? [y/N]" : "");
      const input = join(root, "input");
      const identity = join(root, "identity.json");
      await writeFile(fixture, `import { writeFileSync, appendFileSync, readdirSync, readlinkSync, readFileSync } from "node:fs";
const display: { pid: number; name: string }[] = [];
for (const pid of readdirSync("/proc").filter(name => /^\\d+$/.test(name))) {
  try {
    const name = readFileSync("/proc/" + pid + "/comm", "utf8").trim();
    if (["cage", "termscope"].includes(name) && readlinkSync("/proc/" + pid + "/cwd") === process.env.XDG_RUNTIME_DIR) display.push({ pid: Number(pid), name });
  } catch {}
}
const cage = display.find(process => process.name === "cage");
if (cage) for (const pid of readFileSync("/proc/" + cage.pid + "/task/" + cage.pid + "/children", "utf8").trim().split(/\\s+/)) {
  if (readFileSync("/proc/" + pid + "/comm", "utf8").trim() === "foot") display.push({ pid: Number(pid), name: "foot" });
}
writeFileSync(${JSON.stringify(identity)}, JSON.stringify({ runtime: process.env.XDG_RUNTIME_DIR, pid: process.pid, server: process.ppid, display }));
process.stdin.setRawMode(true);
process.stdout.write("\\x1b[?25l\\x1b[2J\\x1b[HReady screen\\r\\nSelected item\\r\\n\\x1b[48;2;201;166;255m" + " ".repeat(30) + "\\x1b[0m\\r\\n${prompt}\\r\\n");
process.stdin.on("data", data => appendFileSync(${JSON.stringify(input)}, data));
`);
      const directory = join(root, "working");
      await checked([cli, "init", directory, "--repository", repository, "--workflow", "native", "--run", scenario, "--driver", "tui", "--json"], root);
      const command = [process.execPath, fixture];
      const image = { width: scenario === "assertion" ? 1 : 1280, height: 720, pixels: [{ x: 0, y: 100, rgb: [36, 36, 36] as [number, number, number] }], lines: [{ text: "Ready screen", top: 11 }, { text: "Selected item", top: 31 }] };
      const plan: Plan = {
        schema: "collect-evidence/v1", kind: "plan", workId: "native", driver: "tui", base: "terminal://private",
        terminal: { command, cwd: root, columns: 80, rows: 24, font: "monospace:size=12", lineHeight: 20 },
        approval: { origins: [], confirmations: unapprovedConfirmation ? [] : ["case.1"], terminal: { command, cwd: root } },
        ...(precondition ? { preconditions: [{ id: "ready", desc: "Required screen", check: { locator: "screen", text: scenario === "precondition" ? "Absent screen" : "Ready screen", timeoutMs: scenario === "precondition" ? 300 : 5000 } }] } : {}),
        tests: [{ id: "case", claim: "Native outcome", pass: "Expected outcome", fail: "Unexpected outcome",
          ...(precondition ? { requires: ["ready"] } : {}),
          steps: credential?.action === "fill"
            ? [{ do: "fill", says: "Try approved harmless input.", locator: "screen", screen: prompt, text: "fixture-probe" }]
            : credential?.action === "press"
              ? [{ do: "press", says: "Try approved Enter.", key: "RET", screen: prompt }]
              : scenario === "unexpected" || scenario === "approved"
            ? [{ do: "press", says: "Submit approved operation.", key: "RET", screen: scenario === "approved" ? prompt : "Ready screen" }]
            : scenario === "wait-confirmation"
              ? [{ do: "wait", says: "Wait for ready.", locator: "screen", text: "Ready screen", timeoutMs: 5000 }]
              : [{ do: "expect", says: "Inspect native screen.", locator: "screen", text: "Ready screen", shot: "ready", image }],
        }],
      };
      await writeFile(join(directory, "plan.ts"), `export const plan = ${JSON.stringify(plan)};`);
      for (const operation of ["render", "compile"]) await checked([cli, operation, directory, "--json"], root);
      const env = { ...process.env };
      if (scenario === "capture") {
        const grim = Bun.which("grim")!;
        const bin = join(root, "bin");
        await mkdir(bin);
        await writeFile(join(bin, "grim"), `#!/bin/sh\ncase "$3" in */doctor.png) exec ${JSON.stringify(grim)} "$@";; *) exit 1;; esac\n`, { mode: 0o755 });
        env.PATH = `${bin}:${env.PATH}`;
      }
      const p = Bun.spawn([cli, "run", directory, "--json"], { cwd: root, env, stdout: "pipe", stderr: "pipe" });
      const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
      expect({ code, diagnostic: code === 2 ? out + err : "" }).toEqual({ code: blocked ? 3 : scenario === "capture" || scenario === "assertion" ? 1 : 0, diagnostic: "" });
      const run = join(repository, `workflows/native/artifacts/evidence/${scenario}`);
      await checked([cli, "validate", run, "--json"], root);
      const verdicts = JSON.parse(await checked([cli, "verdicts", run, "--json"], root));
      expect(verdicts.verdicts).toEqual([{ caseId: "case", verdict: blocked ? "BLOCKED" : scenario === "approved" ? "PARTIAL" : scenario === "credential-words" ? "PASS" : "FAIL" }]);
      const result = JSON.parse(await readFile(join(run, "cases/case/case.json"), "utf8"));
      if (scenario === "capture") {
        expect(result.steps[0].assertionResult).toBe("not-run");
        expect(result.errors[0].category).toBe("capture");
        const events = (await readFile(join(run, result.events), "utf8")).trim().split("\n").map(line => JSON.parse(line));
        expect(events[0].captureStatus).toBe("failed");
      }
      if (scenario === "assertion") {
        expect(result.steps[0].assertionResult).toBe("failed");
        expect(result.errors[0].category).toBe("assertion");
        expect(result.assets[0].width).toBe(1280);
      }
      if (scenario === "unexpected" || unapprovedConfirmation || credential) expect(await stat(input).then(() => true, () => false)).toBe(false);
      if (scenario === "approved") expect(await readFile(input, "utf8")).toBe("\r");
      if (credential) expect(result.errors.some((error: { message: string }) => error.message.includes("credential prompt"))).toBe(true);
      if (precondition || unapprovedConfirmation || credential) {
        const native = join(run, "native/workflows");
        const files = await readdir(native);
        const jsonl = files.find(file => file.endsWith("-termscope.jsonl"))!;
        expect((await readFile(join(native, jsonl), "utf8")).includes('"lines"')).toBe(true);
        expect(files.filter(file => file.endsWith(".stderr")).sort().map(file => file.slice(file.lastIndexOf("-") + 1))).toEqual(["cage.stderr", "termscope.stderr"]);
        const frames = files.filter(file => /-frame-\d+\.png$/.test(file));
        for (const frame of frames) expect((await readFile(join(native, frame))).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        if (!credential) expect(frames.length).toBeGreaterThan(0);
        const owned = JSON.parse(await readFile(identity, "utf8"));
        expect(await stat(owned.runtime).then(() => true, () => false)).toBe(false);
        const tmux = Bun.spawn(["tmux", "-S", join(owned.runtime, "tmux.sock"), "has-session"], { stdout: "ignore", stderr: "ignore" });
        expect(await tmux.exited).not.toBe(0);
        expect(owned.display.map((process: { name: string }) => process.name).sort()).toEqual(["cage", "foot", "termscope"]);
        for (const pid of [owned.pid, owned.server, ...owned.display.map((process: { pid: number }) => process.pid)]) {
          expect(await readFile(`/proc/${pid}/stat`, "utf8").then(text => text.slice(text.lastIndexOf(")") + 2).startsWith("Z"), () => true)).toBe(true);
        }
      }
    } finally {
      await checked(["chmod", "-R", "u+w", root], root);
      await rm(root, { recursive: true, force: true });
    }
  }, 60000);
}

async function checked(args: string[], cwd: string): Promise<string> {
  const p = Bun.spawn(args, { cwd, env: { ...process.env, NO_COLOR: "1" }, stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  if (code !== 0) throw new Error(`Command failed (${code}): ${out || err}`);
  return out;
}
