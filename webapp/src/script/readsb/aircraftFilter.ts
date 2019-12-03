// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// aircraftFilter.ts: Classes for defining aircraft filters.
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
    export class AircraftFilter implements IAircraftFilter {
        public IsActive: boolean = false;
        public Value1: any;
        public Value2: any;
        public Type: eAircraftFilterType;
        public MatchType: eFilterMatchType;
        public Label: string;
        public I18n: string;
        public Condition: eCondition;
        public FilterConditions: eCondition[];
        public EnumValues: any[];
        public InputWidth: eInputWidth;
        public DecimalPlaces?: number;

        public Validate() {
            // Empty
        }

        public IsFiltered(aircraft: IAircraft): boolean {
            return false;
        }

        /* Validate a number from user input */
        protected ValidateNumber = (Value: number, min: number, max: number) => {
            let v = Number(Value);
            if (!Number.isFinite(v)) {
                v = min;
            }
            if (v < min) {
                v = min;
            }
            if (v > max) {
                v = max;
            }
            return v;
        }

        /* Filter a text input depending on condition */
        protected FilterText(haystack: any, needle: any, condition: any) {
            if (needle === undefined) { return false; }
            if (haystack === null) { return true; }
            const h = haystack.trim().toUpperCase();
            const n = needle.trim().toUpperCase();
            switch (condition) {
                case eCondition.Equals:
                    if (h === n) { return false; }
                    break;

                case eCondition.NotEquals:
                    if (h !== n) { return false; }
                    break;

                case eCondition.Contains:
                    if (h.search(n) !== -1) { return false; }
                    break;

                case eCondition.NotContains:
                    if (h.search(n) === -1) { return false; }
                    break;

                case eCondition.Starts:
                    return !h.startsWith(n);

                case eCondition.NotStarts:
                    return h.startsWith(n);

                case eCondition.Ends:
                    return !h.endsWith(n);

                case eCondition.NotEnds:
                    return h.endsWith(n);

                default:
                    break;
            }
            return true;
        }
    }

    class AltitudeFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Altitude;
        public MatchType = eFilterMatchType.NumberRange;
        public Label = "Altitude";
        public I18n = "filter.altitude";
        public MinValue = -2000;
        public MaxValue = 100000;
        public DecimalPlaces = 0;
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Between;
        public FilterConditions = [eCondition.Between, eCondition.NotBetween];
        public IsActive = false;

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.Altitude === null) { return true; }
                let f = true;
                const a = Format.ConvertAltitude(aircraft.Altitude, AppSettings.DisplayUnits);
                if (a >= this.Value1 && a <= this.Value2) { f = false; }
                if ((this.Condition as eCondition) === eCondition.NotBetween) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): void {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }

        public ConvertUnit(displayUnits: string) {
            if (this.Value1 !== undefined && this.Value2 !== undefined) {
                this.Value1 = Format.ConvertAltitude(this.Value1, displayUnits);
                this.Value2 = Format.ConvertAltitude(this.Value2, displayUnits);
            }
        }
    }

    class IdentFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Ident;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Ident";
        public I18n = "filter.ident";
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Flight, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): void {
            const s = this.Value1.trim().substr(0, 7).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }

    class CountryFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Country;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Country";
        public I18n = "filter.country";
        public InputWidth = eInputWidth.Long;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && aircraft.Icao !== null && this.Value1 !== undefined) {
                const f = FindIcaoRange(aircraft.Icao);
                return this.FilterText(f.Country, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): void {
            this.Value1 = this.Value1.trim().substr(0, 30);
        }
    }

    class DistanceFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Distance;
        public MatchType = eFilterMatchType.NumberRange;
        public Label = "Distance";
        public I18n = "filter.distance";
        public MinValue = 0;
        public MaxValue = 30000;
        public decimalPlaces = 2;
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Between;
        public FilterConditions = [eCondition.Between, eCondition.NotBetween];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.SiteDist === null) { return true; }
                let f = true;
                const s = Format.ConvertDistance(aircraft.SiteDist, AppSettings.DisplayUnits);
                if (s >= this.Value1 && s <= this.Value2) { f = false; }
                if ((this.Condition as eCondition) === eCondition.NotBetween) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): void {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }

        public ConvertUnit(displayUnits: any) {
            if (this.Value1 !== undefined && this.Value2 !== undefined) {
                this.Value1 = Format.ConvertDistance(this.Value1, displayUnits);
                this.Value2 = Format.ConvertDistance(this.Value2, displayUnits);
            }
        }
    }

    class MilitaryFilter extends AircraftFilter {
        public Type = eAircraftFilterType.IsMilitary;
        public MatchType = eFilterMatchType.OnOff;
        public Label = "Is Military";
        public I18n = "filter.military";
        public FilterConditions: eCondition[] = [];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1) {
                if (aircraft.CivilMil === null) {
                    return true;
                } else {
                    return !aircraft.CivilMil;
                }
            }
            return false;
        }

        public Validate(): any {
            return this.Value1;
        }
    }

    class IsInterestingFilter extends AircraftFilter {
        public Type = eAircraftFilterType.UserInterested;
        public MatchType = eFilterMatchType.OnOff;
        public Label = "Interesting";
        public I18n = "filter.interesting";
        public Condition = eCondition.Equals;
        public FilterConditions: eCondition[] = [];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1) {
                if (aircraft.Interesting === null) {
                    return true;
                } else {
                    return !aircraft.Interesting;
                }
            }
            return false;
        }

        public Validate(): any {
            return this.Value1;
        }
    }

    class HideNoPositionFilter extends AircraftFilter {
        public Type = eAircraftFilterType.HideNoPosition;
        public MatchType = eFilterMatchType.OnOff;
        public Label = "Hide No Position";
        public I18n = "filter.hideNoPosition";
        public FilterConditions: eCondition[] = [];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && aircraft.Position === null && this.Value1) {
                return true;
            }
            return false;
        }

        public Validate(): any {
            return this.Value1;
        }
    }

    class IcaoFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Icao;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Icao";
        public I18n = "filter.icao";
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Icao, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): any {
            const s = this.Value1.trim().substr(0, 6).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-F]/, "");
        }
    }

    class TypeIcaoFilter extends AircraftFilter {
        public Type = eAircraftFilterType.TypeIcao;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Type Icao";
        public I18n = "filter.type";
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.IcaoType, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): any {
            const s = this.Value1.trim().substr(0, 4).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }

    class OperatorFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Operator;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Operator";
        public I18n = "filter.operator";
        public InputWidth = eInputWidth.Long;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Operator, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): any {
            this.Value1 = this.Value1.trim().substr(0, 30);
        }
    }

    class OperatorCodeFilter extends AircraftFilter {
        public Type = eAircraftFilterType.OperatorCode;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Operator Code";
        public I18n = "filter.operatorCode";
        public InputWidth = eInputWidth.ThreeChar;
        public Condition = eCondition.Equals;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                if (aircraft.Flight === null) { return true; }
                const oc = aircraft.Flight.substr(0, 3).toUpperCase();
                let f = true;
                if (oc === this.Value1) { f = false; }
                if ((this.Condition as eCondition) === eCondition.NotEquals) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): any {
            const s = this.Value1.trim().substr(0, 3).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }

    class RegistrationFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Registration;
        public MatchType = eFilterMatchType.TextMatch;
        public Label = "Registration";
        public I18n = "filter.registration";
        public InputWidth = eInputWidth.NineChar;
        public Condition = eCondition.Contains;
        public FilterConditions =
            [eCondition.Equals,
            eCondition.NotEquals,
            eCondition.Contains,
            eCondition.NotContains,
            eCondition.Starts,
            eCondition.NotStarts,
            eCondition.Ends,
            eCondition.NotEnds,
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined) {
                let r = aircraft.Registration;
                if (r !== null && r.startsWith("#")) {
                    r = r.substr(2); // Remove DB entry marker if exists
                }
                return this.FilterText(r, this.Value1, this.Condition);
            }
            return false;
        }

        public Validate(): any {
            const s = this.Value1.trim().substr(0, 10).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z-+]/, "");
        }
    }

    class SpeciesFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Species;
        public MatchType = eFilterMatchType.EnumMatch;
        public Label = "Species";
        public I18n = "filter.species";
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eSpecies.None, Text: "None", I18n: "species.none" },
                { Value: eSpecies.LandPlane, Text: "Land Plane", I18n: "species.landPlane" },
                { Value: eSpecies.SeaPlane, Text: "Sea Plane", I18n: "species.seaPlane" },
                { Value: eSpecies.Amphibian, Text: "Amphibian", I18n: "species.amphibian" },
                { Value: eSpecies.Helicopter, Text: "Helicopter", I18n: "species.helicopter" },
                { Value: eSpecies.Gyrocopter, Text: "Gyrocopter", I18n: "species.gyrocopter" },
                { Value: eSpecies.Tiltwing, Text: "Tiltwing", I18n: "species.tiltwing" },
                { Value: eSpecies.Tiltwing, Text: "Tiltrotor", I18n: "species.tiltrotor" },
                { Value: eSpecies.Drone, Text: "Drone", I18n: "species.drone" },
                { Value: eSpecies.Balloon, Text: "Balloon", I18n: "species.balloon" },
                { Value: eSpecies.Paraglider, Text: "Paraglider", I18n: "species.paraglider" },
                { Value: eSpecies.GroundVehicle, Text: "Ground Vehicle", I18n: "species.groundVehicle" },
                { Value: eSpecies.Tower, Text: "Radio Tower", I18n: "species.radioTower" },
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && aircraft.Species !== null && this.Value1) {
                let f = true;
                const s = aircraft.Species.substr(0, 1);
                switch (this.Value1) {
                    case eSpecies.LandPlane:
                        if (s === "L") { f = false; }
                        break;
                    case eSpecies.SeaPlane:
                        if (s === "S") { f = false; }
                        break;
                    case eSpecies.Amphibian:
                        if (s === "A") { f = false; }
                        break;
                    case eSpecies.Helicopter:
                        if (s === "H") { f = false; }
                        break;
                    case eSpecies.Gyrocopter:
                        if (s === "G") { f = false; }
                        break;
                    case eSpecies.Tiltwing:
                        if (s === "W") { f = false; }
                        break;
                    case eSpecies.Tiltrotor:
                        if (s === "R") { f = false; }
                        break;
                    case eSpecies.GroundVehicle:
                        if (s === "V") { f = false; }
                        break;
                    case eSpecies.Tower:
                        if (s === "T") { f = false; }
                        break;
                    case eSpecies.Drone:
                        if (s === "D") { f = false; }
                        break;
                    case eSpecies.Balloon:
                        if (s === "B") { f = false; }
                        break;
                    case eSpecies.Paraglider:
                        if (s === "P") { f = false; }
                        break;
                    default:
                        break;
                }
                if ((this.Condition as eCondition) === eCondition.NotEquals) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): any {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < eSpecies.None) {
                this.Value1 = eSpecies.None;
            }
            if (this.Value1 > eSpecies.Paraglider) {
                this.Value1 = eSpecies.Paraglider;
            }
        }
    }

    class SquawkFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Squawk;
        public MatchType = eFilterMatchType.NumberRange;
        public Label = "Squawk";
        public I18n = "filter.squawk";
        public MinValue = 0;
        public MaxValue = 7777;
        public DecimalPlaces = 0;
        public InputWidth = eInputWidth.SixChar;
        public Condition = eCondition.Between;
        public FilterConditions = [eCondition.Between, eCondition.NotBetween];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.Squawk === null) { return true; }
                let f = true;
                const s = Number(aircraft.Squawk);
                if (s >= this.Value1 && s <= this.Value2) { f = false; }
                if ((this.Condition as eCondition) === eCondition.NotBetween) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): any {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }
    }

    class WtcFilter extends AircraftFilter {
        public Type = eAircraftFilterType.Wtc;
        public MatchType = eFilterMatchType.EnumMatch;
        public Label = "Wake Turbulence";
        public I18n = "filter.wtc";
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eWakeTurbulenceCategory.None, Text: "None", I18n: "wtc.none" },
                { Value: eWakeTurbulenceCategory.Light, Text: "Light", I18n: "wtc.light" },
                { Value: eWakeTurbulenceCategory.Medium, Text: "Medium", I18n: "wtc.medium" },
                { Value: eWakeTurbulenceCategory.Heavy, Text: "Heavy", I18n: "wtc.heavy" },
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && aircraft.Wtc !== null && this.Value1) {
                let f = true;
                switch (this.Value1) {
                    case eWakeTurbulenceCategory.Light:
                        if (aircraft.Wtc === "L") { f = false; }
                        break;
                    case eWakeTurbulenceCategory.Medium:
                        if (aircraft.Wtc === "M") { f = false; }
                        break;
                    case eWakeTurbulenceCategory.Heavy:
                        if (aircraft.Wtc === "H") { f = false; }
                        break;
                    default:
                        f = false;
                        break;
                }
                if ((this.Condition as eCondition) === eCondition.NotEquals) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): any {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < eWakeTurbulenceCategory.None) {
                this.Value1 = eWakeTurbulenceCategory.None;
            }
            if (this.Value1 > eWakeTurbulenceCategory.Heavy) {
                this.Value1 = eWakeTurbulenceCategory.Heavy;
            }
        }
    }

    class EngineTypeFilter extends AircraftFilter {
        public Type = eAircraftFilterType.EngineType;
        public MatchType = eFilterMatchType.EnumMatch;
        public Label = "Engine Type";
        public I18n = "filter.engine";
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eEngineType.None, Text: "None", I18n: "engine.none" },
                { Value: eEngineType.Piston, Text: "Piston", I18n: "engine.piston" },
                { Value: eEngineType.Turbo, Text: "Turboshaft", I18n: "engine.turboshaft" },
                { Value: eEngineType.Jet, Text: "Jet", I18n: "engine.jet" },
                { Value: eEngineType.Electric, Text: "Electric", I18n: "engine.electric" },
                { Value: eEngineType.Rocket, Text: "Rocket", I18n: "engine.rocket" },
            ];

        public IsFiltered(aircraft: IAircraft): boolean {
            if (this.IsActive && aircraft.Species !== null && this.Value1) {
                let f = true;
                const s = aircraft.Species.substr(2, 1);
                switch (this.Value1) {
                    case eEngineType.Piston:
                        if (s === "P") { f = false; }
                        break;
                    case eEngineType.Turbo:
                        if (s === "T") { f = false; }
                        break;
                    case eEngineType.Jet:
                        if (s === "J") { f = false; }
                        break;
                    case eEngineType.Electric:
                        if (s === "E") { f = false; }
                        break;
                    case eEngineType.Rocket:
                        if (s === "R") { f = false; }
                        break;
                    default:
                        f = false;
                        break;
                }
                if ((this.Condition as eCondition) === eCondition.NotEquals) { f = !f; }
                return f;
            }
            return false;
        }

        public Validate(): any {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < eEngineType.None) {
                this.Value1 = eEngineType.None;
            }
            if (this.Value1 > eEngineType.Rocket) {
                this.Value1 = eEngineType.Rocket;
            }
        }
    }

    export const ConditionList = [
        { Value: eCondition.Equals, Text: "equals", I18n: "filter.equals" },
        { Value: eCondition.NotEquals, Text: "not equals", I18n: "filter.notEquals" },
        { Value: eCondition.Contains, Text: "contains", I18n: "filter.contains" },
        { Value: eCondition.NotContains, Text: "not contains", I18n: "filter.notContains" },
        { Value: eCondition.Between, Text: "is between", I18n: "filter.isBetween" },
        { Value: eCondition.NotBetween, Text: "is not between", I18n: "filter.isNotBetween" },
        { Value: eCondition.Starts, Text: "starts with", I18n: "filter.startsWith" },
        { Value: eCondition.NotStarts, Text: "starts not with", I18n: "filter.startsNotWith" },
        { Value: eCondition.Ends, Text: "ends with", I18n: "filter.endsWith" },
        { Value: eCondition.NotEnds, Text: "ends not with", I18n: "filter.endsNotWith" },
    ];

    export const AircraftFilterCollection: AircraftFilter[] = [];
    AircraftFilterCollection[eAircraftFilterType.Altitude] = new AltitudeFilter();
    AircraftFilterCollection[eAircraftFilterType.Ident] = new IdentFilter();
    AircraftFilterCollection[eAircraftFilterType.Country] = new CountryFilter();
    AircraftFilterCollection[eAircraftFilterType.Distance] = new DistanceFilter();
    AircraftFilterCollection[eAircraftFilterType.IsMilitary] = new MilitaryFilter();
    AircraftFilterCollection[eAircraftFilterType.UserInterested] = new IsInterestingFilter();
    AircraftFilterCollection[eAircraftFilterType.HideNoPosition] = new HideNoPositionFilter();
    AircraftFilterCollection[eAircraftFilterType.Icao] = new IcaoFilter();
    AircraftFilterCollection[eAircraftFilterType.TypeIcao] = new TypeIcaoFilter();
    AircraftFilterCollection[eAircraftFilterType.Operator] = new OperatorFilter();
    AircraftFilterCollection[eAircraftFilterType.OperatorCode] = new OperatorCodeFilter();
    AircraftFilterCollection[eAircraftFilterType.Registration] = new RegistrationFilter();
    AircraftFilterCollection[eAircraftFilterType.Species] = new SpeciesFilter();
    AircraftFilterCollection[eAircraftFilterType.Squawk] = new SquawkFilter();
    AircraftFilterCollection[eAircraftFilterType.Wtc] = new WtcFilter();
    AircraftFilterCollection[eAircraftFilterType.EngineType] = new EngineTypeFilter();
}
