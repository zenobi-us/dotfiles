# detect if we're running in WSL
if grep -qE "(Microsoft|WSL)" /proc/version &> /dev/null ; then
  host_ip=$(grep "nameserver" /etc/resolv.conf | awk '{print $2}')
  export DISPLAY="${host_ip}:0"

  # This is to account for mysterious issues in wsl2
  # using mise
  XDG_RUNTIME_DIR="$(mktemp -d "/tmp/xdg-runtime-XXXXXX")"
  XDG_CACHE_HOME="$(mktemp -d "/tmp/xdg-cache-XXXXXX")"
  export XDG_CACHE_HOME
  export XDG_RUNTIME_DIR
fi
