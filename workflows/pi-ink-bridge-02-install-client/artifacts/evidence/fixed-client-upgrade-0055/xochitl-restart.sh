set -eu
fail() { printf 'STOP=%s\n' "$*" >&2; exit 41; }
[ "$(id -u)" = 0 ] || fail account
[ "$(cat /proc/sys/kernel/random/boot_id)" = 8e816d98-6bf4-4f9e-9abe-891fbf83d06f ] || fail boot
[ "$(tr -d '\000\n' < /sys/firmware/devicetree/base/model)" = 'reMarkable Ferrari' ] || fail model
[ "$(uname -m)" = aarch64 ] || fail architecture
. /etc/os-release
[ "$IMG_VERSION" = 3.28.0.172 ] || fail firmware
[ "$(systemctl show xochitl.service -p MainPID --value)" = 3641 ] || fail baseline_ui_pid
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail baseline_ui_active
printf 'RESTART_BASELINE_PID=3641\n'
printf 'RESTART_ISSUING=1\n'
systemctl restart xochitl.service
printf 'RESTART_COMMAND_RETURNED=1\n'
