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

//
// Given 'mlen' magnitude samples in 'm', sampled at 2.4MHz,
// try to demodulate some Mode S messages.
//
void demodulate2400(struct mag_buf *mag)
{
    static struct modesMessage zeroMessage;
    struct modesMessage mm;
    unsigned char msg1[MODES_LONG_MSG_BYTES], msg2[MODES_LONG_MSG_BYTES], *msg;
    uint32_t j;

    unsigned char *bestmsg;
    int bestscore, bestphase;

    uint16_t *m = mag->data;
    uint32_t mlen = mag->length;

    uint64_t sum_scaled_signal_power = 0;

    msg = msg1;

    for (j = 0; j < mlen; j++) {
        uint16_t *preamble = &m[j];
        int high;
        uint32_t base_signal, base_noise;
        int try_phase;
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
            continue;
        }

        // try all phases
        Modes.stats_current.demod_preambles++;
        bestmsg = NULL; bestscore = -2; bestphase = -1;
        for (try_phase = 4; try_phase <= 8; ++try_phase) {
            uint16_t *pPtr;
            int phase, i, score, bytelen;

            // Decode all the next 112 bits, regardless of the actual message
            // size. We'll check the actual message type later
            
            pPtr = &m[j+19] + (try_phase/5);
            phase = try_phase % 5;

            bytelen = MODES_LONG_MSG_BYTES;
            for (i = 0; i < bytelen; ++i) {
                uint8_t theByte = 0;

                switch (phase) {
                case 0:
                    theByte = 
                        (slice_phase0(pPtr) > 0 ? 0x80 : 0) |
                        (slice_phase2(pPtr+2) > 0 ? 0x40 : 0) |
                        (slice_phase4(pPtr+4) > 0 ? 0x20 : 0) |
                        (slice_phase1(pPtr+7) > 0 ? 0x10 : 0) |
                        (slice_phase3(pPtr+9) > 0 ? 0x08 : 0) |
                        (slice_phase0(pPtr+12) > 0 ? 0x04 : 0) |
                        (slice_phase2(pPtr+14) > 0 ? 0x02 : 0) |
                        (slice_phase4(pPtr+16) > 0 ? 0x01 : 0);


                    phase = 1;
                    pPtr += 19;
                    break;
                    
                case 1:
                    theByte =
                        (slice_phase1(pPtr) > 0 ? 0x80 : 0) |
                        (slice_phase3(pPtr+2) > 0 ? 0x40 : 0) |
                        (slice_phase0(pPtr+5) > 0 ? 0x20 : 0) |
                        (slice_phase2(pPtr+7) > 0 ? 0x10 : 0) |
                        (slice_phase4(pPtr+9) > 0 ? 0x08 : 0) |
                        (slice_phase1(pPtr+12) > 0 ? 0x04 : 0) |
                        (slice_phase3(pPtr+14) > 0 ? 0x02 : 0) |
                        (slice_phase0(pPtr+17) > 0 ? 0x01 : 0);

                    phase = 2;
                    pPtr += 19;
                    break;
                    
                case 2:
                    theByte =
                        (slice_phase2(pPtr) > 0 ? 0x80 : 0) |
                        (slice_phase4(pPtr+2) > 0 ? 0x40 : 0) |
                        (slice_phase1(pPtr+5) > 0 ? 0x20 : 0) |
                        (slice_phase3(pPtr+7) > 0 ? 0x10 : 0) |
                        (slice_phase0(pPtr+10) > 0 ? 0x08 : 0) |
                        (slice_phase2(pPtr+12) > 0 ? 0x04 : 0) |
                        (slice_phase4(pPtr+14) > 0 ? 0x02 : 0) |
                        (slice_phase1(pPtr+17) > 0 ? 0x01 : 0);

                    phase = 3;
                    pPtr += 19;
                    break;
                    
                case 3:
                    theByte = 
                        (slice_phase3(pPtr) > 0 ? 0x80 : 0) |
                        (slice_phase0(pPtr+3) > 0 ? 0x40 : 0) |
                        (slice_phase2(pPtr+5) > 0 ? 0x20 : 0) |
                        (slice_phase4(pPtr+7) > 0 ? 0x10 : 0) |
                        (slice_phase1(pPtr+10) > 0 ? 0x08 : 0) |
                        (slice_phase3(pPtr+12) > 0 ? 0x04 : 0) |
                        (slice_phase0(pPtr+15) > 0 ? 0x02 : 0) |
                        (slice_phase2(pPtr+17) > 0 ? 0x01 : 0);

                    phase = 4;
                    pPtr += 19;
                    break;
                    
                case 4:
                    theByte = 
                        (slice_phase4(pPtr) > 0 ? 0x80 : 0) |
                        (slice_phase1(pPtr+3) > 0 ? 0x40 : 0) |
                        (slice_phase3(pPtr+5) > 0 ? 0x20 : 0) |
                        (slice_phase0(pPtr+8) > 0 ? 0x10 : 0) |
                        (slice_phase2(pPtr+10) > 0 ? 0x08 : 0) |
                        (slice_phase4(pPtr+12) > 0 ? 0x04 : 0) |
                        (slice_phase1(pPtr+15) > 0 ? 0x02 : 0) |
                        (slice_phase3(pPtr+17) > 0 ? 0x01 : 0);

                    phase = 0;
                    pPtr += 20;
                    break;
                }

                msg[i] = theByte;
                if (i == 0) {
                    switch (msg[0] >> 3) {
                    case 0: case 4: case 5: case 11:
                        bytelen = MODES_SHORT_MSG_BYTES; break;
                        
                    case 16: case 17: case 18: case 20: case 21: case 24:
                        break;

                    default:
                        bytelen = 1; // unknown DF, give up immediately
                        break;
                    }
                }
            }

            // Score the mode S message and see if it's any good.
            score = scoreModesMessage(msg, i*8);
            if (score > bestscore) {
                // new high score!
                bestmsg = msg;
                bestscore = score;
                bestphase = try_phase;
                
                // swap to using the other buffer so we don't clobber our demodulated data
                // (if we find a better result then we'll swap back, but that's OK because
                // we no longer need this copy if we found a better one)
                msg = (msg == msg1) ? msg2 : msg1;
            }
        }

        // Do we have a candidate?
        if (bestscore < 0) {
            if (bestscore == -1)
                Modes.stats_current.demod_rejected_unknown_icao++;
            else
                Modes.stats_current.demod_rejected_bad++;
            continue; // nope.
        }

        msglen = modesMessageLenByType(bestmsg[0] >> 3);

        // Set initial mm structure details
        mm = zeroMessage;
        mm.timestampMsg = mag->sampleTimestamp + (j*5) + bestphase;

        // compute message receive time as block-start-time + difference in the 12MHz clock
        mm.sysTimestampMsg = mag->sysTimestamp; // start of block time
        mm.sysTimestampMsg.tv_nsec += receiveclock_ns_elapsed(mag->sampleTimestamp, mm.timestampMsg);
        normalize_timespec(&mm.sysTimestampMsg);

        mm.score = bestscore;

        // Decode the received message
        {
            int result = decodeModesMessage(&mm, bestmsg);
            if (result < 0) {
                if (result == -1)
                    Modes.stats_current.demod_rejected_unknown_icao++;
                else
                    Modes.stats_current.demod_rejected_bad++;
                continue;
            } else {
                Modes.stats_current.demod_accepted[mm.correctedbits]++;
            }
        }

        // measure signal power
        {
            double signal_power;
            uint64_t scaled_signal_power = 0;
            int signal_len = msglen*12/5;
            int k;

            for (k = 0; k < signal_len; ++k) {
                uint32_t mag = m[j+19+k];
                scaled_signal_power += mag * mag;
            }

            signal_power = scaled_signal_power / 65535.0 / 65535.0;
            mm.signalLevel = signal_power / signal_len;
            Modes.stats_current.signal_power_sum += signal_power;
            Modes.stats_current.signal_power_count += signal_len;
            sum_scaled_signal_power += scaled_signal_power;

            if (mm.signalLevel > Modes.stats_current.peak_signal_power)
                Modes.stats_current.peak_signal_power = mm.signalLevel;
            if (mm.signalLevel > 0.50119)
                Modes.stats_current.strong_signal_count++; // signal power above -3dBFS
        }

        // Skip over the message:
        // (we actually skip to 8 bits before the end of the message,
        //  because we can often decode two messages that *almost* collide,
        //  where the preamble of the second message clobbered the last
        //  few bits of the first message, but the message bits didn't
        //  overlap)
        j += msglen*12/5;
            
        // Pass data to the next layer
        useModesMessage(&mm);
    }

    /* update noise power */
    {
        double sum_signal_power = sum_scaled_signal_power / 65535.0 / 65535.0;
        Modes.stats_current.noise_power_sum += (mag->total_power - sum_signal_power);
        Modes.stats_current.noise_power_count += mag->length;
    }
}



//////////
////////// MODE A/C
//////////

// Mode A/C bits are 1.45us wide, consisting of 0.45us on and 1.0us off
// We track this in terms of a (virtual) 60MHz clock, which is the lowest common multiple
// of the bit frequency and the 2.4MHz sampling frequency
//
//            0.45us = 27 cycles }
//            1.00us = 60 cycles } one bit period = 1.45us = 87 cycles
//
// one 2.4MHz sample = 25 cycles

void demodulate2400AC(struct mag_buf *mag)
{
    struct modesMessage mm;
    uint16_t *m = mag->data;
    uint32_t mlen = mag->length;
    unsigned f1_sample;

    memset(&mm, 0, sizeof(mm));

    for (f1_sample = 1; f1_sample < mlen; ++f1_sample) {
        // Mode A/C messages should match this bit sequence:

        // bit #     value
        //   -1       0    quiet zone
        //    0       1    framing pulse (F1)
        //    1      C1
        //    2      A1
        //    3      C2
        //    4      A2
        //    5      C4
        //    6      A4
        //    7       0    quiet zone (X1)
        //    8      B1
        //    9      D1
        //   10      B2
        //   11      D2
        //   12      B4
        //   13      D4
        //   14       1    framing pulse (F2)
        //   15       0    quiet zone (X2)
        //   16       0    quiet zone (X3)
        //   17     SPI
        //   18       0    quiet zone (X4)
        //   19       0    quiet zone (X5)
        //   20       0    quiet zone (X6)
        //   21       0    quiet zone (X7)
        //   22       0    quiet zone (X8)
        //   23       0    quiet zone (X9)

        // Look for a F1 and F2 pair,
        // with F1 starting at offset f1_sample.

        // the first framing pulse covers 3.5 samples:
        //
        // |----|        |----|
        // | F1 |________| C1 |_
        //
        // | 0 | 1 | 2 | 3 | 4 |
        //
        // and there is some unknown phase offset of the
        // leading edge e.g.:
        //
        //   |----|        |----|
        // __| F1 |________| C1 |_
        //
        // | 0 | 1 | 2 | 3 | 4 |
        //
        // in theory the "on" period can straddle 3 samples
        // but it's not a big deal as at most 4% of the power
        // is in the third sample.

        if (!(m[f1_sample-1] < m[f1_sample+0]))
            continue;      // not a rising edge

        if (m[f1_sample+2] > m[f1_sample+0] || m[f1_sample+2] > m[f1_sample+1])
            continue;      // quiet part of bit wasn't sufficiently quiet

        unsigned f1_noise = (m[f1_sample-1] + m[f1_sample+2]) / 2;
        unsigned f1_signal = (m[f1_sample+0] + m[f1_sample+1]) / 2;

        if (f1_noise * 4 > f1_signal) {
            // require 12dB SNR
            continue;
        }

        // estimate initial clock phase based on the amount of power
        // that ended up in the second sample
        unsigned f1_clock = 25 * f1_sample;
        if (m[f1_sample+1] > f1_noise) {
            f1_clock += 25 * (m[f1_sample+1] - f1_noise) / (2*(f1_signal - f1_noise));
        }

        // same again for F2
        // F2 is 20.3us / 14 bit periods after F1

        unsigned f2_clock = f1_clock + (87 * 14);
        unsigned f2_sample = f2_clock / 25;

        if (!(m[f2_sample-1] < m[f2_sample+0]))
            continue;

        if (m[f2_sample+2] > m[f2_sample+0] || m[f2_sample+2] > m[f2_sample+1])
            continue;      // quiet part of bit wasn't sufficiently quiet

        unsigned f2_noise = (m[f2_sample-1] + m[f2_sample+2]) / 2;
        unsigned f2_signal = (m[f2_sample+0] + m[f2_sample+1]) / 2;

        if (f2_noise * 4 > f2_signal) {
            // require 12dB SNR
            continue;
        }

        unsigned f1f2_signal = (f1_signal + f2_signal) / 2;

        // look at X1, X2, X3 which should be quiet
        // (sample 0 may have part of the previous bit, but
        // it always covers the quiet part of it)
        unsigned x1_clock = f1_clock + (87 * 7);
        unsigned x1_sample = x1_clock / 25;
        unsigned x1_noise = (m[x1_sample + 0] + m[x1_sample + 1] + m[x1_sample + 2]) / 3;
        if (x1_noise * 4 >= f1f2_signal)
            continue;

        unsigned x2_clock = f1_clock + (87 * 15);
        unsigned x2_sample = x2_clock / 25;
        unsigned x2_noise = (m[x2_sample + 0] + m[x2_sample + 1] + m[x2_sample + 2]) / 3;
        if (x2_noise * 4 >= f1f2_signal)
            continue;

        unsigned x3_clock = f1_clock + (87 * 16);
        unsigned x3_sample = x3_clock / 25;
        unsigned x3_noise = (m[x3_sample + 0] + m[x3_sample + 1] + m[x3_sample + 2]) / 3;
        if (x3_noise * 4 >= f1f2_signal)
            continue;

        unsigned x1x2x3_noise = (x1_noise + x2_noise + x3_noise) / 3;
        if (x1x2x3_noise * 4 >= f1f2_signal) // require 12dB separation
            continue;

        //  ----- F1/F2 average signal
        //   ^
        //   | at least 3dB
        //   v
        //  ----- minimum signal level we accept as "on"
        //   ^
        //   | 3dB
        //   v
        //  ---- midpoint between F1/F2 and X1/X2/X3
        //   ^
        //   | 3dB
        //   v
        //  ----- maximum signal level we accept as "off"
        //   ^
        //   | at least 3dB
        //   v
        //  ----- X1/X2/X3 average noise

        float midpoint = sqrtf(x1x2x3_noise * f1f2_signal); // so that signal/midpoint == midpoint/noise
        unsigned quiet_threshold = (unsigned) midpoint;
        unsigned noise_threshold = (unsigned) (midpoint * 0.707107 + 0.5); // -3dB from midpoint
        unsigned signal_threshold = (unsigned) (midpoint * 1.414214 + 0.5); // +3dB from midpoint

#if 0
        fprintf(stderr, "f1f2 %u x1x2x3 %u midpoint %.0f noise_threshold %u signal_threshold %u\n",
                f1f2_signal, x1x2x3_noise, midpoint, noise_threshold, signal_threshold);

        fprintf(stderr, "f1 %u f2 %u x1 %u x2 %u x3 %u\n",
                f1_signal, f2_signal, x1_noise, x2_noise, x3_noise);
#endif

        // recheck F/X bits just in case
        if (f1_signal < signal_threshold)
            continue;
        if (f2_signal < signal_threshold)
            continue;
        if (x1_noise > noise_threshold)
            continue;
        if (x2_noise > noise_threshold)
            continue;
        if (x3_noise > noise_threshold)
            continue;

        // Looks like a real signal. Demodulate all the bits.
        unsigned noisy_bits = 0;
        unsigned bits = 0;
        unsigned bit;
        unsigned clock;
        for (bit = 0, clock = f1_clock; bit < 24; ++bit, clock += 87) {
            unsigned sample = clock / 25;

            bits <<= 1;
            noisy_bits <<= 1;

            // check for excessive noise in the quiet period
            if (m[sample+2] >= quiet_threshold) {
                //fprintf(stderr, "bit %u was not quiet (%u > %u)\n", bit, m[sample+2], quiet_threshold);
                noisy_bits |= 1;
                continue;
            }

            // decide if this bit is on or off
            unsigned bit_signal = (m[sample+0] + m[sample+1]) / 2;
            if (bit_signal >= signal_threshold) {
                bits |= 1;
            } else if (bit_signal > noise_threshold) {
                /* not certain about this bit */
                //fprintf(stderr, "bit %u was uncertain (%u < %u < %u)\n", bit, noise_threshold, bit_signal, signal_threshold);
                noisy_bits |= 1;
            } else {
                /* this bit is off */
            }
        }

#if 0
        fprintf(stderr, "bits: %06X  noisy: %06X\n", bits, noisy_bits);

        unsigned j, sample;
        static const char *names[24] = {
            "F1", "C1", "A1", "C2",
            "A2", "C4", "A4", "X1",
            "B1", "D1", "B2", "D2",
            "B4", "D4", "F2", "X2",
            "X3", "SPI", "X4", "X5",
            "X6", "X7", "X8", "X9"
        };

        fprintf(stderr, "-1 ... %6u\n", m[f1_sample-1]);
        for (j = 0; j < 24; ++j) {
            clock = f1_clock + 87 * j;
            sample = clock / 25;
            fprintf(stderr, "%2u %-3s %6u %6u %6u %6u ", j, names[j], m[sample+0], m[sample+1], m[sample+2], m[sample+3]);
            if ((m[sample+0] + m[sample+1])/2 >= signal_threshold) {
                fprintf(stderr, "ON\n");
            } else if ((m[sample+0] + m[sample+1])/2 <= noise_threshold) {
                fprintf(stderr, "OFF\n");
            } else {
                fprintf(stderr, "UNCERTAIN\n");
            }
        }
#endif

        if (noisy_bits) {
            /* XX debug */
            continue;
        }

        // framing bits must be on
        if ((bits & 0x800200) != 0x800200) {
            continue;
        }

        // quiet bits must be off
        if ((bits & 0x0101BF) != 0) {
            continue;
        }

        // Convert to the form that we use elsewhere:
        //  00 A4 A2 A1  00 B4 B2 B1  SPI C4 C2 C1  00 D4 D2 D1
        unsigned modeac =
            ((bits & 0x400000) ? 0x0010 : 0) |  // C1
            ((bits & 0x200000) ? 0x1000 : 0) |  // A1
            ((bits & 0x100000) ? 0x0020 : 0) |  // C2
            ((bits & 0x080000) ? 0x2000 : 0) |  // A2
            ((bits & 0x040000) ? 0x0040 : 0) |  // C4
            ((bits & 0x020000) ? 0x4000 : 0) |  // A4
            ((bits & 0x008000) ? 0x0100 : 0) |  // B1
            ((bits & 0x004000) ? 0x0001 : 0) |  // D1
            ((bits & 0x002000) ? 0x0200 : 0) |  // B2
            ((bits & 0x001000) ? 0x0002 : 0) |  // D2
            ((bits & 0x000800) ? 0x0400 : 0) |  // B4
            ((bits & 0x000400) ? 0x0004 : 0) |  // D4
            ((bits & 0x000040) ? 0x0080 : 0);   // SPI

        // This message looks good, submit it

        // compute message receive time as block-start-time + difference in the 12MHz clock
        mm.timestampMsg = mag->sampleTimestamp + f1_clock / 5;  // 60MHz -> 12MHz
        mm.sysTimestampMsg = mag->sysTimestamp; // start of block time
        mm.sysTimestampMsg.tv_nsec += receiveclock_ns_elapsed(mag->sampleTimestamp, mm.timestampMsg);
        normalize_timespec(&mm.sysTimestampMsg);

        decodeModeAMessage(&mm, modeac);

        // Pass data to the next layer
        useModesMessage(&mm);

        f1_sample += (24*87 / 25);
        Modes.stats_current.demod_modeac++;
    }
}
