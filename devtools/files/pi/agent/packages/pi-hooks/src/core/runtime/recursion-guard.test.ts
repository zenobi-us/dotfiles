import { AsyncLocalStorage } from "node:async_hooks"

import { RECURSION_DEPTH_CAP, withActionRecursionGuard } from "./recursion-guard.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

const cases: Case[] = [
  {
    name: "recursion guard dedupes nested same-key actions",
    run: async () => {
      const store = new AsyncLocalStorage<Set<string>>()
      const seen: string[] = []
      await withActionRecursionGuard(store, "same", async () => {
        seen.push("outer")
        const nested = await withActionRecursionGuard(store, "same", async () => {
          seen.push("inner")
          return "inner"
        })
        if (nested !== undefined) seen.push(`nested:${nested}`)
      })
      return JSON.stringify(seen) === JSON.stringify(["outer"])
        ? { ok: true }
        : { ok: false, detail: `seen=${JSON.stringify(seen)}` }
    },
  },
  {
    name: "recursion guard permits nested distinct keys",
    run: async () => {
      const store = new AsyncLocalStorage<Set<string>>()
      const seen: string[] = []
      await withActionRecursionGuard(store, "outer", async () => {
        seen.push("outer")
        await withActionRecursionGuard(store, "inner", async () => {
          seen.push("inner")
        })
      })
      return JSON.stringify(seen) === JSON.stringify(["outer", "inner"])
        ? { ok: true }
        : { ok: false, detail: `seen=${JSON.stringify(seen)}` }
    },
  },
  {
    name: "recursion guard cleans up after thrown execute",
    run: async () => {
      const store = new AsyncLocalStorage<Set<string>>()
      let threw = false
      try {
        await withActionRecursionGuard(store, "key", async () => {
          throw new Error("boom")
        })
      } catch {
        threw = true
      }
      let ranAfterThrow = false
      await withActionRecursionGuard(store, "key", async () => {
        ranAfterThrow = true
      })
      return threw && ranAfterThrow ? { ok: true } : { ok: false, detail: `threw=${threw} ranAfterThrow=${ranAfterThrow}` }
    },
  },
  {
    name: "recursion guard depth cap skips deeper nested actions",
    run: async () => {
      const store = new AsyncLocalStorage<Set<string>>()
      let executed = 0
      async function descend(depth: number): Promise<void> {
        const result = await withActionRecursionGuard(store, `key-${depth}`, async () => {
          executed += 1
          if (depth < RECURSION_DEPTH_CAP + 2) {
            await descend(depth + 1)
          }
          return true
        })
        if (depth > RECURSION_DEPTH_CAP && result !== undefined) {
          throw new Error(`depth ${depth} unexpectedly executed`)
        }
      }
      await descend(1)
      return executed === RECURSION_DEPTH_CAP
        ? { ok: true }
        : { ok: false, detail: `executed=${executed} cap=${RECURSION_DEPTH_CAP}` }
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
  /recursion-guard\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
