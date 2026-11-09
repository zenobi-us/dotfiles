#!/bin/sh
set -eu
fail() { printf 'STOP=%s\n' "$*" >&2; exit 41; }
model=$(tr -d '\000\n' < /sys/firmware/devicetree/base/model)
printf 'MODEL=%s\n' "$model"
case "$model" in 'reMarkable Ferrari'|'reMarkable Paper Pro') ;; *) fail 'unsupported model';; esac
arch=$(uname -m); printf 'ARCH=%s\n' "$arch"
[ "$arch" = aarch64 ] || fail 'unsupported architecture'
img=
while IFS= read -r line; do
 case "$line" in
 IMG_VERSION=*) printf '%s\n' "$line"; img=${line#IMG_VERSION=}; img=${img#\"}; img=${img%\"};;
 VERSION_ID=*) printf '%s\n' "$line";;
 esac
done < /etc/os-release
[ "$img" = 3.28.0.172 ] || fail 'unsupported IMG_VERSION'
for path in /home /home/root /home/root/.local /home/root/.local/share /home/root/xovi /home/root/xovi/extensions.d /home/root/xovi/exthome /home/root/xovi/exthome/appload /home/root/xovi/exthome/qt-resource-rebuilder; do
 if [ -L "$path" ]; then stat -c 'PARENT|%n|%F|%u|%g|%a' "$path"; readlink "$path"; fail 'symlink parent';
 elif [ -e "$path" ]; then stat -c 'PARENT|%n|%F|%u|%g|%a' "$path"; [ -d "$path" ] || fail 'non-directory parent';
 else printf 'ABSENT_PARENT|%s\n' "$path"; fi
done
for pair in \
'/usr/bin/xochitl:b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021' \
'/home/root/xovi/xovi.so:d4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446' \
'/home/root/xovi/extensions.d/appload.so:5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad' \
'/home/root/xovi/extensions.d/qt-resource-rebuilder.so:6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f'; do
 path=${pair%:*}; expected=${pair##*:}
 [ -f "$path" ] && [ ! -L "$path" ] || fail "missing/nonregular/symlink binary: $path"
 stat -c 'BINARY|%n|%F|%u|%g|%a|%s' "$path"
 actual=$(sha256sum "$path"); printf '%s\n' "$actual"
 [ "${actual%% *}" = "$expected" ] || fail "hash mismatch: $path"
done
for path in /home/root/.local/share/pi-ink-bridge /home/root/xovi/exthome/appload/pi-annotations /home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd; do
 if [ -e "$path" ] || [ -L "$path" ]; then
 stat -c 'TARGET|%n|%F|%u|%g|%a' "$path"
 if [ -L "$path" ]; then printf 'LINK|%s|' "$path"; readlink "$path"; fi
 else printf 'ABSENT_TARGET|%s\n' "$path"; fi
done
for path in /home/root /home/root/.local/share /home/root/xovi/exthome/appload /home/root/xovi/exthome/qt-resource-rebuilder; do
 if [ -d "$path" ] && [ -w "$path" ]; then printf 'WRITABLE_DIRECTORY|%s\n' "$path"; else fail "required writable directory unavailable: $path"; fi
done


for path in / /home /home/root /home/root/.local /home/root/.local/share /home/root/xovi /home/root/xovi/extensions.d /home/root/xovi/exthome /home/root/xovi/exthome/appload /home/root/xovi/exthome/qt-resource-rebuilder; do
 [ -d "$path" ] && [ ! -L "$path" ] || fail "unsafe boundary: $path"
 [ "$(stat -c %u "$path")" = 0 ] || fail "nonroot boundary: $path"
 if [ "$path" != / ]; then
  mode=$(stat -c %a "$path"); case "$mode" in 700|755) ;; *) fail "unsafe boundary mode: $path";; esac
 fi
done
for path in /home/root/.local/share/pi-ink-bridge /home/root/xovi/exthome/appload/pi-annotations /home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd; do
 [ ! -e "$path" ] && [ ! -L "$path" ] || fail "occupied target: $path"
done
for tool in id uname tr sha256sum unzip mktemp rm chmod curl stat readlink; do command -v "$tool" >/dev/null || fail "missing dependency: $tool"; done
printf 'X_PID|'; pidof xochitl

[ -f /usr/bin/xochitl ] && [ ! -L /usr/bin/xochitl ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /usr/bin/xochitl
sha256sum /usr/bin/xochitl

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/hashtab ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/hashtab ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/hashtab
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/hashtab

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd

[ -f /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd ] || fail "retained type drift"
stat -c "RETAINED|%n|%F|%u|%a|%s" /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd
sha256sum /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd

for path in /home/root/xovi/exthome/qt-resource-rebuilder/*.qmd; do
 [ -e "$path" ] || [ -L "$path" ] || continue
 printf 'QMD_NAME|%s\n' "$path"
done
printf 'PREFLIGHT_COMPLETE\n'
