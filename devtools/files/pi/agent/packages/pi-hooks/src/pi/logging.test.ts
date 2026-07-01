import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { getPiHooksLogFilePath, getPiHooksLogger, resetPiHooksLoggerForTests } from "../core/logger.js"
import { createHooksRuntime } from "../core/runtime.js"
import type { BashExecutionRequest, BashHookResult } from "../core/bash-types.js"
import type { HookAction, HookMap, HostAdapter, HostDeliveryResult } from "../core/types.js"
import { reportDispatchFailure } from "./adapter.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

function buildHookMap(actions: HookAction[], event: string, conditions?: unknown[]): HookMap {
  const hooks: HookMap = new Map()
  hooks.set(event as HookMap extends Map<infer K, unknown> ? K : never, [
    {
      id: "test-hook",
      event: event as HookMap extends Map<infer K, unknown> ? K : never,
      actions,
      ...(conditions ? { conditions: conditions as never } : {}),
      scope: "all",
      runIn: "current",
      source: { filePath: "/virtual/hooks.yaml", index: 0 },
    },
  ])
  return hooks
}

function createFakeHost(): HostAdapter {
  return {
    abort: () => {},
    getRootSessionId: (id) => id,
    runBash: async (req: BashExecutionRequest): Promise<BashHookResult> => ({
      command: req.command,
      exitCode: 0,
      stdout: "",
      stderr: "",
      timedOut: false,
      blocking: false,
      status: "success",
      durationMs: 0,
      signal: null,
    }),
    sendPrompt: () => {},
    notify: () => {},
    confirm: async () => true,
    setStatus: () => {},
  }
}

async function withDebugLog<T>(run: (logFile: string) => Promise<T>): Promise<T> {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-logging-"))
  const logFile = path.join(tempDir, "pi-hooks.ndjson")
  const previousDebug = process.env.PI_YAML_HOOKS_DEBUG
  const previousLogFile = process.env.PI_YAML_HOOKS_LOG_FILE
  process.env.PI_YAML_HOOKS_DEBUG = "1"
  process.env.PI_YAML_HOOKS_LOG_FILE = logFile
  resetPiHooksLoggerForTests()

  try {
    mkdirSync(tempDir, { recursive: true })
    return await run(logFile)
  } finally {
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
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function readLogLines(logFile: string): string[] {
  const resolved = getPiHooksLogFilePath()
  if (resolved !== logFile) {
    throw new Error(`logger resolved unexpected path ${resolved} != ${logFile}`)
  }
  return readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean)
}

const cases: Case[] = [
  {
    name: "logs exact follow-up prompt for tool actions",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks: buildHookMap(
          [
            {
              tool: {
                name: "read",
                args: { path: "/Users/tester/.pi/agent/skills/writer/SKILL.md" },
              },
            },
          ],
          "session.idle",
          [{ matchesAnyPath: ["README.md"] }],
        ),
      })

      await runtime["tool.execute.after"]({
        tool: "edit",
        sessionID: "s1",
        callID: "c1",
        args: { path: "README.md" },
      })
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const hit = lines.find((line) => line.includes("Tool action queued a follow-up prompt") && line.includes("writer/SKILL.md"))
      return hit ? { ok: true } : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "logs hook skip reason when matchesAnyPath fails",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks: buildHookMap(
          [{ notify: "hi" }],
          "session.idle",
          [{ matchesAnyPath: ["README.md"] }],
        ),
      })

      await runtime["tool.execute.after"]({
        tool: "edit",
        sessionID: "s1",
        callID: "c1",
        args: { path: "docs/guide.md" },
      })
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const hit = lines.find((line) => line.includes("hook_skip") && line.includes("matchesAnyPath_failed"))
      return hit ? { ok: true } : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "sendPrompt failure logs failure without logging success",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(
        {
          ...createFakeHost(),
          sendPrompt: () => {
            throw new Error("sendUserMessage exploded")
          },
        },
        {
          directory: "/repo",
          hooks: buildHookMap(
            [
              {
                tool: {
                  name: "read",
                  args: { path: "README.md" },
                },
              },
            ],
            "session.idle",
          ),
        },
      )

      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const sawFailure = lines.some(
        (line) => line.includes("Tool action failed") && line.includes("sendUserMessage exploded"),
      )
      const sawSuccess = lines.some((line) => line.includes("Tool action queued a follow-up prompt"))
      return sawFailure && !sawSuccess
        ? { ok: true }
        : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "degraded tool delivery logs warning instead of success",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(
        {
          ...createFakeHost(),
          sendPrompt: () => ({ status: "degraded", reason: "current_session_only" }),
        },
        {
          directory: "/repo",
          hooks: buildHookMap(
            [
              {
                tool: {
                  name: "read",
                  args: { path: "README.md" },
                },
              },
            ],
            "session.idle",
          ),
        },
      )

      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const sawWarning = lines.some(
        (line) =>
          line.includes("Tool action degraded before the follow-up prompt was accepted") &&
          line.includes("current_session_only"),
      )
      const sawSuccess = lines.some((line) => line.includes("Tool action queued a follow-up prompt"))
      return sawWarning && !sawSuccess
        ? { ok: true }
        : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "notify degraded logs warning instead of delivery success",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(
        {
          ...createFakeHost(),
          notify: () => ({ status: "degraded", reason: "ui_unavailable" satisfies HostDeliveryResult["reason"] }),
        },
        {
          directory: "/repo",
          hooks: buildHookMap([{ notify: "hi" }], "session.idle"),
        },
      )

      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const sawWarning = lines.some(
        (line) => line.includes("Notification action degraded before the host accepted it") && line.includes("ui_unavailable"),
      )
      const sawSuccess = lines.some((line) => line.includes("Notification action delivered"))
      return sawWarning && !sawSuccess
        ? { ok: true }
        : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "setStatus degraded logs warning instead of success",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(
        {
          ...createFakeHost(),
          setStatus: () => ({ status: "degraded", reason: "ui_unavailable" satisfies HostDeliveryResult["reason"] }),
        },
        {
          directory: "/repo",
          hooks: buildHookMap([{ setStatus: "busy" }], "session.idle"),
        },
      )

      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const sawWarning = lines.some(
        (line) => line.includes("Status action degraded before the host accepted it") && line.includes("ui_unavailable"),
      )
      const sawSuccess = lines.some((line) => line.includes("Status action updated the PI status surface"))
      return sawWarning && !sawSuccess
        ? { ok: true }
        : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "legacy void notify still logs delivery success",
    run: async () => withDebugLog(async (logFile) => {
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "hi" }], "session.idle"),
      })

      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      const lines = readLogLines(logFile)
      const sawSuccess = lines.some((line) => line.includes("Notification action delivered"))
      return sawSuccess ? { ok: true } : { ok: false, detail: `lines=${JSON.stringify(lines)}` }
    }),
  },
  {
    name: "adapter dispatch failures are visible without debug mode",
    run: async () => {
      const previousDebug = process.env.PI_YAML_HOOKS_DEBUG
      const previousLevel = process.env.PI_YAML_HOOKS_LOG_LEVEL
      const previousFile = process.env.PI_YAML_HOOKS_LOG_FILE
      delete process.env.PI_YAML_HOOKS_DEBUG
      delete process.env.PI_YAML_HOOKS_LOG_LEVEL
      delete process.env.PI_YAML_HOOKS_LOG_FILE
      resetPiHooksLoggerForTests()

      const originalError = console.error
      const calls: string[] = []
      console.error = (...args: unknown[]) => {
        calls.push(args.map(String).join(" "))
      }

      try {
        reportDispatchFailure(getPiHooksLogger(), { cwd: "/repo", event: "session.idle", sessionId: "s1" }, new Error("boom"))
      } finally {
        console.error = originalError
        if (previousDebug === undefined) delete process.env.PI_YAML_HOOKS_DEBUG
        else process.env.PI_YAML_HOOKS_DEBUG = previousDebug
        if (previousLevel === undefined) delete process.env.PI_YAML_HOOKS_LOG_LEVEL
        else process.env.PI_YAML_HOOKS_LOG_LEVEL = previousLevel
        if (previousFile === undefined) delete process.env.PI_YAML_HOOKS_LOG_FILE
        else process.env.PI_YAML_HOOKS_LOG_FILE = previousFile
        resetPiHooksLoggerForTests()
      }

      return calls.some((line) => line.includes("session.idle dispatch failed: boom"))
        ? { ok: true }
        : { ok: false, detail: `calls=${JSON.stringify(calls)}` }
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
  /logging\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
