// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// stats.c: statistics helpers.
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

#include "dump1090.h"

static void display_demod_stats(const char *prefix, struct demod_stats *dstats) {
    int j;

    printf("%d %sdemodulated with 0 errors\n",                  dstats->demodulated0, prefix);
    printf("%d %sdemodulated with 1 error\n",                   dstats->demodulated1, prefix);
    printf("%d %sdemodulated with 2 errors\n",                  dstats->demodulated2, prefix);
    printf("%d %sdemodulated with > 2 errors\n",                dstats->demodulated3, prefix);
    printf("%d %swith good crc\n",                              dstats->goodcrc, prefix);
    for (j = 0; j < MODES_MAX_PHASE_STATS; ++j)
        if (dstats->goodcrc_byphase[j] > 0)
            printf("   %d %swith phase offset %d\n",            dstats->goodcrc_byphase[j], prefix, j);
    printf("%d %swith bad crc\n",                               dstats->badcrc, prefix);
    printf("%d %serrors corrected\n",                           dstats->fixed, prefix);

    for (j = 0;  j < Modes.nfix_crc;  j++) {
        printf("   %d %swith %d bit %s\n", dstats->bit_fix[j], prefix, j+1, (j==0)?"error":"errors");
    }
}

void display_stats(struct stats *st) {
    int j;
    struct tm tm_start, tm_end;
    char tb_start[30], tb_end[30];

    printf("\n\n");
    if (Modes.interactive)
        interactiveShowData();

    localtime_r(&st->start, &tm_start);
    strftime(tb_start, sizeof(tb_start), "%c", &tm_start);
    localtime_r(&st->end, &tm_end);
    strftime(tb_end, sizeof(tb_end), "%c", &tm_end);

    printf("Statistics: %s - %s\n", tb_start, tb_end);

    if (!Modes.net_only) {        
        printf("%d sample blocks processed\n",                    st->blocks_processed);
        printf("%d sample blocks dropped\n",                      st->blocks_dropped);

        if (st->blocks_processed > 0) {
            long cpu_millis = (long)st->cputime.tv_sec*1000L + st->cputime.tv_nsec/1000000L;
            long sample_millis = (long) ((uint64_t)st->blocks_processed * MODES_ASYNC_BUF_SAMPLES / (Modes.oversample ? 2400 : 2000));
            printf("%ld ms CPU time used to process %ld ms samples, %.1f%% load\n",
                   cpu_millis, sample_millis, 100.0 * cpu_millis / sample_millis);
        }

        printf("%d ModeA/C detected\n",                           st->ModeAC);
        printf("%d Mode-S preambles with poor correlation\n",     st->preamble_no_correlation);
        printf("%d Mode-S preambles with noise in the quiet period\n", st->preamble_not_quiet);
        printf("%d valid Mode-S preambles\n",                     st->valid_preamble);
        for (j = 0; j < MODES_MAX_PHASE_STATS; ++j)
            if (st->preamble_phase[j] > 0)
                printf("   %d with phase offset %d\n",                st->preamble_phase[j], j);
        printf("%d DF-?? fields corrected for length\n",          st->DF_Len_Corrected);
        printf("%d DF-?? fields corrected for type\n",            st->DF_Type_Corrected);
        
        display_demod_stats("", &st->demod);
        if (Modes.phase_enhance) {
            printf("%d phase enhancement attempts\n",                 st->out_of_phase);
            display_demod_stats("phase enhanced ", &st->demod_phasecorrected);
        }
    }

    printf("%d remote messages accepted\n"
           "%d remote messages rejected\n",
           st->remote_accepted,
           st->remote_rejected);

    printf("%d total usable messages\n",
           st->messages_total);

    printf("%d global CPR attempts with valid positions\n"
           "%d global CPR attempts with bad data\n"
           "%d global CPR attempts with insufficient data\n"
           "%d local CPR attempts with valid positions\n"
           "%d local CPR attempts with insufficient data\n"
           "%d CPR messages that look like transponder failures filtered\n",
           st->cpr_global_ok,
           st->cpr_global_bad,
           st->cpr_global_skipped,
           st->cpr_local_ok,
           st->cpr_local_skipped,
           st->cpr_filtered);

    fflush(stdout);
}

void reset_stats(struct stats *st) {
    static struct stats st_zero;
    *st = st_zero;
}

static void add_demod_stats(const struct demod_stats *st1, const struct demod_stats *st2, struct demod_stats *target)
{
    int i;

    target->demodulated0 = st1->demodulated0 + st2->demodulated0;
    target->demodulated1 = st1->demodulated1 + st2->demodulated1;
    target->demodulated2 = st1->demodulated2 + st2->demodulated2;
    target->demodulated3 = st1->demodulated3 + st2->demodulated3;
    target->goodcrc = st1->goodcrc + st2->goodcrc;

    for (i = 0; i < MODES_MAX_PHASE_STATS; ++i)
        target->goodcrc_byphase[i] = st1->goodcrc_byphase[i] + st2->goodcrc_byphase[i];

    target->badcrc = st1->badcrc + st2->badcrc;
    target->fixed = st1->fixed + st2->fixed;

    for (i = 0; i < MODES_MAX_BITERRORS; ++i)
        target->bit_fix[i] = st1->bit_fix[i] + st2->bit_fix[i];
}

void add_stats(const struct stats *st1, const struct stats *st2, struct stats *target) {
    int i;

    if (st1->start == 0)
        target->start = st2->start;
    else if (st2->start == 0)
        target->start = st1->start;
    else if (st1->start < st2->start)
        target->start = st1->start;
    else
        target->start = st2->start;

    target->end = st1->end > st2->end ? st1->end : st2->end;
    
    target->preamble_no_correlation = st1->preamble_no_correlation + st2->preamble_no_correlation;
    target->preamble_not_quiet = st1->preamble_not_quiet + st2->preamble_not_quiet;
    target->valid_preamble = st1->valid_preamble + st2->valid_preamble;
    for (i = 0; i < MODES_MAX_PHASE_STATS; ++i)
        target->preamble_phase[i] = st1->preamble_phase[i] + st2->preamble_phase[i];

    add_demod_stats(&st1->demod, &st2->demod, &target->demod);
    add_demod_stats(&st1->demod_phasecorrected, &st2->demod_phasecorrected, &target->demod_phasecorrected);

    target->http_requests = st1->http_requests + st2->http_requests;
    target->out_of_phase = st1->out_of_phase + st2->out_of_phase;

    target->DF_Len_Corrected = st1->DF_Len_Corrected + st2->DF_Len_Corrected;
    target->DF_Type_Corrected = st1->DF_Type_Corrected + st2->DF_Type_Corrected;
    target->ModeAC = st1->ModeAC + st2->ModeAC;

    target->blocks_processed = st1->blocks_processed + st2->blocks_processed;
    target->blocks_dropped = st1->blocks_dropped + st2->blocks_dropped;

    target->cputime.tv_sec = st1->cputime.tv_sec + st2->cputime.tv_sec;
    target->cputime.tv_nsec = st1->cputime.tv_nsec + st2->cputime.tv_nsec;
    target->cputime.tv_sec += target->cputime.tv_nsec / 1000000000L;
    target->cputime.tv_nsec %= 1000000000L;

    // remote messages:
    target->remote_accepted = st1->remote_accepted + st2->remote_accepted;
    target->remote_rejected = st1->remote_rejected + st2->remote_rejected;

    // total messages:
    target->messages_total = st1->messages_total + st2->messages_total;

    // CPR decoding:
    target->cpr_global_ok = st1->cpr_global_ok + st2->cpr_global_ok;
    target->cpr_global_bad = st1->cpr_global_bad + st2->cpr_global_bad;
    target->cpr_global_skipped = st1->cpr_global_skipped + st2->cpr_global_skipped;
    target->cpr_local_ok = st1->cpr_local_ok + st2->cpr_local_ok;
    target->cpr_local_skipped = st1->cpr_local_skipped + st2->cpr_local_skipped;
    target->cpr_filtered = st1->cpr_filtered + st2->cpr_filtered;
}

