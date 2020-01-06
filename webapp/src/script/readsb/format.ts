// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// format.ts: String format helper functions.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This file is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

namespace READSB {
    export class Format {
        public static Nbsp = "\u00a0";
        public static Degrees = "\u00b0";

        // track in degrees (0..359)
        public static TrackBrief(track: number) {
            if (track === null) {
                return "";
            }

            return Math.round(track) + this.Degrees;
        }

        // track in degrees (0..359)
        public static TrackLong(track: number) {
            if (track === null) {
                return Strings.NotApplicable;
            }

            const trackDir = Math.floor((360 + (track % 360) + 22.5) / 45) % 8;
            return (
                Math.round(track) + this.Degrees + this.Nbsp + "(" + Strings.Compass[trackDir] + ")"
            );
        }

        // alt in feet
        public static AltitudeBrief(alt: number, vr: number, displayUnits: string) {
            let altText;
            if (isNaN(Number(alt))) {
                return Strings.Ground;
            }

            altText = Math.round(this.ConvertAltitude(alt, displayUnits)) + this.Nbsp;

            // Vertical Rate Triangle
            let verticalRateTriangle = "";
            if (vr > 128) {
                verticalRateTriangle += this.upTriangle;
            } else if (vr < -128) {
                verticalRateTriangle += this.downTriangle;
            } else {
                verticalRateTriangle += this.Nbsp;
            }
            return altText + verticalRateTriangle;
        }

        // alt in feet
        public static AltitudeLong(alt: number, vr: number, displayUnits: string) {
            let altText = "";
            if (isNaN(Number(alt))) {
                return Strings.Ground;
            }

            altText =
                Math.round(this.ConvertAltitude(alt, displayUnits)) +
                this.Nbsp +
                Strings.AltitudeUnit;

            if (vr > 128) {
                return this.upTriangle + this.Nbsp + altText;
            } else if (vr < -128) {
                return this.downTriangle + this.Nbsp + altText;
            } else {
                return altText;
            }
        }

        // alt in feet
        public static ConvertAltitude(alt: number, displayUnits: string) {
            if (displayUnits === "metric") {
                return alt / 3.2808; // feet to meters
            }

            return alt;
        }

        // speed in knots
        public static ConvertSpeed(speed: number, displayUnits: string) {
            if (displayUnits === "metric") {
                return speed * 1.852; // knots to kilometers per hour
            } else if (displayUnits === "imperial") {
                return speed * 1.151; // knots to miles per hour
            }

            return speed;
        }

        // speed in knots
        public static SpeedBrief(speed: number, displayUnits: string) {
            if (speed === null) {
                return "";
            }

            return Math.round(this.ConvertSpeed(speed, displayUnits)).toString();
        }

        // speed in knots
        public static SpeedLong(speed: number, displayUnits: string) {
            if (speed === null) {
                return Strings.NotApplicable;
            }

            const speedText: string =
                Math.round(this.ConvertSpeed(speed, displayUnits)) +
                this.Nbsp +
                Strings.SpeedUnit;

            return speedText;
        }

        // dist in meters
        public static ConvertDistance(dist: number, displayUnits: string) {
            if (displayUnits === "metric") {
                return dist / 1000; // meters to kilometers
            } else if (displayUnits === "imperial") {
                return dist / 1609; // meters to miles
            }
            return dist / 1852; // meters to nautical miles
        }

        // dist in meters
        public static DistanceBrief(dist: number, displayUnits: string) {
            if (dist === null) {
                return "";
            }

            return this.ConvertDistance(dist, displayUnits).toFixed(1);
        }

        // dist in meters
        public static DistanceLong(dist: number, displayUnits: string, fixed: number = 1) {
            if (dist === null) {
                return Strings.NotApplicable;
            }

            const distText: string =
                this.ConvertDistance(dist, displayUnits).toFixed(fixed) +
                this.Nbsp +
                Strings.DistanceUnit;

            return distText;
        }

        // dist in meters
        // converts meters to feet or just returns meters
        public static ConvertDistanceShort(dist: number, displayUnits: string) {
            if (displayUnits === "imperial") {
                return dist / 0.3048; // meters to feet
            }
            return dist; // just meters
        }

        public static DistanceShort(dist: number, displayUnits: string) {
            if (dist === null) {
                return Strings.NotApplicable;
            }

            const distText: string =
                Math.round(this.ConvertDistanceShort(dist, displayUnits)) +
                this.Nbsp +
                Strings.DistanceShortUnit;

            return distText;
        }

        // rate in ft/min
        public static ConvertVerticalRate(rate: number, displayUnits: string) {
            if (displayUnits === "metric") {
                return rate / 196.85; // ft/min to m/s
            }

            return rate;
        }

        // rate in ft/min
        public static VerticalRateBrief(rate: number, displayUnits: string) {
            if (rate === null || rate === undefined) {
                return "";
            }

            return this.ConvertVerticalRate(rate, displayUnits).toFixed(
                displayUnits === "metric" ? 1 : 0,
            );
        }

        // rate in ft/min
        public static VerticalRateLong(rate: number, displayUnits: string) {
            if (rate === null || rate === undefined) {
                return Strings.NotApplicable;
            }

            const rateText: string =
                this.ConvertVerticalRate(rate, displayUnits).toFixed(
                    displayUnits === "metric" ? 1 : 0,
                ) +
                this.Nbsp +
                Strings.VerticalRateUnit;

            return rateText;
        }

        public static LatLong(p: L.LatLng) {
            return p.lat.toFixed(3) + this.Degrees + "," + this.Nbsp + p.lng.toFixed(3) + this.Degrees;
        }

        // TODO: Add i18n
        public static DataSource(source: string) {
            switch (source) {
                case "mlat":
                    return "MLAT";
                case "adsb_icao":
                case "adsb_other":
                    return "ADS-B";
                case "adsb_icao_nt":
                    return "ADS-B (non transponder)";
                case "adsr_icao":
                case "adsr_other":
                    return "ADS-R";
                case "tisb_icao":
                case "tisb_trackfile":
                case "tisb_other":
                    return "TIS-B";
                case "mode_s":
                    return "Mode S";
                case "mode_ac":
                    return "Mode A/C";
            }

            return "";
        }

        // TODO: Add i18n
        public static NacP(value: number) {
            switch (value) {
                case 0:
                    return "EPU ≥ 18.52 km";
                case 1:
                    return "EPU < 18.52 km";
                case 2:
                    return "EPU < 7.408 km";
                case 3:
                    return "EPU < 3.704 km";
                case 4:
                    return "EPU < 1852 m";
                case 5:
                    return "EPU < 926 m";
                case 6:
                    return "EPU < 555.6 m";
                case 7:
                    return "EPU < 185.2 m";
                case 8:
                    return "EPU < 92.6 m";
                case 9:
                    return "EPU < 30 m";
                case 10:
                    return "EPU < 10 m";
                case 11:
                    return "EPU < 3 m";
                default:
                    return Strings.NotApplicable;
            }
        }

        // TODO: Add i18n
        public static NacV(value: number) {
            switch (value) {
                case 0:
                    return "Unknown or  10 m/s";
                case 1:
                    return "< 10 m/s";
                case 2:
                    return "< 3 m/s";
                case 3:
                    return "< 1 m/s";
                case 4:
                    return "< 0.3 m/s";
                default:
                    return Strings.NotApplicable;
            }
        }

        private static upTriangle = "\u25b2"; // U+25B2 BLACK UP-POINTING TRIANGLE
        private static downTriangle = "\u25bc"; // U+25BC BLACK DOWN-POINTING TRIANGLE
    }
}
