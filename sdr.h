#ifndef SDR_H
#define SDR_H

// Common interface to different SDR inputs.

void sdrInitConfig();
void sdrShowHelp();
bool sdrHandleOption(int argc, char **argv, int *jptr);
bool sdrOpen();
void sdrRun();
void sdrClose();

#endif
