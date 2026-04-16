#!/usr/bin/env zsh

function get_pokemon() {
	local mode
	local character
	local forms
	local has_forms
	local form

	character=${1:-$(pokemon-go-colorscripts --list | shuf -n 1)}
	forms=$(pokemon-go-colorscripts --name "$character" --form USE_INCORRECT_FORM_NAME_TO_LIST_AVAILABLE_FORMS | tail -n +2)
	has_forms=$(($(echo "$forms" | wc -l) > 0))
	form=$(echo "$forms" | shuf -n 1)

	if [[ $has_forms -eq 1 ]]; then
		pokemon-go-colorscripts --name "$character" --form "$form"
	else
		pokemon-go-colorscripts --name "$character"
	fi
}

function print_pokemon() {
	local pokemon
	local name

	name="$1"

	# use command_exists from lib/bashkit.sh
	# exit 0 if pokemon-go-colorscripts is not available
	if ! command_exists pokemon-go-colorscripts; then
		return 0
	fi

	# if not interactive, don't print anything
	if [[ ! -t 1 ]]; then
		return 0
	fi

	get_pokemon "$name" | tail -n +2
}
