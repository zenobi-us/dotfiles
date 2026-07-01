/**
 * PI adapter barrel for pi-hooks.
 *
 * The implementation was split into focused modules during the P0/P1 refactor;
 * this file preserves the original public surface (`registerAdapter`,
 * `registerPhase1Adapter`, `createHostAdapter`, `reportDispatchFailure`,
 * `__testing__`) so the entry point at `src/index.ts` and the existing test
 * suites (`adapter.test.ts`, `logging.test.ts`, `ux-actions.test.ts`) keep
 * resolving without changes.
 *
 * The actual logic lives in:
 * - `./host-adapter.ts`        — `HostAdapter` implementation + helpers
 * - `./event-mappers.ts`       — pure SDK→runtime envelope mappers
 * - `./session-lifecycle.ts`   — session_start/shutdown/before_switch wiring
 * - `./runtime-registry.ts`    — per-cwd runtime cache + LRU eviction
 * - `./register-adapter.ts`    — top-level orchestrator
 */

export { createHostAdapter } from "./host-adapter.js";
export {
  __testing__,
  registerAdapter,
  registerPhase1Adapter,
  reportDispatchFailure,
} from "./register-adapter.js";
