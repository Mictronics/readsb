PROGNAME=dump1090
DUMP1090_VERSION='3.3.0 Mictronics'

CC=gcc
CPPFLAGS += -DMODES_DUMP1090_VERSION=\"$(DUMP1090_VERSION)\" -DMODES_DUMP1090_VARIANT=\"dump1090-fa\"

ifneq ($(RTLSDR_PREFIX),"")
	CPPFLAGS += -I$(RTLSDR_PREFIX)/include
	LDFLAGS += -L$(RTLSDR_PREFIX)/lib
endif

ifneq ($(HTMLPATH),"")
	CPPFLAGS += -DHTMLPATH=\"$(HTMLPATH)\"
endif

DIALECT = -std=c11
CFLAGS += $(DIALECT) -O2 -g -W -D_DEFAULT_SOURCE -Wall -Werror
LIBS = -lpthread -lm -lrt

ifeq ($(STATIC), yes)
LIBS_RTLSDR = -Wl,-Bstatic -lrtlsdr -Wl,-Bdynamic -lusb-1.0
else
LIBS_RTLSDR = -lrtlsdr -lusb-1.0
endif

all: dump1090 view1090
	
%.o: %.c *.h
	$(CC) $(CPPFLAGS) $(CFLAGS) -c $< -o $@

dump1090: dump1090.o anet.o interactive.o mode_ac.o mode_s.o net_io.o crc.o demod_2400.o stats.o cpr.o icao_filter.o track.o util.o convert.o $(COMPAT)
	$(CC) -g -o $@ $^ $(LDFLAGS) $(LIBS) $(LIBS_RTLSDR) -lncurses

view1090: view1090.o anet.o interactive.o mode_ac.o mode_s.o net_io.o crc.o stats.o cpr.o icao_filter.o track.o util.o $(COMPAT)
	$(CC) -g -o $@ $^ $(LDFLAGS) $(LIBS) -lncurses

faup1090: faup1090.o anet.o mode_ac.o mode_s.o net_io.o crc.o stats.o cpr.o icao_filter.o track.o util.o $(COMPAT)
	$(CC) -g -o $@ $^ $(LDFLAGS) $(LIBS)

clean:
	rm -f *.o compat/clock_gettime/*.o compat/clock_nanosleep/*.o dump1090 view1090 faup1090 cprtests crctests

test: cprtests
	./cprtests

cprtests: cpr.o cprtests.o
	$(CC) $(CPPFLAGS) $(CFLAGS) -g -o $@ $^ -lm

crctests: crc.c crc.h
	$(CC) $(CPPFLAGS) $(CFLAGS) -g -DCRCDEBUG -o $@ $<
