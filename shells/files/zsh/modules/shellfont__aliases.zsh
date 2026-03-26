helper_repo_root() {
  if typeset -f _dotfiles_repo_root >/dev/null 2>&1; then
    _dotfiles_repo_root 2>/dev/null && return 0
  fi

  if [[ -n "${DOTFILE_REPO_ROOT:-}" && -d "${DOTFILE_REPO_ROOT}" ]]; then
    print -r -- "${DOTFILE_REPO_ROOT}"
    return 0
  fi

  if [[ -n "${DOTFILE_ROOT:-}" && -d "${DOTFILE_ROOT}" ]]; then
    git -C "${DOTFILE_ROOT}" rev-parse --show-toplevel 2>/dev/null && return 0
  fi
  if typeset -f get_gitrepo_root >/dev/null 2>&1; then
    get_gitrepo_root 2>/dev/null && return 0
  fi
  git rev-parse --show-toplevel 2>/dev/null
}

helper_font_list() {
  requires_command fc-list "fontconfig (fc-list)"

  fc-list : family \
    | tr ',' '\n' \
    | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' \
    | awk 'NF' \
    | sort -u
}

helper_font_preview_cmd() {
  cat <<'EOF'
font="{}"
sample='ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !@#$%^&*() []{}'
pangram='The quick brown fox jumps over the lazy dog.'
tmp="$(mktemp --suffix=.png 2>/dev/null || mktemp /tmp/shellfont-preview.XXXXXX.png)"

if ! pango-view --no-display --font="$font 18" --margin=20 --background='#1e1e2e' --foreground='#cdd6f4' \
  --text="$sample\n$pangram" --output="$tmp" >/dev/null 2>&1; then
  printf 'Font: %s\n\n' "$font"
  printf '%s\n%s\n' "$sample" "$pangram"
  rm -f "$tmp"
  exit 0
fi

if [[ -n "${KITTY_WINDOW_ID:-}" ]] && command -v kitten >/dev/null 2>&1; then
  kitten icat --clear >/dev/null 2>&1
  if command -v timeout >/dev/null 2>&1; then
    timeout 1s kitten icat --stdin=no "$tmp" 2>/dev/null && exit 0
  else
    kitten icat --stdin=no "$tmp" 2>/dev/null && exit 0
  fi
fi

if command -v chafa >/dev/null 2>&1; then
  cols="${FZF_PREVIEW_COLUMNS:-80}"
  rows="${FZF_PREVIEW_LINES:-24}"

  chafa -f kitty --passthrough=none --size "${cols}x${rows}" "$tmp" 2>/dev/null && exit 0
  chafa -f sixels --size "${cols}x${rows}" "$tmp" 2>/dev/null && exit 0
  chafa -f symbols -c full --symbols block+border+stipple --size "${cols}x${rows}" "$tmp" 2>/dev/null && exit 0
fi
printf 'Font: %s\n\n' "$font"
printf '%s\n%s\n' "$sample" "$pangram"
printf '\n(no compatible preview backend; need kitty graphics or sixel support)\n'

rm -f "$tmp"
EOF
}

helper_shellpicker() {
  local query="${1:-}"
  local preview_cmd
  local -a picker_args

  requires_command fzf "fzf"
  preview_cmd="$(helper_font_preview_cmd)"

  picker_args=(
    --height=90%
    --layout=reverse
    --border
    --preview-window='right:60%:wrap'
    --preview "$preview_cmd"
    --header='Select font (ENTER=apply, ESC=cancel)'
  )

  [[ -n "$query" ]] && picker_args+=(--query "$query")

  helper_font_list | fzf "${picker_args[@]}"
}

helper_handler_list() {
  local fn
  for fn in ${(k)functions}; do
    [[ "$fn" == handler_* ]] && print -r -- "${fn#handler_}"
  done | sort -u
}

helper_config_path() {
  local rel_path="$1"
  local repo_root

  repo_root="$(helper_repo_root)"
  [[ -z "$repo_root" ]] && return 1

  print -r -- "$repo_root/$rel_path"
}

helper_current_ghostty_font() {
  local config_file
  config_file="$(helper_config_path "shells/files/ghostty/config")" || return 1
  [[ -f "$config_file" ]] || return 0

  sed -nE 's/^[[:space:]]*font-family[[:space:]]*=[[:space:]]*"?([^"]+)"?[[:space:]]*$/\1/p' "$config_file" | head -n1
}

helper_current_alacritty_font() {
  local config_file
  config_file="$(helper_config_path "shells/files/alacritty/alacritty.toml")" || return 1
  [[ -f "$config_file" ]] || return 0

  awk '
    BEGIN { in_font_normal = 0 }
    /^\[font\.normal\]/ { in_font_normal = 1; next }
    /^\[/ { in_font_normal = 0 }
    in_font_normal && /^[[:space:]]*family[[:space:]]*=/ {
      gsub(/^[[:space:]]*family[[:space:]]*=[[:space:]]*"/, "")
      gsub(/"[[:space:]]*$/, "")
      print
      exit
    }
  ' "$config_file"
}

handler_ghostty() {
  local font="$1"
  local config_file

  [[ -z "$font" ]] && {
    echo "shellfont: missing font for ghostty" >&2
    return 1
  }

  config_file="$(helper_config_path "shells/files/ghostty/config")" || {
    echo "shellfont: could not resolve repository root" >&2
    return 1
  }

  [[ -f "$config_file" ]] || {
    echo "shellfont: missing Ghostty config at $config_file" >&2
    return 1
  }

  if grep -Eq '^[[:space:]]*font-family[[:space:]]*=' "$config_file"; then
    sed -i -E "s#^[[:space:]]*font-family[[:space:]]*=.*#font-family = \"$font\"#" "$config_file"
  else
    printf '\nfont-family = "%s"\n' "$font" >> "$config_file"
  fi

  echo "shellfont: ghostty font-family -> $font"
}

handler_alacritty() {
  local font="$1"
  local config_file
  local tmp

  [[ -z "$font" ]] && {
    echo "shellfont: missing font for alacritty" >&2
    return 1
  }

  config_file="$(helper_config_path "shells/files/alacritty/alacritty.toml")" || {
    echo "shellfont: could not resolve repository root" >&2
    return 1
  }

  [[ -f "$config_file" ]] || {
    echo "shellfont: missing Alacritty config at $config_file" >&2
    return 1
  }

  tmp="$(mktemp)"
  awk -v font="$font" '
    BEGIN { in_font_section = 0 }
    /^\[font(\.(normal|bold|italic|bold_italic))?\]/ { in_font_section = 1; print; next }
    /^\[/ { in_font_section = 0 }
    in_font_section && /^[[:space:]]*family[[:space:]]*=/ {
      print "family = \"" font "\""
      next
    }
    { print }
  ' "$config_file" > "$tmp" && mv "$tmp" "$config_file"

  echo "shellfont: alacritty font family -> $font"
}

cmd_shellfont() {
  local shell_name="${1:-}"
  local filter="${2:-}"
  local selected_shell handler_fn selected_font current_font

  requires_command fzf "fzf"

  if [[ -z "$shell_name" ]]; then
    selected_shell="$(helper_handler_list | fzf --height=40% --layout=reverse --border --prompt='terminal> ' --header='Select terminal handler')"
    [[ -z "$selected_shell" ]] && return 0
    shell_name="$selected_shell"
  fi

  handler_fn="handler_${shell_name}"
  if ! typeset -f "$handler_fn" >/dev/null 2>&1; then
    echo "shellfont: unknown shell handler '$shell_name'" >&2
    echo "available handlers: $(helper_handler_list | tr '\n' ' ' | sed 's/[[:space:]]\+$//')" >&2
    return 1
  fi

  case "$shell_name" in
    ghostty) current_font="$(helper_current_ghostty_font)" ;;
    alacritty) current_font="$(helper_current_alacritty_font)" ;;
    *) current_font="" ;;
  esac

  selected_font="$(helper_shellpicker "${filter:-$current_font}")"
  [[ -z "$selected_font" ]] && return 0

  "$handler_fn" "$selected_font"
}

shellfont() {
  cmd_shellfont "$@"
}
