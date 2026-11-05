#!/bin/sh
# PROPOSED READ ONLY. No globbing, content reads, hashes, process scans or writes.
set -eu
export LC_ALL=C
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
for p in '/usr/bin/xochitl' '/home/root/xovi/exthome/qt-resource-rebuilder/hashtab' '/home/root/xovi/xovi.so' '/home/root/xovi/exthome/qt-resource-rebuilder/randomSleepScreen.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/betterToc.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableSend.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/link-touch-targets.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/linkFromSelection.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/quickSettingsBluetooth.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/bluetoothSettings.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/dockButtons.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/retaskableJump.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/floating.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/computed-widgets-01-live-document-probe.qmd' '/home/root/xovi/exthome/qt-resource-rebuilder/betterTocCollapse.qmd' '/home/root/xovi/extensions.d/appload.so' '/home/root/xovi/extensions.d/qt-resource-rebuilder.so' '/home/root/xovi/extensions.d/qt-command-executor.so' '/home/root/xovi/extensions.d/literm.so' '/home/root/xovi/extensions.d/xovi-message-broker.so' '/home/root/pi-ink-client/pi-ink-client' '/home/root/xovi/extensions.d/webserver-remote.so' '/home/root/pi-ink-client/VERSION' '/home/root/pi-ink-bridge-0049' '/home/root/pi-ink-bridge-0049/owner' '/home/root/pi-ink-bridge-0049/staged'; do
  printf "PATH %s\n" "$p"
  if test -L "$p"; then
    printf "GUARD symlink-rejected\n"
    stat -c "%F %a %u %g %s" "$p"
  elif test -f "$p"; then
    printf "GUARD regular\n"
    stat -c "%F %a %u %g %s" "$p"
  elif test -e "$p"; then
    printf "GUARD nonregular\n"
    stat -c "%F %a %u %g %s" "$p"
  else
    printf "GUARD absent\n"
  fi
done
printf "READ_ONLY_GUARD_METADATA_COMPLETE\n"
