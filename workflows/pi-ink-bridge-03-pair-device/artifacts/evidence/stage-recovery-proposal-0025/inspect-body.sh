# No stage, service, link or private-data mutation is permitted in this probe.
command -v grep >/dev/null || fail marker_scan_unavailable
scan_staging_shells() {
 root_shells=0; stage_shells=0
 for candidate in /proc/[0-9]*; do
  if ! IFS= read -r process_name < "$candidate/comm"; then
   [ ! -d "$candidate" ] && continue
   fail process_name_unreadable
  fi
  case "$process_name" in sh|ash|bash|dash) ;; *) continue;; esac
  effective_uid=''
  while IFS= read -r status_line; do
   case "$status_line" in Uid:*) set -- $status_line; effective_uid=$3;; esac
  done < "$candidate/status" || { [ ! -d "$candidate" ] && continue; fail process_status_unreadable; }
  [ "$effective_uid" = 0 ] || continue
  root_shells=$((root_shells + 1)); [ "$root_shells" -le 32 ] || fail root_shell_scan_limit
  if grep -F -q -e 'pi-ink-bridge-03-upgrade-0022-8468df658f658820' -e '4f65412401b95f2ae09aeea3c58cf9faa814fcb9ebe457c1044527e090d468ae' "$candidate/cmdline"; then
   stage_shells=$((stage_shells + 1))
   printf 'ACTIVE_STAGING_SHELL_PID=%s\n' "${candidate##*/}"
  else
   code=$?
   if [ "$code" != 1 ] && [ -d "$candidate" ]; then fail staging_liveness_unknown; fi
  fi
 done
 [ "$stage_shells" = 0 ]
}
if ! scan_staging_shells; then
 printf 'RECOVERY_BOUNDARY=active_staging_process\nREAD_ONLY_RECOVERY_INSPECTION_COMPLETE\n'
 exit 0
fi
guard_environment; guard_old_links; verify_private
absent "$backup"
systemctl show xochitl.service -p ActiveState -p SubState -p MainPID -p ExecMainStartTimestampMonotonic
[ "$(systemctl show xochitl.service -p MainPID --value)" = 7146 ] || fail UI_generation_changed
[ "$(systemctl show xochitl.service -p ExecMainStartTimestampMonotonic --value)" = 5286136652 ] || fail UI_start_changed
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail UI_not_active
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail UI_not_running
frame_capable=0
if command -v base64 >/dev/null; then
 decoded=$(printf '%s' 'cGktaW5rLWZyYW1l' | base64 -d) || fail base64_decode
 [ "$decoded" = 'pi-ink-frame' ] || fail base64_result
 read_probe=$(printf '%053584d\nTAIL' 0 | { IFS= read -r line || exit 41; [ "${#line}" = 53584 ] || exit 41; cat; }) || fail framed_read
 [ "$read_probe" = TAIL ] || fail framed_read_remainder
 frame_capable=1
fi
printf 'FRAME_CAPABLE=%s\n' "$frame_capable"
if [ ! -e "$stage" ] && [ ! -L "$stage" ]; then
 if [ ! -e "$target" ] && [ ! -L "$target" ]; then boundary=untouched; else boundary=partial_or_foreign; fi
else
 stat -c 'STAGE_META|%F|%u|%g|%a|%d|%i' "$stage"
 boundary=partial_or_foreign
 if [ -d "$stage" ] && [ ! -L "$stage" ] && [ "$(stat -c '%u:%g:%a' "$stage")" = 0:0:700 ] && [ -f "$stage/transaction" ] && [ ! -L "$stage/transaction" ] && [ "$(stat -c '%u:%g:%a' "$stage/transaction")" = 0:0:600 ] && [ "$(stat -c %s "$stage/transaction")" -le 256 ]; then
  if hash_file "$stage/transaction" "$transaction_hash" >/dev/null 2>&1; then
   guard_stage
   if [ -f "$stage/journal" ] && [ ! -L "$stage/journal" ] && [ "$(stat -c '%u:%g:%a' "$stage/journal")" = 0:0:600 ] && [ "$(stat -c %s "$stage/journal")" -le 4096 ]; then
    complete=0; stop=0; launch=0
    while IFS= read -r entry; do
     case "$entry" in STAGING_COMPLETE) complete=1;; STOP_REQUESTED) stop=1;; LAUNCH_REQUESTED) launch=1;; esac
    done < "$stage/journal"
    printf 'OWNED_STAGE_FLAGS|complete=%s|stop=%s|launch=%s\n' "$complete" "$stop" "$launch"
    if [ "$complete:$stop:$launch" = 1:0:0 ]; then
     guard_release
     guard_link "$stage/new-1" "$target/app" "$(record new1.id)"
     guard_link "$stage/new-2" "$target/sidebar.qmd" "$(record new2.id)"
     guard_link "$stage/rollback-1" "$old/app" "$(record rollback1.id)"
     guard_link "$stage/rollback-2" "$old/sidebar.qmd" "$(record rollback2.id)"
     hash_file "$stage/transport.zip" "$transport_hash"
     hash_file "$stage/client.zip" '8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962'
     hash_file "$stage/production-install.sh" 'b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae'
     boundary=complete_owned_stage
    fi
   fi
  fi
 fi
fi
if ! scan_staging_shells; then boundary=active_staging_process; fi
printf 'RECOVERY_BOUNDARY=%s\nREAD_ONLY_RECOVERY_INSPECTION_COMPLETE\n' "$boundary"
