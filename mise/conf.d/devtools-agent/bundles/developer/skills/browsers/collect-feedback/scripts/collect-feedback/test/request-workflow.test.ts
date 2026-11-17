// Public request composition must not turn blocked captures into feedback sessions.
import { expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

test("installed request keeps historical identity and stops blocked fresh capture before import", async () => {
  const root = await mkdtemp("/tmp/feedback-request-");
  const repository = join(root, "repository");
  const browsers = resolve(import.meta.dir, "../../../..");
  const installed = join(root, "installed/bundles/developer/skills/browsers");
  const feedback = join(installed, "collect-feedback/scripts/collect-feedback.ts");
  const collector = join(installed, "collect-evidence/scripts/collect-evidence.ts");
  let server: Bun.Subprocess | undefined;
  async function invoke(executable: string, args: string[]) {
    const p = Bun.spawn([executable, ...args, "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    return { code, records: out.trim().split("\n").filter(Boolean).map(line => JSON.parse(line)), err };
  }
  try {
    await mkdir(repository);
    expect(await Bun.spawn(["git", "init", "--quiet", repository]).exited).toBe(0);
    expect(await Bun.spawn(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/request.git"]).exited).toBe(0);
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    await mkdir(installed, { recursive: true });
    for (const skill of ["collect-feedback", "collect-evidence"]) await cp(join(browsers, skill), join(installed, skill), { recursive: true });
    await symlink(resolve(browsers, "../../../agent-core"), join(root, "installed/bundles/agent-core"), "dir");
    const earlier = join(root, "earlier");
    await cp(join(import.meta.dir, "historical-run"), earlier, { recursive: true });
    expect(await Bun.spawn(["chmod", "-R", "a-w", earlier]).exited).toBe(0);
    const reserve = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = reserve.port!; await reserve.stop(true);
    const options = ["--repository", repository, "--workflow", "request", "--session", "earlier-review", "--port", String(port)];
    const dry = await invoke(feedback, ["request", earlier, ...options, "--historical", "--dry-run"]);
    expect(dry.code).toBe(0);
    expect(dry.records[0].historical).toBe(true);
    expect(await Bun.file(join(dry.records[0].destination.path, "session.json")).exists()).toBe(false);
    server = Bun.spawn([feedback, "request", earlier, ...options, "--historical", "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" });
    const reader = server.stdout.getReader(); let out = "";
    while (!out.includes("\n")) { const value = await reader.read(); if (value.done) throw Error("Request stopped before serving"); out += new TextDecoder().decode(value.value); }
    reader.releaseLock();
    const ready = JSON.parse(out);
    expect(ready.historical).toBe(true);
    expect(ready.url).toBe(`http://127.0.0.1:${port}`);
    const served = await (await fetch(ready.url + "/api/v1/session")).json();
    expect(served.session.source.runId).toBe("source");
    expect(served.session.historical).toBe(true);
    server.kill("SIGTERM"); expect(await server.exited).toBe(0); server = undefined;
    expect(await Bun.file(join(ready.destination.path, ".writer.lock")).exists()).toBe(false);
    const exported = await invoke(feedback, ["export", ready.destination.path]);
    expect(exported.code).toBe(0); expect(exported.records[0].session.historical).toBe(true);
    const workspace = join(root, "working");
    expect((await invoke(collector, ["init", workspace, "--repository", repository, "--workflow", "request", "--run", "blocked", "--driver", "gui"])).code).toBe(0);
    const scope = { display: ":65000", window: "root", title: "Unavailable private fixture" };
    const plan = { schema: "collect-evidence/v1", kind: "plan", workId: "request", driver: "gui", base: "gui://local", gui: scope, approval: { origins: [], gui: scope }, tests: [{ id: "case", claim: "Inspect fixture", pass: "Fixture visible", fail: "Fixture differs", steps: [{ do: "expect", says: "Inspect selected pixels.", locator: "screen", visible: true, shot: "fixture", image: { width: 10, height: 10, pixels: [{ x: 0, y: 0, rgb: [0, 0, 0] }], lines: [] } }] }] };
    await writeFile(join(workspace, "plan.ts"), `export const plan = ${JSON.stringify(plan)};`);
    for (const name of ["render", "compile"]) expect((await invoke(collector, [name, workspace])).code).toBe(0);
    const before = await readdir(repository);
    expect((await invoke(feedback, ["request", workspace, ...options, "--dry-run"])).code).toBe(0);
    expect(await readdir(repository)).toEqual(before);
    const blockedOptions = options.map(value => value === "earlier-review" ? "blocked-review" : value);
    const blocked = await invoke(feedback, ["request", workspace, ...blockedOptions]);
    expect(blocked.code).toBe(3);
    expect(blocked.records.at(-1)).toMatchObject({ success: false, code: 3 });
    expect(blocked.records[0].verdicts).toEqual([{ caseId: "case", verdict: "BLOCKED" }]);
    const run = blocked.records[0].source.path;
    expect((await invoke(collector, ["validate", run])).code).toBe(0);
    expect(await Bun.file(join(repository, "workflows/request/artifacts/evidence/blocked-review/session.json")).exists()).toBe(false);
    expect(await fetch(`http://127.0.0.1:${port}`).then(() => true, () => false)).toBe(false);
  } finally {
    if (server) { server.kill("SIGTERM"); await server.exited; }
    await Bun.spawn(["chmod", "-R", "u+w", root]).exited;
    await rm(root, { recursive: true, force: true });
  }
}, 90000);

test.skipIf(process.env.RUN_NATIVE_EVIDENCE_TESTS !== "1")("installed request rejects mixed FAIL/BLOCKED but serves assertion-only failure", async () => {
  const root = await mkdtemp("/tmp/feedback-request-mixed-");
  const repository = join(root, "repository");
  const browsers = resolve(import.meta.dir, "../../../..");
  const installed = join(root, "installed/bundles/developer/skills/browsers");
  const feedback = join(installed, "collect-feedback/scripts/collect-feedback.ts");
  const collector = join(installed, "collect-evidence/scripts/collect-evidence.ts");
  let server: Bun.Subprocess | undefined;
  async function invoke(executable: string, args: string[]) {
    const p = Bun.spawn([executable, ...args, "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    return { code, records: out.trim().split("\n").filter(Boolean).map(line => JSON.parse(line)), err };
  }
  try {
    await mkdir(repository);
    expect(await Bun.spawn(["git", "init", "--quiet", repository]).exited).toBe(0);
    expect(await Bun.spawn(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/request-mixed.git"]).exited).toBe(0);
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    await mkdir(installed, { recursive: true });
    for (const skill of ["collect-feedback", "collect-evidence"]) await cp(join(browsers, skill), join(installed, skill), { recursive: true });
    await symlink(resolve(browsers, "../../../agent-core"), join(root, "installed/bundles/agent-core"), "dir");
    const fixture = join(root, "terminal.ts");
    await writeFile(fixture, "process.stdin.setRawMode(true); process.stdout.write('\\x1b[2J\\x1b[HReady screen\\r\\nSelected item\\r\\n'); process.stdin.resume();");
    const terminal = { command: [process.execPath, fixture], cwd: root, columns: 80, rows: 24, font: "monospace:size=12", lineHeight: 20 };
    const assertion = { id: "assertion", claim: "Inspect native fixture", pass: "Expected width matches", fail: "Native width differs", steps: [{ do: "expect", says: "Check deliberately wrong native width.", locator: "screen", text: "Ready screen", shot: "native-terminal", timeoutMs: 700, image: { width: 1281, height: 720, pixels: [{ x: 10, y: 55, rgb: [36, 36, 36] }], lines: [{ text: "Ready screen", top: 11, tolerance: 2 }, { text: "Selected item", top: 31, tolerance: 2 }] } }] };
    const reserve = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = reserve.port!; await reserve.stop(true);
    for (const mixed of [true, false]) {
      const id = mixed ? "mixed" : "assertion-only";
      const workspace = join(root, id);
      expect((await invoke(collector, ["init", workspace, "--repository", repository, "--workflow", "request", "--run", id, "--driver", "tui"])).code).toBe(0);
      const plan = { schema: "collect-evidence/v1", kind: "plan", workId: "request", driver: "tui", base: "terminal://private", terminal, approval: { origins: [], terminal: { command: terminal.command, cwd: root } }, ...(mixed ? { preconditions: [{ id: "missing", desc: "Required screen is unavailable", check: { locator: "screen", text: "Unavailable required screen", timeoutMs: 500 } }] } : {}), tests: mixed ? [assertion, { ...assertion, id: "prerequisite", requires: ["missing"] }] : [assertion] };
      await writeFile(join(workspace, "plan.ts"), `export const plan = ${JSON.stringify(plan)};`);
      for (const name of ["render", "compile"]) expect((await invoke(collector, [name, workspace])).code).toBe(0);
      const args = ["request", workspace, "--repository", repository, "--workflow", "request", "--session", `${id}-review`, "--port", String(port)];
      if (mixed) {
        const stopped = await invoke(feedback, args);
        expect(stopped.code).toBe(3);
        expect(stopped.records[0]).toMatchObject({ success: false, stage: "capture-stopped", completed: false, verdicts: [{ caseId: "assertion", verdict: "FAIL" }, { caseId: "prerequisite", verdict: "BLOCKED" }] });
        expect(stopped.records.at(-1)).toMatchObject({ success: false, code: 3 });
        expect((await invoke(collector, ["validate", stopped.records[0].source.path])).code).toBe(0);
        expect(await Bun.file(join(repository, "workflows/request/artifacts/evidence/mixed-review/session.json")).exists()).toBe(false);
        expect(await fetch(`http://127.0.0.1:${port}`).then(() => true, () => false)).toBe(false);
      } else {
        server = Bun.spawn([feedback, ...args, "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" });
        const reader = server.stdout.getReader(); let out = "";
        while (!out.includes("\n")) { const value = await reader.read(); if (value.done) throw Error("Assertion-only request stopped before serving"); out += new TextDecoder().decode(value.value); }
        reader.releaseLock();
        const ready = JSON.parse(out);
        expect(ready.collection.verdicts).toEqual([{ caseId: "assertion", verdict: "FAIL" }]);
        expect((await (await fetch(ready.url + "/api/v1/session")).json()).session.source.runId).toBe("assertion-only");
        expect(await Bun.file(join(ready.destination.path, "session.json")).exists()).toBe(true);
        server.kill("SIGTERM"); expect(await server.exited).toBe(0); server = undefined;
        expect(await Bun.file(join(ready.destination.path, ".writer.lock")).exists()).toBe(false);
        expect(await fetch(ready.url).then(() => true, () => false)).toBe(false);
      }
    }
  } finally {
    if (server) { server.kill("SIGTERM"); await server.exited; }
    await Bun.spawn(["chmod", "-R", "u+w", root]).exited;
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
