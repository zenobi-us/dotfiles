alias zellij='zellij options --theme-dir ~/.config/zellij/themes/'

zellij-attach() {
	local session

	if ! command -v zellij >/dev/null 2>&1; then
		print -u2 "zellij-attach: zellij not found"
		return 127
	fi

	if ! command -v fzf >/dev/null 2>&1; then
		print -u2 "zellij-attach: fzf not found"
		return 127
	fi

	session="$(command zellij list-sessions --short 2>/dev/null | fzf --prompt='zellij session> ' --height=40% --reverse)"
	[[ -z "$session" ]] && return 130

	command zellij attach "$session"
}

zellij-agent-threads-reload() {
	local plugin="file:${ZELLIJ_AGENT_THREADS_PLUGIN:-$HOME/.config/zellij/plugins/zellij-plugin-agent-threads.wasm}"

	if ! command -v zellij >/dev/null 2>&1; then
		print -u2 "zellij-agent-threads-reload: zellij not found"
		return 127
	fi

	command zellij action start-or-reload-plugin "$plugin"
}

alias zat-reload='zellij-agent-threads-reload'
