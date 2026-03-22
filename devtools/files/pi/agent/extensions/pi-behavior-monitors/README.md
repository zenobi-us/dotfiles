# pi-behavior-monitors

Behavior monitors for [pi](https://github.com/badlogic/pi-mono) that watch agent activity, classify against pattern libraries, steer corrections, and write structured findings to JSON files.

Monitors are JSON files (`.monitor.json`) with typed blocks: classify (LLM side-channel), patterns (JSON library), actions (steer + write to JSON), and scope (main/subagent/workflow targeting).

## Install

```bash
pi install npm:@davidorex/pi-behavior-monitors
```

Or install all three extensions at once: `pi install npm:@davidorex/pi-project-workflows`

On first run, if no monitors exist in your project, example monitors are seeded into `.pi/monitors/`. Edit or delete them to customize.

## Bundled Example Monitors

- **fragility** — detects when the agent leaves broken state behind (errors it noticed but didn't fix, TODO comments instead of solutions, empty catch blocks). Writes findings to `.workflow/gaps.json`.
- **hedge** — detects when the agent deviates from what the user actually said (rephrasing questions, assuming intent, deflecting with counter-questions)
- **work-quality** — on-demand audit of work quality (trial-and-error, not reading before editing, fixing symptoms instead of root causes). Invoked via `/work-quality`. Writes findings to `.workflow/gaps.json`.

## File Structure

Each monitor is a triad of JSON files:

```
.pi/monitors/
├── fragility.monitor.json       # Definition (classify + patterns + actions + scope)
├── fragility.patterns.json      # Known patterns (grows automatically)
└── fragility.instructions.json  # User corrections (optional)
```

## Writing Your Own

Create a `.monitor.json` file in `.pi/monitors/` conforming to `schemas/monitor.schema.json`. Ask the LLM to read the `pi-behavior-monitors` skill for the full schema and examples.

## Commands

| Command | Description |
|---------|-------------|
| `/monitors` | List all monitors, scope, and state |
| `/<name>` | Show monitor patterns and instructions |
| `/<name> <text>` | Add an instruction to calibrate the monitor |

## How It Works

1. A monitor fires on a configured event (e.g., after each assistant message)
2. It checks scope (main context, subagent, workflow) and activation conditions
3. It collects relevant conversation context (tool results, assistant text, etc.)
4. A side-channel LLM call classifies the context against the JSON pattern library
5. Based on the verdict, the monitor executes actions:
   - **steer**: inject a correction message into the conversation (main scope only)
   - **write**: append structured findings to a JSON file (any scope)
   - **learn**: add new patterns to the library automatically
6. Downstream workflows can consume the JSON findings (e.g., gaps.json → verify step → gate)

## Schemas

- `schemas/monitor.schema.json` — monitor definition format
- `schemas/monitor-pattern.schema.json` — pattern library entry format

## Development

Part of the [`pi-project-workflows`](../../README.md) monorepo. All three packages (pi-project, pi-workflows, pi-behavior-monitors) are versioned in lockstep at 0.2.0.

`npm run build` compiles TypeScript to `dist/` via `tsc`. The package ships `dist/`, not `src/`. Tests use `vitest run` (`npm test`).
