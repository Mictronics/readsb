# JSON output formats

dump1090 generates several json files with informaton about the receiver itself, currently known aircraft,
and general statistics. These are used by the webmap, but could also be used by other things
e.g. [this collectd plugin](https://github.com/mutability/dump1090-tools/tree/master/collectd) feeds stats
about dump1090's operation to collectd for later graphing.

## Reading the json files

There are two ways to obtain the json files:

 * By HTTP from dump1090's internal webserver, which defaults to running on port 8080. The json is served from the data/ path, e.g. http://somehost:8080/data/aircraft.json
 * As a file in the directory specified by --write-json on dump1090's command line. These can be exposed via a
   separate webserver.

The HTTP versions are always up to date.
The file versions are written periodically; for aircraft, typically once a second, for stats, once a minute.
The file versions are updated to a temporary file, then atomically renamed to the right path, so you should never see partial copies.

Each file contains a single JSON object. The file formats are:

## receiver.json

This file has general metadata about dump1090. It does not change often and you probably just want to read it once at startup.
The keys are:

 * version: the version of dump1090 in use
 * refresh: how often aircraft.json is updated (for the file version), in milliseconds. the webmap uses this to control its refresh interval.
 * history: the current number of valid history files (see below)
 * lat: the latitude of the receiver in decimal degrees. Optional, may not be present.
 * lon: the longitude of the receiver in decimal degrees. Optional, may not be present.

## aircraft.json

This file contains dump1090's list of recently seen aircraft. The keys are:

 * now: the time this file was generated, in seconds since Jan 1 1970 00:00:00 GMT (the Unix epoch).
 * messages: the total number of Mode S messages processed since dump1090 started.
 * aircraft: an array of JSON objects, one per known aircraft. Each aircraft has the following keys. Keys will be omitted if data is not available.
   * hex: the 24-bit ICAO identifier of the aircraft, as 6 hex digits. The identifier may start with '~', this means that the address is a non-ICAO address (e.g. from TIS-B).
   * squawk: the 4-digit squawk (octal representation)
   * flight: the flight name / callsign
   * lat, lon: the aircraft position in decimal degrees
   * seen_pos: how long ago (in seconds before "now") the position was last updated
   * altitude: the aircraft altitude in feet, or "ground" if it is reporting it is on the ground
   * vert_rate: vertical rate in feet/minute
   * track: true track over ground in degrees (0-359)
   * speed: reported speed in kt. This is usually speed over ground, but might be IAS - you can't tell the difference here, sorry!
   * messages: total number of Mode S messages received from this aircraft
   * seen: how long ago (in seconds before "now") a message was last received from this aircraft
   * rssi: recent average RSSI (signal power), in dbFS; this will always be negative.
   
## history_0.json, history_1.json, ..., history_119.json

These files are historical copies of aircraft.json at (by default) 30 second intervals. They follow exactly the
same format as aircraft.json. To know how many are valid, see receiver.json ("history" value). They are written in
a cycle, with history_0 being overwritten after history_119 is generated, so history_0.json is not necessarily the
oldest history entry. To load history, you should:

 * read "history" from receiver.json.
 * load that many history_N.json files
 * sort the resulting files by their "now" values
 * process the files in order
 
## stats.json

This file contains statistics about dump1090's operations.

There are 5 top level keys: "latest", "last1min", "last5min", "last15min", "total". Each has the following subkeys:

 * local: statistics about messages received from a local SDR dongle. Not present in --net-only mode. Has subkeys:
   * blocks_processed: number of sample blocks processed
   * blocks_dropped: number of sample blocks dropped before processing. A nonzero value means CPU overload.
   * modeac: number of Mode A / C messages decoded
   * modes: number of Mode S preambles received. This is *not* the number of valid messages!
   * bad: number of Mode S preambles that didn't result in a valid message
   * unknown_icao: number of Mode S preambles which looked like they might be valid but we didn't recognize the ICAO address and it was one of the message types where we can't be sure it's valid in this case.
   * accepted: array. Index N has the number of valid Mode S messages accepted with N-bit errors corrected.
   * signal: mean signal power of successfully received messages, in dbFS; always negative.
   * peak_signal: peak signal power of a successfully received message, in dbFS; always negative.
   * strong_signals: number of messages received that had a signal power above -3dBFS.
   
( .. more to follow .. )
   
   
   
