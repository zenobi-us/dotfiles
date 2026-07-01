// Side-effect import: registers the PI HookPolicy with the core loader.
// P2 #22 separated core/load-hooks from src/pi/*; standalone tests that
// exercise PI diagnostics through `parseHooksFile` must opt the policy in.
import "./unsupported.js"
import { parseHooksFile } from "../core/load-hooks.js"

interface Case {
  readonly name: string
  readonly yaml: string
  readonly check: (result: ReturnType<typeof parseHooksFile>) => { ok: boolean; detail?: string }
}

const cases: Case[] = [
  {
    name: "command: action → error",
    yaml: `hooks:
  - event: session.idle
    actions:
      - command: "/deploy"
`,
    check: (result) => {
      const hasErr = result.errors.some((e) => e.code === "unsupported_on_pi" && e.message.includes("command: actions are not supported on PI"))
      return hasErr
        ? { ok: true }
        : { ok: false, detail: `errors=${JSON.stringify(result.errors)}` }
    },
  },
  {
    name: "tool: action → advisory (no error)",
    yaml: `hooks:
  - event: session.idle
    actions:
      - tool:
          name: echo
`,
    check: (result) => {
      const relevantErrors = result.errors.filter((e) => e.code === "unsupported_on_pi")
      const hasAdvisory = (result.advisories ?? []).some((a) => a.includes("tool: actions run as current-session prompts"))
      if (relevantErrors.length > 0) return { ok: false, detail: `unexpected pi errors=${JSON.stringify(relevantErrors)}` }
      if (!hasAdvisory) return { ok: false, detail: `advisories=${JSON.stringify(result.advisories)}` }
      return { ok: true }
    },
  },
  {
    name: "runIn: main on non-bash action → error",
    yaml: `hooks:
  - event: session.idle
    runIn: main
    actions:
      - tool:
          name: echo
`,
    check: (result) => {
      const hasErr = result.errors.some((e) => e.code === "unsupported_on_pi" && e.message.includes("runIn: main is only supported for bash actions on PI"))
      return hasErr ? { ok: true } : { ok: false, detail: `errors=${JSON.stringify(result.errors)}` }
    },
  },
  {
    name: "scope: child → advisory",
    yaml: `hooks:
  - event: session.idle
    scope: child
    actions:
      - bash: "echo hi"
`,
    check: (result) => {
      const hasAdvisory = (result.advisories ?? []).some((a) => a.includes("scope: child filters via session ancestry"))
      return hasAdvisory ? { ok: true } : { ok: false, detail: `advisories=${JSON.stringify(result.advisories)}, errors=${JSON.stringify(result.errors)}` }
    },
  },
  {
    name: "tool.before.multiedit → advisory (tool name never matches)",
    yaml: `hooks:
  - event: tool.before.multiedit
    actions:
      - bash: "echo hi"
`,
    check: (result) => {
      const hasAdvisory = (result.advisories ?? []).some((a) => a.includes("PI built-ins are bash, read, edit, write, grep, find, ls"))
      return hasAdvisory ? { ok: true } : { ok: false, detail: `advisories=${JSON.stringify(result.advisories)}, errors=${JSON.stringify(result.errors)}` }
    },
  },
  {
    // P3-4: allow-list now flags ANY unknown tool name, not just the three
    // OpenCode-only legacy names. Typos like `write_file` are caught.
    name: "tool.after.write_file → advisory (unknown tool, allow-list reject)",
    yaml: `hooks:
  - event: tool.after.write_file
    actions:
      - bash: "echo hi"
`,
    check: (result) => {
      const hasAdvisory = (result.advisories ?? []).some((a) => a.includes("PI built-ins are bash, read, edit, write, grep, find, ls"))
      return hasAdvisory ? { ok: true } : { ok: false, detail: `advisories=${JSON.stringify(result.advisories)}, errors=${JSON.stringify(result.errors)}` }
    },
  },
  {
    // P3-4: built-in tool names must NOT trigger the advisory. `write`
    // is in PI_BUILTIN_TOOLS, so a hook on tool.after.write should load
    // cleanly with no PI-specific advisories.
    name: "tool.after.write → no advisory (PI built-in)",
    yaml: `hooks:
  - event: tool.after.write
    actions:
      - bash: "echo hi"
`,
    check: (result) => {
      const advisories = result.advisories ?? []
      const hasUnexpected = advisories.some((a) => a.includes("PI built-ins are bash"))
      return hasUnexpected
        ? { ok: false, detail: `unexpected advisory for built-in: ${JSON.stringify(advisories)}` }
        : { ok: true }
    },
  },
  {
    // P3-4: wildcard event must be silent (no advisory).
    name: "tool.before.* wildcard → no advisory",
    yaml: `hooks:
  - event: tool.before.*
    actions:
      - bash: "echo hi"
`,
    check: (result) => {
      const advisories = result.advisories ?? []
      const hasUnexpected = advisories.some((a) => a.includes("PI built-ins are bash"))
      return hasUnexpected
        ? { ok: false, detail: `unexpected advisory for wildcard: ${JSON.stringify(advisories)}` }
        : { ok: true }
    },
  },
]

export function main(): number {
  let failures = 0
  // Silence the [pi-hooks] console.info noise so the test output is a clean
  // per-case pass/fail log.
  const originalInfo = console.info
  console.info = () => {}
  try {
    for (const c of cases) {
      const result = parseHooksFile("/virtual/hooks.yaml", c.yaml)
      const outcome = c.check(result)
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
  console.info(`\n${cases.length - failures}/${cases.length} passed`)
  return failures === 0 ? 0 : 1
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  /unsupported\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  const code = main()
  process.exit(code)
}
