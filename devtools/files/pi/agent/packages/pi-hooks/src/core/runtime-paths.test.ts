import { buildPathMatchContext, createHooksRuntime } from "./runtime.js"
import type { BashExecutionRequest, BashHookResult } from "./bash-types.js"
import type { HookAction, HookMap, HostAdapter } from "./types.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

function buildHookMap(actions: HookAction[], event: string, conditions?: unknown[]): HookMap {
  const hooks: HookMap = new Map()
  hooks.set(event as HookMap extends Map<infer K, unknown> ? K : never, [
    {
      id: "path-test-hook",
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

function createFakeHost(records: string[]): HostAdapter {
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
    notify: (text) => {
      records.push(text)
    },
    confirm: async () => true,
    setStatus: () => {},
  }
}

function createDelayedNotifyHost(records: string[], delayMs: number): HostAdapter {
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
    notify: async (text) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      records.push(text)
    },
    confirm: async () => true,
    setStatus: () => {},
  }
}

const cases: Case[] = [
  {
    name: "buildPathMatchContext normalizes change paths once per dispatch shape",
    run: async () => {
      const context = buildPathMatchContext("/repo", {
        changes: [
          { operation: "modify", path: "/repo/src/app.ts" },
          { operation: "rename", fromPath: "/repo/docs/old.md", toPath: "/repo/docs/new.md" },
        ],
      })

      return JSON.stringify(context.changedPaths) === JSON.stringify(["src/app.ts", "docs/new.md"]) && context.hasCodeFiles
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(context) }
    },
  },
  {
    name: "precomputed path context preserves matchesAnyPath and matchesAllPaths behavior",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap(
          [{ notify: "matched" }],
          "tool.after.write",
          [{ matchesAnyPath: ["src/**/*.ts"] }, { matchesAllPaths: ["src/**", "docs/**"] }],
        ),
      })

      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/src/feature/file.ts", content: "ok" },
      })

      return JSON.stringify(records) === JSON.stringify(["matched"])
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "matchesAllPaths passes when every changed file matches at least one allowlist pattern",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "all-match" }], "session.idle", [{ matchesAllPaths: ["src/**", "docs/**"] }]),
      })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c1", args: { path: "/repo/src/a.ts", content: "x" } })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c2", args: { path: "/repo/docs/a.md", content: "x" } })
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })
      return JSON.stringify(records) === JSON.stringify(["all-match"])
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "matchesAllPaths fails when any changed file is outside the allowlist patterns",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "all-match" }], "session.idle", [{ matchesAllPaths: ["src/**"] }]),
      })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c1", args: { path: "/repo/src/a.ts", content: "x" } })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c2", args: { path: "/repo/docs/a.md", content: "x" } })
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })
      return records.length === 0
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "split matchesAllPaths conditions express intersection semantics",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "intersection" }], "tool.after.write", [{ matchesAllPaths: ["src/**"] }, { matchesAllPaths: ["**/*.ts"] }]),
      })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c1", args: { path: "/repo/src/a.md", content: "x" } })
      await runtime["tool.execute.after"]({ tool: "write", sessionID: "s1", callID: "c2", args: { path: "/repo/src/a.ts", content: "x" } })
      return JSON.stringify(records) === JSON.stringify(["intersection"])
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "precomputed path context preserves matchesCodeFiles behavior for multi-file changes",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "code-file-match" }], "session.idle", ["matchesCodeFiles"]),
      })

      await runtime.event({
        event: { type: "session.idle", properties: { sessionID: "s1" } },
      })
      if (records.length !== 0) {
        return { ok: false, detail: `unexpected initial records=${JSON.stringify(records)}` }
      }

      await runtime["tool.execute.after"]({
        tool: "edit",
        sessionID: "s1",
        callID: "c2",
        args: { path: "/repo/README.md", oldString: "a", newString: "b" },
      })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c3",
        args: { path: "/repo/src/main.ts", content: "export {}" },
      })
      await runtime.event({
        event: { type: "session.idle", properties: { sessionID: "s1" } },
      })

      return JSON.stringify(records) === JSON.stringify(["code-file-match"])
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "queued dispatches compute path match context per request",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createDelayedNotifyHost(records, 25), {
        directory: "/repo",
        hooks: buildHookMap([{ notify: "queued-match" }], "tool.after.write", [{ matchesAnyPath: ["src/**"] }]),
      })

      await Promise.all([
        runtime["tool.execute.after"]({
          tool: "write",
          sessionID: "s1",
          callID: "c4",
          args: { path: "/repo/docs/readme.md", content: "docs" },
        }),
        runtime["tool.execute.after"]({
          tool: "write",
          sessionID: "s1",
          callID: "c5",
          args: { path: "/repo/src/queued.ts", content: "code" },
        }),
      ])

      return JSON.stringify(records) === JSON.stringify(["queued-match"])
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    // P2-5 regression: repeated dispatches with the same glob patterns
    // hit the runtime-side glob matcher cache. We assert that pattern
    // evaluation produces the same matched/unmatched outcome across
    // many invocations — caching must not change observable behavior.
    name: "memoized glob matchers preserve match correctness across many invocations",
    run: async () => {
      const records: string[] = []
      const runtime = createHooksRuntime(createFakeHost(records), {
        directory: "/repo",
        hooks: buildHookMap(
          [{ notify: "memo-match" }],
          "tool.after.write",
          [{ matchesAnyPath: ["src/**/*.ts", "lib/**/*.ts"] }],
        ),
      })

      const matchedPaths = ["/repo/src/a.ts", "/repo/src/sub/b.ts", "/repo/lib/x.ts"]
      const ignoredPaths = ["/repo/docs/readme.md", "/repo/scripts/deploy.sh"]

      let callIdCounter = 0
      for (let iteration = 0; iteration < 3; iteration += 1) {
        for (const path of [...matchedPaths, ...ignoredPaths]) {
          callIdCounter += 1
          await runtime["tool.execute.after"]({
            tool: "write",
            sessionID: "s1",
            callID: `c${callIdCounter}`,
            args: { path, content: "ok" },
          })
        }
      }

      const expected = matchedPaths.length * 3
      return records.length === expected && records.every((r) => r === "memo-match")
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)} expected=${expected}` }
    },
  },
  {
    // P2-10 regression: when an idle dispatch hook returns a generic
    // failure (not a host-died error), the runtime must consume the
    // pending changes so the next idle event does not loop forever on
    // the same poison change set. We gate the hook on `matchesAnyPath` so
    // it only fires when pending changes exist; if consume worked, the
    // second idle will see no matching paths and the bash will not run
    // a second time.
    name: "session.idle consumes changes when a hook throws a non-host-died error",
    run: async () => {
      const seenCommands: string[] = []
      let throwsRemaining = 1
      const hooks = buildHookMap(
        [{ bash: "job:idle" }],
        "session.idle",
        [{ matchesAnyPath: ["**/*.ts"] }],
      )
      const runtime = createHooksRuntime(createFakeHost([]), {
        directory: "/repo",
        hooks,
        executeBash: (request: BashExecutionRequest): Promise<BashHookResult> => {
          seenCommands.push(request.command)
          if (throwsRemaining > 0) {
            throwsRemaining -= 1
            return Promise.reject(new Error("synthetic hook failure"))
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

      // Stage one file change.
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/repo/a.ts", content: "x" },
      })

      // First idle: dispatch throws; runtime should consume changes anyway.
      let firstIdleErrored = false
      try {
        await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })
      } catch {
        firstIdleErrored = true
      }
      if (!firstIdleErrored) {
        return { ok: false, detail: "expected first idle to surface the hook error" }
      }

      const callsAfterFirst = seenCommands.length

      // Second idle: there should be NO pending changes left to dispatch
      // (because we consumed on hook-no), so the path condition rejects
      // the hook and bash is not re-invoked.
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      return seenCommands.length === callsAfterFirst
        ? { ok: true }
        : { ok: false, detail: `seenCommands=${JSON.stringify(seenCommands)}` }
    },
  },
  {
    // P2-10 regression #2: when the idle dispatch fails with a
    // host-died-style error, pending changes must be RETAINED so the
    // next idle (after the host comes back up) can replay them. Same
    // path-condition trick as the previous test isolates the assertion
    // to whether the change set survived.
    name: "session.idle retains changes when host appears to have died",
    run: async () => {
      const seenCommands: string[] = []
      let throwsRemaining = 1
      const hooks = buildHookMap(
        [{ bash: "job:idle" }],
        "session.idle",
        [{ matchesAnyPath: ["**/*.ts"] }],
      )
      const runtime = createHooksRuntime(createFakeHost([]), {
        directory: "/repo",
        hooks,
        executeBash: (request: BashExecutionRequest): Promise<BashHookResult> => {
          seenCommands.push(request.command)
          if (throwsRemaining > 0) {
            throwsRemaining -= 1
            // ECONNREFUSED is one of the codes the runtime treats as a
            // host-died signal; the runtime should NOT consume changes.
            const error = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" })
            return Promise.reject(error)
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
        args: { path: "/repo/a.ts", content: "x" },
      })

      let firstIdleErrored = false
      try {
        await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })
      } catch {
        firstIdleErrored = true
      }
      if (!firstIdleErrored) {
        return { ok: false, detail: "expected first idle to surface the host-died error" }
      }

      // Second idle: the host is "back" so the bash executor returns
      // success — the pending change must replay, meaning the bash hook
      // is invoked a second time.
      await runtime.event({ event: { type: "session.idle", properties: { sessionID: "s1" } } })

      return seenCommands.length === 2
        ? { ok: true }
        : { ok: false, detail: `seenCommands=${JSON.stringify(seenCommands)}` }
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
  /runtime-paths\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
