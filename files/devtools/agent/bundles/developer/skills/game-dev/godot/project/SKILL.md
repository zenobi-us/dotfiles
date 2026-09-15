---
name: godot-project
description: Use when starting a session in a Godot project — detects the project, engine version, renderer, language, mentor mode, and agent-instructions wiring
---

# Godot Project Session Context

This skill owns the Godot project session-start integration.

The companion script at `scripts/session_start.sh` runs from the `SessionStart` hook and adds
project context to the agent session. It detects the nearest Godot project, reads its Godot
version and renderer, identifies C# projects, restores mentor mode, and checks whether the
project's agent instructions mention GodotPrompter.

## Related skills

- `using-godot-prompter` — Godot skill catalog and workflow.
- `godot-mentor` — mentor-mode behaviour and per-project state.
- `godot-project-setup` — project structure and initial configuration.

## Session-start rules

- Run only when a `project.godot` file can be found.
- Prefer a project found above the current working directory.
- Skip vendored, generated, and example projects during downward discovery.
- Keep mentor state under `~/.godot-prompter/state/`, never in the game repository.
- Do not add a `## GodotPrompter` section to project instructions without user agreement.
- Preserve the host hook output format required by the active agent host.
