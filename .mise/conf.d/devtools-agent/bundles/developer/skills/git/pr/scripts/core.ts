/**
 * Process helpers for this skill's scripts.
 *
 * No shell is ever involved: every command is spawned directly, so quoting, globbing and
 * environment expansion are JavaScript's job. Nothing here is installed; Bun runs it.
 */
import { accessSync, constants, statSync } from "node:fs";

export interface CaptureResult {
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
}

export interface CaptureOptions {
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
  /** "inherit" lets the child write straight to this process's stderr. */
  stderr?: "pipe" | "inherit";
}

function isExecutableFile(file: string): boolean {
  try {
    if (!statSync(file).isFile()) return false;
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Resolve `cmd` the way a shell would (PATH lookup). Returns null when it is not there. */
export function resolveCommand(cmd: string, env: Record<string, string | undefined> = process.env): string | null {
  if (cmd.includes("/")) return isExecutableFile(cmd) ? cmd : null;
  for (const dir of (env.PATH ?? "").split(":")) {
    if (!dir) continue;
    const candidate = `${dir}/${cmd}`;
    if (isExecutableFile(candidate)) return candidate;
  }
  return null;
}

export const has = (cmd: string): boolean => resolveCommand(cmd) !== null;

/**
 * Spawn `cmd` with `args` and no shell. Resolves for every outcome of a command that ran,
 * however bad. Rejects only when the command could not start.
 */
export async function captureResult(cmd: string, args: string[] = [], opts: CaptureOptions = {}): Promise<CaptureResult> {
  const { cwd, env, input, stderr = "pipe" } = opts;
  const resolved = resolveCommand(cmd, env ? { ...process.env, ...env } : process.env);
  if (!resolved) throw new Error(`command not found: ${cmd}`);

  const child = Bun.spawn([resolved, ...args.map(String)], {
    cwd,
    env: env ? { ...process.env, ...env } : undefined,
    stdin: input === undefined ? "ignore" : new TextEncoder().encode(input),
    stdout: "pipe",
    stderr,
  });

  const [out, err, code] = await Promise.all([
    new Response(child.stdout).text(),
    child.stderr instanceof ReadableStream ? new Response(child.stderr).text() : Promise.resolve(""),
    child.exited,
  ]);
  return { code, signal: child.signalCode ?? null, stdout: out, stderr: err };
}

/**
 * The root of the git repository the script was started in. Path arithmetic from the script's
 * own location cannot find it: this skill is installed outside the repository it acts on.
 * Falls back to the working directory when git is absent or the directory is not a repository.
 */
export function repoRoot(cwd: string = process.cwd()): string {
  const git = resolveCommand("git");
  if (!git) return cwd;
  const result = Bun.spawnSync([git, "rev-parse", "--show-toplevel"], { cwd, stdout: "pipe", stderr: "ignore" });
  if (result.exitCode !== 0) return cwd;
  return new TextDecoder().decode(result.stdout).trim() || cwd;
}
