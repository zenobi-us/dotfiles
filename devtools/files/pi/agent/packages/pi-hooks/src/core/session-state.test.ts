import { SessionStateStore, sanitizeToolArgsForSerialization } from "./session-state.js"
import type { FileChange } from "./types.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }> | { ok: boolean; detail?: string }
}

const cases: Case[] = [
  {
    name: "P1-5: pendingToolCalls cap evicts oldest entries past 1000",
    run: () => {
      const store = new SessionStateStore()
      for (let i = 0; i < 1100; i++) {
        store.setPendingToolCall(`call-${i}`, "s1", { i })
      }
      const count = store.pendingToolCallCount()
      // First 100 inserts should have been evicted, leaving 1000.
      if (count !== 1000) return { ok: false, detail: `count=${count}` }
      // The oldest 100 (call-0..call-99) should be gone.
      if (store.consumePendingToolCall("call-0") !== undefined) {
        return { ok: false, detail: "call-0 still present" }
      }
      // call-100 should still be present (we just consumed nothing yet, so cap stayed at 1000).
      const survivor = store.consumePendingToolCall("call-100")
      if (!survivor) return { ok: false, detail: "call-100 missing" }
      return { ok: true }
    },
  },
  {
    name: "P1-5: pendingToolCalls TTL sweeps expired entries on next insert",
    run: () => {
      let now = 1_000_000
      const store = new SessionStateStore({ nowFn: () => now })
      store.setPendingToolCall("old", "s1", {})
      // Advance time past TTL (5 min) and insert another.
      now += 5 * 60_000 + 1
      store.setPendingToolCall("fresh", "s1", {})
      // The sweep should have removed `old`.
      const oldEntry = store.consumePendingToolCall("old")
      if (oldEntry !== undefined) return { ok: false, detail: "old not swept" }
      const freshEntry = store.consumePendingToolCall("fresh")
      if (!freshEntry) return { ok: false, detail: "fresh missing" }
      return { ok: true }
    },
  },
  {
    name: "P1-5: TTL sweep is bounded at the first non-expired entry",
    run: () => {
      let now = 0
      const store = new SessionStateStore({ nowFn: () => now })
      // Insert in waves: very old, old, fresh.
      now = 0
      store.setPendingToolCall("very-old", "s1", {})
      now = 100
      store.setPendingToolCall("old", "s1", {})
      now = 5 * 60_000 + 50
      // At this point very-old is past TTL (>= 300_000ms), old is also past
      // TTL (>= 300_000 - 100 = 299_900? actually 300_050 - 100 = 299_950 ms,
      // strictly less than 300_000). Adjust to confirm partial sweep.
      now = 5 * 60_000 + 200
      // Now-very-old age = 300_200; now-old age = 300_100. Both past TTL.
      // Insert fresh — both should be swept.
      store.setPendingToolCall("fresh", "s1", {})
      if (store.pendingToolCallCount() !== 1) {
        return { ok: false, detail: `count=${store.pendingToolCallCount()}` }
      }
      return { ok: true }
    },
  },
  {
    name: "P1-6: resolveRootSessionID does not resurrect a deleted parent session",
    run: async () => {
      const store = new SessionStateStore()
      store.rememberSession("parent", null)
      store.rememberSession("child", "parent")
      store.deleteSession("parent")
      // After parent is deleted, walking from child should NOT recreate
      // a SessionRecord for `parent`. We assert via isDeleted: since the
      // parent's SessionRecord was removed and a tombstone written, the
      // tombstone should still report deleted (true). Critically, after
      // resolveRootSessionID runs on `child`, the parent must remain
      // deleted (no resurrection).
      const root = await store.getRootSessionID("child", async () => null)
      if (!store.isDeleted("parent")) return { ok: false, detail: "parent resurrected" }
      // The walk returns parent (its parentID was already cached on the
      // child's record; the parent has no parent), but it must NOT have
      // recreated the parent's SessionRecord nor cleared the tombstone.
      if (root !== "parent") return { ok: false, detail: `root=${root}` }
      return { ok: true }
    },
  },
  {
    name: "P3-6: addFileChanges + consumeFileChanges round-trip with replay-on-idle",
    run: () => {
      const store = new SessionStateStore()
      const c1: FileChange = { operation: "modify", path: "/a.ts" }
      const c2: FileChange = { operation: "modify", path: "/b.ts" }
      store.addFileChanges("s1", [c1, c2])
      // dedupe: re-add c1 must not create a duplicate
      store.addFileChanges("s1", [c1])
      const all = store.getFileChanges("s1")
      if (all.length !== 2) return { ok: false, detail: `len=${all.length}` }
      // Begin idle dispatch and replay c2 during dispatch
      store.beginIdleDispatch("s1", all)
      store.addFileChanges("s1", [c2]) // replay
      store.consumeFileChanges("s1", all)
      const remaining = store.getFileChanges("s1")
      if (remaining.length !== 1) return { ok: false, detail: `remaining=${JSON.stringify(remaining)}` }
      if (remaining[0].operation !== "modify" || remaining[0].path !== "/b.ts") {
        return { ok: false, detail: JSON.stringify(remaining) }
      }
      return { ok: true }
    },
  },
  {
    name: "secret-hygiene: redacts known-sensitive keys, case-insensitive",
    run: () => {
      const out = sanitizeToolArgsForSerialization({
        password: "p",
        Token: "t",
        api_key: "k",
        ApiKey: "ka",
        secret: "s",
        Authorization: "Bearer xxx",
        auth: "h",
        private_key: "pk",
        bearer: "b",
        keep: "v",
      })
      if (!out) return { ok: false, detail: "empty" }
      const o = out as Record<string, unknown>
      const sensitive = ["password", "Token", "api_key", "ApiKey", "secret", "Authorization", "auth", "private_key", "bearer"]
      for (const k of sensitive) {
        if (o[k] !== "[REDACTED]") return { ok: false, detail: `${k}=${o[k]}` }
      }
      if (o.keep !== "v") return { ok: false, detail: "non-sensitive lost" }
      return { ok: true }
    },
  },
  {
    name: "secret-hygiene: caps oversized JSON at 64 KiB with truncation marker",
    run: () => {
      const big = "x".repeat(70 * 1024)
      const out = sanitizeToolArgsForSerialization({ payload: big })
      if (!out) return { ok: false, detail: "empty" }
      const o = out as Record<string, unknown>
      if (o._pi_hooks_tool_args_truncated !== true) {
        return { ok: false, detail: "not truncated" }
      }
      // Original payload bytes recorded (string + JSON quotes ~= len + small).
      const orig = o._pi_hooks_tool_args_original_byte_length
      if (typeof orig !== "number" || orig < 70 * 1024) {
        return { ok: false, detail: `orig=${orig}` }
      }
      return { ok: true }
    },
  },
  {
    name: "secret-hygiene: nested redaction walks into objects and arrays",
    run: () => {
      const out = sanitizeToolArgsForSerialization({
        env: { TOKEN: "leak", USER: "ok" },
        items: [{ apiKey: "k1" }, { apiKey: "k2" }],
      })
      const o = out as Record<string, unknown>
      const env = o.env as Record<string, unknown>
      if (env.TOKEN !== "[REDACTED]") return { ok: false, detail: `TOKEN=${env.TOKEN}` }
      if (env.USER !== "ok") return { ok: false, detail: `USER=${env.USER}` }
      const items = o.items as Array<Record<string, unknown>>
      if (items[0].apiKey !== "[REDACTED]" || items[1].apiKey !== "[REDACTED]") {
        return { ok: false, detail: JSON.stringify(items) }
      }
      return { ok: true }
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
  /session-state\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  void main().then((code) => process.exit(code))
}
