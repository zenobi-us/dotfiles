export const SESSION_HOOK_EVENTS = ["session.idle", "session.created", "session.deleted", "file.changed"] as const

/**
 * Reason values forwarded with `session.deleted` envelopes.
 *
 * PI emits both `session_shutdown` and `session_before_switch` with their own
 * `reason` field (e.g. "quit", "reload", "new", "resume", "fork"). The
 * adapter forwards that value verbatim into the runtime envelope so hook
 * authors can distinguish a graceful shutdown from a /new|/resume|/fork
 * transition. The string is opaque to the runtime: handlers should treat
 * unknown values as a forward-compatible extension.
 */
export type SessionDeletedReason = string
export const LEGACY_HOOK_CONDITIONS = ["matchesCodeFiles"] as const
export const PATH_HOOK_CONDITION_KEYS = ["matchesAnyPath", "matchesAllPaths"] as const
export const HOOK_SCOPES = ["all", "main", "child"] as const
export const HOOK_RUN_IN = ["current", "main"] as const
export const HOOK_BEHAVIORS = ["stop"] as const

export type SessionHookEvent = (typeof SESSION_HOOK_EVENTS)[number]
export type ToolHookPhase = "before" | "after"
export type ToolHookEvent = `tool.${ToolHookPhase}.*` | `tool.${ToolHookPhase}.${string}`
export type HookEvent = SessionHookEvent | ToolHookEvent
export type HookLegacyCondition = (typeof LEGACY_HOOK_CONDITIONS)[number]
export type HookPathConditionKey = (typeof PATH_HOOK_CONDITION_KEYS)[number]
/**
 * Discriminated union for path conditions. The two members are mutually
 * exclusive: a single condition entry must specify either `matchesAnyPath`
 * or `matchesAllPaths`. The structural union already rejects values that
 * literally carry both keys at construction time; an excess-property check
 * `assertHookPathConditionMutex` is exposed for runtime call sites that
 * want a stronger guarantee against arbitrary record inputs.
 */
export type HookPathCondition =
  | { readonly matchesAnyPath: readonly string[] }
  | { readonly matchesAllPaths: readonly string[] }
export type HookCondition = HookLegacyCondition | HookPathCondition

/**
 * Compile-time mutex test for HookPathCondition (P2-24). A
 * StrictPathCondition variant carries a `?: never` excluder that forces
 * the mutex check; the structural HookPathCondition stays as-is so callers
 * can keep using `"matchesAnyPath" in condition` narrowing. This type-test
 * verifies that a literal carrying both keys is rejected by the strict
 * shape — guaranteeing the runtime loader's mutex check has a static peer.
 */
type StrictHookPathCondition =
  | { readonly matchesAnyPath: readonly string[]; readonly matchesAllPaths?: never }
  | { readonly matchesAllPaths: readonly string[]; readonly matchesAnyPath?: never }

// @ts-expect-error — both-keys is intentionally invalid; this is the mutex test
const _HOOK_PATH_CONDITION_MUTEX_TEST: StrictHookPathCondition = {
  matchesAnyPath: ["a"],
  matchesAllPaths: ["b"],
}
void _HOOK_PATH_CONDITION_MUTEX_TEST
export type HookScope = (typeof HOOK_SCOPES)[number]
export type HookRunIn = (typeof HOOK_RUN_IN)[number]
export type HookBehavior = (typeof HOOK_BEHAVIORS)[number]

export interface HookAsyncConfig {
  readonly group?: string
  readonly concurrency?: number
}

export interface CreateFileChange {
  readonly operation: "create"
  readonly path: string
}

export interface ModifyFileChange {
  readonly operation: "modify"
  readonly path: string
}

export interface DeleteFileChange {
  readonly operation: "delete"
  readonly path: string
}

export interface RenameFileChange {
  readonly operation: "rename"
  readonly fromPath: string
  readonly toPath: string
}

export type FileChange = CreateFileChange | ModifyFileChange | DeleteFileChange | RenameFileChange

export interface HookCommandActionConfig {
  readonly name: string
  readonly args?: string
}

export interface HookToolActionConfig {
  readonly name: string
  readonly args?: Record<string, unknown>
}

export interface HookBashActionConfig {
  readonly command: string
  readonly timeout?: number
}

// HookAction variants are discriminated by which key is present. The union
// already enforces mutual exclusion structurally — a literal carrying two
// action keys (e.g. `{ command: ..., tool: ... }`) does not assign to any
// member of the union. Excess-property checks at the call site catch the
// rest. Adding `?: never` excluders here was attempted (P2-24) but breaks
// `"key" in action` narrowing in callers (every variant ends up carrying
// every key, so `"tool" in action` no longer narrows the union). The
// runtime loader is the load-bearing check for malformed input.
export interface HookCommandAction {
  readonly command: string | HookCommandActionConfig
}

export interface HookToolAction {
  readonly tool: HookToolActionConfig
}

export interface HookBashAction {
  readonly bash: string | HookBashActionConfig
}

export type HookNotifyLevel = "info" | "success" | "warning" | "error"

export interface HookNotifyActionConfig {
  readonly text: string
  readonly level?: HookNotifyLevel
}

export interface HookNotifyAction {
  readonly notify: string | HookNotifyActionConfig
}

export interface HookConfirmActionConfig {
  readonly title?: string
  readonly message: string
}

export interface HookConfirmAction {
  readonly confirm: HookConfirmActionConfig
}

export interface HookSetStatusActionConfig {
  readonly text: string
}

export interface HookSetStatusAction {
  readonly setStatus: string | HookSetStatusActionConfig
}

export type HookAction =
  | HookCommandAction
  | HookToolAction
  | HookBashAction
  | HookNotifyAction
  | HookConfirmAction
  | HookSetStatusAction

/**
 * P2-25: closed union of skip reasons emitted by the runtime when a hook is
 * evaluated. `matched` is included so a single decision shape can express
 * both the "ran" and "did not run" outcomes. New skip causes must extend
 * this union — the compile-time check forces every emit site to be
 * accounted for here.
 */
export type HookSkipReason =
  | "matched"
  | "scope_mismatch"
  | "matchesCodeFiles_failed"
  | "matchesAnyPath_no_paths"
  | "matchesAnyPath_failed"
  | "matchesAllPaths_no_paths"
  | "matchesAllPaths_failed"

export interface HookConfigSource {
  readonly filePath: string
  readonly index: number
}

export interface HookConfig {
  readonly id?: string
  readonly event: HookEvent
  readonly action?: HookBehavior
  readonly actions: HookAction[]
  readonly scope: HookScope
  readonly runIn: HookRunIn
  readonly async?: true | HookAsyncConfig
  readonly conditions?: HookCondition[]
  readonly source: HookConfigSource
}

export interface HookOverrideEntry {
  readonly targetId: string
  readonly disable: boolean
  readonly replacement?: HookConfig
  readonly source: HookConfigSource
}

export type HookMap = Map<HookEvent, HookConfig[]>

export type HookValidationErrorCode =
  | "invalid_frontmatter"
  | "invalid_imports"
  | "missing_hooks"
  | "invalid_hooks"
  | "invalid_hook"
  | "invalid_event"
  | "invalid_scope"
  | "invalid_run_in"
  | "invalid_hook_action"
  | "invalid_conditions"
  | "invalid_actions"
  | "invalid_action"
  | "duplicate_hook_id"
  | "override_target_not_found"
  | "invalid_override"
  | "invalid_async"
  | "unsupported_on_pi"

export interface HookValidationError {
  readonly code: HookValidationErrorCode
  readonly filePath: string
  readonly message: string
  readonly path?: string
}

export interface ParsedHooksFile {
  readonly hooks: HookMap
  readonly overrides: HookOverrideEntry[]
  readonly errors: HookValidationError[]
  readonly advisories?: string[]
}

/**
 * Host-supplied policy that flags hooks the host runtime cannot execute.
 *
 * The core loader is host-agnostic: it parses YAML, validates structure, and
 * caches results. Anything that depends on which host runtime will *execute*
 * the hook (e.g. PI lacks a slash-command API, so `command:` actions are
 * rejected on PI but might be valid on another host) lives behind this
 * interface. PI registers an implementation in `src/pi/unsupported.ts`; cores
 * loaded standalone simply receive an empty policy and skip those checks.
 *
 * `errors` are appended to `ParsedHooksFile.errors` and produced hooks are
 * dropped from the active hook map.
 * `advisories` are surfaced via `ParsedHooksFile.advisories` (load succeeds).
 * `invalidHooks` lists the hooks that produced load-blocking errors so the
 * loader can remove exactly those entries from the active hook map.
 */
export interface HookPolicyDiagnostics {
  readonly errors: string[]
  readonly advisories: string[]
  readonly invalidHooks: ReadonlySet<HookConfig>
}

export interface HookPolicy {
  readonly diagnose: (hookMap: HookMap) => HookPolicyDiagnostics
}

export function isHookEvent(value: unknown): value is HookEvent {
  return typeof value === "string" && (SESSION_HOOK_EVENTS.includes(value as SessionHookEvent) || /^tool\.(before|after)\.(\*|.+)$/.test(value))
}

export function isHookLegacyCondition(value: unknown): value is HookLegacyCondition {
  return typeof value === "string" && LEGACY_HOOK_CONDITIONS.includes(value as HookLegacyCondition)
}

export function isHookPathConditionKey(value: unknown): value is HookPathConditionKey {
  return typeof value === "string" && PATH_HOOK_CONDITION_KEYS.includes(value as HookPathConditionKey)
}

export function isHookScope(value: unknown): value is HookScope {
  return typeof value === "string" && HOOK_SCOPES.includes(value as HookScope)
}

export function isHookRunIn(value: unknown): value is HookRunIn {
  return typeof value === "string" && HOOK_RUN_IN.includes(value as HookRunIn)
}

export function isHookBehavior(value: unknown): value is HookBehavior {
  return typeof value === "string" && HOOK_BEHAVIORS.includes(value as HookBehavior)
}

// Host adapter is imported from the runtime embedder (for example the PI
// adapter in src/pi). Runtime code calls into the host exclusively through
// this surface so the core stays host-agnostic.
import type { BashExecutionRequest, BashHookResult } from "./bash-types.js"

export interface HostDeliveryResult {
  /**
   * `accepted` means the host API accepted the request without throwing.
   * `degraded` means the action was intentionally skipped or downgraded.
   */
  readonly status: "accepted" | "degraded"
  readonly reason?: string
  readonly details?: Record<string, unknown>
}

export interface HostAdapter {
  /** Abort the given session (best-effort). Errors must be handled by the adapter. */
  abort(sessionId: string): void | Promise<void>
  /** Return the root/parent-less session id reachable from `sessionId`. */
  getRootSessionId(sessionId: string): string | Promise<string>
  /** Execute a bash hook request; same contract as the node bash-executor. */
  runBash(request: BashExecutionRequest): Promise<BashHookResult>
  /** Queue a prompt in the current session; used as the fallback for `tool:` actions. */
  sendPrompt(sessionId: string, text: string): void | HostDeliveryResult | Promise<void | HostDeliveryResult>
  /**
   * Show a user-visible notification. Optional: hosts that do not implement
   * a UI surface (e.g. headless tests, non-PI embedders) may omit this; the
   * runtime degrades to a log + skip in that case.
   */
  notify?(text: string, level?: HookNotifyLevel): void | HostDeliveryResult | Promise<void | HostDeliveryResult>
  /**
   * Prompt the user for confirmation. Must resolve to a boolean: `true` =
   * user approved, `false` = user rejected (treated as a blocking result
   * for pre-tool hooks, same as exit-code-2 from a bash action).
   */
  confirm?(options: { title?: string; message: string }): boolean | Promise<boolean>
  /**
   * Set a status-bar entry for the given hookId. Pass an empty string to
   * clear; hosts without a status surface may omit this.
   */
  setStatus?(hookId: string, text: string): void | HostDeliveryResult | Promise<void | HostDeliveryResult>
}
