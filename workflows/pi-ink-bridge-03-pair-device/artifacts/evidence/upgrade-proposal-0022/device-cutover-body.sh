guard_environment; guard_stage; guard_release; guard_old_links; verify_private
journal require STAGING_COMPLETE
journal forbid STOP_REQUESTED
journal forbid LAUNCH_REQUESTED
[ "$(systemctl show xochitl.service -p MainPID --value)" = 7146 ] || fail UI_generation_changed
[ "$(systemctl show xochitl.service -p ExecMainStartTimestampMonotonic --value)" = 5286136652 ] || fail UI_start_changed
[ "$(systemctl show xochitl.service -p ActiveState --value)" = active ] || fail UI_not_active
[ "$(systemctl show xochitl.service -p SubState --value)" = running ] || fail UI_not_running
[ "$(systemctl show xochitl.service -p KillMode --value)" = control-group ] || fail UI_stop_scope_changed
[ "$(systemctl show xochitl.service -p KillSignal --value)" = 15 ] || fail UI_signal_changed
[ "$(systemctl show xochitl.service -p SendSIGKILL --value)" = yes ] || fail UI_escalation_changed
[ "$(systemctl show xochitl.service -p TimeoutStopUSec --value)" = '1min 30s' ] || fail UI_timeout_changed
guard_owned_clients
# Owner must separately approve this unit stop, including its configured escalation.
journal append STOP_REQUESTED
systemctl stop xochitl.service
journal append STOP_RETURNED
guard_stopped
verify_private
absent "$backup"
mkdir -m 700 "$backup"
save_record backup.id "$(identity "$backup")"
for name in config.json server-ca.pem; do
 (set -C; cat "$base/$name" > "$backup/$name")
done
verify_private; verify_backup
journal append BACKUP_COMPLETE
guard_stopped; guard_old_links
guard_link "$stage/new-1" "$target/app" "$(record new1.id)"
journal append SWITCH_1_REQUESTED
mv -T -f "$stage/new-1" "$link1"
guard_link "$link1" "$target/app" "$(record new1.id)"
journal append SWITCH_1_VERIFIED
guard_stopped
guard_link "$link2" "$old/sidebar.qmd" "$old2"
guard_link "$stage/new-2" "$target/sidebar.qmd" "$(record new2.id)"
journal append SWITCH_2_REQUESTED
mv -T -f "$stage/new-2" "$link2"
guard_new_links
journal append SWITCH_2_VERIFIED
guard_environment; guard_stage; guard_release; guard_new_links; guard_stopped; verify_private; verify_backup
journal append CUTOVER_COMPLETE
printf 'QUIESCENT_CUTOVER_COMPLETE_UI_REMAINS_STOPPED\n'
