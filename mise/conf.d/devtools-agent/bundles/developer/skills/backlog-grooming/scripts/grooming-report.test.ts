// Exercise public commands and persisted artifacts, not adapter wiring.
import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const command = join(import.meta.dir, "grooming-report.ts");
function run(...args: string[]) {
  return Bun.spawnSync([process.execPath, command, ...args], { stdout: "pipe", stderr: "pipe" });
}
function report(key: string, identity = "", verdict = "groomed", conditional = "story_points: 3") {
  return `---\n${identity}ticket: ${key}\ntitle: Preserve authored findings\nverdict: ${verdict}\n${conditional}\nauthor_note: Keep this metadata.\nproposed_actions:\n  - id: discuss\n    kind: comment\n    summary: Discuss the finding.\n    detail: Keep evidence src/model.ts:42.\n    owner_note: Preserve me.\n---\n## Next action\nThe owner must check the finding.\n## Story points\n3 because one resolver changes.\n## Clarifications required\n1. Owner: Is the flag enabled?\n## Things to be aware of\n- The rollout needs a flag.\n## Claims\n| Claim | Method | Result | Evidence |\n| --- | --- | --- | --- |\n| Flag is enabled | Code | confirmed | src/model.ts:42 |\n`;
}

test("current and historical reports compile without changing findings or action identities", () => {
  const dir = mkdtempSync(join(tmpdir(), "grooming-contract-"));
  try {
    mkdirSync(join(dir, "reports"));
    const cases = [
      ["A", "", "groomed", "story_points: 3"],
      ["B", "schemaVersion: grooming-report/v1\n", "clarify", ""],
      ["C", "schemaVersion: grooming-report/v2\n", "cancel", "comment: Obsolete."],
      ["D", "schemaVersion: grooming-report/v2\n", "action", "action: split\ncomment: Split the resolver."],
    ];
    for (const [key, identity, verdict, conditional] of cases) writeFileSync(join(dir, "reports", `${key}.md`), report(key, identity, verdict, conditional));
    const before = cases.map(([key]) => readFileSync(join(dir, "reports", `${key}.md`), "utf8"));
    expect(run("check", dir).exitCode).toBe(0);
    expect(run("render", dir).exitCode).toBe(0);
    expect(cases.map(([key]) => readFileSync(join(dir, "reports", `${key}.md`), "utf8"))).toEqual(before);
    const actions = JSON.parse(readFileSync(join(dir, "actions.json"), "utf8"));
    expect(actions.schemaVersion).toBe("grooming-actions/v2");
    expect(actions.tickets.map((ticket: { ticket: string; verdict: string; proposed_actions: Record<string, unknown>[] }) => [ticket.ticket, ticket.verdict, ticket.proposed_actions[0]])).toEqual(cases.map(([key, , verdict]) => [key, verdict, { id: "discuss", kind: "comment", summary: "Discuss the finding.", detail: "Keep evidence src/model.ts:42.", owner_note: "Preserve me." }]));
    const html = readFileSync(join(dir, "index.html"), "utf8");
    expect(html).toContain("src/model.ts:42");
    expect(html).toContain("The rollout needs a flag.");
    const current = readFileSync(join(dir, "actions.json"), "utf8");
    expect(run("check-actions", join(dir, "actions.json")).exitCode).toBe(0);
    expect(readFileSync(join(dir, "actions.json"), "utf8")).toBe(current);
    writeFileSync(join(dir, "actions.json"), JSON.stringify(actions.tickets));
    expect(run("check-actions", join(dir, "actions.json")).exitCode).toBe(0);
    writeFileSync(join(dir, "selected.json"), JSON.stringify([join(dir, "reports/A.md"), join(dir, "reports/B.md"), join(dir, "actions.json")]));
    expect(run("upgrade", join(dir, "selected.json")).exitCode).toBe(0);
    expect(readFileSync(join(dir, "reports/A.md"), "utf8")).toBe(before[0].replace("---\n", "---\nschemaVersion: grooming-report/v2\n"));
    expect(readFileSync(join(dir, "reports/B.md"), "utf8")).toBe(before[1].replace("grooming-report/v1", "grooming-report/v2"));
    expect(JSON.parse(readFileSync(join(dir, "actions.json"), "utf8"))).toEqual(actions);
    const upgraded = readFileSync(join(dir, "reports/A.md"), "utf8");
    expect(run("upgrade", join(dir, "selected.json")).exitCode).toBe(0);
    expect(readFileSync(join(dir, "reports/A.md"), "utf8")).toBe(upgraded);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60_000);

test("invalid, unsupported and unsafe inputs preserve bytes and reject compilation or conversion", () => {
  const dir = mkdtempSync(join(tmpdir(), "grooming-refusal-"));
  try {
    mkdirSync(join(dir, "reports"));
    const file = join(dir, "reports/A.md");
    for (const bad of [report("A", "schemaVersion: grooming-report/v99\n"), report("A", "schemaVersion: null\n"), report("A", "", "groomed", "story_points: 4"), report("A").replace("## Claims", "## Missing"), report("A", "", "action", "comment: Missing action.")]) {
      writeFileSync(file, bad);
      expect(run("check", dir).exitCode).not.toBe(0);
      expect(run("render", dir).exitCode).not.toBe(0);
      writeFileSync(join(dir, "selected.json"), JSON.stringify([file]));
      expect(run("upgrade", join(dir, "selected.json")).exitCode).not.toBe(0);
      expect(readFileSync(file, "utf8")).toBe(bad);
    }
    const actions = join(dir, "actions.json");
    for (const bad of ['{"schemaVersion":"grooming-actions/v99","tickets":[]}', '[{"ticket":"A","title":"A","verdict":"action","proposed_actions":[{"id":"x","kind":"comment","summary":"x","detail":"x"},{"id":"x","kind":"comment","summary":"x","detail":"x"}]}]', '[{"ticket":"A","title":"A","verdict":"action","proposed_actions":[],"unsafe":9007199254740993}]']) {
      writeFileSync(actions, bad);
      expect(run("check-actions", actions).exitCode).not.toBe(0);
      writeFileSync(join(dir, "selected.json"), JSON.stringify([actions]));
      expect(run("upgrade", join(dir, "selected.json")).exitCode).not.toBe(0);
      expect(readFileSync(actions, "utf8")).toBe(bad);
    }
    mkdirSync(join(dir, "artifacts"));
    const historical = join(dir, "artifacts/A.md");
    writeFileSync(historical, report("A"));
    writeFileSync(file, report("A"));
    writeFileSync(join(dir, "selected.json"), JSON.stringify([file, historical]));
    const partial = run("upgrade", join(dir, "selected.json"));
    expect(partial.exitCode).not.toBe(0);
    expect(JSON.parse(partial.stdout.toString()).status).toBe("partial");
    expect(readFileSync(file, "utf8")).toContain("schemaVersion: grooming-report/v2");
    expect(readFileSync(historical, "utf8")).toBe(report("A"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}, 60_000);
