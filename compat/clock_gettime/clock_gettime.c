#ifdef __APPLE__

#include "clock_gettime.h"
#include <mach/clock.h>             // for clock_get_time
#include <mach/clock_types.h>       // for mach_timespec_t, CALENDAR_CLOCK, etc
#include <mach/kern_return.h>       // for KERN_SUCCESS, kern_return_t
#include <mach/mach_host.h>         // for host_get_clock_service
#include <mach/mach_init.h>         // for mach_host_self
#include <mach/mach_types.h>        // for clock_serv_t
#include <sched.h>                  // for sched_yield
#include <errno.h>                  // for EINVAL, errno
#include <unistd.h>                 // for getpid

int clock_gettime(clockid_t clk_id, struct timespec *tp)
{
    kern_return_t   ret;
    clock_serv_t    clk;
    clock_id_t clk_serv_id;
    mach_timespec_t tm;

    uint64_t start, end, delta, nano;

    /*
    task_basic_info_data_t tinfo;
    task_thread_times_info_data_t ttinfo;
    mach_msg_type_number_t tflag;
    */

    int retval = -1;
    switch (clk_id)
    {
    case CLOCK_REALTIME:
    case CLOCK_MONOTONIC:
        clk_serv_id = clk_id == CLOCK_REALTIME ? CALENDAR_CLOCK : SYSTEM_CLOCK;
        if (KERN_SUCCESS == (ret = host_get_clock_service(mach_host_self(), clk_serv_id, &clk)))
        {
            if (KERN_SUCCESS == (ret = clock_get_time(clk, &tm)))
            {
                tp->tv_sec  = tm.tv_sec;
                tp->tv_nsec = tm.tv_nsec;
                retval = 0;
            }
        }
        if (KERN_SUCCESS != ret)
        {
            errno = EINVAL;
            retval = -1;
        }
        break;
    case CLOCK_PROCESS_CPUTIME_ID:
    case CLOCK_THREAD_CPUTIME_ID:
        start = mach_absolute_time();
        if (clk_id == CLOCK_PROCESS_CPUTIME_ID)
        {
            getpid();
        }
        else
        {
            sched_yield();
        }
        end = mach_absolute_time();
        delta = end - start;
        if (0 == __clock_gettime_inf.denom)
        {
            mach_timebase_info(&__clock_gettime_inf);
        }
        nano = delta * __clock_gettime_inf.numer / __clock_gettime_inf.denom;
        tp->tv_sec = nano * 1e-9;
        tp->tv_nsec = nano - (tp->tv_sec * 1e9);
        retval = 0;
        break;
    default:
        errno = EINVAL;
        retval = -1;
    }
    return retval;
}

#endif // __APPLE__