launch_mode=${1-}
case "$launch_mode" in new|old) ;; *) fail launch_mode;; esac
guard_environment; guard_stage; guard_stopped; verify_private
journal forbid LAUNCH_REQUESTED
if [ "$launch_mode" = new ]; then
 journal require CUTOVER_COMPLETE
 guard_release; guard_new_links; verify_backup
else
 journal require ROLLBACK_COMPLETE
 guard_restored_links
fi
# This marker prohibits all prelaunch rollback, even if the start command fails.
journal append LAUNCH_REQUESTED
journal append "LAUNCH_MODE_$launch_mode"
systemctl start xochitl.service
journal append START_RETURNED
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail UI_not_active
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail UI_not_running
new_ui_pid=$(systemctl show xochitl.service -p MainPID --value)
case "$new_ui_pid" in ''|0|*[!0-9]*) fail UI_PID_invalid;; esac
[ "$new_ui_pid" != 7146 ] || fail UI_generation_unchanged
verify_identity_files
if [ -e "$base/state.json" ] || [ -L "$base/state.json" ]; then
 [ -f "$base/state.json" ] && [ ! -L "$base/state.json" ] || fail state_type
 [ "$(stat -c '%u:%g:%a' "$base/state.json")" = 0:0:600 ] || fail state_permissions
 [ "$(stat -c %s "$base/state.json")" -le 2097152 ] || fail state_size
 stat -c 'POST_START_STATE|%F|%u|%g|%a|%s|%d|%i' "$base/state.json"
 sha256sum "$base/state.json"
else
 printf 'POST_START_STATE=absent\n'
fi
journal append UI_START_COMPLETE
printf 'UI_START_COMPLETE|mode=%s|pid=%s|native_pairing_unverified\n' "$launch_mode" "$new_ui_pid"
