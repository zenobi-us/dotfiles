
# Use emacs keybindings even if our EDITOR is set to vi
# bindkey -e /
# bindkey "^[[1;5C" forward-word
# bindkey "^[[1;5D" backward-word

r-delregion() {
  if ((REGION_ACTIVE)) then
     zle kill-region
  else
    local widget_name=$1
    shift
    zle $widget_name -- $@
  fi
}

r-deselect() {
  ((REGION_ACTIVE = 0))
  local widget_name=$1
  shift
  zle $widget_name -- $@
}

r-select() {
  ((REGION_ACTIVE)) || zle set-mark-command
  local widget_name=$1
  shift
  zle $widget_name -- $@
}

for key     kcap   seq        mode   widget (
    # shift left,right,up,down right select text
    sleft   kLFT   $'\e[1;2D' select   backward-char
    sright  kRIT   $'\e[1;2C' select   forward-char
    sup     kri    $'\e[1;2A' select   up-line-or-history
    sdown   kind   $'\e[1;2B' select   down-line-or-history

    # shift end,home select to end or start of line
    send    kEND   $'\E[1;2F' select   end-of-line
    send2   x      $'\E[4;2~' select   end-of-line
    shome   kHOM   $'\E[1;2H' select   beginning-of-line
    shome2  x      $'\E[1;2~' select   beginning-of-line

    # left, right, end, home deselect text, but not remove selection
    left    kcub1  $'\EOD'    deselect backward-char
    right   kcuf1  $'\EOC'    deselect forward-char
    end     kend   $'\EOF'    deselect end-of-line
    end2    x      $'\E4~'    deselect end-of-line
    home    khome  $'\EOH'    deselect beginning-of-line
    home2   x      $'\E1~'    deselect beginning-of-line

    # ctrl+shift and left,right,up,down move cursor, whole words while
    # selecting text
    csleft  x      $'\E[1;6D' select   backward-word
    csright x      $'\E[1;6C' select   forward-word
    csend   x      $'\E[1;6F' select   end-of-line
    cshome  x      $'\E[1;6H' select   beginning-of-line

    # ctrl+left,right,up,down move cursor, whole words
    # if there is text selected it will deselect it
    cleft   x      $'\E[1;5D' deselect backward-word
    cright  x      $'\E[1;5C' deselect forward-word

    # del or backspace delete selected text
    del     kdch1   $'\E[3~'  delregion delete-char
    bs      x       $'^?'     delregion backward-delete-char

  ) {

  eval "key-$key() {
    r-$mode $widget \$@
  }"

  zle -N key-$key
  bindkey ${terminfo[$kcap]-$seq} key-$key
}
