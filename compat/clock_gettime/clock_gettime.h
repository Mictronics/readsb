#ifndef CLOCK_GETTIME_H
#define CLOCK_GETTIME_H

#include <mach/mach_time.h>

#ifndef CLOCKID_T
#define CLOCKID_T
typedef enum
{
    CLOCK_REALTIME,
    CLOCK_MONOTONIC,
    CLOCK_PROCESS_CPUTIME_ID,
    CLOCK_THREAD_CPUTIME_ID
} clockid_t;
#endif // CLOCKID_T

struct timespec;

static mach_timebase_info_data_t __clock_gettime_inf;

int clock_gettime(clockid_t clk_id, struct timespec *tp);

#endif // CLOCK_GETTIME_H
