# Separate approval covers one read-only investigation, not restoration or repair.
set -eu
test "${PI_INK_RECOVERY_INVESTIGATION_APPROVED-}" = service-ownership-0026 || { printf '%s\n' 'ABORT: separate exact service ownership investigation approval required'; exit 1; }
script=/tmp/pi-ink-recovery-investigation-0026/investigate.sh
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: investigation script type'; exit 1; }
printf '%s  %s\n' 6c489063c69a9b1f35d236fb5259ddbdcddb616d3c26a530fb0d30ae6a58a8d1 "$script" | sha256sum -c -
route=$(ip -j route get 10.11.99.1)
usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
test "$usb_interface" = enp2s0f0u4c2 || { printf '%s\n' 'ABORT: USB interface mismatch'; exit 1; }
test "$usb_address" = 10.11.99.10 || { printf '%s\n' 'ABORT: USB source mismatch'; exit 1; }
test ! -e "/sys/class/net/$usb_interface/wireless" && test ! -e "/sys/class/net/$usb_interface/phy80211" || { printf '%s\n' 'ABORT: wireless interface'; exit 1; }
test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0 || { printf '%s\n' 'ABORT: USB physical device mismatch'; exit 1; }
printf '%s\n' 'EXACT_USB_GUARD_PASSED_READ_ONLY_RECOVERY_INVESTIGATION'
timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$script"
