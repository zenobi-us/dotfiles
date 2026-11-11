set -eu
umask 077
fail() { printf 'STOP=%s\n' "$1" >&2; exit 41; }
owner=0
base='/home/root/.local/share/pi-ink-bridge'
stage="$base/.upgrade-0010"
backup="$base/.backup-0010"
old="$base/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33"
target="$base/releases/8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962"
link1='/home/root/xovi/exthome/appload/pi-annotations'
link2='/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd'
old1='65026:1472:0:0:777'
old2='65026:1474:0:0:777'
config_identity='65026:1154:0:0:600:350'
ca_identity='65026:1153:0:0:600:717'
config_hash='83a3766298e1e0f5344d5d18bb95b43f38fe38349427191a845bc4fa30bba8c9'
ca_hash='8e5b94fe2995e86baf3ee80a788caeb740efee2983942e4499b026ebaec1f7d9'
members='700|7536824|f704373442fa036ed461befa9abdf77249168e1d3518afeab18905381336423e|pi-ink-client
600|6|a0ad50640139a524f86591157145bf1d4674ea9c065bfea21558f0f7b04430c8|VERSION
600|949|33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be|sidebar.qmd
600|213|265d2ea700c8b20a49d6e9f67489b9431adacbd4f6a588bee23505affe393aad|app/manifest.json
700|194|0c983d6d4593556720704fdccd2c08733853eb3982cb03359fdeaa68d0dd6efb|app/backend/entry
600|4986|b98c6eaeacee54da975b633b2b34cf05ab9909c60ee7644ae8f1973c5538b7bc|app/resources.rcc'
identity() { stat -c '%d:%i:%u:%g:%a' "$1"; }
hash_file() { printf '%s  %s\n' "$2" "$1" | sha256sum -c -; }
absent() { [ ! -e "$1" ] && [ ! -L "$1" ] || fail occupied_path; }
private_file() {
 [ -f "$1" ] && [ ! -L "$1" ] || fail private_type
 [ "$(stat -c '%d:%i:%u:%g:%a:%s' "$1")" = "$2" ] || fail private_identity
 hash_file "$1" "$3"
}
verify_identity_files() {
 private_file "$base/config.json" "$config_identity" "$config_hash"
 private_file "$base/server-ca.pem" "$ca_identity" "$ca_hash"
}
verify_private() { verify_identity_files; absent "$base/state.json"; }
guard_link() {
 [ -L "$1" ] && [ "$(readlink "$1")" = "$2" ] && [ "$(identity "$1")" = "$3" ] || fail launcher_identity
}
guard_old_links() { guard_link "$link1" "$old/app" "$old1"; guard_link "$link2" "$old/sidebar.qmd" "$old2"; }
save_record() { (set -C; printf '%s\n' "$2" > "$stage/$1"); }
record() {
 [ -f "$stage/$1" ] && [ ! -L "$stage/$1" ] || fail record_type
 [ "$(stat -c '%u:%a' "$stage/$1")" = "$owner:600" ] || fail record_owner
 [ "$(stat -c %s "$stage/$1")" -le 256 ] || fail record_size
 IFS= read -r value < "$stage/$1" || fail record_read
 printf '%s' "$value"
}
guard_stage() {
 [ -d "$stage" ] && [ ! -L "$stage" ] || fail stage_type
 [ "$(stat -c '%u:%g:%a' "$stage")" = "$owner:$owner:700" ] || fail stage_owner
 [ "$(identity "$stage")" = "$(record stage.id)" ] || fail stage_replaced
 [ "$(record transaction)" = 'pi-ink-bridge-03-upgrade-0022-8468df658f658820' ] || fail transaction_owner
}
journal() {
 [ -f "$stage/journal" ] && [ ! -L "$stage/journal" ] || fail journal_type
 [ "$(stat -c '%u:%a' "$stage/journal")" = "$owner:600" ] || fail journal_owner
 [ "$(stat -c %s "$stage/journal")" -le 4096 ] || fail journal_size
 if [ "$1" = append ]; then printf '%s\n' "$2" >> "$stage/journal"; sync; return; fi
 found=0
 while IFS= read -r entry; do [ "$entry" != "$2" ] || found=1; done < "$stage/journal"
 if [ "$1" = require ]; then [ "$found" = 1 ] || fail missing_phase; else [ "$found" = 0 ] || fail launch_already_requested; fi
}
guard_environment() {
 [ "$(id -u)" = 0 ] || fail account
 [ "$(cat /proc/sys/kernel/random/boot_id)" = '8e816d98-6bf4-4f9e-9abe-891fbf83d06f' ] || fail boot_changed
 [ -d "$base" ] && [ ! -L "$base" ] || fail base_type
 [ "$(identity "$base")" = '65026:1150:0:0:700' ] || fail base_replaced
 while IFS='|' read -r parent expected; do
  [ -d "$parent" ] && [ ! -L "$parent" ] && [ "$(identity "$parent")" = "$expected" ] || fail parent_replaced
 done <<'PARENTS'
/home/root/.local/share/pi-ink-bridge/releases|65026:1155:0:0:700
/home/root/xovi|65026:668:0:0:755
/home/root/xovi/extensions.d|65026:674:0:0:755
/home/root/xovi/exthome|65026:675:0:0:755
/home/root/xovi/exthome/appload|65026:706:0:0:755
/home/root/xovi/exthome/qt-resource-rebuilder|65026:692:0:0:755
PARENTS
 verify_baseline
}
no_clients() {
 for proc in /proc/[0-9]*; do
  exe=$(readlink "$proc/exe" 2>/dev/null || true)
  case "$exe" in *pi-ink-client*|*pi-annotations*) fail client_still_active;; esac
 done
}
guard_stopped() {
 [ "$(systemctl show xochitl.service -p ActiveState --value)" = inactive ] || fail UI_not_inactive
 [ "$(systemctl show xochitl.service -p SubState --value)" = dead ] || fail UI_not_dead
 [ "$(systemctl show xochitl.service -p MainPID --value)" = 0 ] || fail UI_PID_present
 no_clients
}
verify_payload() {
 payload=$1
 for dir in "$payload" "$payload/app" "$payload/app/backend"; do
  [ -d "$dir" ] && [ ! -L "$dir" ] || fail payload_directory
  [ "$(stat -c '%u:%g:%a' "$dir")" = "$owner:$owner:700" ] || fail payload_directory_owner
 done
 while IFS='|' read -r mode size digest name; do
  path="$payload/$name"
  [ -f "$path" ] && [ ! -L "$path" ] || fail payload_type
  [ "$(stat -c '%u:%g:%a:%s' "$path")" = "$owner:$owner:$mode:$size" ] || fail payload_metadata
  hash_file "$path" "$digest"
 done <<EOF
$members
EOF
 for item in "$payload"/* "$payload"/.[!.]* "$payload"/..?* "$payload/app"/* "$payload/app"/.[!.]* "$payload/app"/..?* "$payload/app/backend"/* "$payload/app/backend"/.[!.]* "$payload/app/backend"/..?*; do
  if [ ! -e "$item" ] && [ ! -L "$item" ]; then continue; fi
  case "${item#"$payload/"}" in pi-ink-client|VERSION|sidebar.qmd|app|app/manifest.json|app/resources.rcc|app/backend|app/backend/entry) ;; *) fail foreign_payload_entry;; esac
 done
}
verify_backup() {
 [ -d "$backup" ] && [ ! -L "$backup" ] && [ "$(identity "$backup")" = "$(record backup.id)" ] || fail backup_identity
 for name in config.json server-ca.pem; do
  [ -f "$backup/$name" ] && [ ! -L "$backup/$name" ] || fail backup_type
  [ "$(stat -c '%u:%g:%a' "$backup/$name")" = "$owner:$owner:600" ] || fail backup_permissions
  cmp "$base/$name" "$backup/$name" || fail backup_changed
 done
}
guard_new_links() {
 guard_link "$link1" "$target/app" "$(record new1.id)"
 guard_link "$link2" "$target/sidebar.qmd" "$(record new2.id)"
}
guard_restored_links() {
 first=$(identity "$link1"); second=$(identity "$link2")
 case "$first" in "$old1"|"$(record rollback1.id)") ;; *) fail restored_link_1_unknown;; esac
 case "$second" in "$old2"|"$(record rollback2.id)") ;; *) fail restored_link_2_unknown;; esac
 guard_link "$link1" "$old/app" "$first"
 guard_link "$link2" "$old/sidebar.qmd" "$second"
}
guard_release() {
 [ "$(identity "$target")" = "$(record release.id)" ] || fail release_replaced
 verify_payload "$target"
}
guard_owned_clients() {
 count=0
 for proc in /proc/[0-9]*; do
  exe=$(readlink "$proc/exe" 2>/dev/null || true)
  case "$exe" in
   *pi-ink-client*|*pi-annotations*)
    [ "$exe" = "$old/pi-ink-client" ] || fail foreign_client
    count=$((count + 1)); [ "$count" -le 4 ] || fail too_many_clients
    parent=''; credentials=''
    while IFS= read -r line; do
     case "$line" in
      PPid:*) set -- $line; parent=$2;;
      Uid:*) set -- $line; credentials="$2:$3:$4:$5";;
     esac
    done < "$proc/status"
    [ "$parent" = 7146 ] && [ "$credentials" = 0:0:0:0 ] || fail foreign_client_owner
    hash_file "$proc/exe" '433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051'
    ;;
  esac
 done
}

verify_baseline() (
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
)
transport_hash='8a66c81661bad23a51e6b6459c5aa7b337b9e035d3479bf8dc6be401a1ec1d40'
guard_environment
guard_old_links
verify_private
absent "$stage"; absent "$backup"; absent "$target"
[ "$(stat -c %d "$base/releases")" = 65026 ] || fail release_filesystem
[ "$(df -Pk /home/root | { read -r header; read -r filesystem total used available rest; printf '%s' "$available"; })" -ge 65536 ] || fail space
umask 077
mkdir -m 700 "$stage"
save_record stage.id "$(identity "$stage")"
save_record transaction 'pi-ink-bridge-03-upgrade-0022-8468df658f658820'
(set -C; : > "$stage/journal")
journal append STAGING_CREATED
(set -C; cat > "$stage/transport.zip")
hash_file "$stage/transport.zip" "$transport_hash"
(set -C; unzip -p "$stage/transport.zip" client.zip > "$stage/client.zip")
(set -C; unzip -p "$stage/transport.zip" production-install.sh > "$stage/production-install.sh")
hash_file "$stage/client.zip" '8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962'
hash_file "$stage/production-install.sh" 'b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae'
# The installer is provenance only. Never execute it against occupied launchers.
mkdir -m 700 "$stage/payload" "$stage/payload/app" "$stage/payload/app/backend"
while IFS='|' read -r mode size digest name; do
 (set -C; unzip -p "$stage/client.zip" "$name" > "$stage/payload/$name")
 chmod "$mode" "$stage/payload/$name"
done <<EOF
$members
EOF
verify_payload "$stage/payload"
[ "$(cat "$stage/payload/VERSION")" = 0.5.0 ] || fail version
# Prove no-clobber and same-filesystem rename only on these new owned files.
(set -C; printf a > "$stage/probe-a"; printf b > "$stage/probe-b")
probe_a=$(identity "$stage/probe-a"); probe_b=$(identity "$stage/probe-b")
mv -T -n "$stage/probe-a" "$stage/probe-b"
[ "$(identity "$stage/probe-a")" = "$probe_a" ] && [ "$(identity "$stage/probe-b")" = "$probe_b" ] || fail rename_clobbered
[ "$(cat "$stage/probe-b")" = b ] || fail rename_content
mv -T -n "$stage/probe-a" "$stage/probe-c"
[ "$(identity "$stage/probe-c")" = "$probe_a" ] || fail rename_inode
absent "$stage/probe-a"
[ "$(stat -c %d "$stage/payload")" = 65026 ] || fail payload_filesystem
payload_identity=$(identity "$stage/payload")
absent "$target"
mv -T -n "$stage/payload" "$target"
[ "$(identity "$target")" = "$payload_identity" ] || fail publish_identity
absent "$stage/payload"
save_record release.id "$payload_identity"
for pair in 1 2; do
 case "$pair" in 1) suffix=app;; 2) suffix=sidebar.qmd;; esac
 ln -s "$target/$suffix" "$stage/new-$pair"
 ln -s "$old/$suffix" "$stage/rollback-$pair"
 save_record "new$pair.id" "$(identity "$stage/new-$pair")"
 save_record "rollback$pair.id" "$(identity "$stage/rollback-$pair")"
done
guard_stage; guard_release; guard_old_links; verify_private
journal append STAGING_COMPLETE
printf 'IMMUTABLE_RELEASE_STAGED_NO_CUTOVER\n'
