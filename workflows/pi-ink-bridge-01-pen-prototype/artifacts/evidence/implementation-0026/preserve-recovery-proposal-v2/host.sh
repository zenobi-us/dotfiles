# Tokens are accident guards, not consent. Durable exact owner approvals and handoff are required.
set -eu
root=/tmp/pi-ink-preserve-recovery-0026-v2
test "${PI_INK_OPERATOR_HANDOFF-}" = confirmed-to-parent || { printf '%s\n' 'ABORT: fresh exclusive operator handoff required'; exit 1; }
case "${1-}" in
  preflight-device|preflight-host)
    test "${PI_INK_RECOVERY_PREFLIGHT_APPROVED-}" = preserve-recovery-0026-v2 || { printf '%s\n' 'ABORT: exact new read-only preflight scope approval required'; exit 1; }
    ;;
  recover-return-original|recover-keep-quarantined)
    test "${PI_INK_EXACT_RECOVERY_APPROVED-}" = preserve-recovery-0026-v2 || { printf '%s\n' 'ABORT: exact new recovery branch approval required'; exit 1; }
    test "${PI_INK_ENTRY_PREFLIGHT-}" = parent-validated-exact-evidence || { printf '%s\n' 'ABORT: parent must validate fresh preflight evidence first'; exit 1; }
    test "${PI_INK_NEW_RESTART_ALLOWANCE-}" = at-most-one-current-config || { printf '%s\n' 'ABORT: new explicit at-most-one restart allowance required'; exit 1; }
    test "${PI_INK_SAVED_CLOSED-}" = confirmed-for-this-new-restart || { printf '%s\n' 'ABORT: NEW all-documents-saved/closed confirmation required'; exit 1; }
    expected_choice=${1#recover-}
    test "${PI_INK_PROXY_CHOICE-}" = "$expected_choice" || { printf '%s\n' 'ABORT: explicit proxy disposition does not match frozen branch'; exit 1; }
    ;;
  verify-return-original|verify-keep-quarantined)
    test "${PI_INK_EXACT_RECOVERY_APPROVED-}" = preserve-recovery-0026-v2 || { printf '%s\n' 'ABORT: exact recovery postproof approval required'; exit 1; }
    expected_choice=${1#verify-}
    test "${PI_INK_PROXY_CHOICE-}" = "$expected_choice" || { printf '%s\n' 'ABORT: verification proxy branch mismatch'; exit 1; }
    ;;
  postinventory-return-original|postinventory-keep-quarantined)
    test "${PI_INK_POSTRECOVERY_INVENTORY_APPROVED-}" = preserve-recovery-0026-v2 || { printf '%s\n' 'ABORT: separate exact postrecovery entry inventory approval required'; exit 1; }
    expected_choice=${1#postinventory-}
    test "${PI_INK_PROXY_CHOICE-}" = "$expected_choice" || { printf '%s\n' 'ABORT: postinventory proxy branch mismatch'; exit 1; }
    ;;
  *) printf '%s\n' 'ABORT: select an exact approved preflight/recovery/postproof action'; exit 2 ;;
esac
case "$1" in
  preflight-device) script="$root/preflight.sh"; expected=8f27e09f3489d6bc284ac2d1cc92aa72e81f07bafe7a62bd47913dae72d79820 ;;
  preflight-host) script="$root/host-inventory.py"; expected=44a8f5c1f1765d17bd1176acc97adeb8af73d31dd28878af078e4baad5d6ac6e ;;
  recover-return-original) script="$root/recover-return-original.sh"; expected=c2fa1f41ad0a902f0a5a563cc2a2a473ad81f6450f7d6080ce9a834aca776172 ;;
  recover-keep-quarantined) script="$root/recover-keep-quarantined.sh"; expected=f5ac3475dabfcb3d2492b8c625fe4ea8473da88d771d3f7fe55e8a93f555cf11 ;;
  verify-return-original) script="$root/verify-return-original.sh"; expected=f5909cf1128295b9e55229226ef4bb937614b08d08404db0480fb6f650a76ee9 ;;
  verify-keep-quarantined) script="$root/verify-keep-quarantined.sh"; expected=d9611496d112c69afb86152b7b1144d0ebfc54eefae3bbe6c3f394cd65a42cc2 ;;
  postinventory-return-original) script="$root/postinventory-return-original.sh"; expected=f441619afe6d590715aa32b39652dc6eb0e1ceabf3c30eb086cd1408043021c1 ;;
  postinventory-keep-quarantined) script="$root/postinventory-keep-quarantined.sh"; expected=8572114c18b834b1a09bdade99f5dc9d0801c1ba5c0032bc2840318b2a791a65 ;;
esac
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: frozen script type mismatch'; exit 1; }
printf '%s  %s\n' "$expected" "$script" | sha256sum -c -
if test "$1" = preflight-host; then
  timeout 45 python3 "$script"
  exit $?
fi
route=$(ip -j route get 10.11.99.1)
usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
test "$usb_interface" = enp2s0f0u4c2 || { printf '%s\n' 'ABORT: USB interface mismatch'; exit 1; }
test "$usb_address" = 10.11.99.10 || { printf '%s\n' 'ABORT: USB source mismatch'; exit 1; }
test ! -e "/sys/class/net/$usb_interface/wireless" && test ! -e "/sys/class/net/$usb_interface/phy80211" || { printf '%s\n' 'ABORT: wireless interface'; exit 1; }
test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0 || { printf '%s\n' 'ABORT: USB physical device mismatch'; exit 1; }
printf '%s\n' 'EXACT_USB_GUARD_PASSED_NEW_PRESERVE_CURRENT_SCOPE'
timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$script"
