"use strict";
var READSB;
(function (READSB) {
    class Strings {
        static OnLanguageChange() {
            const du = READSB.AppSettings.DisplayUnits;
            this.NotApplicable = i18next.t("notApplicable");
            this.Ground = i18next.t("list.ground");
            this.Now = i18next.t("now");
            this.Civil = i18next.t("filter.civil");
            this.CivilShort = i18next.t("list.civ");
            this.Military = i18next.t("filter.military");
            this.MilitaryShort = i18next.t("list.mil");
            this.Climbing = i18next.t("list.climbing");
            this.Descending = i18next.t("list.descending");
            this.Level = i18next.t("list.level");
            this.UnknownAircraftType = i18next.t("list.unknownAircraftType");
            this.UnknownFlight = i18next.t("list.unknownFlight");
            this.AltitudeUnit = i18next.t(`units.altitude.${du}`);
            this.DistanceUnit = i18next.t(`units.distance.${du}`);
            this.DistanceShortUnit = i18next.t(`units.distanceShort.${du}`);
            this.SpeedUnit = i18next.t(`units.speed.${du}`);
            this.VerticalRateUnit = i18next.t(`units.verticalRate.${du}`);
            this.PressureUnit = i18next.t("units.hPa");
            this.TimeUnit = i18next.t("units.second");
            this.CrossChecked = i18next.t("adsb.crossChecked");
            this.NotCrossChecked = i18next.t("adsb.notCrossChecked");
            this.Unknown = i18next.t("adsb.unknown");
            this.PerHour = i18next.t("adsb.perHour");
            this.PerSample = i18next.t("adsb.perSample");
            this.None = i18next.t("adsb.none");
            for (const dir of this.trackDirections) {
                this.Compass.push(i18next.t(`format.compass.${dir}`));
            }
        }
    }
    Strings.NotApplicable = "";
    Strings.Ground = "";
    Strings.Now = "";
    Strings.Civil = "";
    Strings.CivilShort = "";
    Strings.Military = "";
    Strings.MilitaryShort = "";
    Strings.Climbing = "";
    Strings.Descending = "";
    Strings.Level = "";
    Strings.UnknownFlight = "";
    Strings.UnknownAircraftType = "";
    Strings.AltitudeUnit = "";
    Strings.DistanceUnit = "";
    Strings.DistanceShortUnit = "";
    Strings.SpeedUnit = "";
    Strings.VerticalRateUnit = "";
    Strings.PressureUnit = "";
    Strings.TimeUnit = "";
    Strings.Compass = [];
    Strings.CrossChecked = "";
    Strings.NotCrossChecked = "";
    Strings.Unknown = "";
    Strings.PerHour = "";
    Strings.PerSample = "";
    Strings.None = "";
    Strings.trackDirections = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
    ];
    READSB.Strings = Strings;
})(READSB || (READSB = {}));
//# sourceMappingURL=strings.js.map