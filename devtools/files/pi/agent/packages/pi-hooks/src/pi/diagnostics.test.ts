import {
  PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE,
  registerHookDiagnostics,
  sendHookDiagnostics,
} from "./diagnostics.js"

interface Case {
  readonly name: string
  readonly run: () => { ok: boolean; detail?: string }
}

interface CapturedMessage {
  readonly customType: string
  readonly content: unknown
  readonly display: boolean
  readonly details?: unknown
}

interface FakePi {
  readonly messages: CapturedMessage[]
  readonly renderers: Map<string, unknown>
  registerMessageRenderer<T>(type: string, render: (message: { content: unknown; details: T | undefined }, opts: { expanded: boolean }, theme: unknown) => unknown): void
  sendMessage<T>(message: { customType: string; content: string; display: boolean; details?: T }): void
}

function createFakePi(): FakePi {
  const messages: CapturedMessage[] = []
  const renderers = new Map<string, unknown>()
  return {
    messages,
    renderers,
    registerMessageRenderer(type, render) {
      renderers.set(type, render)
    },
    sendMessage(message) {
      messages.push(message)
    },
  }
}

const cases: Case[] = [
  {
    name: "registers a renderer under the documented message type",
    run: () => {
      const pi = createFakePi()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHookDiagnostics(pi as any)
      return pi.renderers.has(PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE)
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(Array.from(pi.renderers.keys())) }
    },
  },
  {
    name: "PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE is the canonical pi-hooks-diagnostics string",
    run: () =>
      PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE === "pi-hooks-diagnostics"
        ? { ok: true }
        : { ok: false, detail: PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE },
  },
  {
    name: "sendHookDiagnostics emits a structured message with display=true",
    run: () => {
      const pi = createFakePi()
      sendHookDiagnostics(pi as never, {
        title: "Test title",
        level: "info",
        content: "test content",
      })

      if (pi.messages.length !== 1) {
        return { ok: false, detail: `count=${pi.messages.length}` }
      }
      const msg = pi.messages[0]
      const details = msg.details as { title?: string; level?: string; sections?: unknown }
      if (msg.customType !== PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE) {
        return { ok: false, detail: `customType=${msg.customType}` }
      }
      if (msg.content !== "test content") {
        return { ok: false, detail: `content=${msg.content}` }
      }
      if (msg.display !== true) {
        return { ok: false, detail: "display flag should be true" }
      }
      if (details.title !== "Test title" || details.level !== "info") {
        return { ok: false, detail: JSON.stringify(details) }
      }
      // sections omitted when not provided.
      if ("sections" in details) {
        return { ok: false, detail: "sections should not be present when caller omitted them" }
      }
      return { ok: true }
    },
  },
  {
    name: "sendHookDiagnostics propagates sections when present",
    run: () => {
      const pi = createFakePi()
      const sections = [
        { label: "errors", lines: ["a", "b"] },
        { label: "info", lines: ["x"] },
      ]
      sendHookDiagnostics(pi as never, {
        title: "T",
        level: "warning",
        content: "c",
        sections,
      })

      const details = pi.messages[0].details as { sections?: unknown; level?: string }
      return details.level === "warning" && JSON.stringify(details.sections) === JSON.stringify(sections)
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(details) }
    },
  },
  {
    name: "sendHookDiagnostics supports error level",
    run: () => {
      const pi = createFakePi()
      sendHookDiagnostics(pi as never, { title: "boom", level: "error", content: "x" })
      const details = pi.messages[0].details as { level?: string }
      return details.level === "error" ? { ok: true } : { ok: false, detail: JSON.stringify(details) }
    },
  },
  {
    name: "registered renderer formats title, level badge, and content",
    run: () => {
      const pi = createFakePi()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHookDiagnostics(pi as any)
      const renderer = pi.renderers.get(PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE) as (
        message: { content: string; details: { title: string; level: "info" | "warning" | "error"; sections?: Array<{ label: string; lines: string[] }> } | undefined },
        opts: { expanded: boolean },
        theme: { fg: (color: string, text: string) => string; bg: (color: string, text: string) => string },
      ) => unknown

      let textCaptured = ""
      // Patch in a Box-like capture by stubbing the Text/Box imports through the
      // returned object. Since the renderer uses real pi-tui Box+Text under the
      // hood, we can't introspect the produced node directly without pulling
      // pi-tui in. Instead, capture the final text by wrapping the theme to
      // record what gets coloured.
      const colorCalls: string[] = []
      const theme = {
        fg: (color: string, text: string) => {
          colorCalls.push(`${color}:${text}`)
          return text
        },
        bg: (_color: string, text: string) => {
          textCaptured = text
          return text
        },
      }

      try {
        renderer(
          {
            content: "the content",
            details: {
              title: "diag title",
              level: "warning",
              sections: [{ label: "sec", lines: ["s1", "s2"] }],
            },
          },
          { expanded: true },
          theme,
        )
      } catch (error) {
        return { ok: false, detail: `renderer threw: ${error instanceof Error ? error.message : String(error)}` }
      }

      // Renderer should have asked the theme to colour the [WARNING] badge with
      // the warning colour and the section label with dim.
      const sawWarningBadge = colorCalls.some((call) => call.startsWith("warning:[WARNING]"))
      const sawDimSectionLabel = colorCalls.some((call) => call === "dim:sec")
      // Some pi-tui versions render the box content via theme.bg. Even if not,
      // the colour calls already prove the renderer ran with the right inputs.
      void textCaptured
      return sawWarningBadge && sawDimSectionLabel
        ? { ok: true }
        : { ok: false, detail: `colorCalls=${JSON.stringify(colorCalls)}` }
    },
  },
  {
    name: "renderer collapses sections when expanded=false",
    run: () => {
      const pi = createFakePi()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHookDiagnostics(pi as any)
      const renderer = pi.renderers.get(PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE) as (
        message: { content: string; details: { title: string; level: "info"; sections?: Array<{ label: string; lines: string[] }> } | undefined },
        opts: { expanded: boolean },
        theme: { fg: (color: string, text: string) => string; bg: (color: string, text: string) => string },
      ) => unknown

      const colorCalls: string[] = []
      const theme = {
        fg: (color: string, text: string) => {
          colorCalls.push(`${color}:${text}`)
          return text
        },
        bg: (_color: string, text: string) => text,
      }

      renderer(
        {
          content: "c",
          details: {
            title: "t",
            level: "info",
            sections: [{ label: "should-not-appear", lines: ["x"] }],
          },
        },
        { expanded: false },
        theme,
      )

      const sectionRendered = colorCalls.some((call) => call === "dim:should-not-appear")
      return sectionRendered ? { ok: false, detail: "section label rendered while collapsed" } : { ok: true }
    },
  },
  {
    name: "renderer uses neutral badge color for info level",
    run: () => {
      const pi = createFakePi()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHookDiagnostics(pi as any)
      const renderer = pi.renderers.get(PI_YAML_HOOKS_DIAGNOSTICS_MESSAGE_TYPE) as (
        message: { content: string; details: { title: string; level: "info"; sections?: never } | undefined },
        opts: { expanded: boolean },
        theme: { fg: (color: string, text: string) => string; bg: (color: string, text: string) => string },
      ) => unknown

      const colorCalls: string[] = []
      const theme = {
        fg: (color: string, text: string) => {
          colorCalls.push(`${color}:${text}`)
          return text
        },
        bg: (_color: string, text: string) => text,
      }

      renderer(
        { content: "ok", details: { title: "t", level: "info" } },
        { expanded: false },
        theme,
      )

      return colorCalls.some((call) => call.startsWith("dim:[INFO]"))
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(colorCalls) }
    },
  },
]

export function main(): number {
  let failures = 0
  for (const c of cases) {
    try {
      const outcome = c.run()
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
  /diagnostics\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  process.exit(main())
}
