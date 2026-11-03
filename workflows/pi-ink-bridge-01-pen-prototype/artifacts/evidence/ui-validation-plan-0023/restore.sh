# PROSPECTIVE ONLY: fresh exact owner approval and saved/closed confirmation required.
set -eu
umask 077
assert_hash() { test -f "$2"; test ! -L "$2"; printf '%s  %s\n' "$1" "$2" | sha256sum -c -; }
acquire_operation() {
  if test -e /home/root/pi-ink-operation-0020 || test -L /home/root/pi-ink-operation-0020; then
    test -d /home/root/pi-ink-operation-0020 || return 1
    test ! -L /home/root/pi-ink-operation-0020 || return 1
    test "$(stat -c '%u %g %a' /home/root/pi-ink-operation-0020)" = '0 0 700' || return 1
    test -f /home/root/pi-ink-operation-0020/actor.txt || return 1
    test ! -L /home/root/pi-ink-operation-0020/actor.txt || return 1
    test "$(stat -c '%u %g %a' /home/root/pi-ink-operation-0020/actor.txt)" = '0 0 600' || return 1
    read -r prior_phase prior_manifest prior_pid extra < /home/root/pi-ink-operation-0020/actor.txt || return 1
    case "$prior_phase" in load|repair|rollback) ;; *) return 1 ;; esac
    case "$prior_manifest" in d5b0222e8806b5a3bc1874fb49a07290eedfb54892573257f6a08d607df9a8fa|261f3409cc7315a86710b72308de30396eee651870d0c145dd800c786c1d8a72|9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c) ;; *) return 1 ;; esac
    test -z "$extra" || return 1
    case "$prior_pid" in ''|*[!0-9]*) return 1 ;; esac
    test "$prior_pid" -gt 1 || return 1
    if kill -0 "$prior_pid" 2>/dev/null; then printf '%s\n' 'ABORT: another approved operation is still running; host timeout is not completion'; return 1; fi
    case "$1" in repair|rollback) ;; *) return 1 ;; esac
    if test -e /home/root/pi-ink-operation-history-0020 || test -L /home/root/pi-ink-operation-history-0020; then
      test -d /home/root/pi-ink-operation-history-0020 || return 1
      test ! -L /home/root/pi-ink-operation-history-0020 || return 1
      test "$(stat -c '%u %g %a' /home/root/pi-ink-operation-history-0020)" = '0 0 700' || return 1
      assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d /home/root/pi-ink-operation-history-0020/owner.txt || return 1
    else
      mkdir /home/root/pi-ink-operation-history-0020 || return 1
      printf '%s\n' 'pi-ink-bridge-01-pen-prototype implementation-0020 01a19e3a-d649-7473-8e40-e4371bceb4ea' > /home/root/pi-ink-operation-history-0020/owner.txt || return 1
    fi
    test ! -e /home/root/pi-ink-operation-history-0020/"$prior_pid" || return 1
    test ! -L /home/root/pi-ink-operation-history-0020/"$prior_pid" || return 1
    mv /home/root/pi-ink-operation-0020 /home/root/pi-ink-operation-history-0020/"$prior_pid" || return 1
  fi
  mkdir /home/root/pi-ink-operation-0020 || return 1
  printf '%s %s %s\n' "$1" 9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c "$$" > /home/root/pi-ink-operation-0020/actor.txt || return 1
}
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
stop_owned_unit() {
  check_owned_unit "$1" || return 1
  test "$unit_load" = loaded || return 0
  systemctl stop "$1"
}
assert_approved_hash() {
  test -f "$3" || return 1
  test ! -L "$3" || return 1
  actual_sum=$(sha256sum "$3") || return 1
  actual_sum=${actual_sum%% *}
  if test "$actual_sum" != "$1" && test "$actual_sum" != "$2" && test "$actual_sum" != "${4-}" && test "$actual_sum" != "${5-}"; then printf '%s\n' 'ABORT: unknown active experiment bytes'; return 1; fi
}
choose_position() {
  test ! -L "$1" || return 1
  test ! -L "$2" || return 1
  if test -e "$1"; then test ! -e "$2" || return 1; printf '%s' "$1";
  else test -e "$2" || return 1; printf '%s' "$2"; fi
}
acquire_operation rollback
payload_position=$(choose_position /home/root/pi-ink-bridge-0020 /home/root/pi-ink-bridge-retained-0020)
proxy_position=$(choose_position /home/root/xovi/extensions.d/webserver-remote.so /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so)
adapter_position=$(choose_position /home/root/xovi/extensions.d/pi-ink-loopback-0020.so /home/root/pi-ink-rollback-owned-0020/adapter.so)
patch_position=$(choose_position /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd /home/root/pi-ink-rollback-owned-0020/pi-ink-bridge.qmd)
test -d "$payload_position"
test "$(stat -c '%u %g %a' "$payload_position")" = '0 0 700'
assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d "$payload_position/owner.txt"
assert_hash 709b65cd44766e98763e00577bfbe7d8f36f55c0f34894bfdbf0663d56b12a7a /etc/systemd/system/xochitl.service.d/00-xovi.conf
assert_hash 84a2d95c2284a2f2fdb5ae70b4f25eb4a5ef2fbf6f94391fc03e4c54643314ef /etc/systemd/system/xochitl.service.d/50-computed-widgets-01-preflight.conf
assert_hash 6036f7776f8775529f94056fafe066ff373f5aa6bca39633bfd4dabfc1552ffd /etc/systemd/system/xochitl.service.d/qt-resource-rebuilder.conf
assert_hash 5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad /home/root/xovi/extensions.d/appload.so
assert_hash 48d62c2beb0d285943e5c8d3f08ed980c6045b27f13644079d15a3dbaf2b7609 /home/root/xovi/extensions.d/literm.so
assert_hash 2f19585c63979182ccd19a2953cd4aa6a6f3824ea36a76eb46c803e02e79db6e /home/root/xovi/extensions.d/qt-command-executor.so
assert_hash 6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f /home/root/xovi/extensions.d/qt-resource-rebuilder.so
assert_hash 24bcfe6c0b0b44c35401f214b0ccc451cdb60d2fd0e8c718beac92be25f6dd0f "$proxy_position"
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
test "$(stat -c '%a %u %g %s %Y' "$proxy_position")" = '644 0 0 8453696 1793049401'
assert_hash aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f "$adapter_position"
assert_approved_hash c631208b621272227551a557dfee2e28142c79cb8a47987ac3460dab9304efc8 09aff9e7671d2931ffc54e16f943e922d2b66712fa40fb5e940acb1480e5b4e9 "$patch_position" 0dc1dad15002559d943f63fb73298aca68c570a9f46cefe38bb42c5798e8edc0
assert_approved_hash f601436dd591ae782f15c0714bcfd4412fb3facebeadeb7d31914a5dc69ecada 0cdb83b531a1c7b9e3509504551dbd6e52e0908a29d13b6975208ac7cd5efbfd "$payload_position/pi-ink-tablet"
assert_approved_hash 1c4bf78285b08464e38e7af16f0096fda55c4dcd86a5d86ac5c1399b1becf9a6 a861d40e488cdfe39f13366b4903052bb775910a8b7238dd1a6d1187cd585eca "$payload_position/config.json"
assert_approved_hash 9bf9c54d5fc8cc4c14b342a80020f2b31ca0b7e87d27faa05ff7324c22b1c3ba 9bf9c54d5fc8cc4c14b342a80020f2b31ca0b7e87d27faa05ff7324c22b1c3ba "$payload_position/trust/server-a.pem"
assert_approved_hash 9688d866717139a0fe03bd0e2a1d322e4ef8a61577717f4e5247f1eb2645db55 9688d866717139a0fe03bd0e2a1d322e4ef8a61577717f4e5247f1eb2645db55 "$payload_position/trust/server-b.pem"
assert_approved_hash 57416f0b80a3a100c6dc7ee2162647b2c866588a85cf46ef09106bbf1354595f e008dec2b9df0bc7115fbc1dc5535defeeff1ad72d62b8dc718a67e06cd780bf "$payload_position/tablet-qml/PiInkToolbar.qml" 8e976fa96d01babb6a9c5ea405544ce3b1fd63eef7de72e53e8fe5ac4aa929d9 c09f7f617760b4dc839787d228a2ab2bf12ba26f1f52a6ec910124072b8db869
assert_approved_hash aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f aeba9fc3d8aa816bda0db8c08d4cc5929a677a83f5e8e14b02a39bc70aef5c4f "$payload_position/adapter.so"
assert_approved_hash c631208b621272227551a557dfee2e28142c79cb8a47987ac3460dab9304efc8 09aff9e7671d2931ffc54e16f943e922d2b66712fa40fb5e940acb1480e5b4e9 "$payload_position/pi-ink-bridge.qmd" 0dc1dad15002559d943f63fb73298aca68c570a9f46cefe38bb42c5798e8edc0
assert_approved_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d "$payload_position/owner.txt"
assert_approved_hash 27645009e37fec8270d7d2e7541d4b1ae2a4da4378736d0b6a0277c39a354278 d5b0222e8806b5a3bc1874fb49a07290eedfb54892573257f6a08d607df9a8fa "$payload_position/payload-sha256.txt" 261f3409cc7315a86710b72308de30396eee651870d0c145dd800c786c1d8a72 9ce7ecaa8bd9607e938ea75ea7cae957728e6592a7d2bdb4b329f06e0939a57c
check_owned_unit pi-ink-bridge-0020.service
check_owned_unit pi-ink-bridge-sidebar-0020.service
if test -e /home/root/pi-ink-rollback-owned-0020; then
  test -d /home/root/pi-ink-rollback-owned-0020; test ! -L /home/root/pi-ink-rollback-owned-0020
  test "$(stat -c '%u %g %a' /home/root/pi-ink-rollback-owned-0020)" = '0 0 700'
  assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d /home/root/pi-ink-rollback-owned-0020/owner.txt
else
  test "$proxy_position" = /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so
  test "$payload_position" = /home/root/pi-ink-bridge-0020
  test "$adapter_position" = /home/root/xovi/extensions.d/pi-ink-loopback-0020.so
  test "$patch_position" = /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd
fi
if test -e /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next || test -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next; then
  test -f /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next; test ! -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next
  assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d /home/root/pi-ink-sidebar-backup-0020/owner.txt
  test ! -e /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0020-next
fi
if test -e /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next || test -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next; then
  test -f /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next; test ! -L /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next
  assert_hash a9eecd4c06a5fa0ec38a0935ad97fd29654f7b8b828493b2ca96ffe1116cbf8d /home/root/pi-ink-ui-backup-0023/owner.txt
  test ! -e /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0023-ui-next
  test ! -L /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0023-ui-next
fi
pending_job=$(systemctl show xochitl -p Job --value)
case "$pending_job" in
  ''|0) ;;
  *) printf '%s\n' 'ABORT: xochitl has a pending job'; exit 1 ;;
esac
stop_owned_unit pi-ink-bridge-0020.service
stop_owned_unit pi-ink-bridge-sidebar-0020.service
if test ! -e /home/root/pi-ink-rollback-owned-0020; then mkdir /home/root/pi-ink-rollback-owned-0020; cp -p "$payload_position/owner.txt" /home/root/pi-ink-rollback-owned-0020/owner.txt; fi
if test -e /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next; then mv /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0020-next /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0020-next; fi
if test -e /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next; then mv /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd.0023-ui-next /home/root/pi-ink-rollback-owned-0020/interrupted-patch.0023-ui-next; fi
if test "$adapter_position" = /home/root/xovi/extensions.d/pi-ink-loopback-0020.so; then mv /home/root/xovi/extensions.d/pi-ink-loopback-0020.so /home/root/pi-ink-rollback-owned-0020/adapter.so; fi
if test "$patch_position" = /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd; then mv /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd /home/root/pi-ink-rollback-owned-0020/pi-ink-bridge.qmd; fi
if test "$payload_position" = /home/root/pi-ink-bridge-0020; then mv /home/root/pi-ink-bridge-0020 /home/root/pi-ink-bridge-retained-0020; fi
if test "$proxy_position" = /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so; then mv /home/root/pi-ink-webserver-remote-backup-0020/webserver-remote.so /home/root/xovi/extensions.d/webserver-remote.so; fi
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
test ! -e /home/root/xovi/extensions.d/pi-ink-loopback-0020.so
test ! -e /home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0020.qmd
test -d /home/root/pi-ink-bridge-retained-0020
before_pid=$(systemctl show xochitl -p MainPID --value)
# Renewed ALL-documents-saved/closed confirmation is required before this one request.
systemctl --no-block restart xochitl
printf '%s\n' 'X0CHITL_RESTART_REQUESTED_RESTORE_ORIGINAL'
restored_ready=0
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  active=$(systemctl show xochitl -p ActiveState --value)
  test "$active" != failed || exit 1
  pid=$(systemctl show xochitl -p MainPID --value)
  case "$pid" in ''|*[!0-9]*) pid=0 ;; esac
  if test "$active" = active && test "$pid" -gt 1 && test "$pid" != "$before_pid" && test -r "/proc/$pid/maps"; then
    original_mapped=0
    while IFS= read -r line; do
      case "$line" in
        */home/root/xovi/extensions.d/pi-ink-loopback-0020.so*) printf '%s\n' 'ABORT: owned adapter still mapped after restoration'; exit 1 ;;
        */home/root/xovi/extensions.d/webserver-remote.so*) original_mapped=1 ;;
      esac
    done < "/proc/$pid/maps"
    if test "$original_mapped" -eq 1; then restored_ready=1; break; fi
  fi
  sleep 1
done
test "$restored_ready" -eq 1
printf 'ORIGINAL_PROXY_RESTORED PID=%s; wildcard HTTP behavior was explicitly accepted; experiment/client state retained\n' "$pid"
