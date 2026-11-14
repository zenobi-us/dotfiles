---
title: Draft recovery implementation 0002
type: Report
---

# Recover drafts and prevent incomplete feedback exports

## Ticket summary

Implement [the draft recovery ticket](../../../../tracker/tickets/collect-evidence-feedback-07-drafts.md) from the [initiative specification](../../../../tracker/initiatives/collect-evidence-feedback/index.md).

## Problem

Image component unmounts destroyed unfinished comments. The UI export link could silently omit them.

## Implementation

Retain identity-bound browser drafts through navigation and reload. Keep frozen retry payloads and starting revisions. Warn on memory-only storage. Require save or explicit discard before complete UI export.

- **Draft identity:** Each collect-feedback/v1 draft stores its annotation input, nullable startingRevision, optional submitted payload and failure message. Matching includes session, case, asset, source hash and dimensions.
- **Draft recovery:** A shared store updates synchronously before navigation or network requests. Tab-local sessionStorage keeps drafts at the same origin. Recovery does not adopt a newer saved revision.
- **Export resolution:** The UI checks all drafts, including unavailable images, and pending writes. Open a draft to save it or discard it explicitly. Saved-note selection remains clean.
- **Saved authority:** The server remains authoritative. CLI and direct API exports remain saved-only. Retry uses the stable ID, payload and revision precondition.
- **Distribution:** Rebuilt the bundled page. Updated the human guide, skill procedure, service contract and changelog.
- **Generated metadata:** Repository commit hooks updated the developer plugin and marketplace versions. No other product area was edited.

## Source identity

- **Branch:** feature/collect-evidence-feedback-07-drafts.
- **Base:** master; starting commit 7bc26119347f92e2b83c24860214ac541c52b0f0.
- **Feature commit:** 096e32cb.
- **Final commit:** adc77612bfbb3b8229aefff665848a4f79d963a1.
- **Final tree:** d7498cc01ce684304b672b84cacd0c792d32edf2.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/CHANGELOG.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/how-to-browse-evidence.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/references/viewer-contract.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/index.html`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/annotation-image.tsx`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/components/draft-export.tsx`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/drafts.tsx`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/main.tsx`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer/src/styles.css`

## Validation results

The final scoped suite passed with 1 test, 0 failures and 116 expect calls. The final typecheck passed. The same bundled page was exercised and inspected separately in a real browser. CLI checks below record argv, cwd and exit code. Browser observations do not claim a process exit code.

```json
{
  "argv": [
    "mise",
    "exec",
    "--",
    "bun",
    "install",
    "--frozen-lockfile"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer",
  "exit_code": 0,
  "result": "Installed pinned build dependencies before capture."
}
```
```json
{
  "argv": [
    "mise",
    "exec",
    "--",
    "bun",
    "test",
    "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts",
  "exit_code": 1,
  "result": "Initial prerequisite failure: Playwright default Chrome path was absent. Used the already installed cached Chromium via PLAYWRIGHT_MCP_EXECUTABLE_PATH; installed no browser."
}
```
```json
{
  "argv": [
    "env",
    "PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
    "mise",
    "exec",
    "--",
    "bun",
    "test",
    "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts",
  "exit_code": 1,
  "result": "Expected baseline regression before implementation: navigation destroyed the draft; textarea lookup timed out."
}
```
```json
{
  "argv": [
    "env",
    "PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
    "mise",
    "exec",
    "--",
    "bun",
    "test",
    "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts",
  "exit_code": 1,
  "result": "Intermediate runs observed incomplete browser scenarios and revision 4/5 instead of 13. Removed unload prompts for persisted drafts and required a browser completion result. Another intermediate run timed out expecting disk failure HTTP 500; existing service returns HTTP 409. The check now waits for a rejected write."
}
```
```json
{
  "argv": [
    "mise",
    "exec",
    "--",
    "bun",
    "run",
    "build"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer",
  "exit_code": 0,
  "result": "Bundled final viewer: 342960 bytes, embedded scripts/styles/fonts."
}
```
```json
{
  "argv": [
    "env",
    "PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
    "mise",
    "exec",
    "--",
    "bun",
    "test",
    "mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback/test/workflow.test.ts"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts",
  "exit_code": 0,
  "result": "Final complete scoped suite: 1 pass, 0 fail, 116 expect calls. Public CLI, HTTP and real browser workflow; navigation, reload, stale revisions, lost acknowledgement, disk permission failure, storage failure, explicit discard and saved export hashes."
}
```
```json
{
  "argv": [
    "mise",
    "exec",
    "--",
    "bun",
    "run",
    "typecheck"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/viewer",
  "exit_code": 0,
  "result": "Final viewer TypeScript check passed."
}
```
```json
{
  "argv": [
    "mise",
    "exec",
    "--",
    "bun",
    "/tmp/drafts-smoke-setup.ts"
  ],
  "cwd": "/tmp",
  "exit_code": 0,
  "result": "Throwaway setup exercised public collect-evidence init/render/compile/run and collect-feedback init/validate from an unrelated temporary directory. Script removed after proof; session data retained."
}
```
```json
{
  "argv": [
    "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts",
    "serve",
    "/tmp/drafts-smoke-WaYLUI/repository/workflows/draft-smoke/artifacts/evidence/review",
    "--port",
    "18827",
    "--json"
  ],
  "cwd": "/tmp",
  "exit_code": 0,
  "result": "Owned service served the actual bundled page and exited 0 after Ctrl-C. Port returned ECONNREFUSED (111); writer lock absent."
}
```
```json
{
  "kind": "browser",
  "url": "http://127.0.0.1:18827",
  "result": "passed",
  "observations": [
    "Inspected actual rendered draft editor, guarded export panel, failed-write error, memory-only warning and narrow-screen resolution.",
    "Case navigation did not move the draft to another image. Reload recovered its comment. Ctrl+Enter saved revision 1 with matching hash a2b22bef919a5507ae3093488a6f0d943be864188670a97b6d6864a4faf6f98d.",
    "chmod 500 on owned annotation directory caused a real failed PATCH. Comment remained, Saved count was 0; reload retained the error and retry payload. chmod 700 plus retry saved revision 2.",
    "Storage.prototype.setItem throwing QuotaExceededError in the application world retained the comment across navigation and showed memory-only warnings.",
    "Closed only the owned browser. Raw browser.close() was needed after the wrapper kill option left the private Chromium running; reported the tool discrepancy."
  ]
}
```
```json
{
  "argv": [
    "/home/zenobius/.omp/agent/bundles/agent-core/skills/muxer-subagents/scripts/router.ts",
    "resources",
    "373dd6f8-8223-4095-9805-0a762b15e4da"
  ],
  "cwd": "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts",
  "exit_code": 1,
  "result": "Observed ownership while service/browser were live and after shutdown. PIDs 42774 and 44323 are stopped. Overall observation remains pending because this implementation agent and its tool harness are still live; parent owns pane closure."
}
```

## Public smoke setup commands

These commands created genuine temporary evidence and the feedback session. No ticket evidence run was published. Temporary screenshots were visual diagnostics, not sealed acceptance artifacts. The temporary session remains at `/tmp/drafts-smoke-WaYLUI/repository/workflows/draft-smoke/artifacts/evidence/review`.

```json
[
  {
    "argv": [
      "git",
      "init",
      "--quiet",
      "/tmp/drafts-smoke-WaYLUI/repository"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "git",
      "-C",
      "/tmp/drafts-smoke-WaYLUI/repository",
      "remote",
      "add",
      "origin",
      "https://example.invalid/owned/drafts-smoke.git"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "init",
      "/tmp/drafts-smoke-WaYLUI/working",
      "--repository",
      "/tmp/drafts-smoke-WaYLUI/repository",
      "--workflow",
      "draft-smoke",
      "--run",
      "source",
      "--driver",
      "playwright",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "render",
      "/tmp/drafts-smoke-WaYLUI/working",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "compile",
      "/tmp/drafts-smoke-WaYLUI/working",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts",
      "run",
      "/tmp/drafts-smoke-WaYLUI/working",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts",
      "init",
      "/tmp/drafts-smoke-WaYLUI/repository/workflows/draft-smoke/artifacts/evidence/source",
      "--repository",
      "/tmp/drafts-smoke-WaYLUI/repository",
      "--workflow",
      "draft-smoke",
      "--session",
      "review",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  },
  {
    "argv": [
      "/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-07-drafts/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts",
      "validate",
      "/tmp/drafts-smoke-WaYLUI/repository/workflows/draft-smoke/artifacts/evidence/review",
      "--json"
    ],
    "cwd": "/tmp/drafts-smoke-WaYLUI",
    "exit_code": 0
  }
]
```

## Review history

No independent review was launched. Review belongs to the parent workflow after this implementation handoff.

## Resolved findings

None. No review findings exist for this source identity.

## Remaining findings

No known implementation blocker remains. This is not a reviewer verdict.

## Latest reviewer verdict

Not reviewed.

## Merge status

Not merged or pushed. The ticket remains claimed. The parent owns phase completion, review and integration.

## Limits

- **Tab scope:** Draft recovery requires the same browser tab and origin, including the port. Closing the tab or changing the port is outside this recovery guarantee.
- **Storage failure:** Drafts remain in memory when storage fails. The page warns that reload can lose them.
- **Service diagnostics:** The existing service reports a generic HTTP 409 for the exercised disk permission failure. Retry retained the comment and succeeded after permissions were restored.
- **Shutdown:** Owned feedback service and private browser are stopped. The live implementation agent and its tool harness remain for the parent to close normally.

## Open questions

None.

## Supporting records

- [Parent start receipt](../../events/start-0001.yaml).
- [Implementation result receipt](../../events/implementation-0002.yaml).
- [Implementation snapshot](pr-draft-implementation-0002.md).

