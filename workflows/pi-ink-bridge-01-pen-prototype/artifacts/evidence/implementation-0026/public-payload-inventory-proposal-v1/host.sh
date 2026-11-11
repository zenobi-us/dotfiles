# NEW host-only permission; no tablet, process, network or deletion authority.
set -eu
test "$#" -eq 1 && test "${1-}" = inventory-public-payload || { printf '%s\n' 'ABORT: exact host-only inventory-public-payload action required'; exit 2; }
for legacy in "${PI_INK_RECOVERY_PREFLIGHT_APPROVED-}" "${PI_INK_STAGE_BC_APPROVED-}" "${PI_INK_EXACT_PLAN_APPROVED-}"; do
  test -z "$legacy" || { printf '%s\n' 'ABORT: previous-scope approval flags forbidden'; exit 1; }
done
test "${PI_INK_PUBLIC_PAYLOAD_INVENTORY_APPROVED-}" = public-payload-0026-v1 || { printf '%s\n' 'ABORT: NEW exact protected-public-payload read-only approval required'; exit 1; }
script=/tmp/pi-ink-public-payload-inventory-0026-v1/inventory.py
test -f "$script" && test ! -L "$script" || { printf '%s\n' 'ABORT: frozen inventory script type mismatch'; exit 1; }
printf '%s  %s\n' e7e6f0ceaa706397da54bfcec67626978011ff9e608726e72028a0217c685e01 "$script" | sha256sum -c -
timeout 45 python3 -I -B "$script"
