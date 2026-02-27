PID=`pgrep -n -u $USER gnome-session`
if [ -n "$PID" ]; then
    export DISPLAY=`awk 'BEGIN{FS="="; RS="\0"}  $1=="DISPLAY" {print $2; exit}' /proc/$PID/environ`
    echo "DISPLAY set to $DISPLAY" >&2
else
    echo "Could not set DISPLAY" >&2
fi
unset PID1

