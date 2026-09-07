#!/usr/bin/env zsh
pokemon_config_path="${(%):-%N}"
pokemon_root="${DOTFILE_ROOT:-${pokemon_config_path:A:h:h}}"

. "${pokemon_root}/lib/bashkit.sh"
. "${pokemon_root}/modules/pokemon__aliases.zsh"

if [[ "${pokemon_config_path:A}" == "${0:A}" ]]; then
  get_pokemon "$1" | tail -n +2
else
  print_pokemon "$1"
fi
