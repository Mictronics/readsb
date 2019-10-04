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
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eSpecies.None, Text: "None" },
                { Value: eSpecies.LandPlane, Text: "Land Plane" },
                { Value: eSpecies.SeaPlane, Text: "Sea Plane" },
                { Value: eSpecies.Amphibian, Text: "Amphibian" },
                { Value: eSpecies.Helicopter, Text: "Helicopter" },
                { Value: eSpecies.Gyrocopter, Text: "Gyrocopter" },
                { Value: eSpecies.Tiltwing, Text: "Tiltwing" },
                { Value: eSpecies.Tiltwing, Text: "Tiltrotor" },
                { Value: eSpecies.Drone, Text: "Drone" },
                { Value: eSpecies.Balloon, Text: "Ballon" },
                { Value: eSpecies.Paraglider, Text: "Paraglider" },
                { Value: eSpecies.GroundVehicle, Text: "Ground Vehicle" },
                { Value: eSpecies.Tower, Text: "Radio Tower" },
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
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eWakeTurbulenceCategory.None, Text: "None" },
                { Value: eWakeTurbulenceCategory.Light, Text: "Light" },
                { Value: eWakeTurbulenceCategory.Medium, Text: "Medium" },
                { Value: eWakeTurbulenceCategory.Heavy, Text: "Heavy" },
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
        public Condition = eCondition.Equals;
        public FilterConditions = [eCondition.Equals, eCondition.NotEquals];
        public EnumValues =
            [
                { Value: eEngineType.None, Text: "None" },
                { Value: eEngineType.Piston, Text: "Piston" },
                { Value: eEngineType.Turbo, Text: "Turboshaft" },
                { Value: eEngineType.Jet, Text: "Jet" },
                { Value: eEngineType.Electric, Text: "Electric" },
                { Value: eEngineType.Rocket, Text: "Rocket" },
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
        { Value: eCondition.Equals, Text: "equals" },
        { Value: eCondition.NotEquals, Text: "not equals" },
        { Value: eCondition.Contains, Text: "contains" },
        { Value: eCondition.NotContains, Text: "not contains" },
        { Value: eCondition.Between, Text: "is between" },
        { Value: eCondition.NotBetween, Text: "is not between" },
        { Value: eCondition.Starts, Text: "starts with" },
        { Value: eCondition.NotStarts, Text: "starts not with" },
        { Value: eCondition.Ends, Text: "ends with" },
        { Value: eCondition.NotEnds, Text: "ends not with" },
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
