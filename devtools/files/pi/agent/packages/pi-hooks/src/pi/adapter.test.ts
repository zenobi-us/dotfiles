import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { resetPiHooksLoggerForTests } from "../core/logger.js"
import { __testing__ as adapterTesting } from "./adapter.js"
import { resetHookAutocompleteForTests } from "./autocomplete.js"

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const extensionEntrypointPath = currentDir.endsWith(`${path.sep}dist${path.sep}pi`)
  ? path.resolve(currentDir, "../extensions/index.js")
  : path.resolve(currentDir, "../../extensions/index.ts")
const { default: piHooksExtension } = (await import(pathToFileURL(extensionEntrypointPath).href)) as {
  default: (pi: unknown) => void
}

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

type PiHandler = (event: unknown, ctx: unknown) => Promise<unknown> | unknown
type CommandHandler = (args: string, ctx: unknown) => Promise<void>
type AutocompleteItem = { value: string; label: string; description?: string }
type AutocompleteProvider = {
  getSuggestions: (
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    options: { signal: AbortSignal; force?: boolean },
  ) => Promise<{ items: AutocompleteItem[]; prefix: string } | null>
  applyCompletion: (
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    item: AutocompleteItem,
    prefix: string,
  ) => { lines: string[]; cursorLine: number; cursorCol: number }
  shouldTriggerFileCompletion?: (lines: string[], cursorLine: number, cursorCol: number) => boolean
}
type AutocompleteProviderFactory = (current: AutocompleteProvider) => AutocompleteProvider

class FakePiHarness {
  readonly projectDir: string
  readonly notifications: string[] = []
  readonly statusUpdates: Array<{ hookId: string; text?: string }> = []
  readonly confirms: Array<{ title: string; message: string }> = []
  readonly userMessages: Array<{ text: string; options?: unknown }> = []
  readonly customMessages: Array<{ customType: string; content: unknown; display: boolean; details?: unknown }> = []
  readonly handlers = new Map<string, PiHandler[]>()
  readonly commands = new Map<string, CommandHandler>()
  readonly messageRenderers = new Map<string, unknown>()
  readonly autocompleteProviders: AutocompleteProviderFactory[] = []
  sessionId: string
  private sessionGeneration = 0
  throwOnStalePiUse = false
  hasUI = true
  exposeAutocomplete = true
  confirmResult = true
  reloads = 0
  notificationsWithLevel: Array<{ message: string; type?: string }> = []

  constructor(projectDir: string, sessionId = "session-1") {
    this.projectDir = projectDir
    this.sessionId = sessionId
  }

  register(): void {
    const piGeneration = this.sessionGeneration
    const pi = {
      on: (event: string, handler: PiHandler) => {
        const handlers = this.handlers.get(event) ?? []
        handlers.push(handler)
        this.handlers.set(event, handlers)
      },
      registerCommand: (name: string, options: { handler: CommandHandler }) => {
        this.commands.set(name, options.handler)
      },
      registerMessageRenderer: (customType: string, renderer: unknown) => {
        this.messageRenderers.set(customType, renderer)
      },
      sendUserMessage: (text: string, options?: unknown) => {
        if (this.throwOnStalePiUse && piGeneration !== this.sessionGeneration) {
          throw new Error("stale session-bound ExtensionAPI after replacement")
        }
        this.userMessages.push({ text, options })
      },
      sendMessage: (message: { customType: string; content: unknown; display: boolean; details?: unknown }) => {
        this.customMessages.push(message)
      },
    } as unknown as Parameters<typeof piHooksExtension>[0]

    piHooksExtension(pi)
  }

  createContext(): unknown {
    const contextGeneration = this.sessionGeneration
    const assertFresh = () => {
      if (contextGeneration !== this.sessionGeneration) {
        throw new Error("stale session-bound ExtensionContext after replacement")
      }
    }
    return {
      cwd: this.projectDir,
      hasUI: this.hasUI,
      ui: this.hasUI
        ? {
            notify: (text: string, type?: string) => {
              assertFresh()
              this.notifications.push(text)
              this.notificationsWithLevel.push({ message: text, type })
            },
            confirm: async (title: string, message: string) => {
              assertFresh()
              this.confirms.push({ title, message })
              return this.confirmResult
            },
            setStatus: (hookId: string, text?: string) => {
              assertFresh()
              this.statusUpdates.push({ hookId, text })
            },
            ...(this.exposeAutocomplete
              ? {
                  addAutocompleteProvider: (factory: AutocompleteProviderFactory) => {
                    this.autocompleteProviders.push(factory)
                  },
                }
              : {}),
          }
        : undefined,
      sessionManager: {
        getSessionId: () => {
          assertFresh()
          return this.sessionId
        },
        getHeader: () => {
          assertFresh()
          return { id: this.sessionId }
        },
      },
      isIdle: () => true,
      hasPendingMessages: () => false,
      reload: async () => {
        this.reloads += 1
      },
    } as never
  }

  replaceSession(sessionId: string): void {
    this.sessionId = sessionId
    this.sessionGeneration += 1
  }

  async emit(eventName: string, event: unknown = {}): Promise<unknown> {
    const handlers = this.handlers.get(eventName)
    if (!handlers || handlers.length === 0) {
      throw new Error(`${eventName} handler was not registered`)
    }

    let result: unknown
    for (const handler of handlers) {
      const handlerResult = await handler(event, this.createContext())
      if (handlerResult !== undefined) {
        result = handlerResult
      }
    }
    return result
  }

  async sessionStart(reason: "new" | "startup" | "resume" | "fork" = "new"): Promise<void> {
    await this.emit("session_start", { reason })
  }

  async sessionBeforeSwitch(reason?: "new" | "resume"): Promise<void> {
    await this.emit("session_before_switch", reason ? { type: "session_before_switch", reason } : {})
  }

  async sessionShutdown(reason?: "quit" | "reload" | "new" | "resume" | "fork"): Promise<void> {
    await this.emit("session_shutdown", reason ? { type: "session_shutdown", reason } : {})
  }

  async beforeAgentStart(prompt = "hi", systemPrompt = "base system prompt"): Promise<unknown> {
    return await this.emit("before_agent_start", { type: "before_agent_start", prompt, systemPrompt })
  }

  async agentEnd(): Promise<void> {
    await this.emit("agent_end")
  }

  async toolCall(toolName: string, toolCallId: string, input: Record<string, unknown> = {}): Promise<unknown> {
    return await this.emit("tool_call", { toolName, toolCallId, input })
  }

  async toolResult(toolName: string, toolCallId: string, input: Record<string, unknown> = {}): Promise<void> {
    await this.emit("tool_result", { toolName, toolCallId, input })
  }

  async userBash(command: string, excludeFromContext = false): Promise<unknown> {
    return await this.emit("user_bash", { type: "user_bash", command, excludeFromContext, cwd: this.projectDir })
  }

  async command(name: string, args = ""): Promise<void> {
    const handler = this.commands.get(name)
    if (!handler) {
      throw new Error(`${name} command was not registered`)
    }

    await handler(args, this.createContext())
  }
}

function writeProjectHooks(projectDir: string, content: string): void {
  const filePath = path.join(projectDir, ".pi", "hook", "hooks.yaml")
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, "utf8")
}

function withTrust<T>(trusted: boolean, run: () => Promise<T>): Promise<T> {
  const previousTrust = process.env.PI_YAML_HOOKS_TRUST_PROJECT
  if (trusted) process.env.PI_YAML_HOOKS_TRUST_PROJECT = "1"
  else delete process.env.PI_YAML_HOOKS_TRUST_PROJECT
  return run().finally(() => {
    if (previousTrust === undefined) delete process.env.PI_YAML_HOOKS_TRUST_PROJECT
    else process.env.PI_YAML_HOOKS_TRUST_PROJECT = previousTrust
  })
}

async function withIsolatedProject<T>(trusted: boolean, run: (projectDir: string) => Promise<T>): Promise<T> {
  const projectDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-adapter-"))
  const homeDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-home-"))
  const previousWarn = console.warn
  const previousInfo = console.info
  const previousError = console.error
  const previousHome = process.env.HOME
  const previousUserProfile = process.env.USERPROFILE
  process.env.HOME = homeDir
  process.env.USERPROFILE = homeDir
  resetPiHooksLoggerForTests()
  resetHookAutocompleteForTests()
  console.warn = () => {}
  console.info = () => {}
  console.error = () => {}

  return withTrust(trusted, async () => {
    try {
      return await run(projectDir)
    } finally {
      console.warn = previousWarn
      console.info = previousInfo
      console.error = previousError
      if (previousHome === undefined) delete process.env.HOME
      else process.env.HOME = previousHome
      if (previousUserProfile === undefined) delete process.env.USERPROFILE
      else process.env.USERPROFILE = previousUserProfile
      resetPiHooksLoggerForTests()
      resetHookAutocompleteForTests()
      rmSync(projectDir, { recursive: true, force: true })
      rmSync(homeDir, { recursive: true, force: true })
    }
  })
}

function readTrustedProjectsFile(): string[] {
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), ".pi", "agent", "trusted-projects.json")
  if (!existsSync(filePath)) {
    return []
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as string[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createNoopAutocompleteProvider(): AutocompleteProvider {
  return {
    async getSuggestions() {
      return null
    },
    applyCompletion(lines, cursorLine, cursorCol) {
      return { lines, cursorLine, cursorCol }
    },
  }
}

function createSlashCommandAutocompleteProvider(): AutocompleteProvider {
  return {
    async getSuggestions() {
      return null
    },
    applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
      const line = lines[cursorLine] ?? ""
      const replacementStart = Math.max(0, cursorCol - prefix.length)
      const replacement = line.startsWith("/") ? `/${item.value} ` : `${item.value} `
      const nextLine = `${line.slice(0, replacementStart)}${replacement}${line.slice(cursorCol)}`
      const nextLines = [...lines]
      nextLines[cursorLine] = nextLine
      return { lines: nextLines, cursorLine, cursorCol: replacementStart + replacement.length }
    },
  }
}

const cases: Case[] = [
  {
    name: "trusted project hooks load through PI session lifecycle events",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.created
    actions:
      - notify: "trusted-created"
  - event: session.idle
    actions:
      - notify: "trusted-idle"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionStart("new")
        await harness.agentEnd()

        const expected = JSON.stringify(["trusted-created", "trusted-idle"])
        return JSON.stringify(harness.notifications) === expected
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "registers the hook diagnostics message renderer",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        return harness.messageRenderers.has("pi-hooks-diagnostics")
          ? { ok: true }
          : { ok: false, detail: `renderers=${JSON.stringify(Array.from(harness.messageRenderers.keys()))}` }
      }),
  },
  {
    name: "before_agent_start injects concise hook awareness into the system prompt",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        const result = await harness.beforeAgentStart("help me write hooks", "base system prompt")

        return result &&
            typeof result === "object" &&
            "systemPrompt" in result &&
            typeof result.systemPrompt === "string" &&
            result.systemPrompt.includes("Hook-awareness for this session:") &&
            result.systemPrompt.includes("pi-hooks loaded 1 hooks")
          ? { ok: true }
          : { ok: false, detail: `result=${JSON.stringify(result)}` }
      }),
  },
  {
    name: "before_agent_start mentions UI degradation in headless mode",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.hasUI = false
        harness.register()
        const result = await harness.beforeAgentStart()

        return result &&
            typeof result === "object" &&
            "systemPrompt" in result &&
            typeof result.systemPrompt === "string" &&
            result.systemPrompt.includes("UI is unavailable in this mode")
          ? { ok: true }
          : { ok: false, detail: `result=${JSON.stringify(result)}` }
      }),
  },
  {
    name: "before_agent_start warns when current hook files are invalid",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify:
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        const result = await harness.beforeAgentStart()

        return result &&
            typeof result === "object" &&
            "systemPrompt" in result &&
            typeof result.systemPrompt === "string" &&
            result.systemPrompt.includes("validation issue") &&
            result.systemPrompt.includes("/hooks-validate")
          ? { ok: true }
          : { ok: false, detail: `result=${JSON.stringify(result)}` }
      }),
  },
  {
    name: "before_agent_start can be disabled by environment variable",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const previous = process.env.PI_YAML_HOOKS_PROMPT_AWARENESS
        process.env.PI_YAML_HOOKS_PROMPT_AWARENESS = "0"
        try {
          writeProjectHooks(
            projectDir,
            `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
          )

          const harness = new FakePiHarness(projectDir)
          harness.register()
          const result = await harness.beforeAgentStart()

          return result === undefined
            ? { ok: true }
            : { ok: false, detail: `result=${JSON.stringify(result)}` }
        } finally {
          if (previous === undefined) delete process.env.PI_YAML_HOOKS_PROMPT_AWARENESS
          else process.env.PI_YAML_HOOKS_PROMPT_AWARENESS = previous
        }
      }),
  },
  {
    name: "untrusted project hooks do not load through the lifecycle harness",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.created
    actions:
      - notify: "should-not-run"
  - event: session.idle
    actions:
      - notify: "should-not-run"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionStart("new")
        await harness.agentEnd()

        return harness.notifications.length === 0
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "session.created only fires for new/startup, not resume or fork",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.created
    actions:
      - notify: "created"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionStart("new")
        await harness.sessionStart("startup")
        await harness.sessionStart("resume")
        await harness.sessionStart("fork")

        const expected = JSON.stringify(["created", "created"])
        return JSON.stringify(harness.notifications) === expected
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "session.deleted cleanup runs once across before_switch and shutdown",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.deleted
    actions:
      - notify: "deleted"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionBeforeSwitch()
        await harness.sessionShutdown()

        const expected = JSON.stringify(["deleted"])
        return JSON.stringify(harness.notifications) === expected
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    // P1-4: PI's session_shutdown/session_before_switch carry a `reason`
    // field. The adapter must pass it through to hooks intact (we verify
    // by firing each event with a representative reason and confirming
    // the cleanup hook still runs exactly once).
    name: "session.deleted forwards PI's reason for shutdown and before_switch",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.deleted
    actions:
      - notify: "deleted-with-reason"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        // session_before_switch fires first with reason="new" (PI emits this
        // when /new replaces the session); session_shutdown follows with
        // reason="new" — the dedupe in markSessionDeleted means only the
        // first reaches the runtime.
        await harness.sessionBeforeSwitch("new")
        await harness.sessionShutdown("new")

        const ok = harness.notifications.length === 1 && harness.notifications[0] === "deleted-with-reason"
        return ok
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "opt-in user_bash interception blocks destructive commands via pre-bash hooks",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const previous = process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
        process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = "1"
        try {
          writeProjectHooks(
            projectDir,
            `hooks:
  - event: tool.before.bash
    actions:
      - confirm:
          title: "Dangerous command"
          message: "Run user bash command?"
`,
          )

          const harness = new FakePiHarness(projectDir)
          harness.hasUI = false
          harness.register()
          const result = await harness.userBash("rm -rf .")

          return result &&
              typeof result === "object" &&
              "result" in result &&
              typeof result.result === "object" &&
              result.result !== null &&
              "cancelled" in result.result &&
              result.result.cancelled === true &&
              "output" in result.result &&
              typeof result.result.output === "string" &&
              result.result.output.includes("user_bash blocked")
            ? { ok: true }
            : { ok: false, detail: `result=${JSON.stringify(result)}` }
        } finally {
          if (previous === undefined) delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
          else process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = previous
        }
      }),
  },
  {
    name: "user_bash interception is disabled by default",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: tool.before.bash
    actions:
      - confirm:
          title: "Dangerous command"
          message: "Run user bash command?"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.hasUI = false
        harness.register()
        const result = await harness.userBash("rm -rf .")

        return result === undefined
          ? { ok: true }
          : { ok: false, detail: `result=${JSON.stringify(result)}` }
      }),
  },
  {
    name: "allowed user_bash commands can run repeatedly without stale pre-hook state",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const previous = process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
        process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = "1"
        try {
          writeProjectHooks(
            projectDir,
            `hooks:
  - event: tool.before.bash
    actions:
      - notify: "checking user bash"
`,
          )

          const harness = new FakePiHarness(projectDir)
          harness.register()
          const first = await harness.userBash("echo one")
          const second = await harness.userBash("echo two")

          const hookNotifications = harness.notifications.filter((message) => message === "checking user bash")
          const uiWarning = harness.notifications.some((message) => message.includes("PI_YAML_HOOKS_ENABLE_USER_BASH=1"))
          return first === undefined && second === undefined && hookNotifications.length === 2 && uiWarning
            ? { ok: true }
            : {
                ok: false,
                detail: `first=${JSON.stringify(first)}, second=${JSON.stringify(second)}, notifications=${JSON.stringify(harness.notifications)}`,
              }
        } finally {
          if (previous === undefined) delete process.env.PI_YAML_HOOKS_ENABLE_USER_BASH
          else process.env.PI_YAML_HOOKS_ENABLE_USER_BASH = previous
        }
      }),
  },
  {
    name: "tool actions queue PI follow-up prompts through sendUserMessage",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: tool.after.write
    actions:
      - tool:
          name: grep
          args:
            pattern: TODO
            path: src
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.toolResult("write", "call-1", { path: path.join(projectDir, "src", "file.ts"), content: "ok" })

        if (harness.userMessages.length !== 1) {
          return { ok: false, detail: `userMessages=${JSON.stringify(harness.userMessages)}` }
        }

        const [{ text, options }] = harness.userMessages
        return text.includes("Use the grep tool") && JSON.stringify(options) === JSON.stringify({ deliverAs: "followUp" })
          ? { ok: true }
          : { ok: false, detail: `userMessages=${JSON.stringify(harness.userMessages)}` }
      }),
  },
  {
    name: "delayed async follow-up prompt degrades instead of throwing after session replacement",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: tool.after.write
    async: true
    actions:
      - bash: "sleep 0.05"
      - tool:
          name: grep
          args:
            pattern: TODO
            path: src
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.throwOnStalePiUse = true
        harness.register()
        await harness.toolResult("write", "call-stale-prompt", { path: path.join(projectDir, "src", "file.ts"), content: "ok" })
        harness.replaceSession("session-2")
        await sleep(150)

        return harness.userMessages.length === 0
          ? { ok: true }
          : { ok: false, detail: `userMessages=${JSON.stringify(harness.userMessages)}` }
      }),
  },
  {
    name: "headless confirm denies tool execution by default",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: tool.before.bash
    actions:
      - confirm:
          title: "Approval required"
          message: "Run command?"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.hasUI = false
        harness.register()
        const result = await harness.toolCall("bash", "call-2", { command: "echo hi" })

        return result &&
            typeof result === "object" &&
            "block" in result &&
            result.block === true &&
            "reason" in result &&
            typeof result.reason === "string" &&
            /confirm/i.test(result.reason) &&
            harness.confirms.length === 0
          ? { ok: true }
          : { ok: false, detail: `result=${JSON.stringify(result)}, confirms=${JSON.stringify(harness.confirms)}` }
      }),
  },
  {
    name: "edited hooks reload through PI events and invalid edits keep last known good config",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle-v1"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()

        await harness.agentEnd()

        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle-v2"
`,
        )
        await harness.toolResult("edit", "call-3", { path: path.join(projectDir, ".pi", "hook", "hooks.yaml") })
        await harness.agentEnd()

        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify:
`,
        )
        await harness.toolResult("edit", "call-4", { path: path.join(projectDir, ".pi", "hook", "hooks.yaml") })
        await harness.agentEnd()

        const expected = JSON.stringify(["idle-v1", "idle-v2", "idle-v2"])
        return JSON.stringify(harness.notifications) === expected
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "edited imported hooks reload through PI events and invalid imported edits keep last known good config",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const importedPath = path.join(projectDir, ".pi", "hook", "imports", "session-idle.yaml")
        mkdirSync(path.dirname(importedPath), { recursive: true })
        writeFileSync(
          path.join(projectDir, ".pi", "hook", "hooks.yaml"),
          `imports:
  - ./imports/session-idle.yaml
hooks: []
`,
          "utf8",
        )
        writeFileSync(
          importedPath,
          `hooks:
  - event: session.idle
    actions:
      - notify: "import-v1"
`,
          "utf8",
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()

        await harness.agentEnd()

        writeFileSync(
          importedPath,
          `hooks:
  - event: session.idle
    actions:
      - notify: "import-v2"
`,
          "utf8",
        )
        await harness.toolResult("edit", "call-import-1", { path: importedPath })
        await harness.agentEnd()

        writeFileSync(
          importedPath,
          `hooks:
  - event: session.idle
    actions:
      - notify:
`,
          "utf8",
        )
        await harness.toolResult("edit", "call-import-2", { path: importedPath })
        await harness.agentEnd()

        const expected = JSON.stringify(["import-v1", "import-v2", "import-v2"])
        return JSON.stringify(harness.notifications) === expected
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "hooks-status command reports active hooks and trust state",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-status")

        return harness.customMessages.some((message) => message.customType === "pi-hooks-diagnostics") &&
            harness.customMessages.some((message) => JSON.stringify(message.content).includes("Project trusted: yes"))
          ? { ok: true }
          : { ok: false, detail: `messages=${JSON.stringify(harness.customMessages)}` }
      }),
  },
  {
    name: "hooks-status does not claim project hooks exist when no project file is present",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-status")

        return harness.customMessages.some((message) => JSON.stringify(message.content).includes(`Project config: ${projectDir}/.pi/hook/hooks.yaml (missing)`)) &&
            harness.customMessages.every((message) => !JSON.stringify(message.content).includes("Project hooks exist but are not active"))
          ? { ok: true }
          : { ok: false, detail: `messages=${JSON.stringify(harness.customMessages)}` }
      }),
  },
  {
    name: "hooks-validate command explains untrusted project hooks",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-validate")

        return harness.customMessages.some((message) => JSON.stringify(message.content).includes("valid but untrusted")) &&
            harness.customMessages.some((message) => JSON.stringify(message.content).includes("/hooks-trust"))
          ? { ok: true }
          : { ok: false, detail: `messages=${JSON.stringify(harness.customMessages)}` }
      }),
  },
  {
    name: "hooks-trust command writes the current project to trusted-projects.json",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-trust")

        const trustedProjects = readTrustedProjectsFile()
        return trustedProjects.includes(realpathSync.native(projectDir))
          ? { ok: true }
          : { ok: false, detail: `trustedProjects=${JSON.stringify(trustedProjects)}` }
      }),
  },
  {
    name: "hooks-trust warns when no project hook file exists",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-trust")

        return harness.notifications.some((message) => message.includes("No project hook file was found")) &&
            readTrustedProjectsFile().length === 0
          ? { ok: true }
          : {
              ok: false,
              detail: `notifications=${JSON.stringify(harness.notifications)}, trusted=${JSON.stringify(readTrustedProjectsFile())}`,
            }
      }),
  },
  {
    name: "hooks-trust refuses to overwrite malformed trusted-projects.json",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )
        const trustFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), ".pi", "agent", "trusted-projects.json")
        mkdirSync(path.dirname(trustFile), { recursive: true })
        writeFileSync(trustFile, "{not-json", "utf8")

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-trust")

        return harness.notifications.some((message) => message.includes("not valid JSON")) &&
            readFileSync(trustFile, "utf8") === "{not-json"
          ? { ok: true }
          : {
              ok: false,
              detail: `notifications=${JSON.stringify(harness.notifications)}, trustFile=${JSON.stringify(readFileSync(trustFile, "utf8"))}`,
            }
      }),
  },
  {
    name: "hooks-trust dedupes an existing symlinked trust anchor",
    run: async () =>
      await withIsolatedProject(false, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify: "idle"
`,
        )
        const symlinkDir = `${projectDir}-alias`
        symlinkSync(projectDir, symlinkDir)
        const trustFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), ".pi", "agent", "trusted-projects.json")
        mkdirSync(path.dirname(trustFile), { recursive: true })
        writeFileSync(trustFile, JSON.stringify([symlinkDir], null, 2) + "\n", "utf8")

        try {
          const harness = new FakePiHarness(projectDir)
          harness.register()
          await harness.command("hooks-trust")

          const trustedProjects = readTrustedProjectsFile()
          return trustedProjects.length === 1 && trustedProjects[0] === symlinkDir
            ? { ok: true }
            : { ok: false, detail: `trustedProjects=${JSON.stringify(trustedProjects)}` }
        } finally {
          rmSync(symlinkDir, { force: true, recursive: true })
        }
      }),
  },
  {
    name: "hooks-reload command triggers PI extension reload",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-reload")

        return harness.reloads === 1
          ? { ok: true }
          : { ok: false, detail: `reloads=${harness.reloads}` }
      }),
  },
  {
    name: "hooks-tail-log command shows the tail command",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.command("hooks-tail-log")

        return harness.notifications.some((message) => message.includes("tail -F"))
          ? { ok: true }
          : { ok: false, detail: `notifications=${JSON.stringify(harness.notifications)}` }
      }),
  },
  {
    name: "hook load validation errors emit a structured diagnostics message",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - event: session.idle
    actions:
      - notify:
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.agentEnd()

        return harness.customMessages.some((message) => message.customType === "pi-hooks-diagnostics") &&
            harness.customMessages.some((message) => JSON.stringify(message.content).includes("validation issue"))
          ? { ok: true }
          : { ok: false, detail: `messages=${JSON.stringify(harness.customMessages)}` }
      }),
  },
  {
    name: "registers guarded /hooks autocomplete when the UI capability exists",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        writeProjectHooks(
          projectDir,
          `hooks:
  - id: audit-write
    event: tool.after.write
    actions:
      - notify: ok
`,
        )

        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionStart("new")

        const factory = harness.autocompleteProviders[0]
        if (!factory) {
          return { ok: false, detail: "autocomplete provider was not registered" }
        }

        const provider = factory(createNoopAutocompleteProvider())
        const commandSuggestions = await provider.getSuggestions(["/hooks-st"], 0, "/hooks-st".length, {
          signal: new AbortController().signal,
        })
        const argumentSuggestions = await provider.getSuggestions(["/hooks-status audit"], 0, "/hooks-status audit".length, {
          signal: new AbortController().signal,
        })
        const eventSuggestions = await provider.getSuggestions(["/hooks-validate tool.after"], 0, "/hooks-validate tool.after".length, {
          signal: new AbortController().signal,
        })
        const logSuggestions = await provider.getSuggestions(["/hooks-tail-log --"], 0, "/hooks-tail-log --".length, {
          signal: new AbortController().signal,
        })

        const commandValues = commandSuggestions?.items.map((item) => item.value) ?? []
        const commandLabels = commandSuggestions?.items.map((item) => item.label) ?? []
        const argumentValues = argumentSuggestions?.items.map((item) => item.value) ?? []
        const eventValues = eventSuggestions?.items.map((item) => item.value) ?? []
        const logValues = logSuggestions?.items.map((item) => item.value) ?? []
        const ok =
          commandValues.includes("hooks-status") &&
          commandLabels.includes("/hooks-status") &&
          argumentValues.includes("audit-write") &&
          eventValues.includes("tool.after.write") &&
          logValues.includes("--follow")

        return ok
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ commandValues, commandLabels, argumentValues, eventValues, logValues }) }
      }),
  },
  {
    name: "applies /hooks command autocomplete with a single leading slash",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.register()
        await harness.sessionStart("new")

        const factory = harness.autocompleteProviders[0]
        if (!factory) {
          return { ok: false, detail: "autocomplete provider was not registered" }
        }

        const provider = factory(createSlashCommandAutocompleteProvider())
        const input = "/hooks-st"
        const suggestions = await provider.getSuggestions([input], 0, input.length, {
          signal: new AbortController().signal,
        })
        const hooksStatus = suggestions?.items.find((item) => item.label === "/hooks-status")
        if (!hooksStatus) {
          return { ok: false, detail: `suggestions=${JSON.stringify(suggestions)}` }
        }

        const applied = provider.applyCompletion([input], 0, input.length, hooksStatus, suggestions?.prefix ?? input)
        const ok = applied.lines[0] === "/hooks-status " && applied.cursorLine === 0 && applied.cursorCol === "/hooks-status ".length
        return ok ? { ok: true } : { ok: false, detail: JSON.stringify(applied) }
      }),
  },
  {
    name: "skips /hooks autocomplete registration when addAutocompleteProvider is absent",
    run: async () =>
      await withIsolatedProject(true, async (projectDir) => {
        const harness = new FakePiHarness(projectDir)
        harness.exposeAutocomplete = false
        harness.register()
        await harness.sessionStart("new")
        return harness.autocompleteProviders.length === 0
          ? { ok: true }
          : { ok: false, detail: `providers=${harness.autocompleteProviders.length}` }
      }),
  },
  {
    name: "LRU touch promotes existing key to most recent insertion order",
    run: async () => {
      const map = new Map<string, number>()
      map.set("a", 1)
      map.set("b", 2)
      map.set("c", 3)
      adapterTesting.touchLruEntry(map, "a")
      const order = Array.from(map.keys())
      // After promotion, 'a' is most recent (last); 'b' is now oldest.
      return order.join(",") === "b,c,a"
        ? { ok: true }
        : { ok: false, detail: `order=${order.join(",")}` }
    },
  },
  {
    name: "LRU eviction drops oldest entries beyond cap and mirrors a companion map",
    run: async () => {
      const runtimes = new Map<string, string>()
      const ctxs = new Map<string, string>()
      for (let i = 0; i < 10; i += 1) {
        runtimes.set(`/cwd-${i}`, `runtime-${i}`)
        ctxs.set(`/cwd-${i}`, `ctx-${i}`)
      }
      const evicted = adapterTesting.evictLruEntries(runtimes, 8, ctxs)
      // First two cwds (oldest) should have been evicted from both maps.
      const sizesOk = runtimes.size === 8 && ctxs.size === 8
      const evictedOk = evicted.length === 2 && evicted[0] === "/cwd-0" && evicted[1] === "/cwd-1"
      const companionDropped = !ctxs.has("/cwd-0") && !ctxs.has("/cwd-1")
      const newest = Array.from(runtimes.keys()).pop()
      return sizesOk && evictedOk && companionDropped && newest === "/cwd-9"
        ? { ok: true }
        : { ok: false, detail: `runtimes=${runtimes.size} ctxs=${ctxs.size} evicted=${evicted.join(",")} newest=${newest}` }
    },
  },
  {
    name: "LRU touch is a no-op when the key is missing",
    run: async () => {
      const map = new Map<string, number>([["a", 1], ["b", 2]])
      adapterTesting.touchLruEntry(map, "missing")
      const order = Array.from(map.keys()).join(",")
      return order === "a,b" ? { ok: true } : { ok: false, detail: order }
    },
  },
  {
    // P2-9: regression — pin known SDK-emitted stale-context messages so the
    // brittle isStaleSessionBoundError regex does not silently drift if the
    // SDK rewrites the wording. Update this list when widening the peer
    // range (`npm run compat:sdk-matrix:future`) reveals new shapes.
    name: "isStaleSessionBoundError matches known SDK error messages",
    run: async () => {
      const knownStaleMessages = [
        // Verbatim from @earendil-works/pi-coding-agent ExtensionRuntime
        // invalidate() default at 0.74.0 (dist/core/extensions/runner.js).
        "This extension ctx is stale after session replacement or reload. Do not use a captured pi or command ctx after ctx.newSession(), ctx.fork(), ctx.switchSession(), or ctx.reload(). For newSession, fork, and switchSession, move post-replacement work into withSession and use the ctx passed to withSession. For reload, do not use the old ctx after await ctx.reload().",
        // Shorter shapes that have appeared historically in the SDK / fakes.
        "stale session-bound ExtensionAPI after replacement",
        "stale session-bound ExtensionContext after replacement",
        "extension runtime invalidated",
        "replaced session: ctx is stale",
      ]
      const knownNonStaleMessages = [
        "ENOENT: no such file or directory",
        "RangeError: Maximum call stack size exceeded",
        "TypeError: Cannot read properties of undefined",
      ]
      const failures: string[] = []
      for (const message of knownStaleMessages) {
        if (!adapterTesting.isStaleSessionBoundError(new Error(message))) {
          failures.push(`stale-positive miss: ${message.slice(0, 60)}…`)
        }
      }
      for (const message of knownNonStaleMessages) {
        if (adapterTesting.isStaleSessionBoundError(new Error(message))) {
          failures.push(`stale-negative match: ${message}`)
        }
      }
      return failures.length === 0
        ? { ok: true }
        : { ok: false, detail: failures.join("; ") }
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
  /adapter\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
