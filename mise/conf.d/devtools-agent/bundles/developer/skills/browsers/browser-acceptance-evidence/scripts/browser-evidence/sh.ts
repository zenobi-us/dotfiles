export type ShResult = { code: number; out: string; err: string };

/** Run a command and collect everything it printed. Never throws on a non-zero exit. */
export async function sh(cmd: string[], env: Record<string, string> = {}): Promise<ShResult> {
  const p = Bun.spawn(cmd, { env: { ...process.env, ...env }, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text()]);
  return { code: await p.exited, out, err };
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

/** Run a command body and turn its outcome into `process.exitCode`. */
export async function guard(work: () => Promise<number | void>): Promise<void> {
  try {
    process.exitCode = (await work()) ?? 0;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }
    console.error(`Error: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
