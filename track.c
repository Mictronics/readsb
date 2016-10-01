// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// track.c: aircraft state tracking
//
// Copyright (c) 2014-2016 Oliver Jowett <oliver@mutability.co.uk>
//
// This file is free software: you may copy, redistribute and/or modify it  
// under the terms of the GNU General Public License as published by the
// Free Software Foundation, either version 2 of the License, or (at your  
// option) any later version.  
//
// This file is distributed in the hope that it will be useful, but  
// WITHOUT ANY WARRANTY; without even the implied warranty of  
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU  
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License  
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// This file incorporates work covered by the following copyright and  
// permission notice:
//
//   Copyright (C) 2012 by Salvatore Sanfilippo <antirez@gmail.com>
//
//   All rights reserved.
//
//   Redistribution and use in source and binary forms, with or without
//   modification, are permitted provided that the following conditions are
//   met:
//
//    *  Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//
//    *  Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
//   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
//   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
//   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
//   A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
//   HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//   SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//   LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//   DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
//   THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
//   OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#include "dump1090.h"
#include <inttypes.h>

/* #define DEBUG_CPR_CHECKS */

//
// Return a new aircraft structure for the linked list of tracked
// aircraft
//
struct aircraft *trackCreateAircraft(struct modesMessage *mm) {
    static struct aircraft zeroAircraft;
    struct aircraft *a = (struct aircraft *) malloc(sizeof(*a));
    int i;

    // Default everything to zero/NULL
    *a = zeroAircraft;

    // Now initialise things that should not be 0/NULL to their defaults
    a->addr = mm->addr;
    a->addrtype = mm->addrtype;
    for (i = 0; i < 8; ++i)
        a->signalLevel[i] = 1e-5;
    a->signalNext = 0;

    // start off with the "last emitted" ACAS RA being blank (just the BDS 3,0
    // or ES type code)
    a->fatsv_emitted_bds_30[0] = 0x30;
    a->fatsv_emitted_es_acas_ra[0] = 0xE2;

    // mm->msgtype 32 is used to represent Mode A/C. These values can never change, so 
    // set them once here during initialisation, and don't bother to set them every 
    // time this ModeA/C is received again in the future
    if (mm->msgtype == 32) {
        a->modeACflags = MODEAC_MSG_FLAG;
        if (!mm->altitude_valid) {
            a->modeACflags |= MODEAC_MSG_MODEA_ONLY;
        }
    }

    // Copy the first message so we can emit it later when a second message arrives.
    a->first_message = *mm;

    Modes.stats_current.unique_aircraft++;

    return (a);
}

//
//=========================================================================
//
// Return the aircraft with the specified address, or NULL if no aircraft
// exists with this address.
//
struct aircraft *trackFindAircraft(uint32_t addr) {
    struct aircraft *a = Modes.aircrafts;

    while(a) {
        if (a->addr == addr) return (a);
        a = a->next;
    }
    return (NULL);
}

// Should we accept some new data from the given source?
// If so, update the validity and return 1
static int accept_data(data_validity *d, datasource_t source, uint64_t now)
{
    if (source < d->source && now < d->stale)
        return 0;

    d->source = source;
    d->updated = now;
    d->stale = now + 60000;
    d->expires = now + 70000;
    return 1;
}

// Given two datasources, produce a third datasource for data combined from them.
static void combine_validity(data_validity *to, const data_validity *from1, const data_validity *from2) {
    if (from1->source == SOURCE_INVALID) {
        *to = *from2;
        return;
    }

    if (from2->source == SOURCE_INVALID) {
        *to = *from1;
        return;
    }

    to->source = (from1->source < from2->source) ? from1->source : from2->source;        // the worse of the two input sources
    to->updated = (from1->updated > from2->updated) ? from1->updated : from2->updated;   // the *later* of the two update times
    to->stale = (from1->stale < from2->stale) ? from1->stale : from2->stale;             // the earlier of the two stale times
    to->expires = (from1->expires < from2->expires) ? from1->expires : from2->expires;   // the earlier of the two expiry times
}

static int compare_validity(const data_validity *lhs, const data_validity *rhs, uint64_t now) {
    if (now < lhs->stale && lhs->source > rhs->source)
        return 1;
    else if (now < rhs->stale && lhs->source < rhs->source)
        return -1;
    else if (lhs->updated > rhs->updated)
        return 1;
    else if (lhs->updated < rhs->updated)
        return -1;
    else
        return 0;
}

//
// CPR position updating
//

// Distance between points on a spherical earth.
// This has up to 0.5% error because the earth isn't actually spherical
// (but we don't use it in situations where that matters)
static double greatcircle(double lat0, double lon0, double lat1, double lon1)
{
    double dlat, dlon;

    lat0 = lat0 * M_PI / 180.0;
    lon0 = lon0 * M_PI / 180.0;
    lat1 = lat1 * M_PI / 180.0;
    lon1 = lon1 * M_PI / 180.0;

    dlat = fabs(lat1 - lat0);
    dlon = fabs(lon1 - lon0);

    // use haversine for small distances for better numerical stability
    if (dlat < 0.001 && dlon < 0.001) {
        double a = sin(dlat/2) * sin(dlat/2) + cos(lat0) * cos(lat1) * sin(dlon/2) * sin(dlon/2);
        return 6371e3 * 2 * atan2(sqrt(a), sqrt(1.0 - a));
    }

    // spherical law of cosines
    return 6371e3 * acos(sin(lat0) * sin(lat1) + cos(lat0) * cos(lat1) * cos(dlon));
}

static void update_range_histogram(double lat, double lon)
{
    if (Modes.stats_range_histo && (Modes.bUserFlags & MODES_USER_LATLON_VALID)) {
        double range = greatcircle(Modes.fUserLat, Modes.fUserLon, lat, lon);
        int bucket = round(range / Modes.maxRange * RANGE_BUCKET_COUNT);

        if (bucket < 0)
            bucket = 0;
        else if (bucket >= RANGE_BUCKET_COUNT)
            bucket = RANGE_BUCKET_COUNT-1;

        ++Modes.stats_current.range_histogram[bucket];
    }
}

// return true if it's OK for the aircraft to have travelled from its last known position
// to a new position at (lat,lon,surface) at a time of now.
static int speed_check(struct aircraft *a, double lat, double lon, uint64_t now, int surface)
{
    uint64_t elapsed;
    double distance;
    double range;
    int speed;
    int inrange;

    if (!trackDataValid(&a->position_valid))
        return 1; // no reference, assume OK

    elapsed = trackDataAge(&a->position_valid, now);

    if (trackDataValid(&a->speed_valid))
        speed = a->speed;
    else if (trackDataValid(&a->speed_ias_valid))
        speed = a->speed_ias * 4 / 3;
    else if (trackDataValid(&a->speed_tas_valid))
        speed = a->speed_tas * 4 / 3;
    else
        speed = surface ? 100 : 600; // guess

    // Work out a reasonable speed to use:
    //  current speed + 1/3
    //  surface speed min 20kt, max 150kt
    //  airborne speed min 200kt, no max
    speed = speed * 4 / 3;
    if (surface) {
        if (speed < 20)
            speed = 20;
        if (speed > 150)
            speed = 150;
    } else {
        if (speed < 200)
            speed = 200;
    }

    // 100m (surface) or 500m (airborne) base distance to allow for minor errors,
    // plus distance covered at the given speed for the elapsed time + 1 second.
    range = (surface ? 0.1e3 : 0.5e3) + ((elapsed + 1000.0) / 1000.0) * (speed * 1852.0 / 3600.0);

    // find actual distance
    distance = greatcircle(a->lat, a->lon, lat, lon);

    inrange = (distance <= range);
#ifdef DEBUG_CPR_CHECKS
    if (!inrange) {
        fprintf(stderr, "Speed check failed: %06x: %.3f,%.3f -> %.3f,%.3f in %.1f seconds, max speed %d kt, range %.1fkm, actual %.1fkm\n",
                a->addr, a->lat, a->lon, lat, lon, elapsed/1000.0, speed, range/1000.0, distance/1000.0);
    }
#endif

    return inrange;
}

static int doGlobalCPR(struct aircraft *a, struct modesMessage *mm, uint64_t now, double *lat, double *lon, unsigned *nuc)
{
    int result;
    int fflag = mm->cpr_odd;
    int surface = (mm->cpr_type == CPR_SURFACE);

    *nuc = (a->cpr_even_nuc < a->cpr_odd_nuc ? a->cpr_even_nuc : a->cpr_odd_nuc); // worst of the two positions

    if (surface) {
        // surface global CPR
        // find reference location
        double reflat, reflon;

        if (trackDataValidEx(&a->position_valid, now, 50000, SOURCE_INVALID)) { // Ok to try aircraft relative first
            reflat = a->lat;
            reflon = a->lon;
            if (a->pos_nuc < *nuc)
                *nuc = a->pos_nuc;
        } else if (Modes.bUserFlags & MODES_USER_LATLON_VALID) {
            reflat = Modes.fUserLat;
            reflon = Modes.fUserLon;
        } else {
            // No local reference, give up
            return (-1);
        }

        result = decodeCPRsurface(reflat, reflon,
                                  a->cpr_even_lat, a->cpr_even_lon,
                                  a->cpr_odd_lat, a->cpr_odd_lon,
                                  fflag,
                                  lat, lon);
    } else {
        // airborne global CPR
        result = decodeCPRairborne(a->cpr_even_lat, a->cpr_even_lon,
                                   a->cpr_odd_lat, a->cpr_odd_lon,
                                   fflag,
                                   lat, lon);
    }

    if (result < 0) {
#ifdef DEBUG_CPR_CHECKS
        fprintf(stderr, "CPR: decode failure for %06X (%d).\n", a->addr, result);
        fprintf(stderr, "  even: %d %d   odd: %d %d  fflag: %s\n",
                a->cpr_even_lat, a->cpr_even_lon,
                a->cpr_odd_lat, a->cpr_odd_lon,
                fflag ? "odd" : "even");
#endif
        return result;
    }

    // check max range
    if (Modes.maxRange > 0 && (Modes.bUserFlags & MODES_USER_LATLON_VALID)) {
        double range = greatcircle(Modes.fUserLat, Modes.fUserLon, *lat, *lon);
        if (range > Modes.maxRange) {
#ifdef DEBUG_CPR_CHECKS
            fprintf(stderr, "Global range check failed: %06x: %.3f,%.3f, max range %.1fkm, actual %.1fkm\n",
                    a->addr, *lat, *lon, Modes.maxRange/1000.0, range/1000.0);
#endif

            Modes.stats_current.cpr_global_range_checks++;
            return (-2); // we consider an out-of-range value to be bad data
        }
    }

    // for mlat results, skip the speed check
    if (mm->source == SOURCE_MLAT)
        return result;

    // check speed limit
    if (trackDataValid(&a->position_valid) && a->pos_nuc >= *nuc && !speed_check(a, *lat, *lon, now, surface)) {
        Modes.stats_current.cpr_global_speed_checks++;
        return -2;
    }

    return result;
}

static int doLocalCPR(struct aircraft *a, struct modesMessage *mm, uint64_t now, double *lat, double *lon, unsigned *nuc)
{
    // relative CPR
    // find reference location
    double reflat, reflon;
    double range_limit = 0;
    int result;
    int fflag = mm->cpr_odd;
    int surface = (mm->cpr_type == CPR_SURFACE);

    *nuc = mm->cpr_nucp;

    if (trackDataValidEx(&a->position_valid, now, 50000, SOURCE_INVALID)) {
        reflat = a->lat;
        reflon = a->lon;

        if (a->pos_nuc < *nuc)
            *nuc = a->pos_nuc;

        range_limit = 50e3;
    } else if (!surface && (Modes.bUserFlags & MODES_USER_LATLON_VALID)) {
        reflat = Modes.fUserLat;
        reflon = Modes.fUserLon;
        
        // The cell size is at least 360NM, giving a nominal
        // max range of 180NM (half a cell).
        //
        // If the receiver range is more than half a cell
        // then we must limit this range further to avoid
        // ambiguity. (e.g. if we receive a position report
        // at 200NM distance, this may resolve to a position
        // at (200-360) = 160NM in the wrong direction)

        if (Modes.maxRange == 0) {
            return (-1); // Can't do receiver-centered checks at all
        } else if (Modes.maxRange <= 1852*180) {
            range_limit = Modes.maxRange;
        } else if (Modes.maxRange < 1852*360) {
            range_limit = (1852*360) - Modes.maxRange;
        } else {
            return (-1); // Can't do receiver-centered checks at all
        }
    } else {
        // No local reference, give up
        return (-1);
    }

    result = decodeCPRrelative(reflat, reflon,
                               mm->cpr_lat,
                               mm->cpr_lon,
                               fflag, surface,
                               lat, lon);
    if (result < 0) {
        return result;
    }

    // check range limit
    if (range_limit > 0) {
        double range = greatcircle(reflat, reflon, *lat, *lon);
        if (range > range_limit) {
            Modes.stats_current.cpr_local_range_checks++;
            return (-1);
        }
    }

    // check speed limit
    if (trackDataValid(&a->position_valid) && a->pos_nuc >= *nuc && !speed_check(a, *lat, *lon, now, surface)) {
#ifdef DEBUG_CPR_CHECKS
        fprintf(stderr, "Speed check for %06X with local decoding failed\n", a->addr);
#endif
        Modes.stats_current.cpr_local_speed_checks++;
        return -1;
    }

    return 0;
}

static uint64_t time_between(uint64_t t1, uint64_t t2)
{
    if (t1 >= t2)
        return t1 - t2;
    else
        return t2 - t1;
}

static void updatePosition(struct aircraft *a, struct modesMessage *mm, uint64_t now)
{
    int location_result = -1;
    uint64_t max_elapsed;
    double new_lat = 0, new_lon = 0;
    unsigned new_nuc = 0;
    int surface;

    surface = (mm->cpr_type == CPR_SURFACE);

    if (surface) {
        ++Modes.stats_current.cpr_surface;

        // Surface: 25 seconds if >25kt or speed unknown, 50 seconds otherwise
        if (mm->speed_valid && mm->speed <= 25)
            max_elapsed = 50000;
        else
            max_elapsed = 25000;
    } else {
        ++Modes.stats_current.cpr_airborne;

        // Airborne: 10 seconds
        max_elapsed = 10000;
    }

    // If we have enough recent data, try global CPR
    if (trackDataValid(&a->cpr_odd_valid) && trackDataValid(&a->cpr_even_valid) &&
        a->cpr_odd_valid.source == a->cpr_even_valid.source &&
        a->cpr_odd_type == a->cpr_even_type &&
        time_between(a->cpr_odd_valid.updated, a->cpr_even_valid.updated) <= max_elapsed) {

        location_result = doGlobalCPR(a, mm, now, &new_lat, &new_lon, &new_nuc);

        if (location_result == -2) {
#ifdef DEBUG_CPR_CHECKS
            fprintf(stderr, "global CPR failure (invalid) for (%06X).\n", a->addr);
#endif
            // Global CPR failed because the position produced implausible results.
            // This is bad data. Discard both odd and even messages and wait for a fresh pair.
            // Also disable aircraft-relative positions until we have a new good position (but don't discard the
            // recorded position itself)
            Modes.stats_current.cpr_global_bad++;
            a->cpr_odd_valid.source = a->cpr_even_valid.source = a->position_valid.source = SOURCE_INVALID;

            return;
        } else if (location_result == -1) {
#ifdef DEBUG_CPR_CHECKS
            if (mm->source == SOURCE_MLAT) {
                fprintf(stderr, "CPR skipped from MLAT (%06X).\n", a->addr);
            }
#endif
            // No local reference for surface position available, or the two messages crossed a zone.
            // Nonfatal, try again later.
            Modes.stats_current.cpr_global_skipped++;
        } else {
            Modes.stats_current.cpr_global_ok++;
            combine_validity(&a->position_valid, &a->cpr_even_valid, &a->cpr_odd_valid);
        }
    }

    // Otherwise try relative CPR.
    if (location_result == -1) {
        location_result = doLocalCPR(a, mm, now, &new_lat, &new_lon, &new_nuc);

        if (location_result < 0) {
            Modes.stats_current.cpr_local_skipped++;
        } else {
            Modes.stats_current.cpr_local_ok++;
            mm->cpr_relative = 1;

            if (mm->cpr_odd) {
                a->position_valid = a->cpr_odd_valid;
            } else {
                a->position_valid = a->cpr_even_valid;
            }
        }
    }

    if (location_result == 0) {
        // If we sucessfully decoded, back copy the results to mm so that we can print them in list output
        mm->cpr_decoded = 1;
        mm->decoded_lat = new_lat;
        mm->decoded_lon = new_lon;

        // Update aircraft state
        a->lat = new_lat;
        a->lon = new_lon;
        a->pos_nuc = new_nuc;

        update_range_histogram(new_lat, new_lon);
    }
}

//
//=========================================================================
//
// Receive new messages and update tracked aircraft state
//

struct aircraft *trackUpdateFromMessage(struct modesMessage *mm)
{
    struct aircraft *a;
    uint64_t now = mstime();

    // Lookup our aircraft or create a new one
    a = trackFindAircraft(mm->addr);
    if (!a) {                              // If it's a currently unknown aircraft....
        a = trackCreateAircraft(mm);       // ., create a new record for it,
        a->next = Modes.aircrafts;         // .. and put it at the head of the list
        Modes.aircrafts = a;
    }

    if (mm->signalLevel > 0) {
        a->signalLevel[a->signalNext] = mm->signalLevel;
        a->signalNext = (a->signalNext + 1) & 7;
    }
    a->seen      = now;
    a->messages++;

    // update addrtype, we only ever go towards "more direct" types
    if (mm->addrtype < a->addrtype)
        a->addrtype = mm->addrtype;

    if (mm->altitude_valid && mm->altitude_source == ALTITUDE_BARO && accept_data(&a->altitude_valid, mm->source, now)) {
        unsigned modeC = (a->altitude + 49) / 100;
        if (modeC != a->altitude_modeC) {
            a->modeCcount = 0;               //....zero the hit count
            a->modeACflags &= ~MODEAC_MSG_MODEC_HIT;
        }

        a->altitude = mm->altitude;
        a->altitude_modeC = modeC;
    }

    if (mm->squawk_valid && accept_data(&a->squawk_valid, mm->source, now)) {
        if (mm->squawk != a->squawk) {
            a->modeAcount = 0;               //....zero the hit count
            a->modeACflags &= ~MODEAC_MSG_MODEA_HIT;
        }
        a->squawk = mm->squawk;
    }

    if (mm->altitude_valid && mm->altitude_source == ALTITUDE_GNSS && accept_data(&a->altitude_gnss_valid, mm->source, now)) {
        a->altitude_gnss = mm->altitude;
    }

    if (mm->gnss_delta_valid && accept_data(&a->gnss_delta_valid, mm->source, now)) {
        a->gnss_delta = mm->gnss_delta;
    }

    if (mm->heading_valid && mm->heading_source == HEADING_TRUE && accept_data(&a->heading_valid, mm->source, now)) {
        a->heading = mm->heading;
    }

    if (mm->heading_valid && mm->heading_source == HEADING_MAGNETIC && accept_data(&a->heading_magnetic_valid, mm->source, now)) {
        a->heading_magnetic = mm->heading;
    }

    if (mm->speed_valid && mm->speed_source == SPEED_GROUNDSPEED && accept_data(&a->speed_valid, mm->source, now)) {
        a->speed = mm->speed;
    }

    if (mm->speed_valid && mm->speed_source == SPEED_IAS && accept_data(&a->speed_ias_valid, mm->source, now)) {
        a->speed_ias = mm->speed;
    }

    if (mm->speed_valid && mm->speed_source == SPEED_TAS && accept_data(&a->speed_tas_valid, mm->source, now)) {
        a->speed_tas = mm->speed;
    }

    if (mm->vert_rate_valid && accept_data(&a->vert_rate_valid, mm->source, now)) {
        a->vert_rate = mm->vert_rate;
        a->vert_rate_source = mm->vert_rate_source;
    }

    if (mm->category_valid && accept_data(&a->category_valid, mm->source, now)) {
        a->category = mm->category;
    }

    if (mm->airground != AG_INVALID && accept_data(&a->airground_valid, mm->source, now)) {
        a->airground = mm->airground;
    }

    if (mm->callsign_valid && accept_data(&a->callsign_valid, mm->source, now)) {
        memcpy(a->callsign, mm->callsign, sizeof(a->callsign));
    }

    // CPR, even
    if (mm->cpr_valid && !mm->cpr_odd && accept_data(&a->cpr_even_valid, mm->source, now)) {
        a->cpr_even_type = mm->cpr_type;
        a->cpr_even_lat = mm->cpr_lat;
        a->cpr_even_lon = mm->cpr_lon;
        a->cpr_even_nuc = mm->cpr_nucp;
    }

    // CPR, odd
    if (mm->cpr_valid && mm->cpr_odd && accept_data(&a->cpr_odd_valid, mm->source, now)) {
        a->cpr_odd_type = mm->cpr_type;
        a->cpr_odd_lat = mm->cpr_lat;
        a->cpr_odd_lon = mm->cpr_lon;
        a->cpr_odd_nuc = mm->cpr_nucp;
    }

    // Now handle derived data

    // derive GNSS if we have baro + delta
    if (compare_validity(&a->altitude_valid, &a->altitude_gnss_valid, now) > 0 &&
        compare_validity(&a->gnss_delta_valid, &a->altitude_gnss_valid, now) > 0) {
        // Baro and delta are both more recent than GNSS, derive GNSS from baro + delta
        a->altitude_gnss = a->altitude + a->gnss_delta;
        combine_validity(&a->altitude_gnss_valid, &a->altitude_valid, &a->gnss_delta_valid);
    }

    // If we've got a new cprlat or cprlon
    if (mm->cpr_valid) {
        updatePosition(a, mm, now);
    }

    if (mm->msgtype == 32) {
        int flags = a->modeACflags;
        if ((flags & (MODEAC_MSG_MODEC_HIT | MODEAC_MSG_MODEC_OLD)) == MODEAC_MSG_MODEC_OLD) {
            //
            // This Mode-C doesn't currently hit any known Mode-S, but it used to because MODEAC_MSG_MODEC_OLD is
            // set  So the aircraft it used to match has either changed altitude, or gone out of our receiver range
            //
            // We've now received this Mode-A/C again, so it must be a new aircraft. It could be another aircraft
            // at the same Mode-C altitude, or it could be a new airctraft with a new Mods-A squawk.
            //
            // To avoid masking this aircraft from the interactive display, clear the MODEAC_MSG_MODES_OLD flag
            // and set messages to 1;
            //
            a->modeACflags = flags & ~MODEAC_MSG_MODEC_OLD;
            a->messages    = 1;
        }
    }

    return (a);
}

//
// Periodic updates of tracking state
//

//
//=========================================================================
//
// Periodically search through the list of known Mode-S aircraft and tag them if this
// Mode A/C  matches their known Mode S Squawks or Altitudes(+/- 50feet).
//
// A Mode S equipped aircraft may also respond to Mode A and Mode C SSR interrogations.
// We can't tell if this is a Mode A or C, so scan through the entire aircraft list
// looking for matches on Mode A (squawk) and Mode C (altitude). Flag in the Mode S
// records that we have had a potential Mode A or Mode C response from this aircraft. 
//
// If an aircraft responds to Mode A then it's highly likely to be responding to mode C 
// too, and vice verca. Therefore, once the mode S record is tagged with both a Mode A
// and a Mode C flag, we can be fairly confident that this Mode A/C frame relates to that
// Mode S aircraft.
//
// Mode C's are more likely to clash than Mode A's; There could be several aircraft 
// cruising at FL370, but it's less likely (though not impossible) that there are two 
// aircraft on the same squawk. Therefore, give precidence to Mode A record matches
//
// Note : It's theoretically possible for an aircraft to have the same value for Mode A 
// and Mode C. Therefore we have to check BOTH A AND C for EVERY S.
//
static void trackUpdateAircraftModeA(struct aircraft *a)
{
    struct aircraft *b = Modes.aircrafts;

    while(b) {
        if ((b->modeACflags & MODEAC_MSG_FLAG) == 0) {  // skip any fudged ICAO records 

            // If both (a) and (b) have valid squawks...
            if (trackDataValid(&a->squawk_valid) && trackDataValid(&b->squawk_valid)) {
                // ...check for Mode-A == Mode-S Squawk matches
                if (a->squawk == b->squawk) { // If a 'real' Mode-S ICAO exists using this Mode-A Squawk
                    b->modeAcount   = a->messages;
                    b->modeACflags |= MODEAC_MSG_MODEA_HIT;
                    a->modeACflags |= MODEAC_MSG_MODEA_HIT;
                    if ( (b->modeAcount > 0) &&
                       ( (b->modeCcount > 1)
                      || (a->modeACflags & MODEAC_MSG_MODEA_ONLY)) ) // Allow Mode-A only matches if this Mode-A is invalid Mode-C
                        {a->modeACflags |= MODEAC_MSG_MODES_HIT;}    // flag this ModeA/C probably belongs to a known Mode S                    
                }
            }

            // If both (a) and (b) have valid altitudes...
            if (trackDataValid(&a->altitude_valid) && trackDataValid(&b->altitude_valid)) {
                // ... check for Mode-C == Mode-S Altitude matches
                if (  (a->altitude_modeC     == b->altitude_modeC    )     // If a 'real' Mode-S ICAO exists at this Mode-C Altitude
                   || (a->altitude_modeC     == b->altitude_modeC + 1)     //          or this Mode-C - 100 ft
                   || (a->altitude_modeC + 1 == b->altitude_modeC    ) ) { //          or this Mode-C + 100 ft
                    b->modeCcount   = a->messages;
                    b->modeACflags |= MODEAC_MSG_MODEC_HIT;
                    a->modeACflags |= MODEAC_MSG_MODEC_HIT;
                    if ( (b->modeAcount > 0) &&
                         (b->modeCcount > 1) )
                        {a->modeACflags |= (MODEAC_MSG_MODES_HIT | MODEAC_MSG_MODEC_OLD);} // flag this ModeA/C probably belongs to a known Mode S                    
                }
            }
        }
        b = b->next;
    }
}
//
//=========================================================================
//
static void trackUpdateAircraftModeS()
{
    struct aircraft *a = Modes.aircrafts;

    while(a) {
        int flags = a->modeACflags;
        if (flags & MODEAC_MSG_FLAG) { // find any fudged ICAO records

            // clear the current A,C and S hit bits ready for this attempt
            a->modeACflags = flags & ~(MODEAC_MSG_MODEA_HIT | MODEAC_MSG_MODEC_HIT | MODEAC_MSG_MODES_HIT);

            trackUpdateAircraftModeA(a);  // and attempt to match them with Mode-S
        }
        a = a->next;
    }
}

//
//=========================================================================
//
// If we don't receive new nessages within TRACK_AIRCRAFT_TTL
// we remove the aircraft from the list.
//
static void trackRemoveStaleAircraft(uint64_t now)
{
    struct aircraft *a = Modes.aircrafts;
    struct aircraft *prev = NULL;
    
    while(a) {
        if ((now - a->seen) > TRACK_AIRCRAFT_TTL ||
            (a->messages == 1 && (now - a->seen) > TRACK_AIRCRAFT_ONEHIT_TTL)) {
            // Count aircraft where we saw only one message before reaping them.
            // These are likely to be due to messages with bad addresses.
            if (a->messages == 1)
                Modes.stats_current.single_message_aircraft++;

            // Remove the element from the linked list, with care
            // if we are removing the first element
            if (!prev) {
                Modes.aircrafts = a->next; free(a); a = Modes.aircrafts;
            } else {
                prev->next = a->next; free(a); a = prev->next;
            }
        } else {

#define EXPIRE(_f) do { if (a->_f##_valid.source != SOURCE_INVALID && now >= a->_f##_valid.expires) { a->_f##_valid.source = SOURCE_INVALID; } } while (0)
            EXPIRE(callsign);
            EXPIRE(altitude);
            EXPIRE(altitude_gnss);
            EXPIRE(gnss_delta);
            EXPIRE(speed);
            EXPIRE(speed_ias);
            EXPIRE(speed_tas);
            EXPIRE(heading);
            EXPIRE(heading_magnetic);
            EXPIRE(vert_rate);
            EXPIRE(squawk);
            EXPIRE(category);
            EXPIRE(airground);
            EXPIRE(cpr_odd);
            EXPIRE(cpr_even);
            EXPIRE(position);

            prev = a; a = a->next;
        }
    }
}


//
// Entry point for periodic updates
//

void trackPeriodicUpdate()
{
    static uint64_t next_update;
    uint64_t now = mstime();

    // Only do updates once per second
    if (now >= next_update) {
        next_update = now + 1000;
        trackRemoveStaleAircraft(now);
        trackUpdateAircraftModeS();
    }
}
