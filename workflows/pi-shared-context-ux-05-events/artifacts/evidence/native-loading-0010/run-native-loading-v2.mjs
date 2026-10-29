// Holds real workflow reads behind flock, then releases them. Pi renders the
// production extension throughout; neither the loader nor its output is mocked.
import * as fs from "node:fs/promises";
import { watch } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const config = JSON.parse(await fs.readFile(Bun.argv[2], "utf8"));
const observations = [];
const commands = [];
const sessions = [];
const cleanup = [];
let temporaryRoot;
let stage = "initialization";
let failure;

async function main() {
try {
  await verifySource();
  temporaryRoot = await fs.mkdtemp(join(tmpdir(), "ux05-loading-check-"));
  const repo = join(temporaryRoot, "repository");
  const bin = join(temporaryRoot, "bin");
  await fs.mkdir(repo, { recursive: true });
  await fs.mkdir(bin, { recursive: true });
  const seed = JSON.parse(await fs.readFile(config.seed, "utf8"));
  for (const row of seed.filter(row => ["docs/agents/issue-tracker.md", "tracker/tickets/T.md", "tracker/initiatives/I/index.md"].includes(row[0]))) {
    const properties = { ...row[2] };
    let body = row[3];
    if (row[0] === "tracker/tickets/T.md") properties.title = "Loading target T";
    if (row[0] === "tracker/initiatives/I/index.md") {
      properties.title = "Loading initiative";
      body = "## Problem Statement\nObserve real workflow loading.\n\n## Solution\nKeep history loading distinct.\n\n## Tickets\n- [Target](../../tickets/T.md)\n\n## Comments\nOwned native fixture.";
    }
    const destination = join(repo, row[0]);
    await fs.mkdir(dirname(destination), { recursive: true });
    await command([config.mq, "--allow-http-import", "-I", "null", "-F", "text", "--args", "body", body, "--output", destination,
      `import "github.com/harehare/okf.mq" | okf::okf_new(${JSON.stringify(row[1])}, ${JSON.stringify(properties)}, body) | okf::okf_stringify(.)`]);
  }
  const routes = "schema = 2\n\n" + [
    ["alignment", "markdown", "repository"], ["tickets", "local-markdown", "repository"],
    ["initiatives", "markdown", "repository"], ["workflows", "files", "repository"],
    ["evidence", "files", "inherit:workflows"], ["sources", "files", "inherit:alignment"],
  ].map(([name, adapter, store]) => `[records.${name}]\nadapter = "${adapter}"\nstore = "${store}"\n`).join("\n");
  await fs.writeFile(join(repo, ".context-routes.toml"), routes);
  await command(["git", "init", "-b", "master", "--quiet"], repo);
  await command(["git", "remote", "add", "origin", "https://github.com/native-validation/ticket05-loading.git"], repo);
  await command(["git", "add", "--all"], repo);
  await command(["git", "-c", "user.name=Native fixture", "-c", "user.email=native@example.invalid", "commit", "--quiet", "-m", `test: ${config.ticketRef} loading fixture`], repo);
  const [commit, tree] = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"], repo)).stdout.trim().split("\n");
  const eventRoot = join(repo, "workflows", "T", "events");
  await fs.mkdir(eventRoot, { recursive: true });
  for (const [index, id, phase, verdict] of [[0, "implementation-record", "implementation", undefined], [1, "review-rejected", "review", "FAILURE"]]) {
    const ref = `workflows/T/events/${id}.json`;
    const receipt = {
      schema: "worktree-receipt/v1", receipt_id: id, workflow_id: "T", phase, attempt: 1,
      parent_receipt: index ? "implementation-record" : null, repository: repo,
      worktree: repo, workspace_path: repo, source_branch: "master", base_branch: "master",
      source_commit: commit, source_tree: tree, created_at: new Date(Date.now() - 2000 + index * 1000).toISOString(),
      muxer: "native-fixture", pane_id: "offline-pi", agent: "pi", session_id: null,
      ticket: { id: "T", backend: "local-markdown", ref: "tracker/tickets/T.md" }, ticket_ref: "tracker/tickets/T.md",
      workflow: { root: repo, store: "repository", ref: "workflows/T" },
      evidence: { store: "repository", ref: "workflows/T/artifacts/evidence/fixture" },
      event: "phase-result", status: "completed", verdict,
      inputs: [{ kind: "ticket", ref: "tracker/tickets/T.md" }], outputs: [{ kind: "receipt", ref }],
      summary: index ? "Recorded review found a required change." : "Recorded implementation body.",
    };
    await fs.writeFile(join(eventRoot, `${id}.json`), JSON.stringify(receipt, null, 2) + "\n");
  }
  const mono = JSON.parse(await fs.readFile(config.monoTheme, "utf8"));
  if (typeof mono.name !== "string") throw new Error("Recorded monochrome theme has no name.");
  const wrapper = `#!/bin/sh\nfor arg do\n  case "$arg" in\n    "$LOADING_EVENT_ROOT"/*)\n      printf '%s\\n' "$arg" >> "$LOADING_GATE_SEEN"\n      exec /usr/bin/flock -s "$LOADING_GATE_LOCK" ${shellQuote(config.mq)} "$@"\n      ;;\n  esac\ndone\nexec ${shellQuote(config.mq)} "$@"\n`;
  await fs.writeFile(join(bin, "mq"), wrapper, { mode: 0o755 });

  for (const mode of ["color", "mono"]) {
    stage = `${mode}: launch`;
    const lock = join(temporaryRoot, `${mode}.lock`);
    const seen = join(temporaryRoot, `${mode}.seen`);
    const gate = Bun.spawn(["/usr/bin/flock", "-x", lock, "/bin/sh", "-c", "printf 'LOCKED\\n'; cat >/dev/null"], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
    let rpc;
    let released = false;
    try {
      const gateReader = gate.stdout.getReader();
      const gateReady = await gateReader.read();
      gateReader.releaseLock();
      if (!new TextDecoder().decode(gateReady.value).includes("LOCKED")) throw new Error("Loading gate did not acquire its lock.");
      const home = join(temporaryRoot, mode, "home");
      const piConfig = join(temporaryRoot, mode, "pi");
      await fs.mkdir(home, { recursive: true });
      await fs.mkdir(piConfig, { recursive: true });
      const args = [config.mise, "exec", "--", "termscope", "session", "--cols", "120", "--rows", "40", "--", "env",
        `HOME=${home}`, `PI_CODING_AGENT_DIR=${piConfig}`, "PI_TELEMETRY=0", `PATH=${bin}:${process.env.PATH}`,
        `LOADING_EVENT_ROOT=${eventRoot}`, `LOADING_GATE_LOCK=${lock}`, `LOADING_GATE_SEEN=${seen}`,
        config.pi, "--offline", "--no-session", "--no-extensions", "--no-mcp", "--no-skills", "--no-prompt-templates", "--no-context-files", "--no-tools", "--no-themes"];
      if (mode === "mono") args.push("--theme", config.monoTheme, "--use-theme", mono.name);
      else args.push("--use-theme", "dark");
      args.push("-e", join(config.worktree, "mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts"));
      rpc = new TerminalSession(args, repo);
      sessions.push(rpc);
      await rpc.call("wait_for_idle", { duration: 800 });
      await rpc.call("type", { text: "/shared-context" });
      await rpc.call("press", { key: "RET" });
      await rpc.call("wait_for_text", { pattern: "Loading initiative", timeout: 15000 });
      const heldRead = waitForFile(seen);
      void heldRead.catch(() => {});
      for (let step = 0; step < 3; step++) {
        await rpc.call("press", { key: "RET" });
        await rpc.call("wait_for_idle", { duration: 200 });
      }
      await rpc.call("wait_for_text", { pattern: "Loading history", timeout: 10000 });
      await heldRead;
      for (const [cols, rows] of [[40, 12], [80, 24], [120, 40]]) {
        stage = `${mode}: loading ${cols}x${rows}`;
        await rpc.call("resize", { cols, rows });
        await rpc.call("wait_for_idle", { duration: 150 });
        let frame;
        for (let page = 0; page < 4; page++) {
          frame = await rpc.call("snapshot", { format: "text" });
          if (frame.content.includes("Loading history")) break;
          await rpc.call("press", { key: "<next>" });
          await rpc.call("wait_for_idle", { duration: 100 });
        }
        if (!frame?.content.includes("Loading history") || !frame.content.includes("Ticket: T")) throw new Error(`Loading and canonical ticket not visible at ${mode} ${cols}x${rows}.`);
        await capture(rpc, `${mode}-loading-${cols}x${rows}`);
        observations.push({ mode, cols, rows, state: "loading", label: "Loading history…", canonicalTicket: "T", realReadHeld: true });
      }
      stage = `${mode}: release`;
      gate.stdin.end();
      released = true;
      const gateExit = await gate.exited;
      if (gateExit !== 0) throw new Error("Loading gate did not release cleanly.");
      await rpc.call("wait_for_text", { pattern: "review-rejected", timeout: 15000 });
      await rpc.call("wait_for_idle", { duration: 200 });
      const ready = await rpc.call("snapshot", { format: "text" });
      if (!ready.content.includes("Ticket: T") || ready.content.includes("Loading history")) throw new Error("Released history did not retain the canonical ticket.");
      await capture(rpc, `${mode}-history-released`);
      observations.push({ mode, cols: 120, rows: 40, state: "ready", canonicalTicket: "T", event: "review-rejected" });
    } catch (error) {
      if (rpc) await capture(rpc, `${mode}-failure`).catch(() => {});
      throw error;
    } finally {
      if (!released) gate.stdin.end();
      const gateExit = await gate.exited;
      if (rpc) {
        const close = await rpc.call("close").catch(error => ({ error: String(error) }));
        if (close.error) rpc.process.kill();
        const exit = await rpc.process.exited;
        await rpc.pump;
        cleanup.push({ mode, gateExit, nativeExit: exit, close });
      } else cleanup.push({ mode, gateExit });
    }
  }
  await verifySource();
  if (observations.filter(row => row.state === "loading").length !== 6 || cleanup.some(row => row.nativeExit !== 0 || row.gateExit !== 0)) throw new Error("Native matrix or cleanup did not complete.");
} catch (error) {
  failure = String(error);
} finally {
  for (const session of sessions) await fs.writeFile(join(config.evidenceDir, `protocol-${sessions.indexOf(session)}.json`), JSON.stringify(session.ledger, null, 2) + "\n");
  if (temporaryRoot) await fs.rm(temporaryRoot, { recursive: true });
  const result = { status: failure ? "failed" : "passed", stage, error: failure ?? null, source_commit: config.expectedCommit, source_tree: config.expectedTree,
    observations, cleanup, temporary_root_removed: temporaryRoot, commands, limits: ["No provider prompt or workflow action was sent.", "Native text/JSON/HTML/spans/SVG are retained; SVG fallback glyphs do not prove glyph or colour conformance.", "This check covers loading and release only; unchanged source inherits the earlier147-test/compiler and other acceptance evidence."] };
  await fs.writeFile(join(config.evidenceDir, "native-check-result.json"), JSON.stringify(result, null, 2) + "\n");
  if (!failure && config.resultReceipt) {
    const receipt = {
      ...config.resultReceipt.template,
      receipt_id: "validation-0011", parent_receipt: "validation-start-0010",
      event: "phase-result", status: "completed", created_at: new Date().toISOString(),
      session_id: config.resultReceipt.sessionId,
      program_sha256: config.resultReceipt.programSha256,
      command: { argv: [process.execPath, Bun.argv[1], Bun.argv[2]], cwd: config.worktree, exit_code: 0 },
      observations, cleanup, source_unchanged: true, open_questions: [],
      inherited_checks: {
        ref: "workflows/pi-shared-context-ux-05-events/events/implementation-0002.json",
        note: "147 tests and scoped compiler checks are inherited from the unchanged exact source, not rerun here.",
      },
      inputs: [
        { kind: "receipt", ref: "workflows/pi-shared-context-ux-05-events/events/validation-start-0010.json" },
        { kind: "artifact", ref: config.resultReceipt.programRef },
      ],
      outputs: [
        { kind: "receipt", ref: "workflows/pi-shared-context-ux-05-events/events/validation-0011.json" },
        { kind: "evidence", ref: config.resultReceipt.evidenceRef + "/native-check-result.json" },
        ...observations.map(row => ({ kind: "evidence", ref: config.resultReceipt.evidenceRef + "/" + row.mode + (row.state === "loading" ? `-loading-${row.cols}x${row.rows}` : "-history-released") + ".txt" })),
      ],
    };
    const output = await fs.open(config.resultReceipt.path, "wx");
    try { await output.writeFile(JSON.stringify(receipt, null, 2) + "\n"); } finally { await output.close(); }
    for (const name of ["color-loading-40x12", "mono-loading-40x12", "color-history-released"]) {
      console.log(`\nOBSERVED ${name}\n` + await fs.readFile(join(config.evidenceDir, name + ".txt"), "utf8"));
    }
  }
  console.log(JSON.stringify({ status: result.status, stage, error: result.error, loadingFrames: observations.filter(row => row.state === "loading").length, releasedFrames: observations.filter(row => row.state === "ready").length, evidence: config.evidenceDir }));
  if (failure) process.exitCode = 1;
}
}

async function command(argv, cwd = config.worktree) {
  const child = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  const result = { argv, cwd, code, stdout, stderr };
  commands.push(result);
  if (code !== 0) throw new Error(`${argv[0]} failed with exit ${code}: ${stderr}`);
  return result;
}

async function verifySource() {
  const identity = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"], config.worktree)).stdout.trim().split("\n");
  if (identity[0] !== config.expectedCommit || identity[1] !== config.expectedTree) throw new Error("Source identity changed.");
}

async function capture(rpc, name) {
  for (const format of ["text", "json", "html", "spans", "svg"]) {
    const snap = await rpc.call("snapshot", { format });
    await fs.writeFile(join(config.evidenceDir, `${name}.${format === "text" ? "txt" : format}`), typeof snap.content === "string" ? snap.content : JSON.stringify(snap, null, 2));
  }
}

function shellQuote(value) { return "'" + value.replaceAll("'", "'\\''") + "'"; }

function waitForFile(path) {
  return new Promise((resolve, reject) => {
    let timer;
    const watcher = watch(dirname(path), () => inspect());
    const finish = error => { watcher.close(); clearTimeout(timer); error ? reject(error) : resolve(); };
    const inspect = async () => { try { if ((await fs.stat(path)).size > 0) finish(); } catch (error) { if (error.code !== "ENOENT") finish(error); } };
    timer = setTimeout(() => finish(new Error("No real workflow read reached the gate.")), 15000);
    void inspect();
  });
}

class TerminalSession {
  constructor(argv, cwd) {
    this.process = Bun.spawn(argv, { cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
    this.ledger = [{ launch: { argv, cwd } }];
    this.pending = new Map();
    this.id = 0;
    this.stderr = new Response(this.process.stderr).text();
    this.pump = this.consume();
  }
  async call(method, params = {}) {
    const id = ++this.id;
    const request = { id, method, params };
    this.ledger.push({ request });
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Native RPC timed out: ${method}`)); }, 25000);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.process.stdin.write(JSON.stringify(request) + "\n");
    await this.process.stdin.flush();
    return promise;
  }
  async consume() {
    let buffer = "";
    for await (const bytes of this.process.stdout) {
      buffer += new TextDecoder().decode(bytes);
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        if (!line.trim()) continue;
        const response = JSON.parse(line);
        this.ledger.push({ response });
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id); clearTimeout(pending.timer);
          response.error ? pending.reject(new Error(JSON.stringify(response.error))) : pending.resolve(response.result);
        }
      }
    }
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Native process ended.")); }
    this.pending.clear();
  }
}

await main();
