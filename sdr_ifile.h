#ifndef SDR_IFILE_H
#define SDR_IFILE_H

// Pseudo-SDR that reads from a sample file

void ifileInitConfig();
void ifileShowHelp();
bool ifileHandleOption(int argc, char **argv, int *jptr);
bool ifileOpen();
void ifileRun();
void ifileClose();

#endif
