// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// crc.h: Mode S checksum prototypes.
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

#ifndef DUMP1090_CRC_H
#define DUMP1090_CRC_H

#include <stdint.h>

void modesInitErrorInfo();
uint32_t modesChecksum(unsigned char *msg, int bits);
int fixBitErrors(unsigned char *msg, int bits, int maxfix, char *fixedbits);

#endif
