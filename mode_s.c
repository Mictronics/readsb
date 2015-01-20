// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// mode_s.c: Mode S message decoding.
//
// Copyright (c) 2014,2015 Oliver Jowett <oliver@mutability.co.uk>
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
//
// ===================== Mode S detection and decoding  ===================
//
//
//

//=========================================================================
//
// Given the Downlink Format (DF) of the message, return the message length in bits.
//
// All known DF's 16 or greater are long. All known DF's 15 or less are short. 
// There are lots of unused codes in both category, so we can assume ICAO will stick to 
// these rules, meaning that the most significant bit of the DF indicates the length.
//
int modesMessageLenByType(int type) {
    return (type & 0x10) ? MODES_LONG_MSG_BITS : MODES_SHORT_MSG_BITS ;
}

//=========================================================================
//
// Hash the ICAO address to index our cache of MODES_ICAO_CACHE_LEN
// elements, that is assumed to be a power of two
//
uint32_t ICAOCacheHashAddress(uint32_t a) {
    // The following three rounds wil make sure that every bit affects
    // every output bit with ~ 50% of probability.
    a = ((a >> 16) ^ a) * 0x45d9f3b;
    a = ((a >> 16) ^ a) * 0x45d9f3b;
    a = ((a >> 16) ^ a);
    return a & (MODES_ICAO_CACHE_LEN-1);
}
//
//=========================================================================
//
// Add the specified entry to the cache of recently seen ICAO addresses.
// Note that we also add a timestamp so that we can make sure that the
// entry is only valid for MODES_ICAO_CACHE_TTL seconds.
//
void addRecentlySeenICAOAddr(uint32_t addr) {
    uint32_t h = ICAOCacheHashAddress(addr);
    Modes.icao_cache[h*2] = addr;
    Modes.icao_cache[h*2+1] = (uint32_t) time(NULL);
}
//
//=========================================================================
//
// Returns 1 if the specified ICAO address was seen in a DF format with
// proper checksum (not xored with address) no more than * MODES_ICAO_CACHE_TTL
// seconds ago. Otherwise returns 0.
//
int ICAOAddressWasRecentlySeen(uint32_t addr) {
    uint32_t h = ICAOCacheHashAddress(addr);
    uint32_t a = Modes.icao_cache[h*2];
    uint32_t t = Modes.icao_cache[h*2+1];
    uint64_t tn = time(NULL);

    return ( (a) && (a == addr) && ( (tn - t) <= MODES_ICAO_CACHE_TTL) );
}
//
//=========================================================================
//
// In the squawk (identity) field bits are interleaved as follows in
// (message bit 20 to bit 32):
//
// C1-A1-C2-A2-C4-A4-ZERO-B1-D1-B2-D2-B4-D4
//
// So every group of three bits A, B, C, D represent an integer from 0 to 7.
//
// The actual meaning is just 4 octal numbers, but we convert it into a hex 
// number tha happens to represent the four octal numbers.
//
// For more info: http://en.wikipedia.org/wiki/Gillham_code
//
int decodeID13Field(int ID13Field) {
    int hexGillham = 0;

    if (ID13Field & 0x1000) {hexGillham |= 0x0010;} // Bit 12 = C1
    if (ID13Field & 0x0800) {hexGillham |= 0x1000;} // Bit 11 = A1
    if (ID13Field & 0x0400) {hexGillham |= 0x0020;} // Bit 10 = C2
    if (ID13Field & 0x0200) {hexGillham |= 0x2000;} // Bit  9 = A2
    if (ID13Field & 0x0100) {hexGillham |= 0x0040;} // Bit  8 = C4
    if (ID13Field & 0x0080) {hexGillham |= 0x4000;} // Bit  7 = A4
  //if (ID13Field & 0x0040) {hexGillham |= 0x0800;} // Bit  6 = X  or M 
    if (ID13Field & 0x0020) {hexGillham |= 0x0100;} // Bit  5 = B1 
    if (ID13Field & 0x0010) {hexGillham |= 0x0001;} // Bit  4 = D1 or Q
    if (ID13Field & 0x0008) {hexGillham |= 0x0200;} // Bit  3 = B2
    if (ID13Field & 0x0004) {hexGillham |= 0x0002;} // Bit  2 = D2
    if (ID13Field & 0x0002) {hexGillham |= 0x0400;} // Bit  1 = B4
    if (ID13Field & 0x0001) {hexGillham |= 0x0004;} // Bit  0 = D4

    return (hexGillham);
    }
//
//=========================================================================
//
// Decode the 13 bit AC altitude field (in DF 20 and others).
// Returns the altitude, and set 'unit' to either MODES_UNIT_METERS or MDOES_UNIT_FEETS.
//
int decodeAC13Field(int AC13Field, int *unit) {
    int m_bit  = AC13Field & 0x0040; // set = meters, clear = feet
    int q_bit  = AC13Field & 0x0010; // set = 25 ft encoding, clear = Gillham Mode C encoding

    if (!m_bit) {
        *unit = MODES_UNIT_FEET;
        if (q_bit) {
            // N is the 11 bit integer resulting from the removal of bit Q and M
            int n = ((AC13Field & 0x1F80) >> 2) |
                    ((AC13Field & 0x0020) >> 1) |
                     (AC13Field & 0x000F);
            // The final altitude is resulting number multiplied by 25, minus 1000.
            return ((n * 25) - 1000);
        } else {
            // N is an 11 bit Gillham coded altitude
            int n = ModeAToModeC(decodeID13Field(AC13Field));
            if (n < -12) {n = 0;}

            return (100 * n);
        }
    } else {
        *unit = MODES_UNIT_METERS;
        // TODO: Implement altitude when meter unit is selected
    }
    return 0;
}
//
//=========================================================================
//
// Decode the 12 bit AC altitude field (in DF 17 and others).
//
int decodeAC12Field(int AC12Field, int *unit) {
    int q_bit  = AC12Field & 0x10; // Bit 48 = Q

    *unit = MODES_UNIT_FEET;
    if (q_bit) {
        /// N is the 11 bit integer resulting from the removal of bit Q at bit 4
        int n = ((AC12Field & 0x0FE0) >> 1) | 
                 (AC12Field & 0x000F);
        // The final altitude is the resulting number multiplied by 25, minus 1000.
        return ((n * 25) - 1000);
    } else {
        // Make N a 13 bit Gillham coded altitude by inserting M=0 at bit 6
        int n = ((AC12Field & 0x0FC0) << 1) | 
                 (AC12Field & 0x003F);
        n = ModeAToModeC(decodeID13Field(n));
        if (n < -12) {n = 0;}

        return (100 * n);
    }
}
//
//=========================================================================
//
// Decode the 7 bit ground movement field PWL exponential style scale
//
int decodeMovementField(int movement) {
    int gspeed;

    // Note : movement codes 0,125,126,127 are all invalid, but they are 
    //        trapped for before this function is called.

    if      (movement  > 123) gspeed = 199; // > 175kt
    else if (movement  > 108) gspeed = ((movement - 108)  * 5) + 100;
    else if (movement  >  93) gspeed = ((movement -  93)  * 2) +  70;
    else if (movement  >  38) gspeed = ((movement -  38)     ) +  15;
    else if (movement  >  12) gspeed = ((movement -  11) >> 1) +   2;
    else if (movement  >   8) gspeed = ((movement -   6) >> 2) +   1;
    else                      gspeed = 0;

    return (gspeed);
}
//
//=========================================================================
//
// Capability table
char *ca_str[8] = {
    /* 0 */ "Level 1 (Surveillance Only)",
    /* 1 */ "Level 2 (DF0,4,5,11)",
    /* 2 */ "Level 3 (DF0,4,5,11,20,21)",
    /* 3 */ "Level 4 (DF0,4,5,11,20,21,24)",
    /* 4 */ "Level 2+3+4 (DF0,4,5,11,20,21,24,code7 - is on ground)",
    /* 5 */ "Level 2+3+4 (DF0,4,5,11,20,21,24,code7 - is airborne)",
    /* 6 */ "Level 2+3+4 (DF0,4,5,11,20,21,24,code7)",
    /* 7 */ "Level 7 ???"
};

// DF 18 Control field table.
char *cf_str[8] = {
    /* 0 */ "ADS-B ES/NT device with ICAO 24-bit address",
    /* 1 */ "ADS-B ES/NT device with other address",
    /* 2 */ "Fine format TIS-B",
    /* 3 */ "Coarse format TIS-B",
    /* 4 */ "TIS-B management message",
    /* 5 */ "TIS-B relay of ADS-B message with other address",
    /* 6 */ "ADS-B rebroadcast using DF-17 message format",
    /* 7 */ "Reserved"
};

// Flight status table
char *fs_str[8] = {
    /* 0 */ "Normal, Airborne",
    /* 1 */ "Normal, On the ground",
    /* 2 */ "ALERT,  Airborne",
    /* 3 */ "ALERT,  On the ground",
    /* 4 */ "ALERT & Special Position Identification. Airborne or Ground",
    /* 5 */ "Special Position Identification. Airborne or Ground",
    /* 6 */ "Value 6 is not assigned",
    /* 7 */ "Value 7 is not assigned"
};

// Emergency state table
// from https://www.ll.mit.edu/mission/aviation/publications/publication-files/atc-reports/Grappel_2007_ATC-334_WW-15318.pdf
// and 1090-DO-260B_FRAC
char *es_str[8] = {
    /* 0 */ "No emergency",
    /* 1 */ "General emergency (squawk 7700)",
    /* 2 */ "Lifeguard/Medical",
    /* 3 */ "Minimum fuel",
    /* 4 */ "No communications (squawk 7600)",
    /* 5 */ "Unlawful interference (squawk 7500)",
    /* 6 */ "Downed Aircraft",
    /* 7 */ "Reserved"
};
//
//=========================================================================
//
char *getMEDescription(int metype, int mesub) {
    char *mename = "Unknown";

    if (metype >= 1 && metype <= 4)
        mename = "Aircraft Identification and Category";
    else if (metype >= 5 && metype <= 8)
        mename = "Surface Position";
    else if (metype >= 9 && metype <= 18)
        mename = "Airborne Position (Baro Altitude)";
    else if (metype == 19 && mesub >=1 && mesub <= 4)
        mename = "Airborne Velocity";
    else if (metype >= 20 && metype <= 22)
        mename = "Airborne Position (GNSS Height)";
    else if (metype == 23 && mesub == 0)
        mename = "Test Message";
    else if (metype == 23 && mesub == 7)
        mename = "Test Message -- Squawk";
    else if (metype == 24 && mesub == 1)
        mename = "Surface System Status";
    else if (metype == 28 && mesub == 1)
        mename = "Extended Squitter Aircraft Status (Emergency)";
    else if (metype == 28 && mesub == 2)
        mename = "Extended Squitter Aircraft Status (1090ES TCAS RA)";
    else if (metype == 29 && (mesub == 0 || mesub == 1))
        mename = "Target State and Status Message";
    else if (metype == 31 && (mesub == 0 || mesub == 1))
        mename = "Aircraft Operational Status Message";
    return mename;
}
//
//=========================================================================
//
// Decode a raw Mode S message demodulated as a stream of bytes by detectModeS(), 
// and split it into fields populating a modesMessage structure.
//
void decodeModesMessage(struct modesMessage *mm, unsigned char *msg) {
    char *ais_charset = "?ABCDEFGHIJKLMNOPQRSTUVWXYZ????? ???????????????0123456789??????";

    // Work on our local copy
    memcpy(mm->msg, msg, MODES_LONG_MSG_BYTES);
    msg = mm->msg;

    // Get the message type ASAP as other operations depend on this
    mm->msgtype         = msg[0] >> 3; // Downlink Format
    mm->msgbits         = modesMessageLenByType(mm->msgtype);
    mm->crc             = modesChecksum(msg, mm->msgbits);

    if ((mm->crc) && (Modes.nfix_crc) && ((mm->msgtype == 17) || (mm->msgtype == 18))) {
//  if ((mm->crc) && (Modes.nfix_crc) && ((mm->msgtype == 11) || (mm->msgtype == 17))) {
        //
        // Fixing single bit errors in DF-11 is a bit dodgy because we have no way to 
        // know for sure if the crc is supposed to be 0 or not - it could be any value 
        // less than 80. Therefore, attempting to fix DF-11 errors can result in a 
        // multitude of possible crc solutions, only one of which is correct.
        // 
        // We should probably perform some sanity checks on corrected DF-11's before 
        // using the results. Perhaps check the ICAO against known aircraft, and check
        // IID against known good IID's. That's a TODO.
        //
        struct errorinfo *ei = modesChecksumDiagnose(mm->crc, mm->msgbits);
        if (ei != NULL && ei->errors <= Modes.nfix_crc) {
            modesChecksumFix(msg, ei);
            mm->correctedbits = ei->errors;
        }

        // If we correct, validate ICAO addr to help filter birthday paradox solutions.
        if (mm->correctedbits) {
            uint32_t ulAddr = (msg[1] << 16) | (msg[2] << 8) | (msg[3]); 
            if (!ICAOAddressWasRecentlySeen(ulAddr))
                mm->correctedbits = 0;
        }
    }
    //
    // Note that most of the other computation happens *after* we fix the 
    // single/two bit errors, otherwise we would need to recompute the fields again.
    //
    if (mm->msgtype == 11) { // DF 11
        mm->iid   =  mm->crc;
        mm->addr  = (msg[1] << 16) | (msg[2] << 8) | (msg[3]); 
        mm->ca    = (msg[0] & 0x07); // Responder capabilities

        if ((mm->crcok = (0 == mm->crc))) {
            // DF 11 : if crc == 0 try to populate our ICAO addresses whitelist.
            addRecentlySeenICAOAddr(mm->addr);
        } else if (mm->crc < 80) {
            mm->crcok = ICAOAddressWasRecentlySeen(mm->addr);
            if (mm->crcok) {
                addRecentlySeenICAOAddr(mm->addr);
            }
        }

    } else if (mm->msgtype == 17) { // DF 17
        mm->addr  = (msg[1] << 16) | (msg[2] << 8) | (msg[3]); 
        mm->ca    = (msg[0] & 0x07); // Responder capabilities

        if ((mm->crcok = (0 == mm->crc))) {
            // DF 17 : if crc == 0 try to populate our ICAO addresses whitelist.
            addRecentlySeenICAOAddr(mm->addr);
        }

    } else if (mm->msgtype == 18) { // DF 18
        mm->addr  = (msg[1] << 16) | (msg[2] << 8) | (msg[3]); 
        mm->ca    = (msg[0] & 0x07); // Control Field

        if ((mm->crcok = (0 == mm->crc))) {
            // DF 18 : if crc == 0 try to populate our ICAO addresses whitelist.
            addRecentlySeenICAOAddr(mm->addr);
        }

    } else { // All other DF's
        // Compare the checksum with the whitelist of recently seen ICAO 
        // addresses. If it matches one, then declare the message as valid
        mm->crcok = ICAOAddressWasRecentlySeen(mm->addr = mm->crc);
    }

    // If we're checking CRC and the CRC is invalid, then we can't trust any 
    // of the data contents, so save time and give up now.
    if ((Modes.check_crc) && (!mm->crcok) && (!mm->correctedbits)) { return;}

    // Fields for DF0, DF16
    if (mm->msgtype == 0  || mm->msgtype == 16) {
        if (msg[0] & 0x04) {                       // VS Bit
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID | MODES_ACFLAGS_AOG;
        } else {
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID;
        }
    }

    // Fields for DF11, DF17
    if (mm->msgtype == 11 || mm->msgtype == 17) {
        if (mm->ca == 4) {
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID | MODES_ACFLAGS_AOG;
        } else if (mm->ca == 5) {
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID;
        }
    }
          
    // Fields for DF5, DF21 = Gillham encoded Squawk
    if (mm->msgtype == 5  || mm->msgtype == 21) {
        int ID13Field = ((msg[2] << 8) | msg[3]) & 0x1FFF; 
        if (ID13Field) {
            mm->bFlags |= MODES_ACFLAGS_SQUAWK_VALID;
            mm->modeA   = decodeID13Field(ID13Field);
        }
    }

    // Fields for DF0, DF4, DF16, DF20 13 bit altitude
    if (mm->msgtype == 0  || mm->msgtype == 4 ||
        mm->msgtype == 16 || mm->msgtype == 20) {
        int AC13Field = ((msg[2] << 8) | msg[3]) & 0x1FFF; 
        if (AC13Field) { // Only attempt to decode if a valid (non zero) altitude is present
            mm->bFlags  |= MODES_ACFLAGS_ALTITUDE_VALID;
            mm->altitude = decodeAC13Field(AC13Field, &mm->unit);
        }
    }

    // Fields for DF4, DF5, DF20, DF21
    if ((mm->msgtype == 4) || (mm->msgtype == 20) ||
        (mm->msgtype == 5) || (mm->msgtype == 21)) {
        mm->bFlags  |= MODES_ACFLAGS_FS_VALID;
        mm->fs       = msg[0]  & 7;               // Flight status for DF4,5,20,21
        if (mm->fs <= 3) {
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID;
            if (mm->fs & 1)
                {mm->bFlags |= MODES_ACFLAGS_AOG;}
        }
    }

    // Fields for DF17, DF18_CF0, DF18_CF1, DF18_CF6 squitters
    if (  (mm->msgtype == 17) 
      || ((mm->msgtype == 18) && ((mm->ca == 0) || (mm->ca == 1) || (mm->ca == 6)) )) {
         int metype = mm->metype = msg[4] >> 3;   // Extended squitter message type
         int mesub  = mm->mesub  = (metype == 29 ? ((msg[4]&6)>>1) : (msg[4]  & 7));   // Extended squitter message subtype

        // Decode the extended squitter message

        if (metype >= 1 && metype <= 4) { // Aircraft Identification and Category
            uint32_t chars;
            mm->bFlags |= MODES_ACFLAGS_CALLSIGN_VALID;

            chars = (msg[5] << 16) | (msg[6] << 8) | (msg[7]);
            mm->flight[3] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[2] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[1] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[0] = ais_charset[chars & 0x3F];

            chars = (msg[8] << 16) | (msg[9] << 8) | (msg[10]);
            mm->flight[7] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[6] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[5] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[4] = ais_charset[chars & 0x3F];

            mm->flight[8] = '\0';

        } else if (metype == 19) { // Airborne Velocity Message

           // Presumably airborne if we get an Airborne Velocity Message
            mm->bFlags |= MODES_ACFLAGS_AOG_VALID; 

            if ( (mesub >= 1) && (mesub <= 4) ) {
                int vert_rate = ((msg[8] & 0x07) << 6) | (msg[9] >> 2);
                if (vert_rate) {
                    --vert_rate;
                    if (msg[8] & 0x08) 
                      {vert_rate = 0 - vert_rate;}
                    mm->vert_rate =  vert_rate * 64;
                    mm->bFlags   |= MODES_ACFLAGS_VERTRATE_VALID;
                }
            }

            if ((mesub == 1) || (mesub == 2)) {
                int ew_raw = ((msg[5] & 0x03) << 8) |  msg[6];
                int ew_vel = ew_raw - 1;
                int ns_raw = ((msg[7] & 0x7F) << 3) | (msg[8] >> 5);
                int ns_vel = ns_raw - 1;

                if (mesub == 2) { // If (supersonic) unit is 4 kts
                   ns_vel = ns_vel << 2;
                   ew_vel = ew_vel << 2;
                }

                if (ew_raw) { // Do East/West  
                    mm->bFlags |= MODES_ACFLAGS_EWSPEED_VALID;
                    if (msg[5] & 0x04)
                        {ew_vel = 0 - ew_vel;}                   
                    mm->ew_velocity = ew_vel;
                }

                if (ns_raw) { // Do North/South
                    mm->bFlags |= MODES_ACFLAGS_NSSPEED_VALID;
                    if (msg[7] & 0x80)
                        {ns_vel = 0 - ns_vel;}                   
                    mm->ns_velocity = ns_vel;
                }

                if (ew_raw && ns_raw) {
                    // Compute velocity and angle from the two speed components
                    mm->bFlags |= (MODES_ACFLAGS_SPEED_VALID | MODES_ACFLAGS_HEADING_VALID | MODES_ACFLAGS_NSEWSPD_VALID);
                    mm->velocity = (int) sqrt((ns_vel * ns_vel) + (ew_vel * ew_vel));

                    if (mm->velocity) {
                        mm->heading = (int) (atan2(ew_vel, ns_vel) * 180.0 / M_PI);
                        // We don't want negative values but a 0-360 scale
                        if (mm->heading < 0) mm->heading += 360;
                    }
                }

            } else if (mesub == 3 || mesub == 4) {
                int airspeed = ((msg[7] & 0x7f) << 3) | (msg[8] >> 5);
                if (airspeed) {
                    mm->bFlags |= MODES_ACFLAGS_SPEED_VALID;
                    --airspeed;
                    if (mesub == 4)  // If (supersonic) unit is 4 kts
                        {airspeed = airspeed << 2;}
                    mm->velocity =  airspeed;
                }

                if (msg[5] & 0x04) {
                    mm->bFlags |= MODES_ACFLAGS_HEADING_VALID;
                    mm->heading = ((((msg[5] & 0x03) << 8) | msg[6]) * 45) >> 7;
                }
            }

        } else if (metype >= 5 && metype <= 22) { // Position Message
            mm->raw_latitude  = ((msg[6] & 3) << 15) | (msg[7] << 7) | (msg[8] >> 1);
            mm->raw_longitude = ((msg[8] & 1) << 16) | (msg[9] << 8) | (msg[10]);
            mm->bFlags       |= (mm->msg[6] & 0x04) ? MODES_ACFLAGS_LLODD_VALID 
                                                    : MODES_ACFLAGS_LLEVEN_VALID;
            if (metype >= 9) {        // Airborne
                int AC12Field = ((msg[5] << 4) | (msg[6] >> 4)) & 0x0FFF;
                mm->bFlags |= MODES_ACFLAGS_AOG_VALID;
                if (AC12Field) {// Only attempt to decode if a valid (non zero) altitude is present
                    mm->bFlags |= MODES_ACFLAGS_ALTITUDE_VALID;
                    mm->altitude = decodeAC12Field(AC12Field, &mm->unit);
                }
            } else {                      // Ground
                int movement = ((msg[4] << 4) | (msg[5] >> 4)) & 0x007F;
                mm->bFlags |= MODES_ACFLAGS_AOG_VALID | MODES_ACFLAGS_AOG;
                if ((movement) && (movement < 125)) {
                    mm->bFlags |= MODES_ACFLAGS_SPEED_VALID;
                    mm->velocity = decodeMovementField(movement);
                }

                if (msg[5] & 0x08) {
                    mm->bFlags |= MODES_ACFLAGS_HEADING_VALID;
                    mm->heading = ((((msg[5] << 4) | (msg[6] >> 4)) & 0x007F) * 45) >> 4;
                }
            }

        } else if (metype == 23) {	// Test metype squawk field
			if (mesub == 7) {		// (see 1090-WP-15-20)
				int ID13Field = (((msg[5] << 8) | msg[6]) & 0xFFF1)>>3;
				if (ID13Field) {
					mm->bFlags |= MODES_ACFLAGS_SQUAWK_VALID;
					mm->modeA   = decodeID13Field(ID13Field);
				}
            }

        } else if (metype == 24) { // Reserved for Surface System Status

        } else if (metype == 28) { // Extended Squitter Aircraft Status
			if (mesub == 1) {      // Emergency status squawk field
				int ID13Field = (((msg[5] << 8) | msg[6]) & 0x1FFF);
				if (ID13Field) {
					mm->bFlags |= MODES_ACFLAGS_SQUAWK_VALID;
					mm->modeA   = decodeID13Field(ID13Field);
				}
            }

        } else if (metype == 29) { // Aircraft Trajectory Intent

        } else if (metype == 30) { // Aircraft Operational Coordination

        } else if (metype == 31) { // Aircraft Operational Status

        } else { // Other metypes

        }
    }

    // Fields for DF20, DF21 Comm-B
    if ((mm->msgtype == 20) || (mm->msgtype == 21)){

        if (msg[4] == 0x20) { // Aircraft Identification
            uint32_t chars;
            mm->bFlags |= MODES_ACFLAGS_CALLSIGN_VALID;

            chars = (msg[5] << 16) | (msg[6] << 8) | (msg[7]);
            mm->flight[3] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[2] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[1] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[0] = ais_charset[chars & 0x3F];

            chars = (msg[8] << 16) | (msg[9] << 8) | (msg[10]);
            mm->flight[7] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[6] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[5] = ais_charset[chars & 0x3F]; chars = chars >> 6;
            mm->flight[4] = ais_charset[chars & 0x3F];

            mm->flight[8] = '\0';
        } else {
        }
    }
}
//
//=========================================================================
//
// This function gets a decoded Mode S Message and prints it on the screen
// in a human readable format.
//
void displayModesMessage(struct modesMessage *mm) {
    int j;
    unsigned char * pTimeStamp;

    // Handle only addresses mode first.
    if (Modes.onlyaddr) {
        printf("%06x\n", mm->addr);
        return;         // Enough for --onlyaddr mode
    }

    // Show the raw message.
    if (Modes.mlat && mm->timestampMsg) {
        printf("@");
        pTimeStamp = (unsigned char *) &mm->timestampMsg;
        for (j=5; j>=0;j--) {
            printf("%02X",pTimeStamp[j]);
        } 
    } else
        printf("*");

    for (j = 0; j < mm->msgbits/8; j++) printf("%02x", mm->msg[j]);
    printf(";\n");

    if (Modes.raw) {
        fflush(stdout); // Provide data to the reader ASAP
        return;         // Enough for --raw mode
    }

    if (mm->msgtype < 32)
        printf("CRC: %06x (%s)\n", (int)mm->crc, mm->crcok ? "ok" : "wrong");

    if (mm->correctedbits != 0)
        printf("No. of bit errors fixed: %d\n", mm->correctedbits);

    printf("SNR: %d.%d dB\n", mm->signalLevel/5, 2*(mm->signalLevel%5));

    if (mm->timestampMsg)
        printf("Time: %.2fus (phase: %d)\n", mm->timestampMsg / 12.0, (unsigned int) (360 * (mm->timestampMsg % 6) / 6));

    if (mm->msgtype == 0) { // DF 0
        printf("DF 0: Short Air-Air Surveillance.\n");
        printf("  VS             : %s\n",  (mm->msg[0] & 0x04) ? "Ground" : "Airborne");
        printf("  CC             : %d\n", ((mm->msg[0] & 0x02) >> 1));
        printf("  SL             : %d\n", ((mm->msg[1] & 0xE0) >> 5));
        printf("  Altitude       : %d %s\n", mm->altitude,
            (mm->unit == MODES_UNIT_METERS) ? "meters" : "feet");
        printf("  ICAO Address   : %06x\n", mm->addr);

    } else if (mm->msgtype == 4 || mm->msgtype == 20) {
        printf("DF %d: %s, Altitude Reply.\n", mm->msgtype,
            (mm->msgtype == 4) ? "Surveillance" : "Comm-B");
        printf("  Flight Status  : %s\n", fs_str[mm->fs]);
        printf("  DR             : %d\n", ((mm->msg[1] >> 3) & 0x1F));
        printf("  UM             : %d\n", (((mm->msg[1]  & 7) << 3) | (mm->msg[2] >> 5)));
        printf("  Altitude       : %d %s\n", mm->altitude,
            (mm->unit == MODES_UNIT_METERS) ? "meters" : "feet");
        printf("  ICAO Address   : %06x\n", mm->addr);

        if (mm->msgtype == 20) {
            printf("  Comm-B BDS     : %x\n", mm->msg[4]);

            // Decode the extended squitter message
            if        ( mm->msg[4]       == 0x20) { // BDS 2,0 Aircraft identification
                printf("    BDS 2,0 Aircraft Identification : %s\n", mm->flight);
/*
            } else if ( mm->msg[4]       == 0x10) { // BDS 1,0 Datalink Capability report
                printf("    BDS 1,0 Datalink Capability report\n");

            } else if ( mm->msg[4]       == 0x30) { // BDS 3,0 ACAS Active Resolution Advisory
                printf("    BDS 3,0 ACAS Active Resolution Advisory\n");

            } else if ((mm->msg[4] >> 3) ==   28) { // BDS 6,1 Extended Squitter Emergency/Priority Status
                printf("    BDS 6,1 Emergency/Priority Status\n");

            } else if ((mm->msg[4] >> 3) ==   29) { // BDS 6,2 Target State and Status
                printf("    BDS 6,2 Target State and Status\n");

            } else if ((mm->msg[4] >> 3) ==   31) { // BDS 6,5 Extended Squitter Aircraft Operational Status
                printf("    BDS 6,5 Aircraft Operational Status\n");
*/
            }        
        }

    } else if (mm->msgtype == 5 || mm->msgtype == 21) {
        printf("DF %d: %s, Identity Reply.\n", mm->msgtype,
            (mm->msgtype == 5) ? "Surveillance" : "Comm-B");
        printf("  Flight Status  : %s\n", fs_str[mm->fs]);
        printf("  DR             : %d\n", ((mm->msg[1] >> 3) & 0x1F));
        printf("  UM             : %d\n", (((mm->msg[1]  & 7) << 3) | (mm->msg[2] >> 5)));
        printf("  Squawk         : %04x\n", mm->modeA);
        printf("  ICAO Address   : %06x\n", mm->addr);

        if (mm->msgtype == 21) {
            printf("  Comm-B BDS     : %x\n", mm->msg[4]);

            // Decode the extended squitter message
            if        ( mm->msg[4]       == 0x20) { // BDS 2,0 Aircraft identification
                printf("    BDS 2,0 Aircraft Identification : %s\n", mm->flight);
/*
            } else if ( mm->msg[4]       == 0x10) { // BDS 1,0 Datalink Capability report
                printf("    BDS 1,0 Datalink Capability report\n");

            } else if ( mm->msg[4]       == 0x30) { // BDS 3,0 ACAS Active Resolution Advisory
                printf("    BDS 3,0 ACAS Active Resolution Advisory\n");

            } else if ((mm->msg[4] >> 3) ==   28) { // BDS 6,1 Extended Squitter Emergency/Priority Status
                printf("    BDS 6,1 Emergency/Priority Status\n");

            } else if ((mm->msg[4] >> 3) ==   29) { // BDS 6,2 Target State and Status
                printf("    BDS 6,2 Target State and Status\n");

            } else if ((mm->msg[4] >> 3) ==   31) { // BDS 6,5 Extended Squitter Aircraft Operational Status
                printf("    BDS 6,5 Aircraft Operational Status\n");
*/
            }        
        }

    } else if (mm->msgtype == 11) { // DF 11
        printf("DF 11: All Call Reply.\n");
        printf("  Capability  : %d (%s)\n", mm->ca, ca_str[mm->ca]);
        printf("  ICAO Address: %06x\n", mm->addr);
        if (mm->iid > 16)
            {printf("  IID         : SI-%02d\n", mm->iid-16);}
        else
            {printf("  IID         : II-%02d\n", mm->iid);}

    } else if (mm->msgtype == 16) { // DF 16
        printf("DF 16: Long Air to Air ACAS\n");
        printf("  VS             : %s\n",  (mm->msg[0] & 0x04) ? "Ground" : "Airborne");
        printf("  CC             : %d\n", ((mm->msg[0] & 0x02) >> 1));
        printf("  SL             : %d\n", ((mm->msg[1] & 0xE0) >> 5));
        printf("  Altitude       : %d %s\n", mm->altitude,
            (mm->unit == MODES_UNIT_METERS) ? "meters" : "feet");
        printf("  ICAO Address   : %06x\n", mm->addr);

    } else if (mm->msgtype == 17) { // DF 17
        printf("DF 17: ADS-B message.\n");
        printf("  Capability     : %d (%s)\n", mm->ca, ca_str[mm->ca]);
        printf("  ICAO Address   : %06x\n", mm->addr);
        printf("  Extended Squitter  Type: %d\n", mm->metype);
        printf("  Extended Squitter  Sub : %d\n", mm->mesub);
        printf("  Extended Squitter  Name: %s\n", getMEDescription(mm->metype, mm->mesub));

        // Decode the extended squitter message
        if (mm->metype >= 1 && mm->metype <= 4) { // Aircraft identification
            printf("    Aircraft Type  : %c%d\n", ('A' + 4 - mm->metype), mm->mesub);
            printf("    Identification : %s\n", mm->flight);

        } else if (mm->metype == 19) { // Airborne Velocity
            if (mm->mesub == 1 || mm->mesub == 2) {
                printf("    EW status         : %s\n", (mm->bFlags & MODES_ACFLAGS_EWSPEED_VALID)  ? "Valid" : "Unavailable");
                printf("    EW velocity       : %d\n", mm->ew_velocity);
                printf("    NS status         : %s\n", (mm->bFlags & MODES_ACFLAGS_NSSPEED_VALID)  ? "Valid" : "Unavailable");
                printf("    NS velocity       : %d\n", mm->ns_velocity);
                printf("    Vertical status   : %s\n", (mm->bFlags & MODES_ACFLAGS_VERTRATE_VALID) ? "Valid" : "Unavailable");
                printf("    Vertical rate src : %d\n", ((mm->msg[8] >> 4) & 1));
                printf("    Vertical rate     : %d\n", mm->vert_rate);

            } else if (mm->mesub == 3 || mm->mesub == 4) {
                printf("    Heading status    : %s\n", (mm->bFlags & MODES_ACFLAGS_HEADING_VALID)  ? "Valid" : "Unavailable");
                printf("    Heading           : %d\n", mm->heading);
                printf("    Airspeed status   : %s\n", (mm->bFlags & MODES_ACFLAGS_SPEED_VALID)    ? "Valid" : "Unavailable");
                printf("    Airspeed          : %d\n", mm->velocity);
                printf("    Vertical status   : %s\n", (mm->bFlags & MODES_ACFLAGS_VERTRATE_VALID) ? "Valid" : "Unavailable");
                printf("    Vertical rate src : %d\n", ((mm->msg[8] >> 4) & 1));
                printf("    Vertical rate     : %d\n", mm->vert_rate);

            } else {
                printf("    Unrecognized ME subtype: %d subtype: %d\n", mm->metype, mm->mesub);
            }

        } else if (mm->metype >= 5 && mm->metype <= 22) { // Airborne position Baro
            printf("    F flag   : %s\n", (mm->msg[6] & 0x04) ? "odd" : "even");
            printf("    T flag   : %s\n", (mm->msg[6] & 0x08) ? "UTC" : "non-UTC");
            printf("    Altitude : %d feet\n", mm->altitude);
            if (mm->bFlags & MODES_ACFLAGS_LATLON_VALID) {
                printf("    Latitude : %f\n", mm->fLat);
                printf("    Longitude: %f\n", mm->fLon);
            } else {
                printf("    Latitude : %d (not decoded)\n", mm->raw_latitude);
                printf("    Longitude: %d (not decoded)\n", mm->raw_longitude);
            }

        } else if (mm->metype == 28) { // Extended Squitter Aircraft Status
            if (mm->mesub == 1) {
				printf("    Emergency State: %s\n", es_str[(mm->msg[5] & 0xE0) >> 5]);
				printf("    Squawk: %04x\n", mm->modeA);
            } else {
                printf("    Unrecognized ME subtype: %d subtype: %d\n", mm->metype, mm->mesub);
            }

        } else if (mm->metype == 23) { // Test Message
			if (mm->mesub == 7) {
				printf("    Squawk: %04x\n", mm->modeA);
            } else {
                printf("    Unrecognized ME subtype: %d subtype: %d\n", mm->metype, mm->mesub);
			}
        } else {
            printf("    Unrecognized ME type: %d subtype: %d\n", mm->metype, mm->mesub);
        }

    } else if (mm->msgtype == 18) { // DF 18 
        printf("DF 18: Extended Squitter.\n");
        printf("  Control Field : %d (%s)\n", mm->ca, cf_str[mm->ca]);
        if ((mm->ca == 0) || (mm->ca == 1) || (mm->ca == 6)) {
            if (mm->ca == 1) {
                printf("  Other Address : %06x\n", mm->addr);
            } else {
                printf("  ICAO Address  : %06x\n", mm->addr);
            }
            printf("  Extended Squitter  Type: %d\n", mm->metype);
            printf("  Extended Squitter  Sub : %d\n", mm->mesub);
            printf("  Extended Squitter  Name: %s\n", getMEDescription(mm->metype, mm->mesub));

            // Decode the extended squitter message
            if (mm->metype >= 1 && mm->metype <= 4) { // Aircraft identification
                printf("    Aircraft Type  : %c%d\n", ('A' + 4 - mm->metype), mm->mesub);
                printf("    Identification : %s\n", mm->flight);

            } else if (mm->metype == 19) { // Airborne Velocity
                if (mm->mesub == 1 || mm->mesub == 2) {
                    printf("    EW status         : %s\n", (mm->bFlags & MODES_ACFLAGS_EWSPEED_VALID)  ? "Valid" : "Unavailable");
                    printf("    EW velocity       : %d\n", mm->ew_velocity);
                    printf("    NS status         : %s\n", (mm->bFlags & MODES_ACFLAGS_NSSPEED_VALID)  ? "Valid" : "Unavailable");
                    printf("    NS velocity       : %d\n", mm->ns_velocity);
                    printf("    Vertical status   : %s\n", (mm->bFlags & MODES_ACFLAGS_VERTRATE_VALID) ? "Valid" : "Unavailable");
                    printf("    Vertical rate src : %d\n", ((mm->msg[8] >> 4) & 1));
                    printf("    Vertical rate     : %d\n", mm->vert_rate);

                } else if (mm->mesub == 3 || mm->mesub == 4) {
                    printf("    Heading status    : %s\n", (mm->bFlags & MODES_ACFLAGS_HEADING_VALID)  ? "Valid" : "Unavailable");
                    printf("    Heading           : %d\n", mm->heading);
                    printf("    Airspeed status   : %s\n", (mm->bFlags & MODES_ACFLAGS_SPEED_VALID)    ? "Valid" : "Unavailable");
                    printf("    Airspeed          : %d\n", mm->velocity);
                    printf("    Vertical status   : %s\n", (mm->bFlags & MODES_ACFLAGS_VERTRATE_VALID) ? "Valid" : "Unavailable");
                    printf("    Vertical rate src : %d\n", ((mm->msg[8] >> 4) & 1));
                    printf("    Vertical rate     : %d\n", mm->vert_rate);

                } else {
                    printf("    Unrecognized ME subtype: %d subtype: %d\n", mm->metype, mm->mesub);
                }

            } else if (mm->metype >= 5 && mm->metype <= 22) { // Ground or Airborne position, Baro or GNSS
                printf("    F flag   : %s\n", (mm->msg[6] & 0x04) ? "odd" : "even");
                printf("    T flag   : %s\n", (mm->msg[6] & 0x08) ? "UTC" : "non-UTC");
                printf("    Altitude : %d feet\n", mm->altitude);
                if (mm->bFlags & MODES_ACFLAGS_LATLON_VALID) {
                    printf("    Latitude : %f\n", mm->fLat);
                    printf("    Longitude: %f\n", mm->fLon);
                } else {
                    printf("    Latitude : %d (not decoded)\n", mm->raw_latitude);
                    printf("    Longitude: %d (not decoded)\n", mm->raw_longitude);
                }

            } else {
                printf("    Unrecognized ME type: %d subtype: %d\n", mm->metype, mm->mesub);
            }
        }             

    } else if (mm->msgtype == 19) { // DF 19
        printf("DF 19: Military Extended Squitter.\n");

    } else if (mm->msgtype == 22) { // DF 22
        printf("DF 22: Military Use.\n");

    } else if (mm->msgtype == 24) { // DF 24
        printf("DF 24: Comm D Extended Length Message.\n");

    } else if (mm->msgtype == 32) { // DF 32 is special code we use for Mode A/C
        printf("SSR : Mode A/C Reply.\n");
        if (mm->fs & 0x0080) {
            printf("  Mode A : %04x IDENT\n", mm->modeA);
        } else {
            printf("  Mode A : %04x\n", mm->modeA);
            if (mm->bFlags & MODES_ACFLAGS_ALTITUDE_VALID)
                {printf("  Mode C : %d feet\n", mm->altitude);}
        }

    } else {
        printf("DF %d: Unknown DF Format.\n", mm->msgtype);
    }

    printf("\n");
}
//
//=========================================================================
//
// Turn I/Q samples pointed by Modes.data into the magnitude vector
// pointed by Modes.magnitude.
//
void computeMagnitudeVector(uint16_t *p) {
    uint16_t *m = &Modes.magnitude[Modes.trailing_samples];
    uint32_t j;

    memcpy(Modes.magnitude,&Modes.magnitude[MODES_ASYNC_BUF_SAMPLES], Modes.trailing_samples * 2);

    // Compute the magnitudo vector. It's just SQRT(I^2 + Q^2), but
    // we rescale to the 0-255 range to exploit the full resolution.
    for (j = 0; j < MODES_ASYNC_BUF_SAMPLES; j ++) {
        *m++ = Modes.maglut[*p++];
    }
}

//
//=========================================================================
//
// When a new message is available, because it was decoded from the RTL device, 
// file, or received in the TCP input port, or any other way we can receive a 
// decoded message, we call this function in order to use the message.
//
// Basically this function passes a raw message to the upper layers for further
// processing and visualization
//
void useModesMessage(struct modesMessage *mm) {
    if ((Modes.check_crc == 0) || (mm->crcok) || (mm->correctedbits)) { // not checking, ok or fixed
        ++Modes.stats_current.messages_total;

        // If we are decoding, track aircraft
        interactiveReceiveData(mm);

        // In non-interactive non-quiet mode, display messages on standard output
        if (!Modes.interactive && !Modes.quiet) {
            displayModesMessage(mm);
        }

        // Feed output clients
        if (Modes.net) {modesQueueOutput(mm);}
    }
}

//
// ===================== Mode S detection and decoding  ===================
//
