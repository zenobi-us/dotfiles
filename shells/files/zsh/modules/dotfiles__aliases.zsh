_dotfiles_repo_root() {
	if [[ -n "${DOTFILE_REPO_ROOT:-}" && -d "${DOTFILE_REPO_ROOT}" ]]; then
		print -r -- "${DOTFILE_REPO_ROOT}"
		return 0
	fi

	git rev-parse --show-toplevel 2>/dev/null
}

_dotfiles_bootstrap_parts() {
	print -l plugins packages repos dotfiles mise-shell-activate macos-defaults macos-launchd-agents linux-systemd-units user tools task final-hook
}

dotfiles() {
	local repo_root

	repo_root="$(_dotfiles_repo_root)"
	if [[ -z "$repo_root" ]]; then
		echo "dotfiles: could not determine dotfiles repository root" >&2
		return 1
	fi

	command mise -C "$repo_root" bootstrap --yes "$@"
}

_dotfiles_completion() {
	local -a parts
	parts=(${(@f)$(_dotfiles_bootstrap_parts)})

	_describe -t mise-bootstrap-parts 'mise bootstrap part' parts
}

if ((${+functions[compdef]})); then
	compdef _dotfiles_completion dotfiles
elif ((${+_comps})); then
	_comps[dotfiles]=_dotfiles_completion
elif ((${+functions[zicompdef]})); then
	zicompdef _dotfiles_completion dotfiles
elif ((${+functions[zpcompdef]})); then
	zpcompdef _dotfiles_completion dotfiles
fi
