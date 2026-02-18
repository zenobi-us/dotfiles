# Command Line Interface Guidelines (condensed)

Source + contribution:
- Full guide: https://clig.dev/
- Propose changes: https://github.com/cli-guidelines/cli-guidelines

Table of contents:
- Foreword
- Introduction
- Philosophy
  - Human-first design
  - Simple parts that work together
  - Consistency across programs
  - Saying (just) enough
  - Ease of discovery
  - Conversation as the norm
  - Robustness
  - Empathy
  - Chaos
- Guidelines
  - The Basics
  - Help
  - Documentation
  - Output
  - Errors
  - Arguments and flags
  - Interactivity
  - Subcommands
  - Robustness
  - Future-proofing
  - Signals and control characters
  - Configuration
  - Environment variables
  - Naming
  - Distribution
  - Analytics
  - Further reading
- Authors

This is a practical rubric for designing CLI interfaces (args/flags/subcommands/help/output/errors/config). Keep humans first, but preserve composability and scriptability.

## Quick Reference: Required CLI Elements

Every CLI spec MUST address ALL of these. Missing any = incomplete spec.

| Element | Required? | Key Rule |
|---------|-----------|----------|
| Exit codes | ✅ | 0 = success, non-zero = specific failures |
| stdout/stderr split | ✅ | Data → stdout, messages → stderr |
| `--help` / `-h` | ✅ | Every command and subcommand |
| `--json` flag | ✅ | Structured machine output |
| `--plain` flag | ✅ | Tabular machine output (grep/awk-friendly) |
| `--quiet` / `-q` | ✅ | Suppress non-essential output |
| `--no-color` | ✅ | Plus respect `NO_COLOR` env and `TERM=dumb` |
| `--no-input` | ✅ | Disable prompts; auto-enable when stdin is not TTY |
| `--force` / `-f` | ✅ | Skip confirmations (required for CI) |
| `--dry-run` / `-n` | ✅ | Preview destructive operations |
| `-` stdin/stdout | ✅ | Support `-` for file I/O via pipes |
| Signal handling | ✅ | Ctrl-C, SIGTERM, second Ctrl-C |
| Config precedence | ✅ | Flags > env > project > user > system |
| Secret handling | ✅ | NEVER flags, NEVER env vars |
| Progress indication | ✅ | Something visible within 100ms |
| Error messages | ✅ | Actionable, human-readable, no stack traces |
| Pager for long output | ✅ | Use `less -FIRX` when TTY |

## Foreword

- CLI still uniquely powerful: inspect/control systems; works interactively and in automation.
- Modern CLI = human-first text UI, not just a machine-first REPL veneer.
- Goal: maximize utility + accessibility; design for humans and composition.

## Introduction

- This guide mixes philosophy + concrete rules; bias: examples over theorizing.
- Out of scope: full-screen TUIs (vim/emacs-like).
- Language/tooling agnostic: apply principles regardless of implementation stack.

## Philosophy

### Human-first design

- Optimize for humans by default; scripts still work via stable modes (`--json`, `--plain`, exit codes).
- Don't leak developer-only output to normal users; reserve for verbose/debug.

### Simple parts that work together

- Assume your output becomes someone else's input.
- Respect stdio, exit codes, signals; keep primary output on stdout.
- Prefer line-oriented plain text for piping; add JSON for structured needs.

### Consistency across programs

- Follow common conventions unless they harm usability.
- Reuse standard flag names (`--help`, `--version`, `--json`, `--dry-run`, …).

### Saying (just) enough

- Too little: "hangs" with no feedback. Too much: noisy debug spew.
- Make progress/status visible, but keep success output brief.

### Ease of discovery

- Help text is part of UX. Put examples first; suggest next commands.
- When user errs, help them recover: point to the right syntax/flag.

### Conversation as the norm

- Expect trial-and-error loops. Design for repeated invocations.
- Provide safe "dry run"/preview; show intermediate state; confirm scary actions.

### Robustness

- Be correct *and* feel robust: responsive, clear, no scary traces by default.
- Handle bad input gracefully; validate early; clear errors.

### Empathy

- Be on the user's side. Make success likely; make failure informative.
- Character is fine; clutter is not.

### Chaos

- Terminal ecosystem inconsistent; follow norms, but break them intentionally when needed.
- If you diverge, do it with clarity and document it.

## Guidelines

### The Basics

- Use a real argument parsing library when possible (built-in or reputable OSS).
- Exit codes: `0` on success, non-zero on failure; map a few important failure modes.
- Stdout for primary output (and machine-readable output). Stderr for messages/logs/errors.

### Help

- Always support `-h`/`--help`. Do not overload `-h`.
- If run with missing required args, show concise help + 1-2 examples + "use --help".
- Git-like CLIs: support `mycmd help`, `mycmd help subcmd`, `mycmd subcmd --help`.
- Link to a support path (repo/issues/docs). Prefer deep links per subcommand (when you have web docs).
- Lead with examples; show common flags/commands first; keep formatting readable without escape-char soup.

**Help text structure template:**

```
USAGE
  mycmd <command> [flags]

EXAMPLES            ← Lead with examples, not flag lists
  mycmd deploy api staging
  mycmd status api prod --watch

COMMANDS            ← Most common first
  deploy     Deploy a service
  status     Show deployment status
  ...

FLAGS
  -h, --help     Show help
  ...

ENVIRONMENT
  MYCMD_CONFIG   Config file path

Run 'mycmd <command> --help' for details.
```

### Documentation

- Provide web docs (searchable, linkable).
- Provide terminal docs (`mycmd help ...`); consider man pages where sensible.

### Output

- Humans first, machines second: detect TTY to choose formatting.

| Mode | Trigger | Behavior |
|------|---------|----------|
| Human | TTY detected | Colors, progress bars, spinners, tables |
| JSON | `--json` | Structured JSON to stdout |
| Plain | `--plain` | Tab-separated, one record per line, no multi-line cells |
| Quiet | `--quiet` / `-q` | Only essential results |
| Verbose | `--verbose` / `-v` | Debug info to stderr |

- If fancy human output breaks parsing, offer `--plain` (stable, line-based) and/or `--json`.
- On success: usually print *something*, but keep it brief; add `-q/--quiet` when useful.
- If you change state, say what changed and what the new state is.
- Suggest "next commands" in workflowy tools.
- Use color sparingly; disable when not a TTY, `NO_COLOR` set, `TERM=dumb`, or `--no-color`.
- No animations/progress bars when stdout isn't a TTY.
- Use a pager for long output only when interactive; common `less` opts: `-FIRX`.

### Errors

- Catch and rewrite expected errors for humans; avoid stack traces by default.
- Keep signal-to-noise high; group repeated errors.
- Put the most important info last; use red intentionally (don't drown the user).
- For unexpected crashes: provide a path to debug info + bug report instructions; write logs to a file if large.

### Arguments and flags

- Prefer flags over positional args for clarity and future flexibility.
- Provide long versions of all flags; use one-letter flags only for the most common.
- Multiple args ok for repeated simple items (`rm a b c`); avoid "2+ different positional concepts".
- Standard flag names (common set):
  - `-h, --help` help
  - `--version` version
  - `-q, --quiet` less output
  - `-v, --verbose` more output (avoid `-v` meaning version)
  - `-d, --debug` debug output
  - `-f, --force` skip confirmation / force
  - `-n, --dry-run` preview only
  - `--json` structured output
  - `-o, --output <file>` output path
  - `--no-input` disable prompts
- Default should be right for most users (don't rely on everyone aliasing a flag).
- Support `-` for stdin/stdout when input/output is a file.
- **Secrets - Non-Negotiable Rules:**
  - **NEVER** accept secrets via CLI flags - visible in `ps`, shell history, CI logs.
  - **NEVER** accept secrets via environment variables - leak into child processes, `docker inspect`, `systemctl show`, logs.
  - **DO** accept secrets via: `--secret-file` / `--password-file` flag pointing to a file; stdin pipe (`echo "$SECRET" | mycmd --secret-stdin`); AF_UNIX sockets; secret management services (Vault, AWS Secrets Manager); OS keychain (macOS Keychain, libsecret, Windows Credential Manager).
  - **Gotcha:** `--password $(< file)` is equally bad - it expands in the shell and is visible in `ps`.
  - **Edge case - wrapping tools that mandate env-var secrets (e.g. `VAULT_TOKEN`):** YOUR tool should accept secrets via file/stdin and set the env var internally in the child process scope only. Don't propagate upstream bad practice to your interface.
- Prefer order independence for flags/subcommands where the parser allows.

### Interactivity

- Prompt only if stdin is a TTY.
- `--no-input`: never prompt; if required input missing, fail with an actionable message.
- Password prompts: disable echo.
- Make escape hatch obvious (Ctrl-C, or explicit "press q", etc).

**Confirm dangerous operations by severity:**

| Severity | Example | Confirmation Pattern |
|----------|---------|---------------------|
| **Mild** | Delete single file | Maybe prompt |
| **Moderate** | Delete directory, remote resource | Prompt + offer `--dry-run` |
| **Severe** | Delete entire app/server | Require typing the name; support `--confirm="name"` |

### Subcommands

- Use subcommands for complexity; share global flags/config/help.
- Be consistent across subcommands: naming, flags, output, formatting.
- Consider noun-verb (`docker container create`) or verb-noun; pick one and stick to it.
- Avoid ambiguous pairs (`update` vs `upgrade`) unless sharply differentiated.
- Avoid implicit "catch-all" subcommands; don't allow arbitrary abbreviations (future-proofing trap).

### Robustness

- Validate early; fail fast with good error messages.
- Be responsive: print something in <100ms (especially before network I/O).
- Show progress for long tasks (interactive only); don't interleave logs confusingly.
- Use timeouts for network calls; allow configuration.
- Make reruns safe: idempotent where possible; recoverable; "crash-only" where feasible.

### Future-proofing

- Interfaces are contracts: args, flags, subcommands, config, env vars, output modes.
- Keep changes additive; deprecate loudly + early; provide migration paths.
- Allow human output to evolve; keep scripts stable by encouraging `--plain`/`--json`.

### Signals and control characters

```
First Ctrl-C (SIGINT):
  → Print message immediately (before cleanup starts)
  → Begin graceful shutdown with timeout

Second Ctrl-C:
  → Skip cleanup, exit immediately
  → Tell user this will happen: "Gracefully stopping... (press Ctrl-C again to force)"

SIGTERM:
  → Same as first Ctrl-C

Unclean state from previous crash:
  → Program MUST handle it (crash-only design)
```

### Configuration

- Pick the right mechanism:
  - Per-invocation: flags (and sometimes env).
  - Per-user/machine: flags + env; possibly config file.
  - Per-project (checked in): config file in repo.
- Follow XDG base directories for user-level config when applicable.
- Precedence (high → low): flags > process env > project config > user config > system config.
- Don't silently modify other programs' config; ask consent; prefer new files over editing existing ones.

### Environment variables

- Names: uppercase + digits + underscores; single-line values preferred.
- Respect common vars when relevant: `NO_COLOR`, `DEBUG`, `EDITOR`, `PAGER`, proxy vars, `TERM`, `TMPDIR`, `HOME`, `COLUMNS/LINES`.
- `.env` can be useful for per-project non-secret knobs; don't use it as a full config system.
- Don't accept secrets via env vars by default; prefer files/pipes/sockets/secret managers.

### Naming

- Command name: simple, memorable, lowercase; avoid too-generic collisions.
- Keep it short but not cryptic; easy to type matters.

### Distribution

- Prefer single binary when practical; otherwise use native packaging for uninstallability.
- Make uninstall easy; include instructions.

### Analytics

- Never phone home without explicit consent; explain what/why/how/retention.
- Prefer opt-in; if opt-out, make it obvious and easy to disable.
- Consider alternatives: docs instrumentation, download metrics, talking to users.

### Further reading

- POSIX Utility Conventions
- GNU Coding Standards (esp. flags/help conventions)
- 12 Factor CLI Apps
- Heroku CLI Style Guide

## CLI Design Checklist

Use this when reviewing or designing a CLI spec:

- [ ] Exit codes defined (0 + specific non-zero)
- [ ] stdout/stderr separation correct
- [ ] `--help`, `-h` on every command
- [ ] Help text leads with examples
- [ ] `--json` for structured output
- [ ] `--plain` for tabular machine output
- [ ] `--quiet` / `-q` for suppressed output
- [ ] `--no-color` + `NO_COLOR` + `TERM=dumb` respected
- [ ] `--no-input` for non-interactive use
- [ ] `--force` / `-f` for skipping confirmations
- [ ] `--dry-run` / `-n` for preview
- [ ] `-` supported for stdin/stdout file I/O
- [ ] Secrets: no flags, no env vars — files/stdin/keychain only
- [ ] Signal handling: Ctrl-C, SIGTERM, second Ctrl-C
- [ ] Config precedence: flags > env > project > user > system
- [ ] XDG Base Directory for user config
- [ ] Progress shown within 100ms
- [ ] Errors are actionable, no stack traces
- [ ] Pager for long output (TTY only)
- [ ] Crash-only / idempotent design
- [ ] Suggest next commands after actions
- [ ] Suggest corrections on typos (don't auto-run)
- [ ] Subcommands: consistent naming, no abbreviations, no catch-all
- [ ] Future-proofing: no breaking changes without deprecation
- [ ] Distribution: single binary, easy uninstall
- [ ] Analytics: opt-in or explicit opt-out only
- [ ] Standard flag names used where applicable

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Secrets via `--password` flag | Use `--password-file` or stdin pipe |
| Secrets via env vars | Use files, stdin, keychain, secret managers |
| Auto-running corrected commands | Suggest and exit non-zero |
| Arbitrary subcommand abbreviations | Explicit aliases only |
| Overloading `-v` (verbose + version) | Separate: `-v` verbose, `--version` version |
| Always-on color | Auto-detect TTY + respect `NO_COLOR` |
| Stack traces on error | Clean message + `--verbose` for traces |
| Silent success | Concise confirmation + `--quiet` for silence |
| 200-line help on no args | 15-25 line summary + pointer to `--help` |
| Catch-all subcommand | Blocks future subcommand additions |
| No signal handling | Ctrl-C immediate response + bounded cleanup |

## Authors

Original "Command Line Interface Guidelines" authors (and many contributors): Aanand Prasad, Ben Firshman, Carl Tashian, Eva Parish. Design by Mark Hurrell.
