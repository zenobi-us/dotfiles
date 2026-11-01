#!/bin/sh
# Activate only the temporary probe dependencies. Keep existing patches disabled.
set -eu
runtime=/home/root/pi-ink-bridge-pen-prototype-runtime
unit=/run/systemd/system/pi-ink-pen-prototype-ui.service
[ ! -e "$runtime" ]
[ ! -e "$unit" ]
[ -s /home/root/xovi/exthome/qt-resource-rebuilder/hashtab ]
umask 077
mkdir -p "$runtime/extensions.d" "$runtime/exthome/appload" "$runtime/exthome/qt-resource-rebuilder"
for extension in appload qt-resource-rebuilder qt-command-executor; do
    ln -s "/home/root/xovi/extensions.d/$extension.so" "$runtime/extensions.d/$extension.so"
done
ln -s /home/root/xovi/exthome/appload/pi-ink-bridge-pen-prototype "$runtime/exthome/appload/pi-ink-bridge-pen-prototype"
ln -s /home/root/xovi/exthome/qt-resource-rebuilder/hashtab "$runtime/exthome/qt-resource-rebuilder/hashtab"
cat > "$runtime/rollback.sh" <<'ROLLBACK'
#!/bin/sh
set -eu
systemctl stop pi-ink-pen-prototype-ui.service
systemctl start xochitl
logger -t pi-ink-pen-prototype 'Restored the original Xochitl configuration.'
ROLLBACK
# A separate unit avoids Xochitl's normal failure and reboot actions.
# Its stop action restores the original service, even after a native crash.
systemctl_bin=$(command -v systemctl)
cat > "$unit" <<CONFIG
[Unit]
Description=Temporary Pi Ink pen probe
Conflicts=xochitl.service
After=xochitl.service
[Service]
Type=simple
Restart=no
Environment="LD_PRELOAD=/home/root/xovi/xovi.so"
Environment="XOVI_ROOT=$runtime"
Environment="QML_DISABLE_DISK_CACHE=1"
ExecStart=/usr/bin/xochitl --system
ExecStopPost=$systemctl_bin --no-block start xochitl
CONFIG
systemctl daemon-reload
systemd-run --unit=pi-ink-pen-prototype-rollback --on-active=120s /bin/sh "$runtime/rollback.sh"
systemctl start pi-ink-pen-prototype-ui.service
systemctl show pi-ink-pen-prototype-ui.service -p ActiveState -p SubState -p MainPID -p Environment -p OnFailure
