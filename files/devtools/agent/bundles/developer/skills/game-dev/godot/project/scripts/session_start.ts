#!/usr/bin/env -S mise x -- bun --install=fallback
import { dirname, join, resolve } from "node:path";

async function projectUp(start: string): Promise<string | null> {
  let dir = resolve(start);
  for (let i = 0; i <= 4; i++) {
    if (await Bun.file(join(dir, "project.godot")).exists()) return dir;
    const parent = dirname(dir); if (parent === dir) break; dir = parent;
  }
  return null;
}
async function card(file: string, marker: string): Promise<string> {
  const text = await Bun.file(file).text().catch(() => "");
  const start = `<!-- ${marker}-START -->`, end = `<!-- ${marker}-END -->`;
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  return a >= 0 && b > a ? text.slice(a + start.length, b).trim() : "";
}
async function main() {
  const project = await projectUp(process.cwd());
  if (!project) return;
  const root = resolve(import.meta.dir, "../../..");
  let payload = await card(join(root, "using-godot-prompter", "SKILL.md"), "SESSION-CARD");
  if (!payload) return;
  const features = (await Bun.file(join(project, "project.godot")).text()).match(/^config\/features=(.*)$/m)?.[1] ?? "";
  const quoted = [...features.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (quoted[0]) payload += `\n\nThis project targets **Godot ${quoted[0]}**.`;
  const context = `<GODOT-PROJECT-CONTEXT>\n${payload}\n</GODOT-PROJECT-CONTEXT>`;
  if (process.env.CURSOR_PLUGIN_ROOT) console.log(JSON.stringify({ additional_context: context }));
  else if (process.env.CLAUDE_PLUGIN_ROOT && !process.env.COPILOT_CLI) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context } }));
  else console.log(JSON.stringify({ additionalContext: context }));
}
if (import.meta.main) await main();
