// Public commands review real earlier pixels without changing the archive or saved notes.
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { chmod, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const feedback = resolve(import.meta.dir, "../../collect-feedback.ts");
const evidence = resolve(import.meta.dir, "../../../../collect-evidence/scripts/collect-evidence.ts");
const reports = resolve(import.meta.dir, "../../../../../devtools/writing-reports/scripts/report-cli.ts");
const fixture = join(import.meta.dir, "historical-run");
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

async function files(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    result.push(...(entry.isDirectory() ? await files(root, path) : [path]));
  }
  return result.sort();
}
async function hashes(root: string) {
  return Promise.all((await files(root)).map(async path => [path, digest(await readFile(join(root, path)))]));
}
async function modes(root: string, sealed: boolean) {
  await chmod(root, sealed ? 0o555 : 0o755);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await modes(path, sealed);
    else await chmod(path, sealed ? 0o444 : 0o644);
  }
}

test("explicit earlier-run imports and repeated common-record reports preserve evidence and saved feedback", async () => {
  const root = await mkdtemp("/tmp/feedback-history-");
  const repository = join(root, "repository"), source = join(root, "earlier-run");
  const children: Bun.Subprocess[] = [];
  async function invoke(executable: string, args: string[]) {
    const child = Bun.spawn([executable, ...args, "--json"], { cwd: executable === reports ? "/tmp" : root, stdout: "pipe", stderr: "pipe" });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
    const code = await child.exited;
    if (!out.trim()) throw Error(`${executable}: ${err}`);
    return { code, data: JSON.parse(out), err };
  }
  try {
    await mkdir(repository);
    for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", "https://example.invalid/owned/history.git"]]) {
      expect(await Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" }).exited).toBe(0);
    }
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    await cp(fixture, source, { recursive: true }); await modes(source, true);
    const originals = await hashes(source);
    const options = ["--repository", repository, "--workflow", "history", "--session", "review", "--historical"];
    const dry = await invoke(feedback, ["init", source, ...options, "--dry-run"]);
    expect(dry.code).toBe(0); expect(dry.data.historical).toBe(true);
    expect(await Bun.file(join(dry.data.destination.path, "session.json")).exists()).toBe(false);
    const imported = await invoke(feedback, ["init", source, ...options]); expect(imported.code).toBe(0);
    const session = imported.data.destination.path;
    expect(imported.data.session.historical).toBe(true);
    const validated = await invoke(feedback, ["validate", session]); expect(validated.code).toBe(0);
    const originalCases = await Promise.all(imported.data.session.cases.map(async (c: {path: string}) => JSON.parse(await readFile(join(source, c.path), "utf8"))));
    expect(validated.data.cases.map((c: {id: string}) => c.id)).toEqual(originalCases.map(c => c.id));
    expect(validated.data.cases.map((c: {assets: unknown; steps: unknown}) => [c.assets, c.steps])).toEqual(originalCases.map(c => [c.assets, c.steps]));
    const asset = originalCases[0].assets[0];
    expect(asset.capturedAt).toBe("2026-11-13T10:47:56.683Z");
    const reserve = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = reserve.port!; await reserve.stop(true);
    const server = Bun.spawn([feedback, "serve", session, "--port", String(port), "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" }); children.push(server);
    const reader = server.stdout.getReader(); let ready = "";
    while (!ready.includes("\n")) { const part = await reader.read(); if (part.done) throw Error("Viewer stopped before readiness"); ready += new TextDecoder().decode(part.value); }
    reader.releaseLock(); expect(JSON.parse(ready).success).toBe(true);
    const origin = `http://127.0.0.1:${port}`;
    const { writeToken, session: served } = await (await fetch(origin + "/api/v1/session")).json(); expect(served.historical).toBe(true);
    const payload = { schema: "collect-feedback/v1", kind: "annotation", id: crypto.randomUUID(), sessionId: "review", caseId: asset.caseId, assetId: asset.id, sourceSha256: asset.sha256, originalWidth: asset.width, originalHeight: asset.height, geometry: { x: .1, y: .2, width: 0, height: 0 }, priority: "P2", comment: "Earlier run: preserve this original heading" };
    expect((await fetch(origin + "/api/v1/annotations", { method: "POST", headers: { Origin: origin, "X-Write-Token": writeToken, "Content-Type": "application/json" }, body: JSON.stringify(payload) })).status).toBe(201);
    server.kill("SIGTERM"); expect(await server.exited).toBe(0);
    const saved = await hashes(session);
    const exported = await invoke(feedback, ["export", session]); expect(exported.code).toBe(0);
    for (let i = 0; i < 2; i++) {
      const report = await invoke(reports, ["evidence", session, "--feedback"]); expect(report.code).toBe(0);
      expect(report.data.historical).toBe(true); expect(report.data.feedback).toEqual(exported.data);
      expect(report.data.cases).toEqual(originalCases);
      expect(report.data.html).toContain("Historical evidence");
      const common = await invoke(evidence, ["report", source, "--historical"]); expect(common.code).toBe(0);
      expect(common.data.cases).toEqual(report.data.cases); expect(common.data.verdicts).toEqual(report.data.verdicts);
      expect((await invoke(feedback, ["export", session])).data).toEqual(exported.data);
    }
    expect(await hashes(source)).toEqual(originals); expect(await hashes(session)).toEqual(saved);
    // Root bypasses mode bits; exercise EACCES only where chmod denies the read.
    if (process.getuid?.() !== 0) {
      const copied = join(root, "unreadable-records");
      await cp(session, copied, { recursive: true });
      const before = await hashes(copied);
      for (const path of ["session.json", "source/run.json", "source/plan.json", `cases/${asset.caseId}/case.json`, `cases/${asset.caseId}/annotations/${payload.id}.json`]) {
        const file = join(copied, path);
        const mode = (await stat(file)).mode & 0o7777;
        await chmod(file, 0o000);
        try {
          const failed = await invoke(reports, ["evidence", copied, "--feedback"]);
          expect(failed.code).toBe(1);
          expect(failed.data).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 1 });
          expect(failed.err.trim()).toBe(failed.data.message);
        } finally {
          await chmod(file, mode);
        }
        const restored = await invoke(reports, ["evidence", copied, "--feedback"]);
        expect(restored.code).toBe(0);
        expect(restored.data.feedback).toEqual(exported.data);
      }
      expect(await hashes(copied)).toEqual(before);
    }
    for (const path of ["session.json", "source/run.json", "source/plan.json", `cases/${asset.caseId}/case.json`]) {
      for (const corruption of ["unsupported-schema", "malformed-json", "invalid-shape"]) {
        const copied = join(root, `${path.replaceAll("/", "-")}-${corruption}`);
        await cp(session, copied, { recursive: true });
        const file = join(copied, path), mode = (await stat(file)).mode & 0o7777;
        const record = JSON.parse(await readFile(file, "utf8"));
        await chmod(file, 0o600);
        try {
          await writeFile(file, corruption === "unsupported-schema" ? JSON.stringify({ ...record, schema: "unsupported/v999" }) : corruption === "malformed-json" ? "{" : "null");
        } finally {
          await chmod(file, mode);
        }
        const before = await hashes(copied);
        const invalid = await invoke(reports, ["evidence", copied, "--feedback"]);
        expect(invalid.code).toBe(2);
        expect(invalid.data).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
        expect(invalid.err.trim()).toBe(invalid.data.message);
        expect(await hashes(copied)).toEqual(before);
      }
    }
    for (const corruption of ["unsupported-schema", "malformed-json"]) {
      const copied = join(root, corruption);
      await cp(session, copied, { recursive: true });
      const annotation = join(copied, "cases", asset.caseId, "annotations", `${payload.id}.json`);
      const record = JSON.parse(await readFile(annotation, "utf8"));
      await writeFile(annotation, corruption === "unsupported-schema" ? JSON.stringify({ ...record, schema: "collect-feedback/v999" }) : "{");
      const before = await hashes(copied);
      const invalid = await invoke(reports, ["evidence", copied, "--feedback"]);
      expect(invalid.code).toBe(2);
      expect(invalid.data).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
      expect(invalid.err.trim()).toBe(invalid.data.message);
      expect(await hashes(copied)).toEqual(before);
    }
    expect((await invoke(reports, ["evidence", session, "--feedback"])).data.feedback).toEqual(exported.data);
    expect(await hashes(source)).toEqual(originals); expect(await hashes(session)).toEqual(saved);
    expect((await invoke(reports, ["evidence", session, "--feedback", "--historical"])).code).toBe(2);

    // Remove dates only in a disposable negative-metadata fixture, never in the archived original.
    const unknown = join(root, "unknown-dates"); await cp(source, unknown, { recursive: true }); await modes(unknown, false);
    const manifest = JSON.parse(await readFile(join(unknown, "run.json"), "utf8"));
    for (const c of manifest.cases) {
      const file = join(unknown, c.path), record = JSON.parse(await readFile(file, "utf8"));
      for (const a of record.assets) a.capturedAt = null;
      await writeFile(file, JSON.stringify(record));
      const eventFile = join(unknown, record.events);
      const events = (await readFile(eventFile, "utf8")).trim().split("\n").map(line => { const event = JSON.parse(line); delete event.evidence.capturedAt; return JSON.stringify(event); });
      await writeFile(eventFile, events.join("\n") + "\n");
    }
    for (const file of manifest.files) file.sha256 = digest(await readFile(join(unknown, file.path)));
    await writeFile(join(unknown, "run.json"), JSON.stringify(manifest)); await modes(unknown, true);
    const unknownImport = await invoke(feedback, ["init", unknown, "--repository", repository, "--workflow", "history", "--session", "unknown", "--historical"]); expect(unknownImport.code).toBe(0);
    const unknownReport = await invoke(reports, ["evidence", unknownImport.data.destination.path, "--feedback"]); expect(unknownReport.code).toBe(0);
    expect(unknownReport.data.feedback.assets.map((a: {capturedAt: unknown}) => a.capturedAt)).toEqual(originalCases.flatMap(c => c.assets.map(() => null)));
    expect(unknownReport.data.html).toContain("Capture time unknown");
    expect(await hashes(source)).toEqual(originals); expect(await hashes(session)).toEqual(saved);
    const beforeInvalid = await readdir(join(repository, "workflows/history/artifacts/evidence"));
    for (const version of ["collect-evidence/v999", undefined]) {
      const invalid = join(root, version ? "unsupported" : "unversioned"); await mkdir(invalid);
      await writeFile(join(invalid, "run.json"), JSON.stringify({ schema: version, kind: "run" }));
      expect((await invoke(feedback, ["init", invalid, ...options])).code).toBe(2);
      expect((await invoke(reports, ["evidence", invalid, "--historical"])).code).toBe(2);
    }
    expect(await readdir(join(repository, "workflows/history/artifacts/evidence"))).toEqual(beforeInvalid);
  } finally {
    for (const child of children) if (child.exitCode === null) { child.kill("SIGTERM"); await child.exited; }
    await modes(root, false); await rm(root, { recursive: true, force: true });
  }
}, 120000);
