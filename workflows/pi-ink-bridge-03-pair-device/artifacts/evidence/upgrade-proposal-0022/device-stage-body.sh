guard_environment
guard_old_links
verify_private
absent "$stage"; absent "$backup"; absent "$target"
[ "$(stat -c %d "$base/releases")" = 65026 ] || fail release_filesystem
[ "$(df -Pk /home/root | { read -r header; read -r filesystem total used available rest; printf '%s' "$available"; })" -ge 65536 ] || fail space
umask 077
mkdir -m 700 "$stage"
save_record stage.id "$(identity "$stage")"
save_record transaction 'pi-ink-bridge-03-upgrade-0022-8468df658f658820'
(set -C; : > "$stage/journal")
journal append STAGING_CREATED
(set -C; cat > "$stage/transport.zip")
hash_file "$stage/transport.zip" "$transport_hash"
(set -C; unzip -p "$stage/transport.zip" client.zip > "$stage/client.zip")
(set -C; unzip -p "$stage/transport.zip" production-install.sh > "$stage/production-install.sh")
hash_file "$stage/client.zip" '8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962'
hash_file "$stage/production-install.sh" 'b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae'
# The installer is provenance only. Never execute it against occupied launchers.
mkdir -m 700 "$stage/payload" "$stage/payload/app" "$stage/payload/app/backend"
while IFS='|' read -r mode size digest name; do
 (set -C; unzip -p "$stage/client.zip" "$name" > "$stage/payload/$name")
 chmod "$mode" "$stage/payload/$name"
done <<EOF
$members
EOF
verify_payload "$stage/payload"
[ "$(cat "$stage/payload/VERSION")" = 0.5.0 ] || fail version
# Prove no-clobber and same-filesystem rename only on these new owned files.
(set -C; printf a > "$stage/probe-a"; printf b > "$stage/probe-b")
probe_a=$(identity "$stage/probe-a"); probe_b=$(identity "$stage/probe-b")
mv -T -n "$stage/probe-a" "$stage/probe-b"
[ "$(identity "$stage/probe-a")" = "$probe_a" ] && [ "$(identity "$stage/probe-b")" = "$probe_b" ] || fail rename_clobbered
[ "$(cat "$stage/probe-b")" = b ] || fail rename_content
mv -T -n "$stage/probe-a" "$stage/probe-c"
[ "$(identity "$stage/probe-c")" = "$probe_a" ] || fail rename_inode
absent "$stage/probe-a"
[ "$(stat -c %d "$stage/payload")" = 65026 ] || fail payload_filesystem
payload_identity=$(identity "$stage/payload")
absent "$target"
mv -T -n "$stage/payload" "$target"
[ "$(identity "$target")" = "$payload_identity" ] || fail publish_identity
absent "$stage/payload"
save_record release.id "$payload_identity"
for pair in 1 2; do
 case "$pair" in 1) suffix=app;; 2) suffix=sidebar.qmd;; esac
 ln -s "$target/$suffix" "$stage/new-$pair"
 ln -s "$old/$suffix" "$stage/rollback-$pair"
 save_record "new$pair.id" "$(identity "$stage/new-$pair")"
 save_record "rollback$pair.id" "$(identity "$stage/rollback-$pair")"
done
guard_stage; guard_release; guard_old_links; verify_private
journal append STAGING_COMPLETE
printf 'IMMUTABLE_RELEASE_STAGED_NO_CUTOVER\n'
