// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// track.h: aircraft state tracking prototypes
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

#ifndef DUMP1090_TRACK_H
#define DUMP1090_TRACK_H

/* Maximum age of tracked aircraft in milliseconds */
#define TRACK_AIRCRAFT_TTL 300000

/* Maximum age of a tracked aircraft with only 1 message received, in milliseconds */
#define TRACK_AIRCRAFT_ONEHIT_TTL 60000

/* Maximum validity of an aircraft position */
#define TRACK_AIRCRAFT_POSITION_TTL 60000

/* Minimum number of repeated Mode A/C replies with a particular Mode A code needed in a
 * 1 second period before accepting that code.
 */
#define TRACK_MODEAC_MIN_MESSAGES 4

typedef struct {
    datasource_t source;     /* where the data came from */
    uint64_t updated;      /* when it arrived */
    uint64_t stale;        /* when it will become stale */
    uint64_t expires;      /* when it will expire */
} data_validity;

/* Structure used to describe the state of one tracked aircraft */
struct aircraft {
    uint32_t      addr;           // ICAO address
    addrtype_t    addrtype;       // highest priority address type seen for this aircraft

    uint64_t      seen;           // Time (millis) at which the last packet was received
    long          messages;       // Number of Mode S messages received

    double        signalLevel[8]; // Last 8 Signal Amplitudes
    int           signalNext;     // next index of signalLevel to use

    data_validity callsign_valid;
    char          callsign[9];     // Flight number

    data_validity altitude_valid;
    int           altitude;        // Altitude (Baro)

    data_validity altitude_geom_valid;
    int           altitude_geom;   // Altitude (Geometric)

    data_validity geom_delta_valid;
    int           geom_delta;      // Difference between Geometric and Baro altitudes

    data_validity gs_valid;
    unsigned      gs;

    data_validity ias_valid;
    unsigned      ias;

    data_validity tas_valid;
    unsigned      tas;

    data_validity mach_valid;
    float         mach;

    data_validity track_valid;
    float         track;           // Ground track

    data_validity track_rate_valid;
    float         track_rate;      // Rate of change of ground track, degrees/second

    data_validity roll_valid;
    float         roll;            // Roll angle, degrees right

    data_validity mag_heading_valid;
    float         mag_heading;     // Magnetic heading

    data_validity baro_rate_valid;
    int           baro_rate;      // Vertical rate (barometric)

    data_validity geom_rate_valid;
    int           geom_rate;      // Vertical rate (geometric)

    data_validity squawk_valid;
    unsigned      squawk;         // Squawk

    data_validity category_valid;
    unsigned      category;       // Aircraft category A0 - D7 encoded as a single hex byte

    data_validity airground_valid;
    airground_t   airground;      // air/ground status

    data_validity alt_setting_valid;
    float         alt_setting;     // Altimeter setting (QNH/QFE), millibars

    data_validity intent_altitude_valid;
    unsigned      intent_altitude; // intent altitude (FMS or FCU selected altitude)

    data_validity intent_heading_valid;
    float         intent_heading; // intent heading, degrees (0-359)

    data_validity cpr_odd_valid;        // Last seen even CPR message
    cpr_type_t    cpr_odd_type;
    unsigned      cpr_odd_lat;
    unsigned      cpr_odd_lon;
    unsigned      cpr_odd_nuc;

    data_validity cpr_even_valid;       // Last seen odd CPR message
    cpr_type_t    cpr_even_type;
    unsigned      cpr_even_lat;
    unsigned      cpr_even_lon;
    unsigned      cpr_even_nuc;

    data_validity position_valid;
    double        lat, lon;       // Coordinated obtained from CPR encoded data
    unsigned      pos_nuc;        // NUCp of last computed position

    int           modeA_hit;   // did our squawk match a possible mode A reply in the last check period?
    int           modeC_hit;   // did our altitude match a possible mode C reply in the last check period?

    int           fatsv_emitted_altitude;         // last FA emitted altitude
    int           fatsv_emitted_altitude_gnss;    //      -"-         GNSS altitude
    int           fatsv_emitted_baro_rate;        //      -"-         barometric rate
    int           fatsv_emitted_geom_rate;        //      -"-         geometric rate
    float         fatsv_emitted_heading;          //      -"-         true track
    float         fatsv_emitted_heading_magnetic; //      -"-         magnetic heading
    float         fatsv_emitted_track_rate;       //      -"-         track rate of change
    float         fatsv_emitted_roll;             //      -"-         roll angle
    unsigned      fatsv_emitted_speed;            //      -"-         groundspeed
    unsigned      fatsv_emitted_speed_ias;        //      -"-         IAS
    unsigned      fatsv_emitted_speed_tas;        //      -"-         TAS
    float         fatsv_emitted_mach;             //      -"-         Mach number
    airground_t   fatsv_emitted_airground;        //      -"-         air/ground state
    unsigned      fatsv_emitted_intent_altitude;  //      -"-         intent altitude
    float         fatsv_emitted_intent_heading;   //      -"-         intent heading
    float         fatsv_emitted_alt_setting;      //      -"-         altimeter setting
    unsigned char fatsv_emitted_bds_10[7];        //      -"-         BDS 1,0 message
    unsigned char fatsv_emitted_bds_30[7];        //      -"-         BDS 3,0 message
    unsigned char fatsv_emitted_es_status[7];     //      -"-         ES operational status message
    unsigned char fatsv_emitted_es_acas_ra[7];    //      -"-         ES ACAS RA report message

    uint64_t      fatsv_last_emitted;             // time (millis) aircraft was last FA emitted

    struct aircraft *next;        // Next aircraft in our linked list

    struct modesMessage first_message;  // A copy of the first message we received for this aircraft.
};

/* Mode A/C tracking is done separately, not via the aircraft list,
 * and via a flat array rather than a list since there are only 4k possible values
 * (nb: we ignore the ident/SPI bit when tracking)
 */
extern uint32_t modeAC_count[4096];
extern uint32_t modeAC_match[4096];
extern uint32_t modeAC_age[4096];

/* is this bit of data valid? */
static inline int trackDataValid(const data_validity *v)
{
    return (v->source != SOURCE_INVALID);
}

/* .. with these constraints? */
static inline int trackDataValidEx(const data_validity *v,
                                   uint64_t now,
                                   uint64_t maxAge,
                                   datasource_t minSource)
{
    if (v->source == SOURCE_INVALID)
        return 0;
    if (v->source < minSource)
        return 0;
    if (v->updated < now && (now - v->updated) > maxAge)
        return 0;
    return 1;
}

/* what's the age of this data? */
static inline uint64_t trackDataAge(const data_validity *v,
                                    uint64_t now)
{
    if (v->source == SOURCE_INVALID)
        return ~(uint64_t)0;
    if (v->updated >= now)
        return 0;
    return (now - v->updated);
}

/* Update aircraft state from data in the provided mesage.
 * Return the tracked aircraft.
 */
struct modesMessage;
struct aircraft *trackUpdateFromMessage(struct modesMessage *mm);

/* Call periodically */
void trackPeriodicUpdate();

/* Convert from a (hex) mode A value to a 0-4095 index */
static inline unsigned modeAToIndex(unsigned modeA)
{
    return (modeA & 0x0007) | ((modeA & 0x0070) >> 1) | ((modeA & 0x0700) >> 2) | ((modeA & 0x7000) >> 3);
}

/* Convert from a 0-4095 index to a (hex) mode A value */
static inline unsigned indexToModeA(unsigned index)
{
    return (index & 0007) | ((index & 0070) << 1) | ((index & 0700) << 2) | ((index & 07000) << 3);
}

#endif
