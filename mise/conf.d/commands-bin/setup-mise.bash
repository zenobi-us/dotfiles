#!/bin/bash

get_mise() {
	echo "==> 💁 Installing mise"

	curl https://mise.run | sh
}

add_to_shell() {
	local shell
	local line

	# if mise is already activated dont do anything
	mise doctor | grep "activated: yes" && return 0

	shell=$(basename "$SHELL")
	shell_rc="/$HOME/.${shell}rc"
	line="eval \"\$(/$HOME/.local/bin/mise activate ${shell})\""

	# if the file doesn't exist create it
	if [ ! -f "${shell_rc}" ]; then
		echo "==> 💁 Creating ${shell_rc}"
		touch "${shell_rc}"
	fi

	# if the line doesn't exist add it
	if ! grep -q "$line" "${shell_rc}"; then
		echo "==> 💁 Adding mise to shell"
		echo " " >>"${shell_rc}"
		echo "$line" >>"${shell_rc}"
	fi
}

install_tooling() {
	echo "==> 💁 Installing tooling"

	mise install
}

{
	get_mise
	add_to_shell
	install_tooling
}

