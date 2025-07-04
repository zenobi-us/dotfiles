PID=`pgrep -n -u $USER gnome-session`
if [ -n "$PID" ]; then
    export DISPLAY=`awk 'BEGIN{FS="="; RS="\0"}  $1=="DISPLAY" {print $2; exit}' /proc/$PID/environ`
    echo "DISPLAY set to $DISPLAY"
else
    echo "Could not set DISPLAY"
fi
unset PID1

