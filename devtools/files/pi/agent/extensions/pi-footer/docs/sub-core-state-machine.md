# sub-core usage controller/state machine

Derived from:
- `packages/sub-core/index.ts`
- `packages/sub-core/src/usage/controller.ts`
- `packages/sub-core/src/usage/fetch.ts`
- provider registry + provider impls

```mermaid
stateDiagram-v2
  [*] --> Boot
  Boot --> GuardSingleton: extension init
  GuardSingleton --> Idle: already active
  GuardSingleton --> SettingsLoading: first instance

  SettingsLoading --> Ready: load settings + register tools + setup timers + cache watch

  Ready --> SessionStart: session_start
  SessionStart --> RefreshCacheOnly: refresh(... allowStaleCache, skipFetch)
  SessionStart --> RefreshStatusCacheOnly: refreshStatus(... allowStaleCache, skipFetch)
  RefreshCacheOnly --> EmitCurrent
  RefreshStatusCacheOnly --> EmitCurrent

  Ready --> RefreshRequested: turn_start/tool_result/turn_end/interval/sub-core:action(refresh)
  Ready --> CycleRequested: sub-core:action(cycleProvider)
  Ready --> SettingsPatched: sub-core:settings:patch or settings UI

  SettingsPatched --> SettingsLoading

  state RefreshRequested {
    [*] --> ResolveProvider
    ResolveProvider --> NoProvider: model/provider not detected or unavailable
    ResolveProvider --> HydrateFromCache: provider resolved

    NoProvider --> EmitCurrent

    HydrateFromCache --> EmitCurrent: cached usage available
    HydrateFromCache --> SkipFetch: skipFetch=true
    HydrateFromCache --> FetchUsage: skipFetch=false

    FetchUsage --> FetchSuccess: usage fetched
    FetchUsage --> FetchError: fetch error

    FetchSuccess --> MaybeFetchStatus
    MaybeFetchStatus --> EmitCurrent

    FetchError --> UseCachedFallback: cached usage exists
    FetchError --> EmitCurrent: no fallback
    UseCachedFallback --> EmitCurrent
  }

  state CycleRequested {
    [*] --> EnabledProviders
    EnabledProviders --> EmitCurrent: none enabled
    EnabledProviders --> ProbeNext
    ProbeNext --> ProbeNext: usage unavailable
    ProbeNext --> EmitCurrent: first available provider
    ProbeNext --> EmitCurrent: exhausted all providers
  }

  EmitCurrent --> Ready

  Ready --> Shutdown: session_shutdown
  Shutdown --> [*]
```

## Provider set

`anthropic`, `antigravity`, `codex`, `copilot`, `gemini`, `kiro`, `zai`
