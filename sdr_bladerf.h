#ifndef BLADERF_H
#define BLADERF_H

// Support for the Nuand bladeRF SDR

void bladeRFInitConfig();
void bladeRFShowHelp();
bool bladeRFHandleOption(int argc, char **argv, int *jptr);
bool bladeRFOpen();
void bladeRFRun();
void bladeRFClose();

#endif
