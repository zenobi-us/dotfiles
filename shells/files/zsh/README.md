# ZSH Configuration

A modular zsh configuration using [zinit](https://github.com/zdharma-continuum/zinit) as the plugin manager, organized around shell phases and functionality domains.

---

## Quick Reference

### Everyday Commands

| Command | Description |
|---------|-------------|
| `dotfiles` | **Interactive fzf selector** (ESC or empty = apply all) |
| `dotfiles shells` | Apply only the `shells` manifest |
| `dotfiles shells,git` | Apply multiple manifests (comma-separated) |
| `assume` | AWS profile switcher (granted) |

### Git Utilities

| Command | Description |
|---------|-------------|
| `resign-commits [email]` | Re-sign commits with GPG for a given email |
| `git_forge_all_commits [email] [name]` | Rewrite all commit authors (use carefully) |

### Keybindings (Selection Mode)

| Keys | Action |
|------|--------|
| `Shift+←/→` | Select character left/right |
| `Shift+↑/↓` | Select line up/down |
| `Shift+Home/End` | Select to start/end of line |
| `Ctrl+Shift+←/→` | Select word left/right |
| `Ctrl+←/→` | Move word (deselects) |
| `Del / Backspace` | Delete selected region |

---

## Architecture

```
.zshenv          # Entry point: sets DOTFILE_ROOT, loads env modules
    └── zinit.zsh
        └── zinit_load_env_modules()

.zprofile        # Login shells: loads profile modules
    └── zinit.zsh
        └── zinit_load_profile_modules()

.zshrc           # Interactive shells (external, sources zprofile patterns)
    └── zinit_load_interactive_modules()
```

### Module Naming Convention

Modules follow a `<domain>__<phase>.zsh` pattern:

| Suffix | Phase | When Loaded | Example |
|--------|-------|-------------|---------|
| `__env` | Environment | Every shell (`.zshenv`) | `mise__env.zsh` |
| `__profile` | Login | Login shells (`.zprofile`) | `mise__profile.zsh` |
| `__config` | Interactive | Interactive shells | `mise__config.zsh` |
| `__aliases` | Interactive | Interactive shells | `dotfiles__aliases.zsh` |

---

## How Zinit Loads

### Bootstrap (`zinit.zsh`)

```zsh
# Auto-installs zinit if missing
ZINIT_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}/zinit/zinit.git"
[ ! -d $ZINIT_HOME/.git ] && git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
source "${ZINIT_HOME}/zinit.zsh"
```

### Local Module Loader

```zsh
zinit_load_local_module() {
  local module_path="$DOTFILE_ROOT/modules/$1"
  [[ -f "$module_path" ]] && zinit snippet "$module_path"
}
```

### Phase Functions

| Function | Called From | Purpose |
|----------|-------------|---------|
| `zinit_load_env_modules` | `.zshenv` | PATH, exports, env vars |
| `zinit_load_profile_modules` | `.zprofile` | Login-time setup |
| `zinit_load_interactive_modules` | `.zshrc` | Completions, aliases, keybindings |

### Bundled Plugins

| Plugin | Purpose |
|--------|---------|
| `junegunn/fzf` | Fuzzy finder (installed from gh-r) |
| `starship/starship` | Prompt (compiled init at clone time) |
| `Aloxaf/fzf-tab` | Tab completion via fzf |
| `loiccoyle/zsh-github-copilot` | Copilot suggestions |

---

## Helper Libraries (`lib/`)

Portable shell functions sourced by modules or scripts.

### `logging.sh`

Colored, leveled logging for scripts.

```bash
source "$DOTFILE_ROOT/lib/logging.sh"

info "Starting process"       # [INFO] Starting process
success "Completed"           # [SUCCESS] Completed
warning "Check this"          # [WARNING] Check this
error "Something failed"      # [ERROR] Something failed
debug "Verbose info"          # Only shows if DEBUG is set
fatal "Unrecoverable"         # Prints and exits 1
```

### `bashkit.sh`

Argument and environment validation.

```bash
source "$DOTFILE_ROOT/lib/bashkit.sh"

require_arg "$1" "filename"           # Exits if $1 is empty
require_envvar "API_KEY"              # Exits if $API_KEY is unset
requires_command "jq" "jq is needed"  # Exits if jq not found
confirm "Continue? [y/N]"             # Prompts, exits on non-y
```

### `osinformation.sh`

Platform detection.

```bash
source "$DOTFILE_ROOT/lib/osinformation.sh"

echo "$MACHINE_OS"          # "darwin" or "linux"
echo "$MACHINE_PROCESSOR"   # "m1", "x86_64", etc.
```

### `absolutepath.sh`

```bash
source "$DOTFILE_ROOT/lib/absolutepath.sh"

absolute_path "../relative/path"   # /full/resolved/path
```

### `case.sh`

```bash
source "$DOTFILE_ROOT/lib/case.sh"

tolowercase "HELLO"   # hello
```

---

## The `dotfiles` Command

The `dotfiles__aliases.zsh` module provides a smart wrapper around [comtrya](https://github.com/comtrya/comtrya).

### Usage

```zsh
# Interactive fzf selector (TAB=multi-select, ENTER=confirm, ESC=apply all)
dotfiles

# Apply specific manifest(s)
dotfiles shells
dotfiles shells,git,vim

# Tab completion works!
dotfiles sh<TAB>   # → shells, shells.zsh, etc.
```

### How It Works

1. **Root Detection** (`_dotfiles_repo_root`)
   - Uses `$DOTFILE_REPO_ROOT` if set
   - Falls back to `git rev-parse --show-toplevel` from `$DOTFILE_ROOT`

2. **Manifest Discovery** (`_dotfiles_manifest_list`)
   - Finds all `.yml`/`.yaml` files in repo
   - Excludes `.git/`, `node_modules/`, `files/`, `ai/`, `.old_*/`
   - Transforms paths to dot-notation: `shells/zsh.yml` → `shells.zsh`

3. **Completion** (`_dotfiles_completion`)
   - Supports multiple completion systems (compdef, _comps, zicompdef, zpcompdef)
   - Handles comma-separated multi-manifest input

---

## Extending the Configuration

### Adding a New Module

1. Create `modules/<domain>__<phase>.zsh`:

```zsh
# modules/myapp__config.zsh
if command -v myapp &>/dev/null; then
  eval "$(myapp init zsh)"
  alias ma='myapp'
fi
```

2. Register in `zinit.zsh` under the appropriate phase function:

```zsh
zinit_load_interactive_modules() {
  # ... existing modules ...
  zinit_load_local_module "myapp__config.zsh"
}
```

### Adding a Platform-Specific Module

Use conditional loading for OS-specific config:

```zsh
# In zinit.zsh
zinit_load_interactive_modules() {
  zinit_load_local_module "keybindings__config.zsh"
  [[ "$OSTYPE" == linux* ]] && zinit_load_local_module "keybindings__config-linux.zsh"
  [[ "$OSTYPE" == darwin* ]] && zinit_load_local_module "keybindings__config-darwin.zsh"
}
```

### Adding a New Zinit Plugin

```zsh
# In zinit.zsh, after bootstrap

# Simple light load
zinit light author/plugin

# With ice modifiers (download binary from GitHub releases)
zi ice from"gh-r" as"program"
zi light author/cli-tool

# With compile-time setup
zinit ice as"command" from"gh-r" \
    atclone"./tool init zsh > init.zsh" \
    atpull"%atclone" src"init.zsh"
zinit light author/tool
```

### Adding Helper Functions

Create or extend files in `lib/`:

```bash
# lib/myhelpers.sh
my_function() {
  local arg="$1"
  # ...
}
```

Source in modules:

```zsh
source "$DOTFILE_ROOT/lib/myhelpers.sh"
```

---

## Environment Variables

| Variable | Set In | Purpose |
|----------|--------|---------|
| `DOTFILE_ROOT` | `.zshenv` | Path to `shells/files/zsh/` |
| `DOTFILE_REPO_ROOT` | `.zshenv` | Git root of dotfiles repo |
| `HEREDIR` | `.zshenv` | Alias for config directory |
| `MACHINE_OS` | `osinformation.sh` | `darwin` or `linux` |
| `MACHINE_PROCESSOR` | `osinformation.sh` | CPU architecture |
| `MISE_ACTIVATED` | `mise__env.zsh` | Marker that mise is active |

---

## Troubleshooting

### Zinit Not Loading

```zsh
# Check zinit location
ls -la "${XDG_DATA_HOME:-$HOME/.local/share}/zinit/zinit.git"

# Re-clone if corrupt
rm -rf "${XDG_DATA_HOME:-$HOME/.local/share}/zinit"
source ~/.zshenv
```

### Completions Not Working

```zsh
# Rebuild completion cache
rm -f ~/.zcompdump
autoload -Uz compinit && compinit
```

### Module Not Loading

```zsh
# Debug: check if file exists
ls -la "$DOTFILE_ROOT/modules/mymodule__config.zsh"

# Debug: manually source
source "$DOTFILE_ROOT/modules/mymodule__config.zsh"
```

---

## File Structure

```
shells/files/zsh/
├── .zshenv              # Entry point (env vars, PATH)
├── .zprofile            # Login shell setup
├── .zcompdump           # Completion cache (generated)
├── zinit.zsh            # Plugin manager + phase loaders
├── README.md            # This file
├── lib/                 # Portable shell helpers
│   ├── absolutepath.sh
│   ├── bashkit.sh
│   ├── case.sh
│   ├── logging.sh
│   └── osinformation.sh
└── modules/             # Domain-specific configs
    ├── *__env.zsh       # Environment phase
    ├── *__profile.zsh   # Login phase
    ├── *__config.zsh    # Interactive phase
    └── *__aliases.zsh   # Commands & aliases
```
