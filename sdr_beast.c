// Part of dump1090, a Mode S message decoder for RTLSDR devices.
//
// sdr_beast.c: Mode-S Beast support
//
// Copyright (c) 2017 Michael Wolf <michael@mictronics.de>
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

#include <termios.h>
#include "dump1090.h"
#include "sdr_beast.h"

static void setBeastOption(char what)
{
    char optionsmsg[3] = { 0x1a, '1', what };
    if (write(Modes.beast_fd, optionsmsg, 3) < 3) {
        fprintf(stderr, "Beast failed to set option: %s", strerror(errno));
    }
}

void beastInitConfig(void)
{
    Modes.beast_serial            = strdup("/dev/ttyUSB0");
}

void beastShowHelp(void)
{
    printf("      Mode-S Beast specific options (use with --device-type modesbeast)\n");
    printf("\n");
    printf("--beast-serial <path>    Path to Beast serial device (default /dev/ttyUSB0)\n");
    printf("\n");
}

bool beastHandleOption(int argc, char **argv, int *jptr)
{
    int j = *jptr;
    bool more = (j +1  < argc);

    if (!strcmp(argv[j], "--beast-serial") && more) {
        Modes.beast_serial = strdup(argv[++j]);
    } else {
        return false;
    }

    *jptr = j;
    return true;
}

bool beastOpen(void)
{
    struct termios tios;

    Modes.beast_fd = open(Modes.beast_serial, O_RDWR  | O_NOCTTY);
    if (Modes.beast_fd < 0) {
        fprintf(stderr, "Failed to open Beast serial device %s: %s\n",
                Modes.beast_serial, strerror(errno));
        fprintf(stderr, "In case of permission denied try: sudo chmod a+rw %s\n or permanent permission: sudo adduser dump1090 dialout\n", Modes.beast_serial);
        return false;
    }

    if (tcgetattr(Modes.beast_fd, &tios) < 0) {
        fprintf(stderr, "tcgetattr(%s): %s\n", Modes.beast_serial, strerror(errno));
        return false;
    }

    tios.c_iflag &= ~(IGNBRK | BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL | IXON | IXOFF);
    tios.c_oflag = 0;
    tios.c_cflag &= ~(CSIZE | CSTOPB | PARENB | CLOCAL);
    tios.c_cflag |= CS8 | CRTSCTS;
    tios.c_lflag &= ~(ECHO | ECHONL | ICANON | IEXTEN | ISIG);
    tios.c_cc[VMIN] = 11;
    tios.c_cc[VTIME] = 0;
   
    if (cfsetispeed(&tios, B3000000) < 0) {
        fprintf(stderr, "Beast cfsetispeed(%s, 3000000): %s\n",
                Modes.beast_serial, strerror(errno));
        return false;
    }

    if (cfsetospeed(&tios, B3000000) < 0) {
        fprintf(stderr, "Beast cfsetospeed(%s, 3000000): %s\n",
                Modes.beast_serial, strerror(errno));
        return false;
    }

    if (tcsetattr(Modes.beast_fd, TCSANOW, &tios) < 0) {
        fprintf(stderr, "Beast tcsetattr(%s): %s\n",
                Modes.beast_serial, strerror(errno));
        return false;
    }
    
    /* set options */
    setBeastOption('C'); /* use binary format */
    setBeastOption('d'); /* no DF11/17-only filter, deliver all messages */
    setBeastOption('E'); /* enable mlat timestamps */
    setBeastOption('f'); /* enable CRC checks */
    setBeastOption('g'); /* no DF0/4/5 filter, deliver all messages */
    setBeastOption('H'); /* RTS enabled */
    setBeastOption(Modes.nfix_crc ? 'i' : 'I'); /* FEC enabled/disabled */
    setBeastOption(Modes.mode_ac ? 'J' : 'j');  /* Mode A/C enabled/disabled */

    /* Kick on handshake and start reception */
    int RTSDTR_flag = TIOCM_RTS | TIOCM_DTR;
    ioctl(Modes.beast_fd, TIOCMBIS,&RTSDTR_flag); //Set RTS&DTR pin
    
    fprintf(stderr, "Running Mode-S Beast via USB.\n");
    return true;
}

void beastRun()
{

}

void beastClose()
{
    /* Beast device will be closed in the main cleanup_and_exit function when
     * clients are freed.
     */
}
