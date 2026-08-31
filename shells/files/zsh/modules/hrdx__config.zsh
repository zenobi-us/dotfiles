# hrdx enables enhanced keyboard protocols for its own UI.
# Some TUI tools, including fzf, can receive release-event sequences such as
# CSI 1;129B and insert the printable tail into the query.
# Temporarily reset those protocols while fzf owns the terminal.
if [[ -n "${HRDX:-}" ]]; then
  fzf() {
    emulate -L zsh
    printf '\e[>4;0m\e[=0u'
    command fzf "$@"
    local status=$?
    printf '\e[>4;2m'
    return $status
  }
fi
