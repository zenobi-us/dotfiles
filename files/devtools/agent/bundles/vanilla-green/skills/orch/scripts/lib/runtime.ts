import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const scriptDir = dirname(fileURLToPath(import.meta.url));
export const skillDir = resolve(scriptDir, "..");

export function projectRoot(start = process.cwd()): string {
  const result = Bun.spawnSync(["git", "-C", start, "rev-parse", "--show-toplevel"], { stdout: "pipe", stderr: "ignore" });
  return result.exitCode === 0 ? new TextDecoder().decode(result.stdout).trim() : start;
}

export function run(command: string[], options: { cwd?: string; env?: Record<string, string | undefined>; stdin?: string } = {}) {
  const proc = Bun.spawnSync(command, { cwd: options.cwd, env: options.env, stdin: options.stdin, stdout: "pipe", stderr: "pipe" });
  return { code: proc.exitCode, stdout: new TextDecoder().decode(proc.stdout), stderr: new TextDecoder().decode(proc.stderr) };
}

export async function runAsync(command: string[], options: { cwd?: string; env?: Record<string, string | undefined>; timeout?: number } = {}) {
  const proc = Bun.spawn(command, { cwd: options.cwd, env: options.env, stdout: "pipe", stderr: "pipe" });
  const timer = options.timeout ? setTimeout(() => proc.kill(), options.timeout) : undefined;
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  if (timer) clearTimeout(timer);
  return { code, stdout, stderr };
}

export function parseTomlEnv(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of [join(root, "vstack.settings.toml"), join(root, ".env.local")]) {
    const text = existsSync(path) ? requireText(path) : "";
    if (path.endsWith(".toml")) {
      for (const line of text.split("\n")) {
        const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*["']?([^"'#\r\n]*)/);
        if (match) out[match[1]] = match[2].trim();
      }
    } else {
      for (const line of text.split("\n")) {
        const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (match) out[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    }
  }
  return out;
}
function requireText(path: string): string { return readTextSync(path); }
function readTextSync(path: string): string { return readFileSync(path, "utf8"); }
export function envValue(root: string, key: string, fallback = ""): string { return process.env[key] ?? parseTomlEnv(root)[key] ?? fallback; }

export function json(value: unknown): void { console.log(JSON.stringify(value)); }
export function fail(message: string, code = 1): never { console.error(message); process.exit(code); }
export function usage(text: string): never { console.log(text); process.exit(0); }
export function getPath(value: any, path: string): any {
  if (path === "." || path === "") return value;
  return path.replace(/^\./, "").split(".").reduce((v, key) => v?.[key], value);
}
export function setPath(value: any, path: string, next: any): void {
  const keys = path.replace(/^\./, "").split("."); let cursor = value;
  for (const key of keys.slice(0, -1)) cursor = cursor[key] ??= {};
  cursor[keys.at(-1)!] = next;
}
export async function atomicJson(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.${process.pid}.tmp`;
  await Bun.write(tmp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tmp, path);
}
export function epoch(): number { return Math.floor(Date.now() / 1000); }
