"use strict";
var READSB;
(function (READSB) {
    class Format {
        static GetUnitLabel(quantity, systemOfMeasurement) {
            return i18next.t(`units.${quantity}.${systemOfMeasurement}`);
        }
        static TrackBrief(track) {
            if (track === null) {
                return "";
            }
            return Math.round(track) + this.Degrees;
        }
        static TrackLong(track) {
            if (track === null) {
                return i18next.t("notApplicable");
            }
            const trackDir = Math.floor((360 + (track % 360) + 22.5) / 45) % 8;
            return (Math.round(track) + this.Degrees + this.Nbsp + "(" + i18next.t("format.compass." + this.trackDirections[trackDir]) + ")");
        }
        static AltitudeBrief(alt, vr, displayUnits) {
            let altText;
            if (isNaN(Number(alt))) {
                return i18next.t("list.ground");
            }
            altText = Math.round(this.ConvertAltitude(alt, displayUnits)) + this.Nbsp;
            let verticalRateTriangle = '<span class="verticalRateTriangle">';
            if (vr > 128) {
                verticalRateTriangle += this.upTriangle;
            }
            else if (vr < -128) {
                verticalRateTriangle += this.downTriangle;
            }
            else {
                verticalRateTriangle += this.Nbsp;
            }
            verticalRateTriangle += "</span>";
            return altText + verticalRateTriangle;
        }
        static AltitudeLong(alt, vr, displayUnits) {
            let altText = "";
            if (isNaN(Number(alt))) {
                return i18next.t("list.ground");
            }
            altText =
                Math.round(this.ConvertAltitude(alt, displayUnits)) +
                    this.Nbsp +
                    this.GetUnitLabel("altitude", displayUnits);
            if (vr > 128) {
                return this.upTriangle + this.Nbsp + altText;
            }
            else if (vr < -128) {
                return this.downTriangle + this.Nbsp + altText;
            }
            else {
                return altText;
            }
        }
        static ConvertAltitude(alt, displayUnits) {
            if (displayUnits === "metric") {
                return alt / 3.2808;
            }
            return alt;
        }
        static ConvertSpeed(speed, displayUnits) {
            if (displayUnits === "metric") {
                return speed * 1.852;
            }
            else if (displayUnits === "imperial") {
                return speed * 1.151;
            }
            return speed;
        }
        static SpeedBrief(speed, displayUnits) {
            if (speed === null) {
                return "";
            }
            return Math.round(this.ConvertSpeed(speed, displayUnits));
        }
        static SpeedLong(speed, displayUnits) {
            if (speed === null) {
                return i18next.t("notApplicable");
            }
            const speedText = Math.round(this.ConvertSpeed(speed, displayUnits)) +
                this.Nbsp +
                this.GetUnitLabel("speed", displayUnits);
            return speedText;
        }
        static ConvertDistance(dist, displayUnits) {
            if (displayUnits === "metric") {
                return dist / 1000;
            }
            else if (displayUnits === "imperial") {
                return dist / 1609;
            }
            return dist / 1852;
        }
        static DistanceBrief(dist, displayUnits) {
            if (dist === null) {
                return "";
            }
            return this.ConvertDistance(dist, displayUnits).toFixed(1);
        }
        static DistanceLong(dist, displayUnits, fixed = 1) {
            if (dist === null) {
                return i18next.t("notApplicable");
            }
            const distText = this.ConvertDistance(dist, displayUnits).toFixed(fixed) +
                this.Nbsp +
                this.GetUnitLabel("distance", displayUnits);
            return distText;
        }
        static ConvertDistanceShort(dist, displayUnits) {
            if (displayUnits === "imperial") {
                return dist / 0.3048;
            }
            return dist;
        }
        static DistanceShort(dist, displayUnits) {
            if (dist === null) {
                return i18next.t("notApplicable");
            }
            const distText = Math.round(this.ConvertDistanceShort(dist, displayUnits)) +
                this.Nbsp +
                this.GetUnitLabel("distanceShort", displayUnits);
            return distText;
        }
        static ConvertVerticalRate(rate, displayUnits) {
            if (displayUnits === "metric") {
                return rate / 196.85;
            }
            return rate;
        }
        static VerticalRateBrief(rate, displayUnits) {
            if (rate === null || rate === undefined) {
                return "";
            }
            return this.ConvertVerticalRate(rate, displayUnits).toFixed(displayUnits === "metric" ? 1 : 0);
        }
        static VerticalRateLong(rate, displayUnits) {
            if (rate === null || rate === undefined) {
                return i18next.t("notApplicable");
            }
            const rateText = this.ConvertVerticalRate(rate, displayUnits).toFixed(displayUnits === "metric" ? 1 : 0) +
                this.Nbsp +
                this.GetUnitLabel("verticalRate", displayUnits);
            return rateText;
        }
        static LatLong(p) {
            return p.lat.toFixed(3) + this.Degrees + "," + this.Nbsp + p.lng.toFixed(3) + this.Degrees;
        }
        static DataSource(source) {
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
        static NacP(value) {
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
                    return i18next.t("notApplicable");
            }
        }
        static NacV(value) {
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
                    return i18next.t("notApplicable");
            }
        }
    }
    Format.Nbsp = "\u00a0";
    Format.Degrees = "\u00b0";
    Format.upTriangle = "\u25b2";
    Format.downTriangle = "\u25bc";
    Format.trackDirections = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
    ];
    READSB.Format = Format;
})(READSB || (READSB = {}));
//# sourceMappingURL=format.js.map