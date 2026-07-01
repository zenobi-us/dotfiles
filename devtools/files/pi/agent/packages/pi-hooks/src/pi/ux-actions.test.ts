/**
 * UX-lane unit tests for the Phase3-UX native YAML actions:
 *   notify, confirm, setStatus
 *
 * Two test groups:
 * 1. Parser (parseHooksFile) — assert the YAML parser round-trips each new
 *    shorthand/longhand form into the right HookAction kind.
 * 2. Runtime (createHooksRuntime) — assert the runtime dispatches each action
 *    to the matching HostAdapter UI method with the right arguments, and that
 *    `confirm: false` surfaces as a block for tool.before.* events.
 *
 * Run:
 *   npx --yes tsx src/pi/ux-actions.test.ts
 */

import { parseHooksFile } from "../core/load-hooks.js"
import { createHooksRuntime } from "../core/runtime.js"
import type { BashExecutionRequest, BashHookResult } from "../core/bash-types.js"
import type {
  HookAction,
  HookConfirmAction,
  HookMap,
  HookNotifyAction,
  HookNotifyLevel,
  HookSetStatusAction,
  HostAdapter,
} from "../core/types.js"
import { createHostAdapter } from "./adapter.js"

interface ParserCase {
  readonly name: string
  readonly yaml: string
  readonly expectKind: "notify" | "confirm" | "setStatus"
  readonly check: (action: HookAction) => { ok: boolean; detail?: string }
}

const parserCases: ParserCase[] = [
  {
    name: "notify shorthand → HookNotifyAction",
    yaml: `hooks:
  - event: session.idle
    actions:
      - notify: "hello world"
`,
    expectKind: "notify",
    check: (action) => {
      if (!("notify" in action)) return { ok: false, detail: `got ${JSON.stringify(action)}` }
      const n = action as HookNotifyAction
      return n.notify === "hello world"
        ? { ok: true }
        : { ok: false, detail: `notify=${JSON.stringify(n.notify)}` }
    },
  },
  {
    name: "notify longhand with level → HookNotifyAction",
    yaml: `hooks:
  - event: session.idle
    actions:
      - notify:
          text: "all good"
          level: success
`,
    expectKind: "notify",
    check: (action) => {
      if (!("notify" in action)) return { ok: false, detail: `got ${JSON.stringify(action)}` }
      const n = action as HookNotifyAction
      if (typeof n.notify === "string") {
        return { ok: false, detail: `expected object, got string ${n.notify}` }
      }
      return n.notify.text === "all good" && n.notify.level === "success"
        ? { ok: true }
        : { ok: false, detail: `notify=${JSON.stringify(n.notify)}` }
    },
  },
  {
    name: "confirm → HookConfirmAction",
    yaml: `hooks:
  - event: tool.before.bash
    actions:
      - confirm:
          title: "Destructive command"
          message: "Run rm -rf?"
`,
    expectKind: "confirm",
    check: (action) => {
      if (!("confirm" in action)) return { ok: false, detail: `got ${JSON.stringify(action)}` }
      const c = action as HookConfirmAction
      return c.confirm.message === "Run rm -rf?" && c.confirm.title === "Destructive command"
        ? { ok: true }
        : { ok: false, detail: `confirm=${JSON.stringify(c.confirm)}` }
    },
  },
  {
    name: "setStatus shorthand → HookSetStatusAction",
    yaml: `hooks:
  - event: session.idle
    actions:
      - setStatus: "working..."
`,
    expectKind: "setStatus",
    check: (action) => {
      if (!("setStatus" in action)) return { ok: false, detail: `got ${JSON.stringify(action)}` }
      const s = action as HookSetStatusAction
      return s.setStatus === "working..."
        ? { ok: true }
        : { ok: false, detail: `setStatus=${JSON.stringify(s.setStatus)}` }
    },
  },
  {
    name: "two action keys in one entry → rejected",
    yaml: `hooks:
  - event: session.idle
    actions:
      - notify: "a"
        setStatus: "b"
`,
    expectKind: "notify",
    check: () => ({ ok: false, detail: "this case uses custom runner" }),
  },
]

interface RuntimeRecord {
  readonly kind: "notify" | "confirm" | "setStatus"
  readonly args: unknown
}

interface RuntimeCase {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

function buildHookMap(actions: HookAction[], event: string): HookMap {
  const hooks: HookMap = new Map()
  hooks.set(event as HookMap extends Map<infer K, unknown> ? K : never, [
    {
      event: event as HookMap extends Map<infer K, unknown> ? K : never,
      actions,
      scope: "all",
      runIn: "current",
      source: { filePath: "/virtual/hooks.yaml", index: 0 },
    },
  ])
  return hooks
}

function createFakeHost(opts: { confirmReturn?: boolean; omitMethods?: boolean } = {}): {
  host: HostAdapter
  records: RuntimeRecord[]
} {
  const records: RuntimeRecord[] = []
  const base: HostAdapter = {
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
  }
  if (opts.omitMethods) {
    return { host: base, records }
  }
  const host: HostAdapter = {
    ...base,
    notify: (text, level) => {
      records.push({ kind: "notify", args: { text, level } })
    },
    confirm: async ({ title, message }) => {
      records.push({ kind: "confirm", args: { title, message } })
      return opts.confirmReturn ?? true
    },
    setStatus: (hookId, text) => {
      records.push({ kind: "setStatus", args: { hookId, text } })
    },
  }
  return { host, records }
}

const runtimeCases: RuntimeCase[] = [
  {
    name: "runtime dispatches notify with text + level",
    run: async () => {
      const { host, records } = createFakeHost()
      const hooks = buildHookMap(
        [{ notify: { text: "done", level: "success" as HookNotifyLevel } }],
        "tool.after.write",
      )
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/tmp/x.txt", content: "ok" },
      })
      const hit = records.find((r) => r.kind === "notify")
      if (!hit) return { ok: false, detail: `records=${JSON.stringify(records)}` }
      const args = hit.args as { text: string; level: string }
      return args.text === "done" && args.level === "success"
        ? { ok: true }
        : { ok: false, detail: `args=${JSON.stringify(args)}` }
    },
  },
  {
    name: "runtime dispatches setStatus with hookId + text",
    run: async () => {
      const { host, records } = createFakeHost()
      const hooks = buildHookMap([{ setStatus: "building" }], "tool.after.write")
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/tmp/x.txt", content: "ok" },
      })
      const hit = records.find((r) => r.kind === "setStatus")
      if (!hit) return { ok: false, detail: `records=${JSON.stringify(records)}` }
      const args = hit.args as { hookId: string; text: string }
      return args.text === "building" && args.hookId.length > 0
        ? { ok: true }
        : { ok: false, detail: `args=${JSON.stringify(args)}` }
    },
  },
  {
    name: "setStatus uses stable per-hook keys so hooks in one file do not collide",
    run: async () => {
      const { host, records } = createFakeHost()
      const hooks: HookMap = new Map()
      hooks.set("tool.after.write", [
        {
          id: "build-status",
          event: "tool.after.write",
          actions: [{ setStatus: "building" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 0 },
        },
        {
          id: "test-status",
          event: "tool.after.write",
          actions: [{ setStatus: "testing" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 1 },
        },
      ])
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/tmp/x.txt", content: "ok" },
      })
      const statuses = records.filter((r) => r.kind === "setStatus").map((r) => r.args as { hookId: string; text: string })
      // P3 #28: status slot keys are now stable on hookId only so a hooks
      // file rename/move keeps the existing slot. Duplicate ids in the same
      // file remain distinct here because they each have their own id.
      return statuses.length === 2 &&
          statuses[0]?.hookId !== statuses[1]?.hookId &&
          statuses[0]?.hookId === "pi-hooks:build-status" &&
          statuses[1]?.hookId === "pi-hooks:test-status"
        ? { ok: true }
        : { ok: false, detail: `statuses=${JSON.stringify(statuses)}` }
    },
  },
  {
    name: "setStatus fallback keys stay distinct when ids are absent",
    run: async () => {
      const { host, records } = createFakeHost()
      const hooks: HookMap = new Map()
      hooks.set("tool.after.write", [
        {
          event: "tool.after.write",
          actions: [{ setStatus: "building" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 0 },
        },
        {
          event: "tool.after.write",
          actions: [{ setStatus: "testing" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/hooks.yaml", index: 1 },
        },
      ])
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/tmp/x.txt", content: "ok" },
      })
      const statuses = records.filter((r) => r.kind === "setStatus").map((r) => r.args as { hookId: string; text: string })
      return statuses.length === 2 && statuses[0]?.hookId !== statuses[1]?.hookId
        ? { ok: true }
        : { ok: false, detail: `statuses=${JSON.stringify(statuses)}` }
    },
  },
  {
    name: "setStatus collapses duplicate ids across files (stable-hookId semantics)",
    run: async () => {
      // P3 #28: with stable-hookId-only keys, two hooks that share the same
      // user-supplied `id:` across different files intentionally share one
      // status slot. Authors are expected to keep `id:` unique across the
      // project; the unsuffixed form keeps the slot stable across file
      // rename/move, which is the more common operational case.
      const { host, records } = createFakeHost()
      const hooks: HookMap = new Map()
      hooks.set("tool.after.write", [
        {
          id: "shared-status",
          event: "tool.after.write",
          actions: [{ setStatus: "global" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/global-hooks.yaml", index: 0 },
        },
        {
          id: "shared-status",
          event: "tool.after.write",
          actions: [{ setStatus: "project" }],
          scope: "all",
          runIn: "current",
          source: { filePath: "/virtual/project-hooks.yaml", index: 0 },
        },
      ])
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      await runtime["tool.execute.after"]({
        tool: "write",
        sessionID: "s1",
        callID: "c1",
        args: { path: "/tmp/x.txt", content: "ok" },
      })
      const statuses = records.filter((r) => r.kind === "setStatus").map((r) => r.args as { hookId: string; text: string })
      return statuses.length === 2 &&
          statuses[0]?.hookId === "pi-hooks:shared-status" &&
          statuses[1]?.hookId === "pi-hooks:shared-status"
        ? { ok: true }
        : { ok: false, detail: `statuses=${JSON.stringify(statuses)}` }
    },
  },
  {
    name: "confirm=false on tool.before.* blocks the tool call",
    run: async () => {
      const { host, records } = createFakeHost({ confirmReturn: false })
      const hooks = buildHookMap(
        [{ confirm: { title: "Wait", message: "Sure?" } }],
        "tool.before.bash",
      )
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      let blocked = false
      try {
        await runtime["tool.execute.before"](
          { tool: "bash", sessionID: "s1", callID: "c2" },
          { args: { command: "echo hi" } },
        )
      } catch (error) {
        blocked = error instanceof Error && /confirm/i.test(error.message)
      }
      const sawConfirm = records.some((r) => r.kind === "confirm")
      if (!sawConfirm) return { ok: false, detail: `records=${JSON.stringify(records)}` }
      return blocked
        ? { ok: true }
        : { ok: false, detail: `did not block (records=${JSON.stringify(records)})` }
    },
  },
  {
    name: "host without UI methods skips notify/setStatus without throwing",
    run: async () => {
      const { host, records } = createFakeHost({ omitMethods: true })
      const hooks = buildHookMap(
        [{ notify: "hi" }, { setStatus: "idle" }],
        "tool.after.write",
      )
      const runtime = createHooksRuntime(host, { directory: "/tmp", hooks })
      const originalWarn = console.warn
      console.warn = () => {}
      try {
        await runtime["tool.execute.after"]({
          tool: "write",
          sessionID: "s1",
          callID: "c3",
          args: { path: "/tmp/y.txt", content: "ok" },
        })
      } finally {
        console.warn = originalWarn
      }
      return records.length === 0
        ? { ok: true }
        : { ok: false, detail: `records=${JSON.stringify(records)}` }
    },
  },
  {
    name: "adapter notify reports degraded when PI UI is unavailable",
    run: async () => {
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(pi, "/tmp", () => undefined, () => ({ hasUI: false } as never))
      const result = host.notify?.("hi", "warning")
      return result && typeof result === "object" && "status" in result && result.status === "degraded"
        ? { ok: true }
        : { ok: false, detail: `result=${JSON.stringify(result)}` }
    },
  },
  {
    name: "adapter UI actions use RPC UI when ctx.hasUI and UI methods exist",
    run: async () => {
      const calls: string[] = []
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(pi, "/tmp", () => undefined, () => ({
        mode: "rpc",
        hasUI: true,
        ui: {
          notify: (text: string) => calls.push(`notify:${text}`),
          confirm: async (_title: string, message: string) => {
            calls.push(`confirm:${message}`)
            return true
          },
          setStatus: (hookId: string, text?: string) => calls.push(`setStatus:${hookId}:${text ?? ""}`),
        },
      } as never))
      const notify = await Promise.resolve(host.notify?.("hi", "warning"))
      const approved = await host.confirm?.({ title: "Approve", message: "continue?" })
      const status = await Promise.resolve(host.setStatus?.("hook#1", "busy"))
      return notify && typeof notify === "object" && notify.status === "accepted" &&
          approved === true && status && typeof status === "object" && status.status === "accepted" &&
          calls.join("|") === "notify:hi|confirm:continue?|setStatus:hook#1:busy"
        ? { ok: true }
        : { ok: false, detail: `notify=${JSON.stringify(notify)}, approved=${String(approved)}, status=${JSON.stringify(status)}, calls=${JSON.stringify(calls)}` }
    },
  },
  {
    // P2-8: sendPrompt now skips sendUserMessage entirely when the live PI
    // session doesn't match the requested target, so the only path that
    // reaches a sendUserMessage failure is when sessions match. Pin that
    // path: with matching sessions, a throw from PI bubbles out as a
    // wrapped Error (non-stale messages re-throw; stale messages degrade).
    name: "adapter sendPrompt throws when sendUserMessage fails",
    run: async () => {
      const pi = {
        sendUserMessage: () => {
          throw new Error("send failed")
        },
      } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(
        pi,
        "/tmp",
        () => ({ getSessionId: () => "s1" } as never),
        () => undefined,
      )
      try {
        host.sendPrompt("s1", "hello")
        return { ok: false, detail: "sendPrompt did not throw" }
      } catch (error) {
        return error instanceof Error && /sendUserMessage failed: send failed/i.test(error.message)
          ? { ok: true }
          : { ok: false, detail: String(error) }
      }
    },
  },
  {
    name: "adapter sendPrompt reports degraded when PI can only target the current session",
    run: async () => {
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(
        pi,
        "/tmp",
        () => ({ getSessionId: () => "current-session" } as never),
        () => undefined,
      )
      const result = host.sendPrompt("root-session", "hello")
      return result && typeof result === "object" && "status" in result && result.status === "degraded"
        ? { ok: true }
        : { ok: false, detail: `result=${JSON.stringify(result)}` }
    },
  },
  {
    // P2-8: with matching sessions the call reaches sendUserMessage; if PI
    // throws a stale-session message we recognise it via the regex and
    // degrade rather than re-throwing. Mismatched sessions short-circuit
    // earlier (covered by the "PI can only target the current session"
    // case above) and never exercise this stale-error branch.
    name: "adapter sendPrompt reports degraded for stale session-bound PI API",
    run: async () => {
      const pi = {
        sendUserMessage: () => {
          throw new Error("stale session-bound ExtensionAPI after replacement")
        },
      } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(
        pi,
        "/tmp",
        () => ({ getSessionId: () => "s1" } as never),
        () => undefined,
      )
      const result = host.sendPrompt("s1", "hello")
      return result && typeof result === "object" && "status" in result && result.status === "degraded" && result.reason === "stale_session_context"
        ? { ok: true }
        : { ok: false, detail: `result=${JSON.stringify(result)}` }
    },
  },
  {
    name: "adapter UI actions report degraded for stale session-bound context",
    run: async () => {
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(pi, "/tmp", () => undefined, () => ({
        hasUI: true,
        ui: {
          notify: () => {
            throw new Error("stale session-bound ExtensionContext after replacement")
          },
          setStatus: () => {
            throw new Error("stale session-bound ExtensionContext after replacement")
          },
        },
      } as never))
      const notify = await Promise.resolve(host.notify?.("hi", "warning"))
      const setStatus = await Promise.resolve(host.setStatus?.("hook#1", "busy"))
      return notify && typeof notify === "object" && notify.status === "degraded" && notify.reason === "stale_session_context" &&
          setStatus && typeof setStatus === "object" && setStatus.status === "degraded" && setStatus.reason === "stale_session_context"
        ? { ok: true }
        : { ok: false, detail: `notify=${JSON.stringify(notify)}, setStatus=${JSON.stringify(setStatus)}` }
    },
  },
  {
    name: "adapter sessionManager access falls back when captured manager is stale",
    run: async () => {
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(
        pi,
        "/tmp",
        () => ({
          getSessionId: () => {
            throw new Error("stale session-bound sessionManager after replacement")
          },
          getHeader: () => {
            throw new Error("stale session-bound sessionManager after replacement")
          },
        } as never),
        () => undefined,
      )
      const result = host.getRootSessionId("s1")
      return result === "s1"
        ? { ok: true }
        : { ok: false, detail: `result=${JSON.stringify(result)}` }
    },
  },
  {
    name: "adapter setStatus throws when PI UI status update fails",
    run: async () => {
      const pi = { sendUserMessage: () => {} } as unknown as Parameters<typeof createHostAdapter>[0]
      const host = createHostAdapter(pi, "/tmp", () => undefined, () => ({
        hasUI: true,
        ui: {
          setStatus: () => {
            throw new Error("status failed")
          },
        },
      } as never))
      try {
        host.setStatus?.("hook#1", "busy")
        return { ok: false, detail: "setStatus did not throw" }
      } catch (error) {
        return error instanceof Error && /ui\.setStatus failed: status failed/i.test(error.message)
          ? { ok: true }
          : { ok: false, detail: String(error) }
      }
    },
  },
]

async function runParserCases(): Promise<number> {
  let failures = 0
  const originalInfo = console.info
  console.info = () => {}
  try {
    // Explicit multi-key rejection case — run outside the generic loop.
    const multiKeyResult = parseHooksFile(
      "/virtual/hooks.yaml",
      `hooks:
  - event: session.idle
    actions:
      - notify: "a"
        setStatus: "b"
`,
    )
    const multiKeyRejected = multiKeyResult.errors.some(
      (e) => e.code === "invalid_action" && /exactly one/i.test(e.message),
    )
    if (multiKeyRejected) {
      originalInfo("PASS  multi-key action entry is rejected")
    } else {
      failures += 1
      originalInfo(`FAIL  multi-key action entry is rejected -- errors=${JSON.stringify(multiKeyResult.errors)}`)
    }

    for (const c of parserCases) {
      if (c.name === "two action keys in one entry → rejected") continue
      const parsed = parseHooksFile("/virtual/hooks.yaml", c.yaml)
      if (parsed.errors.length > 0) {
        failures += 1
        originalInfo(`FAIL  ${c.name} -- errors=${JSON.stringify(parsed.errors)}`)
        continue
      }
      const firstEvent = [...parsed.hooks.keys()][0]
      const firstAction = firstEvent ? parsed.hooks.get(firstEvent)?.[0]?.actions[0] : undefined
      if (!firstAction) {
        failures += 1
        originalInfo(`FAIL  ${c.name} -- no action parsed`)
        continue
      }
      const outcome = c.check(firstAction)
      if (outcome.ok) {
        originalInfo(`PASS  ${c.name}`)
      } else {
        failures += 1
        originalInfo(`FAIL  ${c.name} -- ${outcome.detail ?? "no detail"}`)
      }
    }
  } finally {
    console.info = originalInfo
  }
  return failures
}

async function runRuntimeCases(): Promise<number> {
  let failures = 0
  for (const c of runtimeCases) {
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
  return failures
}

export async function main(): Promise<number> {
  console.info("--- parser ---")
  const parserFailures = await runParserCases()
  console.info("--- runtime ---")
  const runtimeFailures = await runRuntimeCases()
  const total = parserFailures + runtimeFailures
  console.info(`\nparser: ${parserCases.length - parserFailures}/${parserCases.length} passed`)
  console.info(`runtime: ${runtimeCases.length - runtimeFailures}/${runtimeCases.length} passed`)
  return total === 0 ? 0 : 1
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  /ux-actions\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
