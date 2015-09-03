/*
 * clock_nanosleep.c - clock_nanosleep() replacement
 */

#ifdef __APPLE__

#include "clock_nanosleep.h"
#include <errno.h>                           // for errno, EINVAL
#include <time.h>                            // for nanosleep, NULL
#include "../clock_gettime/clock_gettime.h"  // for clock_gettime

int clock_nanosleep(clockid_t id, int flags, const struct timespec *ts,
                    struct timespec *ots) {
    int ret;

    if (id != CLOCK_REALTIME)
        return EINVAL;

    if (flags & TIMER_ABSTIME) {
        struct timespec mine;

        if (clock_gettime(id, &mine))
            return errno;

        if (mine.tv_sec > ts->tv_sec)
            return 0; // behind schedule

        if (mine.tv_nsec > ts->tv_nsec) {
            if (mine.tv_sec == ts->tv_sec)
                return 0; // behind schedule too

            mine.tv_nsec = 1000000000 + ts->tv_nsec - mine.tv_nsec;
            mine.tv_sec++;
        }
        else
            mine.tv_nsec = ts->tv_nsec - mine.tv_nsec;

        mine.tv_sec = ts->tv_sec - mine.tv_sec;

        /* With TIMER_ABSTIME, clock_nanosleep ignores <ots> */
        ret = nanosleep(&mine, NULL);
    }
    else
        ret = nanosleep(ts, ots);

    return ret ? errno : 0;
}

#endif // __APPLE__