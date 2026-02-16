# pi-shell-completions

Adds native shell completions to pi's `!` and `!!` bash mode commands.

## Installation

```bash
pi install npm:pi-shell-completions
```

Or for local development, place in `~/.pi/agent/extensions/shell-completions/`

## How it works

When you type `!git checkout ` in pi's prompt, this extension queries your shell's completion system and shows suggestions.

### Shell support

| Shell | How it works | Quality |
|-------|--------------|---------|
| **Fish** | Native `complete -C` command | ⭐⭐⭐ Excellent - all completions work |
| **Bash** | Sources bash-completion scripts | ⭐⭐ Good - if bash-completion is installed |
| **Zsh** | Fallback script for common tools | ⭐ Basic - see limitations |

### Fish (recommended)

Fish's completion system is designed to be queried programmatically via `complete -C "command "`. This means:

- All your fish completions work automatically
- Git branches, docker containers, ssh hosts, npm scripts — everything
- Descriptions are included
- Fast (10-30ms)

Even if fish isn't your primary shell, installing it gives you great completions in pi.

### Bash

Bash-completion can be queried by setting up `COMP_*` environment variables and calling completion functions. This extension:

- Sources completion scripts from standard locations (`/opt/homebrew/etc/bash_completion.d/`, `/usr/share/bash-completion/completions/`, etc.)
- Calls the registered completion function for each command
- Works if you have bash-completion installed

### Zsh (limited)

Zsh's completion system is tightly coupled to its line editor (ZLE) and cannot be easily queried programmatically. The `zpty` pseudo-terminal approach is complex and unreliable.

**Current limitations:**
- Does NOT use your full zsh completion config
- Only handles common tools: git, ssh, make, npm/yarn/pnpm, docker
- Falls back to file completion for other commands

**Recommendation:** If you use zsh and want good completions in pi, install fish as a secondary shell. The extension will automatically prefer fish when available.

## Shell priority

1. Your `$SHELL` (if fish/zsh/bash)
2. Fish (if available) — even if not your primary shell
3. Zsh
4. Bash

## Requirements

- One of: fish, zsh, or bash
- For bash: bash-completion package installed
- For best experience: fish

## License

MIT
