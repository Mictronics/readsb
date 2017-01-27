#ifndef SDR_RTLSDR_H
#define SDR_RTLSDR_H

// Support for DVB-T dongles in SDR mode via librtlsdr

void rtlsdrInitConfig();
void rtlsdrShowHelp();
bool rtlsdrOpen();
void rtlsdrRun();
void rtlsdrClose();
bool rtlsdrHandleOption(int argc, char **argv, int *jptr);

#endif
