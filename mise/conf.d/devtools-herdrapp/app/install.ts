// Install the CLI interface and personal panels without changing the selected layout.
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { installConfiguration, matchesSource } from "./configuration";

const appHome = process.env.HERDR_APP_HOME ?? path.join(os.homedir(), ".config/herdr-app");
const source = path.join(import.meta.dir, "mods");
let runtimePath = process.env.PATH ?? "";

async function exists(file: string) { try { await fs.lstat(file); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; } }
async function installMod(name: string) {
  const from = path.join(source, name), to = path.join(appHome, "mods", name), marker = path.join(to, ".dotfiles-owner");
  if (await exists(to)) {
    if (await exists(marker)) {
      if ((await fs.readFile(marker, "utf8")) !== from) throw new Error(`The existing ${name} mod belongs to another installer.`);
    } else if (!name.startsWith("cli-") || !await matchesSource(from, to)) {
      throw new Error(`The existing ${name} mod differs from dotfiles. Save its changes before installation.`);
    }
  }
  await fs.mkdir(to, { recursive: true });
  await fs.writeFile(marker, from);
  if (name === "shared-context") await fs.writeFile(path.join(to, ".runtime.json"), JSON.stringify({ binary: process.execPath, path: runtimePath }) + "\n");
  // Herdr generates these editor files. Keep the installed copies and any local editor changes.
  const entries = (await fs.readdir(from, { withFileTypes: true })).filter(entry => entry.name !== "gpui-kit.d.ts" && entry.name !== "jsconfig.json");
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
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory()) await installMod(entry.name);
  }
  if (process.argv.includes("--better-config")) await installBetterConfig();
  await installConfiguration(appHome);
  console.log("Installed the CLI interface, fonts, and preferences. The selected layout is unchanged.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
