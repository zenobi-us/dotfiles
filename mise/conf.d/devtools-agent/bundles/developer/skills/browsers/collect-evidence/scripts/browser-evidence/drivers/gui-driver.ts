// Native X11 pixels only. All GUI windows and displays remain borrowed.
import { mkdtemp, readFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { Driver, RunContext } from "./driver.ts";
import { shotPath, stepNumber, type Evidence, type GuiScope } from "../plan.ts";
import { CliError, sh } from "../sh.ts";
import type { DriverRun } from "../verdict.ts";

export const guiDriver: Driver = {
  name: "gui", attended: true,
  scriptName: (_plan, id) => `gui-${id}.json`,
  compile: (plan, test) => ({ [`gui-${test.id}.json`]: JSON.stringify({ schema: "collect-evidence/v1", kind: "plan", gui: plan.gui, test }, null, 2) + "\n" }),
  sessionName: () => `ce-gui-${randomUUID()}`,
  async open() {},
  async close() {},
  async checkPrecondition() { return { ok: false, detail: "GUI preconditions require image expectations" }; },
  runTest: runGui,
  cleanupRow: () => ({ item: "Borrowed GUI surface", state: "Preserved", action: "No window, display or application was closed or controlled" }),
};

export async function doctorGui(scope?: GuiScope): Promise<object> {
  if (process.platform !== "linux") throw new CliError("GUI capture supports Linux X11 only; no platform fallback is permitted", 3);
  const missing = ["import", "magick", "xwininfo"].filter(tool => !Bun.which(tool));
  if (missing.length) throw new CliError(`GUI capture tools unavailable: ${missing.join(", ")}. Complete setup separately.`, 3);
  if (!scope || !/^:[0-9]+(?:\.[0-9]+)?$/.test(scope.display) || !/^(?:root|0x[0-9a-fA-F]+)$/.test(scope.window)) throw new CliError("GUI doctor requires --display and --window for the approved local X11 surface", 2);
  const root = await mkdtemp(join(tmpdir(), "ce-gui-doctor-"));
  try {
    await identity(scope);
    await capture(scope, join(root, "probe.png"));
    await command(["magick", "identify", join(root, "probe.png")]);
    const version = await command(["import", "-version"]);
    return { driver: "gui", available: true, attended: true, method: "x11-imagemagick-import", permissions: "Selected surface query and native capture succeeded", diagnostic: version.split("\n")[0], video: "unavailable" };
  } finally { await rm(root, { recursive: true, force: true }); }
}

async function runGui(ctx: RunContext): Promise<DriverRun> {
  const records: Evidence[] = [];
  const scope = ctx.plan.gui!;
  let current = stepNumber(ctx.test.id, 0);
  const root = await mkdtemp(join(tmpdir(), "ce-gui-frame-"));
  let interrupted = false;
  const stop = () => { interrupted = true; };
  process.on("SIGINT", stop); process.on("SIGTERM", stop);
  try {
    const compiled = JSON.parse(await readFile(join(ctx.workflowDir, `gui-${ctx.test.id}.json`), "utf8"));
    if (JSON.stringify(compiled.gui) !== JSON.stringify(scope) || JSON.stringify(compiled.test) !== JSON.stringify(ctx.test)) throw new Error("Compiled GUI plan differs from approved scope");
    const capability = await doctorGui(scope) as { diagnostic: string };
    for (const [index, step] of ctx.test.steps.entries()) {
      current = stepNumber(ctx.test.id, index);
      if (interrupted) throw new Error("GUI collection interrupted");
      const common = { test: ctx.test.id, step: current, target: "screen", resolved: scope.window, url: `x11://${scope.display}/${scope.window}`, screenshot: "", note: "Read-only native capture; inspect original pixels. No input or video support.", gui: { ...scope, ownership: "borrowed" as const, cleanup: "preserved" as const } };
      if (step.do === "human") { records.push({ ...common, action: "human", observed: step.needs, verdict: "PARTIAL" }); break; }
      if (step.do !== "expect") throw new CliError("SAFETY STOP: GUI input is unsupported; no action was sent", 3);
      const file = shotPath(ctx.test.id, index, step.shot!);
      const frame = join(root, "frame.png");
      const record: Evidence = { ...common, action: "assert", observed: "Native image has not matched the expected pixels", verdict: "", toolVersion: capability.diagnostic };
      records.push(record);
      const deadline = Date.now() + (step.timeoutMs ?? 5000);
      let previous = "";
      let matched = false;
      do {
        if (interrupted) throw new Error("GUI collection interrupted");
        await identity(scope);
        await capture(scope, frame);
        await identity(scope);
        const hash = createHash("sha256").update(await readFile(frame)).digest("hex");
        const image = step.image!;
        const dimensions = (await command(["magick", "identify", "-format", "%w %h", frame])).trim();
        matched = dimensions === `${image.width} ${image.height}`;
        for (const p of image.pixels) {
          const values = (await command(["magick", frame, "-colorspace", "sRGB", "-format", `%[fx:255*p{${p.x},${p.y}}.r] %[fx:255*p{${p.x},${p.y}}.g] %[fx:255*p{${p.x},${p.y}}.b]`, "info:"])).trim().split(/\s+/).map(Number);
          matched = matched && values.length === 3 && values.every((v, i) => Number.isFinite(v) && Math.abs(v - p.rgb[i]!) <= (p.tolerance ?? 0));
        }
        if (matched && hash === previous) break;
        matched = false; previous = hash;
        await Bun.sleep(120);
      } while (Date.now() <= deadline);
      await copyFile(frame, join(ctx.reportDir, file));
      record.screenshot = file; record.capturedAt = new Date().toISOString(); record.captureSequence = 1; record.captureStatus = "captured";
      if (!matched) throw new Error("Native GUI frame did not settle on the expected dimensions and RGB probes before timeout");
      record.assertionPassed = true; record.observed = "Exact selected surface title, stable native frame, dimensions and RGB probes match";
    }
    return { records, raw: "Borrowed GUI surface preserved; no input, launch, focus or shutdown operations performed.\n", attempts: 1 };
  } catch (error) {
    return { records, failure: { step: current, message: (error as Error).message, blocked: error instanceof CliError && error.exitCode === 3, captureFailed: error instanceof CaptureError }, raw: "GUI capture stopped; borrowed resources preserved.\n", attempts: 1 };
  } finally {
    process.off("SIGINT", stop); process.off("SIGTERM", stop);
    await rm(root, { recursive: true, force: true });
  }
}

async function identity(scope: GuiScope): Promise<void> {
  const result = await command(["xwininfo", "-display", scope.display, ...(scope.window === "root" ? ["-root"] : ["-id", scope.window])]);
  if (!/Map State: IsViewable/.test(result)) throw new CliError("Selected GUI surface is not viewable; no fallback capture is allowed", 3);
  if (scope.window !== "root") {
    const title = result.match(/Window id: 0x[0-9a-f]+ "(.*)"/i)?.[1];
    if (title !== scope.title) throw new CliError("Selected GUI window title changed or identity is unavailable; approve the current surface explicitly", 3);
  }
}
class CaptureError extends CliError {}

async function capture(scope: GuiScope, path: string): Promise<void> {
  try {
    await command(["import", "-display", scope.display, "-window", scope.window, `PNG32:${path}`]);
  } catch (error) {
    throw new CaptureError((error as Error).message, 3);
  }
}
async function command(args: string[]): Promise<string> {
  const result = await sh(args);
  if (result.code !== 0) throw new CliError("Native GUI display/capture access failed; check installed tools, X11 authorization and selected window permissions separately", 3);
  return result.out;
}
