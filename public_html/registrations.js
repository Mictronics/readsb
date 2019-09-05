// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// registrations.js: Various reverse-engineered versions of the
// allocation algorithms used by different countries to allocate
// 24-bit ICAO addresses based on the aircraft registration.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// Declare ICAO registration address ranges and Country

const LimitedAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 chars; no I, O
const FullAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 26 chars

// handles 3-letter suffixes assigned with a regular pattern
//
// start: first hexid of range
// s1: major stride (interval between different first letters)
// s2: minor stride (interval between different second letters)
// prefix: the registration prefix
//
// optionally:
//   alphabet: the alphabet to use (defaults full_alphabet)
//   first: the suffix to use at the start of the range (default: AAA)
//   last: the last valid suffix in the range (default: ZZZ)

const StrideMappings = [
  {
    start: 0x008011,
    s1: 26 * 26,
    s2: 26,
    prefix: 'ZS-',
  },

  {
    start: 0x390000,
    s1: 1024,
    s2: 32,
    prefix: 'F-G',
  },
  {
    start: 0x398000,
    s1: 1024,
    s2: 32,
    prefix: 'F-H',
  },

  {
    start: 0x3c4421,
    s1: 1024,
    s2: 32,
    prefix: 'D-A',
    first: 'AAA',
    last: 'OZZ',
  },
  {
    start: 0x3c0001,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-A',
    first: 'PAA',
    last: 'ZZZ',
  },
  {
    start: 0x3c8421,
    s1: 1024,
    s2: 32,
    prefix: 'D-B',
    first: 'AAA',
    last: 'OZZ',
  },
  {
    start: 0x3c2001,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-B',
    first: 'PAA',
    last: 'ZZZ',
  },
  {
    start: 0x3cc000,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-C',
  },
  {
    start: 0x3d04a8,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-E',
  },
  {
    start: 0x3d4950,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-F',
  },
  {
    start: 0x3d8df8,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-G',
  },
  {
    start: 0x3dd2a0,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-H',
  },
  {
    start: 0x3e1748,
    s1: 26 * 26,
    s2: 26,
    prefix: 'D-I',
  },

  {
    start: 0x448421,
    s1: 1024,
    s2: 32,
    prefix: 'OO-',
  },
  {
    start: 0x458421,
    s1: 1024,
    s2: 32,
    prefix: 'OY-',
  },
  {
    start: 0x460000,
    s1: 26 * 26,
    s2: 26,
    prefix: 'OH-',
  },
  {
    start: 0x468421,
    s1: 1024,
    s2: 32,
    prefix: 'SX-',
  },
  {
    start: 0x490421,
    s1: 1024,
    s2: 32,
    prefix: 'CS-',
  },
  {
    start: 0x4a0421,
    s1: 1024,
    s2: 32,
    prefix: 'YR-',
  },
  {
    start: 0x4b8421,
    s1: 1024,
    s2: 32,
    prefix: 'TC-',
  },
  {
    start: 0x740421,
    s1: 1024,
    s2: 32,
    prefix: 'JY-',
  },
  {
    start: 0x760421,
    s1: 1024,
    s2: 32,
    prefix: 'AP-',
  },
  {
    start: 0x768421,
    s1: 1024,
    s2: 32,
    prefix: '9V-',
  },
  {
    start: 0x778421,
    s1: 1024,
    s2: 32,
    prefix: 'YK-',
  },
  {
    start: 0x7c0000,
    s1: 1296,
    s2: 36,
    prefix: 'VH-',
  },
  {
    start: 0xc00001,
    s1: 26 * 26,
    s2: 26,
    prefix: 'C-F',
  },
  {
    start: 0xc044a9,
    s1: 26 * 26,
    s2: 26,
    prefix: 'C-G',
  },
  {
    start: 0xe01041,
    s1: 4096,
    s2: 64,
    prefix: 'LV-',
  },
];

// numeric registrations
//  start: start hexid in range
//  first: first numeric registration
//  count: number of numeric registrations
//  template: registration template, trailing characters are replaced with the numeric registration
const NumericMappings = [
  {
    start: 0x140000,
    first: 0,
    count: 100000,
    template: 'RA-00000',
  },
  {
    start: 0x0b03e8,
    first: 1000,
    count: 1000,
    template: 'CU-T0000',
  },
];

// fill in some derived data
for (let i = 0; i < StrideMappings.length; i += 1) {
  const mapping = StrideMappings[i];
  let c1;
  let c2;
  let c3;

  if (!mapping.alphabet) {
    mapping.alphabet = FullAlphabet;
  }

  if (mapping.first) {
    c1 = mapping.alphabet.indexOf(mapping.first.charAt(0));
    c2 = mapping.alphabet.indexOf(mapping.first.charAt(1));
    c3 = mapping.alphabet.indexOf(mapping.first.charAt(2));
    mapping.offset = c1 * mapping.s1 + c2 * mapping.s2 + c3;
  } else {
    mapping.offset = 0;
  }

  if (mapping.last) {
    c1 = mapping.alphabet.indexOf(mapping.last.charAt(0));
    c2 = mapping.alphabet.indexOf(mapping.last.charAt(1));
    c3 = mapping.alphabet.indexOf(mapping.last.charAt(2));
    mapping.end = mapping.start - mapping.offset + c1 * mapping.s1 + c2 * mapping.s2 + c3;
  } else {
    mapping.end = mapping.start
      - mapping.offset
      + (mapping.alphabet.length - 1) * mapping.s1
      + (mapping.alphabet.length - 1) * mapping.s2
      + (mapping.alphabet.length - 1);
  }
}

for (let i = 0; i < NumericMappings.length; i += 1) {
  NumericMappings[i].end = NumericMappings[i].start + NumericMappings[i].count - 1;
}

function StrideReg(hexid) {
  // try the mappings in stride_mappings
  let i;
  for (i = 0; i < StrideMappings.length; i += 1) {
    const mapping = StrideMappings[i];
    if (hexid < mapping.start || hexid > mapping.end) continue;

    let offset = hexid - mapping.start + mapping.offset;

    const i1 = Math.floor(offset / mapping.s1);
    offset %= mapping.s1;
    const i2 = Math.floor(offset / mapping.s2);
    offset %= mapping.s2;
    const i3 = offset;

    if (
      i1 < 0
      || i1 >= mapping.alphabet.length
      || i2 < 0
      || i2 >= mapping.alphabet.length
      || i3 < 0
      || i3 >= mapping.alphabet.length
    ) continue;

    return (
      mapping.prefix
      + mapping.alphabet.charAt(i1)
      + mapping.alphabet.charAt(i2)
      + mapping.alphabet.charAt(i3)
    );
  }

  // nothing
  return null;
}

function NumericReg(hexid) {
  // try the mappings in numeric_mappings
  let i;
  for (i = 0; i < NumericMappings.length; i += 1) {
    const mapping = NumericMappings[i];
    if (hexid < mapping.start || hexid > mapping.end) continue;

    const reg = `${hexid - mapping.start + mapping.first}`;
    return (
      mapping.template.substring(0, mapping.template.length - reg.length) + reg
    );
  }
}

//
// US N-numbers
//

function NChar(rem) {
  if (rem === 0) return '';

  rem -= 1;
  return LimitedAlphabet.charAt(rem);
}

function NLetters(rem) {
  if (rem === 0) return '';

  rem -= 1;
  return LimitedAlphabet.charAt(Math.floor(rem / 25)) + NChar(rem % 25);
}

function NReg(hexid) {
  let offset = hexid - 0xa00001;
  if (offset < 0 || offset >= 915399) {
    return null;
  }

  const digit1 = Math.floor(offset / 101711) + 1;
  let reg = `N${digit1}`;
  offset %= 101711;
  if (offset <= 600) {
    // Na, NaA .. NaZ, NaAA .. NaZZ
    return reg + NLetters(offset);
  }

  // Na0* .. Na9*
  offset -= 601;

  const digit2 = Math.floor(offset / 10111);
  reg += digit2;
  offset %= 10111;

  if (offset <= 600) {
    // Nab, NabA..NabZ, NabAA..NabZZ
    return reg + NLetters(offset);
  }

  // Nab0* .. Nab9*
  offset -= 601;

  const digit3 = Math.floor(offset / 951);
  reg += digit3;
  offset %= 951;

  if (offset <= 600) {
    // Nabc, NabcA .. NabcZ, NabcAA .. NabcZZ
    return reg + NLetters(offset);
  }

  // Nabc0* .. Nabc9*
  offset -= 601;

  const digit4 = Math.floor(offset / 35);
  reg += digit4.toFixed(0);
  offset %= 35;

  if (offset <= 24) {
    // Nabcd, NabcdA .. NabcdZ
    return reg + NChar(offset);
  }

  // Nabcd0 .. Nabcd9
  offset -= 25;
  return reg + offset.toFixed(0);
}

// South Korea
function HLReg(hexid) {
  if (hexid >= 0x71ba00 && hexid <= 0x71bf99) {
    return `HL${(hexid - 0x71ba00 + 0x7200).toString(16)}`;
  }

  if (hexid >= 0x71c000 && hexid <= 0x71c099) {
    return `HL${(hexid - 0x71c000 + 0x8000).toString(16)}`;
  }

  if (hexid >= 0x71c200 && hexid <= 0x71c299) {
    return `HL${(hexid - 0x71c200 + 0x8200).toString(16)}`;
  }

  return null;
}

// Japan
function JAReg(hexid) {
  let offset = hexid - 0x840000;
  if (offset < 0 || offset >= 229840) return null;

  let reg = 'JA';

  const digit1 = Math.floor(offset / 22984);
  if (digit1 < 0 || digit1 > 9) return null;
  reg += digit1;
  offset %= 22984;

  const digit2 = Math.floor(offset / 916);
  if (digit2 < 0 || digit2 > 9) return null;
  reg += digit2;
  offset %= 916;

  if (offset < 340) {
    // 3rd is a digit, 4th is a digit or letter
    const digit3 = Math.floor(offset / 34);
    reg += digit3;
    offset %= 34;

    if (offset < 10) {
      // 4th is a digit
      return reg + offset;
    }

    // 4th is a letter
    offset -= 10;
    return reg + LimitedAlphabet.charAt(offset);
  }

  // 3rd and 4th are letters
  offset -= 340;
  const letter3 = Math.floor(offset / 24);
  return (
    reg + LimitedAlphabet.charAt(letter3) + LimitedAlphabet.charAt(offset % 24)
  );
}

export default function RegistrationFromHexId(hexid) {
  hexid = +`0x${hexid}`;
  if (isNaN(hexid)) {
    return null;
  }

  let reg = NReg(hexid);
  if (reg) return reg;

  reg = JAReg(hexid);
  if (reg) return reg;

  reg = HLReg(hexid);
  if (reg) return reg;

  reg = NumericReg(hexid);
  if (reg) return reg;

  reg = StrideReg(hexid);
  if (reg) return reg;

  return null;
}
