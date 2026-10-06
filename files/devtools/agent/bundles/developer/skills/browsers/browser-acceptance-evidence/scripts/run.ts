/**
 * Execute a compiled test and write its evidence.
 *
 * The verdict is a table, not a judgement:
 *
 *   precondition failed            -> BLOCKED  (note names the precondition)
 *   step marked `human`            -> PARTIAL  (note says what is still owed)
 *   driver exited non-zero         -> FAIL     (observed is the ASSERT FAIL message)
 *   driver exited zero, shot exists-> PASS
 *   driver exited zero, no shot    -> PARTIAL  (a PASS requires an image)
 */
import { appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Evidence, Plan, Test, Verdict } from "./plan.ts";
import { shotsFor } from "./plan.ts";

export type RunResult = { verdict: Verdict; records: Evidence[]; raw: string };

/** Open the session the run drives. Every later command picks it up by name. */
export async function openSession(session: string): Promise<void> {
  await sh(["playwright-cli", "open", "about:blank"], {
    PLAYWRIGHT_CLI_SESSION: session,
    NO_UPDATE_NOTIFIER: "1",
  });
}

async function sh(cmd: string[], env: Record<string, string> = {}) {
  const p = Bun.spawn(cmd, { env: { ...process.env, ...env }, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  return { code: await p.exited, out, err };
}

/** Check one precondition. A failure blocks every test that requires it. */
export async function checkPrecondition(
  plan: Plan,
  id: string,
  session: string,
): Promise<{ ok: boolean; detail: string }> {
  const p = plan.preconditions?.find((x) => x.id === id);
  if (!p) return { ok: false, detail: `precondition ${id} is not declared in the plan` };
  if (!p.check.locator) return { ok: true, detail: `${p.desc} (declared, not machine-checked)` };

  if (p.check.goto) {
    await sh(["playwright-cli", "goto", p.check.goto.startsWith("http") ? p.check.goto : plan.base + p.check.goto], {
      PLAYWRIGHT_CLI_SESSION: session,
      NO_UPDATE_NOTIFIER: "1",
    });
  }
  const code = `async page => { const L = page.locator(${JSON.stringify(p.check.locator)}); ` +
    `if (await L.count() === 0) return { ok: false, got: 'absent' }; ` +
    `const t = (await L.textContent() || '').trim(); ` +
    `return { ok: ${p.check.text ? `t.includes(${JSON.stringify(p.check.text)})` : "true"}, got: t }; }`;
  const r = await sh(["playwright-cli", "--raw", "run-code", code], {
    PLAYWRIGHT_CLI_SESSION: session,
    NO_UPDATE_NOTIFIER: "1",
  });
  try {
    const v = JSON.parse(r.out.trim());
    return { ok: Boolean(v.ok), detail: `${p.desc} — found ${JSON.stringify(v.got)}` };
  } catch {
    return { ok: false, detail: `${p.desc} — check did not return a value` };
  }
}

export async function runPlaywright(
  plan: Plan,
  t: Test,
  scriptPath: string,
  reportDir: string,
  session: string,
  blocked?: string,
): Promise<RunResult> {
  if (blocked) {
    return {
      verdict: "BLOCKED",
      raw: "",
      records: [blockedRecord(t, blocked)],
    };
  }

  const r = await sh(["playwright-cli", "--raw", "run-code", `--filename=${scriptPath}`], {
    PLAYWRIGHT_CLI_SESSION: session,
    NO_UPDATE_NOTIFIER: "1",
  });

  let records: Evidence[] = [];
  try {
    records = JSON.parse(r.out.trim());
  } catch {
    // A throw prints the error instead of the array. Keep what the plan knows.
    records = [];
  }

  const message = (r.out + r.err).match(/ASSERT FAIL[^\n]*/)?.[0] ?? (r.out + r.err).trim().split("\n")[0] ?? "";

  if (r.code !== 0) {
    const failedStep = message.match(/ASSERT FAIL (\d+\.\d+)/)?.[1] ?? `${t.id}.${t.steps.length}`;
    records.push({
      test: t.id,
      step: failedStep,
      action: "assert",
      target: t.pass,
      resolved: "",
      url: "",
      screenshot: lastShot(records, reportDir) || lastPlannedShot(t, reportDir),
      observed: message || "The run failed without a message.",
      verdict: "FAIL",
      note: `FAIL line: ${t.fail}`,
    });
    return { verdict: "FAIL", records, raw: r.out + r.err };
  }

  // Human steps cap the test at PARTIAL however well the rest went.
  const human = records.find((x) => x.verdict === "PARTIAL");
  const last = records[records.length - 1];
  if (last && !human) {
    const hasShot = records.some((x) => x.screenshot && existsSync(join(reportDir, x.screenshot)));
    last.verdict = hasShot ? "PASS" : "PARTIAL";
    if (!hasShot) last.note = "No screenshot was captured, so this is not proof.";
  }
  return { verdict: (human ? "PARTIAL" : last?.verdict ?? "PARTIAL") as Verdict, records, raw: r.out };
}

function lastShot(records: Evidence[], reportDir: string): string {
  for (let i = records.length - 1; i >= 0; i--) {
    const s = records[i]!.screenshot;
    if (s && existsSync(join(reportDir, s))) return s;
  }
  return "";
}

/** On a throw the script returns nothing, so recover the shot from the plan. */
function lastPlannedShot(t: Test, reportDir: string): string {
  const shots = [...shotsFor(t).values()];
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]!;
    if (existsSync(join(reportDir, s))) return s;
  }
  return "";
}

function blockedRecord(t: Test, why: string): Evidence {
  return {
    test: t.id,
    step: `${t.id}.1`,
    action: "assert",
    target: "precondition",
    resolved: "",
    url: "",
    screenshot: "",
    observed: "The test did not run.",
    verdict: "BLOCKED",
    note: why,
  };
}

export async function writeEvidence(path: string, records: Evidence[]): Promise<void> {
  if (!records.length) return;
  await appendFile(path, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
