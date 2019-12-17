// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// strings.ts: Collection of one time translated strings.
//
// Collection is used to prevent frequently calling i18next when dynamic
// data changes. Hugh performance boost.
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
    export class Strings {
        public static NotApplicable = "";
        public static Ground = "";
        public static Now = "";
        public static Civil = "";
        public static CivilShort = "";
        public static Military = "";
        public static MilitaryShort = "";
        public static Climbing = "";
        public static Descending = "";
        public static Level = "";
        public static UnknownFlight = "";
        public static UnknownAircraftType = "";
        public static AltitudeUnit = "";
        public static DistanceUnit = "";
        public static DistanceShortUnit = "";
        public static SpeedUnit = "";
        public static VerticalRateUnit = "";
        public static PressureUnit = "";
        public static TimeUnit = "";
        public static Compass: string[] = [];
        public static CrossChecked = "";
        public static NotCrossChecked = "";
        public static Unknown = "";
        public static PerHour = "";
        public static PerSample = "";
        public static None = "";

        /**
         * Translate static strings by i18next on langange change.
         */
        public static OnLanguageChange() {
            const du = AppSettings.DisplayUnits;
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

        private static trackDirections: string[] = [
            "N",
            "NE",
            "E",
            "SE",
            "S",
            "SW",
            "W",
            "NW",
        ];
    }
}
