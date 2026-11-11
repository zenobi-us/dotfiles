---
schema: collect-evidence/v1
kind: driver
---
# Playwright driver

Use the existing playwright-cli driver. Complete CLI and browser setup before capture. doctor --driver playwright checks the CLI and launches then closes an owned blank browser. A CLI version alone does not prove that a browser is installed.

PLAYWRIGHT_MCP_EXECUTABLE_PATH selects an existing browser when the default Chrome location is unavailable. This is an upstream launch setting, not an evidence store setting. Do not install a browser during capture or replace playwright-cli with another browser API.

The driver refuses an existing session name and closes only its own isolated session. Generated code drives the real page, checks live origin and credential state, and returns observations separately from verdict evaluation. It retains observations before failures. Human steps stop further case actions.

Assertions poll until the condition holds or the timeout expires. Pre-assertion and settled captures have distinct names and sequences. Capture times come from successful screenshot completion. The common validator checks actual PNG bytes, dimensions and hashes.

When approved, video: true records one real WebM per case through video-start and video-stop. The recording is a case asset, not a claimed step frame. Common records read dimensions and available timing from the WebM. Unknown metadata remains null. A native recording failure creates an explicit unavailable diagnostic; valid image assertions remain independent. Preserve any native output bytes without registering a failed recording as usable media.

The driver dismisses newly opened native dialogs without entering text and records BLOCKED. It does not accept confirmation dialogs or provide credentials. Temporary output stays outside the watched source tree until owned-browser cleanup finishes.
