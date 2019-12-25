"use strict";
var READSB;
(function (READSB) {
    let eAircraftFilterType;
    (function (eAircraftFilterType) {
        eAircraftFilterType[eAircraftFilterType["None"] = -1] = "None";
        eAircraftFilterType[eAircraftFilterType["Altitude"] = 0] = "Altitude";
        eAircraftFilterType[eAircraftFilterType["Country"] = 1] = "Country";
        eAircraftFilterType[eAircraftFilterType["Distance"] = 2] = "Distance";
        eAircraftFilterType[eAircraftFilterType["EngineType"] = 3] = "EngineType";
        eAircraftFilterType[eAircraftFilterType["HideNoPosition"] = 4] = "HideNoPosition";
        eAircraftFilterType[eAircraftFilterType["Icao"] = 5] = "Icao";
        eAircraftFilterType[eAircraftFilterType["Ident"] = 6] = "Ident";
        eAircraftFilterType[eAircraftFilterType["IsMilitary"] = 7] = "IsMilitary";
        eAircraftFilterType[eAircraftFilterType["Operator"] = 8] = "Operator";
        eAircraftFilterType[eAircraftFilterType["OperatorCode"] = 9] = "OperatorCode";
        eAircraftFilterType[eAircraftFilterType["Registration"] = 10] = "Registration";
        eAircraftFilterType[eAircraftFilterType["Species"] = 11] = "Species";
        eAircraftFilterType[eAircraftFilterType["Squawk"] = 12] = "Squawk";
        eAircraftFilterType[eAircraftFilterType["TypeIcao"] = 13] = "TypeIcao";
        eAircraftFilterType[eAircraftFilterType["UserInterested"] = 14] = "UserInterested";
        eAircraftFilterType[eAircraftFilterType["Wtc"] = 15] = "Wtc";
    })(eAircraftFilterType = READSB.eAircraftFilterType || (READSB.eAircraftFilterType = {}));
    let eFilterMatchType;
    (function (eFilterMatchType) {
        eFilterMatchType[eFilterMatchType["OnOff"] = 0] = "OnOff";
        eFilterMatchType[eFilterMatchType["TextMatch"] = 1] = "TextMatch";
        eFilterMatchType[eFilterMatchType["NumberRange"] = 2] = "NumberRange";
        eFilterMatchType[eFilterMatchType["EnumMatch"] = 3] = "EnumMatch";
    })(eFilterMatchType = READSB.eFilterMatchType || (READSB.eFilterMatchType = {}));
    let eInputWidth;
    (function (eInputWidth) {
        eInputWidth["Auto"] = "";
        eInputWidth["EightChar"] = "eightChar";
        eInputWidth["Long"] = "wide";
        eInputWidth["NineChar"] = "nineChar";
        eInputWidth["OneChar"] = "oneChar";
        eInputWidth["SixChar"] = "sixChar";
        eInputWidth["ThreeChar"] = "threeChar";
    })(eInputWidth = READSB.eInputWidth || (READSB.eInputWidth = {}));
    let eSpecies;
    (function (eSpecies) {
        eSpecies[eSpecies["None"] = 0] = "None";
        eSpecies[eSpecies["LandPlane"] = 1] = "LandPlane";
        eSpecies[eSpecies["SeaPlane"] = 2] = "SeaPlane";
        eSpecies[eSpecies["Amphibian"] = 3] = "Amphibian";
        eSpecies[eSpecies["Helicopter"] = 4] = "Helicopter";
        eSpecies[eSpecies["Gyrocopter"] = 5] = "Gyrocopter";
        eSpecies[eSpecies["Tiltwing"] = 6] = "Tiltwing";
        eSpecies[eSpecies["Tiltrotor"] = 7] = "Tiltrotor";
        eSpecies[eSpecies["GroundVehicle"] = 8] = "GroundVehicle";
        eSpecies[eSpecies["Tower"] = 9] = "Tower";
        eSpecies[eSpecies["Drone"] = 10] = "Drone";
        eSpecies[eSpecies["Balloon"] = 11] = "Balloon";
        eSpecies[eSpecies["Paraglider"] = 12] = "Paraglider";
    })(eSpecies = READSB.eSpecies || (READSB.eSpecies = {}));
    let eWakeTurbulenceCategory;
    (function (eWakeTurbulenceCategory) {
        eWakeTurbulenceCategory[eWakeTurbulenceCategory["None"] = 0] = "None";
        eWakeTurbulenceCategory[eWakeTurbulenceCategory["Light"] = 1] = "Light";
        eWakeTurbulenceCategory[eWakeTurbulenceCategory["Medium"] = 2] = "Medium";
        eWakeTurbulenceCategory[eWakeTurbulenceCategory["Heavy"] = 3] = "Heavy";
    })(eWakeTurbulenceCategory = READSB.eWakeTurbulenceCategory || (READSB.eWakeTurbulenceCategory = {}));
    let eEngineType;
    (function (eEngineType) {
        eEngineType[eEngineType["None"] = 0] = "None";
        eEngineType[eEngineType["Piston"] = 1] = "Piston";
        eEngineType[eEngineType["Turbo"] = 2] = "Turbo";
        eEngineType[eEngineType["Jet"] = 3] = "Jet";
        eEngineType[eEngineType["Electric"] = 4] = "Electric";
        eEngineType[eEngineType["Rocket"] = 5] = "Rocket";
    })(eEngineType = READSB.eEngineType || (READSB.eEngineType = {}));
    let eCondition;
    (function (eCondition) {
        eCondition[eCondition["Equals"] = 0] = "Equals";
        eCondition[eCondition["NotEquals"] = 1] = "NotEquals";
        eCondition[eCondition["Contains"] = 2] = "Contains";
        eCondition[eCondition["NotContains"] = 3] = "NotContains";
        eCondition[eCondition["Between"] = 4] = "Between";
        eCondition[eCondition["NotBetween"] = 5] = "NotBetween";
        eCondition[eCondition["Starts"] = 6] = "Starts";
        eCondition[eCondition["NotStarts"] = 7] = "NotStarts";
        eCondition[eCondition["Ends"] = 8] = "Ends";
        eCondition[eCondition["NotEnds"] = 9] = "NotEnds";
    })(eCondition = READSB.eCondition || (READSB.eCondition = {}));
    let eSortBy;
    (function (eSortBy) {
        eSortBy["Icao"] = "icao";
        eSortBy["Flight"] = "flight";
        eSortBy["Registration"] = "registration";
        eSortBy["Type"] = "icaotype";
        eSortBy["Squawk"] = "squawk";
        eSortBy["Altitude"] = "altitude";
        eSortBy["Speed"] = "speed";
        eSortBy["VerticalRate"] = "vert_rate";
        eSortBy["Distance"] = "sitedist";
        eSortBy["Track"] = "track";
        eSortBy["Messages"] = "msgs";
        eSortBy["Seen"] = "seen";
        eSortBy["Country"] = "country";
        eSortBy["Rssi"] = "rssi";
        eSortBy["Latitude"] = "lat";
        eSortBy["Longitude"] = "lon";
        eSortBy["CivilMil"] = "civilmil";
    })(eSortBy = READSB.eSortBy || (READSB.eSortBy = {}));
    let eSideBarVisibility;
    (function (eSideBarVisibility) {
        eSideBarVisibility[eSideBarVisibility["Unknown"] = 0] = "Unknown";
        eSideBarVisibility[eSideBarVisibility["Normal"] = 1] = "Normal";
        eSideBarVisibility[eSideBarVisibility["Expanded"] = 2] = "Expanded";
        eSideBarVisibility[eSideBarVisibility["Hidden"] = 3] = "Hidden";
    })(eSideBarVisibility = READSB.eSideBarVisibility || (READSB.eSideBarVisibility = {}));
})(READSB || (READSB = {}));
//# sourceMappingURL=enums.js.map