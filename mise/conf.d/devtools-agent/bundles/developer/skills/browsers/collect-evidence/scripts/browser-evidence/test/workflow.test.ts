// Consumer-visible command contracts. Real browser proof runs separately against
// an owned HTTP page; these tests need no browser, credentials or network calls.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, writeFile, readFile, readdir, rm, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const cli = resolve(import.meta.dir, "../../collect-evidence.ts");
let root: string;
let repository: string;
async function command(args: string[]) {
  const p = Bun.spawn([cli, ...args], { cwd: root, stdout: "pipe", stderr: "pipe", env: { ...process.env, NO_COLOR: "1", TERM: "dumb" } });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  return { code: await p.exited, out, err };
}
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "evidence-public-test-"));
  repository = join(root, "repository");
  await mkdir(repository);
  for (const args of [["init", "--quiet", repository], ["-C", repository, "remote", "add", "origin", "https://example.invalid/owned/evidence-test.git"]]) {
    const p = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" });
    if (await p.exited !== 0) throw new Error(await new Response(p.stderr).text());
  }
  await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n');
});
afterAll(async () => { await rm(root, { recursive: true, force: true }); });

test("dry-run resolves a temporary store without creating a workspace or starting a driver", async () => {
  const dir = join(root, "working");
  const before = await readdir(root);
  const r = await command(["init", dir, "--repository", repository, "--workflow", "owned-workflow", "--run", "owned-run", "--driver", "surf", "--dry-run", "--json", "--no-input", "--no-color"]);
  if (r.code) throw new Error(r.err || r.out);
  expect(r.code).toBe(0);
  const result = JSON.parse(r.out);
  expect(result).toMatchObject({ schema: "collect-evidence/v1", kind: "event", success: true, dryRun: true, destination: { store: "repository", path: join(repository, "workflows/owned-workflow/artifacts/evidence/owned-run") } });
  expect(await readdir(root)).toEqual(before);
  expect(await readdir(repository)).toEqual([".context-routes.toml", ".git"]);
});

test("unsupported explicit schema is rejected by the public validator", async () => {
  const dir = join(root, "future");
  await mkdir(dir);
  await writeFile(join(dir, "run.json"), JSON.stringify({ schema: "collect-evidence/v999", kind: "run" }));
  const before = await readdir(dir);
  const r = await command(["validate", dir, "--json"]);
  expect(r.code).toBe(2);
  expect(JSON.parse(r.out)).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
  expect(await readdir(dir)).toEqual(before);
});

test("force cannot authorize evidence replacement", async () => {
  const r = await command(["run", root, "--force", "--json"]);
  expect(r.code).toBe(2);
  expect(JSON.parse(r.out)).toMatchObject({ kind: "error", code: 2, success: false });
});

test("unknown arguments return usage error rather than a valid-looking result", async () => {
  const r = await command(["doctor", "--not-a-real-flag", "--json"]);
  expect(r.code).toBe(2);
  expect(JSON.parse(r.out)).toMatchObject({ kind: "error", code: 2, success: false });
});

test.each([
  { id: "_case", requires: undefined, message: "ID must use" },
  { id: "case", requires: ["missing"], message: "unknown precondition" },
])("compile rejects invalid plans before browser execution: $message", async ({ id, requires, message }) => {
  const dir = join(root, `invalid-${id}`);
  expect((await command(["init", dir, "--repository", repository, "--workflow", "invalid-plan", "--run", id.replace("_", "x"), "--json"])).code).toBe(0);
  await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify({
    schema: "collect-evidence/v1", kind: "plan", workId: "invalid-plan",
    driver: "playwright", base: "http://127.0.0.1:1",
    approval: { origins: ["http://127.0.0.1:1"], confirmations: [] },
    tests: [{ id, requires, claim: "Reject an invalid plan", pass: "No browser starts", fail: "A browser starts", steps: [{ do: "navigate", to: "/" }] }],
  })};`);
  const result = await command(["compile", dir, "--json"]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.out)).toMatchObject({ kind: "error", success: false });
  expect(result.out).toContain(message);
  expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
});

test("init rejects repository descendants with a double-dot name", async () => {
  const dir = join(repository, "..captures");
  const before = (await readdir(repository)).sort();
  const result = await command(["init", dir, "--repository", repository, "--workflow", "watched", "--run", "watched", "--json"]);
  expect(result.code).toBe(2);
  expect(result.out).toContain("outside the watched repository");
  expect((await readdir(repository)).sort()).toEqual(before);
});

test.each(["", "../invalid", "bad slug"])("compile preserves empty screenshot slugs and rejects invalid non-empty slugs: %j", async (shot) => {
  const dir = join(root, `slug-${shot === "" ? "empty" : shot === "../invalid" ? "path" : "space"}`);
  expect((await command(["init", dir, "--repository", repository, "--workflow", "slug-plan", "--run", "slug", "--json"])).code).toBe(0);
  await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify({
    schema: "collect-evidence/v1", kind: "plan",
    workId: "slug-plan", driver: "surf", base: "http://127.0.0.1:1",
    approval: { origins: ["http://127.0.0.1:1"], confirmations: [] },
    tests: [{ id: "empty", claim: "Preserve screenshot intent", pass: "No implicit capture", fail: "An implicit capture occurs", steps: [{ do: "navigate", says: "Open without a screenshot", to: "/", shot }] }],
  })};`);
  const result = await command(["compile", dir, "--json"]);
  if (result.code !== (shot === "" ? 0 : 2)) throw new Error(JSON.stringify(result));
  expect(result.code).toBe(shot === "" ? 0 : 2);
  if (shot === "") {
    expect((await command(["render", dir, "--json"])).code).toBe(0);
    const rendered = JSON.parse(await readFile(join(dir, "plan.json"), "utf8"));
    expect(rendered.data.tests[0].steps[0].shot).toBe("");
  } else {
    expect(result.out).toContain("Invalid screenshot slug");
  }
});

test.each([
  { do: "capture", says: "Read the visible heading" },
  { do: "capture", says: "Read the visible heading", locator: "h1" },
  { do: "capture", says: "Read the visible heading", locator: 42, as: "heading" },
  { do: "capture", says: "Read the visible heading", locator: "h1", as: null },
  { do: "navigate", says: "Open the page" },
  { do: "navigate", says: "Open the page", to: [] },
  { do: "click", says: "Select the button" },
  { do: "fill", says: "Clear the title", locator: "input" },
  { do: "fill", says: "Clear the title", locator: "input", text: false },
  { do: "wait" },
  { do: "scroll", locator: null },
  { do: "press", says: "Move to the next field" },
  { do: "human" },
  { do: "human", needs: 1 },
  { do: "click", locator: "button" },
  { do: "expect", says: 1, url: "/" },
  { do: "expect", says: "Check the page address", url: {} },
  { do: "expect", says: "Check the heading", locator: {}, visible: true },
])("public commands reject malformed Step payloads: %j", async (step) => {
  const dir = await mkdtemp(join(root, "invalid-step-"));
  await rm(dir, { recursive: true });
  expect((await command(["init", dir, "--repository", repository, "--workflow", "step-validation", "--run", "invalid", "--json"])).code).toBe(0);
  await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify({
    schema: "collect-evidence/v1", kind: "plan", workId: "step-validation",
    driver: "playwright", base: "http://127.0.0.1:1",
    approval: { origins: ["http://127.0.0.1:1"] },
    tests: [{ id: "case", claim: "Reject malformed steps", pass: "Reject before output", fail: "Accept malformed steps", steps: [step] }],
  })};`);
  for (const operation of ["compile", "render", "run"]) {
    const result = await command([operation, dir, "--json"]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.out)).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
    expect(result.out).toContain("Step");
    expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
  }
});

for (const driver of ["surf", "playwright"]) {
  test.each([
    { do: "capture", says: "Read the heading", locator: "h1", as: "heading", attr: 1 },
    { do: "capture", says: "Read the heading", locator: "h1", as: "heading", attr: null },
    { do: "click", says: "Select the button", locator: "button", dom: "false" },
    { do: "click", says: "Select the button", locator: "button", dom: null },
    { do: "wait", locator: "h1", gone: "false" },
    { do: "wait", locator: "h1", gone: null },
    ...["wait", "expect"].flatMap((action) => ["100", null, -1, Infinity, NaN].map((timeoutMs) => ({
      do: action, says: "Check the heading", locator: "h1", visible: true, timeoutMs,
    }))),
  ])(`public commands reject malformed optional fields for ${driver}: %j`, async (step) => {
    const dir = await mkdtemp(join(root, "invalid-optional-"));
    await rm(dir, { recursive: true });
    expect((await command(["init", dir, "--repository", repository, "--workflow", "optional-validation", "--run", "invalid", "--driver", driver, "--json"])).code).toBe(0);
    // Keep non-finite numbers in the authored TypeScript instead of JSON's null.
    const { timeoutMs, ...fields } = step as typeof step & { timeoutMs?: unknown };
    const source = timeoutMs === undefined ? JSON.stringify(step) : `{...${JSON.stringify(fields)}, timeoutMs: ${String(timeoutMs === null ? "null" : typeof timeoutMs === "string" ? JSON.stringify(timeoutMs) : timeoutMs)}}`;
    await writeFile(join(dir, "plan.ts"), `export const plan = {
      schema: "collect-evidence/v1", kind: "plan", workId: "optional-validation",
      driver: ${JSON.stringify(driver)}, base: "http://127.0.0.1:1",
      approval: { origins: ["http://127.0.0.1:1"] },
      tests: [{ id: "case", claim: "Reject invalid optional fields", pass: "Reject before output", fail: "Accept malformed steps", steps: [${source}] }],
    };`);
    for (const operation of ["compile", "render", "run"]) {
      const result = await command([operation, dir, "--json", "--no-input"]);
      expect(result.code).toBe(2);
      expect(JSON.parse(result.out)).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
      expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
    }
  });
}

test.each(["surf", "playwright"])("compile and render preserve optional Step boundaries for %s", async (driver) => {
  const dir = join(root, `optional-steps-${driver}`);
  expect((await command(["init", dir, "--repository", repository, "--workflow", "step-validation", "--run", driver, "--json"])).code).toBe(0);
  const steps = [
    { do: "navigate", says: "Open the page", to: "/" },
    { do: "click", says: "Select the button", locator: "button" },
    { do: "click", says: "Select the button normally", locator: "button", dom: false },
    { do: "click", says: "Select the link", locator: "a", dom: true },
    { do: "fill", says: "Clear the title", locator: "input", text: "" },
    { do: "capture", says: "Read the heading", locator: driver === "surf" ? "h1" : "getByRole('heading')", as: "heading" },
    { do: "capture", says: "Read the heading attribute", locator: "h1", attr: "", as: "attribute" },
    { do: "expect", says: "Check the page address", url: "/" },
    { do: "expect", says: "Check the old heading is absent", locator: "h2", visible: false, timeoutMs: 0 },
    { do: "wait", locator: "h1" },
    { do: "wait", locator: "h1", gone: false, timeoutMs: 0 },
    { do: "wait", locator: "h2", gone: true, timeoutMs: 0.5 },
    { do: "scroll", locator: "footer", shot: "" },
    { do: "press", says: "Move to the next field", key: "Tab" },
    { do: "human", needs: "Review the page" },
  ];
  await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify({
    schema: "collect-evidence/v1", kind: "plan", workId: "step-validation", driver, base: "http://127.0.0.1:1",
    approval: { origins: ["http://127.0.0.1:1"], confirmations: ["case.2"] },
    tests: [{ id: "case", claim: "Preserve optional fields", pass: "Accept valid steps", fail: "Reject valid steps", steps }],
  })};`);
  for (const operation of ["compile", "render"]) {
    const result = await command([operation, dir, "--json"]);
    if (result.code) throw new Error(result.out || result.err);
    expect(result.code).toBe(0);
  }
  expect(JSON.parse(await readFile(join(dir, "plan.json"), "utf8")).data.tests[0].steps).toEqual(steps);
});

for (const driver of ["surf", "playwright"]) {
  test.each([
    "{ locator: false }", "{ locator: null }", "{ locator: 1 }",
    "{ text: false }", "{ text: null }", "{ goto: false }", "{ goto: null }",
    ...["'100'", "null", "-1", "Infinity", "-Infinity", "NaN"].map(value => `{ timeoutMs: ${value} }`),
  ])(`public commands reject malformed required preconditions for ${driver}: %s`, async (check) => {
    const dir = await mkdtemp(join(root, "invalid-precondition-"));
    await rm(dir, { recursive: true });
    expect((await command(["init", dir, "--repository", repository, "--workflow", "precondition-validation", "--run", "invalid", "--driver", driver, "--json"])).code).toBe(0);
    await writeFile(join(dir, "plan.ts"), `export const plan = {
      schema: "collect-evidence/v1", kind: "plan", workId: "precondition-validation",
      driver: ${JSON.stringify(driver)}, base: "http://127.0.0.1:1",
      approval: { origins: ["http://127.0.0.1:1"] },
      preconditions: [{ id: "ready", desc: "The page is ready", check: ${check} }],
      tests: [{ id: "case", requires: ["ready"], claim: "Reject invalid checks", pass: "Reject before dispatch", fail: "Bypass a required check", steps: [{ do: "navigate", says: "Open the page", to: "/" }] }],
    };`);
    for (const operation of ["compile", "render", "run"]) {
      const result = await command([operation, dir, "--json", "--no-input"]);
      expect(result.code).toBe(2);
      expect(JSON.parse(result.out)).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
      expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
    }
  });

  test(`compile and render preserve omitted precondition fields and timeout boundaries for ${driver}`, async () => {
    const dir = join(root, `valid-preconditions-${driver}`);
    expect((await command(["init", dir, "--repository", repository, "--workflow", "precondition-validation", "--run", "valid", "--driver", driver, "--json"])).code).toBe(0);
    const preconditions = [{}, { locator: "h1", text: "", goto: "/" }, ...[0, 0.5, Number.MAX_VALUE].map(timeoutMs => ({ locator: "h1", timeoutMs }))].map((check, i) => ({ id: `ready-${i}`, desc: "The page is ready", check }));
    await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify({
      schema: "collect-evidence/v1", kind: "plan", workId: "precondition-validation", driver, base: "http://127.0.0.1:1",
      approval: { origins: ["http://127.0.0.1:1"] }, preconditions,
      tests: [{ id: "case", requires: preconditions.map(p => p.id), claim: "Preserve valid checks", pass: "Accept valid checks", fail: "Reject valid checks", steps: [{ do: "navigate", says: "Open the page", to: "/" }] }],
    })};`);
    for (const operation of ["compile", "render"]) {
      const result = await command([operation, dir, "--json"]);
      if (result.code) throw new Error(result.out || result.err);
      expect(result.code).toBe(0);
    }
    expect(JSON.parse(await readFile(join(dir, "plan.json"), "utf8")).data.preconditions).toEqual(preconditions);
  });
}

test("native TUI dry-run resolves its store without opening a terminal", async () => {
  const dir = join(root, "native-dry");
  const before = await readdir(root);
  const result = await command(["init", dir, "--repository", repository, "--workflow", "native", "--run", "dry", "--driver", "tui", "--dry-run", "--json"]);
  expect(result.code).toBe(0);
  expect(JSON.parse(result.out)).toMatchObject({ dryRun: true, destination: { store: "repository", path: join(repository, "workflows/native/artifacts/evidence/dry") } });
  expect(await readdir(root)).toEqual(before);
});

test.each(["scope", "screen", "image", "control", "confirmations"])("native TUI rejects unsafe %s before a driver starts", async (fault) => {
  const dir = join(root, `native-${fault}`);
  expect((await command(["init", dir, "--repository", repository, "--workflow", "native", "--run", fault, "--driver", "tui", "--json"])).code).toBe(0);
  const plan = {
    schema: "collect-evidence/v1", kind: "plan", workId: "native", driver: "tui", base: "terminal://private",
    terminal: { command: ["/usr/bin/cat"], cwd: root, columns: 80, rows: 24, font: "monospace:size=12", lineHeight: 20 },
    approval: { origins: [], confirmations: ["1.1"], terminal: { command: ["/usr/bin/cat"], cwd: root } },
    tests: [{ id: "1", claim: "Read the selected screen", pass: "The screen is visible", fail: "The wrong screen is visible", steps: [
      { do: "fill", says: "Type the label.", locator: "screen", text: "label", screen: "Ready" },
      { do: "expect", says: "Check the label.", locator: "screen", text: "label", shot: "label", image: { width: 1280, height: 720, pixels: [{ x: 0, y: 0, rgb: [0, 0, 0] }], lines: [{ text: "label", top: 0 }, { text: "Ready", top: 20 }] } },
    ] }],
  };
  if (fault === "scope") plan.approval.terminal.command = ["/usr/bin/false"];
  if (fault === "screen") plan.tests[0]!.steps[0]!.screen = "";
  if (fault === "image") plan.tests[0]!.steps[1]!.image!.pixels[0]!.x = 1280;
  if (fault === "control") plan.tests[0]!.steps[0]!.text = "label" + String.fromCharCode(10);
  const source = JSON.stringify(plan);
  await writeFile(join(dir, "plan.ts"), `export const plan = ${fault === "confirmations" ? source.replace('\"confirmations\":[\"1.1\"]', '\"confirmations\":true') : source};`);
  const result = await command(["compile", dir, "--json"]);
  expect(result.code).toBe(2);
  expect(JSON.parse(result.out)).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
  expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
});
