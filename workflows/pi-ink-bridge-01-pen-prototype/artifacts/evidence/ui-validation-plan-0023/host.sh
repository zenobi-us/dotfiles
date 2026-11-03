# PROSPECTIVE ONLY: exact owner approval must be recorded before any device command.
set -eu
assert_hash() { test -f "$2"; test ! -L "$2"; printf '%s  %s\n' "$1" "$2" | sha256sum -c -; }
guard_usb() {
 route=$(ip -j route get 10.11.99.1)
 usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
 usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
 test "$usb_interface" = enp2s0f0u4c2
 test "$usb_address" = 10.11.99.10
 test ! -e "/sys/class/net/$usb_interface/wireless"
 test ! -e "/sys/class/net/$usb_interface/phy80211"
 test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0
}
run_target() {
 guard_usb
 timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$1"
}
stage_file() {
 guard_usb
 timeout 45 scp -O -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" "$1" "root@10.11.99.1:$2"
}
test "${PI_INK_EXACT_PLAN_APPROVED-}" = ui-0023-reload4-restore5 || { printf '%s\n' 'ABORT: record exact owner scope before execution'; exit 1; }
case "${1-}" in
 prepare|stage|reload)
assert_hash ab3ebf859cf33af4f17bb23993d6918fb6c9612c178ce7aa1ef24e889b19ec51 /tmp/pi-ink-ui-validation-0023/prepare.sh
assert_hash 34e26652fecb4ecf77519ec0d773fd017dd9097e5a022ab0f4aa1c4d2254ab33 /tmp/pi-ink-ui-validation-0023/reload.sh
assert_hash ea9f0b1301bcb5167f306e31854748a59607915282e211232234b570e89b73b1 /tmp/pi-ink-ui-validation-0023/restore.sh
assert_hash a32e82de0a4b10631f7e6331c717640e33a437bd8ba9f7469b3b21acf814fccc /tmp/pi-ink-ui-validation-0023/verify-restored.sh
assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d /tmp/pi-ink-ui-validation-0023/payload/owner.txt
assert_hash 9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c /tmp/pi-ink-ui-validation-0023/payload/payload-sha256.txt
assert_hash 0dc1dad15002559d943f63fb73298aca68c570a9f46cefe38bb42c5798e8edc0 /tmp/pi-ink-ui-validation-0023/payload/pi-ink-bridge.qmd
assert_hash c09f7f617760b4dc839787d228a2ab2bf12ba26f1f52a6ec910124072b8db869 /tmp/pi-ink-ui-validation-0023/payload/PiInkToolbar.qml
case "$1" in
 prepare) run_target /tmp/pi-ink-ui-validation-0023/prepare.sh ;;
 stage)
  stage_file /tmp/pi-ink-ui-validation-0023/payload/owner.txt /home/root/pi-ink-ui-stage-0023/owner.txt
  stage_file /tmp/pi-ink-ui-validation-0023/payload/PiInkToolbar.qml /home/root/pi-ink-ui-stage-0023/PiInkToolbar.qml
  stage_file /tmp/pi-ink-ui-validation-0023/payload/pi-ink-bridge.qmd /home/root/pi-ink-ui-stage-0023/pi-ink-bridge.qmd
  stage_file /tmp/pi-ink-ui-validation-0023/payload/payload-sha256.txt /home/root/pi-ink-ui-stage-0023/payload-sha256.txt
  ;;
 reload)
  test "${PI_INK_SAVED_CLOSED-}" = confirmed-for-this-restart
  run_target /tmp/pi-ink-ui-validation-0023/reload.sh
  ;;
esac
 ;;
 restore)
  test "${PI_INK_SAVED_CLOSED-}" = confirmed-for-this-restart
  assert_hash ea9f0b1301bcb5167f306e31854748a59607915282e211232234b570e89b73b1 /tmp/pi-ink-ui-validation-0023/restore.sh
  run_target /tmp/pi-ink-ui-validation-0023/restore.sh
 ;;
 verify-restored)
  assert_hash a32e82de0a4b10631f7e6331c717640e33a437bd8ba9f7469b3b21acf814fccc /tmp/pi-ink-ui-validation-0023/verify-restored.sh
  run_target /tmp/pi-ink-ui-validation-0023/verify-restored.sh
 ;;
 *) printf '%s\n' 'Choose prepare/stage/reload/restore/verify-restored only within approved scope'; exit 2 ;;
esac
