---
source_commit: ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea
source_tree: c9b7a555c581397c1a06fcbe5d01d24947df0e03
ticket_ref: tracker/tickets/herdr-query-cache-01-selective-refresh.md
title: Scoped fix verification
type: Index
---

# Fix verification

Source: `ccca30b1eaba2320ee8e29d5cbdb42f6996a3bea`; tree: `c9b7a555c581397c1a06fcbe5d01d24947df0e03`. Findings: STD-01 and SPEC-01.

## Checks

- [Full relevant suite](files/full-suite.log): 52 Node tests and 17 Bun tests passed; zero failures. The command was `mise exec -- bun run test` from `mise/conf.d/devtools-herdrapp`.
- Native contract: `herdr-app check mise/conf.d/devtools-herdrapp/app/mods/shared-context` passed.
- [Production QueryClient smoke](files/smoke.json) called the checked-in helper in fresh processes against a scratch Git repository. After 141 real file retirements, retirement memory held zero keys and an older client could not restore the deleted body. A fresh same-key body remained available. One unchanged validation transferred zero bodies. Persistent payload: 9,246 UTF-16 bytes.
- Focused regressions cover more than 128 retirements, shared-storage clients, cross-target preservation, late reads, newer same-target values, warm Files restoration, changed/removed results, and a target switch during validation. The established review reproductions were not rerun before editing.

## Native Files proof

The app ran under a private headless Cage display, HOME, app home, Core session and cache. No live app, installed mod link or unrelated prototype changed. Two copies showed a directory and selected file together. A copied entry adapter seeded real helper results and saved view state. It called the unchanged production SharedContext methods and QueryClient; their source hashes matched the committed source. A timer requested refresh because duplicate layout copies deliberately disable automatic polling. The delay adapter held real validation workers behind a gate and forwarded the real helper envelopes unchanged.

1. [Validation pending](shots/warm-validation-pending.png): expanded Tickets directory and selected file body were visible; both footers said “Stale · validating”. Private Core showed live workers t4 and t5.
2. [Changed](shots/changed-native.png): after release, the directory contained added.txt and the preview showed changed canonical bytes. Both footers said “Current”.
3. [Removed](shots/removed-native.png): deleting preview.txt and invoking `shared-context.refresh` cleared the selected preview and removed its directory row. Both copies remained current.

[Real validation classifications](files/native-classifications.json), [helper calls](files/native-calls.jsonl), [helper results](files/native-results.jsonl), and [asset hashes/capture times](files/assets.json) preserve the observations. Images are original `herdr-app shot` captures, not reconstructed images or a sealed collect-evidence/v1 run.

## Limits and cleanup

Only affected scenarios were rerun. This fix did not repeat the prior full native matrix, provision another host/account, or change fresh action preparation. The storage fence is conservative: concurrent older writebacks can lose a cache publication, but cannot replace a newer stored value. Stored unrelated bodies remain intact. The v3 storage schema is a cold cutover.

[Shutdown](files/shutdown.json) confirms all recorded native app, launcher and Core processes are absent. Only the scratch shell remained before closing the owned Core; query workers had already been removed. The parent owns this agent’s pane and harness lifetime. Temporary fixtures were removed after evidence capture.

