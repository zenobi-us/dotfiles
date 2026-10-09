# Claude Code's bundled sharp/libvips cannot decode the BI_BITFIELDS BMP
# that WSLg mirrors from a Windows clipboard image (sharp: "Input file
# contains unsupported image format"). ImageMagick decodes it fine, so
# convert it ourselves and hand Claude Code a file path instead.
function clipimg () {
    local bmp png
    bmp="$(mktemp --suffix=.bmp)"
    png="$(mktemp --suffix=.png)"

    if ! wl-paste --type image/bmp > "$bmp" 2>/dev/null; then
        rm -f "$bmp" "$png"
        echo "clipimg: no image on the clipboard" >&2
        return 1
    fi

    if ! convert "$bmp" "$png" 2>/dev/null; then
        rm -f "$bmp" "$png"
        echo "clipimg: convert failed to decode the clipboard image" >&2
        return 1
    fi

    rm -f "$bmp"
    wl-copy --type text/plain "$png"
    echo "$png"
}
