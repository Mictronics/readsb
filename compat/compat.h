#ifndef COMPAT_UTIL_H
#define COMPAT_UTIL_H

/*
 * Platform-specific bits
 */

#if defined(__APPLE__)

/* implementations of clock_gettime, clock_nanosleep */

#define MISSING_NANOSLEEP
#define MISSING_GETTIME

/*
 * Mach endian conversion
 */
# include <libkern/OSByteOrder.h>
# define bswap_16 OSSwapInt16
# define bswap_32 OSSwapInt32
# define bswap_64 OSSwapInt64
# include <machine/endian.h>
# define le16toh(x) OSSwapLittleToHostInt16(x)
# define le32toh(x) OSSwapLittleToHostInt32(x)

#else // other platforms

# include <endian.h>

#endif

#if defined(__OpenBSD__)
#define MISSING_NANOSLEEP
#endif

#ifdef MISSING_NANOSLEEP
#include "clock_nanosleep/clock_nanosleep.h"
#endif

#ifdef MISSING_GETTIME
#include "clock_nanosleep/clock_gettime.h"
#endif

#endif //COMPAT_UTIL_H
