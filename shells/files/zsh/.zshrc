#!/usr/bin/env zsh

# shellcheck disable=SC1091
. "${DOTFILE_ROOT}/lib/bashkit.sh"
. "${DOTFILE_ROOT}/lib/case.sh"
. "${DOTFILE_ROOT}/lib/osinformation.sh"
. "${DOTFILE_ROOT}/lib/absolutepath.sh"

source "${DOTFILE_ROOT}/zinit.zsh"
zinit_load_profile_modules
zinit_load_interactive_modules

function print_pokemon() {
	local character
	local forms
	local has_forms

	character=$(pokemon-go-colorscripts --list | shuf -n 1)
	forms=$(pokemon-go-colorscripts --name "$character" --form USE_INCORRECT_FORM_NAME_TO_LIST_AVAILABLE_FORMS | tail -n +2)
	has_forms=$(($(echo "$forms" | wc -l) > 0))
	form=$(echo "$forms" | shuf -n 1)

	if [[ $has_forms -eq 1 ]]; then
		pokemon-go-colorscripts --name "$character" --form "$form"
	else
		pokemon-go-colorscripts --name "$character"
	fi
}

if [[ -t 1 ]]; then
	print_pokemon | tail -n +2
fi
