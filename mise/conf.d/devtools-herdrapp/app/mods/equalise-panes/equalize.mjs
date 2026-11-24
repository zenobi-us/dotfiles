// Update only split weights in the core's versioned Herdr layout document.
// Compare-and-swap refuses stale writes rather than overwriting concurrent edits.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export async function equalizeTabs(targets) {
  for (const machine of new Set(targets.map(target => target.machine))) {
    const core = connectCore();
    try {
      const params = { name: "herdr-app", ...(machine ? { on: machine } : {}) };
      const document = await core.request("doc.get", params);
      const wanted = new Set(targets.filter(target => target.machine === machine).map(target => target.tab));
      let changed = false;
      for (const space of document.value?.spaces ?? []) {
        for (const tab of space.tabs) {
          if (wanted.has(tab.id)) changed = equalizeTree(tab.root).changed || changed;
        }
      }
      if (changed) await core.request("doc.set", { ...params, version: document.version, value: document.value });
    } finally {
      core.close();
    }
  }
}

/** Perpendicular splits share an axis; parallel splits add their spans. */
export function equalizeTree(node) {
  if (node.type !== "row" && node.type !== "column") return { width: 1, height: 1, changed: false };
  const children = node.children ?? [];
  if (!children.length) return { width: 1, height: 1, changed: false };
  const spans = children.map(equalizeTree);
  const axis = node.type === "row" ? "width" : "height";
  const cross = node.type === "row" ? "height" : "width";
  const total = spans.reduce((sum, span) => sum + span[axis], 0);
  let changed = spans.some(span => span.changed);
  for (let index = 0; index < children.length; index++) {
    const weight = spans[index][axis] / total;
    if (children[index].size?.px !== undefined || Math.abs((children[index].size?.weight ?? 1) - weight) > 0.000001) {
      children[index].size = { weight };
      changed = true;
    }
  }
  return { [axis]: total, [cross]: Math.max(...spans.map(span => span[cross])), changed };
}

function connectCore() {
  const process = spawn("hc", ["connect"], { stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: process.stdout });
  const pending = new Map();
  let sequence = 0;
  let stderr = "";
  process.stderr.setEncoding("utf8").on("data", text => { stderr += text; });
  const fail = error => {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  process.on("error", fail);
  process.on("exit", code => fail(new Error(stderr.trim() || `hc connect exited (${code}).`)));
  lines.on("line", line => {
    try {
      const reply = JSON.parse(line);
      const request = pending.get(reply.id);
      if (!request) return;
      pending.delete(reply.id);
      if (reply.error) request.reject(new Error(reply.error.message));
      else request.resolve(reply.result);
    } catch (error) {
      fail(error);
    }
  });
  return {
    request(method, params) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        process.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      });
    },
    close() { lines.close(); process.stdin.end(); process.kill(); },
  };
}

if (import.meta.main) {
  try {
    await equalizeTabs(JSON.parse(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
