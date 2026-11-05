#!/usr/bin/env python3
"""Prepare private fixed-path phase scripts on the host. Never connect to a device.

Generated stage script embeds private config. Keep its output directory outside Git.
No candidate executable or install.sh is ever executed.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import tarfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('candidate', 'runtime-config', 'runtime-sha256', 'public-ca', 'ca-sha256', 'output'):
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--pdf-sha256', action='append', required=True)
    args = parser.parse_args()
    manifest_path = Path(__file__).with_name('installer-operation-manifest.json')
    manifest = json.loads(manifest_path.read_text())
    for value in args.pdf_sha256:
        digest(value)
    candidate = checked_file(args.candidate, manifest['candidate']['payload']['sha256'])
    outer = unpack(candidate, manifest['candidate']['files'])
    inner = unpack(outer['bundle.tar.gz'], manifest['nested_files'])
    config_bytes = checked_file(args.runtime_config, args.runtime_sha256, private=True)
    ca = checked_file(args.public_ca, args.ca_sha256)
    validate_config(config_bytes, args.pdf_sha256)
    require(b'-----BEGIN CERTIFICATE-----' in ca and b'PRIVATE KEY' not in ca, 'Public CA must contain a certificate, not a key')
    destination = Path(args.output).absolute()
    require(not destination.is_relative_to(Path(__file__).resolve().parents[5]), 'Private output must be outside the repository')
    safe_parents(destination.parent)
    destination.mkdir(mode=0o700)
    files = {
        'payload/pi-ink-client': inner['pi-ink-client'],
        'tablet-qml/PiInkToolbar.qml': outer['tablet-qml/PiInkToolbar.qml'],
        'payload/pi-ink-bridge.qmd': outer['tablet-qml/pi-ink-bridge.qmd'],
        'payload/pi-ink-loopback.so': outer['tablet-adapter/pi-ink-loopback.so'],
        'runtime.json': config_bytes, 'desktop-ca.pem': ca,
    }
    common = common_script(manifest)
    stage = stage_script(manifest, common, files)
    activate = activate_script(manifest, common, files)
    restore = restore_script(manifest, common, files)
    hashes = {}
    for name, content in [('device-stage.sh', stage), ('device-activate.sh', activate), ('device-restore.sh', restore)]:
        data = content.encode()
        private_write(destination / name, data)
        hashes[name] = sha(data)
    private_write(destination / 'installer-input-bindings.json', (json.dumps({
        'candidate_sha256': sha(candidate), 'runtime_sha256': sha(config_bytes),
        'public_ca_sha256': sha(ca), 'synthetic_pdf_sha256s': args.pdf_sha256,
        'scripts': hashes, 'device_execution': False,
    }, indent=2) + '\n').encode())
    print('HOST_PREPARED_NO_DEVICE_EXECUTION')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(value):
    require(re.fullmatch('[0-9a-f]{64}', value) is not None, 'SHA256 must contain 64 lowercase hexadecimal characters')


def safe_parents(path):
    for item in (path, *path.parents):
        require(item.is_dir() and not item.is_symlink(), 'Path ancestor must be a real directory')


def checked_file(path, expected, private=False):
    digest(expected)
    path = Path(path).absolute()
    safe_parents(path.parent)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        require(stat.S_ISREG(info.st_mode), 'Input must be a regular file')
        if private:
            require(stat.S_IMODE(info.st_mode) == 0o600 and info.st_uid == os.getuid(), 'Runtime config must be owner-owned mode 0600')
            require(stat.S_IMODE(path.parent.stat().st_mode) == 0o700, 'Runtime config parent must be mode 0700')
        data = stream.read()
    require(sha(data) == expected, 'Input SHA256 mismatch')
    return data


def unpack(data, expected):
    result = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            require(not path.is_absolute() and '..' not in path.parts and str(path) == member.name, 'Unsafe archive path')
            require(member.isfile() and member.name in expected and member.name not in result, 'Unexpected, duplicate, or nonregular archive member')
            spec = expected[member.name]
            require(member.size == spec['bytes'], 'Archive member size mismatch')
            content = archive.extractfile(member).read()
            require(sha(content) == spec['sha256'], 'Archive member SHA256 mismatch')
            result[member.name] = content
    require(set(result) == set(expected), 'Missing archive member')
    return result


def validate_config(data, pdf):
    config = json.loads(data)
    require(set(config) == {'deviceId', 'statePath', 'uiAddress', 'servers', 'syntheticAllowlist'}, 'Unexpected runtime config fields')
    require(config['deviceId'] == 'paper-pro-ink-0054' and config['statePath'] == '/home/root/pi-ink-bridge-0049/state.json' and config['uiAddress'] == '127.0.0.1:9821', 'Runtime identity or path mismatch')
    require(config['syntheticAllowlist'] == pdf, 'Runtime must allow only the exact pending PDF hashes')
    require(isinstance(config['servers'], list) and len(config['servers']) == 1, 'Configure exactly one desktop server')
    server = config['servers'][0]
    require(set(server).issubset({'serverId', 'name', 'origin', 'ca', 'token'}) and {'serverId', 'name', 'origin', 'ca'}.issubset(server), 'Unexpected server fields')
    require(isinstance(server['serverId'], str) and bool(server['serverId']) and isinstance(server['name'], str), 'Desktop identity is required')
    require(server['origin'] == 'https://192.168.86.35:47842' and server['ca'] == '/home/root/pi-ink-bridge-0049/desktop-ca.pem' and not server.get('token'), 'Desktop trust path or initial token mismatch')


def private_write(path, data):
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'wb') as stream:
        stream.write(data)


def check(path, value, metadata=None):
    text = f'regular {path}\nprintf "%s  %s\\n" {value} {path} | sha256sum -c - >/dev/null\n'
    if metadata:
        text += f'test "$(stat -c "%a %u %g %s" {path})" = "{metadata}"\n'
    return text


def gates(manifest, phase):
    words = manifest['approvals'][phase]
    return f'test "$#" -eq {len(words)} || fail "Approval arguments required"\n' + ''.join(f'test "${i}" = "{word}" || fail "Approval mismatch"\n' for i, word in enumerate(words, 1))


def common_script(manifest):
    text = '''#!/bin/sh
# PROPOSED ONLY. Run once after exact owner approval. Failures retain partial state.
set -eu
umask 077
export LC_ALL=C
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
fail() { printf '%s\n' "$1" >&2; exit 1; }
absent() { test ! -e "$1" && test ! -L "$1" || fail 'Path collision'; }
parents() {
    p=$1
    while test "$p" != /; do
        test -d "$p" && test ! -L "$p" || fail 'Unsafe ancestor'
        p=${p%/*}; test -n "$p" || p=/
    done
}
regular() { test -f "$1" && test ! -L "$1" || fail "Expected regular file: $1"; parents "${1%/*}"; }
copy_new() { absent "$2"; (set -C; cat "$1" > "$2"); chmod "$3" "$2"; }
root=/home/root/pi-ink-bridge-0049
client=/home/root/pi-ink-client/pi-ink-client
version=/home/root/pi-ink-client/VERSION
client_install=/home/root/pi-ink-client/.pi-ink-client-0054-install
client_restore=/home/root/pi-ink-client/.pi-ink-client-0054-restore
extension=/home/root/xovi/extensions.d/webserver-remote.so
qmd=/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd
adapter=/home/root/xovi/extensions.d/pi-ink-loopback.so
unit=pi-ink-0054.service
test "$(id -u)" = 0 || fail 'Root required'
for executable in cat chmod cmp cp id mkdir mv rm sha256sum sleep stat systemctl systemd-run; do
    command -v "$executable" >/dev/null || fail "Required command unavailable: $executable"
done
for directory in /home/root /home/root/pi-ink-client /home/root/xovi/extensions.d /home/root/xovi/exthome/qt-resource-rebuilder; do parents "$directory"; done
baseline() {
    test "$(. /etc/os-release; printf '%s' "$IMG_VERSION")" = 3.28.0.172
'''
    text += check('/usr/bin/xochitl', manifest['candidate']['stockBinarySHA256'])
    text += check('/home/root/xovi/exthome/qt-resource-rebuilder/hashtab', manifest['candidate']['hashtabSHA256'])
    text += check('/home/root/xovi/xovi.so', 'd4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446')
    for name in manifest['absent_qmds']:
        text += f'absent /home/root/xovi/exthome/qt-resource-rebuilder/{name}\n'
    for item in manifest['retained_qmds']:
        text += check('/home/root/xovi/exthome/qt-resource-rebuilder/' + item['name'], item['sha256'])
    for name, value in manifest['retained_extensions'].items():
        text += check('/home/root/xovi/extensions.d/' + name, value)
    extension_names = '|'.join(manifest['retained_extensions'])
    text += f'''for file in /home/root/xovi/extensions.d/* /home/root/xovi/extensions.d/.[!.]* /home/root/xovi/extensions.d/..?*; do
    test -e "$file" || test -L "$file" || continue
    case "${{file##*/}}" in {extension_names}) ;; webserver-remote.so) test "$1" = inactive ;; pi-ink-loopback.so) test "$1" = active ;; *) fail 'Unexpected extension layout' ;; esac
done
'''
    names = '|'.join(x['name'] for x in manifest['retained_qmds'])
    text += f'''for file in /home/root/xovi/exthome/qt-resource-rebuilder/*.qmd /home/root/xovi/exthome/qt-resource-rebuilder/.*.qmd; do
    test -e "$file" || test -L "$file" || continue
    case "${{file##*/}}" in {names}) ;; pi-ink-bridge-0049.qmd) test "$1" = active ;; *) fail 'Unexpected QMD layout' ;; esac
done
}}
unit_absent() {{
    test "$(systemctl show "$unit" -p LoadState --value)" = not-found || fail 'Unit collision'
    for file in /run/systemd/transient/$unit /etc/systemd/system/$unit /usr/lib/systemd/system/$unit; do absent "$file"; done
}}
ui_port_free() {{
    # Fixed listening socket metadata only. Never resolve owners or kill processes.
    for table in /proc/net/tcp /proc/net/tcp6; do
        test -r "$table" || fail 'Socket metadata unavailable'
        while read -r slot local remote state rest; do
            if test "$state" = 0A; then
                case "$local" in *:265D) fail 'UI port9821 occupied; preserve owner' ;; esac
            fi
        done < "$table"
    done
}}
stock_listeners_private() {{
    found=0
    for table in /proc/net/tcp /proc/net/tcp6; do
        while read -r slot local remote state rest; do
            if test "$state" = 0A; then
                case "$local" in
                    *:0050) fail 'Port80 still listening after approved restart; preserve state' ;;
                    *:0051)
                        test "$local" = 0100007F:0051 || fail 'Stock port81 is not IPv4 loopback'
                        found=1
                        ;;
                esac
            fi
        done < "$table"
    done
    test "$found" = 1 || fail 'Private stock listener unavailable; preserve state'
}}
owned_unit() {{
    test "$(systemctl show "$unit" -p Transient --value)" = yes
    test "$(systemctl show "$unit" -p Description --value)" = 'Pi Ink tablet activation 0054 owned transient runtime'
    regular "$root/unit.invocation"
    test "$(systemctl show "$unit" -p InvocationID --value)" = "$(cat "$root/unit.invocation")"
    test -s "$root/unit.invocation"
}}
'''
    return text


def preserved_stage():
    return '''regular "$version"
cp -p "$version" "$root/backups/VERSION"
stat -c '%a %u %g %s %Y' "$version" > "$root/backups/VERSION.metadata"
systemctl cat xochitl > "$root/backups/xochitl.service.txt"
test -s "$root/backups/xochitl.service.txt"
# Refuse an unprepared loader rather than changing services or invoking xovi/start.
case "$(systemctl show xochitl -p Environment --value)" in *LD_PRELOAD=/home/root/xovi/xovi.so*XOVI_ROOT=/home/root/xovi/services/xochitl.service/*) ;; *) fail 'XOVI loader prerequisite unresolved' ;; esac
'''


def preserved_check():
    return '''regular "$version"
regular "$root/backups/VERSION"
cmp "$version" "$root/backups/VERSION"
test "$(stat -c '%a %u %g %s %Y' "$version")" = "$(cat "$root/backups/VERSION.metadata")"
systemctl cat xochitl > "$root/current-service.txt"
cmp "$root/current-service.txt" "$root/backups/xochitl.service.txt"
'''


def transfer_bytes(path, data):
    # POSIX printf avoids optional firmware decoders and external argv size limits.
    lines = [f'absent "{path}"\nset -C\nexec 3> "{path}"\nset +C\n']
    for offset in range(0, len(data), 1024):
        octets = ''.join(f'\\0{byte:03o}' for byte in data[offset:offset + 1024])
        lines.append(f"printf '%b' '{octets}' >&3\n")
    lines.append('exec 3>&-\n')
    return ''.join(lines)


def stage_script(manifest, common, files):
    text = common + gates(manifest, 'stage') + 'baseline inactive\nunit_absent\nui_port_free\nabsent "$qmd"\nabsent "$adapter"\nabsent "$client_install"\nabsent "$client_restore"\n'
    for path, spec in manifest['originals'].items():
        text += check(path, spec['sha256'], spec['metadata'])
    text += '''partial=/home/root/pi-ink-bridge-0049.partial-stage0058
absent "$partial"
for directory in "$root" "$root/payload" "$root/tablet-qml" "$root/backups"; do
    parents "$directory"
    test "$(stat -c '%a %u %g' "$directory")" = '700 0 0'
done
for entry in "$root"/* "$root"/.[!.]* "$root"/..?*; do
    test -e "$entry" || test -L "$entry" || continue
    case "${entry##*/}" in owner|payload|tablet-qml|backups) ;; *) fail 'Unexpected partial stage entry; preserve state' ;; esac
done
for entry in "$root/payload"/* "$root/payload"/.[!.]* "$root/payload"/..?*; do
    test -e "$entry" || test -L "$entry" || continue
    case "${entry##*/}" in pi-ink-client) ;; *) fail 'Unexpected partial payload; preserve state' ;; esac
done
for entry in "$root/tablet-qml"/* "$root/tablet-qml"/.[!.]* "$root/tablet-qml"/..?*; do
    test -e "$entry" || test -L "$entry" || continue
    fail 'Unexpected partial QML; preserve state'
done
for entry in "$root/backups"/* "$root/backups"/.[!.]* "$root/backups"/..?*; do
    test -e "$entry" || test -L "$entry" || continue
    case "${entry##*/}" in pi-ink-client|webserver-remote.so|VERSION|VERSION.metadata|xochitl.service.txt) ;; *) fail 'Unexpected partial backup; preserve state' ;; esac
done
'''
    text += check('/home/root/pi-ink-bridge-0049/owner', sha(b'tablet-activation-0054\n'), '600 0 0 23')
    text += check('/home/root/pi-ink-bridge-0049/payload/pi-ink-client', sha(b''), '600 0 0 0')
    for original, backup in [('/home/root/pi-ink-client/pi-ink-client', 'pi-ink-client'), ('/home/root/xovi/extensions.d/webserver-remote.so', 'webserver-remote.so')]:
        spec = manifest['originals'][original]
        text += check('/home/root/pi-ink-bridge-0049/backups/' + backup, spec['sha256'], spec['metadata'])
    text += '''regular "$root/backups/VERSION"
regular "$root/backups/VERSION.metadata"
regular "$root/backups/xochitl.service.txt"
cmp "$version" "$root/backups/VERSION"
test "$(stat -c '%a %u %g %s %Y' "$version")" = "$(cat "$root/backups/VERSION.metadata")"
test -s "$root/backups/xochitl.service.txt"
test "$(systemctl cat xochitl | sha256sum)" = "$(sha256sum < "$root/backups/xochitl.service.txt")"
mv "$root" "$partial"
printf '%s\n' PARTIAL_STAGE0058_PRESERVED
'''
    text += '''regular "$version"
mkdir -m 700 "$root"
printf '%s\n' 'tablet-activation-0054' > "$root/owner"
mkdir -m 700 "$root/payload" "$root/tablet-qml" "$root/backups"
cp -p "$client" "$root/backups/pi-ink-client"
cp -p "$extension" "$root/backups/webserver-remote.so"
'''
    text += preserved_stage()
    for relative, data in files.items():
        text += transfer_bytes('$root/' + relative, data)
        text += check('/home/root/pi-ink-bridge-0049/' + relative, sha(data))
    text += 'printf "%s\\n" staged > "$root/staged"\nprintf "%s\\n" STAGED_ACTIVE_PATHS_UNCHANGED\n'
    return text


def verify_staged(files):
    return ''.join(check('/home/root/pi-ink-bridge-0049/' + relative, sha(data)) for relative, data in files.items())


def activate_script(manifest, common, files):
    text = common + gates(manifest, 'activate') + '''parents "$root/backups"
test "$(cat "$root/owner")" = tablet-activation-0054
regular "$root/staged"
absent "$root/activation-attempted"
absent "$root/quarantine-webserver-remote.so"
absent "$root/unit.invocation"
absent "$root/activated"
baseline inactive
unit_absent
absent "$qmd"
absent "$adapter"
'''
    text += verify_staged(files) + preserved_check()
    for path, spec in manifest['originals'].items():
        text += check(path, spec['sha256'], spec['metadata'])
        text += check('/home/root/pi-ink-bridge-0049/backups/' + Path(path).name, spec['sha256'], spec['metadata'])
    text += '''# Retained baseline has stock loopback81 and an original proxy on80.
# Do not identify or kill owners. Require private stock bindings after restart.
ui_port_free
absent "$client_install"
absent "$client_restore"
printf '%s\n' attempted > "$root/activation-attempted"
copy_new "$root/payload/pi-ink-client" "$client_install" 700
mv "$extension" "$root/quarantine-webserver-remote.so"
# Atomic replacement leaves an already running old executable's inode untouched.
mv -f "$client_install" "$client"
copy_new "$root/payload/pi-ink-bridge.qmd" "$qmd" 644
copy_new "$root/payload/pi-ink-loopback.so" "$adapter" 644
systemctl restart xochitl
sleep 8
systemctl is-active --quiet xochitl
stock_listeners_private
unit_absent
systemd-run --unit=pi-ink-0054.service --description='Pi Ink tablet activation 0054 owned transient runtime' --property=Restart=no --property=UMask=0077 /home/root/pi-ink-client/pi-ink-client serve --config /home/root/pi-ink-bridge-0049/runtime.json
systemctl show "$unit" -p InvocationID --value > "$root/unit.invocation"
owned_unit
systemctl is-active --quiet "$unit"
'''
    text += check('/home/root/pi-ink-client/pi-ink-client', manifest['nested_files']['pi-ink-client']['sha256'])
    text += 'baseline active\nprintf "%s\\n" activated > "$root/activated"\nprintf "%s\\n" ACTIVATED_HARDWARE_ACCEPTANCE_UNPROVED\n'
    return text


def restore_script(manifest, common, files):
    text = common + gates(manifest, 'restore') + '''parents "$root/backups"
test "$(cat "$root/owner")" = tablet-activation-0054
regular "$root/activated"
absent "$root/restore-attempted"
absent "$root/restored"
baseline active
owned_unit
absent "$extension"
'''
    text += preserved_check()
    text += check('/home/root/pi-ink-client/pi-ink-client', manifest['nested_files']['pi-ink-client']['sha256'])
    text += check('/home/root/xovi/exthome/qt-resource-rebuilder/pi-ink-bridge-0049.qmd', sha(files['payload/pi-ink-bridge.qmd']))
    text += check('/home/root/xovi/extensions.d/pi-ink-loopback.so', sha(files['payload/pi-ink-loopback.so']))
    for path, spec in manifest['originals'].items():
        text += check('/home/root/pi-ink-bridge-0049/backups/' + Path(path).name, spec['sha256'], spec['metadata'])
    text += check('/home/root/pi-ink-bridge-0049/quarantine-webserver-remote.so', manifest['originals']['/home/root/xovi/extensions.d/webserver-remote.so']['sha256'], '644 0 0 8453696')
    text += '''printf '%s\n' attempted > "$root/restore-attempted"
systemctl stop "$unit"
test "$(systemctl show "$unit" -p ActiveState --value)" = inactive
absent "$client_restore"
cp -p "$root/backups/pi-ink-client" "$client_restore"
mv -f "$client_restore" "$client"
cp -p "$root/backups/webserver-remote.so" "$extension"
rm "$qmd"
rm "$adapter"
systemctl restart xochitl
systemctl is-active --quiet xochitl
'''
    for path, spec in manifest['originals'].items():
        text += check(path, spec['sha256'], spec['metadata'])
    text += '''baseline inactive
printf '%s\n' restored > "$root/restored"
printf '%s\n' RESTORED_PRIVATE_STATE_AND_BACKUPS_RETAINED
'''
    return text


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError, tarfile.TarError):
        raise SystemExit('Preparation refused. Check private inputs and exact candidate layout; no device action occurred.')
