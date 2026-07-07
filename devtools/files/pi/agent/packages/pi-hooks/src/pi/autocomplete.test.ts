import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { resetPiHooksLoggerForTests } from "../core/logger.js"
import { registerHookAutocomplete, resetHookAutocompleteForTests } from "./autocomplete.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

type AutocompleteItem = { value: string; label: string; description?: string }
type Suggestions = { items: AutocompleteItem[]; prefix: string } | null
type AutocompleteProvider = {
  getSuggestions: (
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    options: { signal: AbortSignal; force?: boolean },
  ) => Promise<Suggestions>
  applyCompletion: (
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    item: AutocompleteItem,
    prefix: string,
  ) => { lines: string[]; cursorLine: number; cursorCol: number }
  shouldTriggerFileCompletion?: (lines: string[], cursorLine: number, cursorCol: number) => boolean
}
type Factory = (current: AutocompleteProvider) => AutocompleteProvider

function createNoopProvider(): AutocompleteProvider {
  return {
    async getSuggestions() {
      return null
    },
    applyCompletion(lines, cursorLine, cursorCol) {
      return { lines, cursorLine, cursorCol }
    },
  }
}

function createInnerProviderWithItem(item: AutocompleteItem): AutocompleteProvider {
  return {
    async getSuggestions() {
      return { items: [item], prefix: "" }
    },
    applyCompletion(lines, cursorLine, cursorCol) {
      return { lines, cursorLine, cursorCol }
    },
    shouldTriggerFileCompletion() {
      return true
    },
  }
}

interface FakeContext {
  readonly cwd: string
  readonly hasUI: boolean
  readonly mode?: string
  ui?: { addAutocompleteProvider?: (factory: Factory) => void }
  factories: Factory[]
}

function makeContext(opts: { projectDir: string; hasUI: boolean; expose: boolean; mode?: string }): FakeContext {
  const factories: Factory[] = []
  return {
    cwd: opts.projectDir,
    hasUI: opts.hasUI,
    ...(opts.mode !== undefined ? { mode: opts.mode } : {}),
    factories,
    ui: opts.hasUI
      ? {
          ...(opts.expose
            ? {
                addAutocompleteProvider: (factory: Factory) => {
                  factories.push(factory)
                },
              }
            : {}),
        }
      : undefined,
  }
}

function writeProjectHooks(projectDir: string, content: string): void {
  const filePath = path.join(projectDir, ".pi", "hook", "hooks.yaml")
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, "utf8")
}

async function withSandbox<T>(run: (projectDir: string) => Promise<T>): Promise<T> {
  const projectDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-autocomplete-"))
  const homeDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-home-"))
  const previousHome = process.env.HOME
  const previousUserProfile = process.env.USERPROFILE
  const previousTrust = process.env.PI_YAML_HOOKS_TRUST_PROJECT
  process.env.HOME = homeDir
  process.env.USERPROFILE = homeDir
  process.env.PI_YAML_HOOKS_TRUST_PROJECT = "1"
  resetPiHooksLoggerForTests()
  resetHookAutocompleteForTests()
  try {
    return await run(projectDir)
  } finally {
    if (previousHome === undefined) delete process.env.HOME
    else process.env.HOME = previousHome
    if (previousUserProfile === undefined) delete process.env.USERPROFILE
    else process.env.USERPROFILE = previousUserProfile
    if (previousTrust === undefined) delete process.env.PI_YAML_HOOKS_TRUST_PROJECT
    else process.env.PI_YAML_HOOKS_TRUST_PROJECT = previousTrust
    resetPiHooksLoggerForTests()
    resetHookAutocompleteForTests()
    rmSync(projectDir, { recursive: true, force: true })
    rmSync(homeDir, { recursive: true, force: true })
  }
}

const signal = () => new AbortController().signal

const cases: Case[] = [
  {
    name: "skips registration when ctx.hasUI is false",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: false, expose: false })
        registerHookAutocomplete(ctx as never)
        return ctx.factories.length === 0
          ? { ok: true }
          : { ok: false, detail: `factories=${ctx.factories.length}` }
      }),
  },
  {
    name: "skips registration when addAutocompleteProvider is missing",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: false })
        registerHookAutocomplete(ctx as never)
        return ctx.factories.length === 0
          ? { ok: true }
          : { ok: false, detail: `factories=${ctx.factories.length}` }
      }),
  },
  {
    name: "skips TUI-only autocomplete registration in RPC mode even when UI exists",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true, mode: "rpc" })
        registerHookAutocomplete(ctx as never)
        return ctx.factories.length === 0
          ? { ok: true }
          : { ok: false, detail: `factories=${ctx.factories.length}` }
      }),
  },
  {
    name: "registers exactly one factory and is idempotent",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        registerHookAutocomplete(ctx as never)
        return ctx.factories.length === 1
          ? { ok: true }
          : { ok: false, detail: `factories=${ctx.factories.length}` }
      }),
  },
  {
    name: "suggests all hook slash commands when token prefix is /hooks-",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        // Use the bare /hooks- prefix so every hooks-* label matches the substring filter.
        const input = "/hooks-"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const values = suggestions?.items.map((i) => i.value) ?? []
        const required = ["hooks-status", "hooks-validate", "hooks-trust", "hooks-reload", "hooks-tail-log"]
        const missing = required.filter((r) => !values.includes(r))
        return missing.length === 0 ? { ok: true } : { ok: false, detail: `missing=${missing.join(",")} got=${JSON.stringify(values)}` }
      }),
  },
  {
    name: "filters slash command completions by prefix on label/value",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const input = "/hooks-st"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const values = suggestions?.items.map((i) => i.value) ?? []
        return values.includes("hooks-status") && !values.includes("hooks-reload")
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(values) }
      }),
  },
  {
    // P3-5: substring-of-the-name like "us" used to wrongly surface
    // "hooks-status" because the substring sat inside "status". With prefix
    // matching the user must start typing the actual command name.
    name: "prefix-matches command names so unrelated substrings do not match",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const input = "/us"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        // Outside the /hooks- token the provider returns null, so any
        // suggestions should not include hooks-status via false-positive
        // substring match.
        const values = suggestions?.items.map((i) => i.value) ?? []
        return !values.includes("hooks-status")
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(values) }
      }),
  },
  {
    // P1-11: state captured at registration must not freeze; a hook id
    // added to hooks.yaml after registration should appear on the next
    // suggestion call.
    name: "picks up newly added hook ids without re-registering",
    run: async () =>
      await withSandbox(async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - id: original-hook
    event: tool.after.write
    actions:
      - notify: ok
`,
        )
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())

        // Add a new hook id after the provider has been registered.
        writeProjectHooks(
          projectDir,
          `hooks:
  - id: original-hook
    event: tool.after.write
    actions:
      - notify: ok
  - id: brand-new-hook
    event: tool.after.read
    actions:
      - notify: ok
`,
        )

        const input = "/hooks-status brand-"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const values = suggestions?.items.map((i) => i.value) ?? []
        return values.includes("brand-new-hook")
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(values) }
      }),
  },
  {
    name: "returns null suggestions outside /hooks- prefix",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const suggestions = await provider.getSuggestions(["echo hi"], 0, "echo hi".length, { signal: signal() })
        return suggestions === null ? { ok: true } : { ok: false, detail: JSON.stringify(suggestions) }
      }),
  },
  {
    name: "suggests hook ids and event names as arguments to /hooks-status",
    run: async () =>
      await withSandbox(async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - id: my-cool-hook
    event: tool.after.write
    actions:
      - notify: ok
`,
        )
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const input = "/hooks-status "
        const idSuggestions = await provider.getSuggestions([input + "my"], 0, (input + "my").length, { signal: signal() })
        const idValues = idSuggestions?.items.map((i) => i.value) ?? []
        const eventInput = "/hooks-status tool.after"
        const eventSuggestions = await provider.getSuggestions([eventInput], 0, eventInput.length, { signal: signal() })
        const eventValues = eventSuggestions?.items.map((i) => i.value) ?? []
        const ok = idValues.includes("my-cool-hook") && eventValues.includes("tool.after.write")
        return ok
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ idValues, eventValues }) }
      }),
  },
  {
    name: "/hooks-tail-log argument completions include --follow and --path",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const input = "/hooks-tail-log --"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const values = suggestions?.items.map((i) => i.value) ?? []
        return values.includes("--follow") && values.includes("--path")
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(values) }
      }),
  },
  {
    name: "/hooks-trust argument completions include the project config path",
    run: async () =>
      await withSandbox(async (projectDir) => {
        writeProjectHooks(projectDir, `hooks:\n  - event: session.idle\n    actions:\n      - notify: hi\n`)
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const input = "/hooks-trust "
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const values = suggestions?.items.map((i) => i.value) ?? []
        const expected = path.join(projectDir, ".pi", "hook", "hooks.yaml")
        return values.includes(expected) ? { ok: true } : { ok: false, detail: JSON.stringify({ values, expected }) }
      }),
  },
  {
    name: "merges hook suggestions with inner provider suggestions, deduping by value",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const innerItem: AutocompleteItem = { value: "hooks-status", label: "/inner-hooks-status" }
        const provider = ctx.factories[0](createInnerProviderWithItem(innerItem))
        const input = "/hooks-st"
        const suggestions = await provider.getSuggestions([input], 0, input.length, { signal: signal() })
        const items = suggestions?.items ?? []
        const statusItems = items.filter((i) => i.value === "hooks-status")
        // Hook (primary) suggestion should take precedence over inner duplicate.
        return statusItems.length === 1 && statusItems[0].label === "/hooks-status"
          ? { ok: true }
          : { ok: false, detail: JSON.stringify(items) }
      }),
  },
  {
    name: "delegates applyCompletion to the inner provider",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        let applyCalls = 0
        const inner: AutocompleteProvider = {
          async getSuggestions() {
            return null
          },
          applyCompletion(lines, cursorLine, cursorCol) {
            applyCalls += 1
            return { lines: ["delegated"], cursorLine, cursorCol }
          },
        }
        const provider = ctx.factories[0](inner)
        const result = provider.applyCompletion(["x"], 0, 0, { value: "hooks-status", label: "/hooks-status" }, "/hooks-st")
        return applyCalls === 1 && result.lines[0] === "delegated"
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ applyCalls, result }) }
      }),
  },
  {
    name: "shouldTriggerFileCompletion delegates to inner provider when present",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createInnerProviderWithItem({ value: "x", label: "x" }))
        const triggered = provider.shouldTriggerFileCompletion?.(["foo"], 0, 0) ?? false
        return triggered === true ? { ok: true } : { ok: false, detail: String(triggered) }
      }),
  },
  {
    name: "shouldTriggerFileCompletion returns false when inner provider doesn't implement it",
    run: async () =>
      await withSandbox(async (projectDir) => {
        const ctx = makeContext({ projectDir, hasUI: true, expose: true })
        registerHookAutocomplete(ctx as never)
        const provider = ctx.factories[0](createNoopProvider())
        const triggered = provider.shouldTriggerFileCompletion?.(["foo"], 0, 0) ?? false
        return triggered === false ? { ok: true } : { ok: false, detail: String(triggered) }
      }),
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
  /autocomplete\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
