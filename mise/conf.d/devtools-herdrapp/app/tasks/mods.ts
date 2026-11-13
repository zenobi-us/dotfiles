#!/usr/bin/env -S mise exec -- bun run --install=fallback
// Install pinned third-party Herdr-app mods. Keep existing installs; publish each new copy only when complete.
import { promises as fs } from "node:fs";
import path from "node:path";
import { appHome } from "./files";

// A text replacement in one installed file. Each `from` must occur exactly once, so a new pin fails loudly.
type Patch = { file: string; from: string; to: string };
type Mod = { name: string; repo: string; revision: string; folder: string; notices: string[]; patches?: Patch[] };

// Upstream lists folders with /bin/sh and creates them with mkdir -p; Windows has neither, so the dialog stays on Loading.
// The helpers take the upstream arguments unchanged, so the patches swap only the function name.
const herdrImport = String.raw`import { appHome, home, exec, readTextFile, writeTextFile, theme, props, closeOverlay, run } from "herdr";`;
const windowsHelpers = String.raw`
// Windows: list and create folders with cmd, since /bin/sh and mkdir -p don't exist there.
const onWindows = () => window().platform === "windows";
const windowsPath = (file) => file.replace(/\//g, "\\");
const listFolders = (command, args) => onWindows()
  ? exec("cmd", ["/d", "/c", "dir", "/b", "/ad", windowsPath(args[3])]).then((r) => ({ ...r, stdout: r.stdout.replace(/\r/g, "") }))
  : exec(command, args);
const makeFolder = (args) => onWindows() ? exec("cmd", ["/d", "/c", "mkdir", windowsPath(args[1])]) : exec("mkdir", args);`;
const betterConfigWindows: Patch[] = [
  { file: "main.js", from: herdrImport, to: herdrImport.replace("run }", "run, window }") + windowsHelpers },
  { file: "main.js", from: `await exec("/bin/sh", `, to: `await listFolders("/bin/sh", ` },
  { file: "main.js", from: `await exec("mkdir", `, to: `await makeFolder(` },
];

const herdrMods = { repo: "munza/herdr-mods", revision: "ffbdb6d36d28e2d2bda4705fd7eca5bf7d283c2b", notices: ["LICENSE", "NOTICE"] };
const gitGraph = { repo: "rabeeh-ta/herdr-git-graph", revision: "0da886243b2e27a6068d6adb7c5c26f349cdc04e", notices: ["LICENSE"] };

export const mods: Mod[] = [
  { name: "better-config", folder: "better-config/mods/better-config", ...herdrMods, patches: betterConfigWindows },
  { name: "better-sidebar", folder: "better-sidebar/mods/better-sidebar", ...herdrMods },
  { name: "better-tabs", folder: "better-tabs/mods/better-tabs", ...herdrMods },
  { name: "git-graph", folder: "mods/git-graph", ...gitGraph },
];

const headers = { "User-Agent": "dotfiles-herdrapp-mods" };

async function exists(file: string): Promise<boolean> {
  try {
    await fs.lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

// Every file under the mod folder at the pinned revision, mapped to its path inside the installed mod.
async function sources(mod: Mod): Promise<Map<string, string>> {
  const response = await fetch(`https://api.github.com/repos/${mod.repo}/git/trees/${mod.revision}?recursive=1`, { headers });
  if (!response.ok) throw new Error(`Cannot list ${mod.repo}@${mod.revision}: HTTP ${response.status}.`);
  const tree = (await response.json()) as { truncated: boolean; tree: { path: string; type: string }[] };
  if (tree.truncated) throw new Error(`The ${mod.repo} file list is truncated.`);
  const files = new Map<string, string>();
  for (const entry of tree.tree) {
    if (entry.type === "blob" && entry.path.startsWith(`${mod.folder}/`)) files.set(entry.path, entry.path.slice(mod.folder.length + 1));
  }
  if (!files.has(`${mod.folder}/main.js`)) throw new Error(`${mod.repo}@${mod.revision} has no ${mod.folder}/main.js.`);
  for (const notice of mod.notices) files.set(notice, notice);
  return files;
}

async function install(mod: Mod): Promise<void> {
  const target = path.join(appHome, "mods", mod.name);
  if (await exists(target)) {
    console.log(`Keep the installed ${mod.name} mod.`);
    return;
  }
  const base = `https://raw.githubusercontent.com/${mod.repo}/${mod.revision}`;
  const files = [...(await sources(mod))];
  const contents = await Promise.all(files.map(async ([source]) => {
    const response = await fetch(`${base}/${source}`, { headers });
    if (!response.ok) throw new Error(`Cannot read ${mod.name} ${source}: HTTP ${response.status}.`);
    return new Uint8Array(await response.arrayBuffer());
  }));
  for (const patch of mod.patches ?? []) {
    const index = files.findIndex(([, file]) => file === patch.file);
    if (index < 0) throw new Error(`${mod.name} has no ${patch.file} to patch.`);
    const text = new TextDecoder().decode(contents[index]);
    if (text.split(patch.from).length !== 2) throw new Error(`${mod.name} ${patch.file} no longer matches its patch: ${patch.from}`);
    contents[index] = new TextEncoder().encode(text.replace(patch.from, () => patch.to));
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = await fs.mkdtemp(`${target}.next-`);
  try {
    for (const [index, [, file]] of files.entries()) {
      const destination = path.join(temporary, file);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, contents[index]!);
    }
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
  console.log(`Installed the pinned ${mod.name} mod.`);
}

if (import.meta.main) {
  for (const mod of mods) await install(mod);
}
