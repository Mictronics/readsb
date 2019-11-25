"use strict";
var READSB;
(function (READSB) {
    class AircraftFilter {
        constructor() {
            this.IsActive = false;
            this.ValidateNumber = (Value, min, max) => {
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
            };
        }
        Validate() {
        }
        IsFiltered(aircraft) {
            return false;
        }
        FilterText(haystack, needle, condition) {
            if (needle === undefined) {
                return false;
            }
            if (haystack === null) {
                return true;
            }
            const h = haystack.trim().toUpperCase();
            const n = needle.trim().toUpperCase();
            switch (condition) {
                case READSB.eCondition.Equals:
                    if (h === n) {
                        return false;
                    }
                    break;
                case READSB.eCondition.NotEquals:
                    if (h !== n) {
                        return false;
                    }
                    break;
                case READSB.eCondition.Contains:
                    if (h.search(n) !== -1) {
                        return false;
                    }
                    break;
                case READSB.eCondition.NotContains:
                    if (h.search(n) === -1) {
                        return false;
                    }
                    break;
                case READSB.eCondition.Starts:
                    return !h.startsWith(n);
                case READSB.eCondition.NotStarts:
                    return h.startsWith(n);
                case READSB.eCondition.Ends:
                    return !h.endsWith(n);
                case READSB.eCondition.NotEnds:
                    return h.endsWith(n);
                default:
                    break;
            }
            return true;
        }
    }
    READSB.AircraftFilter = AircraftFilter;
    class AltitudeFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Altitude;
            this.MatchType = READSB.eFilterMatchType.NumberRange;
            this.Label = "Altitude";
            this.I18n = "filter.altitude";
            this.MinValue = -2000;
            this.MaxValue = 100000;
            this.DecimalPlaces = 0;
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Between;
            this.FilterConditions = [READSB.eCondition.Between, READSB.eCondition.NotBetween];
            this.IsActive = false;
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.Altitude === null) {
                    return true;
                }
                let f = true;
                const a = READSB.Format.ConvertAltitude(aircraft.Altitude, READSB.AppSettings.DisplayUnits);
                if (a >= this.Value1 && a <= this.Value2) {
                    f = false;
                }
                if (this.Condition === READSB.eCondition.NotBetween) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }
        ConvertUnit(displayUnits) {
            if (this.Value1 !== undefined && this.Value2 !== undefined) {
                this.Value1 = READSB.Format.ConvertAltitude(this.Value1, displayUnits);
                this.Value2 = READSB.Format.ConvertAltitude(this.Value2, displayUnits);
            }
        }
    }
    class IdentFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Ident;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Ident";
            this.I18n = "filter.ident";
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Flight, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            const s = this.Value1.trim().substr(0, 7).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }
    class CountryFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Country;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Country";
            this.I18n = "filter.country";
            this.InputWidth = READSB.eInputWidth.Long;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && aircraft.Icao !== null && this.Value1 !== undefined) {
                const f = READSB.FindIcaoRange(aircraft.Icao);
                return this.FilterText(f.Country, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            this.Value1 = this.Value1.trim().substr(0, 30);
        }
    }
    class DistanceFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Distance;
            this.MatchType = READSB.eFilterMatchType.NumberRange;
            this.Label = "Distance";
            this.I18n = "filter.distance";
            this.MinValue = 0;
            this.MaxValue = 30000;
            this.decimalPlaces = 2;
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Between;
            this.FilterConditions = [READSB.eCondition.Between, READSB.eCondition.NotBetween];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.SiteDist === null) {
                    return true;
                }
                let f = true;
                const s = READSB.Format.ConvertDistance(aircraft.SiteDist, READSB.AppSettings.DisplayUnits);
                if (s >= this.Value1 && s <= this.Value2) {
                    f = false;
                }
                if (this.Condition === READSB.eCondition.NotBetween) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }
        ConvertUnit(displayUnits) {
            if (this.Value1 !== undefined && this.Value2 !== undefined) {
                this.Value1 = READSB.Format.ConvertDistance(this.Value1, displayUnits);
                this.Value2 = READSB.Format.ConvertDistance(this.Value2, displayUnits);
            }
        }
    }
    class MilitaryFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.IsMilitary;
            this.MatchType = READSB.eFilterMatchType.OnOff;
            this.Label = "Is Military";
            this.I18n = "filter.military";
            this.FilterConditions = [];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1) {
                if (aircraft.CivilMil === null) {
                    return true;
                }
                else {
                    return !aircraft.CivilMil;
                }
            }
            return false;
        }
        Validate() {
            return this.Value1;
        }
    }
    class IsInterestingFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.UserInterested;
            this.MatchType = READSB.eFilterMatchType.OnOff;
            this.Label = "Interesting";
            this.I18n = "filter.interesting";
            this.Condition = READSB.eCondition.Equals;
            this.FilterConditions = [];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1) {
                if (aircraft.Interesting === null) {
                    return true;
                }
                else {
                    return !aircraft.Interesting;
                }
            }
            return false;
        }
        Validate() {
            return this.Value1;
        }
    }
    class HideNoPositionFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.HideNoPosition;
            this.MatchType = READSB.eFilterMatchType.OnOff;
            this.Label = "Hide No Position";
            this.I18n = "filter.hideNoPosition";
            this.FilterConditions = [];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && aircraft.Position === null && this.Value1) {
                return true;
            }
            return false;
        }
        Validate() {
            return this.Value1;
        }
    }
    class IcaoFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Icao;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Icao";
            this.I18n = "filter.icao";
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Icao, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            const s = this.Value1.trim().substr(0, 6).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-F]/, "");
        }
    }
    class TypeIcaoFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.TypeIcao;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Type Icao";
            this.I18n = "filter.type";
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.IcaoType, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            const s = this.Value1.trim().substr(0, 4).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }
    class OperatorFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Operator;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Operator";
            this.I18n = "filter.operator";
            this.InputWidth = READSB.eInputWidth.Long;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                return this.FilterText(aircraft.Operator, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            this.Value1 = this.Value1.trim().substr(0, 30);
        }
    }
    class OperatorCodeFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.OperatorCode;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Operator Code";
            this.I18n = "filter.operatorCode";
            this.InputWidth = READSB.eInputWidth.ThreeChar;
            this.Condition = READSB.eCondition.Equals;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                if (aircraft.Flight === null) {
                    return true;
                }
                const oc = aircraft.Flight.substr(0, 3).toUpperCase();
                let f = true;
                if (oc === this.Value1) {
                    f = false;
                }
                if (this.Condition === READSB.eCondition.NotEquals) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            const s = this.Value1.trim().substr(0, 3).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z]/, "");
        }
    }
    class RegistrationFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Registration;
            this.MatchType = READSB.eFilterMatchType.TextMatch;
            this.Label = "Registration";
            this.I18n = "filter.registration";
            this.InputWidth = READSB.eInputWidth.NineChar;
            this.Condition = READSB.eCondition.Contains;
            this.FilterConditions = [READSB.eCondition.Equals,
                READSB.eCondition.NotEquals,
                READSB.eCondition.Contains,
                READSB.eCondition.NotContains,
                READSB.eCondition.Starts,
                READSB.eCondition.NotStarts,
                READSB.eCondition.Ends,
                READSB.eCondition.NotEnds,
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined) {
                let r = aircraft.Registration;
                if (r !== null && r.startsWith("#")) {
                    r = r.substr(2);
                }
                return this.FilterText(r, this.Value1, this.Condition);
            }
            return false;
        }
        Validate() {
            const s = this.Value1.trim().substr(0, 10).toUpperCase();
            this.Value1 = s.replace(/[^0-9A-Z-+]/, "");
        }
    }
    class SpeciesFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Species;
            this.MatchType = READSB.eFilterMatchType.EnumMatch;
            this.Label = "Species";
            this.I18n = "filter.species";
            this.Condition = READSB.eCondition.Equals;
            this.FilterConditions = [READSB.eCondition.Equals, READSB.eCondition.NotEquals];
            this.EnumValues = [
                { Value: READSB.eSpecies.None, Text: "None", I18n: "species.none" },
                { Value: READSB.eSpecies.LandPlane, Text: "Land Plane", I18n: "species.landPlane" },
                { Value: READSB.eSpecies.SeaPlane, Text: "Sea Plane", I18n: "species.seaPlane" },
                { Value: READSB.eSpecies.Amphibian, Text: "Amphibian", I18n: "species.amphibian" },
                { Value: READSB.eSpecies.Helicopter, Text: "Helicopter", I18n: "species.helicopter" },
                { Value: READSB.eSpecies.Gyrocopter, Text: "Gyrocopter", I18n: "species.gyrocopter" },
                { Value: READSB.eSpecies.Tiltwing, Text: "Tiltwing", I18n: "species.tiltwing" },
                { Value: READSB.eSpecies.Tiltwing, Text: "Tiltrotor", I18n: "species.tiltrotor" },
                { Value: READSB.eSpecies.Drone, Text: "Drone", I18n: "species.drone" },
                { Value: READSB.eSpecies.Balloon, Text: "Balloon", I18n: "species.balloon" },
                { Value: READSB.eSpecies.Paraglider, Text: "Paraglider", I18n: "species.paraglider" },
                { Value: READSB.eSpecies.GroundVehicle, Text: "Ground Vehicle", I18n: "species.groundVehicle" },
                { Value: READSB.eSpecies.Tower, Text: "Radio Tower", I18n: "species.radioTower" },
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && aircraft.Species !== null && this.Value1) {
                let f = true;
                const s = aircraft.Species.substr(0, 1);
                switch (this.Value1) {
                    case READSB.eSpecies.LandPlane:
                        if (s === "L") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.SeaPlane:
                        if (s === "S") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Amphibian:
                        if (s === "A") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Helicopter:
                        if (s === "H") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Gyrocopter:
                        if (s === "G") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Tiltwing:
                        if (s === "W") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Tiltrotor:
                        if (s === "R") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.GroundVehicle:
                        if (s === "V") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Tower:
                        if (s === "T") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Drone:
                        if (s === "D") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Balloon:
                        if (s === "B") {
                            f = false;
                        }
                        break;
                    case READSB.eSpecies.Paraglider:
                        if (s === "P") {
                            f = false;
                        }
                        break;
                    default:
                        break;
                }
                if (this.Condition === READSB.eCondition.NotEquals) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < READSB.eSpecies.None) {
                this.Value1 = READSB.eSpecies.None;
            }
            if (this.Value1 > READSB.eSpecies.Paraglider) {
                this.Value1 = READSB.eSpecies.Paraglider;
            }
        }
    }
    class SquawkFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Squawk;
            this.MatchType = READSB.eFilterMatchType.NumberRange;
            this.Label = "Squawk";
            this.I18n = "filter.squawk";
            this.MinValue = 0;
            this.MaxValue = 7777;
            this.DecimalPlaces = 0;
            this.InputWidth = READSB.eInputWidth.SixChar;
            this.Condition = READSB.eCondition.Between;
            this.FilterConditions = [READSB.eCondition.Between, READSB.eCondition.NotBetween];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && this.Value1 !== undefined && this.Value2 !== undefined) {
                if (aircraft.Squawk === null) {
                    return true;
                }
                let f = true;
                const s = Number(aircraft.Squawk);
                if (s >= this.Value1 && s <= this.Value2) {
                    f = false;
                }
                if (this.Condition === READSB.eCondition.NotBetween) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = this.ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
            this.Value2 = this.ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
        }
    }
    class WtcFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.Wtc;
            this.MatchType = READSB.eFilterMatchType.EnumMatch;
            this.Label = "Wake Turbulence";
            this.I18n = "filter.wtc";
            this.Condition = READSB.eCondition.Equals;
            this.FilterConditions = [READSB.eCondition.Equals, READSB.eCondition.NotEquals];
            this.EnumValues = [
                { Value: READSB.eWakeTurbulenceCategory.None, Text: "None", I18n: "wtc.none" },
                { Value: READSB.eWakeTurbulenceCategory.Light, Text: "Light", I18n: "wtc.light" },
                { Value: READSB.eWakeTurbulenceCategory.Medium, Text: "Medium", I18n: "wtc.medium" },
                { Value: READSB.eWakeTurbulenceCategory.Heavy, Text: "Heavy", I18n: "wtc.heavy" },
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && aircraft.Wtc !== null && this.Value1) {
                let f = true;
                switch (this.Value1) {
                    case READSB.eWakeTurbulenceCategory.Light:
                        if (aircraft.Wtc === "L") {
                            f = false;
                        }
                        break;
                    case READSB.eWakeTurbulenceCategory.Medium:
                        if (aircraft.Wtc === "M") {
                            f = false;
                        }
                        break;
                    case READSB.eWakeTurbulenceCategory.Heavy:
                        if (aircraft.Wtc === "H") {
                            f = false;
                        }
                        break;
                    default:
                        f = false;
                        break;
                }
                if (this.Condition === READSB.eCondition.NotEquals) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < READSB.eWakeTurbulenceCategory.None) {
                this.Value1 = READSB.eWakeTurbulenceCategory.None;
            }
            if (this.Value1 > READSB.eWakeTurbulenceCategory.Heavy) {
                this.Value1 = READSB.eWakeTurbulenceCategory.Heavy;
            }
        }
    }
    class EngineTypeFilter extends AircraftFilter {
        constructor() {
            super(...arguments);
            this.Type = READSB.eAircraftFilterType.EngineType;
            this.MatchType = READSB.eFilterMatchType.EnumMatch;
            this.Label = "Engine Type";
            this.I18n = "filter.engine";
            this.Condition = READSB.eCondition.Equals;
            this.FilterConditions = [READSB.eCondition.Equals, READSB.eCondition.NotEquals];
            this.EnumValues = [
                { Value: READSB.eEngineType.None, Text: "None", I18n: "engine.none" },
                { Value: READSB.eEngineType.Piston, Text: "Piston", I18n: "engine.piston" },
                { Value: READSB.eEngineType.Turbo, Text: "Turboshaft", I18n: "engine.turboshaft" },
                { Value: READSB.eEngineType.Jet, Text: "Jet", I18n: "engine.jet" },
                { Value: READSB.eEngineType.Electric, Text: "Electric", I18n: "engine.electric" },
                { Value: READSB.eEngineType.Rocket, Text: "Rocket", I18n: "engine.rocket" },
            ];
        }
        IsFiltered(aircraft) {
            if (this.IsActive && aircraft.Species !== null && this.Value1) {
                let f = true;
                const s = aircraft.Species.substr(2, 1);
                switch (this.Value1) {
                    case READSB.eEngineType.Piston:
                        if (s === "P") {
                            f = false;
                        }
                        break;
                    case READSB.eEngineType.Turbo:
                        if (s === "T") {
                            f = false;
                        }
                        break;
                    case READSB.eEngineType.Jet:
                        if (s === "J") {
                            f = false;
                        }
                        break;
                    case READSB.eEngineType.Electric:
                        if (s === "E") {
                            f = false;
                        }
                        break;
                    case READSB.eEngineType.Rocket:
                        if (s === "R") {
                            f = false;
                        }
                        break;
                    default:
                        f = false;
                        break;
                }
                if (this.Condition === READSB.eCondition.NotEquals) {
                    f = !f;
                }
                return f;
            }
            return false;
        }
        Validate() {
            this.Value1 = Number(this.Value1);
            if (this.Value1 < READSB.eEngineType.None) {
                this.Value1 = READSB.eEngineType.None;
            }
            if (this.Value1 > READSB.eEngineType.Rocket) {
                this.Value1 = READSB.eEngineType.Rocket;
            }
        }
    }
    READSB.ConditionList = [
        { Value: READSB.eCondition.Equals, Text: "equals", I18n: "filter.equals" },
        { Value: READSB.eCondition.NotEquals, Text: "not equals", I18n: "filter.notEquals" },
        { Value: READSB.eCondition.Contains, Text: "contains", I18n: "filter.contains" },
        { Value: READSB.eCondition.NotContains, Text: "not contains", I18n: "filter.notContains" },
        { Value: READSB.eCondition.Between, Text: "is between", I18n: "filter.isBetween" },
        { Value: READSB.eCondition.NotBetween, Text: "is not between", I18n: "filter.isNotBetween" },
        { Value: READSB.eCondition.Starts, Text: "starts with", I18n: "filter.startsWith" },
        { Value: READSB.eCondition.NotStarts, Text: "starts not with", I18n: "filter.startsNotWith" },
        { Value: READSB.eCondition.Ends, Text: "ends with", I18n: "filter.endsWith" },
        { Value: READSB.eCondition.NotEnds, Text: "ends not with", I18n: "filter.endsNotWith" },
    ];
    READSB.AircraftFilterCollection = [];
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Altitude] = new AltitudeFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Ident] = new IdentFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Country] = new CountryFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Distance] = new DistanceFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.IsMilitary] = new MilitaryFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.UserInterested] = new IsInterestingFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.HideNoPosition] = new HideNoPositionFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Icao] = new IcaoFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.TypeIcao] = new TypeIcaoFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Operator] = new OperatorFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.OperatorCode] = new OperatorCodeFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Registration] = new RegistrationFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Species] = new SpeciesFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Squawk] = new SquawkFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.Wtc] = new WtcFilter();
    READSB.AircraftFilterCollection[READSB.eAircraftFilterType.EngineType] = new EngineTypeFilter();
})(READSB || (READSB = {}));
//# sourceMappingURL=aircraftFilter.js.map