# dump1090-fa Mictronics

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
* Additional aircraft operator database. Aircraft operator will be shown in selected block
  and as flight ident tooltip in table.
* Added basic support for feeding a single push server like VRS

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

Nothing special, just build it ("dpkg-buildpackage -b")

## Building under wheezy

First run "prepare-wheezy-tree.sh". This will create a package tre in
package-wheezy/. Build in there ("dpkg-buildpackage -b")

