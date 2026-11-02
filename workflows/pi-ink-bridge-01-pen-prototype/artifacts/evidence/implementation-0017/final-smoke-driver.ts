// Only browser launching is intercepted. Tool execution, HTTP, PDF rendering,
// consent, source-sized result, and durable original all use production code.
import { spyOn } from "bun:test";
import * as cp from "node:child_process";
import { EventEmitter } from "node:events";
import { writeFile } from "node:fs/promises";
import extension from "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/mise/conf.d/devtools-omp/extensions/image-annotator/index.ts";
const root = `${import.meta.dirname}/final-smoke`;
type API = Parameters<typeof extension>[0];
let tool!: Parameters<API["registerTool"]>[0];
let stage = "pdf";
const launcher = spyOn(cp, "spawn").mockImplementation((_command, args) => {
  const child = Object.assign(new EventEmitter(), { unref() {} });
  queueMicrotask(() => {
    child.emit("spawn");
    const url = (args as string[]).at(-1)!;
    void writeFile(`${root}/${stage}-url.json`, JSON.stringify({ url }));
    console.log(`READY ${stage} ${url}`);
  });
  return child as cp.ChildProcess;
});
extension({ zod: { object() {}, enum() {}, string: () => ({ optional() {} }) },
  registerTool(value) { tool = value; }, registerCommand() {}, on() {}, sendUserMessage() {},
});
for (const current of ["pdf", "png"]) {
  stage = current;
  const result = await tool.execute(`implementation-0017-${stage}`, { action: "annotate", path: `${root}/source.png` }, undefined, undefined,
    { mode: "tui", cwd: root, ui: { notify: console.log } });
  const image = result.content.find((entry) => entry.type === "image");
  if (image) await writeFile(`${root}/${stage}-delivered.png`, Buffer.from(image.data, "base64"));
  await writeFile(`${root}/${stage}-tool-result.json`, JSON.stringify({ ...result,
    content: result.content.map((entry) => entry.type === "image" ? { ...entry, data: `[${Buffer.from(entry.data, "base64").length} bytes retained in ${stage}-delivered.png]` } : entry),
  }, null, 2));
  console.log(`DELIVERED ${stage} ${JSON.stringify(result.details)}`);
}
launcher.mockRestore();
console.log("SMOKE COMPLETE");
