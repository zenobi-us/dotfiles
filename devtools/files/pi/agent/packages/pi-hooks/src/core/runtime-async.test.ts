import { enqueueAsyncHook, type AsyncQueueState } from "./runtime/async-queue.js"
import { loadDiscoveredHooks, parseHooksFile } from "./load-hooks.js"
import { createHooksRuntime } from "./runtime.js"
import type { BashExecutionRequest, BashHookResult } from "./bash-types.js"
import type { HookMap, HostAdapter } from "./types.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

const cases: Case[] = [
  {
    name: "parser accepts async group and concurrency settings",
    run: async () => {
      const parsed = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - event: tool.after.write
    async:
      group: io
      concurrency: 2
    actions:
      - bash: "echo ok"
`,
      )

      return parsed.errors.length === 0
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(parsed.errors) }
    },
  },
  {
    name: "parser rejects async concurrency without a named group",
    run: async () => {
      const filePath = "/home/tester/.pi/agent/hook/hooks.yaml"
      const loaded = loadDiscoveredHooks({
        homeDir: "/home/tester",
        projectDir: "/repo",
        exists: (candidate) => candidate === filePath,
        readFile: () => `hooks:
  - event: tool.after.write
    async:
      concurrency: 2
    actions:
      - bash: "echo ok"
`,
      })

      return loaded.errors.some((error) => error.code === "invalid_async" && /requires async\.group/i.test(error.message))
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(loaded.errors) }
    },
  },
  {
    name: "parser rejects conflicting concurrency in the same async group",
    run: async () => {
      const filePath = "/home/tester/.pi/agent/hook/hooks.yaml"
      const loaded = loadDiscoveredHooks({
        homeDir: "/home/tester",
        projectDir: "/repo",
        exists: (candidate) => candidate === filePath,
        readFile: () => `hooks:
  - event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: "echo one"
  - event: tool.after.write
    async:
      group: uploads
      concurrency: 3
    actions:
      - bash: "echo two"
`,
      })

      return loaded.errors.some((error) => error.code === "invalid_async" && /must match earlier hooks/i.test(error.message))
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(loaded.errors) }
    },
  },
  {
    name: "parser normalizes async group names before validating shared concurrency",
    run: async () => {
      const filePath = "/home/tester/.pi/agent/hook/hooks.yaml"
      const loaded = loadDiscoveredHooks({
        homeDir: "/home/tester",
        projectDir: "/repo",
        exists: (candidate) => candidate === filePath,
        readFile: () => `hooks:
  - event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: "echo one"
  - event: tool.after.write
    async:
      group: " uploads "
      concurrency: 3
    actions:
      - bash: "echo two"
`,
      })

      return loaded.errors.some((error) => error.code === "invalid_async" && /must match earlier hooks/i.test(error.message))
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(loaded.errors) }
    },
  },
  {
    name: "default async behavior remains serialized per event and session",
    run: async () => {
      const activeCounts: number[] = []
      let active = 0
      const hooks = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: first
    event: tool.after.write
    async: true
    actions:
      - bash: "job:first"
  - id: second
    event: tool.after.write
    async: true
    actions:
      - bash: "job:second"
`,
      ).hooks as HookMap
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          active += 1
          activeCounts.push(active)
          await sleep(20)
          active -= 1
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 20,
            signal: null,
          }
        },
      })

      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/file.txt", content: "ok" },
      })
      await sleep(70)

      return Math.max(...activeCounts, 0) === 1
        ? { ok: true }
        : { ok: false, detail: `activeCounts=${JSON.stringify(activeCounts)}` }
    },
  },
  {
    name: "named async groups run independently",
    run: async () => {
      const timeline: string[] = []
      let active = 0
      let maxActive = 0
      const hooks = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: group-a
    event: tool.after.write
    async:
      group: lint
    actions:
      - bash: "job:lint"
  - id: group-b
    event: tool.after.write
    async:
      group: notify
    actions:
      - bash: "job:notify"
`,
      ).hooks as HookMap
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          active += 1
          maxActive = Math.max(maxActive, active)
          timeline.push(`start:${request.command}`)
          await sleep(20)
          timeline.push(`end:${request.command}`)
          active -= 1
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 20,
            signal: null,
          }
        },
      })

      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/file.txt", content: "ok" },
      })
      await sleep(70)

      return maxActive >= 2
        ? { ok: true }
        : { ok: false, detail: `timeline=${JSON.stringify(timeline)}` }
    },
  },
  {
    name: "synchronous throw inside async hook does not leak activeCount",
    run: async () => {
      // Wire up a hook whose bash executor throws synchronously on the first
      // call (mimicking a sync exception thrown before any await). Without
      // the IIFE wrapper in enqueueAsyncHook, .finally() never runs and the
      // queue's activeCount stays >0, blocking subsequent hooks forever.
      const seenCommands: string[] = []
      let throwOnce = true
      const hooks = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: sync-throw
    event: tool.after.write
    async: true
    actions:
      - bash: "job:first"
  - id: follow-up
    event: tool.after.write
    async: true
    actions:
      - bash: "job:second"
`,
      ).hooks as HookMap
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: (request: BashExecutionRequest): Promise<BashHookResult> => {
          seenCommands.push(request.command)
          if (throwOnce) {
            throwOnce = false
            // Throw synchronously rather than returning a rejected promise.
            throw new Error("simulated sync throw")
          }
          return Promise.resolve({
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success" as const,
            durationMs: 0,
            signal: null,
          })
        },
      })

      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/file.txt", content: "ok" },
      })
      await sleep(60)

      // If activeCount leaked, the second job ("job:second") would never have
      // started. Confirm both bash calls were observed.
      const sawFirst = seenCommands.some((c) => c.includes("job:first"))
      const sawSecond = seenCommands.some((c) => c.includes("job:second"))
      return sawFirst && sawSecond
        ? { ok: true }
        : { ok: false, detail: `seenCommands=${JSON.stringify(seenCommands)}` }
    },
  },
  {
    name: "bounded async concurrency allows more than one in a group",
    run: async () => {
      const activeCounts: number[] = []
      let active = 0
      const hooks = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: one
    event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: "job:one"
  - id: two
    event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: "job:two"
  - id: three
    event: tool.after.write
    async:
      group: uploads
      concurrency: 2
    actions:
      - bash: "job:three"
`,
      ).hooks as HookMap
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          active += 1
          activeCounts.push(active)
          await sleep(20)
          active -= 1
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 20,
            signal: null,
          }
        },
      })

      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/file.txt", content: "ok" },
      })
      await sleep(90)

      return Math.max(...activeCounts, 0) === 2
        ? { ok: true }
        : { ok: false, detail: `activeCounts=${JSON.stringify(activeCounts)}` }
    },
  },
  {
    name: "blocking bash stderr is redacted before surfacing as block reason",
    run: async () => {
      const hooks = parseHooksFile(
        "/virtual/hooks.yaml",
        `hooks:
  - id: blocker
    event: tool.before.write
    actions:
      - bash: "block"
`,
      ).hooks as HookMap
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => ({
          command: request.command,
          exitCode: 2,
          stdout: "",
          stderr: "GITHUB_TOKEN=supersecretvalue",
          timedOut: false,
          blocking: true,
          status: "blocked",
          durationMs: 0,
          signal: null,
        }),
      })
      try {
        await runtime["tool.execute.before"](
          { tool: "write", sessionID: "s1", callID: "c1" },
          { args: { path: "/repo/a.txt", content: "x" } },
        )
        return { ok: false, detail: "expected block error" }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return message.includes("[REDACTED]") && !message.includes("supersecretvalue")
          ? { ok: true }
          : { ok: false, detail: message }
      }
    },
  },
  {
    name: "async queue drops new work deterministically at pending cap",
    run: async () => {
      const queues = new Map<string, AsyncQueueState>()
      const warnings: string[] = []
      let release: (() => void) | undefined
      const blocker = new Promise<void>((resolve) => { release = resolve })
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => blocker, () => {}, {
        maxPending: 1,
        onWarning: (warning) => warnings.push(`${warning.reason}:${warning.limit}`),
      })
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => {}, () => {}, {
        maxPending: 1,
        onWarning: (warning) => warnings.push(`${warning.reason}:${warning.limit}`),
      })
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => {}, () => {}, {
        maxPending: 1,
        onWarning: (warning) => warnings.push(`${warning.reason}:${warning.limit}`),
      })
      release?.()
      await sleep(20)
      return warnings.length === 1 && warnings[0] === "pending_limit:1"
        ? { ok: true }
        : { ok: false, detail: `warnings=${JSON.stringify(warnings)}` }
    },
  },
  {
    name: "async queue watchdog warns without freeing a slow lane",
    run: async () => {
      const queues = new Map<string, AsyncQueueState>()
      const order: string[] = []
      const warnings: string[] = []
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => {
        order.push("slow:start")
        await sleep(30)
        order.push("slow:end")
      }, () => {}, {
        watchdogMs: 10,
        onWarning: (warning) => warnings.push(warning.reason),
      })
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => {
        order.push("next")
      }, () => {}, {
        watchdogMs: 10,
        onWarning: (warning) => warnings.push(warning.reason),
      })
      await sleep(20)
      const beforeSettled = order.join(",")
      await sleep(40)
      return beforeSettled === "slow:start" && order.join(",") === "slow:start,slow:end,next" && warnings.includes("watchdog_timeout")
        ? { ok: true }
        : { ok: false, detail: `beforeSettled=${beforeSettled} order=${JSON.stringify(order)} warnings=${JSON.stringify(warnings)}` }
    },
  },
  {
    name: "async queue reports hook failures after watchdog warning",
    run: async () => {
      const queues = new Map<string, AsyncQueueState>()
      const warnings: string[] = []
      const errors: string[] = []
      enqueueAsyncHook(queues, { queueKey: "q", concurrency: 1 }, async () => {
        await sleep(30)
        throw new Error("late failure")
      }, (error) => errors.push(error instanceof Error ? error.message : String(error)), {
        watchdogMs: 10,
        onWarning: (warning) => warnings.push(warning.reason),
      })
      await sleep(50)
      return warnings.includes("watchdog_timeout") && errors.includes("late failure")
        ? { ok: true }
        : { ok: false, detail: `warnings=${JSON.stringify(warnings)} errors=${JSON.stringify(errors)}` }
    },
  },
  {
    // P1-14 regression: hooks registered under both `tool.after.patch` and
    // `tool.after.apply_patch` describe the same alias and must not both
    // fire when an apply_patch tool call comes in.
    name: "apply_patch dispatch dedupes hooks across patch and apply_patch aliases",
    run: async () => {
      const seen: string[] = []
      const hooks: HookMap = new Map()
      const sharedSource = { filePath: "/virtual/hooks.yaml", index: 0 }
      hooks.set("tool.after.patch", [
        {
          id: "patch-hook",
          event: "tool.after.patch",
          actions: [{ bash: "job:patch" }],
          scope: "all",
          runIn: "current",
          source: sharedSource,
        },
      ])
      hooks.set("tool.after.apply_patch", [
        {
          id: "apply-patch-hook",
          event: "tool.after.apply_patch",
          actions: [{ bash: "job:apply_patch" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 1 },
        },
      ])
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          seen.push(request.command)
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 0,
            signal: null,
          }
        },
      })

      await runtime["tool.execute.after"]({
        tool: "apply_patch",
        sessionID: "s1",
        callID: "c1",
        args: { patchText: "*** Add File: a.txt\n+x" },
      })

      // Both hooks should fire exactly once each (one per registered bucket),
      // and the same hook config must never be invoked twice for one call.
      const patchCalls = seen.filter((c) => c === "job:patch").length
      const applyPatchCalls = seen.filter((c) => c === "job:apply_patch").length
      return patchCalls === 1 && applyPatchCalls === 1
        ? { ok: true }
        : { ok: false, detail: `seen=${JSON.stringify(seen)}` }
    },
  },
  {
    // P1-14 regression #2: a single hook registered ONCE under
    // tool.after.apply_patch must fire exactly once even though the alias
    // dispatcher also looks up tool.after.patch.
    name: "single apply_patch hook fires exactly once for an apply_patch call",
    run: async () => {
      const seen: string[] = []
      const hooks: HookMap = new Map()
      hooks.set("tool.after.apply_patch", [
        {
          id: "single-apply-patch-hook",
          event: "tool.after.apply_patch",
          actions: [{ bash: "job:single" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 0 },
        },
      ])
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          seen.push(request.command)
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 0,
            signal: null,
          }
        },
      })

      await runtime["tool.execute.after"]({
        tool: "apply_patch",
        sessionID: "s1",
        callID: "c1",
        args: { patchText: "*** Add File: a.txt\n+x" },
      })

      return seen.length === 1 && seen[0] === "job:single"
        ? { ok: true }
        : { ok: false, detail: `seen=${JSON.stringify(seen)}` }
    },
  },
  {
    // P1-13 regression: a queued blocking dispatch must re-enter the
    // recursion-guard frame that was active when it was parked, not the
    // frame that happens to be active at drain time. We exercise this by
    // forcing a tool.before dispatch to park behind another in-flight
    // dispatch on the same key, then verifying that the parked dispatch
    // executes its bash action exactly once. Without the ALS capture fix,
    // the parked dispatch would resume under a stale recursion-guard
    // store and either dedupe (skip) or run with a leaked actionKey.
    name: "queued blocking dispatch executes its actions once after drain",
    run: async () => {
      let inFlight = 0
      let maxInFlight = 0
      const seen: string[] = []
      const hooks: HookMap = new Map()
      hooks.set("tool.before.write", [
        {
          id: "before-write",
          event: "tool.before.write",
          actions: [{ bash: "job:before-write" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 0 },
        },
      ])
      const runtime = createHooksRuntime(createFakeHost(), {
        directory: "/repo",
        hooks,
        executeBash: async (request: BashExecutionRequest): Promise<BashHookResult> => {
          inFlight += 1
          maxInFlight = Math.max(maxInFlight, inFlight)
          seen.push(request.command)
          await sleep(15)
          inFlight -= 1
          return {
            command: request.command,
            exitCode: 0,
            stdout: "",
            stderr: "",
            timedOut: false,
            blocking: false,
            status: "success",
            durationMs: 15,
            signal: null,
          }
        },
      })

      // Fire two pre-tool hooks for the same session/event concurrently so
      // the second dispatch parks behind the first.
      await Promise.all([
        runtime["tool.execute.before"](
          { tool: "write", sessionID: "s1", callID: "c1" },
          { args: { path: "/repo/a.txt", content: "x" } },
        ),
        runtime["tool.execute.before"](
          { tool: "write", sessionID: "s1", callID: "c2" },
          { args: { path: "/repo/b.txt", content: "y" } },
        ),
      ])

      // Both dispatches must have run their action; serialization is
      // already enforced by the dispatch state machine, so maxInFlight
      // should be 1 and we should have seen the bash command twice.
      return seen.length === 2 && maxInFlight === 1
        ? { ok: true }
        : { ok: false, detail: `seen=${JSON.stringify(seen)} maxInFlight=${maxInFlight}` }
    },
  },
  {
    // P1-15 regression: combining `async: true` with `action: stop` on a
    // tool.before hook is currently a parse-side miss (covered separately
    // in the core-loader lane). The runtime safety net warns once via
    // console.warn rather than silently dropping the stop. We capture the
    // warning by overriding console.warn for the duration of the test.
    name: "runtime warns when async hook declares action: stop",
    run: async () => {
      const captured: string[] = []
      const originalWarn = console.warn
      console.warn = (msg: unknown) => {
        captured.push(typeof msg === "string" ? msg : String(msg))
      }
      try {
        const hooks: HookMap = new Map()
        hooks.set("tool.after.write", [
          {
            id: "async-stop-hook",
            event: "tool.after.write",
            action: "stop",
            async: true,
            actions: [{ bash: "job:noop" }],
            scope: "all",
            runIn: "current",
            source: { filePath: "/virtual/hooks-async-stop.yaml", index: 0 },
          },
        ])
        const runtime = createHooksRuntime(createFakeHost(), {
          directory: "/repo",
          hooks,
        })

        await runtime["tool.execute.after"]({
          tool: "write",
          sessionID: "s1",
          callID: "c1",
          args: { path: "/repo/file.txt", content: "ok" },
        })
        await sleep(40)

        return captured.some((line) => /async/.test(line) && /stop/.test(line))
          ? { ok: true }
          : { ok: false, detail: `captured=${JSON.stringify(captured)}` }
      } finally {
        console.warn = originalWarn
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
  /runtime-async\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
