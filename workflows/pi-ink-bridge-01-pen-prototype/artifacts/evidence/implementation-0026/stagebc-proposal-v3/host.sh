# Accident guards are not consent. Exact durable branch approval and fresh readiness are required.
set -eu
root=/tmp/pi-ink-stagebc-0026-v3
case "${1-}" in
  recover-return-original|recover-keep-quarantined) phase=recover; expected_choice=${1#recover-} ;;
  verify-return-original|verify-keep-quarantined) phase=verify; expected_choice=${1#verify-} ;;
  postinventory-return-original|postinventory-keep-quarantined) phase=postinventory; expected_choice=${1#postinventory-} ;;
  *) printf '%s\n' 'ABORT: Stage B/C only; select one of the six literal matching branch actions'; exit 2 ;;
esac
for legacy in "${PI_INK_RECOVERY_PREFLIGHT_APPROVED-}" "${PI_INK_EXACT_RECOVERY_APPROVED-}" "${PI_INK_POSTRECOVERY_INVENTORY_APPROVED-}" "${PI_INK_EXACT_PLAN_APPROVED-}" "${PI_INK_PROXY_CHOICE-}" "${PI_INK_NEW_RESTART_ALLOWANCE-}" "${PI_INK_SAVED_CLOSED-}" "${PI_INK_ENTRY_PREFLIGHT-}"; do
  test -z "$legacy" || { printf '%s\n' 'ABORT: legacy scope tokens forbidden in Stage B/C v3'; exit 1; }
done
test "${PI_INK_OPERATOR_HANDOFF-}" = confirmed-to-parent || { printf '%s\n' 'ABORT: exclusive operator handoff required'; exit 1; }
test "${PI_INK_STAGE_BC_APPROVED-}" = stagebc-0026-v3 || { printf '%s\n' 'ABORT: exact NEW Stage B/C v3 three-action branch approval required'; exit 1; }
test "${PI_INK_STAGE_BC_STAGE_A-}" = parent-validated-v2-preserve-host-root || { printf '%s\n' 'ABORT: durable parent Stage A validation and protected-root preservation required'; exit 1; }
test "${PI_INK_STAGE_BC_PROXY_CHOICE-}" = "$expected_choice" || { printf '%s\n' 'ABORT: selected proxy branch and action mismatch'; exit 1; }
case "$phase" in
  recover)
    test "${PI_INK_STAGE_BC_RESTART_ALLOWANCE-}" = at-most-one-new-current-config || { printf '%s\n' 'ABORT: NEW at-most-one further current-config restart allowance required'; exit 1; }
    test "${PI_INK_STAGE_BC_SAVED_CLOSED-}" = confirmed-for-this-new-restart || { printf '%s\n' 'ABORT: NEW ALL-documents-saved/closed confirmation required'; exit 1; }
    test "${PI_INK_STAGE_BC_USB-}" = connected-for-this-new-restart || { printf '%s\n' 'ABORT: NEW connected USB confirmation required'; exit 1; }
    ;;
  verify|postinventory)
    test "${PI_INK_STAGE_BC_RECOVERY_OUTCOME-}" = observed-success-same-selected-branch || { printf '%s\n' 'ABORT: successful same-branch recovery must be observed before read-only checks'; exit 1; }
    if test "$phase" = postinventory; then
      test "${PI_INK_STAGE_BC_VERIFY_OUTCOME-}" = observed-success-same-selected-branch || { printf '%s\n' 'ABORT: successful same-branch verify required before postinventory'; exit 1; }
    fi
    ;;
esac
case "$1" in
  recover-return-original) script="$root/recover-return-original.sh"; expected=d2a223e80b8ec6fa94439616fb49ceb0bce45b2f96474513b126216f35b0dfbc ;;
  recover-keep-quarantined) script="$root/recover-keep-quarantined.sh"; expected=76346dbd3e95d2dfa50883b5c5174db61fc855de081de4858f6260f0a64f8876 ;;
  verify-return-original) script="$root/verify-return-original.sh"; expected=f5909cf1128295b9e55229226ef4bb937614b08d08404db0480fb6f650a76ee9 ;;
  verify-keep-quarantined) script="$root/verify-keep-quarantined.sh"; expected=d9611496d112c69afb86152b7b1144d0ebfc54eefae3bbe6c3f394cd65a42cc2 ;;
  postinventory-return-original) script="$root/postinventory-return-original.sh"; expected=a14afee9524893a97ced369acce945baa328ccb613c37bafafe96850fe193dee ;;
  postinventory-keep-quarantined) script="$root/postinventory-keep-quarantined.sh"; expected=4333cc3c0f56b0f0f1e3d6cc02efb0e3a26a5cd802e1f2189b6e9bb65e1ef2c0 ;;
esac
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: frozen script type mismatch'; exit 1; }
printf '%s  %s\n' "$expected" "$script" | sha256sum -c -
route=$(ip -j route get 10.11.99.1)
usb_interface=$(printf '%s' "$route" | jq -er 'if length == 1 and .[0].gateway == null then .[0].dev else error("not direct USB route") end')
usb_address=$(printf '%s' "$route" | jq -er '.[0].prefsrc')
test "$usb_interface" = enp2s0f0u4c2 || { printf '%s\n' 'ABORT: USB interface mismatch'; exit 1; }
test "$usb_address" = 10.11.99.10 || { printf '%s\n' 'ABORT: USB source mismatch'; exit 1; }
test ! -e "/sys/class/net/$usb_interface/wireless" && test ! -e "/sys/class/net/$usb_interface/phy80211" || { printf '%s\n' 'ABORT: wireless interface'; exit 1; }
test "$(readlink -f "/sys/class/net/$usb_interface/device")" = /sys/devices/pci0000:00/0000:00:01.2/0000:02:00.0/usb1/1-4/1-4:2.0 || { printf '%s\n' 'ABORT: USB physical device mismatch'; exit 1; }
printf '%s\n' 'EXACT_USB_GUARD_PASSED_NEW_PRESERVE_CURRENT_SCOPE'
timeout 45 ssh -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=yes -o ControlMaster=no -o ControlPath=none -o ProxyCommand=none -o ProxyJump=none -o "BindInterface=$usb_interface" -o "BindAddress=$usb_address" root@10.11.99.1 sh -s < "$script"
