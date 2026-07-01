import type { BeforeAgentStartEvent, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"

import { resolveProjectHookResolution } from "../core/config-paths.js"
import { loadDiscoveredHooksSnapshot, summarizeHookSources } from "../core/load-hooks.js"

const PROMPT_AWARENESS_DISABLE_ENV = "PI_YAML_HOOKS_PROMPT_AWARENESS"

export function registerPromptSupport(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event: BeforeAgentStartEvent, ctx: ExtensionContext) => {
    const systemPrompt = buildHookAwarenessSystemPrompt(ctx)
    if (!systemPrompt) {
      return
    }

    return {
      systemPrompt: `${event.systemPrompt.trimEnd()}\n\n${systemPrompt}`,
    }
  })
}

// P3-3: accept a small set of common "off" spellings so users do not have to
// remember a single canonical form. We treat env var presence the same way
// other PI knobs do: trim + lowercase compare against an allow-list.
const PROMPT_AWARENESS_DISABLE_VALUES = new Set(["0", "false", "off", "no"])

function isPromptAwarenessDisabled(): boolean {
  const raw = process.env[PROMPT_AWARENESS_DISABLE_ENV]
  if (raw === undefined) return false
  return PROMPT_AWARENESS_DISABLE_VALUES.has(raw.trim().toLowerCase())
}

function buildHookAwarenessSystemPrompt(ctx: ExtensionContext): string | undefined {
  if (isPromptAwarenessDisabled()) {
    return undefined
  }

  const loaded = loadDiscoveredHooksSnapshot({ projectDir: ctx.cwd })
  const summary = summarizeHookSources(loaded.sources)
  const project = resolveProjectHookResolution({ projectDir: ctx.cwd })
  const projectConfigExists = Boolean(project?.projectConfigPath)
  const trustLine = projectConfigExists
    ? project?.trusted
      ? "- project hooks are trusted and active when loaded"
      : "- project hooks exist but are currently untrusted"
    : "- no project hook file is present for this repo/worktree scope"

  const lines = ["Hook-awareness for this session:"]

  if (loaded.errors.length > 0) {
    lines.push(`- current hook files have ${loaded.errors.length} validation issue(s); the runtime may be using the valid subset or a last known good hook set`)
    lines.push("- use /hooks-validate for the exact validation errors and active trust state")
  } else {
    lines.push(`- pi-hooks loaded ${summary.total} hooks (${summary.global} global, ${summary.project} project)`)
    lines.push(trustLine)
  }

  lines.push("- command actions are unsupported on PI; prefer bash-backed hooks or user-invoked /hooks commands")
  // P2-16: be explicit about the targeting boundary. The previous wording
  // ("tool prompts still target the current session") was easy to misread
  // as "tool actions can target sessions" with the current one as a default.
  // tool: actions on PI inject a follow-up prompt into the same PI session
  // the hook fired in — they cannot route a prompt to any other session.
  lines.push(
    "- tool actions inject a follow-up prompt into the current PI session only; they cannot target other sessions",
  )

  if (!ctx.hasUI) {
    lines.push("- UI is unavailable in this mode: notify/setStatus degrade and confirm denies by default")
  }

  return lines.join("\n")
}
