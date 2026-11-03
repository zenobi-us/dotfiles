# Separate owner approval is required. This wrapper never repairs a failed guard.
set -eu
test "${PI_INK_DIAGNOSTIC_APPROVED-}" = baseline-path-0026 || { printf '%s\n' 'ABORT: separate exact baseline diagnostic approval required'; exit 1; }
script=/tmp/pi-ink-baseline-diagnostic-0026/diagnose.sh
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: diagnostic script type'; exit 1; }
printf '%s  %s\n' 50d6f6b806fe0333eda3f206d139ba9cb2400293f3c9e5ee51fb4b94f9d5b0e7 "$script" | sha256sum -c -
route=$(ip -j route get 10.11.99.1)
usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
test "$usb_interface" = enp2s0f0u4c2 || { printf '%s\n' 'ABORT: USB interface mismatch'; exit 1; }
test "$usb_address" = 10.11.99.10 || { printf '%s\n' 'ABORT: USB source mismatch'; exit 1; }
test ! -e "/sys/class/net/$usb_interface/wireless" && test ! -e "/sys/class/net/$usb_interface/phy80211" || { printf '%s\n' 'ABORT: wireless interface'; exit 1; }
test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0 || { printf '%s\n' 'ABORT: USB physical device mismatch'; exit 1; }
printf '%s\n' 'EXACT_USB_GUARD_PASSED_READ_ONLY_DIAGNOSTIC'
timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$script"
