// Opt-in public workflows use the installed Surf and Playwright CLIs, not mocks.
// Set COLLECT_EVIDENCE_REAL_DRIVERS=1 after separate tool/browser setup.
import { describe, test, expect } from "bun:test";
import { mkdtemp, mkdir, writeFile, readFile, readdir, chmod, rm, cp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const cli = resolve(import.meta.dir, "../../collect-evidence.ts");

describe.skipIf(process.env.COLLECT_EVIDENCE_REAL_DRIVERS !== "1")("real public browser workflows", () => {
  test("playwright: prerequisite interruption cleans owned sessions and preserves borrowed sessions", async () => {
    const root = await mkdtemp(join(tmpdir(), "ce-prerequisite-public-"));
    const repository = join(root, "repository");
    const bin = join(root, "bin");
    await mkdir(repository);
    await mkdir(bin);
    const real = Bun.which("playwright-cli");
    if (!real) throw new Error("Real Playwright is required");
    const borrowed = `ce-borrowed-${crypto.randomUUID()}`;
    const env = { ...process.env, TMPDIR: root, NO_UPDATE_NOTIFIER: "1" };
    async function native(args: string[], session?: string) {
      const p = Bun.spawn([real!, ...args], { cwd: root, env: { ...env, ...(session ? { PLAYWRIGHT_CLI_SESSION: session } : {}) }, stdout: "pipe", stderr: "pipe" });
      const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
      if (await p.exited !== 0 || /^### Error/m.test(out)) throw new Error(out + err);
      return out;
    }
    async function invoke(args: string[]) {
      const p = Bun.spawn([cli, ...args, "--json"], { cwd: root, env, stdout: "pipe", stderr: "pipe" });
      const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
      if (await p.exited !== 0) throw new Error(out + err);
      return JSON.parse(out);
    }
    // The wrapper runs the real browser command, then holds its response so the
    // signal lands after acquisition but before the caller can start cleanup.
    await writeFile(join(bin, "playwright-cli"), `#!${process.execPath}
import { appendFile, writeFile, access } from "node:fs/promises";
const args = process.argv.slice(2);
const session = process.env.PLAYWRIGHT_CLI_SESSION;
await appendFile(process.env.CE_COMMANDS, JSON.stringify({ args, session }) + "\\n");
const p = Bun.spawn([${JSON.stringify(real)}, ...args], { stdout: "inherit", stderr: "inherit", env: process.env });
const code = await p.exited;
if (args[0] === "open" && code === 0) {
  await writeFile(process.env.CE_REACHED, session);
  while (true) {
    try { await access(process.env.CE_RELEASE); break; } catch {}
    await Bun.sleep(10);
  }
}
process.exit(code);
`);
    await chmod(join(bin, "playwright-cli"), 0o755);
    let owned: string | undefined;
    let child: Bun.Subprocess | undefined;
    try {
      for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", "https://example.invalid/owned/prerequisite.git"]]) {
        const p = Bun.spawn(["git", ...args], { stdout: "ignore", stderr: "pipe" });
        if (await p.exited) throw new Error(await new Response(p.stderr).text());
      }
      await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
      await native(["open", "about:blank"], borrowed);
      for (const command of ["doctor", "run"]) for (const signal of ["SIGINT", "SIGTERM"] as const) {
        const id = `${command}-${signal}`;
        const reached = join(root, `${id}.reached`);
        const release = join(root, `${id}.release`);
        const commands = join(root, `${id}.commands`);
        const work = join(root, id);
        const initialized = await invoke(["init", work, "--repository", repository, "--workflow", "prerequisite", "--run", id]);
        await writeFile(join(work, "plan.ts"), `export const plan = ${JSON.stringify({
          schema: "collect-evidence/v1", kind: "plan", workId: "prerequisite", driver: "playwright",
          base: "http://127.0.0.1:8090", approval: { origins: ["http://127.0.0.1:8090"], confirmations: [] },
          tests: [{ id: "never", claim: "Do not start capture", pass: "No capture", fail: "Capture started", steps: [{ do: "navigate", says: "Never open the capture page", to: "/" }] }],
        })};`);
        await invoke(["compile", work]);
        const process = Bun.spawn([cli, command, ...(command === "run" ? [work] : ["--driver", "playwright"]), "--json"], {
          cwd: root, env: { ...env, PATH: `${bin}:${Bun.env.PATH}`, CE_REACHED: reached, CE_RELEASE: release, CE_COMMANDS: commands },
          stdout: "pipe", stderr: "pipe",
        });
        child = process;
        const output = new Response(process.stdout).text();
        const errors = new Response(process.stderr).text();
        // Real processes share these filesystem barriers; fake time cannot
        // advance a separately running installed CLI or browser daemon.
        const deadline = Date.now() + 30000;
        while (!(await Bun.file(reached).exists())) {
          if (child.exitCode !== null) throw new Error(`Prerequisite barrier not reached: ${await errors}`);
          if (Date.now() > deadline) throw new Error("Timed out waiting for the real prerequisite browser");
          await Bun.sleep(10);
        }
        owned = await readFile(reached, "utf8");
        const before = await native(["list"]);
        expect(before).toContain(`- ${owned}:`);
        expect(before).toContain(`- ${borrowed}:`);
        child.kill(signal);
        await writeFile(release, "");
        const code = await child.exited;
        const out = await output;
        const err = await errors;
        const after = await native(["list"]);
        const log = (await readFile(commands, "utf8")).trim().split("\n").map(line => JSON.parse(line));
        console.error(JSON.stringify({ command, signal, code, out, err, owned, before, after, commands: log }));
        expect(after).not.toContain(`- ${owned}:`);
        expect(after).toContain(`- ${borrowed}:`);
        expect(code).toBe(1);
        expect(JSON.parse(out)).toMatchObject({ kind: "error", success: false, code: 1 });
        expect(log.filter(row => row.args[0] === "open").map(row => row.session)).toEqual([owned]);
        expect(log.filter(row => row.args[0] === "close").map(row => row.session)).toEqual([owned]);
        expect(await Bun.file(join(initialized.destination.path, "run.json")).exists()).toBe(false);
        owned = undefined;
        child = undefined;
      }
    } finally {
      if (child && child.exitCode === null) child.kill("SIGKILL");
      // Only the fixture's own named sessions are eligible for recovery cleanup.
      if (owned) await native(["close"], owned);
      await native(["close"], borrowed);
      await rm(root, { recursive: true, force: true });
    }
  }, 180000);
  for (const driver of ["surf", "playwright"] as const) {
    test(`${driver}: capture, assertions, safety, sealing and read-only consumers`, async () => {
      const root = await mkdtemp(join(tmpdir(), `ce-${driver}-public-`));
      const repository = join(root, "repository");
      await mkdir(repository);
      const interruptReached = Promise.withResolvers<void>();
      let confirmations = 0;
      const server = Bun.serve({
        hostname: "127.0.0.1", port: 0, fetch(request) {
          if (new URL(request.url).pathname === "/confirmed") { confirmations++; return new Response("confirmed"); }
          if (new URL(request.url).pathname === "/confirmation") return new Response(`<!doctype html><button autofocus onclick="document.querySelector('p').textContent='Submitted';fetch('/confirmed')">Confirm operation</button><p>Not submitted</p>`, { headers: { "Content-Type": "text/html" } });
          const credential = new URL(request.url).pathname === "/credential";
          if (new URL(request.url).pathname === "/interrupt") interruptReached.resolve();
          return new Response(`<!doctype html><html lang="en"><title>Owned evidence test</title><style>body{font:24px sans-serif;margin:48px}button{font:inherit;padding:16px}#status{border:3px solid;padding:24px}</style><h1>Owned evidence test</h1>${credential ? '<label>Password<input type="password" id="secret"></label>' : ''}<button id="select" onclick="document.querySelector('#status').textContent='Project selected: Aurora'">Select project</button><p id="status">No project selected</p></html>`, { headers: { "Content-Type": "text/html" } });
        }
      });
      const origin = server.url.origin;
      async function invoke(args: string[], env: Record<string, string> = {}) {
        const p = Bun.spawn([cli, ...args, "--json", "--no-input", "--no-color"], { cwd: root, env: { ...process.env, TMPDIR: root, ...env }, stdout: "pipe", stderr: "pipe" });
        const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
        return { code: await p.exited, result: JSON.parse(out), err };
      }
      let completed = false;
      try {
        for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", "https://example.invalid/owned/evidence-public.git"]]) {
          const p = Bun.spawn(["git", ...args], { stdout: "ignore", stderr: "pipe" });
          if (await p.exited) throw new Error(await new Response(p.stderr).text());
        }
        await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n');
        const work = join(root, "working");
        const initialized = await invoke(["init", work, "--repository", repository, "--workflow", "browser-public", "--run", "controlled", "--driver", driver]);
        if (initialized.code) throw new Error(initialized.err);
        await writeFile(join(work, "plan.ts"), `export const plan = ${JSON.stringify({
          schema: "collect-evidence/v1", kind: "plan", workId: "browser-public", driver, video: driver === "surf", base: origin, approval: { origins: [origin], confirmations: ["pass.3", "approved-space.2"] }, tests: [
            {
              id: "pass", claim: "Select the named project", pass: "Aurora is selected", fail: "Aurora is not selected", steps: [
                { do: "navigate", says: "Open the owned page", to: "/" },
                { do: "expect", says: "Check the heading", locator: "h1", text: "Owned evidence test", shot: "heading" },
                { do: "click", says: "Select Select project", locator: "#select" },
                { do: "expect", says: "Check the selected project", locator: "#status", text: "Project selected: Aurora", shot: "selected-project" },
              ]
            },
            {
              id: "failure", claim: "Reject an incorrect observation", pass: "The missing text appears", fail: "The missing text is absent", steps: [
                { do: "navigate", says: "Open the owned page", to: "/" },
                { do: "expect", says: "Check for missing text", locator: "#status", text: "This text is absent", timeoutMs: 100, shot: "unselected-project" },
              ]
            },
            {
              id: "unapproved", claim: "Stop before an unapproved confirmation", pass: "The button is not clicked", fail: "The collector clicks without approval", steps: [
                { do: "navigate", says: "Open the owned page", to: "/" },
                { do: "click", says: "Attempt Select project without approval", locator: "#select" },
              ]
            },
            {
              id: "space", claim: "Stop unapproved keyboard confirmation", pass: "No operation is submitted", fail: "An operation is submitted", steps: [
                { do: "navigate", says: "Open the confirmation page", to: "/confirmation" },
                { do: "press", says: "Activate the focused confirmation", key: "Space" },
              ]
            },
            {
              id: "approved-space", claim: "Permit approved keyboard confirmation", pass: "The operation is submitted once", fail: "The operation is blocked", steps: [
                { do: "navigate", says: "Open the confirmation page", to: "/confirmation" },
                { do: "press", says: "Activate the approved confirmation", key: "Space" },
                { do: "expect", says: "Check submission", locator: "p", text: "Submitted", shot: "keyboard-submitted" },
              ]
            },
            ...["a-b", "a.b", "a_b", "a", "a.map"].map(id => ({
              id, claim: `Preserve identity ${id}`, pass: "The matching page is observed", fail: "Another case replaces the observation", steps: [
                { do: "navigate", says: "Open the case-specific page without a screenshot", to: `/?case=${id}`, shot: "" },
                { do: "expect", says: "Check the case-specific URL", url: `case=${id.replace(".", "\\.")}$`, shot: "case-identity" },
                { do: "capture", says: "Capture the case-specific heading", locator: "h1", as: "identity", shot: "identity-capture" },
              ],
            })),
            {
              id: "capture", claim: "Keep a capture separate from an assertion", pass: "A screenshot alone remains partial", fail: "The screenshot is called passing", steps: [
                { do: "navigate", says: "Capture the owned page without an assertion", to: "/", shot: "page-without-assertion" },
              ]
            },
            {
              id: "blocked", claim: "Stop at a credential prompt", pass: "No credential is entered", fail: "The collector types a credential", steps: [
                { do: "navigate", says: "Open the controlled credential page", to: "/credential" },
                { do: "fill", says: "Attempt the prohibited field", locator: "#secret", text: "must-not-be-entered" },
              ]
            },
          ]
        })};\n`);
        expect((await invoke(["render", work])).code).toBe(0);
        expect((await invoke(["compile", work])).code).toBe(0);
        const generated = await readdir(work);
        const dry = await invoke(["run", work, "--dry-run"], driver === "surf"
          ? { SURF_SOCKET: join(root, "missing.sock") }
          : { PLAYWRIGHT_MCP_EXECUTABLE_PATH: join(root, "missing-browser") });
        expect(dry.code).toBe(0);
        expect(await readdir(work)).toEqual(generated);
        const collected = await invoke(["run", work]);
        expect(collected.code).toBe(1);
        const directory = collected.result.destination.path;
        const keyboard = JSON.parse(await readFile(join(directory, "cases/approved-space/case.json"), "utf8"));
        if (keyboard.errors.length) throw new Error(JSON.stringify(keyboard.errors));
        expect(collected.result.verdicts).toEqual([{ caseId: "pass", verdict: "PASS" }, { caseId: "failure", verdict: "FAIL" }, { caseId: "unapproved", verdict: "BLOCKED" }, { caseId: "space", verdict: "BLOCKED" }, { caseId: "approved-space", verdict: "PASS" }, ...["a-b", "a.b", "a_b", "a", "a.map"].map(caseId => ({ caseId, verdict: "PASS" })), { caseId: "capture", verdict: "PARTIAL" }, { caseId: "blocked", verdict: "BLOCKED" }]);
        expect(keyboard.steps.map((s: { id: string }) => s.id)).toEqual(["approved-space.1", "approved-space.2", "approved-space.3"]);
        if (driver === "surf") {
          const identities = new Set<string>();
          for (const id of ["a-b", "a.b", "a_b", "a", "a.map"]) {
            const raw = await readFile(join(directory, `native/runs/case-${id}.log`), "utf8");
            const native = JSON.parse(raw.slice(raw.indexOf("{")));
            expect(native.status).toBe("completed");
            // Authored capture aliases can repeat across independent workflows.
            expect(native.vars.identity).toBe("Owned evidence test");
            for (const key of Object.keys(native.vars).filter(key => !["base", "shots", "identity"].includes(key))) {
              expect(identities.has(key)).toBe(false);
              identities.add(key);
            }
          }
        }
        expect(confirmations).toBe(1);
        const checked = await invoke(["validate", directory]);
        expect(checked.code).toBe(0);
        const evidenceOutput = process.env.COLLECT_EVIDENCE_ACCEPTANCE_OUTPUT;
        if (evidenceOutput) {
          await mkdir(evidenceOutput, { recursive: true });
          await cp(directory, join(evidenceOutput, driver), { recursive: true, errorOnExist: true, force: false });
        }
        const pass = JSON.parse(await readFile(join(directory, "cases/pass/case.json"), "utf8"));
        const failure = JSON.parse(await readFile(join(directory, "cases/failure/case.json"), "utf8"));
        expect(pass.steps.filter((s: { assertionResult: string }) => s.assertionResult === "passed").map((s: { id: string }) => s.id)).toEqual(["pass.2", "pass.4"]);
        expect(failure.steps.find((s: { id: string }) => s.id === "failure.2").assertionResult).toBe("failed");
        expect(failure.assets.every((a: { capturedAt: string | null }) => a.capturedAt !== null)).toBe(true);
        const before = await readFile(join(directory, "run.json"), "utf8");
        const report = await invoke(["report", directory]);
        expect(report.code).toBe(0);
        expect(report.result.verdicts).toEqual(collected.result.verdicts);
        const comment = await invoke(["comment", directory, "--url", "https://example.invalid/explicit-report", "--title", "Acceptance steps"]);
        expect(comment.code).toBe(0);
        expect(comment.result.markdown).not.toMatch(/#select|#status|#secret|must-not-be-entered|"locator"/);
        expect(await readFile(join(directory, "run.json"), "utf8")).toBe(before);
        if (driver === "surf") {
          const missingWork = join(root, "missing-working");
          expect((await invoke(["init", missingWork, "--repository", repository, "--workflow", "browser-public", "--run", "missing", "--driver", driver])).code).toBe(0);
          await writeFile(join(missingWork, "plan.ts"), `export const plan = ${JSON.stringify({
            schema: "collect-evidence/v1", kind: "plan", workId: "missing-media", driver, base: origin,
            approval: { origins: [origin], confirmations: [] },
            tests: [{ id: "media", claim: "Reject lost media", pass: "Missing media is rejected", fail: "A partial run is sealed", steps: [
              { do: "navigate", says: "Open the owned evidence page", to: "/" },
              { do: "expect", says: "Check that the heading reads Owned evidence test", locator: "h1", text: "Owned evidence test", shot: "required-heading" },
            ] }],
          })};`);
          expect((await invoke(["compile", missingWork])).code).toBe(0);
          const bin = join(root, "bin");
          await mkdir(bin);
          const realSurf = Bun.which("surf");
          if (!realSurf) throw new Error("Real Surf is required");
          // Run the real CLI, then remove its successful screenshot at the filesystem boundary.
          await writeFile(join(bin, "surf"), `#!/usr/bin/env bun
import { readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
const args = process.argv.slice(2);
const p = Bun.spawn([${JSON.stringify(realSurf)}, ...args], { stdout: "pipe", stderr: "pipe", env: process.env });
const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
const code = await p.exited;
if (args[0] === "do" && code === 0) {
  const shots = args[args.indexOf("--shots") + 1];
  for (const file of await readdir(shots)) await rm(join(shots, file));
  await writeFile(${JSON.stringify(join(root, "deleted-native-output"))}, out);
}
process.stdout.write(out); process.stderr.write(err); process.exitCode = code;
`, { mode: 0o755 });
          const missing = await invoke(["run", missingWork], { PATH: `${bin}:${process.env.PATH}` });
          expect(missing.code).toBe(2);
          expect(missing.result).toMatchObject({ kind: "error", success: false });
          expect(missing.err).toContain("Incomplete capture retained at ");
          const staging = missing.err.match(/Incomplete capture retained at ([^\n]+)/)?.[1];
          if (!staging) throw new Error(missing.err);
          const raw = await readFile(join(staging, "runs/case-media.log"), "utf8");
          expect(raw).toBe(await readFile(join(root, "deleted-native-output"), "utf8"));
          expect((await readdir(staging)).includes("run.json")).toBe(false);
          expect(await readdir(join(repository, "workflows/browser-public/artifacts/evidence"))).not.toContain("missing");
        }
        const interruptedWork = join(root, "interrupted-working");
        expect((await invoke(["init", interruptedWork, "--repository", repository, "--workflow", "browser-public", "--run", "interrupted", "--driver", driver])).code).toBe(0);
        await writeFile(join(interruptedWork, "plan.ts"), `export const plan = ${JSON.stringify({
          schema: "collect-evidence/v1", kind: "plan", workId: "interrupted", driver, base: origin,
          approval: { origins: [origin], confirmations: [] },
          tests: [{
            id: "1", claim: "Interrupt owned collection", pass: "No partial run is sealed", fail: "An interrupted run is sealed", steps: [
              { do: "navigate", says: "Open the interrupt page", to: "/interrupt" },
              { do: "wait", locator: "#never", timeoutMs: 30000 },
            ]
          }],
        })};\n`);
        expect((await invoke(["compile", interruptedWork])).code).toBe(0);
        const interrupted = Bun.spawn([cli, "run", interruptedWork, "--json"], { cwd: root, env: { ...process.env, TMPDIR: root }, stdout: "pipe", stderr: "pipe" });
        const reached = await Promise.race([interruptReached.promise.then(() => true), interrupted.exited.then(() => false)]);
        if (!reached) throw new Error(await new Response(interrupted.stderr).text());
        interrupted.kill("SIGTERM");
        const interruptedOutput = await new Response(interrupted.stdout).text();
        await new Response(interrupted.stderr).text();
        expect(await interrupted.exited).toBe(1);
        expect(JSON.parse(interruptedOutput)).toMatchObject({ kind: "error", success: false, code: 1 });
        expect(await readdir(join(repository, "workflows/browser-public/artifacts/evidence"))).not.toContain("interrupted");
        const media = join(directory, pass.assets[0].path);
        const originalMedia = await readFile(media);
        await chmod(media, 0o644);
        await writeFile(media, "changed");
        const changed = await invoke(["validate", directory]);
        expect(changed.code).toBe(2);
        expect(changed.result.success).toBe(false);
        // The changed media is rejected, not silently resealed or rewritten.
        expect(await readFile(media, "utf8")).toBe("changed");
        await writeFile(media, originalMedia);
        await chmod(media, 0o444);
        expect((await invoke(["validate", directory])).code).toBe(0);
        await chmod(resolve(media, ".."), 0o755);
        await rm(media);
        await chmod(resolve(media, ".."), 0o555);
        const missing = await invoke(["validate", directory]);
        expect(missing.code).toBe(2);
        expect(missing.result.success).toBe(false);
        completed = true;
      } finally {
        server.stop(true);
        // Sealed files are read-only. Make directories writable only for owned fixture cleanup.
        async function release(path: string): Promise<void> {
          await chmod(path, 0o755);
          for (const entry of await readdir(path, { withFileTypes: true })) if (entry.isDirectory()) await release(join(path, entry.name));
        }
        if (completed) {
          await release(root);
          await rm(root, { recursive: true, force: true });
        } else {
          console.error(`Failed ${driver} public workflow diagnostics retained at ${root}`);
        }
      }
    }, 240000);
  }
});
