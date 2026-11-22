// Real recorder output crosses the public import, range, annotation and restart boundaries.
import { expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
const evidence = resolve(import.meta.dir, "../../../../collect-evidence/scripts/collect-evidence.ts");
const feedback = resolve(import.meta.dir, "../../collect-feedback.ts");

test("video notes retain timing and source binding; registered media supports seeking", async () => {
  const root = await mkdtemp("/tmp/feedback-video-public-");
  const repository = join(root, "repository");
  await mkdir(repository);
  async function command(argv: string[]) {
    const child = Bun.spawn(argv, { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
    if (await child.exited) throw Error(out + err);
    return out;
  }
  async function invoke(executable: string, args: string[]) { return JSON.parse(await command([executable, ...args, "--json"])); }
  // Local repository setup finishes before capture starts. No remote Git operation runs.
  await command(["git", "init", "--quiet", repository]);
  await command(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/video-public.git"]);
  await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
  // The external browser recorder uses the platform clock; fake timers cannot paint its transition.
  const fixture = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response('<!doctype html><style>body{background:red}</style><h1>Initial scene</h1><script>setTimeout(()=>{document.body.style.background="blue";document.querySelector("h1").id="done"},600)</script>', { headers: { "Content-Type": "text/html" } }) });
  let server: Bun.Subprocess | undefined;
  try {
    const work = join(root, "work");
    const initialized = await invoke(evidence, ["init", work, "--repository", repository, "--workflow", "video", "--run", "source"]);
    await writeFile(join(work, "plan.ts"), `export const plan = ${JSON.stringify({ schemaVersion: "collect-evidence/v2", kind: "plan", workId: "video", driver: "playwright", video: true, base: fixture.url.origin, approval: { origins: [fixture.url.origin], confirmations: [] }, tests: [{ id: "scene", claim: "Record transition", pass: "Final scene present", fail: "No transition", steps: [{ do: "navigate", says: "Open initial scene", to: "/", shot: "initial" }, { do: "expect", says: "Wait for final scene", locator: "#done", visible: true, shot: "final" }] }] })};`);
    for (const action of ["render", "compile", "run"]) await invoke(evidence, [action, work]);
    const imported = await invoke(feedback, ["init", initialized.destination.path, "--repository", repository, "--workflow", "video", "--session", "review"]);
    const directory = imported.destination.path;
    const view = await invoke(feedback, ["validate", directory]);
    const video = view.cases[0].assets.find((asset: { mediaType: string }) => asset.mediaType === "video/webm");
    const image = view.cases[0].assets.find((asset: { mediaType: string }) => asset.mediaType === "image/png");
    expect(video.durationMs).toBeGreaterThan(0);
    const bytes = await readFile(join(directory, video.path));
    const reservation = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = reservation.port!; await reservation.stop(true);
    const origin = `http://127.0.0.1:${port}`;
    async function start() {
      server = Bun.spawn([feedback, "serve", directory, "--port", String(port), "--json"], { cwd: root, stdout: "pipe", stderr: "pipe" });
      const reader = server.stdout.getReader(); let output = "";
      while (!output.includes("\n")) { const next = await reader.read(); if (next.done) throw Error(output); output += new TextDecoder().decode(next.value); }
      reader.releaseLock(); expect(JSON.parse(output.trim()).success).toBe(true);
      return (await (await fetch(origin + "/api/v1/session")).json()).writeToken;
    }
    let token = await start();
    const mediaUrl = origin + "/api/v1/assets/" + video.id;
    for (const [range, start, end] of [["bytes=0-31", 0, 31], ["bytes=32-", 32, bytes.length - 1], ["bytes=-17", bytes.length - 17, bytes.length - 1]] as const) {
      const response = await fetch(mediaUrl, { headers: { Range: range } });
      expect(response.status).toBe(206);
      expect(response.headers.get("Content-Range")).toBe(`bytes ${start}-${end}/${bytes.length}`);
      expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes.subarray(start, end + 1));
    }
    for (const range of ["bytes=-0", "bytes=4-1", `bytes=${bytes.length}-`, "bytes=0-1,4-5"]) expect((await fetch(mediaUrl, { headers: { Range: range } })).status).toBe(416);
    const input = { schemaVersion: "collect-feedback/v2", kind: "annotation", id: crypto.randomUUID(), sessionId: "review", caseId: "scene", assetId: video.id, sourceSha256: video.sha256, originalWidth: video.width, originalHeight: video.height, mediaTimeSeconds: video.durationMs / 2000, displayedWidth: 640, displayedHeight: 360, geometry: { x: .25, y: .25, width: .5, height: .5 }, comment: "Inspect paused transition ".repeat(30).trim(), priority: "P1" };
    const save = (body: unknown) => fetch(origin + "/api/v1/annotations", { method: "POST", headers: { Origin: origin, "X-Write-Token": token, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    for (const patch of [{ mediaTimeSeconds: -1 }, { mediaTimeSeconds: video.durationMs / 1000 + 1 }, { mediaTimeSeconds: null }, { displayedWidth: 0 }, { displayedHeight: null }, { assetId: image.id, sourceSha256: image.sha256, originalWidth: image.width, originalHeight: image.height }]) expect((await save({ ...input, ...patch })).status).toBe(400);
    expect((await save({ ...input, sourceSha256: "0".repeat(64) })).status).toBe(409);
    const response = await save(input); expect(response.status).toBe(201);
    let note = (await response.json()).annotation;
    const update = await fetch(origin + "/api/v1/annotations/" + input.id, { method: "PATCH", headers: { Origin: origin, "X-Write-Token": token, "Content-Type": "application/json", "If-Match": `"${input.id}:1"` }, body: JSON.stringify({ schemaVersion: input.schemaVersion, kind: input.kind, mediaTimeSeconds: 0 }) });
    expect(update.status).toBe(400); // Timing belongs to the source binding, not an editable comment field.
    const browserSession = `feedback-video-undo-${crypto.randomUUID()}`;
    async function browser(args: string[]) {
      const child = Bun.spawn(["playwright-cli", ...args], { cwd: root, env: { ...process.env, PLAYWRIGHT_CLI_SESSION: browserSession }, stdout: "pipe", stderr: "pipe" });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      if (await child.exited !== 0 || /^### Error/m.test(out) || (args.includes("run-code") && !out.includes("video-undo-complete"))) throw Error(out + err);
    }
    try {
      await browser(["open", origin]);
      await browser(["--raw", "run-code", `async page => {
        await page.locator('nav[aria-label="Assets"] button').filter({ hasText: ${JSON.stringify(video.id)} }).click();
        const saved = page.getByRole('button', { name: ${JSON.stringify(input.mediaTimeSeconds.toFixed(3) + " s · " + input.comment)}, exact: true });
        for (const viewport of [{ width: 1400, height: 1000 }, { width: 390, height: 844 }]) {
          await page.setViewportSize(viewport);
          await saved.scrollIntoViewIfNeeded();
          const bounds = await page.locator('.asset-column').evaluate(column => {
            const row = column.querySelector('[aria-label="Timestamp notes"] button');
            return { column: column.getBoundingClientRect().width, row: row.getBoundingClientRect().width, client: row.clientWidth, scroll: row.scrollWidth };
          });
          if (bounds.column > viewport.width || bounds.row > bounds.column || bounds.scroll > bounds.client + 1) throw Error('Timestamp note overflow: ' + JSON.stringify(bounds));
          await saved.focus();
          await saved.press('Enter');
          await page.getByRole('dialog', { name: 'Saved annotation', exact: true }).waitFor();
          await page.locator('.annotation-pin[aria-pressed="true"]').waitFor({ state: 'visible' });
          await page.getByRole('button', { name: 'Close annotation', exact: true }).click();
        }
        for (const playing of [false, true]) {
          await saved.click();
          await page.getByRole('dialog', { name: 'Saved annotation', exact: true }).waitFor();
          await page.getByRole('button', { name: 'Delete note', exact: true }).click();
          await page.getByRole('button', { name: 'Undo deletion', exact: true }).waitFor();
          await page.getByRole('slider', { name: 'Recording position', exact: true }).press('Home');
          await page.waitForFunction(() => { const v = document.querySelector('video'); return v && !v.seeking && v.currentTime === 0; });
          if (playing) {
            await page.getByRole('button', { name: 'Play', exact: true }).click();
            await page.waitForFunction(() => !document.querySelector('video').paused);
          }
          await page.getByRole('button', { name: 'Undo deletion', exact: true }).click();
          await page.getByRole('dialog', { name: 'Saved annotation', exact: true }).waitFor();
          const state = await page.locator('video').evaluate(v => ({ paused: v.paused, time: v.currentTime, seeking: v.seeking }));
          if (!state.paused || state.seeking || Math.abs(state.time - ${input.mediaTimeSeconds}) >= .001) throw Error('Undo selected the wrong playback moment: ' + JSON.stringify(state));
          await page.locator('.annotation-pin[aria-pressed="true"]').waitFor({ state: 'visible' });
          const exported = await page.evaluate(async () => (await (await fetch('/api/v1/export')).json()).annotations[0]);
          for (const key of ['id', 'sourceSha256', 'mediaTimeSeconds', 'displayedWidth', 'displayedHeight', 'geometry', 'originalWidth', 'originalHeight']) {
            if (JSON.stringify(exported[key]) !== JSON.stringify(${JSON.stringify(input)}[key])) throw Error('Undo changed binding: ' + key);
          }
          if (exported.deletedAt !== null) throw Error('Undo did not restore note');
          await page.getByRole('button', { name: 'Close annotation', exact: true }).click();
        }
        return 'video-undo-complete';
      }`]);
    } finally { await browser(["close"]); }
    note = (await (await fetch(origin + "/api/v1/annotations")).json()).annotations[0];
    server!.kill("SIGTERM"); expect(await server!.exited).toBe(0);
    token = await start();
    const exported = await invoke(feedback, ["export", directory]);
    expect(exported.annotations).toEqual([note]);
    expect(exported.annotations[0].pixelGeometry).toEqual({ x: Math.round(video.width * .25), y: Math.round(video.height * .25), width: Math.round(video.width * .75) - Math.round(video.width * .25), height: Math.round(video.height * .75) - Math.round(video.height * .25) });
    await chmod(join(directory, video.path), 0o600); await writeFile(join(directory, video.path), Buffer.alloc(bytes.length));
    expect((await fetch(mediaUrl, { headers: { Range: "bytes=0-31" } })).status).toBe(409);
    expect((await save({ ...input, id: crypto.randomUUID() })).status).toBe(409);
  } finally {
    if (server?.exitCode === null) { server.kill("SIGTERM"); await server.exited; }
    await fixture.stop(true);
    // Completed source evidence is read-only; restore directory access before removing this owned fixture.
    const child = Bun.spawn(["chmod", "-R", "u+w", root]); await child.exited;
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
