set -eu
fail() { printf 'STOP=%s
' "$1" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
model=$(tr -d '\000\n' < /sys/firmware/devicetree/base/model)
[ "$model" = 'reMarkable Ferrari' ] || fail model
[ "$(uname -m)" = aarch64 ] || fail architecture
. /etc/os-release
[ "$IMG_VERSION" = 3.28.0.172 ] || fail firmware
printf 'MODEL=%s
ARCH=aarch64
FIRMWARE=%s
' "$model" "$IMG_VERSION"
printf 'BOOT_ID=%s
' "$(cat /proc/sys/kernel/random/boot_id)"
[ -d '/' ] && [ ! -L '/' ] || fail directory_type
[ "$(stat -c %u '/')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/'
[ -d '/home' ] && [ ! -L '/home' ] || fail directory_type
[ "$(stat -c %u '/home')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home'
[ -d '/home/root' ] && [ ! -L '/home/root' ] || fail directory_type
[ "$(stat -c %u '/home/root')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root'
[ -d '/home/root/.local' ] && [ ! -L '/home/root/.local' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local'
[ -d '/home/root/.local/share' ] && [ ! -L '/home/root/.local/share' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share'
[ -d '/home/root/.local/share/pi-ink-bridge' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge'
[ -d '/home/root/.local/share/pi-ink-bridge/releases' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases'
[ -d '/home/root/xovi' ] && [ ! -L '/home/root/xovi' ] || fail directory_type
[ "$(stat -c %u '/home/root/xovi')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/xovi'
[ -d '/home/root/xovi/extensions.d' ] && [ ! -L '/home/root/xovi/extensions.d' ] || fail directory_type
[ "$(stat -c %u '/home/root/xovi/extensions.d')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/xovi/extensions.d'
[ -d '/home/root/xovi/exthome' ] && [ ! -L '/home/root/xovi/exthome' ] || fail directory_type
[ "$(stat -c %u '/home/root/xovi/exthome')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/xovi/exthome'
[ -d '/home/root/xovi/exthome/appload' ] && [ ! -L '/home/root/xovi/exthome/appload' ] || fail directory_type
[ "$(stat -c %u '/home/root/xovi/exthome/appload')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/xovi/exthome/appload'
[ -d '/home/root/xovi/exthome/qt-resource-rebuilder' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder' ] || fail directory_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app'
[ -d '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend' ] || fail directory_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend')" = 0 ] || fail directory_owner
stat -c 'DIR|%n|%F|%u|%g|%a|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client')" = 0 ] || fail public_file_owner
printf '%s\n' 'c91ad5234805b443d381e123f3c533d23d2c5e9fc817b964e4d405b808232a2d  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/pi-ink-client'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION')" = 0 ] || fail public_file_owner
printf '%s\n' '40b8eb4000a913a7791090535f291d3d369874162a89ef3c9e3d4e887a1b9e79  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/VERSION'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json')" = 0 ] || fail public_file_owner
printf '%s\n' '265d2ea700c8b20a49d6e9f67489b9431adacbd4f6a588bee23505affe393aad  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/manifest.json'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc')" = 0 ] || fail public_file_owner
printf '%s\n' '3efb98becd4878376d24c62725c34295975e036bd4488454963e52fa7ff49bf2  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/resources.rcc'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry')" = 0 ] || fail public_file_owner
printf '%s\n' '0c983d6d4593556720704fdccd2c08733853eb3982cb03359fdeaa68d0dd6efb  /home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app/backend/entry'
[ -f '/usr/bin/xochitl' ] && [ ! -L '/usr/bin/xochitl' ] || fail public_file_type
[ "$(stat -c %u '/usr/bin/xochitl')" = 0 ] || fail public_file_owner
printf '%s\n' 'b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021  /usr/bin/xochitl' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/usr/bin/xochitl'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/hashtab' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/hashtab' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/hashtab')" = 0 ] || fail public_file_owner
printf '%s\n' '9ff003d49c24b853aabe693ff13a4f30edf8b4966c6c3cb736d480999c143615  /home/root/xovi/exthome/qt-resource-rebuilder/hashtab' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/hashtab'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '5cfd75415efbf9a1ece4a0fe985ac1c3d6ecc73cab9ec89b34bf3e13cc71e2c2  /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' 'beb16e50f8dcd996bd11c56ad918121071580a31a2ede5e213ff11df3d05567d  /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' 'dc08c045cf9699516d42a6057b42b763adad6029f6ce4ee4906727fede329595  /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' 'f8be3b7a4e81525cebed3113e8472e78f6e70e307cbe056013294f291ea2ea43  /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' 'ebd8d87b5b32257d54b30342dc231249142b3c908037b9fb05a19ddf2808e023  /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '28beea93bc7dd9b7c9da27f450a7bf3ea4a260754d33b7fddbdc884a5880be43  /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '3a4fbbebbde114fd75eb525736111247af7d57e33cc67f87321c061ff16d5471  /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' 'c88ac812e2df0191d6d047235c225a960d1b997f149dcf6540e411cf6e660fbe  /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '2468ca2172c78fcc37bbc16bf61af7df09e70b8ec6916cbfae82e01aee5fa982  /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '36b48948c02b507fc1333fa42b86c8e8e7f74b66aa290cb52d186b3ba1889158  /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '4109e01de3af4dcd2598b222fee17018bc5af87f4b9d6426c013ba2b6a91bcfe  /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd'
[ -f '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd' ] && [ ! -L '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '767390a47a005306b9b6a4a651e93bf6036069916e73f00ec91ceab372341a9e  /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd'
[ -f '/home/root/xovi/xovi.so' ] && [ ! -L '/home/root/xovi/xovi.so' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/xovi.so')" = 0 ] || fail public_file_owner
printf '%s\n' 'd4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446  /home/root/xovi/xovi.so' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/xovi.so'
[ -f '/home/root/xovi/extensions.d/appload.so' ] && [ ! -L '/home/root/xovi/extensions.d/appload.so' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/extensions.d/appload.so')" = 0 ] || fail public_file_owner
printf '%s\n' '5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad  /home/root/xovi/extensions.d/appload.so' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/extensions.d/appload.so'
[ -f '/home/root/xovi/extensions.d/qt-resource-rebuilder.so' ] && [ ! -L '/home/root/xovi/extensions.d/qt-resource-rebuilder.so' ] || fail public_file_type
[ "$(stat -c %u '/home/root/xovi/extensions.d/qt-resource-rebuilder.so')" = 0 ] || fail public_file_owner
printf '%s\n' '6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f  /home/root/xovi/extensions.d/qt-resource-rebuilder.so' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/extensions.d/qt-resource-rebuilder.so'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client')" = 0 ] || fail public_file_owner
printf '%s\n' '433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/pi-ink-client'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/VERSION' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/VERSION' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/VERSION')" = 0 ] || fail public_file_owner
printf '%s\n' '40b8eb4000a913a7791090535f291d3d369874162a89ef3c9e3d4e887a1b9e79  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/VERSION' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/VERSION'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd')" = 0 ] || fail public_file_owner
printf '%s\n' '33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/manifest.json' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/manifest.json' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/manifest.json')" = 0 ] || fail public_file_owner
printf '%s\n' '265d2ea700c8b20a49d6e9f67489b9431adacbd4f6a588bee23505affe393aad  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/manifest.json' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/manifest.json'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend/entry' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend/entry' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend/entry')" = 0 ] || fail public_file_owner
printf '%s\n' '0c983d6d4593556720704fdccd2c08733853eb3982cb03359fdeaa68d0dd6efb  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend/entry' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/backend/entry'
[ -f '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/resources.rcc' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/resources.rcc' ] || fail public_file_type
[ "$(stat -c %u '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/resources.rcc')" = 0 ] || fail public_file_owner
printf '%s\n' 'e2407b9544dbcf351c49ac330721c181fb4a9a86fe24da245ad4189d7a43c8c5  /home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/resources.rcc' | sha256sum -c -
stat -c 'PUBLIC|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app/resources.rcc'
[ -L '/home/root/xovi/exthome/appload/pi-annotations' ] || fail launcher_not_symlink
[ "$(readlink '/home/root/xovi/exthome/appload/pi-annotations')" = '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/app' ] || fail unexpected_launcher_target
stat -c 'LINK|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/appload/pi-annotations'
printf 'LINK_TARGET|%s|%s\n' '/home/root/xovi/exthome/appload/pi-annotations' "$(readlink '/home/root/xovi/exthome/appload/pi-annotations')"
[ -L '/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd' ] || fail launcher_not_symlink
[ "$(readlink '/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd')" = '/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33/sidebar.qmd' ] || fail unexpected_launcher_target
stat -c 'LINK|%n|%F|%u|%g|%a|%s|%d|%i' '/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd'
printf 'LINK_TARGET|%s|%s\n' '/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd' "$(readlink '/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd')"
for name in config.json server-ca.pem state.json; do
 path="/home/root/.local/share/pi-ink-bridge/$name"
 if [ ! -e "$path" ] && [ ! -L "$path" ]; then
  [ "$name" = state.json ] || fail private_file_missing
  printf 'PRIVATE_ABSENT|%s
' "$path"
  continue
 fi
 [ -f "$path" ] && [ ! -L "$path" ] || fail private_file_type
 [ "$(stat -c '%u:%g:%a' "$path")" = 0:0:600 ] || fail private_permissions
 stat -c 'PRIVATE_META|%n|%F|%u|%g|%a|%s|%d|%i' "$path"
 sha256sum "$path"
done
printf '%s
' '8e5b94fe2995e86baf3ee80a788caeb740efee2983942e4499b026ebaec1f7d9  /home/root/.local/share/pi-ink-bridge/server-ca.pem' | sha256sum -c -
if command -v jq >/dev/null 2>&1; then
 jq -e --arg server '256377c7f22604161e086b332a63e19b' '.statePath == "/home/root/.local/share/pi-ink-bridge/state.json" and (.servers|length) == 1 and .servers[0].ca == "/home/root/.local/share/pi-ink-bridge/server-ca.pem" and .servers[0].serverId == $server' /home/root/.local/share/pi-ink-bridge/config.json >/dev/null || fail private_layout_mismatch
 printf 'PRIVATE_LAYOUT=VERIFIED_FIXED_PATHS
'
else
 printf 'PRIVATE_LAYOUT=UNVERIFIED_NO_DEVICE_JSON_READER
'
fi
pid=$(systemctl show xochitl.service -p MainPID --value)
case "$pid" in ''|0|*[!0-9]*) fail ui_pid;; esac
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail ui_inactive
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail ui_not_running
for lib in /home/root/xovi/xovi.so /home/root/xovi/extensions.d/appload.so /home/root/xovi/extensions.d/qt-resource-rebuilder.so; do
 found=0
 while IFS= read -r line; do case "$line" in *" $lib") found=1;; esac; done < "/proc/$pid/maps"
 [ "$found" = 1 ] || fail dependency_not_mapped
done
printf 'UI_PID=%s
' "$pid"
for proc in /proc/[0-9]*; do
 exe=$(readlink "$proc/exe" 2>/dev/null || true)
 case "$exe" in *pi-ink-client*|*pi-annotations*) printf 'ACTIVE_CLIENT_PID=%s
' "${proc##*/}"; fail client_active;; esac
done
for tool in sha256sum unzip stat readlink cmp ln mv df; do command -v "$tool" >/dev/null || fail command_missing; done
printf 'RENAME_INTERFACE_BEGIN
'
mv --help
printf 'RENAME_INTERFACE_END
'
df -Pk /home/root
[ ! -e '/home/root/.local/share/pi-ink-bridge/releases/8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/releases/8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962' ] || fail proposed_path_occupied
printf 'ABSENT|%s\n' '/home/root/.local/share/pi-ink-bridge/releases/8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962'
[ ! -e '/home/root/.local/share/pi-ink-bridge/.upgrade-0010' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/.upgrade-0010' ] || fail proposed_path_occupied
printf 'ABSENT|%s\n' '/home/root/.local/share/pi-ink-bridge/.upgrade-0010'
[ ! -e '/home/root/.local/share/pi-ink-bridge/.backup-0010' ] && [ ! -L '/home/root/.local/share/pi-ink-bridge/.backup-0010' ] || fail proposed_path_occupied
printf 'ABSENT|%s\n' '/home/root/.local/share/pi-ink-bridge/.backup-0010'
for entry in /home/root/xovi/exthome/qt-resource-rebuilder/*.qmd; do printf 'QMD_NAME|%s
' "${entry##*/}"; done
printf 'READ_ONLY_PREFLIGHT_COMPLETE
'
