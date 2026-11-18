---
schema: collect-evidence/v1
kind: procedure
title: Collect evidence with your coding agent
---
# Collect evidence with your coding agent

Ask your coding agent to capture a workflow and show what actually happened.
Use `collect-evidence` when you need screenshots, recorded results, or a report without an annotation viewer.
For drawing notes on captures, use [Review your application with your coding agent](../collect-feedback/howto.md).

## Before you start

Open your agent in the repository in scope. It needs `collect-evidence` and `shared-context` available, plus the tools and permissions for the selected surface.
You do not need a ticket. If you provide one, the agent uses `reading-and-writing-tickets` to read its requirements.
Child-session management is needed only when the calling workflow launches child sessions.

Ask the agent to check these prerequisites first. It should explain missing tools or permissions before attempting capture, not install tools or change access during collection.

## 1. Describe the evidence you need

Select `collect-evidence` in your agent's skill picker, if available, or name it in your request:

> Use collect-evidence to capture the settings workflow at http://localhost:3000/settings. Show the empty form, validation errors, and a successful save using test data. Check the prerequisites and propose the steps before running them.

Tell the agent what should happen and what it must not do.
For terminal work, provide the command and directory. For desktop work, identify the approved window or display; the current GUI driver captures read-only X11 surfaces.

> Collect terminal evidence for this command in this repository. Use a native terminal capture, not a browser image or reconstructed terminal output. Ask before sending input.

**Expected result:** the agent selects the appropriate capture method and shows a plan with actions, expected results, and limits.
If you want video, ask before approving capture. The agent must check recording capability; still images are not a substitute for a requested recording.

## 2. Approve the capture scope

Read the planned actions, origins or surfaces, test data, and confirmation steps.
Approve only the scope you intend:

> Capture those steps with the agreed test data. Stop for credentials, unexpected confirmations, or anything outside the approved scope.

The agent prepares the plan, runs the checks, captures the evidence, and stores the results.
It handles commands, identifiers, and storage paths behind the scenes.

**Expected result:** a new evidence run with original captures, ordered observations, check results, and a stable reference.
If a required capture tool is unavailable, the agent reports that limit instead of claiming another surface was verified.

## 3. Inspect the results

> Show me the captures and a readable summary of what passed, failed, or could not be checked. Include the evidence reference.

Compare the images with the workflow you asked for. Read the observed results and limits separately from the screenshots.
A captured screen is not proof that an assertion passed.
If the wrong state was captured, ask for a new run; keep the original evidence unchanged.

**Expected result:** you can identify the captured state, understand each check result, and find the evidence later.
The agent stops only its own capture resources and preserves the saved run.

## Reuse or share the evidence

To leave visual notes on a run you just collected:

> Use collect-feedback to open the run you just collected for annotation. Give me the viewer URL and session reference.

For an earlier run, name it explicitly and ask the agent to label the review as historical.
Earlier evidence does not prove current application behavior.

For a report:

> Prepare a readable report from this evidence. Show what was not covered. Keep it local; do not upload or publish it.

`writing-reports` is an optional report integration. Capture does not complete a ticket or approve a merge.
Sharing evidence needs a separate decision about its destination and private data.

## Technical details

You do not need to run these commands yourself. For manual operation, use the
[complete web CLI example](references/manual-web-example.md) and [CLI reference](../collect-feedback/references/cli.md).
The [web](references/web.md), [TUI](references/tui.md), and [GUI](references/gui.md) procedures describe driver requirements and limits.
The [system explanation](../collect-feedback/references/system.md) describes storage and record ownership.
