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
