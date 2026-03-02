_dotfiles_repo_root() {
  if [[ -n "${DOTFILE_REPO_ROOT:-}" && -d "${DOTFILE_REPO_ROOT}" ]]; then
    print -r -- "${DOTFILE_REPO_ROOT}"
    return 0
  fi

  if [[ -n "${DOTFILE_ROOT:-}" && -d "${DOTFILE_ROOT}" ]]; then
    local repo_from_dotfile_root
    repo_from_dotfile_root="$(git -C "${DOTFILE_ROOT}" rev-parse --show-toplevel 2>/dev/null)"
    if [[ -n "$repo_from_dotfile_root" ]]; then
      print -r -- "$repo_from_dotfile_root"
      return 0
    fi
  fi

  git rev-parse --show-toplevel 2>/dev/null
}

_dotfiles_manifest_list() {
  local repo_root
  repo_root="$(_dotfiles_repo_root)" || return 1
  [[ -z "$repo_root" ]] && return 1

  find "$repo_root" \
    -type f \( -name '*.yml' -o -name '*.yaml' \) \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/files/*' \
    -not -path "$repo_root/ai/*" \
    -not -path '*/.old_*/*' \
    | sed -E "s#^${repo_root}/##; s#\.(yml|yaml)\$##; s#/#.#g" \
    | sort -u
}

_dotfiles_normalize_manifests() {
  local arg manifest
  local -a manifests=()

  for arg in "$@"; do
    for manifest in ${(s:,:)arg}; do
      [[ -n "$manifest" ]] && manifests+=("$manifest")
    done
  done

  print -r -- "${(j:,:)manifests}"
}

dotfiles() {
  local repo_root manifests selected

  repo_root="$(_dotfiles_repo_root)"
  if [[ -z "$repo_root" ]]; then
    echo "dotfiles: could not determine dotfiles repository root" >&2
    return 1
  fi

  if (( $# == 0 )); then
    # Interactive fzf selection; empty selection means "apply all"
    selected=$(_dotfiles_manifest_list | fzf --multi --preview-window=hidden \
      --header="Select manifests (TAB=multi, ENTER=confirm, ESC=all)" \
      --bind="esc:abort" \
      | tr '\n' ',' | sed 's/,$//')

    if [[ -z "$selected" ]]; then
      echo "dotfiles: applying all manifests..."
      command comtrya -d "$repo_root" apply
      return $?
    fi

    manifests="$selected"
  else
    manifests="$(_dotfiles_normalize_manifests "$@")"
    if [[ -z "$manifests" ]]; then
      echo "dotfiles: no manifests provided" >&2
      return 1
    fi
  fi

  command comtrya -d "$repo_root" apply -m "$manifests"
}

_dotfiles_completion() {
  local -a manifests
  manifests=("${(@f)$(_dotfiles_manifest_list)}")

  compset -P '*,'
  _describe -t comtrya-manifests 'comtrya manifest' manifests
}

if (( ${+functions[compdef]} )); then
  compdef _dotfiles_completion dotfiles
elif (( ${+_comps} )); then
  _comps[dotfiles]=_dotfiles_completion
elif (( ${+functions[zicompdef]} )); then
  zicompdef _dotfiles_completion dotfiles
elif (( ${+functions[zpcompdef]} )); then
  zpcompdef _dotfiles_completion dotfiles
fi
