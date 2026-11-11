# New separate read-only two-config evidence scope. Accident guards are NOT consent.
set -eu
test "$#" -eq 1 && test "${1-}" = two-config-digests || { printf '%s\n' 'ABORT: exact two-config-digests action required'; exit 2; }
for legacy in "${PI_INK_RECOVERY_PREFLIGHT_APPROVED-}" "${PI_INK_STAGE_BC_APPROVED-}" "${PI_INK_EXACT_PLAN_APPROVED-}" "${PI_INK_PUBLIC_PAYLOAD_INVENTORY_APPROVED-}"; do
  test -z "$legacy" || { printf '%s\n' 'ABORT: other-scope approval flags forbidden'; exit 1; }
done
test "${PI_INK_OPERATOR_HANDOFF-}" = confirmed-to-parent || { printf '%s\n' 'ABORT: exclusive operator handoff required'; exit 1; }
test "${PI_INK_CONFIG_DIGEST_APPROVED-}" = two-configs-0026-v2 || { printf '%s\n' 'ABORT: NEW exact two-private-config digest approval required'; exit 1; }
script=/tmp/pi-ink-two-config-digests-0026-v2/digest.sh
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: frozen target script type mismatch'; exit 1; }
printf '%s  %s\n' 287ad1c97012ba9ee695d32b47d498e3e288df2f18852c9a19f67f96cc54abbc "$script" | sha256sum -c -
route=$(ip -j route get 10.11.99.1)
usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
test "$usb_interface" = enp2s0f0u4c2 || { printf '%s\n' 'ABORT: USB interface mismatch'; exit 1; }
test "$usb_address" = 10.11.99.10 || { printf '%s\n' 'ABORT: USB source mismatch'; exit 1; }
test ! -e "/sys/class/net/$usb_interface/wireless" && test ! -e "/sys/class/net/$usb_interface/phy80211" || { printf '%s\n' 'ABORT: wireless interface'; exit 1; }
test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0 || { printf '%s\n' 'ABORT: USB physical device mismatch'; exit 1; }
printf '%s\n' 'EXACT_USB_GUARD_PASSED_NEW_PRESERVE_CURRENT_SCOPE'
timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$script"
