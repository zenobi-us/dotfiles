// Apply authored files and JSON preferences without importing workspace or session state.
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export async function installConfiguration(appHome: string): Promise<void> {
  await installFonts(appHome);
  for (const relative of ["layouts/cli.json", "layouts/cli.svg", "themes/cli.json"]) {
    await atomicWrite(path.join(appHome, relative), await fs.readFile(path.join(import.meta.dir, "files", relative)));
  }
  const patches: Record<string, Record<string, unknown>> = JSON.parse(await fs.readFile(path.join(import.meta.dir, "preferences.json"), "utf8"));
  for (const [relative, patch] of Object.entries(patches)) {
    const file = path.join(appHome, relative);
    let current: unknown = {};
    try { current = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (!isObject(current)) throw new Error(`Expected a JSON object in ${relative}.`);
    await atomicWrite(file, JSON.stringify(mergePreferences(current, patch), null, 2) + "\n");
  }
}

export function mergePreferences(current: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const result = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isObject(value) ? mergePreferences(isObject(current[key]) ? current[key] : {}, value) : value;
  }
  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function atomicWrite(file: string, content: string | Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.next`;
  try {
    await fs.writeFile(temporary, content);
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function installFonts(appHome: string): Promise<void> {
  const fonts: { file: string; url: string; sha256: string }[] = JSON.parse(await fs.readFile(path.join(import.meta.dir, "fonts.json"), "utf8"));
  // Fetch and verify all missing files before changing the installed font set.
  const pending = await Promise.all(fonts.map(async font => {
    const destination = path.join(appHome, "fonts", font.file);
    try {
      if (createHash("sha256").update(await fs.readFile(destination)).digest("hex") === font.sha256) return null;
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const response = await fetch(font.url);
    if (!response.ok) throw new Error(`Cannot download ${font.file}: HTTP ${response.status}.`);
    const content = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(content).digest("hex") !== font.sha256) throw new Error(`The checksum for ${font.file} does not match fonts.json.`);
    return { destination, content };
  }));
  for (const font of pending) if (font) await atomicWrite(font.destination, font.content);
}

// Adopt an existing CLI clone only when every tracked file matches the captured source.
export async function matchesSource(from: string, to: string): Promise<boolean> {
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    if (["gpui-kit.d.ts", "jsconfig.json"].includes(entry.name)) continue;
    const original = path.join(from, entry.name), installed = path.join(to, entry.name);
    try {
      const stat = await fs.lstat(installed);
      if (stat.isSymbolicLink()) return false;
      if (entry.isDirectory()) {
        if (!stat.isDirectory() || !await matchesSource(original, installed)) return false;
      } else if (!(await fs.readFile(original)).equals(await fs.readFile(installed))) return false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }
  return true;
}
