import * as fs from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { TerminalSession } from "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/pi-shared-context-ux-06-queues/artifacts/evidence/implementation-0017/native-rpc.mjs";

const config = JSON.parse(await fs.readFile(Bun.argv[2], "utf8"));
await fs.mkdir(config.evidenceDir, { recursive: true });
const commands = [];
let temporaryRoot;
let rpc;
let source;
let failure;
const observations = [];
const cleanup = {};
async function command(argv, cwd = config.worktree) {
  const process = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  const result = { argv, cwd, stdout, stderr, code };
  commands.push(result);
  if (code !== 0) throw new Error(`${argv[0]} exited ${code}: ${stderr}`);
  return result;
}
async function identity() {
  const tuple = (await command(["git", "rev-parse", "HEAD", "HEAD^{tree}"])).stdout.trim().split("\n");
  if ((await command(["git", "status", "--porcelain"])).stdout.trim()) throw new Error("Commit source before actual Pi smoke; checkout is not clean.");
  return tuple;
}
async function capture(name) {
  for (const format of ["text", "json", "html", "spans", "svg"]) {
    const snapshot = await rpc.call("snapshot", { format });
    await fs.writeFile(join(config.evidenceDir, name + "." + (format === "text" ? "txt" : format)), typeof snapshot.content === "string" ? snapshot.content : JSON.stringify(snapshot, null, 2));
  }
}
try {
  source = await identity();
  temporaryRoot = await fs.mkdtemp(join(tmpdir(), "ux06-queue-smoke-"));
  const repo = join(temporaryRoot, "repository");
  await fs.mkdir(repo, { recursive: true });
  const documents = [
    ["docs/agents/issue-tracker.md", "Config", { backend: "local-markdown", "issue-root": "tracker/tickets", "initiative-root": "tracker/initiatives" }, "Owned native acceptance tracker."],
    ["tracker/tickets/T.md", "enhancement", { schema: "tracker-ticket/v1", id: "T", title: "Native queue target Ω", work_status: "unclaimed", blocked_by: [], parent: "I" }, "Real queue fixture target."],
    ["tracker/initiatives/I/index.md", "Spec", { schema: "tracker-initiative/v1", id: "I", title: "Native queue initiative", phase: "research" }, "## Problem Statement\nObserve the queue surface.\n\n## Solution\nKeep canonical fields distinct.\n\n## Tickets\n- [Target](../../tickets/T.md)\n\n## Comments\nOwned fixture."],
  ];
  for (const [ref, type, fields, body] of documents) {
    const path = join(repo, ref);
    await fs.mkdir(dirname(path), { recursive: true });
    await command([config.mq, "--allow-http-import", "--lockfile", join(temporaryRoot, "mq.lock"), "-I", "null", "-F", "text", "--args", "body", body, "--output", path, `import "github.com/harehare/okf.mq" | okf::okf_new(${JSON.stringify(type)}, ${JSON.stringify(fields)}, body) | okf::okf_stringify(.)`]);
  }
  const records = [["alignment", "markdown", "repository"], ["tickets", "local-markdown", "repository"], ["initiatives", "markdown", "repository"], ["workflows", "files", "repository"], ["evidence", "files", "inherit:workflows"], ["sources", "files", "inherit:alignment"]];
  await fs.writeFile(join(repo, ".context-routes.toml"), "schema = 2\n\n" + records.map(([name, adapter, store]) => `[records.${name}]\nadapter = "${adapter}"\nstore = "${store}"\n`).join("\n"));
  await command(["git", "init", "-b", "master", "--quiet"], repo);
  await command(["git", "remote", "add", "origin", "https://github.com/native-validation/ticket06-queue.git"], repo);
  await command(["git", "add", "--all"], repo);
  await command(["git", "-c", "user.name=Native fixture", "-c", "user.email=native@example.invalid", "commit", "--quiet", "-m", "test: " + config.ticketRef + " native queue fixture"], repo);
  const home = join(temporaryRoot, "home");
  const piConfig = join(temporaryRoot, "pi");
  await fs.mkdir(home, { recursive: true });
  await fs.mkdir(piConfig, { recursive: true });
  const args = [config.mise, "exec", "--", "termscope", "session", "--cols", "120", "--rows", "40", "--", "env", `HOME=${home}`, `PI_CODING_AGENT_DIR=${piConfig}`, "PI_TELEMETRY=0", config.pi, "--offline", "--no-session", "--no-extensions", "--no-mcp", "--no-skills", "--no-prompt-templates", "--no-context-files", "--no-tools", "--no-themes", "--use-theme", "dark", "-e", join(config.worktree, "mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/index.ts")];
  rpc = new TerminalSession(args, repo);
  await rpc.call("wait_for_text", { pattern: "No models available", timeout: 15000 });
  await rpc.call("wait_for_idle", { duration: 200 });
  await rpc.call("type", { text: "/shared-context" });
  await rpc.call("wait_for_text", { pattern: "/shared-context", timeout: 10000 });
  await rpc.call("wait_for_idle", { duration: 200 });
  await rpc.call("press", { key: "RET" });
  await rpc.call("wait_for_text", { pattern: "Native queue initiative", timeout: 20000 });
  await rpc.call("press", { key: "8" });
  await rpc.call("wait_for_text", { pattern: "Native queue target", timeout: 10000 });
  await rpc.call("wait_for_idle", { duration: 200 });
  const queueFrame = (await rpc.call("snapshot", { format: "text" })).content;
  if (!/\b(?:Ticket\s+)?(?:status|state)\s*:\s*unclaimed\b/i.test(queueFrame) || !/\bNext(?:\s+action)?\b/i.test(queueFrame) || !/\b(?:Recorded|Activity|Workflow)\b/i.test(queueFrame)) throw new Error("Actual queue lacks canonical status, next-action or recorded-activity roles.");
  await capture("queue-all-120x40");
  observations.push({ state: "all_queue", canonical_ticket: "tracker/tickets/T.md", ticket_status: "unclaimed", field_roles_visible: true });
  await rpc.call("press", { key: "RET" });
  await rpc.call("wait_for_text", { pattern: "tracker/tickets/T.md", timeout: 10000 });
  await rpc.call("wait_for_idle", { duration: 200 });
  const detailFrame = (await rpc.call("snapshot", { format: "text" })).content;
  if (!detailFrame.includes("tracker/tickets/T.md") || !/\bI\b/.test(detailFrame)) throw new Error("Actual ticket detail lacks its canonical target or initiative context.");
  await capture("queue-ticket-detail");
  observations.push({ state: "canonical_ticket_open", canonical_ticket: "tracker/tickets/T.md", initiative: "I" });
  const crumbLine = detailFrame.split("\n").map(line => line.match(/^\[(\d+)\] (.*)$/)).find(match => match && match[2].includes("Queues"));
  if (!crumbLine) throw new Error("Actual Queues breadcrumb coordinates unavailable.");
  const mouse = { row: Number(crumbLine[1]), column: crumbLine[2].indexOf("Queues") + 2 };
  await rpc.call("type", { text: "\x1b[<0;" + mouse.column + ";" + mouse.row + "M\x1b[<0;" + mouse.column + ";" + mouse.row + "m" });
  observations.push({ state: "actual_terminal_mouse_input", encoding: "SGR left-button press/release", target: "Queues ancestor breadcrumb", ...mouse });

  await rpc.call("wait_for_idle", { duration: 200 });
  const returned = (await rpc.call("snapshot", { format: "text" })).content;
  if (!returned.includes("Native queue target") || !/\bqueues\b[^\n]*\ball\b/i.test(returned)) throw new Error("Return did not restore the selected All queue ticket.");
  await capture("queue-return");
  observations.push({ state: "queue_return", selected_ticket: "T", queue: "all", via: "actual SGR mouse ancestor click" });
  const after = await identity();
  if (after.join("\n") !== source.join("\n")) throw new Error("Source changed during native observation.");
} catch (error) {
  failure = String(error.stack ?? error);
  if (rpc) try { await capture("failure"); } catch { }
} finally {
  if (rpc) {
    try { cleanup.close = await rpc.call("close"); } catch (error) { cleanup.close_error = String(error); rpc.process.kill(); }
    rpc.process.stdin.end();
    cleanup.native_exit = await rpc.process.exited;
    cleanup.stderr = await rpc.stderr;
    await rpc.pump;
    await fs.writeFile(join(config.evidenceDir, "native-protocol.json"), JSON.stringify(rpc.ledger, null, 2) + "\n");
  }
  if (temporaryRoot) await fs.rm(temporaryRoot, { recursive: true, force: true });
  cleanup.temporary_root = temporaryRoot;
  cleanup.temporary_root_exists = temporaryRoot ? await fs.access(temporaryRoot).then(() => true, error => error.code === "ENOENT" ? false : Promise.reject(error)) : false;
  if (!failure && (cleanup.close?.exit_code !== 0 || cleanup.native_exit !== 0 || cleanup.temporary_root_exists)) failure = "Owned native process or fixture cleanup failed.";
  const result = { status: failure ? "failed" : "passed", error: failure ?? null, source_commit: source?.[0], source_tree: source?.[1], observations, cleanup, commands, limits: ["Actual offline Pi with production extension and real MQ fixture records; no model prompt or workflow action.", "This independent native run exercises real SGR mouse ancestor activation; the full colour/mono matrix is separately recorded.", "SVG fallback alone does not establish glyph or colour conformance."] };
  await fs.writeFile(join(config.evidenceDir, "native-smoke.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ status: result.status, source_commit: result.source_commit, observations: observations.length, error: result.error, evidence: config.evidenceDir }));
  if (failure) process.exitCode = 1;
}
