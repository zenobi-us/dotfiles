#!/bin/sh
set -eu
export LC_ALL=C
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
printf '%s\n' OWNED_UNIT_STATE
systemctl show pi-ink-0054.service -p LoadState -p ActiveState -p SubState -p Result -p ExecMainCode -p ExecMainStatus -p InvocationID || printf '%s\n' UNIT_QUERY_FAILED
printf '%s\n' OWNED_INVOCATION_LOGS_MAX30
if command -v journalctl >/dev/null; then
    journalctl --no-pager -o cat -n 30 _SYSTEMD_INVOCATION_ID=343b3895861e4d138740268b7c193a60
else
    printf '%s\n' JOURNAL_COMMAND_UNAVAILABLE
fi
printf '%s\n' UI_PORT9821_LISTENER_ONLY
found=0
for table in /proc/net/tcp /proc/net/tcp6; do
    while read -r slot local remote state rest; do
        if test "$state" = 0A; then
            case "$local" in *:265D) printf 'LISTEN %s\n' "$local"; found=1 ;; esac
        fi
    done < "$table"
done
printf 'UI_LISTENER_FOUND %s\n' "$found"
printf '%s\n' LOOPBACK_STATE_HTTP_CODE_NO_BODY
http=UNAVAILABLE
if command -v curl >/dev/null; then
    if http=$(curl --noproxy '*' --silent --show-error --connect-timeout 2 --max-time 3 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:9821/state); then :; else printf '%s\n' HTTP_PROBE_FAILED; fi
fi
printf 'HTTP_CODE %s\n' "$http"
if test "$(systemctl show pi-ink-0054.service -p ActiveState --value)" = active && test "$found" = 1 && test "$http" = 200; then
    printf '%s\n' BACKEND_STATE_ENDPOINT_HEALTHY_UI_FAILURE_NOT_EXPLAINED
else
    printf '%s\n' BACKEND_BOUNDARY_UNHEALTHY
    exit 12
fi
