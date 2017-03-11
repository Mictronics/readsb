# dump1090-fa Mictronics

This is a fork of [dump1090-fa](https://github.com/flightaware/dump1090)
customized for use within [FlightAware](http://flightaware.com)'s
[PiAware](http://flightaware.com/adsb/piaware) software.

## Modifications:

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

:exclamation: **This branch is using browsers indexed database for aircraft meta data storage. The database
is loaded from server on version change, when empty or doesn't exists.**

**Your browser may not support indexed database if it's diabled or you are browsing in private mode.
To enable support in Firefox: Open URL 'about:config' search 'dom.indexedDB.enabled' set to 'true'.**

Tested in Firefox v51.

To speed up JSON loading you may add "application/json" to compress.filetype in /etc/lighttpd/lighttpd.conf:
`compress.filetype = ( "application/javascript", "text/css", "text/html", "text/plain", "application/json" )`
Don't forget to restart lighttpd or force-reload the configuration.

## Screenshots

<table>
    <tr>
        <td>
            <img alt="mod 1" src="docs/screenshots/dump1090-fa_mod1.png">
        </td>
        <td>
            <img alt="mod 2" src="docs/screenshots/dump1090-fa_mod2.png">
        </td>
    </tr>
    <tr>
        <td>
            <img alt="mod 4" src="docs/screenshots/dump1090-fa_mod4.png">
        </td>
        <td>
            <img alt="mod 5" src="docs/screenshots/dump1090-fa_mod5.png">
        </td>
    </tr>
    <tr>
        <td>
            <img alt="mod 3" src="docs/screenshots/dump1090-fa_mod3.png">
        </td>
    </tr>
</table>

## Push server support

dump1090-fa tries to connect to a listening server, like a VRS push server.

For example feeding VRS at adsbexchange.com use the new parameters:
--net-push-address feed.adsbexchange.com --net-push-port 30005 --net-push-beast

## dump1090-fa Debian/Raspbian packages

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
