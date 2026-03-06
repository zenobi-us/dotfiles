# detect if we're running in WSL
if grep -qE "(Microsoft|WSL)" /proc/version &> /dev/null ; then
  host_ip=$(grep "nameserver" /etc/resolv.conf | awk '{print $2}')
  export DISPLAY="${host_ip}:0"

  # WSLg-safe Chromium launcher (forces Wayland and ignores X11 DISPLAY override)
  alias chromium-wsl='DISPLAY= WAYLAND_DISPLAY=wayland-0 chromium-browser --ozone-platform=wayland --no-first-run --no-default-browser-check'
fi
