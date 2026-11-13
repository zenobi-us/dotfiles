// Consumer-visible regressions use installed CLIs and real browser media.
import { expect, test } from "bun:test";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
const cli = resolve(import.meta.dir, "../../collect-feedback.ts");
const direct = resolve(import.meta.dir, "../serve.ts");
const evidence = resolve(import.meta.dir, "../../../../collect-evidence/scripts/collect-evidence.ts");

test("installed workflow preserves source bytes and refuses unsafe service and store transitions", async () => {
  const root = await mkdtemp("/tmp/feedback-public-");
  const repository = join(root, "repository"); await mkdir(repository);
  const page = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("<!doctype html><h1>Original evidence</h1>", { headers: { "Content-Type": "text/html" } }) });
  const children: Bun.Subprocess[] = [];
  async function invoke(args: string[], executable = cli, format = "--json") {
    const child = Bun.spawn([executable, ...args, format, "--no-color", "--no-input"], { cwd: root, stdout: "pipe", stderr: "pipe", env: { ...process.env, NO_COLOR: "1", TERM: "dumb" } });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
    return { code: await child.exited, out, err, data: format === "--json" && out.trim() ? JSON.parse(out) : null };
  }
  async function collect(args: string[]) { const r = await invoke(args, evidence); if (r.code) throw Error(r.err + r.out); return r.data; }
  async function start(dir: string, port: number, executable = cli) {
    const child = Bun.spawn([executable, ...(executable === cli ? ["serve"] : []), dir, "--port", String(port), "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" }); children.push(child);
    const reader = child.stdout.getReader(); let text = "";
    while (!text.includes("\n")) { const next = await reader.read(); if (next.done) throw Error("Serve exited before readiness: " + text); text += new TextDecoder().decode(next.value); }
    reader.releaseLock(); const ready = JSON.parse(text.trim()); if (!ready.success) throw Error(text);
    return child;
  }
  try {
    for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", "https://example.invalid/owned/feedback-test.git"]]) {
      const child = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" }); expect(await child.exited).toBe(0);
    }
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    const work = join(root, "working");
    const initial = await collect(["init", work, "--repository", repository, "--workflow", "public", "--run", "source", "--driver", "playwright"]);
    await writeFile(join(work, "plan.ts"), `export const plan = ${JSON.stringify({ schema: "collect-evidence/v1", kind: "plan", workId: "public", driver: "playwright", base: page.url.origin, approval: { origins: [page.url.origin], confirmations: [] }, tests: [{ id: "original", claim: "Inspect original pixels", pass: "Heading is present", fail: "Heading is absent", steps: [{ do: "navigate", says: "Open owned page", to: "/", shot: "" }, { do: "expect", says: "Read heading", locator: "h1", text: "Original evidence", shot: "original" }] }] })};`);
    await collect(["render", work]); await collect(["compile", work]); await collect(["run", work]);
    const source = initial.destination.path;
    const options = ["--repository", repository, "--workflow", "public", "--session", "review"];
    const before = await readdir(join(repository, "workflows/public/artifacts/evidence"));
    const unsupported = join(root, "unsupported");
    await mkdir(unsupported);
    await writeFile(join(unsupported, "run.json"), JSON.stringify({ schema: "collect-evidence/v999", kind: "run" }));
    expect((await invoke(["init", unsupported, ...options])).code).toBe(2);
    expect((await invoke(["init", join(root, "missing"), ...options])).code).toBe(2);
    expect(await readdir(join(repository, "workflows/public/artifacts/evidence"))).toEqual(before);
    expect((await invoke(["init", source, ...options, "--dry-run"])).data.dryRun).toBe(true);
    expect(await readdir(join(repository, "workflows/public/artifacts/evidence"))).toEqual(before);
    const imported = await invoke(["init", source, ...options]); expect(imported.code).toBe(0);
    const dir = imported.data.destination.path;
    expect((await invoke(["init", source, ...options])).code).toBe(1);
    const valid = await invoke(["validate", dir]); expect(valid.code).toBe(0);
    const asset = valid.data.cases[0].assets[0];
    const plainImport = await invoke(["init", source, "--repository", repository, "--workflow", "public", "--session", "plain-review"], cli, "--plain");
    expect(plainImport.code).toBe(0);
    expect(plainImport.out).toContain(`destination.path: ${join(repository, "workflows/public/artifacts/evidence/plain-review")}\n`);
    expect(plainImport.out).toContain("session.id: plain-review\n");
    const plainValidation = await invoke(["validate", dir], cli, "--plain");
    expect(plainValidation.code).toBe(0);
    expect(plainValidation.out).toContain("valid: true\n");
    expect(plainValidation.out).toContain(`cases.0.assets.0.sha256: ${asset.sha256}\n`);
    expect(() => JSON.parse(plainValidation.out)).toThrow();
    expect(valid.data).toMatchObject({ schema: "collect-feedback/v1", kind: "event", command: "validate", success: true });
    const quietValidation = await invoke(["validate", dir, "--plain", "--json"], cli, "--quiet");
    expect(quietValidation.code).toBe(0);
    expect(quietValidation.out).toBe("");
    const plainServe = await invoke(["serve", dir, "--port", "18814", "--dry-run"], cli, "--plain");
    expect(plainServe.code).toBe(0);
    expect(plainServe.out).toContain("dryRun: true\nsessionId: review\nport: 18814\n");
    const original = await readFile(join(source, asset.path));
    expect(await readFile(join(dir, asset.path))).toEqual(original);
    expect(valid.data.cases[0].source).toEqual({ runId: "source", caseId: "original" });
    const events = (await readFile(join(dir, valid.data.cases[0].events), "utf8")).trim().split("\n").map(line => JSON.parse(line));
    expect(events.at(-1)).toMatchObject({ stepId: "original.2", assertionResult: "passed", captureStatus: "captured" });
    expect(valid.data.cases[0].assets[0].capturedAt).toBe(JSON.parse(await readFile(join(source, "cases/original/case.json"), "utf8")).assets[0].capturedAt);
    expect((await invoke(["serve", dir])).code).toBe(2);
    expect((await invoke(["serve", dir, "--port", "0"])).code).toBe(2);
    expect((await invoke(["validate", dir, "--unknown-option"])).code).toBe(2);
    const copiedRun = join(dir, "source/run.json"), copiedRunText = await readFile(copiedRun, "utf8");
    await chmod(copiedRun, 0o600);
    await writeFile(copiedRun, copiedRunText.replace("collect-evidence/v1", "collect-evidence/v999"));
    expect((await invoke(["validate", dir])).code).toBe(2);
    await writeFile(copiedRun, copiedRunText); await chmod(copiedRun, 0o444);
    const occupied = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("owned") });
    try { const busy = await invoke(["serve", dir, "--port", String(occupied.port)]); expect(busy.code).not.toBe(0); expect(await Bun.file(join(dir, ".writer.lock")).exists()).toBe(false); } finally { await occupied.stop(true); }
    const reserve = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() }); const port = reserve.port!; await reserve.stop(true);
    const child = await start(dir, port); const origin = `http://127.0.0.1:${port}`;
    expect((await invoke(["serve", dir, "--port", String(port + 1)])).code).toBe(3);
    expect((await fetch(origin + "/api/v1/session")).status).toBe(200);
    expect(Buffer.from(await (await fetch(origin + "/api/v1/assets/" + asset.id)).arrayBuffer())).toEqual(original);
    const { writeToken } = await (await fetch(origin + "/api/v1/session")).json();
    const headers = { Origin: origin, "X-Write-Token": writeToken, "Content-Type": "application/json" };
    const input = { schema: "collect-feedback/v1", kind: "annotation", id: crypto.randomUUID(), sessionId: "review", caseId: "original", assetId: asset.id, sourceSha256: asset.sha256, originalWidth: asset.width, originalHeight: asset.height, geometry: { x: 0.333, y: 0.25, width: 0.667, height: 0.5 }, priority: "P2", comment: "Keep this original target visible" };
    const save = (body: unknown, overrides = {}) => fetch(origin + "/api/v1/annotations", { method: "POST", headers: { ...headers, ...overrides }, body: JSON.stringify(body) });
    expect((await save(input, { "X-Write-Token": "incorrect" })).status).toBe(403);
    expect((await save(input, { Origin: "https://attacker.invalid" })).status).toBe(403);
    expect((await save({ ...input, assetId: "unregistered" })).status).toBe(400);
    expect((await save({ ...input, geometry: { ...input.geometry, width: 2 } })).status).toBe(400);
    expect((await save({ ...input, comment: " " })).status).toBe(400);
    expect((await save({ ...input, sourceSha256: "0".repeat(64) })).status).toBe(409);
    const savedResponse = await save(input);
    expect(savedResponse.status).toBe(201);
    expect(savedResponse.headers.get("etag")).toBe(`"${input.id}:1"`);
    let saved = (await savedResponse.json()).annotation;
    expect(saved).toMatchObject({ ...input, revision: 1, pixelGeometry: { x: Math.round(asset.width * .333), y: Math.round(asset.height * .25), width: asset.width - Math.round(asset.width * .333), height: Math.round(asset.height * .75) - Math.round(asset.height * .25) } });
    expect((await (await save(input)).json()).annotation).toEqual(saved);
    expect((await save({ ...input, comment: "Different retry content" })).status).toBe(409);
    expect((await (await fetch(origin + "/api/v1/annotations")).json()).annotations).toEqual([saved]);
    const endpoint = origin + "/api/v1/annotations/" + input.id;
    const clientTwo = await (await fetch(origin + "/api/v1/session")).json();
    const update = (body: unknown, tag: string | null, method = "PATCH", token = writeToken) => fetch(endpoint, {
      method, headers: { ...headers, "X-Write-Token": token, ...(tag === null ? {} : { "If-Match": tag }) }, body: JSON.stringify(body),
    });
    const envelope = { schema: "collect-feedback/v1", kind: "annotation" };
    const tag = `"${input.id}:1"`;
    const originalSaved = saved;
    for (const method of ["PATCH", "DELETE"]) expect((await update(envelope, null, method)).status).toBe(428);
    expect((await update({ ...envelope, comment: "unauthorized" }, tag, "PATCH", "wrong")).status).toBe(403);
    expect((await update({ ...envelope, schema: "collect-feedback/v999", comment: "invalid" }, tag)).status).toBe(400);
    expect((await update({ ...envelope, assetId: "different" }, tag)).status).toBe(400);
    expect((await update({ ...envelope, geometry: { x: 1, y: 1, width: 1, height: 1 } }, tag)).status).toBe(400);
    const competing = await Promise.all([
      update({ ...envelope, comment: "First client correction", priority: "P1" }, tag),
      update({ ...envelope, comment: "Second client correction" }, tag, "PATCH", clientTwo.writeToken),
    ]);
    expect(competing.map(result => result.status).sort()).toEqual([200, 412]);
    const winner = competing.find(result => result.status === 200)!;
    saved = (await winner.json()).annotation;
    expect(saved).toEqual({ ...originalSaved, revision: 2, updatedAt: saved.updatedAt, deletedAt: null, ...(competing[0].status === 200 ? { comment: "First client correction", priority: "P1" } : { comment: "Second client correction" }) });
    expect((await update({ ...envelope, comment: "Stale overwrite" }, tag)).status).toBe(412);
    expect((await update(envelope, tag, "DELETE")).status).toBe(412);
    const deletedResponse = await update(envelope, `"${input.id}:2"`, "DELETE");
    expect(deletedResponse.status).toBe(200);
    const deleted = (await deletedResponse.json()).annotation;
    expect(deleted).toEqual({ ...saved, revision: 3, updatedAt: deleted.updatedAt, deletedAt: deleted.deletedAt });
    expect(typeof deleted.deletedAt).toBe("string");
    expect((await update({ ...envelope, deletedAt: null }, `"${input.id}:2"`)).status).toBe(412);
    expect((await update({ ...envelope, deletedAt: null, comment: "not an undo" }, `"${input.id}:3"`)).status).toBe(400);
    const restored = await update({ ...envelope, deletedAt: null }, `"${input.id}:3"`);
    expect(restored.status).toBe(200);
    const restoredNote = (await restored.json()).annotation;
    expect(restoredNote).toEqual({ ...saved, revision: 4, updatedAt: restoredNote.updatedAt, deletedAt: null });
    saved = restoredNote;
    const recordPath = join(dir, "cases/original/annotations", input.id + ".json");
    const storedBefore = await readFile(recordPath, "utf8");
    for (const method of ["PATCH", "DELETE"]) {
      expect((await update(envelope, `"${input.id}:4"`, method, "wrong")).status).toBe(403);
      expect((await fetch(endpoint, { method, headers: { ...headers, Origin: "https://attacker.invalid", "If-Match": `"${input.id}:4"` }, body: JSON.stringify(envelope) })).status).toBe(403);
      expect((await fetch(endpoint, { method, headers: { ...headers, "If-Match": `"${input.id}:4"` }, body: "{" })).status).toBe(400);
      expect((await update({ ...envelope, schema: "collect-feedback/v999" }, `"${input.id}:4"`, method)).status).toBe(400);
    }
    const sessionManifest = join(dir, "session.json"), sessionText = await readFile(sessionManifest, "utf8");
    await writeFile(sessionManifest, sessionText.replace("collect-feedback/v1", "collect-feedback/v999"));
    expect((await update({ ...envelope, comment: "Unsupported store" }, `"${input.id}:4"`)).status).toBe(409);
    expect((await update(envelope, `"${input.id}:4"`, "DELETE")).status).toBe(409);
    await writeFile(sessionManifest, sessionText);
    expect(await readFile(recordPath, "utf8")).toBe(storedBefore);
    const exported = await invoke(["export", dir]);
    expect(exported.code).toBe(0);
    expect(exported.data.annotations).toEqual([saved]);
    expect((await (await fetch(origin + "/api/v1/export")).json()).annotations).toEqual([saved]);
    expect((await invoke(["export", dir])).data).toEqual(exported.data);
    expect(JSON.parse(await readFile(join(dir, "cases/original/annotations", input.id + ".json"), "utf8"))).toEqual(saved);
    const browserSession = `feedback-edits-${crypto.randomUUID()}`;
    async function browser(args: string[]) {
      const child = Bun.spawn(["playwright-cli", ...args], { cwd: root, env: { ...process.env, PLAYWRIGHT_CLI_SESSION: browserSession }, stdout: "pipe", stderr: "pipe" });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      if (await child.exited !== 0 || /^### Error/m.test(out)) throw new Error(out + err);
    }
    try {
      await browser(["open", origin]);
      await browser(["--raw", "run-code", `async page => {
        await page.locator('nav[aria-label="Assets"] button').first().click();
        await page.locator('.annotation-pin').click();
        if (await page.locator('textarea').count()) throw Error('Selection created a draft');
        await page.getByRole('button', { name: 'Edit note', exact: true }).click();
        await page.locator('textarea').fill('Retry after a lost acknowledgement');
        let dropped = false;
        await page.route('**/api/v1/annotations/*', async route => {
          if (route.request().method() === 'PATCH' && !dropped) {
            dropped = true;
            await route.fetch();
            await route.abort();
          } else await route.continue();
        });
        await page.getByRole('button', { name: 'Save note', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Draft kept in memory' }).waitFor();
        if (await page.locator('textarea').inputValue() !== 'Retry after a lost acknowledgement') throw Error('Lost retry draft');
        await page.getByRole('button', { name: 'Retry save', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Saved · revision 6' }).waitFor();
        await page.unroute('**/api/v1/annotations/*');
        const second = await page.context().newPage();
        try {
          await second.goto(${JSON.stringify(origin)});
          await second.locator('nav[aria-label="Assets"] button').first().click();
          await second.locator('.annotation-pin').click();
          await second.getByRole('button', { name: 'Edit note', exact: true }).click();
          await second.locator('textarea').fill('Preserved second-client draft');
          await page.getByRole('button', { name: 'Edit note', exact: true }).click();
          await page.locator('textarea').fill('New first-client revision');
          await page.getByRole('button', { name: 'Save note', exact: true }).click();
          await page.getByRole('status').filter({ hasText: 'Saved · revision 7' }).waitFor();
          await second.getByRole('button', { name: 'Save note', exact: true }).click();
          await second.getByRole('group', { name: 'Saved version conflict' }).waitFor();
          if (await second.locator('textarea').inputValue() !== 'Preserved second-client draft') throw Error('Conflict lost draft');
          const current = await page.evaluate(async () => (await (await fetch('/api/v1/export')).json()).annotations[0]);
          if (current.revision !== 7 || current.comment !== 'New first-client revision') throw Error('Stale client overwrote saved note');
          await second.getByRole('button', { name: 'Use saved revision for next save', exact: true }).click();
          await second.getByRole('button', { name: 'Save note', exact: true }).click();
          await second.getByRole('status').filter({ hasText: 'Saved · revision 8' }).waitFor();
          const final = await second.evaluate(async () => (await (await fetch('/api/v1/export')).json()).annotations[0]);
          if (final.id !== ${JSON.stringify(input.id)} || final.comment !== 'Preserved second-client draft' || final.sourceSha256 !== ${JSON.stringify(input.sourceSha256)}) throw Error('Explicit recovery changed identity or lost draft');
        } finally {
          await second.getByRole('button', { name: 'Cancel', exact: true }).click().catch(() => {});
          await second.close();
        }
      }`]);
    } finally { await browser(["close"]); }
    saved = (await (await fetch(origin + "/api/v1/export")).json()).annotations[0];
    expect(saved).toMatchObject({ id: input.id, revision: 8, comment: "Preserved second-client draft", geometry: input.geometry, sourceSha256: input.sourceSha256 });
    for (const [path, init, status] of [
      ["/api/v1/session", { headers: { Host: "attacker.invalid" } }, 403],
      ["/api/v1/cases", { headers: { Origin: "https://attacker.invalid" } }, 403],
      ["/api/v1/session", { headers: { "Sec-Fetch-Site": "same-site" } }, 403],
      ["/api/v1/annotations", { method: "POST" }, 403],
      ["/api/v1/session", { method: "POST", body: "x".repeat(65537) }, 413],
      ["/api/v1/assets/%2fetc%2fpasswd", {}, 400],
      ["/api/v1/assets/unregistered", {}, 404],
      ["/source/run.json", {}, 404],
    ] as Array<[string, RequestInit, number]>) expect((await fetch(origin + path, init)).status).toBe(status);
    const media = join(dir, asset.path); await chmod(media, 0o600); await writeFile(media, "changed");
    expect((await fetch(origin + "/api/v1/assets/" + asset.id)).status).toBe(409);
    expect((await save({ ...input, id: crypto.randomUUID() })).status).toBe(409);
    for (const [method, body] of [["PATCH", { ...envelope, comment: "changed source" }], ["DELETE", envelope], ["PATCH", { ...envelope, deletedAt: null }]] as const) {
      expect((await update(body, `"${input.id}:${saved.revision}"`, method)).status).toBe(409);
    }
    expect((await fetch(origin + "/api/v1/export")).status).toBe(409);
    expect((await invoke(["export", dir])).code).not.toBe(0);
    expect((await invoke(["validate", dir])).code).toBe(2);
    await unlink(media); await symlink(join(source, asset.path), media);
    expect((await fetch(origin + "/api/v1/assets/" + asset.id)).status).toBe(409);
    expect((await invoke(["validate", dir])).code).toBe(2);
    await unlink(media); expect((await invoke(["validate", dir])).code).toBe(2);
    await writeFile(media, original, { mode: 0o444 });
    child.kill("SIGTERM"); expect(await child.exited).toBe(0);
    expect(await Bun.file(join(dir, ".writer.lock")).exists()).toBe(false);
    const restarted = await start(dir, port, direct);
    expect((await (await fetch(origin + "/api/v1/annotations")).json()).annotations).toEqual([saved]);
    expect((await invoke(["export", dir])).data.annotations).toEqual([saved]);
    restarted.kill("SIGINT"); expect(await restarted.exited).toBe(0);
    expect(await Bun.file(join(dir, ".writer.lock")).exists()).toBe(false);
    const annotationPath = join(dir, "cases/original/annotations", input.id + ".json");
    await writeFile(annotationPath, JSON.stringify({ ...saved, schema: "collect-feedback/v999" }));
    expect((await invoke(["validate", dir])).code).toBe(2);
    expect((await invoke(["export", dir])).code).toBe(2);
    expect((await invoke(["serve", dir, "--port", String(port)])).code).toBe(2);
    expect(await Bun.file(join(dir, ".writer.lock")).exists()).toBe(false);
    await writeFile(annotationPath, JSON.stringify(saved));
    const manifest = join(dir, "session.json"), text = await readFile(manifest, "utf8");
    await writeFile(manifest, text.replace("collect-feedback/v1", "collect-feedback/v999")); expect((await invoke(["validate", dir])).code).toBe(2);
    expect((await invoke(["serve", dir, "--port", String(port)])).code).toBe(2);
    expect(await Bun.file(join(dir, ".writer.lock")).exists()).toBe(false);
    await writeFile(manifest, text);
    const casePath = join(dir, "cases/original/case.json"), caseText = await readFile(casePath, "utf8");
    await writeFile(casePath, caseText.replace("collect-feedback/v1", "collect-feedback/v999")); expect((await invoke(["validate", dir])).code).toBe(2);
    await writeFile(casePath, caseText.replace(asset.path, "../../unrelated")); expect((await invoke(["validate", dir])).code).toBe(2);
    expect(await readFile(join(source, asset.path))).toEqual(original);
  } finally {
    for (const child of children) { if (child.exitCode === null) child.kill("SIGTERM"); await child.exited; }
    await page.stop(true);
    async function unseal(path: string) { const stat = await lstat(path); if (stat.isDirectory() && !stat.isSymbolicLink()) { await chmod(path, 0o700); for (const name of await readdir(path)) await unseal(join(path, name)); } }
    await unseal(root); await rm(root, { recursive: true, force: true });
  }
}, 300000);
