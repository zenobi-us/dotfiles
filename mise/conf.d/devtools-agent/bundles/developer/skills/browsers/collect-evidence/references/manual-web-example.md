---
schema: collect-evidence/v1
kind: procedure
title: "Manual CLI example: collect a web image for feedback"
---
# Manual CLI example: collect a web image for feedback

Collect a real image of a controlled local page through the installed public CLI.
For operators and agents. Version: collect-evidence/v1.
For real application work, use the [web](web.md), [TUI](tui.md), or [GUI](gui.md) driver procedure.

## Prepare the tools and scope

Prerequisites: mise, Bun, installed skills, a launchable Playwright browser, and a writable shared-context evidence route.
Complete dependency setup separately. This example approves read-only navigation to one local fixture. It does not approve other application actions.

Set absolute paths and a new workspace outside the repository:

```sh
BUNDLES="$HOME/.omp/agent/bundles"
EVIDENCE="$BUNDLES/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts"
REPOSITORY=/absolute/repository-in-scope
WORKSPACE=/absolute/new-external-workspace
"$EVIDENCE" doctor --driver playwright --json
"$EVIDENCE" init "$WORKSPACE" --repository "$REPOSITORY" \
  --workflow review-example --run fresh-001 --driver playwright --json
```

If default Chrome is absent, export `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/absolute/existing/browser` before doctor and capture.
Do not install a browser during collection. A missing required browser returns exit 3.

## Start the controlled page

In a separate terminal, run this fixture through the installed Bun runtime:

```sh
mise exec -- bun -e 'Bun.serve({hostname:"127.0.0.1",port:8090,fetch:()=>new Response("<!doctype html><title>Evidence example</title><h1>Evidence ready</h1>",{headers:{"content-type":"text/html"}})}); console.log("http://127.0.0.1:8090");'
```

Expected result: the foreground server owns port 8090 and returns the fixture page.
If the port is occupied, stop the example. Do not close another process or select an unapproved origin.
Agents must preserve their muxer run identity in this service environment and register live ownership.

## Author and approve the plan

Write this complete `plan.ts` into the workspace from the first terminal:

```sh
cat > "$WORKSPACE/plan.ts" <<'PLAN'
export const plan = {
  schema: "collect-evidence/v1", kind: "plan",
  workId: "review-example", driver: "playwright",
  base: "http://127.0.0.1:8090",
  approval: { origins: ["http://127.0.0.1:8090"] },
  tests: [{
    id: "ready", claim: "Inspect the controlled page",
    pass: "The expected heading is visible", fail: "The expected heading is absent",
    steps: [
      { do: "navigate", says: "Open the controlled page.", to: "/" },
      { do: "expect", says: "Read the ready heading.", locator: "h1",
        text: "Evidence ready", visible: true, shot: "ready-heading" },
    ],
  }],
};
PLAN
"$EVIDENCE" render "$WORKSPACE" --json
```

Read the generated human procedure before capture. Obtain approval for the exact local origin and read-only actions.
The approval fields record that permission. They cannot grant it.
If the plan changes, regenerate render and compile with `--force` after renewed approval.

## Collect and validate the run

```sh
"$EVIDENCE" compile "$WORKSPACE" --json
"$EVIDENCE" run "$WORKSPACE" --dry-run --json
"$EVIDENCE" run "$WORKSPACE" --json
SEALED_RUN=/absolute/path/from-run-destination
"$EVIDENCE" validate "$SEALED_RUN" --json
"$EVIDENCE" verdicts "$SEALED_RUN" --json
"$EVIDENCE" report "$SEALED_RUN" > /absolute/external-report.html
```

Expected result: a new sealed run contains the actual page image, source hashes, ordered observations, and the heading assertion result.
Inspect the image itself. A screenshot without the expected live heading is not passing proof.
Keep report output outside the sealed run. Every retry needs a new run identity.

For optional recording, set `video: true` in the approved plan before render and compile.
Playwright doctor reports recorder capability. Surf, native TUI, and native GUI recording remain unavailable.
Video notes do not promise exact-frame accuracy.

## Open feedback or hand off evidence

Use the [feedback how-to](../../collect-feedback/references/request.md#collect-and-open-feedback) to import this sealed run, save notes, and export them.
For one fresh request, use its `request` command after compile instead of the separate collector `run` command.
Use the [CLI reference](../../collect-feedback/references/cli.md) for output formats and exit codes.
Use the [system explanation](../../collect-feedback/references/system.md) for storage, immutable records, and phase authority.

Stop only the fixture server you created with Ctrl-C. Validate that port 8090 is released.
The collector closes its own browser session. Keep user-owned tabs and terminals open.
Local capture and report generation do not approve publication or remote Git operations.
