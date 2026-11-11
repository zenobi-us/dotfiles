import { chmod, copyFile, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import type { Driver, RunContext } from "./driver.ts";
import { shotPath, stepNumber, type Evidence, type Plan } from "../plan.ts";
import type { DriverRun } from "../verdict.ts";
import { CliError } from "../sh.ts";

type Session = {
  root: string; socket: string; name: string; env: Record<string, string>;
  cage?: Bun.Subprocess<"ignore", "ignore", "pipe">;
  bridge?: Bun.Subprocess<"pipe", "pipe", "pipe">; display?: string; output?: string;
  pending: Map<number, { resolve(value: unknown): void; reject(error: Error): void }>;
  serial: number; log: string[]; stopped: boolean; identities: NonNullable<Evidence["terminal"]>[];
  started?: NonNullable<Evidence["terminal"]>; serverOwned?: boolean;
  stdout: Uint8Array[]; stderr: Map<string, Promise<ArrayBuffer>>; paths: Set<string>;
  frame: number;
  reader?: Promise<void>;
};
const sessions = new Map<string, Session>();
const credentials = /\b(password|passphrase|passcode|username|sign\s*in|log\s*in|verification code|two.factor|authenticate|credentials?)\b/i;
// Token-like words also occur in ordinary output; require a field or input request.
const credentialLabel = String.raw`(?:(?:api|access|auth(?:entication)?|personal[ -]+access|bearer)[ -]+)?token|api[ -]?key|pin|otp|one[ -]time[ -](?:password|passcode|code)`;
const credentialPrompt = new RegExp(String.raw`\b(?:${credentialLabel})\b[ \t]*[:?]|\b(?:enter|provide|type|paste|input)[ \t]+(?:(?:your|the|an?)[ \t]+)?(?:${credentialLabel})\b`, "i");
const confirmation = /\?|[\[(]\s*(?:y(?:es)?\s*[/|,]\s*n(?:o)?|n(?:o)?\s*[/|,]\s*y(?:es)?)\s*[\])]|\b(?:confirm|are you sure|proceed|continue)\b/i;
class NativeCaptureError extends Error {}

export const tuiDriver: Driver = {
  name: "tui", attended: false,
  scriptName: (_plan, id) => `tui-${id}.json`,
  compile: (plan, test) => ({ [`tui-${test.id}.json`]: JSON.stringify({ schema: "collect-evidence/v1", kind: "plan", terminal: plan.terminal, test }, null, 2) + "\n" }),
  sessionName: () => `ce-tui-${randomUUID()}`,
  open: openTerminal,
  async checkPrecondition(plan, p, name) {
    const s = sessions.get(name)!;
    await startApplication(s, plan);
    try { await visible(s, p.check.text!, p.check.timeoutMs ?? 5000); return { ok: true, detail: "Expected text is visible in the native image" }; }
    catch (error) { return { ok: false, detail: (error as Error).message }; }
  },
  runTest: runTerminal,
  close: closeTerminal,
  cleanupRow: () => ({ item: "Private terminal and display", state: "Released", action: "Only collector-owned processes and socket removed" }),
};

export async function doctorTui(): Promise<object> {
  if (process.platform !== "linux") throw new CliError("Native TUI collection requires Linux foot/Cage/wlroots/grim", 3);
  const missing = ["termscope", "tmux", "foot", "cage", "grim", "wlr-randr", "tesseract", "magick"].filter(tool => !Bun.which(tool));
  if (missing.length) throw new CliError(`Native TUI prerequisites unavailable: ${missing.join(", ")}. Complete setup separately; no reconstruction or installation is permitted during collection.`, 3);
  if (Object.keys(process.env).some(key => /^(MESA_GL_VERSION_OVERRIDE|MESA_GLSL_VERSION_OVERRIDE|GALLIUM_DRIVER)$/.test(key))) throw new CliError("Remove graphics-version/driver overrides before native collection; no forced graphics fallback is supported", 3);
  const name = `ce-doctor-${randomUUID()}`;
  try {
    await openTerminal(name);
    const s = sessions.get(name)!;
    await capture(s, join(s.root, "doctor.png"));
    await command(["magick", "identify", join(s.root, "doctor.png")], s);
    await command(["tesseract", join(s.root, "doctor.png"), "stdout", "--psm", "11"], s);
    const version = await command(["termscope", "--version"], s);
    return { driver: "tui", available: true, attended: false, diagnostic: version.trim(), video: "unavailable", method: "private CPU foot/Cage/wlroots/grim", permissions: "private display launch and native PNG capture succeeded" };
  } catch (error) { throw new CliError(`Native TUI display/capture prerequisite failed: ${(error as Error).message}`, 3); }
  finally { await closeTerminal(name); }
}

async function openTerminal(name: string, workflowDir?: string): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "ce-native-"));
  await chmod(root, 0o700);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined && !["TMUX", "DISPLAY", "WAYLAND_DISPLAY"].includes(key))) as Record<string, string>;
  Object.assign(env, { XDG_RUNTIME_DIR: root, WLR_BACKENDS: "headless", WLR_RENDERER: "pixman", WLR_HEADLESS_OUTPUTS: "1", TERM: "xterm-256color" });
  const s: Session = { root, name, socket: join(root, "tmux.sock"), env, pending: new Map(), serial: 0, log: [], stopped: false, identities: [], stdout: [], stderr: new Map(), paths: new Set(), frame: 0 };
  sessions.set(name, s);
  if (workflowDir) s.paths.add(workflowDir);
  try {
    await tmux(s, ["new-session", "-d", "-s", name, "-x", "80", "-y", "24", "/usr/bin/sleep", "86400"]);
    s.serverOwned = true;
    await tmux(s, ["set-option", "-g", "status", "off"]);
    await tmux(s, ["set-option", "-g", "remain-on-exit", "on"]);
    await tmux(s, ["set-option", "-g", "window-size", "manual"]);
    s.cage = Bun.spawn(["cage", "--", "foot", "--config=/dev/null", "--title", name, "--override=font=monospace:size=12", "--override=line-height=20px", "tmux", "-S", s.socket, "attach-session", "-t", name], { env, cwd: root, stdin: "ignore", stdout: "ignore", stderr: "pipe" });
    s.stderr.set("cage", new Response(s.cage.stderr).arrayBuffer());
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (s.cage.exitCode !== null) throw new Error("Owned Cage/foot exited before display readiness");
      const display = (await readdir(root)).find(file => /^wayland-\d+$/.test(file));
      if (display) { s.display = display; s.env.WAYLAND_DISPLAY = display; break; }
      await Bun.sleep(50);
    }
    if (!s.display) throw new Error("Private Wayland socket did not appear");
    const outputs = JSON.parse(await command(["wlr-randr", "--json"], s));
    if (!Array.isArray(outputs) || outputs.length !== 1 || !outputs[0].enabled) throw new Error("Expected exactly one private display output");
    s.output = outputs[0].name;
    s.bridge = Bun.spawn(["termscope", "session", "--", "tmux", "-S", s.socket, "attach-session", "-t", name], { env, cwd: root, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
    s.reader = readReplies(s);
    s.stderr.set("termscope", new Response(s.bridge.stderr).arrayBuffer());
    await rpc(s, "query");
  } catch (error) { await closeTerminal(name); throw error; }
}

async function runTerminal(ctx: RunContext): Promise<DriverRun> {
  const s = sessions.get(ctx.session)!;
  const { plan, test } = ctx;
  const records: Evidence[] = [];
  let current = stepNumber(test.id, 0);
  const interrupt = () => { s.stopped = true; };
  process.on("SIGINT", interrupt); process.on("SIGTERM", interrupt);
  try {
    const t = plan.terminal!;
    const compiled = JSON.parse(await readFile(join(ctx.workflowDir, `tui-${test.id}.json`), "utf8"));
    if (JSON.stringify(compiled.terminal) !== JSON.stringify(t) || JSON.stringify(compiled.test) !== JSON.stringify(test)) throw new Error("Compiled native plan differs from the approved plan");
    const terminal = await startApplication(s, plan);
    for (const [index, step] of test.steps.entries()) {
      current = stepNumber(test.id, index);
      if (s.stopped) throw new Error("Native collection interrupted");
      if (step.do === "human") {
        records.push({ test: test.id, step: current, action: "human", target: "", resolved: "", url: `terminal://${s.name}`, screenshot: "", observed: step.needs, verdict: "PARTIAL", note: step.needs, terminal });
        break;
      }
      if (step.do === "press" || step.do === "fill") {
        await visible(s, step.screen!, 5000, undefined, plan.approval.confirmations?.includes(current) ? step.screen : undefined);
        if (!plan.approval.confirmations?.includes(current)) throw new CliError(`SAFETY STOP ${current}: input step is not explicitly approved`, 3);
        if (s.stopped) throw new Error("Native collection interrupted before input");
        await rpc(s, step.do === "press" ? "press" : "type", step.do === "press" ? { key: step.key } : { text: step.text });
      }
      if (step.do === "wait") await visible(s, step.text!, step.timeoutMs ?? 5000);
      const record: Evidence = { test: test.id, step: current, action: step.do === "expect" ? "assert" : step.do, target: step.do === "expect" ? step.text! : "screen", resolved: "", url: `terminal://${s.name}`, screenshot: "", observed: "Input completed on the owned terminal", verdict: "", note: "Native video unavailable. OCR is not a substitute for human image inspection.", terminal };
      if (step.do === "expect" || step.shot) {
        const file = step.shot ? shotPath(test.id, index, step.shot) : "";
        const path = file ? join(ctx.reportDir, file) : join(s.root, "check.png");
        await visible(s, step.do === "expect" || step.do === "wait" ? step.text! : "", step.do === "expect" || step.do === "wait" ? step.timeoutMs ?? 5000 : 5000, path);
        record.screenshot = file; record.capturedAt = new Date().toISOString(); record.captureSequence = 1; record.captureStatus = file ? "captured" : "not-requested";
        record.observed = "Native frame captured after visible-screen synchronization";
        if (step.do === "expect") {
          records.push(record);
          await checkImage(s, path, step.image!);
          record.assertionPassed = true;
          record.observed = "Expected screen, native dimensions, colour probes and text line positions match";
          continue;
        }
      }
      records.push(record);
    }
    return { records, raw: s.log.join("\n"), attempts: 1 };
  } catch (error) {
    return { records, failure: { step: current, message: (error as Error).message, blocked: error instanceof CliError && error.exitCode === 3, captureFailed: error instanceof NativeCaptureError }, raw: s.log.join("\n"), attempts: 1 };
  } finally {
    process.off("SIGINT", interrupt); process.off("SIGTERM", interrupt);
    await writeFile(join(ctx.workflowDir, `tui-${test.id}.log`), s.log.join("\n"));
  }
}

async function visible(s: Session, expected: string, timeout: number, destination = join(s.root, `screen-${randomUUID()}.png`), approvedPrompt?: string): Promise<void> {
  const deadline = Date.now() + timeout;
  let previous = "";
  do {
    if (s.stopped) throw new Error("Native collection interrupted");
    const snapshot = await rpc(s, "snapshot", { format: "json" });
    if (!snapshot || typeof snapshot !== "object" || !("lines" in snapshot) || !Array.isArray(snapshot.lines) || !snapshot.lines.every(line => typeof line === "string")) throw new Error("termscope returned an invalid screen snapshot");
    const text = snapshot.lines.join("\n");
    if (credentials.test(text) || credentialPrompt.test(text)) throw new CliError("SAFETY STOP: terminal credential prompt; human handling required", 3);
    const frame = join(s.root, `frame-${String(++s.frame).padStart(6, "0")}.png`);
    await capture(s, frame);
    // Terminal text is sparse; single-block OCR can discard it beside tmux padding.
    const ocr = await command(["tesseract", frame, "stdout", "--psm", "11"], s);
    if (credentials.test(ocr) || credentialPrompt.test(ocr)) throw new CliError("SAFETY STOP: visible credential prompt; human handling required", 3);
    // A heading can survive a new dialog. Only an explicitly approved operation
    // may permit its named prompt; read-only checks must stop at confirmations.
    const approved = approvedPrompt?.replace(/\s+/g, " ").trim();
    for (const screen of [text, ocr]) {
      for (const line of screen.split("\n").map(line => line.replace(/\s+/g, " ").trim())) {
        if (confirmation.test(line) && !approved?.includes(line)) throw new CliError("SAFETY STOP: unexpected terminal confirmation; approve the actual prompt before input", 3);
      }
    }
    const hash = createHash("sha256").update(await readFile(frame)).digest("hex");
    // Two consecutive native frames must agree; the text buffer alone cannot pass.
    if (text.includes(expected) && ocr.includes(expected) && hash === previous) {
      try { await copyFile(frame, destination); }
      catch (error) { throw new NativeCaptureError((error as Error).message); }
      return;
    }
    previous = hash;
    await Bun.sleep(120);
  } while (Date.now() <= deadline);
  throw new Error("Native screen did not settle on the expected visible content before timeout");
}

async function checkImage(s: Session, path: string, image: NonNullable<Extract<Plan["tests"][number]["steps"][number], { do: "expect" }>["image"]>): Promise<void> {
  const dimensions = (await command(["magick", "identify", "-format", "%w %h", path], s)).trim();
  if (dimensions !== `${image.width} ${image.height}`) throw new Error("Native image dimensions do not match the expected display");
  for (const p of image.pixels) {
    const values = (await command(["magick", path, "-colorspace", "sRGB", "-format", `%[fx:255*p{${p.x},${p.y}}.r] %[fx:255*p{${p.x},${p.y}}.g] %[fx:255*p{${p.x},${p.y}}.b]`, "info:"], s)).trim().split(" ").map(Number);
    if (values.length !== 3 || values.some((v, i) => !Number.isFinite(v) || Math.abs(v - p.rgb[i]!) > (p.tolerance ?? 0))) throw new Error("Native image colour probe differs from the expected RGB");
  }
  const tsv = await command(["tesseract", path, "stdout", "--psm", "11", "tsv"], s);
  s.log.push(tsv);
  const lines = new Map<string, { top: number; text: string[] }>();
  for (const row of tsv.trim().split("\n").slice(1)) {
    const cells = row.split("\t");
    if (cells[0] !== "5" || !cells[11]?.trim()) continue;
    const key = cells.slice(1, 5).join(".");
    const line = lines.get(key) ?? { top: Number(cells[7]), text: [] };
    line.top = Math.min(line.top, Number(cells[7])); line.text.push(cells[11]); lines.set(key, line);
  }
  for (const expected of image.lines) if (![...lines.values()].some(line => line.text.join(" ").includes(expected.text) && Math.abs(line.top - expected.top) <= (expected.tolerance ?? 2))) throw new Error("Native image text line position differs; inspect line spacing in the actual PNG");
}

async function capture(s: Session, path: string): Promise<void> {
  try {
    if (s.cage?.exitCode !== null || !s.display || !s.output) throw new Error("Owned native display is no longer available");
    await command(["grim", "-o", s.output, path], s);
  } catch (error) { throw new NativeCaptureError((error as Error).message); }
}

async function closeTerminal(name: string): Promise<void> {
  const s = sessions.get(name);
  if (!s) return;
  s.stopped = true;
  const failures: unknown[] = [];
  if (s.bridge?.exitCode === null) {
    try { s.bridge.kill("SIGTERM"); await s.bridge.exited; } catch (error) { failures.push(error); }
  }
  await s.reader;
  if (s.serverOwned) {
    try { await tmux(s, ["kill-server"]); } catch (error) { failures.push(error); }
  }
  if (s.cage?.exitCode === null) {
    try { s.cage.kill("SIGTERM"); await s.cage.exited; } catch (error) { failures.push(error); }
  }
  for (const path of s.paths) {
    await writeFile(join(path, `${s.name}-termscope.jsonl`), Buffer.concat(s.stdout));
    for (const [tool, bytes] of s.stderr) await writeFile(join(path, `${s.name}-${tool}.stderr`), Buffer.from(await bytes));
    for (const file of await readdir(s.root)) if (/^frame-\d+\.png$/.test(file)) await copyFile(join(s.root, file), join(path, `${s.name}-${file}`));
  }
  if (failures.length) throw new Error("Owned native cleanup failed; private resources retained for inspection");
  for (const identity of s.identities) identity.cleanup = "released";
  await rm(s.root, { recursive: true, force: true });
  sessions.delete(name);
}

async function tmux(s: Session, args: string[]): Promise<string> {
  return command(["tmux", "-f", "/dev/null", "-S", s.socket, ...args], s);
}

async function command(args: string[], s: Session): Promise<string> {
  const p = Bun.spawn(args, { env: s.env, cwd: s.root, stdout: "pipe", stderr: "pipe" });
  const timer = setTimeout(() => p.kill("SIGTERM"), 15000);
  try {
    const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
    const code = await p.exited;
    if (code !== 0) throw new Error(`${args[0]} failed (${code}); inspect native diagnostics`);
    s.log.push(err); return out;
  } finally { clearTimeout(timer); }
}

async function rpc(s: Session, method: string, params: object = {}): Promise<unknown> {
  const id = ++s.serial;
  const { promise, resolve, reject } = Promise.withResolvers<unknown>();
  const timer = setTimeout(() => { s.pending.delete(id); reject(new Error("termscope response timeout")); }, 10000);
  s.pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
  s.bridge!.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  s.bridge!.stdin.flush();
  return promise;
}

async function readReplies(s: Session): Promise<void> {
  let buffer = "";
  const decoder = new TextDecoder();
  try {
    for await (const chunk of s.bridge!.stdout) {
      s.stdout.push(chunk);
      buffer += decoder.decode(chunk, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        s.log.push(line);
        const response: unknown = JSON.parse(line);
        if (!response || typeof response !== "object" || !("id" in response) || typeof response.id !== "number") continue;
        const pending = s.pending.get(response.id);
        if (!pending) continue;
        s.pending.delete(response.id);
        if ("error" in response) pending.reject(new Error("termscope protocol error; inspect native log"));
        else if ("result" in response) pending.resolve(response.result);
        else pending.reject(new Error("termscope reply has no result"));
      }
    }
  } catch { s.log.push("termscope output could not be decoded"); }
  finally { for (const pending of s.pending.values()) pending.reject(new Error("Owned termscope session closed")); s.pending.clear(); }
}

async function startApplication(s: Session, plan: Plan): Promise<NonNullable<Evidence["terminal"]>> {
  if (s.started) return s.started;
  const t = plan.terminal!;
  await tmux(s, ["resize-window", "-t", `${s.name}:0`, "-x", String(t.columns), "-y", String(t.rows)]);
  // Both clients attach to this one fixed-size pane; neither creates another app.
  await rpc(s, "resize", { cols: t.columns, rows: t.rows });
  await tmux(s, ["respawn-pane", "-k", "-t", `${s.name}:0.0`, "-c", t.cwd, "/usr/bin/env", "--", ...t.command]);
  const pane = (await tmux(s, ["display-message", "-p", "-t", `${s.name}:0.0`, "#{pane_id} #{pane_tty}"])).trim().split(" ");
  const clients = (await tmux(s, ["list-clients", "-F", "#{client_pid}"])).trim().split("\n");
  let footPid = 0;
  for (const pid of clients) {
    const stat = await readFile(`/proc/${pid}/stat`, "utf8");
    const parent = Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1]);
    if ((await readFile(`/proc/${parent}/comm`, "utf8")).trim() === "foot") footPid = parent;
  }
  if (!footPid) throw new Error("Cannot bind the native foot client to the controlled tmux pane");
  const terminal: NonNullable<Evidence["terminal"]> = { session: s.name, socket: s.socket, pane: pane[0]!, tty: pane[1]!, display: s.display!, runtime: s.root, cagePid: s.cage!.pid, footPid, columns: t.columns, rows: t.rows, font: t.font, lineHeight: t.lineHeight, cleanup: "pending" };
  s.identities.push(terminal);
  s.started = terminal;
  return terminal;
}
