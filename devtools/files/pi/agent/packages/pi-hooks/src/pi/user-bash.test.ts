import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import type {
  ExtensionAPI,
  ExtensionContext,
  UserBashEvent,
  UserBashEventResult,
} from "@earendil-works/pi-coding-agent"

import { resetPiHooksLoggerForTests } from "../core/logger.js"
import type { HooksRuntime } from "../core/runtime.js"
import {
  generateCallId,
  registerUserBashInterception,
  _resetUserBashWarningForTests,
  _emitUserBashWarningOnce,
} from "./user-bash.js"

interface Case {
  readonly name: string
  readonly run: () => { ok: boolean; detail?: string } | Promise<{ ok: boolean; detail?: string }>
}

// Captures the handler the production code registers via pi.on("user_bash", ...)
// so tests can invoke it directly with synthetic events and contexts.
type UserBashHandler = (
  event: UserBashEvent,
  ctx: ExtensionContext,
) => Promise<UserBashEventResult | void>

function createPiStub(): { pi: ExtensionAPI; getHandler(): UserBashHandler } {
  let registered: UserBashHandler | undefined
  const pi = {
    on: (event: string, handler: unknown): void => {
      if (event === "user_bash") {
        registered = handler as UserBashHandler
      }
    },
  } as unknown as ExtensionAPI
  return {
    pi,
    getHandler(): UserBashHandler {
      if (!registered) throw new Error("user_bash handler not registered")
      return registered
    },
  }
}

function fakeContext(cwd = "/tmp/pi-hooks-test"): ExtensionContext {
  return { cwd } as unknown as ExtensionContext
}

function fakeEvent(command = "echo hi"): UserBashEvent {
  return {
    type: "user_bash",
    command,
    excludeFromContext: false,
    cwd: "/tmp/pi-hooks-test",
  }
}

// Wrap a body in the env-gate + temp-debug-log shell used by every regression
// test below. We force PI_YAML_HOOKS_ENABLE_USER_BASH=1 so the handler does
// real work, and route the structured logger to a temp NDJSON file so we can
// assert on bypass / failure breadcrumbs.
async function withEnabledHandler<T>(
  run: (ctx: { logFile: string; readLogLines(): string[] }) => Promise<T>,
): Promise<T> {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-userbash-"))
  const logFile = path.join(tempDir, "pi-hooks.ndjson")
  const previousEnable = process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
  const previousDebug = process.env.PI_YAML_HOOKS_DEBUG
  const previousLogFile = process.env.PI_YAML_HOOKS_LOG_FILE
  process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = "1"
  process.env.PI_YAML_HOOKS_DEBUG = "1"
  process.env.PI_YAML_HOOKS_LOG_FILE = logFile
  resetPiHooksLoggerForTests()
  _resetUserBashWarningForTests()

  try {
    mkdirSync(tempDir, { recursive: true })
    const readLogLines = (): string[] => {
      try {
        const raw = readFileSync(logFile, "utf8")
        return raw.trim().split("\n").filter(Boolean)
      } catch {
        return []
      }
    }
    return await run({ logFile, readLogLines })
  } finally {
    if (previousEnable === undefined) {
      delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
    } else {
      process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = previousEnable
    }
    if (previousDebug === undefined) {
      delete process.env.PI_YAML_HOOKS_DEBUG
    } else {
      process.env.PI_YAML_HOOKS_DEBUG = previousDebug
    }
    if (previousLogFile === undefined) {
      delete process.env.PI_YAML_HOOKS_LOG_FILE
    } else {
      process.env.PI_YAML_HOOKS_LOG_FILE = previousLogFile
    }
    resetPiHooksLoggerForTests()
    _resetUserBashWarningForTests()
    rmSync(tempDir, { recursive: true, force: true })
  }
}

const cases: Case[] = [
  {
    name: "generateCallId returns a non-empty string",
    run: () => {
      const id = generateCallId()
      return typeof id === "string" && id.length > 0
        ? { ok: true }
        : { ok: false, detail: `got ${JSON.stringify(id)}` }
    },
  },
  {
    name: "generateCallId produces unique values in same-millisecond burst",
    run: () => {
      // Generate a burst of IDs without any delay to guarantee same-millisecond
      // execution. With Date.now() these would be identical; with randomUUID
      // they must all be distinct.
      const N = 1000
      const ids = new Set<string>()
      for (let i = 0; i < N; i++) {
        ids.add(generateCallId())
      }
      return ids.size === N
        ? { ok: true }
        : { ok: false, detail: `only ${ids.size} unique IDs out of ${N}` }
    },
  },
  {
    name: "generateCallId values look like UUIDs (v4 format)",
    run: () => {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const id = generateCallId()
      return uuidRe.test(id)
        ? { ok: true }
        : { ok: false, detail: `id does not look like a v4 UUID: ${id}` }
    },
  },
  {
    name: "user_bash warning fires exactly once per process when called multiple times",
    run: () => {
      _resetUserBashWarningForTests()
      const lines: string[] = []
      const original = process.stderr.write.bind(process.stderr)
      ;(process.stderr as unknown as { write: typeof process.stderr.write }).write = (
        chunk: unknown,
        ..._args: unknown[]
      ): boolean => {
        if (typeof chunk === "string") lines.push(chunk)
        return original(chunk as Parameters<typeof process.stderr.write>[0])
      }

      try {
        _emitUserBashWarningOnce()
        _emitUserBashWarningOnce()
        _emitUserBashWarningOnce()
      } finally {
        ;(process.stderr as unknown as { write: typeof process.stderr.write }).write = original
        _resetUserBashWarningForTests()
      }

      const warningLines = lines.filter((l) => l.includes("PI_YAML_HOOKS_ENABLE_USER_BASH"))
      return warningLines.length === 1
        ? { ok: true }
        : { ok: false, detail: `expected 1 warning line, got ${warningLines.length}` }
    },
  },
  {
    name: "user_bash warning text includes trust expansion risks",
    run: () => {
      _resetUserBashWarningForTests()
      let captured = ""
      const original = process.stderr.write.bind(process.stderr)
      ;(process.stderr as unknown as { write: typeof process.stderr.write }).write = (
        chunk: unknown,
        ..._args: unknown[]
      ): boolean => {
        if (typeof chunk === "string") captured += chunk
        return original(chunk as Parameters<typeof process.stderr.write>[0])
      }

      try {
        _emitUserBashWarningOnce()
      } finally {
        ;(process.stderr as unknown as { write: typeof process.stderr.write }).write = original
        _resetUserBashWarningForTests()
      }

      const requiredPhrases = ["observe", "block", "exfiltrat", "tool_args"]
      const missing = requiredPhrases.filter((p) => !captured.includes(p))
      return missing.length === 0
        ? { ok: true }
        : { ok: false, detail: `warning missing phrases: ${missing.join(", ")}` }
    },
  },
  {
    // Regression for P1-9: getRuntimeFor / rememberContext / getSessionId can
    // now throw arbitrary errors. The handler must (a) NOT call into the
    // runtime, (b) return a cancelled BashResult so the SDK does not run the
    // user's command unguarded, and (c) leave a structured error log breadcrumb.
    name: "user_bash handler fails closed when getRuntimeFor throws",
    run: () =>
      withEnabledHandler(async ({ readLogLines }) => {
        const stub = createPiStub()
        let runtimeCalled = false
        const fakeRuntime = {
          "user.bash.before": async (): Promise<void> => {
            runtimeCalled = true
          },
        } as unknown as HooksRuntime

        registerUserBashInterception(stub.pi, {
          getRuntimeFor: (): HooksRuntime => {
            throw new Error("simulated runtime construction failure")
          },
          rememberContext: () => {},
          getSessionId: () => "session-abc",
        })

        const handler = stub.getHandler()
        const result = await handler(fakeEvent("rm -rf /"), fakeContext())

        if (runtimeCalled) {
          return { ok: false, detail: "runtime was reached despite getRuntimeFor throwing" }
        }
        if (!result || typeof result !== "object" || !result.result) {
          return { ok: false, detail: `expected cancelled result, got ${JSON.stringify(result)}` }
        }
        const { cancelled, output, exitCode, truncated } = result.result
        if (cancelled !== true) return { ok: false, detail: "result.cancelled !== true" }
        if (exitCode !== undefined) return { ok: false, detail: `exitCode=${String(exitCode)}` }
        if (truncated !== false) return { ok: false, detail: "truncated should be false" }
        if (typeof output !== "string" || !output.includes("internal error")) {
          return { ok: false, detail: `output missing 'internal error': ${String(output)}` }
        }
        if (!output.includes("simulated runtime construction failure")) {
          return { ok: false, detail: "output does not surface the underlying error message" }
        }

        // Verify a structured error breadcrumb was written.
        const lines = readLogLines()
        const hasBreadcrumb = lines.some((line) => {
          try {
            const parsed = JSON.parse(line) as { kind?: string; level?: string }
            return parsed.kind === "user_bash_internal_error" && parsed.level === "error"
          } catch {
            return false
          }
        })
        if (!hasBreadcrumb) {
          return { ok: false, detail: "no user_bash_internal_error log line written" }
        }

        return { ok: true }
      }),
  },
  {
    // Regression for P1-9: rememberContext throwing must also fail closed
    // BEFORE we ever reach getSessionId / getRuntimeFor.
    name: "user_bash handler fails closed when rememberContext throws",
    run: () =>
      withEnabledHandler(async () => {
        const stub = createPiStub()
        let getSessionIdCalled = false
        let getRuntimeForCalled = false

        registerUserBashInterception(stub.pi, {
          getRuntimeFor: () => {
            getRuntimeForCalled = true
            return {} as HooksRuntime
          },
          rememberContext: () => {
            throw new Error("rememberContext exploded")
          },
          getSessionId: () => {
            getSessionIdCalled = true
            return "session-xyz"
          },
        })

        const handler = stub.getHandler()
        const result = await handler(fakeEvent(), fakeContext())

        if (getSessionIdCalled || getRuntimeForCalled) {
          return {
            ok: false,
            detail: `downstream called: session=${String(getSessionIdCalled)}, runtime=${String(getRuntimeForCalled)}`,
          }
        }
        if (!result || !result.result || result.result.cancelled !== true) {
          return { ok: false, detail: `expected cancelled result, got ${JSON.stringify(result)}` }
        }
        if (!result.result.output.includes("rememberContext exploded")) {
          return { ok: false, detail: `output missing underlying error: ${result.result.output}` }
        }
        return { ok: true }
      }),
  },
  {
    // Regression for P1-9: getSessionId throwing must fail closed and not
    // proceed to runtime construction.
    name: "user_bash handler fails closed when getSessionId throws",
    run: () =>
      withEnabledHandler(async () => {
        const stub = createPiStub()
        let getRuntimeForCalled = false

        registerUserBashInterception(stub.pi, {
          getRuntimeFor: () => {
            getRuntimeForCalled = true
            return {} as HooksRuntime
          },
          rememberContext: () => {},
          getSessionId: () => {
            throw new Error("session manager unavailable")
          },
        })

        const handler = stub.getHandler()
        const result = await handler(fakeEvent(), fakeContext())

        if (getRuntimeForCalled) {
          return { ok: false, detail: "getRuntimeFor was reached despite getSessionId throwing" }
        }
        if (!result || !result.result || result.result.cancelled !== true) {
          return { ok: false, detail: `expected cancelled result, got ${JSON.stringify(result)}` }
        }
        if (!result.result.output.includes("session manager unavailable")) {
          return { ok: false, detail: `output missing underlying error: ${result.result.output}` }
        }
        return { ok: true }
      }),
  },
  {
    // Regression for P1-10: when there is no session id, the handler bypasses
    // interception (it can't address the runtime). Today this was silent;
    // now it must leave a debug breadcrumb that names the bypass reason.
    name: "user_bash handler logs debug when bypassed for missing session id",
    run: () =>
      withEnabledHandler(async ({ readLogLines }) => {
        const stub = createPiStub()
        let runtimeCalled = false

        registerUserBashInterception(stub.pi, {
          getRuntimeFor: (): HooksRuntime => {
            runtimeCalled = true
            return {} as HooksRuntime
          },
          rememberContext: () => {},
          getSessionId: () => undefined,
        })

        const handler = stub.getHandler()
        const result = await handler(fakeEvent(), fakeContext())

        if (runtimeCalled) {
          return { ok: false, detail: "runtime was constructed even though session id was missing" }
        }
        if (result !== undefined) {
          return { ok: false, detail: `expected void result for bypass, got ${JSON.stringify(result)}` }
        }

        const lines = readLogLines()
        const matched = lines
          .map((line) => {
            try {
              return JSON.parse(line) as Record<string, unknown>
            } catch {
              return undefined
            }
          })
          .filter((entry): entry is Record<string, unknown> => entry !== undefined)
          .find(
            (entry) =>
              entry.kind === "user_bash_bypassed" &&
              entry.level === "debug" &&
              typeof entry.details === "object" &&
              entry.details !== null &&
              (entry.details as Record<string, unknown>).reason === "missing_session_id",
          )

        if (!matched) {
          return {
            ok: false,
            detail: `no user_bash_bypassed debug log with reason=missing_session_id; got: ${lines.join(" | ")}`,
          }
        }
        return { ok: true }
      }),
  },
  {
    // Regression: when the env-gate is OFF the handler must short-circuit
    // immediately and never touch options, so a faulty rememberContext must
    // not be invoked.
    name: "user_bash handler is a no-op when env gate is disabled",
    run: async () => {
      const previous = process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
      delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
      _resetUserBashWarningForTests()
      try {
        const stub = createPiStub()
        let touched = false
        registerUserBashInterception(stub.pi, {
          getRuntimeFor: () => {
            touched = true
            return {} as HooksRuntime
          },
          rememberContext: () => {
            touched = true
          },
          getSessionId: () => {
            touched = true
            return "s"
          },
        })

        const handler = stub.getHandler()
        const result = await handler(fakeEvent(), fakeContext())
        if (touched) return { ok: false, detail: "options were called despite env gate being off" }
        if (result !== undefined) return { ok: false, detail: `expected void, got ${JSON.stringify(result)}` }
        return { ok: true }
      } finally {
        if (previous === undefined) {
          delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
        } else {
          process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = previous
        }
        _resetUserBashWarningForTests()
      }
    },
  },
]

export async function main(): Promise<number> {
  let failures = 0
  for (const c of cases) {
    try {
      const outcome = await c.run()
      if (outcome.ok) {
        console.info(`PASS  ${c.name}`)
      } else {
        failures += 1
        console.info(`FAIL  ${c.name} -- ${outcome.detail ?? "no detail"}`)
      }
    } catch (error) {
      failures += 1
      console.info(`FAIL  ${c.name} -- threw ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.info(`\n${cases.length - failures}/${cases.length} passed`)
  return failures === 0 ? 0 : 1
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  /user-bash\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  void main().then((code) => process.exit(code))
}
