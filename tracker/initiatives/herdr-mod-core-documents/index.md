---
id: herdr-mod-core-documents
schema: tracker-initiative/v1
status: viable
submission: draft-not-submitted
title: Expose Core documents and managed connections to QuickJS mods
type: Concept
---

# Mod API: expose Core documents, subscriptions, and managed machine connections

## What did you try to build?

I am building a shared-context mod that shows repository files, tracker records, workflow state, and Git details from remote machines.

A remote helper collects the data near the files. The mod first reads the current file tree. It then receives detail and progress updates without blocking the panel. The mod also sends refresh requests through separate request documents.

Core already provides versioned documents and document events over its existing machine connection. The missing part is access from QuickJS mods.

This request relates to [#38](https://github.com/herdrdev/herdr-app/issues/38). It asks for named Core documents shared with helper clients, not fields inside the app-owned layout document.

## What is missing?

Please expose a supported JavaScript interface to the app-owned Core connection and machine connection manager.

### Documents

- **Read documents:** Expose `doc.get` with a document name and optional machine selector.
- **Write documents:** Expose `doc.set` with the expected version. Preserve compare-and-set conflicts and the Core document size limit.
- **Preserve identity:** Return the document value and version. Preserve versions without JavaScript integer precision loss.

### Subscriptions

- **Receive notifications:** Expose cancellable subscriptions for document changes, with machine, document name, and version.
- **Reuse connections:** Forward events through the app-owned Core subscription. Do not create a Core client or SSH connection per mod or document.
- **Define readiness:** Let the mod await subscription readiness before its initial `doc.get`.
- **Report resynchronization:** Notify the mod after reconnect or missed events. The mod can then reread current documents.
- **Release resources:** Cancel subscriptions when their view closes, the mod reloads, or the mod explicitly cancels them.

Document notifications do not need to contain values. The mod can fetch a changed document with `doc.get`. App-side filtering can support Core versions without document filters.

### Managed machine connections

- **List machines:** Expose configured machine identities and actual connection states, separately from layout-document readiness.
- **Connect machines:** Let a mod request a connection or reconnection to an already configured machine through the existing manager.
- **Observe state:** Expose connection changes, reconnect generations, and actionable errors such as login or update requirements.
- **Share ownership:** Multiple mods must share the managed connection. Closing one mod must not disconnect other consumers.

This request does not need raw socket handles, SSH credentials, or an unrestricted internal Rust object.

### Possible interface

The names are suggestions. Existing mod SDK conventions can determine the final shape.

```js
import { core } from "herdr";

const machines = await core.machines.list();
await core.machines.connect(machineName);

const subscription = await core.subscribe({
  on: machineName,
  documents: [indexName, progressName],
});

// subscribe resolves after registration. Buffer events during the initial read.
const current = await core.doc.get(indexName, { on: machineName });

await core.doc.set(requestName, {
  on: machineName,
  version: currentRequestVersion,
  value: { refresh: nextRefresh },
});

// Illustrative event loop, not an existing SDK API.
for await (const event of subscription) {
  // Document events identify name/version. Resync events require fresh reads.
  receive(event);
}

// View cleanup calls subscription.cancel().
```

The subscription needs a bounded event queue. If the consumer falls behind, a resync signal is sufficient. Reads must not overwrite newer cached versions.

### Acceptance criteria

- **Local and remote:** A QuickJS mod reads and writes a document on the selected Core machine.
- **Two-way delivery:** A helper write notifies the mod. A mod write notifies a helper client.
- **Version conflicts:** A stale write fails without replacing current state.
- **Connection reuse:** Multiple mod views share the existing machine connection without a separate bridge, SSH tunnel, or listening port.
- **Recovery:** Reconnect and missed-event signals let the mod replace stale cached state.
- **Lifecycle:** Closing or reloading a mod releases its subscriptions without disrupting other views.
- **Machine control:** A mod can list connection states and request connection to a configured machine. Login and update failures remain explicit.
- **Published contract:** Generated declarations and the mod guide document readiness, cancellation, ordering, errors, and limits.

### Alternatives considered

`exec` and `hc` return completed output. They do not expose a live subscription to QuickJS. Polling adds repeated calls and update delay. A custom local bridge adds another process and transport for capabilities that Core already provides.

A remote helper installer and process supervision are outside this request. Those concerns remain mod-side.

### Existing implementation paths

The app already has internal document calls, event subscriptions, remote layout synchronization, and machine-state handling:

- [Core calls and subscriptions](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/src/hc.rs#L440-L490).
- [Machine-scoped document reads and writes](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/src/mirror_sync.rs#L74-L107).
- [App subscription and machine list](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/src/window.rs#L650-L725).
- [QuickJS host registration](https://github.com/herdrdev/herdr-app/blob/b67715e8985e6097f83f8120fc9b9e52e6596f50/src/mods.rs#L945-L1148).

## Feasibility record

Repository: https://github.com/herdrdev/herdr-app.git.
Examined revision: `b67715e8985e6097f83f8120fc9b9e52e6596f50`.
Temporary clone: `/tmp/herdr-feature-request.Pk8Knv/repository`.
Workspace command: `mktemp -d /tmp/herdr-feature-request.XXXXXX`, then `git clone --depth 1`.

The original request asks for `doc.get`, `doc.set`, subscriptions, and the connection manager in QuickJS mods. No blocking clarification remains for this draft. No submission authorization exists.

The contribution policy explicitly accepts missing mod APIs. The `.github/ISSUE_TEMPLATE/mod-api.yml` form requires the two sections used above. Blank issues are disabled. The proposed next action is a concrete API comment on #38, or a linked mod-API issue if maintainers prefer separate tracking. Do not submit a duplicate without acknowledging #38.

Current capability: partly possible. Internal Rust code uses the required Core transport. The installed QuickJS runtime export probe exposes `exec`, `hc`, and `machines`, but no Core document or subscription binding. The examined upstream declarations and host registration have the same document gap. The existing `machines()` exposes layout-document readiness, not the requested full connection-manager contract.

Functional feasibility: credible. Core already carries the required document operations and events. The host must preserve document event identity instead of only a refresh flag. Technical feasibility is an inference from the inspected call paths, not an implemented or benchmarked feature.

Technical risks: view lifecycle, reconnect generations, subscription queue bounds, subscribe/read races, lossless uint64 versions, shared connection ownership, and older Core filtering support. A public manager contract must not imply access to SSH credentials or global disconnection privileges.

Project fit: the contribution policy supports this missing SDK surface. Maintainer preference for typed document functions versus broader Core access remains unknown. No request for a built-in shared-context panel is included.

Capability options:

| Approach | Compromise | Result |
| --- | --- | --- |
| App-managed document and connection SDK | Exact fit | Proposed feature |
| Completed CLI calls with polling | Major compromise | No pushed updates |
| Custom local bridge | Major compromise | Extra process and transport |
| Per-screen shared()/setShared() | Not a match | No remote helper document subscription |
| Issue #38 | Related request | Machine-scoped state, without this full contract |

Research surfaces: source paths, generated declarations, contribution policy, mod guide, security policy, issue templates, existing event tests in hc.rs, and open/closed issue searches for doc.get, document/mod, and mod/core were inspected. No performance claim relies on a build. Platform behavior for a new binding remains unverified.

A private local Core 0.1.21 probe passed two-subscriber delivery, reverse request documents, stale-write rejection, reconnect rereads, oversized-write rejection, and bounded chunk transfer. It did not verify physical SSH or native QuickJS event delivery. Local evidence: `/tmp/herdr-doc-real-verification-20261114.json`. Do not include this private filesystem path in the upstream issue.

Viability gate: clear outcome, policy permits the request, supported mod capability gap, and credible implementation path. Existing #38 overlaps but does not supply the API. Status: viable as a proposal. Confidence: high for the gap, moderate for implementation scope. No code change or upstream submission occurred.

## Tickets

No implementation tickets exist for this proposal.

## Comments

The user requested a proposal, not automatic submission. Keep this draft local until the user approves publication.



### Published minimal request

The user approved the smaller remote-process-channel request and authorized submission. The earlier document API proposal remains research history, not the published scope.

Published issue: https://github.com/herdrdev/herdr-app/issues/1046

The issue requests incremental stdin/stdout, separate stderr, backpressure, exit and connection errors, automatic channel cleanup, and reuse of managed machine connections. It does not request document APIs or raw SSH handles.

#### Published body

### What did you try to build?

A QuickJS mod that exchanges live messages with a helper on a remote machine.

Herdr already connects to that machine. I want to reuse that managed connection instead of creating another SSH tunnel or exposing a network port.

### What is missing?

A QuickJS interface that opens a bidirectional process channel on an already configured machine.

```js
import { remote } from "herdr";

// Proposed API.
const channel = await remote.open({
  on: machineName,
  argv: ["my-helper", "connect"],
});

await channel.write(requestBytes);
const responseBytes = await channel.read();
await channel.close();
```

Required behavior:

- **Reuse managed connections:** Use Herdr’s existing machine connection and connection lifecycle.
- **Stream both ways:** Expose stdin and stdout incrementally. Keep stderr separate.
- **Bound memory:** Apply backpressure to reads and writes.
- **Report termination:** Expose process exit and connection errors.
- **Release safely:** Close the channel when the mod closes or reloads. Preserve other consumers of the machine connection.

The request does not require raw SSH handles, credential access, document APIs, or a generic RPC interface. The mod owns its wire protocol.

### Why existing APIs are insufficient

`exec` and `hc` return completed command output. They do not expose an incremental bidirectional channel.

### Acceptance criterion

Two QuickJS mod views can exchange messages with remote helpers through the same managed machine connection. Closing one channel does not interrupt the other.

**Implementation question:** Can Core provide this channel through its current transport, or does it need a new protocol method?

