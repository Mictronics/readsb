# Readsb

[Portmanteau of *Read ADSB*]

Readsb is a Mode-S/ADSB/TIS decoder for RTLSDR, BladeRF, Modes-Beast and GNS5894 devices.
As a former fork of [dump1090-fa](https://github.com/flightaware/dump1090) it is using that code base
but development will continue as a standalone project with new name. Readsb can co-exist on the same
host system with dump1090-fa, it doesn't use or modify its resources. However both programs will not
share a receiver device at the same time and in parallel.

## No longer under development!

Future development on readsb continuous on the [Protocol Buffer version](https://github.com/Mictronics/readsb-protobuf)
starting with version v4.0.0.

You may also check the [wiedehopf readsb fork](https://github.com/wiedehopf/readsb) for an alternative version
of readsb.

###### Disclaimer
This is a personal, hobbyist project with no commercial background.

### Push server support

readsb tries to connect to a listening server, like a VRS push server.

For example feeding VRS at adsbexchange.com use the new parameters:
```
--net-connector feed.adsbexchange.com,30005,beast_out
```

### BeastReduce output

Selectively forwards beast messages if the received data hasn't been forwarded in the last 125 ms (or `--net-beast-reduce-interval`).
Data not related to the physical aircraft state are only forwarded every 500 ms (4 * `--net-beast-reduce-interval`).The messages of
this output are normal beast messages and compatible with every program able to receive beast messages.

## readsb Debian/Raspbian packages

It is designed to build as a Debian package.

## Building under jessie, stretch or buster

### Dependencies - PlutoSDR (ADALM-PLUTO)

You will need the latest build and install of libad9361-dev and libiio-dev. The Debian packages
libad9361-dev that is available up to Debian 9 (stretch) is outdated and missing a required function.
So you have to build packages from source in this order:
```
$ git clone https://github.com/analogdevicesinc/libiio.git
$ cd libiio
$ cmake ./
$ make
$ sudo make install
```

```
$ git clone https://github.com/analogdevicesinc/libad9361-iio.git
$ cd libad9361-iio
$ cmake ./
$ make
$ sudo make install
```
### Dependencies - bladeRF

You will need a build of libbladeRF. You can build packages from source:
```
$ git clone https://github.com/Nuand/bladeRF.git
$ cd bladeRF
$ dpkg-buildpackage -b
```
Or Nuand has some build/install instructions including an Ubuntu PPA
at https://github.com/Nuand/bladeRF/wiki/Getting-Started:-Linux

### Dependencies - rtlsdr

This is packaged with jessie. "sudo apt-get install librtlsdr-dev"

### Actually building it

Build package with no additional receiver library dependencies: `dpkg-buildpackage -b`.

Build with RTLSDR support: `dpkg-buildpackage -b --build-profiles=rtlsdr`

Build with BladeRF(uBladeRF) support: `dpkg-buildpackage -b --build-profiles=bladerf`

Build with PlutoSDR support: `dpkg-buildpackage -b --build-profiles=plutosdr`

Build full package with all libraries: `dpkg-buildpackage -b --build-profiles=rtlsdr,bladerf,plutosdr`

## Building manually

You can probably just run "make". By default "make" builds with no specific library support. See below.
Binaries are built in the source directory; you will need to arrange to
install them (and a method for starting them) yourself.

"make BLADERF=yes" will enable bladeRF support and add the dependency on
libbladeRF.

"make RTLSDR=yes" will enable rtl-sdr support and add the dependency on
librtlsdr.

"make PLUTOSDR=yes" will enable plutosdr support and add the dependency on
libad9361 and libiio.

## Configuration

After installation, either by manual building or from package, you need to configure readsb service and web application.

Edit `/etc/default/readsb` to set the service options, device type, network ports etc.

The web application is configured by editing `/usr/share/readsb/html/script/readsb/defaults.js` or `src/script/readsb/default.ts`
prior to compilation. Several settings can be modified through web browser. These settings are stored inside browser indexedDB
and are individual to users or browser profiles.

## Note about bias tee support

Bias tee support is available for RTL-SDR.com V3 dongles. If you wish to enable bias tee support,
you must ensure that you are building this package with a version of librtlsdr installed that supports this capability.
You can find suitable source packages [here](https://github.com/librtlsdr/librtlsdr). To enable the necessary
support code when building, be sure to include preprocessor define macro HAVE_BIASTEE, e.g.:

"make HAVE_BIASTEE=yes" will enable biastee support for RTLSDR interfaces.

## Credits

- Matthias Wirth aka wiedehopf
- Taner Halicioglu aka tanerH