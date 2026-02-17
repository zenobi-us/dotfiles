---
name: clig-cli-design-guidelines
description: Use when designing CLI tool interfaces, reviewing CLI specs, or building command-line applications - covers flags, arguments, output, errors, secrets, signals, config, distribution, and future-proofing based on clig.dev guidelines
---

# CLI Design Guidelines (clig.dev)

## Overview

Comprehensive CLI design reference based on [clig.dev](https://clig.dev/). Design CLIs for **humans first**, while remaining composable and scriptable. Every CLI should feel like a conversation — helpful, predictable, and respectful of the user's time.

## When to Use

- Designing a new CLI tool's interface
- Reviewing a CLI spec for completeness
- Adding subcommands, flags, or output modes
- Handling secrets, config, errors, or signals in a CLI

## Core Philosophy

1. **Human-first** — shed legacy machine-first design
2. **Composable** — stdin/stdout/stderr, exit codes, plain text + JSON
3. **Consistent** — follow terminal conventions and muscle memory
4. **Discoverable** — examples, suggestions, help everywhere
5. **Conversational** — suggest corrections, confirm dangers, hint next steps
6. **Robust** — idempotent, crash-only, handle unexpected input
7. **Empathetic** — delight users, don't make them feel stupid

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

## Secrets — The Non-Negotiable Rules

**NEVER accept secrets via:**
- CLI flags — visible in `ps`, shell history, CI logs
- Environment variables — leak into child processes, `docker inspect`, `systemctl show`, logs

**ACCEPT secrets via:**
- `--secret-file` or `--password-file` flag pointing to a file
- stdin pipe (`echo "$SECRET" | mycmd --secret-stdin`)
- AF_UNIX sockets
- Secret management services (Vault, AWS Secrets Manager)
- OS keychain (macOS Keychain, libsecret, Windows Credential Manager)

**Common mistake:** Saying env vars are "acceptable for secrets". They are NOT. clig.dev explicitly warns against this. The `--password $(< file)` pattern is equally bad (expands in shell, visible in `ps`).

**Edge case — wrapping tools that use env var secrets (e.g., VAULT_TOKEN):** Even when the upstream tool mandates an env var, YOUR tool should accept secrets via file/stdin and set the env var internally in the child process scope only. Don't propagate the upstream tool's bad practice to your interface.

## Output Design

### Stream Routing
```
stdout → primary data (tables, JSON, digests, results)
stderr → progress, diagnostics, errors, warnings, verbose info
```

### Output Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| Human | TTY detected | Colors, progress bars, spinners, tables |
| JSON | `--json` | Structured JSON to stdout |
| Plain | `--plain` | Tab-separated, one record per line, no multi-line cells |
| Quiet | `--quiet` / `-q` | Only essential results |
| Verbose | `--verbose` / `-v` | Debug info to stderr |

### Color Rules
- Default: auto-detect TTY
- Disable when: `NO_COLOR` set (any value), `TERM=dumb`, `--no-color`, stdout not TTY
- Check stdout and stderr independently (stderr can have color even if stdout is piped)
- No animations when not TTY (prevents "Christmas tree" CI logs)

### Success Output
- **Don't print nothing** — silence confuses humans ("did it work?")
- Print concise confirmation of what changed
- Provide `--quiet` for scripts that want silence

### Long Output
- Use pager (`less -FIRX`) when output is long and stdout is TTY
- `-F` = no paging if fits one screen; `-I` = case-insensitive search; `-R` = color passthrough; `-X` = leave content on screen

## Help Text Design

### No-Args Behavior
- Show **concise** help (< 25 lines): description, 1-2 examples, command list, pointer to `--help`
- NOT a 200-line man page dump

### Help Flags
All of these MUST show help:
```
mycmd --help
mycmd -h
mycmd help
mycmd help subcommand
mycmd subcommand --help
```
`-h` added to ANY command shows help, ignoring other flags.

### Structure
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

### Suggest Corrections
On typo: `Unknown command 'psh'. Did you mean 'push'?` — exit non-zero.
**NEVER auto-run the corrected command.** User may have made a logical mistake, not a typo.

### Suggest Next Commands
After completing an action, hint what to do next:
```
✓ Deployed payments v2.3.1 to staging
  → Run 'mycmd status payments staging' to monitor
```

## Arguments and Flags

### Prefer Flags Over Positional Args
- Flags are self-documenting, order-independent, future-proof
- Two positional args for different things = probably wrong
- Exception: simple primary action (`cp <src> <dest>`)

### Standard Flag Names
```
-a, --all           All items
-d, --debug         Debug output
-f, --force         Skip confirmations
-h, --help          Help (ONLY ever means help)
-n, --dry-run       Preview without executing
-o, --output        Output file
-p, --port          Port number
-q, --quiet         Suppress non-essential output
-u, --user          User
-v                  Ambiguous! (verbose vs version) — prefer -d for debug
--json              JSON output
--no-color          Disable color
--no-input          Disable prompts
--plain             Machine-readable tabular output
--version           Version info
```

### Flag/Arg/Subcommand Order Independence
Both `mycmd --verbose subcmd` and `mycmd subcmd --verbose` MUST work.

### Full-Length Versions of All Flags
Every `-x` must have `--long-version`. Short flags for common operations only.

### Confirm Dangerous Operations
- **Mild** (delete file): maybe prompt
- **Moderate** (delete directory, remote resource): prompt + offer `--dry-run`
- **Severe** (delete entire app/server): require typing the name; support `--confirm="name"`

## Signals and Ctrl-C

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

## Configuration

### Precedence (highest → lowest)
```
1. CLI flags
2. Environment variables
3. Project config (.myapp.toml in repo root)
4. User config (~/.config/myapp/config.toml) — follow XDG
5. System config (/etc/myapp/config.toml)
```

### XDG Base Directory Spec
Config in `~/.config/myapp/`, NOT `~/.myapp`. Reduces home directory dotfile pollution.

### Environment Variables
- `UPPERCASE_WITH_UNDERSCORES` only
- Prefix with app name: `MYAPP_*`
- Single-line values
- Check general-purpose vars: `NO_COLOR`, `EDITOR`, `HTTP_PROXY`, `PAGER`, `TERM`, `TMPDIR`, `HOME`
- Read `.env` where appropriate (project-level)

### Modifying Other Configs
- ASK consent before modifying configs you don't own
- Prefer creating new files (`/etc/cron.d/myapp`) over appending to existing ones

## Error Design

- **Human-readable**: frame as conversation, not log dump
- **Actionable**: every error says what went wrong AND what to do
- **No stack traces** by default (only with `--verbose` or `--debug`)
- **No log-level prefixes** ([INFO], [WARN]) by default — only in verbose mode
- **Important info last** — eye drawn to end of output
- **Red sparingly** — only for actual errors
- **Bug reporting**: provide URL pre-populated with diagnostic info

## Robustness Patterns

### Crash-Only Design
- Avoid needing cleanup after operations
- Defer cleanup to next run if interrupted
- Program can exit immediately on failure → more robust AND responsive

### Idempotency
- Running the same command twice = same result
- Critical for CI/CD and scripts

### Responsiveness
- Print something within **100ms** — before any network request
- Show progress for anything > 1 second
- Make timeouts configurable with sensible defaults

### Prepare for Misuse
- Scripts wrapping your tool
- Bad internet connections
- Multiple instances running simultaneously
- Unexpected environments (macOS case-insensitive filesystem!)

## Subcommand Design

- **Consistent naming**: same flag names across subcommands
- **Consistent verbs**: `noun verb` pattern (`docker container create`)
- **No ambiguous names**: don't have both "update" and "upgrade"
- **No catch-all subcommand**: can never add subcommands without breaking
- **No arbitrary abbreviations**: `mycmd i` → `mycmd install` blocks adding `inspect` later

## Future-Proofing

- **Don't break interfaces** — subcommands, flags, config files, env vars are contracts
- **Keep changes additive** — new flags, not modified behavior
- **Warn before breaking changes** — tell users in the program itself how to adapt
- **Changing human output is OK** — it's NOT a stable interface
- **Don't create time bombs** — will your tool work without your server?

## Distribution

- **Distribute as single binary** when possible (PyInstaller, GraalVM, etc.)
- **Make uninstalling easy** — put uninstall instructions next to install instructions
- **Shell completions**: provide `mycmd completion bash|zsh|fish`

## Analytics / Telemetry

- **NEVER phone home without consent**
- Prefer opt-in; if opt-out, clearly document on first run
- Be explicit: what, why, how anonymous, retention period
- Alternatives: instrument web docs, track downloads, talk to users directly

## Interactivity

- Only prompt if stdin is TTY
- `--no-input` disables all prompts; fail with message telling user which flag to pass
- Never print passwords (disable terminal echo)
- Let users escape (Ctrl-C always works)

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

## Source

Full guidelines: https://clig.dev/
Authors: Aanand Prasad, Ben Firshman, Carl Tashian, Eva Parish
