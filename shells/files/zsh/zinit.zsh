#!/usr/bin/env zsh

ZINIT_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}/zinit/zinit.git"
[ ! -d $ZINIT_HOME ] && mkdir -p "$(dirname $ZINIT_HOME)"
[ ! -d $ZINIT_HOME/.git ] && git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
source "${ZINIT_HOME}/zinit.zsh"

source "$HOME/.local/share/zinit/zinit.git/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit

# local module helper
zinit_load_local_module() {
  local module_path="$DOTFILE_ROOT/modules/$1"
  if [[ -f "$module_path" ]]; then
    zinit snippet "$module_path"
  fi
}

zi ice from"gh-r" as"program"
zi light junegunn/fzf

zinit_load_local_module "git__aliases.zsh"
zinit_load_local_module "granted__aliases.zsh"


zinit ice as"command" from"gh-r" \
        atclone"./starship init zsh > init.zsh; ./starship completions zsh > _starship" \
        atpull"%atclone" src"init.zsh"
zinit light starship/starship

zinit light Aloxaf/fzf-tab

# env phase (explicit order) - constrained to config.d/enabled
zinit_load_env_modules() {
  zinit_load_local_module "global__env.zsh"
  zinit_load_local_module "granted__env.zsh"
  zinit_load_local_module "cli-history__env.zsh"
  zinit_load_local_module "mise__env.zsh"
  [[ -n "$WSL_DISTRO_NAME" ]] && zinit_load_local_module "wsl__env.zsh"
}

# login/profile phase (explicit order) - constrained to config.d/enabled
zinit_load_profile_modules() {
  zinit_load_local_module "alacritty__profile.zsh"
  zinit_load_local_module "mise__profile.zsh"
}

# interactive phase (explicit order) - constrained to config.d/enabled
zinit_load_interactive_modules() {
  zinit_load_local_module "alacritty__config.zsh"

  if [[ -f "$DOTFILE_ROOT/modules/autocomplete__config.zsh" ]]; then
    source "$DOTFILE_ROOT/modules/autocomplete__config.zsh"
  fi

  zinit_load_local_module "keybindings__config.zsh"
  [[ "$OSTYPE" == linux* ]] && zinit_load_local_module "keybindings__config-linux.zsh"
  zinit_load_local_module "mcfly__config.zsh"
  zinit_load_local_module "mise__config.zsh"

  if [[ -f "$DOTFILE_ROOT/modules/dotfiles__aliases.zsh" ]]; then
    source "$DOTFILE_ROOT/modules/dotfiles__aliases.zsh"
  fi

  # zinit_load_local_module "pass__config.zsh"
  # zinit_load_local_module "pinentry__config.zsh"
}
