import type {
  HookAction,
  HookConfig,
  HookEvent,
  HookMap,
  HookPolicy,
  HookPolicyDiagnostics,
} from "../core/types.js"
import { setActiveHookPolicy } from "../core/load-hooks.js"

/**
 * PI-specific diagnostics for hook configurations loaded from OpenCode-compatible
 * hooks.yaml files. Some YAML features are unsupported on PI (or behave
 * differently) — we surface them either as hard errors (block the load) or as
 * advisories (load succeeds, user is informed).
 */

export type UnsupportedDiagnostics = HookPolicyDiagnostics

const COMMAND_ACTION_ERROR =
  "command: actions are not supported on PI. PI exposes no API to invoke slash commands from event handlers. Remove this action or use bash instead."

const TOOL_ACTION_ADVISORY =
  "tool: actions run as current-session prompts via pi.sendUserMessage. Cross-session targeting is not supported."

const RUN_IN_MAIN_NON_BASH_ERROR =
  "runIn: main is only supported for bash actions on PI. Remove runIn or switch to bash."

const SCOPE_CHILD_ADVISORY =
  "scope: child filters via session ancestry (parentSession). Fires only in child sessions."

const TOOL_NAME_NEVER_MATCH_ADVISORY =
  "PI built-ins are bash, read, edit, write, grep, find, ls. This tool name will never match unless you install a matching custom tool."

// P3-4: switch from a hard-coded deny-list (multiedit, patch, apply_patch)
// to an allow-list of PI's known built-in tools. Anything outside this set
// (and outside the wildcard "*") earns the "never match" advisory. The list
// is intentionally conservative — these are the tool names that pi-hooks
// has been observed dispatching against in PI runtime traces. Adding new
// PI built-ins here is a doc-only change.
const PI_BUILTIN_TOOLS: ReadonlySet<string> = new Set<string>([
  "bash",
  "read",
  "edit",
  "write",
  "grep",
  "find",
  "ls",
])

function prefixWithSource(hook: HookConfig, message: string): string {
  const src = hook.source
  return `[${src.filePath}#hooks[${src.index}]] ${message}`
}

function isCommandAction(action: HookAction): boolean {
  return typeof action === "object" && action !== null && "command" in action
}

function isToolAction(action: HookAction): boolean {
  return typeof action === "object" && action !== null && "tool" in action
}

function isBashAction(action: HookAction): boolean {
  return typeof action === "object" && action !== null && "bash" in action
}

/**
 * command: actions → hard error. PI has no slash-command API.
 */
export function diagnoseCommandActions(hook: HookConfig): string[] {
  const errors: string[] = []
  for (const action of hook.actions) {
    if (isCommandAction(action)) {
      errors.push(prefixWithSource(hook, COMMAND_ACTION_ERROR))
    }
  }
  return errors
}

/**
 * tool: actions → advisory. They work but are scoped to the current session.
 */
export function diagnoseToolActions(hook: HookConfig): string[] {
  const advisories: string[] = []
  for (const action of hook.actions) {
    if (isToolAction(action)) {
      advisories.push(prefixWithSource(hook, TOOL_ACTION_ADVISORY))
    }
  }
  return advisories
}

/**
 * runIn: main on any non-bash action → hard error.
 * Only bash actions can currently be routed to the main session on PI.
 */
export function diagnoseRunInMainNonBash(hook: HookConfig): string[] {
  if (hook.runIn !== "main") {
    return []
  }
  const errors: string[] = []
  for (const action of hook.actions) {
    if (!isBashAction(action)) {
      errors.push(prefixWithSource(hook, RUN_IN_MAIN_NON_BASH_ERROR))
    }
  }
  return errors
}

/**
 * scope: child → advisory. Only fires in child sessions via parentSession check.
 */
export function diagnoseScopeChild(hook: HookConfig): string[] {
  if (hook.scope === "child") {
    return [prefixWithSource(hook, SCOPE_CHILD_ADVISORY)]
  }
  return []
}

/**
 * tool.before.<name> / tool.after.<name> where <name> is anything outside the
 * PI_BUILTIN_TOOLS allow-list (and not the "*" wildcard) → advisory; will
 * never match on PI. P3-4 flipped this from a deny-list of three known
 * OpenCode tools to a positive allow-list so users see the warning for any
 * unknown tool name (typos like `tool.before.write_file`, OpenCode-only
 * names, hypothetical PI extensions that have not landed).
 */
export function diagnoseUnsupportedToolNameEvents(hook: HookConfig): string[] {
  const event: HookEvent = hook.event
  if (typeof event !== "string") {
    return []
  }
  const match = /^tool\.(before|after)\.(.+)$/.exec(event)
  if (!match) {
    return []
  }
  const toolName = match[2]
  if (toolName === "*") {
    return []
  }
  if (PI_BUILTIN_TOOLS.has(toolName)) {
    return []
  }
  return [prefixWithSource(hook, TOOL_NAME_NEVER_MATCH_ADVISORY)]
}

/**
 * Collect PI-specific diagnostics across every hook in the given map.
 * Errors are intended to be appended to ParsedHooksFile.errors (load-blocking).
 * Advisories are intended to be surfaced via console.info and/or a new
 * `advisories` field on ParsedHooksFile (load succeeds).
 */
// PI policy registered with the host-agnostic core loader. P2 #22: the loader
// no longer imports from `src/pi/*`, so callers that want PI's
// "unsupported on PI" diagnostics must side-effect-import this module. The
// production entry point (src/index.ts) does so unconditionally; PI test
// files that load `parseHooksFile` directly should also import this module
// to install the policy.
export const piHookPolicy: HookPolicy = {
  diagnose: (hookMap: HookMap): HookPolicyDiagnostics => collectUnsupportedDiagnostics(hookMap),
}

setActiveHookPolicy(piHookPolicy)

export function collectUnsupportedDiagnostics(hookMap: HookMap): UnsupportedDiagnostics {
  const errors: string[] = []
  const advisories: string[] = []
  const invalidHooks = new Set<HookConfig>()

  for (const hooks of hookMap.values()) {
    for (const hook of hooks) {
      const hookErrors: string[] = []
      hookErrors.push(...diagnoseCommandActions(hook))
      hookErrors.push(...diagnoseRunInMainNonBash(hook))
      if (hookErrors.length > 0) {
        invalidHooks.add(hook)
        errors.push(...hookErrors)
      }

      advisories.push(...diagnoseToolActions(hook))
      advisories.push(...diagnoseScopeChild(hook))
      advisories.push(...diagnoseUnsupportedToolNameEvents(hook))
    }
  }

  return { errors, advisories, invalidHooks }
}
