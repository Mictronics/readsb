# dump1090-fa Debian/Raspbian packages

This is a fork of [dump1090-fa](https://github.com/flightaware/dump1090)
customized for use within [FlightAware](http://flightaware.com)'s
[PiAware](http://flightaware.com/adsb/piaware) software.

Modifications:

* Aircraft database removed due to update from external source. See readme.
* Link columns removed in aircraft table.
* Additional column to indicate civil or military aircraft (requires special database).
* Additional row color alert in case of interesting aircraft (requires special database).
* Detailed aircraft model in selected block (requires special database).
* Additional special squawks used in Germany. (Rettungshubschrauber, Bundespolizei etc.)

It is designed to build as a Debian package.

## Building under jessie

Nothing special, just build it ("dpkg-buildpackage -b")

## Building under wheezy

First run "prepare-wheezy-tree.sh". This will create a package tre in
package-wheezy/. Build in there ("dpkg-buildpackage -b")

