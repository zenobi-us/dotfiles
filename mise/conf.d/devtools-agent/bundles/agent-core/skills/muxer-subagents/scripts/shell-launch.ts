// Shell muxers share quoting and process-exit signals, not terminal commands.
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { LaunchRequest } from "./modules/types.ts";

export function run(command: string, args: readonly string[], cwd?: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `${command} exited with status ${result.status}`);
  }
  return result.stdout.trim();
}

export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function shellLaunch(request: LaunchRequest): string {
  const { cwd, depth, runId, environment, promptFile: handoffFile } = request;
  const command = request.agent.argv.map(shellQuote).join(" ");
  return [
    `cd ${shellQuote(cwd)} || exit $?`,
    "umask 077",
    `run_id=${shellQuote(runId)}`,
    "emit_signal() {",
    `  ${shellQuote(process.execPath)} ${shellQuote(fileURLToPath(new URL("./signals.ts", import.meta.url)))} "$run_id" "$1" "\${2-}"`,
    "}",
    `cleanup() { rm -f ${shellQuote(handoffFile)}; rmdir ${shellQuote(dirname(handoffFile))} 2>/dev/null; }`,
    "trap 'emit_signal cancelled 130; cleanup; exit 130' INT",
    "trap 'emit_signal cancelled 143; cleanup; exit 143' TERM",
    "trap 'emit_signal cancelled 129; cleanup; exit 129' HUP",
    "trap 'emit_signal cancelled 131; cleanup; exit 131' QUIT",
    `export MUXER_SUBAGENT_DEPTH=${depth}`,
    ...Object.entries(environment).map(([key, value]) => `export ${key}=${shellQuote(value)}`),
    `${shellQuote(process.execPath)} ${shellQuote(fileURLToPath(new URL("./resources.ts", import.meta.url)))} "$run_id" "$$" || exit $?`,
    "emit_signal running || exit $?",
    `${command}`,
    "status=$?",
    "if [ \"$status\" -eq 0 ]; then emit_signal completed 0; else emit_signal failed \"$status\"; fi",
    "cleanup",
    "exit \"$status\"",
  ].join("\n");
}
