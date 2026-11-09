set -eu
fail() { printf 'STOP=%s\n' "$*" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = 8e816d98-6bf4-4f9e-9abe-891fbf83d06f ] || fail boot
[ "$(tr -d '\000\n' < /sys/firmware/devicetree/base/model)" = 'reMarkable Ferrari' ] || fail model
[ "$(uname -m)" = aarch64 ] || fail architecture
. /etc/os-release
[ "$IMG_VERSION" = 3.28.0.172 ] || fail firmware
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /)" = 'DIR|/|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/|directory|0|0|755'
[ -d / ] && [ ! -L / ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home)" = 'DIR|/home|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home|directory|0|0|755'
[ -d /home ] && [ ! -L /home ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root)" = 'DIR|/home/root|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root|directory|0|0|700'
[ -d /home/root ] && [ ! -L /home/root ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local)" = 'DIR|/home/root/.local|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local|directory|0|0|755'
[ -d /home/root/.local ] && [ ! -L /home/root/.local ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share)" = 'DIR|/home/root/.local/share|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share|directory|0|0|755'
[ -d /home/root/.local/share ] && [ ! -L /home/root/.local/share ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/xovi)" = 'DIR|/home/root/xovi|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/xovi|directory|0|0|755'
[ -d /home/root/xovi ] && [ ! -L /home/root/xovi ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/xovi/extensions.d)" = 'DIR|/home/root/xovi/extensions.d|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/xovi/extensions.d|directory|0|0|755'
[ -d /home/root/xovi/extensions.d ] && [ ! -L /home/root/xovi/extensions.d ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/xovi/exthome)" = 'DIR|/home/root/xovi/exthome|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/xovi/exthome|directory|0|0|755'
[ -d /home/root/xovi/exthome ] && [ ! -L /home/root/xovi/exthome ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/xovi/exthome/appload)" = 'DIR|/home/root/xovi/exthome/appload|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/xovi/exthome/appload|directory|0|0|755'
[ -d /home/root/xovi/exthome/appload ] && [ ! -L /home/root/xovi/exthome/appload ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/xovi/exthome/qt-resource-rebuilder)" = 'DIR|/home/root/xovi/exthome/qt-resource-rebuilder|directory|0|0|755' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/xovi/exthome/qt-resource-rebuilder|directory|0|0|755'
[ -d /home/root/xovi/exthome/qt-resource-rebuilder ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share/pi-ink-bridge)" = 'DIR|/home/root/.local/share/pi-ink-bridge|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share/pi-ink-bridge|directory|0|0|700'
[ -d /home/root/.local/share/pi-ink-bridge ] && [ ! -L /home/root/.local/share/pi-ink-bridge ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share/pi-ink-bridge/releases)" = 'DIR|/home/root/.local/share/pi-ink-bridge/releases|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share/pi-ink-bridge/releases|directory|0|0|700'
[ -d /home/root/.local/share/pi-ink-bridge/releases ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629)" = 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629|directory|0|0|700'
[ -d /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629 ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629 ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app)" = 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app|directory|0|0|700'
[ -d /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app ] || fail parent_type
[ "$(stat -c 'DIR|%n|%F|%u|%g|%a' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend)" = 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend|directory|0|0|700' ] || fail metadata_DIR
printf '%s\n' 'DIR|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend|directory|0|0|700'
[ -d /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend ] || fail parent_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client|regular file|0|0|700|7405752' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client|regular file|0|0|700|7405752'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client ] || fail file_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION|regular file|0|0|600|6' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION|regular file|0|0|600|6'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION ] || fail file_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd|regular file|0|0|600|949' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd|regular file|0|0|600|949'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd ] || fail file_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json|regular file|0|0|600|213' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json|regular file|0|0|600|213'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json ] || fail file_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc|regular file|0|0|600|2796' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc|regular file|0|0|600|2796'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc ] || fail file_type
[ "$(stat -c 'OWNED|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry)" = 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry|regular file|0|0|700|194' ] || fail metadata_OWNED
printf '%s\n' 'OWNED|/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry|regular file|0|0|700|194'
[ -f /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry ] || fail file_type
[ "$(stat -c 'LINK_META|%n|%F|%u|%g|%a' /home/root/xovi/exthome/appload/pi-annotations)" = 'LINK_META|/home/root/xovi/exthome/appload/pi-annotations|symbolic link|0|0|777' ] || fail metadata_LINK_META
printf '%s\n' 'LINK_META|/home/root/xovi/exthome/appload/pi-annotations|symbolic link|0|0|777'
[ "$(stat -c 'LINK_META|%n|%F|%u|%g|%a' /home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd)" = 'LINK_META|/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd|symbolic link|0|0|777' ] || fail metadata_LINK_META
printf '%s\n' 'LINK_META|/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd|symbolic link|0|0|777'
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /usr/bin/xochitl)" = 'RETAINED|/usr/bin/xochitl|regular file|0|755|24705704' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/usr/bin/xochitl|regular file|0|755|24705704'
[ -f /usr/bin/xochitl ] && [ ! -L /usr/bin/xochitl ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/hashtab)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/hashtab|regular file|0|644|674428' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/hashtab|regular file|0|644|674428'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/hashtab ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/hashtab ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd|regular file|0|644|9249' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd|regular file|0|644|9249'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd|regular file|0|644|157221' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd|regular file|0|644|157221'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd|regular file|0|644|50534' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd|regular file|0|644|50534'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd|regular file|0|644|10239' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd|regular file|0|644|10239'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd|regular file|0|644|79350' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd|regular file|0|644|79350'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd|regular file|0|644|76274' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd|regular file|0|644|76274'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd|regular file|0|644|2230' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd|regular file|0|644|2230'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd|regular file|0|644|8298' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd|regular file|0|644|8298'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd|regular file|0|644|5853' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd|regular file|0|644|5853'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd|regular file|0|644|1077' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd|regular file|0|644|1077'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd|regular file|0|644|2751' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd|regular file|0|644|2751'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd ] || fail file_type
[ "$(stat -c 'RETAINED|%n|%F|%u|%a|%s' /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd)" = 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd|regular file|0|644|11832' ] || fail metadata_RETAINED
printf '%s\n' 'RETAINED|/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd|regular file|0|644|11832'
[ -f /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd ] && [ ! -L /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd ] || fail file_type
[ "$(stat -c 'NATIVE|%n|%F|%u|%g|%a|%s' /home/root/xovi/xovi.so)" = 'NATIVE|/home/root/xovi/xovi.so|regular file|0|0|644|103008' ] || fail metadata_NATIVE
printf '%s\n' 'NATIVE|/home/root/xovi/xovi.so|regular file|0|0|644|103008'
[ -f /home/root/xovi/xovi.so ] && [ ! -L /home/root/xovi/xovi.so ] || fail file_type
[ "$(stat -c 'NATIVE|%n|%F|%u|%g|%a|%s' /home/root/xovi/extensions.d/appload.so)" = 'NATIVE|/home/root/xovi/extensions.d/appload.so|regular file|0|0|644|4342120' ] || fail metadata_NATIVE
printf '%s\n' 'NATIVE|/home/root/xovi/extensions.d/appload.so|regular file|0|0|644|4342120'
[ -f /home/root/xovi/extensions.d/appload.so ] && [ ! -L /home/root/xovi/extensions.d/appload.so ] || fail file_type
[ "$(stat -c 'NATIVE|%n|%F|%u|%g|%a|%s' /home/root/xovi/extensions.d/qt-resource-rebuilder.so)" = 'NATIVE|/home/root/xovi/extensions.d/qt-resource-rebuilder.so|regular file|0|0|644|9496456' ] || fail metadata_NATIVE
printf '%s\n' 'NATIVE|/home/root/xovi/extensions.d/qt-resource-rebuilder.so|regular file|0|0|644|9496456'
[ -f /home/root/xovi/extensions.d/qt-resource-rebuilder.so ] && [ ! -L /home/root/xovi/extensions.d/qt-resource-rebuilder.so ] || fail file_type
[ "$(stat -c 'PRIVATE_META|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/config.json)" = 'PRIVATE_META|/home/root/.local/share/pi-ink-bridge/config.json|regular file|0|0|600|350' ] || fail metadata_PRIVATE_META
printf '%s\n' 'PRIVATE_META|/home/root/.local/share/pi-ink-bridge/config.json|regular file|0|0|600|350'
[ -f /home/root/.local/share/pi-ink-bridge/config.json ] && [ ! -L /home/root/.local/share/pi-ink-bridge/config.json ] || fail file_type
[ "$(stat -c 'PRIVATE_META|%n|%F|%u|%g|%a|%s' /home/root/.local/share/pi-ink-bridge/server-ca.pem)" = 'PRIVATE_META|/home/root/.local/share/pi-ink-bridge/server-ca.pem|regular file|0|0|600|717' ] || fail metadata_PRIVATE_META
printf '%s\n' 'PRIVATE_META|/home/root/.local/share/pi-ink-bridge/server-ca.pem|regular file|0|0|600|717'
[ -f /home/root/.local/share/pi-ink-bridge/server-ca.pem ] && [ ! -L /home/root/.local/share/pi-ink-bridge/server-ca.pem ] || fail file_type
printf '%s\n' 'c91ad5234805b443d381e123f3c533d23d2c5e9fc817b964e4d405b808232a2d  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client' | sha256sum -c -
printf '%s\n' '40b8eb4000a913a7791090535f291d3d369874162a89ef3c9e3d4e887a1b9e79  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION' | sha256sum -c -
printf '%s\n' '33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd' | sha256sum -c -
printf '%s\n' '265d2ea700c8b20a49d6e9f67489b9431adacbd4f6a588bee23505affe393aad  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json' | sha256sum -c -
printf '%s\n' '3efb98becd4878376d24c62725c34295975e036bd4488454963e52fa7ff49bf2  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc' | sha256sum -c -
printf '%s\n' '0c983d6d4593556720704fdccd2c08733853eb3982cb03359fdeaa68d0dd6efb  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry' | sha256sum -c -
printf '%s\n' 'b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021  /usr/bin/xochitl' | sha256sum -c -
printf '%s\n' '9ff003d49c24b853aabe693ff13a4f30edf8b4966c6c3cb736d480999c143615  /home/root/xovi/exthome/qt-resource-rebuilder/hashtab' | sha256sum -c -
printf '%s\n' '5cfd75415efbf9a1ece4a0fe985ac1c3d6ecc73cab9ec89b34bf3e13cc71e2c2  /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd' | sha256sum -c -
printf '%s\n' 'beb16e50f8dcd996bd11c56ad918121071580a31a2ede5e213ff11df3d05567d  /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd' | sha256sum -c -
printf '%s\n' 'dc08c045cf9699516d42a6057b42b763adad6029f6ce4ee4906727fede329595  /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd' | sha256sum -c -
printf '%s\n' 'f8be3b7a4e81525cebed3113e8472e78f6e70e307cbe056013294f291ea2ea43  /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd' | sha256sum -c -
printf '%s\n' 'ebd8d87b5b32257d54b30342dc231249142b3c908037b9fb05a19ddf2808e023  /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd' | sha256sum -c -
printf '%s\n' '28beea93bc7dd9b7c9da27f450a7bf3ea4a260754d33b7fddbdc884a5880be43  /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd' | sha256sum -c -
printf '%s\n' '3a4fbbebbde114fd75eb525736111247af7d57e33cc67f87321c061ff16d5471  /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd' | sha256sum -c -
printf '%s\n' 'c88ac812e2df0191d6d047235c225a960d1b997f149dcf6540e411cf6e660fbe  /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd' | sha256sum -c -
printf '%s\n' '2468ca2172c78fcc37bbc16bf61af7df09e70b8ec6916cbfae82e01aee5fa982  /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd' | sha256sum -c -
printf '%s\n' '36b48948c02b507fc1333fa42b86c8e8e7f74b66aa290cb52d186b3ba1889158  /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd' | sha256sum -c -
printf '%s\n' '4109e01de3af4dcd2598b222fee17018bc5af87f4b9d6426c013ba2b6a91bcfe  /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd' | sha256sum -c -
printf '%s\n' '767390a47a005306b9b6a4a651e93bf6036069916e73f00ec91ceab372341a9e  /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd' | sha256sum -c -
printf '%s\n' 'd4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446  /home/root/xovi/xovi.so' | sha256sum -c -
printf '%s\n' '5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad  /home/root/xovi/extensions.d/appload.so' | sha256sum -c -
printf '%s\n' '6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f  /home/root/xovi/extensions.d/qt-resource-rebuilder.so' | sha256sum -c -
[ -L /home/root/xovi/exthome/appload/pi-annotations ] && [ "$(readlink /home/root/xovi/exthome/appload/pi-annotations)" = /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app ] || fail old_link
[ -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd ] && [ "$(readlink /home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd)" = /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd ] || fail old_link
pid=$(systemctl show xochitl.service -p MainPID --value)
case "$pid" in ''|0|*[!0-9]*) fail ui_pid;; esac
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail ui_active
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail ui_running
for lib in /home/root/xovi/xovi.so /home/root/xovi/extensions.d/appload.so /home/root/xovi/extensions.d/qt-resource-rebuilder.so; do
 found=0
 while IFS= read -r line; do case "$line" in *" $lib") found=1;; esac; done < "/proc/$pid/maps"
 [ "$found" = 1 ] || fail unmapped_dependency
done
for proc in /proc/[0-9]*; do
 exe=$(readlink "$proc/exe" 2>/dev/null || true)
 case "$exe" in *pi-ink-client*|*pi-annotations*) fail unexpected_native_client;; esac
done
printf 'UI_PID=%s\n' "$pid"
[ -w /home/root/.local/share/pi-ink-bridge ] || fail authorized_parent_not_writable
[ -w /home/root/.local/share/pi-ink-bridge/releases ] || fail authorized_parent_not_writable
[ -w /home/root/xovi/exthome/appload ] || fail authorized_parent_not_writable
[ -w /home/root/xovi/exthome/qt-resource-rebuilder ] || fail authorized_parent_not_writable
[ ! -e /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33 ] && [ ! -L /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33 ] || fail new_release_occupied
for tool in curl unzip sha256sum mktemp chmod mv ln stat readlink; do command -v "$tool" >/dev/null || fail missing_tool; done
printf 'RENAME_INTERFACE_BEGIN\n'
mv --help
printf 'RENAME_INTERFACE_END\n'
stat -c 'FILESYSTEM|%n|%d' /home/root/.local/share/pi-ink-bridge /home/root/.local/share/pi-ink-bridge/releases /home/root/xovi/exthome/appload /home/root/xovi/exthome/qt-resource-rebuilder
for entry in /home/root/xovi/exthome/qt-resource-rebuilder/*.qmd; do printf 'QMD_NAME|%s\n' "${entry##*/}"; done
printf 'CONTROLLED_PREFLIGHT_COMPLETE\n'
