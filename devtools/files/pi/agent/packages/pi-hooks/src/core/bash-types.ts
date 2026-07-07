import type { FileChange } from "./types.js"

export const DEFAULT_BASH_TIMEOUT = 60_000

export interface BashHookContext {
  readonly session_id: string
  readonly event: string
  readonly cwd: string
  readonly files?: readonly string[]
  readonly changes?: readonly FileChange[]
  readonly tool_name?: string
  readonly tool_args?: Record<string, unknown>
}

export interface BashExecutionRequest {
  readonly command: string
  readonly context: BashHookContext
  readonly projectDir: string
  readonly timeout?: number
}

export interface BashProcessResult {
  readonly command: string
  readonly stdout: string
  readonly stderr: string
  readonly durationMs: number
  readonly exitCode: number
  readonly signal: NodeJS.Signals | null
  readonly timedOut: boolean
  /**
   * True when stdout and/or stderr exceeded the byte cap configured via
   * PI_YAML_HOOKS_MAX_OUTPUT_BYTES (default 1 MiB) and was truncated. Hooks
   * inspecting captured output should treat the trailing content as a
   * partial view in that case. Optional so that existing mocks/fixtures
   * remain compatible; the executor always populates it as a boolean.
   */
  readonly outputTruncated?: boolean
  /**
   * True when the JSON-serialized hook context exceeded the stdin cap
   * configured via PI_YAML_HOOKS_MAX_STDIN_BYTES (default 256 KiB) and the
   * payload delivered to the bash process was a reduced placeholder.
   * Optional for the same reason as outputTruncated.
   */
  readonly stdinTruncated?: boolean
}

/**
 * Exit code returned by `executeBashHook` when the hook command times out.
 * Matches the GNU coreutils `timeout` convention so that consumers can
 * distinguish a timeout from a real exit-1 / exit-2 outcome.
 */
export const TIMEOUT_EXIT_CODE = 124

export type BashHookResultStatus = "success" | "failed" | "blocked" | "timed_out"

export interface BashHookResult extends BashProcessResult {
  readonly status: BashHookResultStatus
  readonly blocking: boolean
}
