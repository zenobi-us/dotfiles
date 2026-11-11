---
schema: collect-evidence/v1
kind: driver
---
# Surf driver

Run doctor --driver surf before collection. Surf needs an installed Chrome extension, native host connection and visible browser. Complete setup separately. Keep user Chrome and existing tabs open.

The driver creates a fresh named session with session.new, records ownership and switches to its tab. It refuses an existing session name and closes only its owned session. Surf is attended: keep its browser visible during screenshots. A successful connection does not prove screenshot visibility.

Compilation produces a tool-native Surf workflow ending in .json and a versioned driver map ending in .json.map. These private suffixes cannot collide, including for case IDs a and a.map. The map connects tool actions, assertion execution and distinct screenshots to stable plan steps. Preserve the native workflow and raw output without inserting schema fields into the tool's own format.

Surf accepts assertion-like workflow keywords that its runner can ignore. This driver uses JavaScript assertions that throw and poll for readiness. Keep those real checks; do not replace them with expect, when, retry or continueOnError fields. A process exit or screenshot alone cannot establish PASS.

Each assertion keeps capture-001 before checking and capture-002 after settling. No automatic navigation retry repeats side effects. A new collection needs a new run identity. The driver records actual screenshot-completion time, URL and live viewport. Common records compute dimensions and SHA-256 from the actual bytes.

The driver checks native dialog state before actions and after the workflow. It never accepts a dialog or fills credentials. A native prompt can make a tool action time out before the blocked result arrives. Record that limit, not a pass.

This collector does not record Surf video. It reports that limitation and retains valid image evidence. A still image is not a recording.

Surf substitution keys use a collision-free internal encoding. Public run, case and step IDs remain unchanged, including hyphens, dots and underscores. The real public workflow checks approved-space and distinct a-b, a.b, a_b, a and a.map identities. An empty screenshot slug takes no screenshot; use a separate step with a non-empty slug when image evidence is required.

