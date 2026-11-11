import { tmpdir } from "node:os";

export type ShResult = { code: number; out: string; err: string };

const active = new Set<Bun.Subprocess>();

/** Stop in-flight CLI work on interruption; cleanup commands can still run. */
export function cancelDriverCommands(): void {
  for (const process of active) process.kill("SIGTERM");
}

/** Run a command and collect everything it printed. Never throws on a non-zero exit. */
export async function sh(cmd: string[], env: Record<string, string> = {}): Promise<ShResult> {
  const p = Bun.spawn(cmd, {
    env: { ...process.env, ...env }, stdout: "pipe", stderr: "pipe",
    cwd: cmd[0] === "surf" || cmd[0] === "playwright-cli" ? tmpdir() : undefined,
  });
  active.add(p);
  try {
    const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
    return { code: await p.exited, out, err };
  } finally {
    active.delete(p);
  }
}

/** A failure the CLI reports as a message and an exit code, not a stack trace. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
  }
}

export function die(message: string, exitCode = 1): never {
  throw new CliError(message, exitCode);
}
