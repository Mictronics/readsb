// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// filters.js: filter aircraft by metadata
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

import { GetSetting, PutSetting, DeleteSetting } from './database.js';
import FindIcaoRange from './flags.js';
import { ConvertAltitude, ConvertDistance, GetUnitLabel } from './formatter.js';
import { MapSettings, RefreshTableInfo, RefreshSelected } from './script.js';

const AircraftFilterType = Object.freeze({
  Altitude: 0,
  Ident: 1,
  Country: 2,
  Distance: 3,
  HideNoPosition: 4,
  Icao: 5,
  IsMilitary: 6,
  TypeIcao: 7,
  Operator: 8,
  OperatorCode: 9,
  Registration: 10,
  Species: 11,
  Squawk: 12,
  UserInterested: 13,
  Wtc: 14,
  EngineType: 15,
});

const FilterMatchType = Object.freeze({
  OnOff: 0,
  TextMatch: 1,
  NumberRange: 2,
  EnumMatch: 3,
});

const InputWidth = Object.freeze({
  Auto: '',
  OneChar: 'oneChar',
  ThreeChar: 'threeChar',
  SixChar: 'sixChar',
  EightChar: 'eightChar',
  NineChar: 'nineChar',
  Long: 'wide',
});

const Species = Object.freeze({
  None: 0,
  LandPlane: 1,
  SeaPlane: 2,
  Amphibian: 3,
  Helicopter: 4,
  Gyrocopter: 5,
  Tiltwing: 6,
  Tiltrotor: 7,
  GroundVehicle: 8,
  Tower: 9,
  Drone: 10,
  Balloon: 11,
  Paraglider: 12,
});

const WakeTurbulenceCategory = Object.freeze({
  None: 0,
  Light: 1,
  Medium: 2,
  Heavy: 3,
});

const EngineType = Object.freeze({
  None: 0,
  Piston: 1,
  Turbo: 2,
  Jet: 3,
  Electric: 4,
  Rocket: 5,
});

const Condition = Object.freeze({
  Equals: 0,
  NotEquals: 1,
  Contains: 2,
  NotContains: 3,
  Between: 4,
  NotBetween: 5,
  Starts: 6,
  NotStarts: 7,
  Ends: 8,
  NotEnds: 9,
});

const ConditionList = [
  { Value: Condition.Equals, Text: 'equals' },
  { Value: Condition.NotEquals, Text: 'not equals' },
  { Value: Condition.Contains, Text: 'contains' },
  { Value: Condition.NotContains, Text: 'not contains' },
  { Value: Condition.Between, Text: 'is between' },
  { Value: Condition.NotBetween, Text: 'is not between' },
  { Value: Condition.Starts, Text: 'starts with' },
  { Value: Condition.NotStarts, Text: 'starts not with' },
  { Value: Condition.Ends, Text: 'ends with' },
  { Value: Condition.NotEnds, Text: 'ends not with' },
];

/* Validate a number from user input */
const ValidateNumber = (Value, min, max) => {
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

/* Filter a text input depending on condition */
function FilterText(haystack, needle, condition) {
  if (needle === undefined) {
    return false;
  }
  if (haystack === null) {
    return true;
  }
  const h = haystack.trim().toUpperCase();
  const n = needle.trim().toUpperCase();
  switch (condition) {
    case Condition.Equals:
      if (h === n) {
        return false;
      }
      break;
    case Condition.NotEquals:
      if (h !== n) {
        return false;
      }
      break;
    case Condition.Contains:
      if (h.search(n) !== -1) {
        return false;
      }
      break;
    case Condition.NotContains:
      if (h.search(n) === -1) {
        return false;
      }
      break;
    case Condition.Starts:
      return !h.startsWith(n);
    case Condition.NotStarts:
      return h.startsWith(n);
    case Condition.Ends:
      return !h.endsWith(n);
    case Condition.NotEnds:
      return h.endsWith(n);
    default:
      break;
  }
  return true;
}

class AltitudeFilter {
  constructor() {
    this.Type = AircraftFilterType.Altitude;
    this.MatchType = FilterMatchType.NumberRange;
    this.Label = 'Altitude';
    this.MinValue = -2000;
    this.MaxValue = 100000;
    this.DecimalPlaces = 0;
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Between;
    this.FilterConditions = [Condition.Between, Condition.NotBetween];
    this.IsActive = false;
    this.Value1 = 0;
    this.Value2 = 0;
  }

  IsFiltered(aircraft) {
    if (
      this.IsActive
      && this.Value1 !== undefined
      && this.Value2 !== undefined
    ) {
      if (aircraft.altitude === null) {
        return true;
      }
      let f = true;
      const a = ConvertAltitude(aircraft.altitude, MapSettings.DisplayUnits);
      if (a >= this.Value1 && a <= this.Value2) {
        f = false;
      }
      if (this.Condition === Condition.NotBetween) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
    this.Value2 = ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
  }

  ConvertUnit(displayUnits) {
    if (this.Value1 !== undefined && this.Value2 !== undefined) {
      this.Value1 = ConvertAltitude(this.Value1, displayUnits);
      this.Value2 = ConvertAltitude(this.Value2, displayUnits);
    }
  }
}

class IdentFilter {
  constructor() {
    this.Type = AircraftFilterType.Ident;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Ident';
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      return FilterText(aircraft.flight, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    const s = this.Value1.trim()
      .substr(0, 7)
      .toUpperCase();
    this.Value1 = s.replace(/[^0-9A-Z]/, '');
  }
}

class CountryFilter {
  constructor() {
    this.Type = AircraftFilterType.Country;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Country';
    this.InputWidth = InputWidth.Long;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && aircraft.icao !== null && this.Value1 !== undefined) {
      const f = FindIcaoRange(aircraft.icao);
      return FilterText(f.Country, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    this.Value1 = this.Value1.trim().substr(0, 30);
  }
}

class DistanceFilter {
  constructor() {
    this.Type = AircraftFilterType.Distance;
    this.MatchType = FilterMatchType.NumberRange;
    this.Label = 'Distance';
    this.MinValue = 0;
    this.MaxValue = 30000;
    this.decimalPlaces = 2;
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Between;
    this.IsActive = false;
    this.FilterConditions = [Condition.Between, Condition.NotBetween];
  }

  IsFiltered(aircraft) {
    if (
      this.IsActive
      && this.Value1 !== undefined
      && this.Value2 !== undefined
    ) {
      if (aircraft.sitedist === null) {
        return true;
      }
      let f = true;
      const s = ConvertDistance(aircraft.sitedist, MapSettings.DisplayUnits);
      if (s >= this.Value1 && s <= this.Value2) {
        f = false;
      }
      if (this.Condition === Condition.NotBetween) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
    this.Value2 = ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
  }

  ConvertUnit(displayUnits) {
    if (this.Value1 !== undefined && this.Value2 !== undefined) {
      this.Value1 = ConvertDistance(this.Value1, displayUnits);
      this.Value2 = ConvertDistance(this.Value2, displayUnits);
    }
  }
}

class MilitaryFilter {
  constructor() {
    this.Type = AircraftFilterType.IsMilitary;
    this.MatchType = FilterMatchType.OnOff;
    this.Label = 'Is Military';
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1) {
      if (aircraft.civilmil === null) {
        return true;
      }
      return !aircraft.civilmil;
    }
    return false;
  }

  Validate() {
    return this.Value1;
  }
}

class IsInterestingFilter {
  constructor() {
    this.Type = AircraftFilterType.UserInterested;
    this.MatchType = FilterMatchType.OnOff;
    this.Label = 'Interesting';
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1) {
      if (aircraft.interesting === null) {
        return true;
      }
      return !aircraft.interesting;
    }
    return false;
  }

  Validate() {
    return this.Value1;
  }
}

class HideNoPositionFilter {
  constructor() {
    this.Type = AircraftFilterType.HideNoPosition;
    this.MatchType = FilterMatchType.OnOff;
    this.Label = 'Hide No Position';
    this.IsActive = false;
    this.Condition = Condition.Equals;
    this.FilterConditions = [];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && aircraft.position === null && this.Value1) {
      return true;
    }
    return false;
  }

  Validate() {
    return this.Value1;
  }
}

class IcaoFilter {
  constructor() {
    this.Type = AircraftFilterType.Icao;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Icao';
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      return FilterText(aircraft.icao, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    const s = this.Value1.trim()
      .substr(0, 6)
      .toUpperCase();
    this.Value1 = s.replace(/[^0-9A-F]/, '');
  }
}

class TypeIcaoFilter {
  constructor() {
    this.Type = AircraftFilterType.TypeIcao;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Type Icao';
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      return FilterText(aircraft.icao, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    const s = this.Value1.trim()
      .substr(0, 4)
      .toUpperCase();
    this.Value1 = s.replace(/[^0-9A-Z]/, '');
  }
}

class OperatorFilter {
  constructor() {
    this.Type = AircraftFilterType.Operator;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Operator';
    this.InputWidth = InputWidth.Long;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      return FilterText(aircraft.operator, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    this.Value1 = this.Value1.trim().substr(0, 30);
  }
}

class OperatorCodeFilter {
  constructor() {
    this.Type = AircraftFilterType.OperatorCode;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Operator Code';
    this.InputWidth = InputWidth.ThreeChar;
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [Condition.Equals, Condition.NotEquals];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      if (aircraft.flight === null) {
        return true;
      }
      const oc = aircraft.flight.substr(0, 3).toUpperCase();
      let f = true;
      if (oc === this.Value1) {
        f = false;
      }
      if (this.Condition === Condition.NotEquals) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    const s = this.Value1.trim()
      .substr(0, 3)
      .toUpperCase();
    this.Value1 = s.replace(/[^0-9A-Z]/, '');
  }
}

class RegistrationFilter {
  constructor() {
    this.Type = AircraftFilterType.Registration;
    this.MatchType = FilterMatchType.TextMatch;
    this.Label = 'Registration';
    this.InputWidth = InputWidth.NineChar;
    this.Condition = Condition.Contains;
    this.IsActive = false;
    this.FilterConditions = [
      Condition.Equals,
      Condition.NotEquals,
      Condition.Contains,
      Condition.NotContains,
      Condition.Starts,
      Condition.NotStarts,
      Condition.Ends,
      Condition.NotEnds,
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && this.Value1 !== undefined) {
      let r = aircraft.registration;
      if (r !== null && r.startsWith('#')) {
        r = r.substr(2); // Remove DB entry marker if exists
      }
      return FilterText(r, this.Value1, this.Condition);
    }
    return false;
  }

  Validate() {
    const s = this.Value1.trim()
      .substr(0, 10)
      .toUpperCase();
    this.Value1 = s.replace(/[^0-9A-Z-+]/, '');
  }
}

class SpeciesFilter {
  constructor() {
    this.Type = AircraftFilterType.Species;
    this.MatchType = FilterMatchType.EnumMatch;
    this.Label = 'Species';
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [Condition.Equals, Condition.NotEquals];
    this.EnumValues = [
      { Value: Species.None, Text: 'None' },
      { Value: Species.LandPlane, Text: 'Land Plane' },
      { Value: Species.SeaPlane, Text: 'Sea Plane' },
      { Value: Species.Amphibian, Text: 'Amphibian' },
      { Value: Species.Helicopter, Text: 'Helicopter' },
      { Value: Species.Gyrocopter, Text: 'Gyrocopter' },
      { Value: Species.Tiltwing, Text: 'Tiltwing' },
      { Value: Species.Tiltwing, Text: 'Tiltrotor' },
      { Value: Species.Drone, Text: 'Drone' },
      { Value: Species.Balloon, Text: 'Ballon' },
      { Value: Species.Paraglider, Text: 'Paraglider' },
      { Value: Species.GroundVehicle, Text: 'Ground Vehicle' },
      { Value: Species.Tower, Text: 'Radio Tower' },
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && aircraft.species !== null && this.Value1) {
      let f = true;
      const s = aircraft.species.substr(0, 1);
      switch (this.Value1) {
        case Species.LandPlane:
          if (s === 'L') {
            f = false;
          }
          break;
        case Species.SeaPlane:
          if (s === 'S') {
            f = false;
          }
          break;
        case Species.Amphibian:
          if (s === 'A') {
            f = false;
          }
          break;
        case Species.Helicopter:
          if (s === 'H') {
            f = false;
          }
          break;
        case Species.Gyrocopter:
          if (s === 'G') {
            f = false;
          }
          break;
        case Species.Tiltwing:
          if (s === 'W') {
            f = false;
          }
          break;
        case Species.Tiltrotor:
          if (s === 'R') {
            f = false;
          }
          break;
        case Species.GroundVehicle:
          if (s === 'V') {
            f = false;
          }
          break;
        case Species.Tower:
          if (s === 'T') {
            f = false;
          }
          break;
        case Species.Drone:
          if (s === 'D') {
            f = false;
          }
          break;
        case Species.Balloon:
          if (s === 'B') {
            f = false;
          }
          break;
        case Species.Paraglider:
          if (s === 'P') {
            f = false;
          }
          break;
        default:
          break;
      }
      if (this.Condition === Condition.NotEquals) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = Number(this.Value1);
    if (this.Value1 < Species.None) {
      this.Value1 = Species.None;
    }
    if (this.Value1 > Species.Paraglider) {
      this.Value1 = Species.Paraglider;
    }
  }
}

class SquawkFilter {
  constructor() {
    this.Type = AircraftFilterType.Squawk;
    this.MatchType = FilterMatchType.NumberRange;
    this.Label = 'Squawk';
    this.MinValue = 0;
    this.MaxValue = 7777;
    this.DecimalPlaces = 0;
    this.InputWidth = InputWidth.SixChar;
    this.Condition = Condition.Between;
    this.IsActive = false;
    this.FilterConditions = [Condition.Between, Condition.NotBetween];
  }

  IsFiltered(aircraft) {
    if (
      this.IsActive
      && this.Value1 !== undefined
      && this.Value2 !== undefined
    ) {
      if (aircraft.squawk === null) {
        return true;
      }
      let f = true;
      const s = Number(aircraft.squawk);
      if (s >= this.Value1 && s <= this.Value2) {
        f = false;
      }
      if (this.Condition === Condition.NotBetween) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = ValidateNumber(this.Value1, this.MinValue, this.MaxValue);
    this.Value2 = ValidateNumber(this.Value2, this.MinValue, this.MaxValue);
  }
}

class WtcFilter {
  constructor() {
    this.Type = AircraftFilterType.Wtc;
    this.MatchType = FilterMatchType.EnumMatch;
    this.Label = 'Wake Turbulence';
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [Condition.Equals, Condition.NotEquals];
    this.EnumValues = [
      { Value: WakeTurbulenceCategory.None, Text: 'None' },
      { Value: WakeTurbulenceCategory.Light, Text: 'Light' },
      { Value: WakeTurbulenceCategory.Medium, Text: 'Medium' },
      { Value: WakeTurbulenceCategory.Heavy, Text: 'Heavy' },
    ];
  }

  IsFiltered(aircraft) {
    if (this.IsActive && aircraft.wtc !== null && this.Value1) {
      let f = true;
      switch (this.Value1) {
        case WakeTurbulenceCategory.Light:
          if (aircraft.wtc === 'L') {
            f = false;
          }
          break;
        case WakeTurbulenceCategory.Medium:
          if (aircraft.wtc === 'M') {
            f = false;
          }
          break;
        case WakeTurbulenceCategory.Heavy:
          if (aircraft.wtc === 'H') {
            f = false;
          }
          break;
        default:
          f = false;
          break;
      }
      if (this.Condition === Condition.NotEquals) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = Number(this.Value1);
    if (this.Value1 < WakeTurbulenceCategory.None) {
      this.Value1 = WakeTurbulenceCategory.None;
    }
    if (this.Value1 > WakeTurbulenceCategory.Heavy) {
      this.Value1 = WakeTurbulenceCategory.Heavy;
    }
  }
}

class EngineTypeFilter {
  constructor() {
    this.Type = AircraftFilterType.EngineType;
    this.MatchType = FilterMatchType.EnumMatch;
    this.Label = 'Engine Type';
    this.Condition = Condition.Equals;
    this.IsActive = false;
    this.FilterConditions = [Condition.Equals, Condition.NotEquals];
    this.EnumValues = [
      { Value: EngineType.None, Text: 'None' },
      { Value: EngineType.Piston, Text: 'Piston' },
      { Value: EngineType.Turbo, Text: 'Turboshaft' },
      { Value: EngineType.Jet, Text: 'Jet' },
      { Value: EngineType.Electric, Text: 'Electric' },
      { Value: EngineType.Rocket, Text: 'Rocket' },
    ];
  }

  IsFiltered(aircraft) {
    if (
      this.IsActive
      && aircraft.species !== null
      && Number.isInteger(this.Value1)
    ) {
      let f = true;
      const s = aircraft.species.substr(2, 1);
      switch (this.Value1) {
        case EngineType.Piston:
          if (s === 'P') {
            f = false;
          }
          break;
        case EngineType.Turbo:
          if (s === 'T') {
            f = false;
          }
          break;
        case EngineType.Jet:
          if (s === 'J') {
            f = false;
          }
          break;
        case EngineType.Electric:
          if (s === 'E') {
            f = false;
          }
          break;
        case EngineType.Rocket:
          if (s === 'R') {
            f = false;
          }
          break;
        case EngineType.None:
          if (s === '-') {
            f = false;
          }
          break;
        default:
          f = true;
          break;
      }
      if (this.Condition === Condition.NotEquals) {
        f = !f;
      }
      return f;
    }
    return false;
  }

  Validate() {
    this.Value1 = Number(this.Value1);
    if (this.Value1 < EngineType.None) {
      this.Value1 = EngineType.None;
    }
    if (this.Value1 > EngineType.Rocket) {
      this.Value1 = EngineType.Rocket;
    }
  }
}

let isFilterEnabled = false;
export const IsFilterEnabled = () => isFilterEnabled;
let isHighlightEnabled = false;
export const IsHighlightEnabled = () => isHighlightEnabled;

export const AircraftFilterHandlers = [];
AircraftFilterHandlers[AircraftFilterType.Altitude] = new AltitudeFilter();
AircraftFilterHandlers[AircraftFilterType.Ident] = new IdentFilter();
AircraftFilterHandlers[AircraftFilterType.Country] = new CountryFilter();
AircraftFilterHandlers[AircraftFilterType.Distance] = new DistanceFilter();
AircraftFilterHandlers[AircraftFilterType.IsMilitary] = new MilitaryFilter();
AircraftFilterHandlers[
  AircraftFilterType.UserInterested
] = new IsInterestingFilter();
AircraftFilterHandlers[
  AircraftFilterType.HideNoPosition
] = new HideNoPositionFilter();
AircraftFilterHandlers[AircraftFilterType.Icao] = new IcaoFilter();
AircraftFilterHandlers[AircraftFilterType.TypeIcao] = new TypeIcaoFilter();
AircraftFilterHandlers[AircraftFilterType.Operator] = new OperatorFilter();
AircraftFilterHandlers[
  AircraftFilterType.OperatorCode
] = new OperatorCodeFilter();
AircraftFilterHandlers[
  AircraftFilterType.Registration
] = new RegistrationFilter();
AircraftFilterHandlers[AircraftFilterType.Species] = new SpeciesFilter();
AircraftFilterHandlers[AircraftFilterType.Squawk] = new SquawkFilter();
AircraftFilterHandlers[AircraftFilterType.Wtc] = new WtcFilter();
AircraftFilterHandlers[AircraftFilterType.EngineType] = new EngineTypeFilter();

function OnEnableFilterChanged() {
  isFilterEnabled = $(this).prop('checked');
  PutSetting('FilterIsEnabled', isFilterEnabled);
  // Refresh screen
  RefreshTableInfo();
  RefreshSelected();
}

function OnEnableHighlightChanged() {
  isHighlightEnabled = $(this).prop('checked');
  PutSetting('FilterIsHighlight', isHighlightEnabled);
  // Refresh screen
  RefreshTableInfo();
  RefreshSelected();
}

/* Prevent adding a filter that is already in the list */
function OnFilterSelectorClose(e) {
  /* Each filter can be added only once */
  const filterHandler = AircraftFilterHandlers[e.target.value];
  if (filterHandler.IsActive === true) {
    $('#filter_add_button').button('option', 'disabled', true);
  } else {
    $('#filter_add_button').button('option', 'disabled', false);
  }
}

/* Remove filter from list */
function OnFilterRemove(e) {
  /* Enable filter again when removed from list */
  const v = Number.parseInt(this.value, 10);
  AircraftFilterHandlers[v].IsActive = false;
  if ($('#filter_selector').val() === v) {
    $('#filter_add_button').button('option', 'disabled', false);
  }
  this.parentNode.remove();
  DeleteSetting(Object.keys(AircraftFilterType)[v]);
  // Refresh screen
  RefreshTableInfo();
  RefreshSelected();
}

/* Validate inputs and update filter list on user input */
function OnFilterChange(e) {
  /* Check validity of filter values and save them */
  const { id } = e.target;
  const filterHandler = AircraftFilterHandlers[e.target.parentNode.lastChild.value];

  switch (id) {
    case 'filter_condition':
      filterHandler.Condition = Number(e.target.value);
      break;
    case 'input_checked':
      filterHandler.Value1 = e.target.checked;
      filterHandler.Validate();
      e.target.checked = filterHandler.Value1;
      break;
    case 'input_value1':
      filterHandler.Value1 = e.target.value;
      filterHandler.Validate();
      e.target.value = filterHandler.Value1;
      break;
    case 'input_value2':
      filterHandler.Value2 = e.target.value;
      filterHandler.Validate();
      e.target.value = filterHandler.Value2;
      break;
    default:
      break;
  }

  /* Save filter settings to indexedDB */
  if (filterHandler !== undefined) {
    const f = {
      key: filterHandler.Type,
      IsActive: filterHandler.IsActive,
      Condition: filterHandler.Condition,
      Value1: filterHandler.Value1,
      Value2: filterHandler.Value2,
    };
    PutSetting(Object.keys(AircraftFilterType)[filterHandler.Type], f);
  }
  // Refresh screen
  RefreshTableInfo();
  RefreshSelected();
}

/* Refresh filter list on display units change */
export function RefreshFilterList() {
  $('#filter_list li').each(() => {
    $(this)
      .children('#alt_unit')
      .text(GetUnitLabel('altitude', MapSettings.DisplayUnits));
    $(this)
      .children('#dist_unit')
      .text(GetUnitLabel('distance', MapSettings.DisplayUnits));
    const f = $(this)
      .children(':button')
      .val();
    if (
      f === AircraftFilterType.Altitude
      || f === AircraftFilterType.Distance
    ) {
      const filterHandler = AircraftFilterHandlers[f];
      $(this)
        .children('#input_value1')
        .val(filterHandler.Value1.toFixed(filterHandler.DecimalPlaces));
      $(this)
        .children('#input_value2')
        .val(filterHandler.Value2.toFixed(filterHandler.DecimalPlaces));
    }
  });
}

/* Add new filter entry to the list */
function AddFilterListEntry(key, condition, v1, v2) {
  let i;
  let c;
  const filterHandler = AircraftFilterHandlers[key];
  $('#filter_list').append('<li></li>');
  const filterListEntry = $('#filter_list li:last-of-type');

  filterListEntry.append(`<span class="short">${filterHandler.Label}</span>`);
  /* Create condition list */
  let l = filterHandler.FilterConditions.length;
  if (l > 0) {
    filterListEntry.append('<select id="filter_condition"></select>');
    c = filterListEntry.children('select:first-of-type');
    for (i = 0; i < l; i += 1) {
      const x = filterHandler.FilterConditions[i];
      c.append(
        `<option value="${ConditionList[x].Value}">${
          ConditionList[x].Text
        }</option>`,
      );
    }
    if (condition !== null) c.val(condition);
    else c.val(filterHandler.Condition);
  }

  /* Create input mask depending on filter type */
  switch (filterHandler.MatchType) {
    case FilterMatchType.OnOff:
      if (v1 === true) v1 = 'checked';
      filterListEntry.append(
        `<input type="checkbox" id="input_checked" ${v1}>`,
      );
      break;
    case FilterMatchType.TextMatch:
      filterListEntry.append(
        `<input type="text" id="input_value1" class="${
          filterHandler.InputWidth
        }" value="${v1}">`,
      );
      break;
    case FilterMatchType.NumberRange:
      filterListEntry.append(
        `<input type="text" id="input_value1" class="${
          filterHandler.InputWidth
        }" value="${v1}">`,
      );
      filterListEntry.append(' and ');
      filterListEntry.append(
        `<input type="text" id="input_value2" class="${
          filterHandler.InputWidth
        }" value="${v2}">`,
      );
      if (key === AircraftFilterType.Distance) {
        filterListEntry.append(
          `<span id="dist_unit" class="unit">${GetUnitLabel(
            'distance',
            MapSettings.DisplayUnits,
          )}</span>`,
        );
      } else if (key === AircraftFilterType.Altitude) {
        filterListEntry.append(
          `<span id="alt_unit" class="unit">${GetUnitLabel(
            'altitude',
            MapSettings.DisplayUnits,
          )}</span>`,
        );
      }
      break;
    case FilterMatchType.EnumMatch:
      filterListEntry.append(
        `<select id="input_value1" value="${v1}"></select>`,
      );
      l = filterHandler.EnumValues.length;
      c = filterListEntry.children('select:last-of-type');
      for (i = 0; i < l; i += 1) {
        c.append(
          `<option value="${filterHandler.EnumValues[i].Value}">${
            filterHandler.EnumValues[i].Text
          }</option>`,
        );
      }
      if (v1 !== null) c.val(v1);
      break;
    default:
      break;
  }

  filterListEntry.append(
    `<button class="ui-button ui-widget ui-corner-all ui-button-icon-only" role="button" value="${key}">`
      + '<span class="ui-icon ui-icon-trash"></span>'
      + '</button>',
  );
  filterHandler.IsActive = true;
  $('#filter_add_button').button('option', 'disabled', true);
  $('#filter_list, input').on('change', OnFilterChange);
  $('#filter_list button:last-of-type').on('click', OnFilterRemove);
}

/* Add new filter */
function OnFilterAddClick(e) {
  const key = $('#filter_selector').val();
  AddFilterListEntry(key, null, '', '');
}

/* Initialize readsb filters */
export function InitializeFilters() {
  Object.keys(AircraftFilterHandlers).forEach((key) => {
    const m = `<option value="${key}">${
      AircraftFilterHandlers[key].Label
    }</option>\n`;
    $('#filter_selector').append(m);
  });

  $('#enable_filter_checkbox').checkboxradio({ icon: false });
  $('#enable_filter_checkbox')
    .prop('checked', isFilterEnabled)
    .checkboxradio('refresh');
  $('#enable_filter_checkbox').on('change', OnEnableFilterChanged);

  $('#enable_highlight_checkbox').checkboxradio({ icon: false });
  $('#enable_highlight_checkbox')
    .prop('checked', isHighlightEnabled)
    .checkboxradio('refresh');
  $('#enable_highlight_checkbox').on('change', OnEnableHighlightChanged);
  $('#filter_add_button').on('click', OnFilterAddClick);
  $('#filter_selector').on('selectmenuclose', OnFilterSelectorClose);
}

/* Restore filters from last session */
export function RestoreSessionFilters() {
  Object.keys(AircraftFilterType).forEach((key) => {
    GetSetting(key).done((result) => {
      const filterHandler = AircraftFilterHandlers[result.key];
      if (result.Condition !== undefined) {
        filterHandler.Condition = result.Condition;
      }
      if (result.IsActive !== undefined) {
        filterHandler.IsActive = result.IsActive;
      }
      if (result.Value1 !== undefined) {
        filterHandler.Value1 = result.Value1;
      }
      if (result.Value2 !== undefined) {
        filterHandler.Value2 = result.Value2;
      }
      AddFilterListEntry(
        result.key,
        filterHandler.Condition,
        filterHandler.Value1,
        filterHandler.Value2,
      );
    });
  });
}
