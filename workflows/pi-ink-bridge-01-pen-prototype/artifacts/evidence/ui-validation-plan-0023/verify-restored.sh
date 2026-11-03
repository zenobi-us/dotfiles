# PROSPECTIVE READ-ONLY: run only under exact owner approval, after original restoration.
set -eu
assert_hash() { test -f "$2"; test ! -L "$2"; printf '%s  %s\n' "$1" "$2" | sha256sum -c -; }
unit_state() {
  unit_status=0
  unit_load=$(systemctl show "$1" -p LoadState --value) || unit_status=$?
  case "$unit_load" in
    loaded) test "$unit_status" -eq 0 || return 1 ;;
    not-found) if test "$unit_status" -ne 0 && test "$unit_status" -ne 4; then return 1; fi ;;
    *) printf '%s\n' 'ABORT: unexpected owned-unit load state'; return 1 ;;
  esac
}
check_owned_unit() {
  unit_state "$1" || return 1
  test "$unit_load" = loaded || return 0
  test "$(systemctl show "$1" -p Transient --value)" = yes || return 1
  unit_exec=$(systemctl show "$1" -p ExecStart --value) || return 1
  case "$unit_exec" in
    *'path=/home/root/pi-ink-bridge-0020/pi-ink-tablet ;'*'argv[]=/home/root/pi-ink-bridge-0020/pi-ink-tablet -config /home/root/pi-ink-bridge-0020/config.json ;'*) return 0 ;;
    *) printf '%s\n' 'ABORT: owned unit command does not match this experiment'; return 1 ;;
  esac
}
assert_hash 709b65cd44766e98763e00577bfbe7d8f36f55c0f34894bfdbf0663d56b12a7a /etc/systemd/system/xochitl.service.d/00-xovi.conf
assert_hash 84a2d95c2284a2f2fdb5ae70b4f25eb4a5ef2fbf6f94391fc03e4c54643314ef /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf
assert_hash 6036f7776f8775529f94056fafe066ff373f5aa6bca39633bfd4dabfc1552ffd /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf
assert_hash 5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad /home/root/xovi/extensions.d/appload.so
assert_hash 48d62c2beb0d285943e5c8d3f08ed980c6045b27f13644079d15a3dbaf2b7609 /home/root/xovi/extensions.d/literm.so
assert_hash 2f19585c63979182ccd19a2953cd4aa6a6f3824ea36a76eb46c803e02e79db6e /home/root/xovi/extensions.d/qt-command-executor.so
assert_hash 6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f /home/root/xovi/extensions.d/qt-resource-rebuilder.so
assert_hash 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f /home/root/xovi/extensions.d/webserver-remote.so
assert_hash 61c0c7b0d4e2c7623147a87c63d6a4aaec868019e67fb0e1bdb1fcb215f6e155 /home/root/xovi/extensions.d/xovi-message-broker.so
assert_hash beb16e50f8dcd996bd11c56ad918121071580a31a2ede5e213ff11df3d05567d /home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd
assert_hash 5cfd75415efbf9a1ece4a0fe985ac1c3d6ecc73cab9ec89b34bf3e13cc71e2c2 /home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd
assert_hash dc08c045cf9699516d42a6057b42b763adad6029f6ce4ee4906727fede329595 /home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd
assert_hash f8be3b7a4e81525cebed3113e8472e78f6e70e307cbe056013294f291ea2ea43 /home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd
assert_hash 0d0d130ba63cfa65093475f9cec2f6694f2e37aab0a346fc5f2921e061303e50 /home/root/xovi/exthome/qt-resource-rebuilder/dockButtons.qmd
assert_hash ebd8d87b5b32257d54b30342dc231249142b3c908037b9fb05a19ddf2808e023 /home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd
assert_hash 9ff003d49c24b853aabe693ff13a4f30edf8b4966c6c3cb736d480999c143615 /home/root/xovi/exthome/qt-resource-rebuilder/hashtab
assert_hash 3a4fbbebbde114fd75eb525736111247af7d57e33cc67f87321c061ff16d5471 /home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd
assert_hash 28beea93bc7dd9b7c9da27f450a7bf3ea4a260754d33b7fddbdc884a5880be43 /home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd
assert_hash 2468ca2172c78fcc37bbc16bf61af7df09e70b8ec6916cbfae82e01aee5fa982 /home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd
assert_hash 36b48948c02b507fc1333fa42b86c8e8e7f74b66aa290cb52d186b3ba1889158 /home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd
assert_hash 4109e01de3af4dcd2598b222fee17018bc5af87f4b9d6426c013ba2b6a91bcfe /home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd
assert_hash 767390a47a005306b9b6a4a651e93bf6036069916e73f00ec91ceab372341a9e /home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd
assert_hash bf15dfd641deea3e4487b9182957938a3dc824c340383c9243b7f118bfe829dc /home/root/xovi/start
assert_hash e29494c9fff5ede390b06f1f5e27ca59e4f7bc81d25889822a123ccad1fd686d /home/root/xovi/stock
assert_hash d4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446 /home/root/xovi/xovi.so
assert_hash b1816408cf90b19e448c70082625c4d6a36060368706eb7a9b35425428a9a021 /usr/bin/xochitl
assert_hash 23f537cf59d527bfbf4823f372385d613e1ade0961c98831c935a372018f9566 /usr/lib/systemd/system/xochitl.service
assert_hash a9432caffacb29d6fcb35136dcc3cb43d8737eb6c2efcb35ea335725f42082d1 /usr/lib/systemd/system/xochitl.service.d/xochitl-service-override.conf
test "$(stat -c '%a %u %g %s %Y' /home/root/xovi/extensions.d/webserver-remote.so)" = '644 0 0 8453696 1793049401'
for path in /home/root/xovi/extensions.d/pi-ink-loopback-0020.so /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next /home/root/pi-ink-bridge-0020; do
  test ! -e "$path"; test ! -L "$path"
done
for unit in pi-ink-bridge-0020.service pi-ink-bridge-sidebar-0020.service; do
  check_owned_unit "$unit"
  if test "$unit_load" = loaded; then
    test "$(systemctl show "$unit" -p ActiveState --value)" = inactive
    test "$(systemctl show "$unit" -p MainPID --value)" = 0
    test "$(systemctl show "$unit" -p Result --value)" = success
  fi
done
test "$(systemctl show xochitl -p ActiveState --value)" = active
pid=$(systemctl show xochitl -p MainPID --value)
case "$pid" in ''|*[!0-9]*) exit 1 ;; esac
test "$pid" -gt 1
original_mapped=0
while IFS= read -r line; do
  case "$line" in
    */home/root/xovi/extensions.d/pi-ink-loopback-0020.so*) exit 1 ;;
    */home/root/xovi/extensions.d/webserver-remote.so*) original_mapped=1 ;;
  esac
done < "/proc/$pid/maps"
test "$original_mapped" = 1
ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  proxy_inode=''; stock_inode=''
  while read -r sl local remote state queues timer retransmit uid timeout inode rest; do
    test "$state" = 0A || continue
    case "$local" in
      00000000:0050) test -z "$proxy_inode"; proxy_inode=$inode ;;
      0100007F:0051) test -z "$stock_inode"; stock_inode=$inode ;;
      *:0050|*:0051|*:265D) printf '%s\n' 'ABORT: unexpected restored port80/81/9821 binding'; exit 1 ;;
    esac
  done < /proc/net/tcp
  if test -r /proc/net/tcp6; then
    while read -r sl local remote state rest; do
      test "$state" = 0A || continue
      case "$local" in *:0050|*:0051|*:265D) exit 1 ;; esac
    done < /proc/net/tcp6
  fi
  if test -n "$proxy_inode" && test -n "$stock_inode"; then ready=1; break; fi
  sleep 1
done
test "$ready" = 1
for wanted_inode in "$proxy_inode" "$stock_inode"; do
  owned=0
  for fd in /proc/$pid/fd/*; do
    socket=$(readlink "$fd" || true)
    if test "$socket" = "socket:[$wanted_inode]"; then owned=1; break; fi
  done
  test "$owned" = 1
done
test "$(systemctl show xochitl -p MainPID --value)" = "$pid"
printf 'RESTORATION_READ_ONLY_VERIFIED PID=%s HASHES=28 ORIGINAL_PROXY=exact STOCK=127.0.0.1:81 PROXY=0.0.0.0:80 OWNED_CLIENT=inactive UI9821=absent; inactive experiment files retained, cleanup not complete\n' "$pid"
