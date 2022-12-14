#!/bin/sh

for service in ~/.config/systemd/user/*.service; do
    chmod 700 $service
    systemctl --user stop $(basename "${service}")
    systemctl --user add-wants autostart.target $(basename "${service}")
done
systemctl --user daemon-reload