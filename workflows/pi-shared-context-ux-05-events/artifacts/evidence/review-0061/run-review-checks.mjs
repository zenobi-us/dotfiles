import * as fs from "node:fs/promises";
import { watch } from "node:fs";
import { dirname, join } from "node:path";

const config = JSON.parse(await fs.readFile(Bun.argv[2], "utf8"));
const commands = [];
let failure;
let axes = [];
try {
  await verifySource();
  for (const check of config.checks) {
    const child = Bun.spawn(check.argv, { cwd: config.worktree, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exit_code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    commands.push({ name: check.name, argv: check.argv, cwd: config.worktree, exit_code, stdout, stderr });
    console.log(JSON.stringify({ check: check.name, exit_code, summary: (stdout + "\n" + stderr).split("\n").filter(line => /\d+ pass|\d+ fail|expect\(\) calls|\"status\"/.test(line)).slice(-5) }));
  }
  // Wait on durable, exclusive axis receipts, not pane text or repeated model calls.
  axes = await Promise.all(config.axisReceipts.map(waitForReceipt));
  await verifySource();
} catch (error) {
  failure = String(error);
}
const nativeResult = await fs.readFile(join(config.evidenceDir, "native-check-result.json"), "utf8").then(JSON.parse).catch(() => null);
const result = { status: failure || commands.some(row => row.exit_code !== 0) || axes.some(row => row.status !== "completed") ? "failed" : "passed", error: failure ?? null, source_commit: config.sourceCommit, source_tree: config.sourceTree, commands, native_result: nativeResult, axes: axes.map(row => ({ receipt_id: row.receipt_id, status: row.status, verdict: row.verdict, axis_report: row.axis_report, findings: row.findings ?? [], limitations: row.limitations ?? [] })) };
await fs.writeFile(join(config.evidenceDir, "checks-result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, error: result.error, source_commit: result.source_commit, source_tree: result.source_tree, axes: result.axes, native_states: nativeResult?.observations, cleanup: nativeResult?.cleanup, evidence: config.evidenceDir }));
if (result.status !== "passed") process.exitCode = 1;

async function verifySource() {
  const child = Bun.spawn(["git", "rev-parse", "HEAD", "HEAD^{tree}"], { cwd: config.worktree, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code || stdout.trim() !== `${config.sourceCommit}\n${config.sourceTree}`) throw new Error("Review source identity changed: " + stderr);
}

function waitForReceipt(path) {
  return new Promise((resolve, reject) => {
    let closed = false;
    let reading = false;
    let again = false;
    let timer;
    const finish = (error, value) => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      watcher.close();
      error ? reject(error) : resolve(value);
    };
    const inspect = async () => {
      if (closed) return;
      if (reading) { again = true; return; }
      reading = true;
      try {
        const receipt = JSON.parse(await fs.readFile(path, "utf8"));
        if (receipt.source_commit !== config.sourceCommit || receipt.source_tree !== config.sourceTree) throw new Error("Axis reviewed another source: " + path);
        finish(null, receipt);
      } catch (error) {
        if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) finish(error);
      } finally {
        reading = false;
        if (again && !closed) { again = false; void inspect(); }
      }
    };
    const watcher = watch(dirname(path), () => void inspect());
    timer = setTimeout(() => finish(new Error("Independent axis receipt unavailable: " + path)), 600000);
    void inspect();
  });
}
