#!/bin/bash
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
SESSION_ID=$(echo "$input" | jq -r '.session_id')
COLUMNS="${COLUMNS:-80}"

SHARED_CONTEXT_CLI="$HOME/Projects/dotfiles/files/devtools/zot/extensions/agent-core/cli.ts"
SHARED_CONTEXT_CACHE="/tmp/statusline-shared-context-$SESSION_ID"
SHARED_CONTEXT_CACHE_MAX_AGE=15 # seconds

shared_context_cache_is_stale() {
    [ ! -f "$SHARED_CONTEXT_CACHE" ] || \
    [ $(($(date +%s) - $(stat -c %Y "$SHARED_CONTEXT_CACHE" 2>/dev/null || stat -f %m "$SHARED_CONTEXT_CACHE" 2>/dev/null || echo 0))) -gt $SHARED_CONTEXT_CACHE_MAX_AGE ]
}

SHARED=""
if [ -f "$SHARED_CONTEXT_CLI" ]; then
    if shared_context_cache_is_stale; then
        REPORT=$(cd "$DIR" && bun run "$SHARED_CONTEXT_CLI" context report --json 2>/dev/null)
        echo "$REPORT" > "$SHARED_CONTEXT_CACHE"
    else
        REPORT=$(cat "$SHARED_CONTEXT_CACHE")
    fi

    STORAGE=$(echo "$REPORT" | jq -r '.storage // empty' 2>/dev/null)
    ROOT=$(echo "$REPORT" | jq -r '.root // empty' 2>/dev/null)
    if [ -n "$STORAGE" ]; then
        LABEL="repo"
        [ "$STORAGE" = "shared" ] && LABEL="shared"
        SHARED="🔗 $LABEL [$ROOT]"
    fi
fi

GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; CYAN='\033[36m'; RESET='\033[0m'

if [ "$PCT" -ge 90 ]; then BAR_COLOR="$RED"
elif [ "$PCT" -ge 70 ]; then BAR_COLOR="$YELLOW"
else BAR_COLOR="$GREEN"; fi

BAR_WIDTH=10
FILLED=$((PCT * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))
BAR=""
[ "$FILLED" -gt 0 ] && printf -v FILL "%${FILLED}s" && BAR="${FILL// /█}"
[ "$EMPTY" -gt 0 ] && printf -v PAD "%${EMPTY}s" && BAR="${BAR}${PAD// /░}"

BRANCH=""
git -C "$DIR" rev-parse --git-dir > /dev/null 2>&1 && BRANCH="🌿 $(git -C "$DIR" branch --show-current 2>/dev/null)"

# Claude Code captures stdout instead of connecting it to a terminal, so tput/stty
# can't read the real size from here. It sets COLUMNS/LINES itself before running
# this script, so measure the plain (no ANSI codes) line length against that.
LINE1_PLAIN="[$MODEL] 📁 ${DIR##*/}"
[ -n "$BRANCH" ] && LINE1_PLAIN="$LINE1_PLAIN | $BRANCH"
[ -n "$SHARED" ] && LINE1_PLAIN="$LINE1_PLAIN | $SHARED"
LINE1_PLAIN="$LINE1_PLAIN | $BAR $PCT%"

# Bash's ${#string} counts one codepoint per emoji, but each renders as two
# terminal columns. Correct for the emoji this script actually prints (📁
# always, 🌿/🔗 when present) so the width check matches what's on screen.
EMOJI_WIDTH_CORRECTION=1
[ -n "$BRANCH" ] && EMOJI_WIDTH_CORRECTION=$((EMOJI_WIDTH_CORRECTION + 1))
[ -n "$SHARED" ] && EMOJI_WIDTH_CORRECTION=$((EMOJI_WIDTH_CORRECTION + 1))
LINE1_WIDTH=$((${#LINE1_PLAIN} + EMOJI_WIDTH_CORRECTION))

if [ -n "$SHARED" ] && [ "$LINE1_WIDTH" -gt "$COLUMNS" ]; then
    printf "${CYAN}[%s]${RESET} 📁 %s%s | ${BAR_COLOR}%s${RESET} %s%%\n" "$MODEL" "${DIR##*/}" "${BRANCH:+ | $BRANCH}" "$BAR" "$PCT"
    printf "  %s\n" "$SHARED"
else
    printf "${CYAN}[%s]${RESET} 📁 %s%s%s | ${BAR_COLOR}%s${RESET} %s%%\n" "$MODEL" "${DIR##*/}" "${BRANCH:+ | $BRANCH}" "${SHARED:+ | $SHARED}" "$BAR" "$PCT"
fi
