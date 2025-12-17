# detect if we're running in WSL
if grep -qE "(Microsoft|WSL)" /proc/version &> /dev/null ; then
  host_ip=$(grep "nameserver" /etc/resolv.conf | awk '{print $2}')
  export DISPLAY="${host_ip}:0"
fi
