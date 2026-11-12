# Muxer contract: herdr-app

## Separate products

Herdr desktop is not the older `herdr` TUI. They use separate runtimes and do not share agents. Use `herdr-app` for the window and `hc` (herdr-core) for programs. Never substitute TUI `herdr agent`, `herdr pane`, or `herdr worktree` commands. See the [official product distinction](https://herdr.dev/#questions) and [app README](https://github.com/herdrdev/herdr-app/blob/0ac92e4e9d5dea2097375c26e6a0cb194a75c2f0/README.md).

## Detection and prerequisites

`HC_TERMINAL_ID` is the current core terminal address, such as `t7`. It is not an app pane ID. The router selects `herdr-app` when this value is non-empty and no explicit TUI, Zellij, tmux, or hrdx marker wins. `HC_SESSION`, `HC_SOCKET`, an installed binary, and `HERDR_APP_HOME` alone do not prove a terminal session.

A core terminal can exist without a window. Before launching, the router requires an open window containing the parent terminal. It fails rather than opening a window or guessing the focused space. Run these read-only commands when diagnosing it:

```sh
herdr-app --skill
hc --skill
herdr-app ls
herdr-app status
```

Use `HERDR_APP_HOME` to select the correct window when the user has multiple instances. Never run bare `herdr-app` to inspect it. Never stop or restart the user's app or core.

## Fresh child tab

Use the absolute installed router path:

```sh
"$SKILL_DIR/scripts/router.ts" spawn --muxer herdr-app --agent omp \
  --cwd /absolute/existing/worktree --result-schema <domain-schema> \
  --prompt-file /absolute/handoff.txt
```

The caller supplies an existing directory through `--cwd`. The router first finds the space that contains the parent terminal. The router runs in the parent terminal, so the parent's machine is the router's machine. The app names a terminal on another machine with a prefix, such as `wsl-docker/t8`; the router matches `HC_TERMINAL_ID` with that prefix. If the address appears on more than one machine, the router fails. It then matches the normalized absolute target directory against the `folder` values of spaces on the parent's machine. The parent space and focused space do not determine placement.

If one space matches, the router opens a fresh tab there with `herdr-app do tab.new`, its explicit space ID, a unique name, `folder`, and an argv array. If none matches, it calls `herdr-app do space.new` with that folder and argv for the first tab. It sets `machine` to the parent's machine, or `""` for the app's own machine. If multiple spaces match, it reports their IDs and fails before opening a terminal. Spaces on other machines with the same folder do not match. The router removes the machine prefix from the returned terminal address, because the local `hc` knows the terminal without it.

Every launch creates a fresh terminal. Review and fix sessions reuse the target worktree space, not the orchestrator’s space. New spaces and tabs can change what the user sees; use this route only when the caller requests a child pane. Ordinary hidden workers belong in `hc run --bg` instead.

The argv array uses `env` to pass depth, run identity, child role, and result context, then starts the interactive agent with its handoff file. Codex also receives `--no-daemon`, as required by the core manual. The target returned by the router is a terminal address, not a pane or tab ID.

This router launch path places the child on the parent's machine only. The prompt and result context are files on that machine. For remote orchestration, use `hc run --on <machine>` and `hc file` with a delivery context accessible on that machine. Do not pass local file paths to a remote terminal.

## WSL with the Windows app

When the app runs on Windows and the parent runs in WSL, the app reports the WSL session as a machine, such as `wsl-docker`. The `herdr-app` command is not on the WSL `PATH`. The router looks for the app command in this order: `HERDR_APP_BIN`, `herdr-app` on `PATH`, then `herdr-app.exe` on `PATH`. If none exists, it fails before it opens a terminal and names `HERDR_APP_BIN`. Set it to the Windows executable through WSL interop, for example:

```sh
export HERDR_APP_BIN=/mnt/c/Users/<user>/AppData/Local/Programs/herdr-app/herdr-app.exe
```

Use the WSL path for `--cwd`. The app accepts it for spaces on the WSL machine.

## Wait, read, and resume

Save the router's run ID, target, and delivery fields. Wait through the router:

```sh
"$SKILL_DIR/scripts/router.ts" wait <runId>
hc read <terminal> --lines 120
```

The router uses event-driven `hc wait <terminal> --json`. It maps explicit `done` to completed, `blocked` to blocked, and `error` to failed. An exit code of zero means process completion; a nonzero code or signal means failure. Terminal loss without an exit code or signal is unconfirmed. Startup `idle` and pane text are never proof of completion. If no completion is confirmed, inspect the terminal before waiting again. Do not sleep or poll.

A timeout is a check-in, not failure. A `reason: message` return interrupts the native wait; the router currently returns no completion signal for it. Read the incoming report, then wait again. Neither case means that the child completed.

For blocked work, read the screen and resolve the question or permission with the user. Use `hc send <terminal> "<answer>"` only after that decision. Do not use `--force` to bypass permission. After resumption, pass the prior blocked sequence to router wait with `--after-sequence <sequence>`. Verify the delivered artifact separately; native status does not establish domain success.

## Close only the child

After collecting and verifying results, stop and remove only the terminal this run created:

```sh
hc kill <terminal>
hc rm <terminal>
```

After removal, inspect `herdr-app ls`. The app normally removes the child pane and empty tab automatically; do not send a close command to a stale pane ID. If a child pane still exists, resolve its current ID from the terminal address before calling `herdr-app do pane.close --pane <paneId>`. Leave its space and unrelated tabs open. Herdr can remove an empty space when its last terminal is removed. A later launch recreates the target space if absent. Do not retain a dummy terminal to keep it open. Closing the window does not stop terminals; closing a pane does.

## Primary evidence

Checked 2026-11-10 against the installed CLIs and these first-party sources:

- **Product boundary:** [herdr.dev](https://herdr.dev/) describes the separate TUI and core runtime.
- **App agent guide:** [src/SKILL.md](https://github.com/herdrdev/herdr-app/blob/0ac92e4e9d5dea2097375c26e6a0cb194a75c2f0/src/SKILL.md) specifies terminal addresses, inspection, explicit targets, window safety, and hc orchestration.
- **App actions:** [docs/commands.md](https://github.com/herdrdev/herdr-app/blob/0ac92e4e9d5dea2097375c26e6a0cb194a75c2f0/docs/commands.md) defines tab.new, pane.close, and their arguments.
- **Core agent guide:** [skills/herdr-core/SKILL.md](https://github.com/herdrdev/herdr-core/blob/ce81486e3d4032405060bb823687376fadaa087b/skills/herdr-core/SKILL.md) defines launch, messaging, wait, cleanup, and remote operations. Recheck `hc --skill` for the installed version.
- **Native wait semantics:** [wait.rs](https://github.com/herdrdev/herdr-core/blob/ce81486e3d4032405060bb823687376fadaa087b/crates/herdr-core/src/wait.rs) defines status, exit, timeout, message, and startup-idle behavior. [cli.rs](https://github.com/herdrdev/herdr-core/blob/ce81486e3d4032405060bb823687376fadaa087b/crates/herdr-core/src/cli.rs) defines JSON CLI dispatch.

## Verification

Checked 2026-11-11. Before the placement fix, regression cases selected the parent space instead of the target worktree space. New-space creation and ambiguous-space rejection also failed. After the fix, all 33 tests passed across the muxer skill’s three test files. Coverage includes cross-space placement, normalized folder matching, remote exclusion, target-space creation and reuse, ambiguous matches, and parent-window prerequisites.

Real desktop smoke programs passed three placement checks: a fresh tab in an existing feature-worktree space, creation of a missing local space, and a second fresh terminal in that same new space. Each check verified the containing app space and the terminal’s working directory through `herdr-app ls` and `hc get`. The existing-space launch also produced a desktop screenshot. Only smoke terminals and the temporary smoke space were removed; the previous space selection was restored. These checks prove muxer placement, not an AI agent’s domain result.

Checked 2026-11-12 from WSL with the Windows app. Before the fix, the spawn failed with `Executable not found in $PATH: "herdr-app"`. After the fix, 39 tests passed. A real spawn with `HERDR_APP_BIN` set to the Windows `herdr-app.exe` opened a fresh tab in the existing `wsl-docker` space for the target folder. `hc get` confirmed the working directory, `router.ts wait` returned `completed`, and the child replied. The smoke terminal was removed.

