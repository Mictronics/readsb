# dump1090-fa Debian/Raspbian packages

This is a fork of [dump1090-mutability](https://github.com/mutability/dump1090)
customized for use within [FlightAware](http://flightaware.com)'s
[PiAware](http://flightaware.com/adsb/piaware) software.

It is designed to build as a Debian package.

## Building under jessie

### Dependencies - bladeRF

You will need a build of libbladeRF. You can build packages from source:

$ git clone https://github.com/Nuand/bladeRF.git
$ cd bladeRF
$ dpkg-buildpackage -b

Or Nuand has some build/install instructions including an Ubuntu PPA
at https://github.com/Nuand/bladeRF/wiki/Getting-Started:-Linux

Or FlightAware provides armhf packages as part of the piaware repository;
see https://flightaware.com/adsb/piaware/install

### Dependencies - rtlsdr

This is packaged with jessie. "sudo apt-get install librtlsdr-dev"

### Actually building it

Nothing special, just build it ("dpkg-buildpackage -b")

## Building under wheezy

First run "prepare-wheezy-tree.sh". This will create a package tre in
package-wheezy/. Build in there ("dpkg-buildpackage -b")

The wheezy build does not include bladeRF support.
