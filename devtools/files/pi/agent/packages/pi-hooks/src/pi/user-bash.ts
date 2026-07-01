import { randomUUID as nodeRandomUUID } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import type { ExtensionAPI, ExtensionContext, UserBashEvent, UserBashEventResult } from "@earendil-works/pi-coding-agent"

import { getPiHooksLogger } from "../core/logger.js"
import type { HooksRuntime } from "../core/runtime.js"

const ENABLE_USER_BASH_ENV = "PI_YAML_HOOKS_ENABLE_USER_BASH"

// Monotonic fallback counter used when crypto.randomUUID is unavailable.
let _monotonicCounter = 0

function generateCallId(): string {
  try {
    return nodeRandomUUID()
  } catch {
    return `fallback-${Date.now()}-${(_monotonicCounter += 1)}`
  }
}

// One-time warning tracking: warn once per process when user_bash is enabled.
let _userBashWarningEmitted = false
const _userBashUiWarningCwds = new Set<string>()

function emitUserBashWarningOnce(): void {
  if (_userBashWarningEmitted) return
  _userBashWarningEmitted = true

  const trustedProjects = readTrustedProjectsList()
  const projectList =
    trustedProjects.length > 0
      ? trustedProjects.map((p) => `  - ${p}`).join("\n")
      : "  (no projects currently in trusted-projects.json)"

  process.stderr.write(
    `[pi-hooks] WARNING: PI_YAML_HOOKS_ENABLE_USER_BASH=1 is set.\n` +
    `  Every human "!" / "!!" shell command typed in PI will be routed through\n` +
    `  tool.before.bash hooks before execution. Hooks in trusted projects can:\n` +
    `    - observe the full command text\n` +
    `    - block the command (exit code 2)\n` +
    `    - read tool_args from stdin JSON to exfiltrate command content via bash actions\n` +
    `  Trusted projects whose hooks will see your typed commands:\n` +
    `${projectList}\n` +
    `  Only enable this feature if you trust all hooks in the listed projects.\n`,
  )
}

function readTrustedProjectsList(): string[] {
  try {
    const homeDir = os.homedir()
    const trustFile = path.join(homeDir, ".pi", "agent", "trusted-projects.json")
    if (!existsSync(trustFile)) return []
    const raw = readFileSync(trustFile, "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is string => typeof entry === "string")
  } catch {
    return []
  }
}

export function registerUserBashInterception(
  pi: ExtensionAPI,
  options: {
    getRuntimeFor: (cwd: string) => HooksRuntime
    rememberContext: (cwd: string, ctx: ExtensionContext) => void
    getSessionId: (ctx: ExtensionContext) => string | undefined
  },
): void {
  if (process.env[ENABLE_USER_BASH_ENV] === "1") {
    emitUserBashWarningOnce()
  }

  pi.on("user_bash", async (event: UserBashEvent, ctx: ExtensionContext): Promise<UserBashEventResult | void> => {
    if (process.env[ENABLE_USER_BASH_ENV] !== "1") {
      return
    }

    // P1-9 fix: wrap the ENTIRE handler body in try/catch and fail closed on
    // any internal error. Previously only the runtime call was guarded, so an
    // exception from getRuntimeFor / rememberContext / getSessionId escaped
    // into the SDK's emitUserBash, which swallows handler errors and continues
    // execution unguarded. With the env-gate on, that meant the typed user
    // command would run without ever passing through tool.before.bash hooks.
    //
    // P1-10 fix: when sessionId is missing we previously bypassed silently;
    // now we emit a debug breadcrumb so operators can correlate "hook didn't
    // fire" reports with the cause.
    const logger = getPiHooksLogger()
    try {
      emitUserBashUiWarningOnce(ctx)
      try {
        options.rememberContext(ctx.cwd, ctx)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("user_bash_internal_error", "rememberContext threw inside user_bash handler.", {
          cwd: ctx.cwd,
          details: { error: message },
        })
        return cancelledInternalErrorResult(message)
      }

      let sessionId: string | undefined
      try {
        sessionId = options.getSessionId(ctx)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("user_bash_internal_error", "getSessionId threw inside user_bash handler.", {
          cwd: ctx.cwd,
          details: { error: message },
        })
        return cancelledInternalErrorResult(message)
      }

      if (!sessionId) {
        logger.debug("user_bash_bypassed", "user_bash interception bypassed because session id is missing.", {
          cwd: ctx.cwd,
          details: { reason: "missing_session_id" },
        })
        return
      }

      let runtime: HooksRuntime
      try {
        runtime = options.getRuntimeFor(ctx.cwd)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("user_bash_internal_error", "getRuntimeFor threw inside user_bash handler.", {
          cwd: ctx.cwd,
          sessionId,
          details: { error: message },
        })
        return cancelledInternalErrorResult(message)
      }

      try {
        await runtime["user.bash.before"](
          {
            tool: "bash",
            sessionID: sessionId,
            callID: `user-bash:${sessionId}:${generateCallId()}`,
          },
          {
            args: { command: event.command },
          },
        )
        return
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          result: {
            output: `[pi-hooks] user_bash blocked: ${message}`,
            exitCode: undefined,
            cancelled: true,
            truncated: false,
          },
        }
      }
    } catch (error) {
      // Defence-in-depth: any unexpected synchronous throw from the guarded
      // sections above (e.g. logger failure) must still fail closed instead
      // of letting the user command run unchecked.
      const message = error instanceof Error ? error.message : String(error)
      try {
        logger.error("user_bash_internal_error", "user_bash handler caught unexpected error.", {
          cwd: ctx.cwd,
          details: { error: message },
        })
      } catch {
        // ignore — we already failed closed below.
      }
      return cancelledInternalErrorResult(message)
    }
  })
}

function emitUserBashUiWarningOnce(ctx: ExtensionContext): void {
  if (!ctx.hasUI || _userBashUiWarningCwds.has(ctx.cwd)) return
  _userBashUiWarningCwds.add(ctx.cwd)
  ctx.ui.notify(
    "PI_YAML_HOOKS_ENABLE_USER_BASH=1 is routing typed shell commands through trusted project hooks for this session.",
    "warning",
  )
}

function cancelledInternalErrorResult(message: string): UserBashEventResult {
  return {
    result: {
      output: `[pi-hooks] internal error during user_bash interception: ${message}`,
      exitCode: undefined,
      cancelled: true,
      truncated: false,
    },
  }
}

// Exported for testing only.
export { generateCallId, emitUserBashWarningOnce as _emitUserBashWarningOnce, _monotonicCounter }
export function _resetUserBashWarningForTests(): void {
  _userBashWarningEmitted = false
  _userBashUiWarningCwds.clear()
}
