// Barrel re-export. The real implementation now lives under
// `src/core/hooks/`, split by concern: yaml-envelope, schema, composition,
// imports, snapshot-cache. This file preserves the public API consumed by
// `src/pi/*`, `src/core/runtime*`, and external embedders.

export {
  type ParsedHooksFileEnvelope,
  MAX_HOOKS_YAML_BYTES,
} from "./hooks/yaml-envelope.js"

export {
  type ParseHooksOptions,
  type ParsedHooksFileResult,
  getActiveHookPolicy,
  loadHooksFile,
  mergeHookMaps,
  parseHooksFile,
  parseHooksObject,
  resolveOverrides,
  setActiveHookPolicy,
} from "./hooks/composition.js"

export {
  type DiscoveredHooksFileSnapshot,
} from "./hooks/imports.js"

export {
  type HookDiscoveryResult,
  type HookLoadOptions,
  type HookLoadSnapshot,
  type HookLoadSummary,
  type HookSourceSummary,
  __resetSnapshotCacheForTests,
  __snapshotCacheKeysForTests,
  __snapshotCacheSizeForTests,
  formatHookLoadSummary,
  loadDiscoveredHooks,
  loadDiscoveredHooksSnapshot,
  summarizeHookSources,
} from "./hooks/snapshot-cache.js"
