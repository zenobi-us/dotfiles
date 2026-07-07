/**
 * pi-hooks — PI extension entry point.
 *
 * Registers the YAML-driven hooks adapter that wires PI events into the core
 * runtime (`src/core/runtime.ts`). The atomic-commit-snapshot-worker is an
 * opt-in example wired via `hooks.yaml` (see
 * `examples/atomic-commit-snapshot-worker/`); nothing is invoked here.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Side-effect import: registers the PI HookPolicy with the core loader so
// `unsupported_on_pi` diagnostics fire on every parse. P2 #22: core no longer
// imports from `src/pi/*`, so production must opt the policy in here.
import "./pi/unsupported.js";
import { registerAdapter } from "./pi/adapter.js";
import { registerHookAutocomplete } from "./pi/autocomplete.js";
import { registerCommands } from "./pi/commands.js";
import { registerHookDiagnostics } from "./pi/diagnostics.js";
import { registerPromptSupport } from "./pi/prompt-support.js";

export default function piHooksExtension(pi: ExtensionAPI): void {
  registerHookDiagnostics(pi);
  registerPromptSupport(pi);
  registerCommands(pi);
  pi.on("session_start", (_event, ctx) => registerHookAutocomplete(ctx));
  pi.on("before_agent_start", (_event, ctx) => registerHookAutocomplete(ctx));
  registerAdapter(pi);
}

// Public type re-exports (P3-7). Consumers building type-aware tooling on
// top of pi-hooks (custom YAML linters, generators) can import these
// from `pi-hooks/types` (the published subpath) or from the package
// root. Only the stable, documented contract surface is re-exported; runtime
// internals remain private.
export type {
  HookConfig,
  HookAction,
  HookCommandAction,
  HookCommandActionConfig,
  HookToolAction,
  HookToolActionConfig,
  HookBashAction,
  HookBashActionConfig,
  HookNotifyAction,
  HookNotifyActionConfig,
  HookNotifyLevel,
  HookConfirmAction,
  HookConfirmActionConfig,
  HookSetStatusAction,
  HookSetStatusActionConfig,
  HookCondition,
  HookPathCondition,
  HookPathConditionKey,
  HookLegacyCondition,
  HookEvent,
  ToolHookEvent,
  ToolHookPhase,
  SessionHookEvent,
  HookScope,
  HookRunIn,
  HookBehavior,
  HookAsyncConfig,
  HookSkipReason,
  HookValidationError,
  HookValidationErrorCode,
  HookOverrideEntry,
  HookConfigSource,
  HookMap,
  HookPolicy,
  HookPolicyDiagnostics,
  HostAdapter,
  HostDeliveryResult,
  ParsedHooksFile,
  SessionDeletedReason,
  FileChange,
  CreateFileChange,
  ModifyFileChange,
  DeleteFileChange,
  RenameFileChange,
} from "./core/types.js";

export type { BashHookContext, BashHookResult, BashHookResultStatus, BashExecutionRequest, BashProcessResult } from "./core/bash-types.js";
