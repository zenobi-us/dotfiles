# Implementation: hc child spawning

## Outcome

Blocked on external acceptance. Source implementation is committed and clean. SSH and WSL end-to-end acceptance remains unverified. No review, merge, push or ticket completion occurred.

- **Ticket:** tracker/tickets/muxer-subagents-herdr-app-hc-spawn.md.
- **Branch:** feature/muxer-subagents-herdr-app-hc-spawn; base master.
- **Source commit:** 01a87a4d8ee952666b29eaaa547fa4615ced783f.
- **Source tree:** e76c5a5b599650eec3de7f67856a011a11961637.
- **Child identity:** herdr-app terminal t10x; muxer run 7454e3cc-d1f3-456a-bd42-a0d33d84c7d4.

## Problem

The previous desktop route required an app executable to launch children. SSH and WSL terminals can reach core without reaching the desktop executable.

## Implementation

Children now start through hc run --bg --cwd with herdr.space and no herdr.tab label. Same-directory launches use the parent's core labels without the app command. Another directory requires app inventory to select the correct target space on the parent's machine. Missing-space creation uses the app only for space.new, then removes its owned setup terminal. contracts --cwd preflights these prerequisites before spawn. Result delivery and wait semantics remain unchanged.

The app-only boundary is explicit. Core does not expose app space folders or create spaces. No old app-based child launch remains. HERDR_APP_BIN / Windows interop remains available only for required app operations. The commit hook bumped agent-core metadata to 0.1.26.

## Changed files

- mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/SKILL.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/references/muxers/herdr-app.md
- mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/modules/muxer-herdr-app.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/router.ts
- mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/spawn.test.ts
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/agent-core/.claude-plugin/plugin.json

## Validation

- **Focused regressions:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts/spawn.test.ts; exit 0; 23 passed.
- **Full muxer suite:** mise exec -- bun test mise/conf.d/devtools-agent/bundles/agent-core/skills/muxer-subagents/scripts; exit 0; 48 passed across four files.
- **Baseline:** the pre-change module failed with the app absent: herdr-app is not on PATH; set HERDR_APP_BIN. No child opened.
- **Real desktop:** parent-space launch passed with an hc-only caller PATH. A fresh visible tab received the exact result context and target cwd. Native wait returned completed after exit zero.
- **Target placement:** app-only missing-space creation passed. Three concurrent programs appeared in distinct tabs in one target space. All delivered their assigned results, completed with exit zero and reached confirmed process shutdown.
- **Agent turn:** one smoke used the embedded OMP executable. It ran the smoke program and delivered its result; explicit owned terminal closure stopped the interactive agent and its broker. No implementation, review or fix task was delegated.
- **Cleanup:** all owned smoke terminals are absent from final app inventory. Owned services stopped normally. Resource observations confirmed shutdown. The app/core and unrelated terminals were not stopped or restarted.
- **Remote inventory:** hc machine ls returned an empty machine list.
- **SSH probe:** reckon-laptop.lan:4096 failed with No route to host; exit 255.
- **Laptop probe:** pennyroyal.local failed DNS resolution; exit 255.
- **Type tooling limit:** LSP initialization failed because no valid TypeScript installation was available. No standalone typecheck is claimed.

## Observation limits

App adoption is asynchronous. The first immediate inventory preceded adoption; later inventory confirmed placement. A smoke readiness message preceded one observation-file write. Waiting again for already consumed output timed out; retained core identities allowed recovery without repeating a domain operation. The raw observation artifact preserves these events. Empty app spaces disappear after removal of their last terminal in this installed version. Concurrent live programs, not sequential empty spaces, prove target-space reuse.

The smoke ran before the final documentation commit. Behavior code was unchanged between smoke and commit. No sealed collect-evidence run or image capture is claimed. App inventory and core observations establish local placement; they do not establish SSH or WSL placement.

## Review history and findings

No reviewer ran. Latest reviewer verdict: null. Resolved findings: none. Remaining acceptance: real SSH and real WSL launches without an app executable, with visible fresh-tab placement and result delivery. Parent must retain blocked status until those criteria can be exercised. No infrastructure provisioning or retry is requested.

## Merge status

Not merged, rebased or pushed. Canonical tracker state remains the parent's claim. Context publication did not change the source checkout or the user's context config.

## Supporting records

- [Phase start](../../events/start-0001.yaml).
- [Implementation result](../../events/implementation-0002.yaml).
- [Raw desktop observations and exact probes](hc-smoke-implementation-0002.json).
