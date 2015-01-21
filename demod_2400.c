// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// demod_2400.c: 2.4MHz Mode S demodulator.
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

#include "dump1090.h"

// 2.4MHz sampling rate version
//
// When sampling at 2.4MHz we have exactly 6 samples per 5 symbols.
// Each symbol is 500ns wide, each sample is 416.7ns wide
//
// We maintain a phase offset that is expressed in units of 1/5 of a sample i.e. 1/6 of a symbol, 83.333ns
// Each symbol we process advances the phase offset by 6 i.e. 6/5 of a sample, 500ns
//
// The correlation functions below correlate a 1-0 pair of symbols (i.e. manchester encoded 1 bit)
// starting at the given sample, and assuming that the symbol starts at a fixed 0-5 phase offset within
// m[0]. They return a correlation value, generally interpreted as >0 = 1 bit, <0 = 0 bit

// TODO check if there are better (or more balanced) correlation functions to use here

// nb: the correlation functions sum to zero, so we do not need to adjust for the DC offset in the input signal
// (adding any constant value to all of m[0..3] does not change the result)

static inline int slice_phase0(uint16_t *m) {
    return 5 * m[0] - 3 * m[1] - 2 * m[2];
}
static inline int slice_phase1(uint16_t *m) {
    return 4 * m[0] - m[1] - 3 * m[2];
}
static inline int slice_phase2(uint16_t *m) {
    return 3 * m[0] + m[1] - 4 * m[2];
}
static inline int slice_phase3(uint16_t *m) {
    return 2 * m[0] + 3 * m[1] - 5 * m[2];
}
static inline int slice_phase4(uint16_t *m) {
    return m[0] + 5 * m[1] - 5 * m[2] - m[3];
}

static inline int correlate_phase0(uint16_t *m) {
    return slice_phase0(m) * 26;
}
static inline int correlate_phase1(uint16_t *m) {
    return slice_phase1(m) * 38;
}
static inline int correlate_phase2(uint16_t *m) {
    return slice_phase2(m) * 38;
}
static inline int correlate_phase3(uint16_t *m) {
    return slice_phase3(m) * 26;
}
static inline int correlate_phase4(uint16_t *m) {
    return slice_phase4(m) * 19;
}

//
// These functions work out the correlation quality for the 10 symbols (5 bits) starting at m[0] + given phase offset.
// This is used to find the right phase offset to use for decoding.
//

static inline int correlate_check_0(uint16_t *m) {
    return
        abs(correlate_phase0(&m[0])) +
        abs(correlate_phase2(&m[2])) +
        abs(correlate_phase4(&m[4])) +
        abs(correlate_phase1(&m[7])) +
        abs(correlate_phase3(&m[9]));
}

static inline int correlate_check_1(uint16_t *m) {
    return
        abs(correlate_phase1(&m[0])) +
        abs(correlate_phase3(&m[2])) +
        abs(correlate_phase0(&m[5])) +
        abs(correlate_phase2(&m[7])) +
        abs(correlate_phase4(&m[9]));
}

static inline int correlate_check_2(uint16_t *m) {
    return
        abs(correlate_phase2(&m[0])) +
        abs(correlate_phase4(&m[2])) +
        abs(correlate_phase1(&m[5])) +
        abs(correlate_phase3(&m[7])) +
        abs(correlate_phase0(&m[10]));
}

static inline int correlate_check_3(uint16_t *m) {
    return
        abs(correlate_phase3(&m[0])) +
        abs(correlate_phase0(&m[3])) +
        abs(correlate_phase2(&m[5])) +
        abs(correlate_phase4(&m[7])) +
        abs(correlate_phase1(&m[10]));
}

static inline int correlate_check_4(uint16_t *m) {
    return
        abs(correlate_phase4(&m[0])) +
        abs(correlate_phase1(&m[3])) +
        abs(correlate_phase3(&m[5])) +
        abs(correlate_phase0(&m[8])) +
        abs(correlate_phase2(&m[10]));
}

// Work out the best phase offset to use for the given message.
static int best_phase(uint16_t *m) {
    int test;
    int best = -1;
    int bestval = (m[0] + m[1] + m[2] + m[3] + m[4] + m[5]); // minimum correlation quality we will accept

    // empirical testing suggests that 4..8 is the best range to test for here
    // (testing a wider range runs the danger of picking the wrong phase for
    // a message that would otherwise be successfully decoded - the correlation
    // functions can match well with a one symbol / half bit offset)

    // this is consistent with the peak detection which should produce
    // the first data symbol with phase offset 4..8

    test = correlate_check_4(&m[0]);
    if (test > bestval) { bestval = test; best = 4; }
    test = correlate_check_0(&m[1]);
    if (test > bestval) { bestval = test; best = 5; }
    test = correlate_check_1(&m[1]);
    if (test > bestval) { bestval = test; best = 6; }
    test = correlate_check_2(&m[1]);
    if (test > bestval) { bestval = test; best = 7; }
    test = correlate_check_3(&m[1]);
    if (test > bestval) { bestval = test; best = 8; }
    return best;
}

//
// Given 'mlen' magnitude samples in 'm', sampled at 2.4MHz,
// try to demodulate some Mode S messages.
//
void demodulate2400(uint16_t *m, uint32_t mlen) {
    struct modesMessage mm;
    unsigned char msg1[MODES_LONG_MSG_BYTES], msg2[MODES_LONG_MSG_BYTES], *msg;
    uint32_t j;

    unsigned char *bestmsg;
    int bestscore, bestphase, bestsnr;

    memset(&mm, 0, sizeof(mm));
    msg = msg1;

    for (j = 0; j < mlen; j++) {
        uint16_t *preamble = &m[j];
        int high;
        uint32_t base_signal, base_noise;
        int initial_phase, first_phase, last_phase, try_phase;
        int msglen;

        // Look for a message starting at around sample 0 with phase offset 3..7

        // Ideal sample values for preambles with different phase
        // Xn is the first data symbol with phase offset N
        //
        // sample#: 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
        // phase 3: 2/4\0/5\1 0 0 0 0/5\1/3 3\0 0 0 0 0 0 X4
        // phase 4: 1/5\0/4\2 0 0 0 0/4\2 2/4\0 0 0 0 0 0 0 X0
        // phase 5: 0/5\1/3 3\0 0 0 0/3 3\1/5\0 0 0 0 0 0 0 X1
        // phase 6: 0/4\2 2/4\0 0 0 0 2/4\0/5\1 0 0 0 0 0 0 X2
        // phase 7: 0/3 3\1/5\0 0 0 0 1/5\0/4\2 0 0 0 0 0 0 X3
        //
        
        // quick check: we must have a rising edge 0->1 and a falling edge 12->13
        if (! (preamble[0] < preamble[1] && preamble[12] > preamble[13]) )
           continue;

        if (preamble[1] > preamble[2] &&                                       // 1
            preamble[2] < preamble[3] && preamble[3] > preamble[4] &&          // 3
            preamble[8] < preamble[9] && preamble[9] > preamble[10] &&         // 9
            preamble[10] < preamble[11]) {                                     // 11-12
            // peaks at 1,3,9,11-12: phase 3
            high = (preamble[1] + preamble[3] + preamble[9] + preamble[11] + preamble[12]) / 4;
            base_signal = preamble[1] + preamble[3] + preamble[9];
            base_noise = preamble[5] + preamble[6] + preamble[7];
        } else if (preamble[1] > preamble[2] &&                                // 1
                   preamble[2] < preamble[3] && preamble[3] > preamble[4] &&   // 3
                   preamble[8] < preamble[9] && preamble[9] > preamble[10] &&  // 9
                   preamble[11] < preamble[12]) {                              // 12
            // peaks at 1,3,9,12: phase 4
            high = (preamble[1] + preamble[3] + preamble[9] + preamble[12]) / 4;
            base_signal = preamble[1] + preamble[3] + preamble[9] + preamble[12];
            base_noise = preamble[5] + preamble[6] + preamble[7] + preamble[8];
        } else if (preamble[1] > preamble[2] &&                                // 1
                   preamble[2] < preamble[3] && preamble[4] > preamble[5] &&   // 3-4
                   preamble[8] < preamble[9] && preamble[10] > preamble[11] && // 9-10
                   preamble[11] < preamble[12]) {                              // 12
            // peaks at 1,3-4,9-10,12: phase 5
            high = (preamble[1] + preamble[3] + preamble[4] + preamble[9] + preamble[10] + preamble[12]) / 4;
            base_signal = preamble[1] + preamble[12];
            base_noise = preamble[6] + preamble[7];
        } else if (preamble[1] > preamble[2] &&                                 // 1
                   preamble[3] < preamble[4] && preamble[4] > preamble[5] &&    // 4
                   preamble[9] < preamble[10] && preamble[10] > preamble[11] && // 10
                   preamble[11] < preamble[12]) {                               // 12
            // peaks at 1,4,10,12: phase 6
            high = (preamble[1] + preamble[4] + preamble[10] + preamble[12]) / 4;
            base_signal = preamble[1] + preamble[4] + preamble[10] + preamble[12];
            base_noise = preamble[5] + preamble[6] + preamble[7] + preamble[8];
        } else if (preamble[2] > preamble[3] &&                                 // 1-2
                   preamble[3] < preamble[4] && preamble[4] > preamble[5] &&    // 4
                   preamble[9] < preamble[10] && preamble[10] > preamble[11] && // 10
                   preamble[11] < preamble[12]) {                               // 12
            // peaks at 1-2,4,10,12: phase 7
            high = (preamble[1] + preamble[2] + preamble[4] + preamble[10] + preamble[12]) / 4;
            base_signal = preamble[4] + preamble[10] + preamble[12];
            base_noise = preamble[6] + preamble[7] + preamble[8];
        } else {
            // no suitable peaks
            continue;
        }

        // Check for enough signal
        if (base_signal * 2 < 3 * base_noise) // about 3.5dB SNR
            continue;

        // Check that the "quiet" bits 6,7,15,16,17 are actually quiet
        if (preamble[5] >= high ||
            preamble[6] >= high ||
            preamble[7] >= high ||
            preamble[8] >= high ||
            preamble[14] >= high ||
            preamble[15] >= high ||
            preamble[16] >= high ||
            preamble[17] >= high ||
            preamble[18] >= high) {
            ++Modes.stats_current.preamble_not_quiet;
            continue;
        }

        if (Modes.phase_enhance) {
            first_phase = 4;
            last_phase = 8;           // try all phases
        } else {
            // Crosscorrelate against the first few bits to find a likely phase offset
            initial_phase = best_phase(&preamble[19]);
            if (initial_phase < 0) {
                ++Modes.stats_current.preamble_no_correlation;
                continue; // nothing satisfactory
            }
            
            Modes.stats_current.preamble_phase[initial_phase%MODES_MAX_PHASE_STATS]++;            
            first_phase = last_phase = initial_phase;  // try only the phase we think it is
        }

        Modes.stats_current.valid_preamble++;
        bestmsg = NULL; bestscore = -1; bestphase = -1; bestsnr = -1;
        for (try_phase = first_phase; try_phase <= last_phase; ++try_phase) {
            int sigLevel = base_signal, noiseLevel = base_noise;
            uint8_t theByte;
            uint16_t *pPtr;
            unsigned char *pMsg;
            int phase, errors, i, snr, score;

            // Decode all the next 112 bits, regardless of the actual message
            // size. We'll check the actual message type later
            
            pMsg = &msg[0];
            pPtr = &m[j+19] + (try_phase/5);
            phase = try_phase % 5;
            theByte = 0;
            errors  = 0;

            for (i = 0; i < MODES_LONG_MSG_BITS && errors < MODES_MSG_ENCODER_ERRS; i++) {
                int test;
                
                switch (phase) {
                case 0:
                    test = slice_phase0(pPtr);
                    phase = 2;
                    pPtr += 2;
                    break;
                    
                case 1:
                    test = slice_phase1(pPtr);
                    phase = 3;
                    pPtr += 2;
                    break;
                    
                case 2:
                    test = slice_phase2(pPtr);
                    phase = 4;
                    pPtr += 2;
                    break;
                    
                case 3:
                    test = slice_phase3(pPtr);
                    phase = 0;
                    pPtr += 3;
                    break;
                    
                case 4:
                    test = slice_phase4(pPtr);
                    
                    // A phase-4 bit exactly straddles a sample boundary.
                    // Here's what a 1-0 bit with phase 4 looks like:
                    //
                    //     |SYM 1|
                    //  xxx|     |     |xxx
                    //           |SYM 2|
                    //
                    // 012340123401234012340  <-- sample phase
                    // | 0  | 1  | 2  | 3  |  <-- sample boundaries
                    //
                    // Samples 1 and 2 only have power from symbols 1 and 2.
                    // So we can use this to extract signal/noise values
                    // as one of the two symbols is high (signal) and the
                    // other is low (noise)
                    //
                    // This also gives us an equal number of signal and noise
                    // samples, which is convenient. Using the first half of
                    // a phase 0 bit, or the second half of a phase 3 bit, would
                    // also work, but we have no guarantees about how many signal
                    // or noise bits we'd see in those phases.
                    
                    if (test < 0) {   // 0 1
                        noiseLevel += pPtr[1];
                        sigLevel += pPtr[2];
                    } else {          // 1 0
                        sigLevel += pPtr[1];
                        noiseLevel += pPtr[2];
                    }
                    phase = 1;
                    pPtr += 3;
                    break;
                    
                default:
                    test = 0;
                    break;
                }

                if (test > 0)
                    theByte |= 1;
                /* else if (test < 0) theByte |= 0; */
                else if (test == 0) {
                    ++errors;
                }
                
                if ((i & 7) == 7)
                    *pMsg++ = theByte;
                
                theByte = theByte << 1;
            }

            // Score the mode S message and see if it's any good.
            score = scoreModesMessage(msg, i);
            if (score < 0)
                continue; // can't decode


            // apply the SNR to the score, so less noisy decodes are better,
            // all things being equal
            
            // snr = 5 * 20log10(sigLevel / noiseLevel)         (in units of 0.2dB)
            //     = 100log10(sigLevel) - 100log10(noiseLevel)                    
            while (sigLevel > 65535 || noiseLevel > 65535) {
                sigLevel >>= 1;
                noiseLevel >>= 1;
            }
            
            snr = Modes.log10lut[sigLevel] - Modes.log10lut[noiseLevel];
            score += snr;
            
            if (score > bestscore) {
                // new high score!
                bestmsg = msg;
                bestscore = score;
                bestphase = try_phase;
                bestsnr = snr;
                
                // swap to using the other buffer so we don't clobber our demodulated data
                // (if we find a better result then we'll swap back, but that's OK because
                // we no longer need this copy if we found a better one)
                msg = (msg == msg1) ? msg2 : msg1;
            }
        }

        // Do we have a candidate?
        if (!bestmsg) {
            Modes.stats_current.demod.badcrc++;
            continue; // nope.
        }

        msglen = modesMessageLenByType(bestmsg[0] >> 3);

        // Set initial mm structure details
        mm.timestampMsg = Modes.timestampBlk + (j*5) + bestphase;
        mm.signalLevel = (bestsnr > 255 ? 255 : (uint8_t)bestsnr);
        mm.score = bestscore;
        mm.bFlags = mm.correctedbits   = 0;

        // Decode the received message
        if (decodeModesMessage(&mm, bestmsg) < 0)
            continue;

        // Update statistics
        if (Modes.stats) {
            if (mm.correctedbits == 0) {
                Modes.stats_current.demod.goodcrc++;
                Modes.stats_current.demod.goodcrc_byphase[bestphase%MODES_MAX_PHASE_STATS]++;
            } else {
                Modes.stats_current.demod.badcrc++;
                Modes.stats_current.demod.fixed++;
                if (mm.correctedbits)
                    Modes.stats_current.demod.bit_fix[mm.correctedbits-1]++;
            }
        }

        // Skip over the message:
        // (we actually skip to 8 bits before the end of the message,
        //  because we can often decode two messages that *almost* collide,
        //  where the preamble of the second message clobbered the last
        //  few bits of the first message, but the message bits didn't
        //  overlap)
        j += (8 + msglen - 8)*12/5 - 1;
            
        // Pass data to the next layer
        useModesMessage(&mm);
    }
}

