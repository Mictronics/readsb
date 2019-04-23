# dump1090 Mictronics

This is a fork of [dump1090-fa](https://github.com/flightaware/dump1090).

## Modifications:

* Added bias tee option for supporting interfaces.
* Calculate and show wind speed and direction for selected aircraft.
* Show more mode-S parameters.
* Added support for Analog Devices PlutoSDR (ADALM-PLUTO)
* German DWD RADOLAN layer similar to NEXRAD.
* Update source for aircraft metadata can be configured. Default is local dump1090 webserver but online
  sources are possible, for example this Github repo. See config.js for details.
* Backup and restore of browsers indexed database to/from local ZIP file.
* Additional SkyVector layers. (requires API key)
* Aircraft metadata stored in browsers indexed database can be modified through web form.
* Added new map controls to maximise space for plane list and better handling on mobile devices.
* Use GNU Argp for program help.
* Added support for local connected Mode-S Beast via USB.
* Added application manifest, HD icon and favicon. That allows to install dump1090-fa on home screen of a mobile
  device and run as a standalone web application.
  Icon source https://pixabay.com/en/airplane-aircraft-plane-sky-flying-34786/ Released under Creative Commons CC0.
* Hover label over aircrafts on map. Mod by Al Kissack. See https://github.com/alkissack/Dump1090-OpenLayers3-html
* Additional map layers. Mod by Al Kissack.
* Allow highlighting of filtered aircrafts instead of removing them from list.
* Added advanced filter option using VRS style menu.
* Use already included jQuery-UI to make space saving sidebar for maximum aircraft list.
* Link columns removed in aircraft table.
* Additional column to indicate civil or military aircraft (requires special database).
* Additional row color alert in case of interesting aircraft (requires special database).
* Detailed aircraft model in selected block (requires special database).
* Additional special squawks used in Germany. (Rettungshubschrauber, Bundespolizei etc.)
* Additional aircraft operator database. Aircraft operator will be shown in selected block
  and as flight ident tooltip in table.
* Added basic support for feeding a single push server like VRS
* Fixed memory leaks on exit
* Optimized structure memory layout for minimum padding.

:exclamation: **This fork is using browsers indexed database for aircraft meta data storage. The database
is loaded from server on version change, when empty or doesn't exists.**

**Your browser may not support indexed database if it's disabled or you are browsing in private mode.
To enable support in Firefox: Open URL 'about:config' search 'dom.indexedDB.enabled' set to 'true'.**

*Note: In Android pre-loading the database takes a minute or two, so be patient. Don't stop the script.*

To speed up JSON loading you may add "application/json" to compress.filetype in /etc/lighttpd/lighttpd.conf:
`compress.filetype = ( "application/javascript", "text/css", "text/html", "text/plain", "application/json" )`
Don't forget to restart lighttpd or force-reload the configuration.

## Push server support

dump1090 tries to connect to a listening server, like a VRS push server.

For example feeding VRS at adsbexchange.com use the new parameters:
--net-push-address feed.adsbexchange.com --net-push-port 30005 --net-push-beast

## dump1090 Debian/Raspbian packages

It is designed to build as a Debian package.

## Building under jessie or stretch

### Dependencies - PlutoSDR (ADALM-PLUTO)

You will need the latest build and install of libad9361-dev and libiio-dev. The Debian packages
libad9361-dev that is available up to Debian 9 (stretch) is outdated and missing a required function.
So you have to build packages from source:
```
$ git clone https://github.com/analogdevicesinc/libad9361-iio.git
$ cd libad9361-iio
$ cmake ./
$ make
$ sudo make install
```

```
$ git clone https://github.com/analogdevicesinc/libiio.git
$ cd libiio
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

Nothing special, just build it ("dpkg-buildpackage -b")

## Building under wheezy

First run "prepare-wheezy-tree.sh". This will create a package tree in
package-wheezy/. Build in there ("dpkg-buildpackage -b")

The wheezy build does not include bladeRF support.

## Building manually

You can probably just run "make" after installing the required dependencies.
Binaries are built in the source directory; you will need to arrange to
install them (and a method for starting them) yourself.

"make BLADERF=no" will disable bladeRF support and remove the dependency on
libbladeRF.

"make RTLSDR=no" will disable rtl-sdr support and remove the dependency on
librtlsdr.

"make PLUTOSDR=no" will disable plutosdr support and remove the dependency on
libad9361 and libiio.

## Configuration

After installation, either by manual building or from package, you need to configure dump1090-fa service and web application.

Edit `/etc/default/dump1090-fa` to set the service options, device type, network ports etc.

The web application is configured by editing `/usr/share/dump1090-fa/html/config.js`. config.example.js can be renamed and holds all
options on a clean installation where config.js doesn't exists.

## Note about bias tee support

Bias tee support is available for RTL-SDR.com V3 dongles. If you wish to enable bias tee support,
you must ensure that you are building this package with a version of librtlsdr installed that supports this capability.
You can find suitable source packages [here](https://github.com/librtlsdr/librtlsdr). To enable the necessary
support code when building, be sure to include preprocessor define macro HAVE_BIASTEE, e.g.:

"make HAVE_BIASTEE=yes" will enable biastee support for RTLSDR interfaces.
