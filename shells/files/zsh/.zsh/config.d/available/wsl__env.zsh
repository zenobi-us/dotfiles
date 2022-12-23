host_ip=$(grep "nameserver" /etc/resolv.conf | awk '{print $2}')
export DISPLAY="${host_ip}:0"
