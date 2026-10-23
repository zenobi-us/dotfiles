import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { ProcessTerminal, TuiAltScreen, stripTerminalSequences, visibleWidth, type TuiMouseEvent } from "@earendil-works/pi-tui";
import { ContextOnboarding, readContextReadiness, type ContextReadiness } from "./onboarding";
import type { SharedAgentContext } from "./model";
import { initializeSharedContext, migrateContextRoute, resolveSharedContext } from "../../skills/shared-context/scripts/shared-context/lib";

const theme = { fg: (_token: string, text: string) => text, bg: (_token: string, text: string) => `\x1b[48;5;24m${text}\x1b[49m` } as Theme;
const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

async function fixture(): Promise<SharedAgentContext> {
  const root = await mkdtemp(path.join(os.tmpdir(), "context-onboarding-"));
  temporaryDirectories.push(root);
  const repositoryRoot = path.join(root, "repo");
  await mkdir(repositoryRoot);
  await mkdir(path.join(root, "shared"));
  return resolveFixture({ repositoryRoot, candidateSharedRoot: path.join(root, "shared", "candidate") } as SharedAgentContext);
}

async function resolveFixture(context: SharedAgentContext): Promise<SharedAgentContext> {
  const resolved = await resolveSharedContext(async (_command, args) => {
    if (args.includes("--show-toplevel")) return { stdout: context.repositoryRoot, code: 0 };
    if (args.includes("get-url")) return { stdout: "https://github.com/example/onboarding.git", code: 0 };
    return { stdout: "", code: 1 };
  }, context.repositoryRoot, path.dirname(context.candidateSharedRoot!));
  if (!resolved) throw new Error("Could not resolve fixture context.");
  return resolved;
}

function mouse(x: number, y: number, type: TuiMouseEvent["type"] = "click"): TuiMouseEvent {
  return { type, button: "left", x, y, screenX: x, screenY: y, width: 80, height: 20, shift: false, alt: false, ctrl: false };
}

function button(modal: ContextOnboarding, label: string, width = 80): { x: number; y: number } {
  const rows = modal.render(width).map(stripTerminalSequences);
  const y = rows.findIndex(row => row.includes(label));
  expect(y).toBeGreaterThanOrEqual(0);
  return { x: visibleWidth(rows[y]!.slice(0, rows[y]!.indexOf(label))), y };
}

test("shared-only initialization completes onboarding without repository configuration", async () => {
  const context = await fixture();
  const readiness = await readContextReadiness(context);
  expect(readiness).toEqual({ routesConfigured: false, sharedDirectory: false });
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context, readiness, theme, height: () => 20, requestRender: () => {},
    done: ready => completed.push(ready),
    run: async () => {
      await initializeSharedContext(context);
      return readContextReadiness(await resolveFixture(context));
    },
  });
  await modal.handleInput("\r");
  expect(completed).toEqual([true]);
  expect(await readdir(context.repositoryRoot)).toEqual([]);
});

test("route manifest is sufficient without optional layout, tracker or instruction files", async () => {
  const context = await fixture();
  await initializeSharedContext(context);
  await rm(path.join(context.candidateSharedRoot!, "AGENTS.md"));
  expect(await readContextReadiness(await resolveFixture(context))).toEqual({ routesConfigured: true, sharedDirectory: true });
  expect(await readdir(context.repositoryRoot)).toEqual([]);
});

test("repository alignment still recognizes the origin's shared route manifest", async () => {
  const context = await fixture();
  await initializeSharedContext(context);
  await migrateContextRoute(await resolveFixture(context), "alignment", "repository");
  const resolved = await resolveFixture(context);
  expect(resolved.alignmentRoot).toBe(context.repositoryRoot);
  expect(resolved.mode).toBe("mixed");
  expect(await readContextReadiness(resolved)).toEqual({ routesConfigured: true, sharedDirectory: true });
});

test("legacy shared instructions and delegated tracker policy count as established context", async () => {
  const context = await fixture();
  await mkdir(path.join(context.candidateSharedRoot!, "docs/agents"), { recursive: true });
  await writeFile(path.join(context.candidateSharedRoot!, "AGENTS.md"), "# Shared instructions\n");
  await writeFile(path.join(context.candidateSharedRoot!, "docs/agents/issue-tracker.md"), "---\nbackend: github\n---\n");
  const resolved = await resolveFixture(context);
  expect(resolved.routes.tickets.adapter).toBe("github");
  expect(await readContextReadiness(resolved)).toEqual({ routesConfigured: true, sharedDirectory: true });
  expect(await readdir(context.repositoryRoot)).toEqual([]);
});

test("legacy storage preferences count, but an empty or invalid registration does not", async () => {
  const context = await fixture();
  await mkdir(context.candidateSharedRoot!, { recursive: true });
  expect(await readContextReadiness(await resolveFixture(context))).toEqual({ routesConfigured: false, sharedDirectory: true });
  for (const store of ["shared", "repository"]) {
    await writeFile(path.join(context.candidateSharedRoot!, ".storage"), store);
    expect(await readContextReadiness(await resolveFixture(context))).toEqual({ routesConfigured: true, sharedDirectory: true });
  }
  await writeFile(path.join(context.candidateSharedRoot!, ".storage"), "invalid");
  expect(await readContextReadiness(await resolveFixture(context))).toEqual({ routesConfigured: false, sharedDirectory: true });
});

test("invalid registration paths and resolver errors are not treated as missing setup", async () => {
  const context = await fixture();
  await writeFile(context.candidateSharedRoot!, "not a directory");
  await expect(readContextReadiness(context)).rejects.toThrow("Expected a directory");
  await expect(readContextReadiness({ ...context, error: "Invalid routes" })).rejects.toThrow("Invalid routes");
});

test("mouse and keyboard cannot run setup twice while pending; recheck does not rerun setup", async () => {
  const { promise: pending, resolve: release } = Promise.withResolvers<ContextReadiness>();
  let setupRuns = 0;
  let checkRuns = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, sharedDirectory: false }, theme,
    height: () => 20, requestRender: () => {}, done: ready => completed.push(ready),
    run: action => {
      if (action === "setup") { setupRuns++; return pending; }
      checkRuns++;
      return Promise.resolve({ routesConfigured: true, sharedDirectory: true });
    },
  });
  const target = button(modal, "Run setup");
  modal.handleMouse(mouse(target.x, target.y, "press"));
  expect(setupRuns).toBe(0);
  modal.handleMouse(mouse(target.x, target.y));
  await modal.handleInput("\r");
  modal.handleMouse(mouse(target.x, target.y));
  expect(setupRuns).toBe(1);
  expect(modal.render(80).join("\n")).toContain("Running setup");
  release({ routesConfigured: true, sharedDirectory: false });
  await pending;
  await Promise.resolve();
  expect(completed).toEqual([]);
  await modal.handleInput("\r");
  expect(completed).toEqual([true]);
  expect(setupRuns).toBe(1);
  expect(checkRuns).toBe(1);
});

test("setup errors remain visible and allow retry", async () => {
  let runs = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: true, sharedDirectory: false }, theme,
    height: () => 20, requestRender: () => {}, done: ready => completed.push(ready),
    run: async () => {
      if (++runs === 1) throw new Error("Permission denied");
      return { routesConfigured: true, sharedDirectory: true };
    },
  });
  await modal.handleInput("\r");
  expect(modal.render(80).join("\n")).toContain("Permission denied");
  expect(completed).toEqual([]);
  await modal.handleInput("\r");
  expect(completed).toEqual([true]);
});

test("button hit boxes follow resize; padding, right clicks and disposed components cannot activate", async () => {
  let runs = 0;
  const completed: boolean[] = [];
  let height = 20;
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, sharedDirectory: false }, theme,
    height: () => height, requestRender: () => {}, done: ready => completed.push(ready),
    run: async () => { runs++; return { routesConfigured: false, sharedDirectory: true }; },
  });
  const old = button(modal, "Run setup", 120);
  height = 10;
  const target = button(modal, "Run setup", 38);
  modal.handleMouse(mouse(old.x, old.y));
  modal.handleMouse(mouse(0, target.y));
  modal.handleMouse({ ...mouse(target.x, target.y), button: "right" });
  expect(runs).toBe(0);
  const close = button(modal, "Close", 38);
  modal.handleMouse(mouse(close.x, close.y));
  expect(completed).toEqual([false]);
  modal.dispose();
  await modal.handleInput("\r");
  modal.handleMouse(mouse(target.x, target.y));
  expect(runs).toBe(0);
});

test("host focus preserves keyboard close; long wide labels stay within terminal bounds", async () => {
  const context = await fixture();
  context.repositoryRoot += "/研究-very-long-repository-name-with-many-components";
  let runs = 0;
  const completed: boolean[] = [];
  let height = 20;
  const modal = new ContextOnboarding({
    context, readiness: { routesConfigured: false, sharedDirectory: false }, theme,
    height: () => height, requestRender: () => {}, done: ready => completed.push(ready),
    run: async () => { runs++; return { routesConfigured: false, sharedDirectory: true }; },
  });
  const tui = new TuiAltScreen(new ProcessTerminal());
  tui.setFocus(modal);
  for (const [width, rows] of [[114, 36], [76, 21], [38, 10], [22, 10]]) {
    height = rows!;
    const lines = modal.render(width!);
    expect(lines.length).toBe(rows!);
    expect(lines.every(line => visibleWidth(line) === width)).toBe(true);
  }
  await modal.handleInput("\t");
  await modal.handleInput(" ");
  expect(completed).toEqual([false]);
  expect(runs).toBe(0);
});

test("OMP raw press and release initialize shared context exactly once", async () => {
  const context = await fixture();
  let runs = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context, readiness: await readContextReadiness(context), theme,
    height: () => 21, viewport: () => ({ columns: 80, rows: 24 }), requestRender: () => {},
    done: ready => completed.push(ready),
    run: async () => {
      runs++;
      await initializeSharedContext(context);
      return readContextReadiness(await resolveFixture(context));
    },
  });
  const target = button(modal, "Run setup", 76);
  const x = target.x + 3;
  const y = target.y + 2;
  await modal.handleInput(`\x1b[<0;${x};${y}M`);
  modal.render(76);
  expect(runs).toBe(0);
  await modal.handleInput(`\x1b[<0;${x};${y}m`);
  await modal.handleInput(`\x1b[<0;${x};${y}m`);
  expect(runs).toBe(1);
  expect(completed).toEqual([true]);
  expect(await readdir(context.repositoryRoot)).toEqual([]);
});

test("raw mouse input cancels drags and stale presses, and Close follows resized bounds", async () => {
  let columns = 80;
  let rows = 24;
  let runs = 0;
  const completed: boolean[] = [];
  const modal = new ContextOnboarding({
    context: await fixture(), readiness: { routesConfigured: false, sharedDirectory: false }, theme,
    height: () => Math.floor(rows * 0.9), viewport: () => ({ columns, rows }), requestRender: () => {},
    done: ready => completed.push(ready),
    run: async () => { runs++; return { routesConfigured: true, sharedDirectory: true }; },
  });
  const target = button(modal, "Run setup", 76);
  const x = target.x + 3;
  const y = target.y + 2;
  for (const events of [
    [`\x1b[<0;${x};${y}m`],
    [`\x1b[<2;${x};${y}M`, `\x1b[<2;${x};${y}m`],
    [`\x1b[<0;${x};${y}M`, `\x1b[<32;${x + 1};${y}M`, `\x1b[<0;${x};${y}m`],
    [`\x1b[<0;1;1M`, `\x1b[<0;${x};${y}m`],
    [`\x1b[<0;${x};${y}M`, `\x1b[<0;1;1m`],
  ]) {
    for (const event of events) await modal.handleInput(event);
  }
  await modal.handleInput(`\x1b[<0;${x};${y}M`);
  columns = 40;
  rows = 12;
  await modal.handleInput(`\x1b[<0;${x};${y}m`);
  expect(runs).toBe(0);
  expect(completed).toEqual([]);
  const close = button(modal, "Close", 38);
  await modal.handleInput(`\x1b[<0;${close.x + 2};${close.y + 2}M`);
  await modal.handleInput(`\x1b[<0;${close.x + 2};${close.y + 2}m`);
  expect(completed).toEqual([false]);
  modal.dispose();
  await modal.handleInput(`\x1b[<0;${x};${y}M`);
  await modal.handleInput(`\x1b[<0;${x};${y}m`);
  expect(runs).toBe(0);
});
