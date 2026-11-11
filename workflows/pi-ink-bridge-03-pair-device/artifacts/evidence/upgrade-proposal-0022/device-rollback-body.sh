guard_environment; guard_stage; guard_stopped; verify_private
journal require STOP_REQUESTED
journal forbid LAUNCH_REQUESTED
rollback_one() {
 destination=$1; old_destination=$2; new_destination=$3; original_id=$4; new_id=$5; rollback_id=$6; rollback_source=$7
 actual_id=$(identity "$destination")
 if [ "$actual_id" = "$original_id" ] || [ "$actual_id" = "$rollback_id" ]; then
  guard_link "$destination" "$old_destination" "$actual_id"
  return
 fi
 guard_link "$destination" "$new_destination" "$new_id"
 journal require BACKUP_COMPLETE
 verify_backup
 guard_link "$rollback_source" "$old_destination" "$rollback_id"
 mv -T -f "$rollback_source" "$destination"
 guard_link "$destination" "$old_destination" "$rollback_id"
}
journal append ROLLBACK_REQUESTED
rollback_one "$link1" "$old/app" "$target/app" "$old1" "$(record new1.id)" "$(record rollback1.id)" "$stage/rollback-1"
rollback_one "$link2" "$old/sidebar.qmd" "$target/sidebar.qmd" "$old2" "$(record new2.id)" "$(record rollback2.id)" "$stage/rollback-2"
guard_environment; guard_stage; guard_stopped; guard_restored_links; verify_private
journal append ROLLBACK_COMPLETE
printf 'PRELAUNCH_LINK_ROLLBACK_COMPLETE_UI_REMAINS_STOPPED\n'
