## Dump1090 MR README

### Overview

Dump1090 MR is a FlightAware fork of Malcolm Robb's fork of
Salvatore Sanfilippo's dump1090 program.  FlightAware uses it as an
important element of PiAware (https://flightaware.com/adsb/piaware/), 
a Debian package for forwarding ADS-B data to FlightAware.

Salvatore also invented an extremely popular in-memory database called redis,
among other things, and he's pretty busy and doesn't have a lot of time to 
jack with dump1090.

Malcolm split out dump1090's source code out into several different files 
and has done steady work maintaining and updgrading it.  People have been
sending him patches in the form of pull requests and he's been assiduously
bringing them into the mainline code.

Although dump1090 is presented primarily as an ADS-B (Mode S) decoder
specifically designed for these little RTLSDR USB dongles that contain
a software defined radio and FPGA and were originally intended for decoding 
certain satellite TV broadcasts, dump1090 can do many other useful things
such as 
* decode and interpret ADS-B messages from various formats
* Stream ADS-B messages in various formats using Internet-standard TCP sockets
* provide a web interface to show aircraft traffic on a map in real time
* and more

Since airborne aircraft transmit their positions twice each second, ADS-B
receivers located in high traffic areas can receive as many as thousands
of messages each second.  

Much of this information can be filtered out without a significant loss
of fidelity at the receiving end.  For example, an aircraft flying at
a high altitude with a consistent heading and speed, the aircraft's
location information can be forwarded less frequently.  

Also aircraft equipped with legacy transponders, as most still are, only
their altitude is being transmitted, not their latitude and longitude, etc,
and as these messages aren't as useful they don't need to be sent as often.

The FlightAware fork leverages dump1090 to create a new message format
that is filtered as described above plus with additional criteria
and then we group multiple messages together into a single TCP packet
to reduce overhead (as each IPv4 packet has a 64-byte header),
ultimately requiring a small fraction of the bandwidth used by the other
data formats dump1090 can send natively.  This is on port 10001 by default.

Within the dump1090 repo also is a program called faup1090.  When someone
is running their own dump1090 or native Malcolm Robb dump1090, faup1090
can connect to dump1090, interpret the packets it receives, and translate
them into the same filtered format our fork of dump1090 produces.

FlightAware's PiAware Debian package (https://flightaware.com/adsb/piaware/) leverages either faup1090 or dump1090
with additional software to connect to FlightAware with a compressed,
encrypted TLS connection, log in using your FlightAware account and
password, and forward your ADS-B data, where it is collected as part of
FlightAware's worldwide network of Airspace National Service Providers,
satellite tracking providers, networks of ADS-B providers, our FA-managed
ADS-B network.  

By contributing your ADS-B data to FlightAware you
* contribute to the accuracy of FlightAware's flight tracking, almost all of which is available for free worldwide through the FA website in 15 languages
* gain the ability to see a realtime picture of all ADS-B traffic FlightAware knows about
* make the Internet itself more useful
* help people communicate and share information

Every day hundreds of thousands of people save time and energy using 
FlightAware.  If someone leaves for the airport an hour later because the
flight they're meeting is an hour late, they got an hour of their life
back, and that's an hour not spent in their car with the engine running
or whatever.  It's a win for the person, a win for the environment, and
your contribution to that is palpable.

While doing this, FlightAware in no way restricts your ability to share your 
ADS-B data with other flight trackers.

Most people will have no need to grab dump1090/faup1090 from source code and 
build it.  If you already have dump1090 running with some sort of ADS-B
receiver, all you need to send stuff to FlightAware is to install our
Debian package and configure it with your user name and password.

But for the intrepid, here is the source code, in all its glory, freely
redistributable under the permissive Berkeley copyright, modifiable for
your use and others, including for profit, should you desire.

We will continue to track the Malcolm Robb fork of dump1090 for the
foreseeable future and maintain our modifications.  We solicit any bug
reports and bug fixes are, as always, for the same.

PiAware source code and instructions on build it can be found at
https://github.com/flightaware/piaware.

### Building

To build dump1090...
```sh
make
```

To build and install faup1090 only...

```sh
make
make -f makefaup1090 all
sudo make -f makefaup1090 install-faup1090
```

To build and install both faup1090 and dump1090...

```sh
make
make -f makefaup1090 all
sudo make -f makefaup1090 install-faup1090 install-dump1090
```

To build and install dump1090 and faup1090 and configure the system to start them automatically whenever the system boots

```
make
make -f makefaup1090 all
sudo make -f makefaup1090 full-install
```

### For more information
Please read the original README and the Malcolm Robb ones at https://github.com/antirez/dump1090 and https://github.com/malcolmrobb/dump1090, respectively.

