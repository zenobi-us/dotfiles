# Clipboard helpers shared by local shells.

# Save the current clipboard image to a temporary PNG file.
# The path is printed and copied as text, so TUI tools can receive it by paste.
function clipimg() {
  emulate -L zsh

  if ! command -v wl-paste >/dev/null 2>&1; then
    print -u2 "clipimg: wl-paste not found"
    return 1
  fi

  local types source_type src png converter
  types="$(wl-paste --list-types 2>/dev/null || true)"

  for source_type in image/png image/jpeg image/webp image/gif image/bmp; do
    if print -r -- "$types" | grep -qx -- "$source_type"; then
      break
    fi
    source_type=""
  done

  if [[ -z "$source_type" ]]; then
    print -u2 "clipimg: no supported image on the clipboard"
    return 1
  fi

  png="$(mktemp --suffix=.png)"

  if [[ "$source_type" == "image/png" ]]; then
    if ! wl-paste --type "$source_type" > "$png" 2>/dev/null; then
      rm -f "$png"
      print -u2 "clipimg: failed to read clipboard image"
      return 1
    fi
  else
    src="$(mktemp --suffix=.clipimg)"
    if ! wl-paste --type "$source_type" > "$src" 2>/dev/null; then
      rm -f "$src" "$png"
      print -u2 "clipimg: failed to read clipboard image"
      return 1
    fi

    if command -v magick >/dev/null 2>&1; then
      converter="magick"
    elif command -v convert >/dev/null 2>&1; then
      converter="convert"
    else
      rm -f "$src" "$png"
      print -u2 "clipimg: ImageMagick not found"
      return 1
    fi

    if ! "$converter" "$src" "$png" 2>/dev/null; then
      rm -f "$src" "$png"
      print -u2 "clipimg: failed to convert clipboard image"
      return 1
    fi
    rm -f "$src"
  fi

  if command -v wl-copy >/dev/null 2>&1; then
    print -rn -- "$png" | wl-copy --type text/plain 2>/dev/null || true
  fi

  print -r -- "$png"
}
