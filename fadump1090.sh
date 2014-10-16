#!/bin/bash
### BEGIN INIT INFO
#
# Provides:		dump1090
# Required-Start:	$remote_fs
# Required-Stop:	$remote_fs
# Default-Start:	2 3 4 5
# Default-Stop:		0 1 6
# Short-Description:	dump1090 initscript
#
### END INIT INFO
# Fill in name of program here.
PROG_ARGS="--quiet --net --net-ro-size 500 --net-ro-rate 5 --net-buffer 5"

. /lib/lsb/init-functions

DAEMON=/usr/bin/dump1090
PIDFILE=/var/run/dump1090.pid

test -x $DAEMON || exit 5

LOCKFILE=/var/lock/dump1090

start() {
    log_daemon_msg "Starting dump1090 server" "dump1090"
# --quiet
    /sbin/start-stop-daemon --start --oknodo --background --make-pidfile --pidfile $PIDFILE --exec $DAEMON -- $PROG_ARGS
    status=$?
    log_begin_msg $status
    return
}

stop() {
    log_daemon_msg "Stopping dump1090 server" "dump1090"
    /sbin/start-stop-daemon --stop --quiet --oknodo --pidfile $PIDFILE
    log_end_msg $?
    rm -f $PIDFILE
    return
}

status() {
    echo "no status yet"
    return
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
	status
        ;;
    restart|force-reload)
        stop && sleep 2 && start
        ;;
    reload)
	exit 3
	;;
    status)
	status_of_proc $DAEMON "dump1090 server"
	;;
    *)
	echo "Usage: $0 {start|stop|restart|try-restart|force-reload|status}"
	exit 2
	;;
esac
