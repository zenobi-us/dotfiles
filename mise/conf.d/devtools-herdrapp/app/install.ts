// Install personal mods without editing Herdr's shipped files or replacing user preferences.
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const appHome = process.env.HERDR_APP_HOME ?? path.join(os.homedir(), ".config/herdr-app");
const source = path.join(import.meta.dir, "mods");
const ownLayout = "shared-context";
let runtimePath = process.env.PATH ?? "";

async function command(args: string[]) {
  const child = Bun.spawn(["herdr-app", ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code) throw new Error(stderr || stdout || `herdr-app returned ${code}.`);
  return stdout;
}
async function exists(file: string) { try { await fs.lstat(file); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; } }
async function installMod(name: string) {
  const from = path.join(source, name), to = path.join(appHome, "mods", name), marker = path.join(to, ".dotfiles-owner");
  if (await exists(to) && (!await exists(marker) || (await fs.readFile(marker, "utf8")) !== from)) throw new Error(`The existing ${name} mod is not managed by this installer.`);
  await fs.mkdir(to, { recursive: true });
  await fs.writeFile(marker, from);
  if (name === "shared-context") await fs.writeFile(path.join(to, ".runtime.json"), JSON.stringify({ binary: process.execPath, path: runtimePath }) + "\n");
  const entries = await fs.readdir(from, { withFileTypes: true });
  // Copy the entrypoint last so the final reload sees all imports.
  entries.sort((a, b) => Number(a.name === "main.js") - Number(b.name === "main.js"));
  for (const entry of entries) {
    if (entry.name === "mod.json") continue;
    const destination = path.join(to, entry.name), target = path.join(from, entry.name);
    const backend = entry.name.endsWith(".ts");
    if (await exists(destination)) {
      const stat = await fs.lstat(destination);
      if (stat.isSymbolicLink()) {
        if (await fs.readlink(destination) !== target) throw new Error(`The installer will not replace ${destination}.`);
        if (backend) continue;
        await fs.unlink(destination);
      } else if (backend) throw new Error(`The installer will not replace ${destination}.`);
    }
    // GPUI confines module imports to the mod directory. Only Bun entrypoints can be links.
    if (backend) await fs.symlink(target, destination);
    else await fs.cp(target, destination, { recursive: true });
  }
  const manifest = JSON.parse(await fs.readFile(path.join(from, "mod.json"), "utf8"));
  const file = path.join(to, "mod.json");
  if (await exists(file)) {
    const previous = JSON.parse(await fs.readFile(file, "utf8"));
    if (previous.settings) manifest.settings = previous.settings;
  }
  await fs.writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
}
interface LayoutNode {
  id?: string;
  children?: LayoutNode[];
  content?: { mod?: string;[key: string]: unknown };
  max?: number;
  [key: string]: unknown;
}
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function parseLayout(value: unknown): LayoutNode {
  if (!isObject(value)) throw new Error("The layout must be an object.");
  if (value.id !== undefined && typeof value.id !== "string") throw new Error("A layout node has an invalid ID.");
  if (value.children !== undefined && !Array.isArray(value.children)) throw new Error("Layout children must be an array.");
  if (value.content !== undefined && (!isObject(value.content) || value.content.mod !== undefined && typeof value.content.mod !== "string")) throw new Error("Layout content is invalid.");
  if (value.max !== undefined && typeof value.max !== "number") throw new Error("The layout maximum must be numeric.");
  return { ...value, id: value.id, children: value.children?.map(parseLayout), content: value.content, max: value.max };
}
function find(node: LayoutNode, id: string): LayoutNode | undefined { if (node.id === id) return node; for (const child of node.children ?? []) { const found = find(child, id); if (found) return found; } }

async function installBetterConfig() {
  const target = path.join(appHome, "mods/better-config");
  if (await exists(target)) { console.log("Keep the installed Better Config mod."); return; }
  const revision = "2bd4870634b8b0b86984651c98c30cf5be170e60";
  const base = `https://raw.githubusercontent.com/munza/herdr-mods/${revision}`;
  const files = ["main.js", "model.js", "mod.json", "mod.schema.json", "icons/check.svg", "icons/chevron-down.svg"];
  // Download before creating the live mod, so an interrupted fetch cannot leave a partial installation.
  const contents = await Promise.all([...files.map(file => `better-config/mods/better-config/${file}`), "LICENSE", "NOTICE"].map(async file => {
    const response = await fetch(`${base}/${file}`);
    if (!response.ok) throw new Error(`Cannot read Better Config ${file}: HTTP ${response.status}.`);
    return response.text();
  }));
  await fs.mkdir(path.join(target, "icons"), { recursive: true });
  for (let i = 0; i < files.length; i++) await fs.writeFile(path.join(target, files[i]!), contents[i]!);
  await fs.writeFile(path.join(target, "LICENSE"), contents[files.length]!);
  await fs.writeFile(path.join(target, "NOTICE"), contents[files.length + 1]!);
}

async function main() {
  let mq = Bun.which("mq");
  if (!mq) {
    const lookup = Bun.spawn(["mise", "which", "mq"], { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, code] = await Promise.all([new Response(lookup.stdout).text(), new Response(lookup.stderr).text(), lookup.exited]);
    if (code) throw new Error(stderr || "Install mq with mise before installing the panels.");
    mq = stdout.trim();
  }
  runtimePath = [path.dirname(process.execPath), path.dirname(mq), runtimePath].join(path.delimiter);
  const stop = Bun.spawn([process.execPath, path.join(source, "shared-context/bridge.ts"), "--stop", "--home", appHome], { stdout: "pipe", stderr: "pipe" });
  if (await stop.exited) throw new Error(await new Response(stop.stderr).text());
  for (const name of ["shared-context", "shared-context-tabs"]) await installMod(name);
  if (process.argv.includes("--better-config")) await installBetterConfig();
  const file = path.join(appHome, "layouts", `${ownLayout}.json`);
  if (!await exists(file)) {
    const status: unknown = JSON.parse(await command(["status"]));
    if (!isObject(status) || typeof status.layout !== "string") throw new Error("Herdr did not report an active layout.");
    await command(["do", "layout.clone", JSON.stringify({ name: status.layout, as: ownLayout })]);
  }
  const tree = parseLayout(JSON.parse(await fs.readFile(file, "utf8")));
  const tabs = find(tree, "tabs"), body = find(tree, "panel-body"), panel = find(tree, "panel");
  if (!tabs || !body || !panel) throw new Error("The active layout needs tabs, panel, and panel-body nodes. Select a main-based layout before installation.");
  if (tabs.content?.mod !== "shared-context-tabs" && find(tree, "tracker")) throw new Error("This layout already has a tracker node from another mod.");
  tabs.content = { ...tabs.content, mod: "shared-context-tabs" };
  body.children ??= [];
  for (const mode of ["context", "tracker"]) {
    if (!body.children.some(child => child.id === mode)) body.children.push({ id: mode, type: "block", content: { mod: "shared-context", props: { mode } } });
  }
  panel.max = Math.max(panel.max ?? 0, 1200);
  const temporary = `${file}.next`;
  await fs.writeFile(temporary, JSON.stringify(tree, null, 2) + "\n");
  await fs.rename(temporary, file);
  await command(["do", "layout.switch", JSON.stringify({ name: ownLayout })]);
  console.log(`Installed Context and Tracker in the ${ownLayout} layout. Files and Changes retain their current mods.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
