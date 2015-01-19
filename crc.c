// dump1090, a Mode S messages decoder for RTLSDR devices.
//
// Copyright (C) 2012 by Salvatore Sanfilippo <antirez@gmail.com>
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//  *  Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//
//  *  Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in the
//     documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

#include "dump1090.h"

// Parity table for MODE S Messages.
// The table contains 112 elements, every element corresponds to a bit set
// in the message, starting from the first bit of actual data after the
// preamble.
//
// For messages of 112 bit, the whole table is used.
// For messages of 56 bits only the last 56 elements are used.
//
// The algorithm is as simple as xoring all the elements in this table
// for which the corresponding bit on the message is set to 1.
//
// The latest 24 elements in this table are set to 0 as the checksum at the
// end of the message should not affect the computation.
//
// Note: this function can be used with DF11 and DF17, other modes have
// the CRC xored with the sender address as they are reply to interrogations,
// but a casual listener can't split the address from the checksum.
//
uint32_t modes_checksum_table[112] = {
0x3935ea, 0x1c9af5, 0xf1b77e, 0x78dbbf, 0xc397db, 0x9e31e9, 0xb0e2f0, 0x587178,
0x2c38bc, 0x161c5e, 0x0b0e2f, 0xfa7d13, 0x82c48d, 0xbe9842, 0x5f4c21, 0xd05c14,
0x682e0a, 0x341705, 0xe5f186, 0x72f8c3, 0xc68665, 0x9cb936, 0x4e5c9b, 0xd8d449,
0x939020, 0x49c810, 0x24e408, 0x127204, 0x093902, 0x049c81, 0xfdb444, 0x7eda22,
0x3f6d11, 0xe04c8c, 0x702646, 0x381323, 0xe3f395, 0x8e03ce, 0x4701e7, 0xdc7af7,
0x91c77f, 0xb719bb, 0xa476d9, 0xadc168, 0x56e0b4, 0x2b705a, 0x15b82d, 0xf52612,
0x7a9309, 0xc2b380, 0x6159c0, 0x30ace0, 0x185670, 0x0c2b38, 0x06159c, 0x030ace,
0x018567, 0xff38b7, 0x80665f, 0xbfc92b, 0xa01e91, 0xaff54c, 0x57faa6, 0x2bfd53,
0xea04ad, 0x8af852, 0x457c29, 0xdd4410, 0x6ea208, 0x375104, 0x1ba882, 0x0dd441,
0xf91024, 0x7c8812, 0x3e4409, 0xe0d800, 0x706c00, 0x383600, 0x1c1b00, 0x0e0d80,
0x0706c0, 0x038360, 0x01c1b0, 0x00e0d8, 0x00706c, 0x003836, 0x001c1b, 0xfff409,
0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000,
0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000
};

uint32_t modesChecksum(unsigned char *msg, int bits) {
    uint32_t   crc = 0;
    uint32_t   rem = 0;
    int        offset = (bits == 112) ? 0 : (112-56);
    uint8_t    theByte = *msg;
    uint32_t * pCRCTable = &modes_checksum_table[offset];
    int j;

    // We don't really need to include the checksum itself
    bits -= 24;
    for(j = 0; j < bits; j++) {
        if ((j & 7) == 0)
            theByte = *msg++;

        // If bit is set, xor with corresponding table entry.
        if (theByte & 0x80) {crc ^= *pCRCTable;} 
        pCRCTable++;
        theByte = theByte << 1; 
    }

    rem = (msg[0] << 16) | (msg[1] << 8) | msg[2]; // message checksum
    return ((crc ^ rem) & 0x00FFFFFF); // 24 bit checksum syndrome.
}

//=========================================================================
//
// Code for introducing a less CPU-intensive method of correcting
// single bit errors.
//
// Makes use of the fact that the crc checksum is linear with respect to
// the bitwise xor operation, i.e.
//      crc(m^e) = (crc(m)^crc(e)
// where m and e are the message resp. error bit vectors.
//
// Call crc(e) the syndrome.
//
// The code below works by precomputing a table of (crc(e), e) for all
// possible error vectors e (here only single bit and double bit errors),
// search for the syndrome in the table, and correct the then known error.
// The error vector e is represented by one or two bit positions that are
// changed. If a second bit position is not used, it is -1.
//
// Run-time is binary search in a sorted table, plus some constant overhead,
// instead of running through all possible bit positions (resp. pairs of
// bit positions).
//
struct errorinfo {
    uint32_t syndrome;                 // CRC syndrome
    int      bits;                     // Number of bit positions to fix
    int      pos[MODES_MAX_BITERRORS]; // Bit positions corrected by this syndrome
};

#define NERRORINFO \
        (MODES_LONG_MSG_BITS+MODES_LONG_MSG_BITS*(MODES_LONG_MSG_BITS-1)/2)
struct errorinfo bitErrorTable[NERRORINFO];

// Compare function as needed for stdlib's qsort and bsearch functions
static int cmpErrorInfo(const void *p0, const void *p1) {
    struct errorinfo *e0 = (struct errorinfo*)p0;
    struct errorinfo *e1 = (struct errorinfo*)p1;
    if (e0->syndrome == e1->syndrome) {
        return 0;
    } else if (e0->syndrome < e1->syndrome) {
        return -1;
    } else {
        return 1;
    }
}
//
//=========================================================================
//
// Compute the table of all syndromes for 1-bit and 2-bit error vectors
void modesInitErrorInfo() {
    unsigned char msg[MODES_LONG_MSG_BYTES];
    int i, j, n;
    uint32_t crc;
    n = 0;
    memset(bitErrorTable, 0, sizeof(bitErrorTable));
    memset(msg, 0, MODES_LONG_MSG_BYTES);
    // Add all possible single and double bit errors
    // don't include errors in first 5 bits (DF type)
    for (i = 5;  i < MODES_LONG_MSG_BITS;  i++) {
        int bytepos0 = (i >> 3);
        int mask0 = 1 << (7 - (i & 7));
        msg[bytepos0] ^= mask0;          // create error0
        crc = modesChecksum(msg, MODES_LONG_MSG_BITS);
        bitErrorTable[n].syndrome = crc;      // single bit error case
        bitErrorTable[n].bits = 1;
        bitErrorTable[n].pos[0] = i;
        bitErrorTable[n].pos[1] = -1;
        n += 1;

        if (Modes.nfix_crc > 1) {
            for (j = i+1;  j < MODES_LONG_MSG_BITS;  j++) {
                int bytepos1 = (j >> 3);
                int mask1 = 1 << (7 - (j & 7));
                msg[bytepos1] ^= mask1;  // create error1
                crc = modesChecksum(msg, MODES_LONG_MSG_BITS);
                if (n >= NERRORINFO) {
                    //fprintf(stderr, "Internal error, too many entries, fix NERRORINFO\n");
                    break;
                }
                bitErrorTable[n].syndrome = crc; // two bit error case
                bitErrorTable[n].bits = 2;
                bitErrorTable[n].pos[0] = i;
                bitErrorTable[n].pos[1] = j;
                n += 1;
                msg[bytepos1] ^= mask1;  // revert error1
            }
        }
        msg[bytepos0] ^= mask0;          // revert error0
    }
    qsort(bitErrorTable, NERRORINFO, sizeof(struct errorinfo), cmpErrorInfo);

    // Test code: report if any syndrome appears at least twice. In this
    // case the correction cannot be done without ambiguity.
    // Tried it, does not happen for 1- and 2-bit errors. 
    /*
    for (i = 1;  i < NERRORINFO;  i++) {
        if (bitErrorTable[i-1].syndrome == bitErrorTable[i].syndrome) {
            fprintf(stderr, "modesInitErrorInfo: Collision for syndrome %06x\n",
                            (int)bitErrorTable[i].syndrome);
        }
    }

    for (i = 0;  i < NERRORINFO;  i++) {
        printf("syndrome %06x    bit0 %3d    bit1 %3d\n",
               bitErrorTable[i].syndrome,
               bitErrorTable[i].pos0, bitErrorTable[i].pos1);
    }
    */
}
//
//=========================================================================
//
// Search for syndrome in table and if an entry is found, flip the necessary
// bits. Make sure the indices fit into the array
// Additional parameter: fix only less than maxcorrected bits, and record
// fixed bit positions in corrected[]. This array can be NULL, otherwise
// must be of length at least maxcorrected.
// Return number of fixed bits.
//
int fixBitErrors(unsigned char *msg, int bits, int maxfix, char *fixedbits) {
    struct errorinfo *pei;
    struct errorinfo ei;
    int bitpos, offset, res, i;
    memset(&ei, 0, sizeof(struct errorinfo));
    ei.syndrome = modesChecksum(msg, bits);
    pei = bsearch(&ei, bitErrorTable, NERRORINFO,
                  sizeof(struct errorinfo), cmpErrorInfo);
    if (pei == NULL) {
        return 0; // No syndrome found
    }

    // Check if the syndrome fixes more bits than we allow
    if (maxfix < pei->bits) {
        return 0;
    }

    // Check that all bit positions lie inside the message length
    offset = MODES_LONG_MSG_BITS-bits;
    for (i = 0;  i < pei->bits;  i++) {
	    bitpos = pei->pos[i] - offset;
	    if ((bitpos < 0) || (bitpos >= bits)) {
		    return 0;
	    }
    }

    // Fix the bits
    for (i = res = 0;  i < pei->bits;  i++) {
	    bitpos = pei->pos[i] - offset;
	    msg[bitpos >> 3] ^= (1 << (7 - (bitpos & 7)));
	    if (fixedbits) {
		    fixedbits[res++] = bitpos;
	    }
    }
    return res;
}
