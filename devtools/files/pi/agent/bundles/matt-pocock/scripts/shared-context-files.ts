import { spawnSync } from "node:child_process";
import { resolveMattPocockContext } from "../extensions/shared-context";

type CommandResult = { stdout: string; stderr: string; code: number };
type Exec = (command: string, args: string[]) => Promise<CommandResult>;

const execute: Exec = async (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr || result.error?.message || "",
    code: result.status ?? 1,
  };
};

export async function listSharedContextFiles(
  cwd: string,
  exec: Exec = execute,
  sharedContextBase?: string,
): Promise<CommandResult> {
  const context = sharedContextBase
    ? await resolveMattPocockContext(exec, cwd, sharedContextBase)
    : await resolveMattPocockContext(exec, cwd);
  if (!context) return { stdout: "", stderr: "", code: 0 };

  return exec("fd", [
    "--type", "f",
    "--hidden",
    "--absolute-path",
    "--exclude", ".git",
    "--exclude", ".DS_Store",
    "--exclude", ".env.local",
    ".",
    context.root,
  ]);
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  try {
    const result = await listSharedContextFiles(process.cwd());
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.code;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}