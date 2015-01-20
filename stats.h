// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// stats.c: statistics structures and prototypes.
//
// Copyright (c) 2015 Oliver Jowett <oliver@mutability.co.uk>
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

#ifndef DUMP1090_STATS_H
#define DUMP1090_STATS_H

// Common stats for non-phase-corrected vs phase-corrected cases
struct demod_stats {
    unsigned int demodulated0;
    unsigned int demodulated1;
    unsigned int demodulated2;
    unsigned int demodulated3;
    unsigned int goodcrc;
    unsigned int goodcrc_byphase[MODES_MAX_PHASE_STATS];
    unsigned int badcrc;
    unsigned int fixed;

    // Histogram of fixed bit errors: index 0 for single bit erros,
    // index 1 for double bit errors etc.
    unsigned int bit_fix[MODES_MAX_BITERRORS];
};

struct stats {
    time_t start;
    time_t end;

    // Statistics
    unsigned int preamble_no_correlation;
    unsigned int preamble_not_quiet;
    unsigned int valid_preamble;
    unsigned int preamble_phase[MODES_MAX_PHASE_STATS];

    struct demod_stats demod;
    struct demod_stats demod_phasecorrected;

    unsigned int http_requests;
    unsigned int out_of_phase;

    unsigned int DF_Len_Corrected;
    unsigned int DF_Type_Corrected;
    unsigned int ModeAC;

    unsigned int blocks_processed;
    unsigned int blocks_dropped;

    struct timespec cputime;

    // remote messages:
    unsigned int remote_accepted;
    unsigned int remote_rejected;

    // total messages:
    unsigned int messages_total;
};    

void add_stats(const struct stats *st1, const struct stats *st2, struct stats *target);
void display_stats(struct stats *st);
void reset_stats(struct stats *st);

#endif
