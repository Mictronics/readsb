// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// enums.ts: Enum definition file.
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
    export enum eAircraftFilterType {
        None = -1,
        Altitude = 0,
        Country = 1,
        Distance = 2,
        EngineType = 3,
        HideNoPosition = 4,
        Icao = 5,
        Ident = 6,
        IsMilitary = 7,
        Operator = 8,
        OperatorCode = 9,
        Registration = 10,
        Species = 11,
        Squawk = 12,
        TypeIcao = 13,
        UserInterested = 14,
        Wtc = 15,
    }

    export enum eFilterMatchType {
        OnOff = 0,
        TextMatch = 1,
        NumberRange = 2,
        EnumMatch = 3,
    }

    export enum eInputWidth {
        Auto = "",
        EightChar = "eightChar",
        Long = "wide",
        NineChar = "nineChar",
        OneChar = "oneChar",
        SixChar = "sixChar",
        ThreeChar = "threeChar",
    }

    export enum eSpecies {
        None = 0,
        LandPlane = 1,
        SeaPlane = 2,
        Amphibian = 3,
        Helicopter = 4,
        Gyrocopter = 5,
        Tiltwing = 6,
        Tiltrotor = 7,
        GroundVehicle = 8,
        Tower = 9,
        Drone = 10,
        Balloon = 11,
        Paraglider = 12,
    }

    export enum eWakeTurbulenceCategory {
        None = 0,
        Light = 1,
        Medium = 2,
        Heavy = 3,
    }

    export enum eEngineType {
        None = 0,
        Piston = 1,
        Turbo = 2,
        Jet = 3,
        Electric = 4,
        Rocket = 5,
    }

    export enum eCondition {
        Equals = 0,
        NotEquals = 1,
        Contains = 2,
        NotContains = 3,
        Between = 4,
        NotBetween = 5,
        Starts = 6,
        NotStarts = 7,
        Ends = 8,
        NotEnds = 9,
    }

    export enum eSortBy {
        Icao = "icao",
        Flight = "flight",
        Registration = "registration",
        Type = "icaotype",
        Squawk = "squawk",
        Altitude = "altitude",
        Speed = "speed",
        VerticalRate = "vert_rate",
        Distance = "sitedist",
        Track = "track",
        Messages = "msgs",
        Seen = "seen",
        Country = "country",
        Rssi = "rssi",
        Latitude = "lat",
        Longitude = "lon",
        CivilMil = "civilmil",
    }

    export enum eSideBarVisibility {
        Unknown = 0,
        Normal = 1,
        Expanded = 2,
        Hidden = 3,
    }
}
