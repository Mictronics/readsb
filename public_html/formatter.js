// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// formatter.js: Format functions to convert values into formated strings.
//
// Copyright (c) 2019 Michael Wolf <michael@mictronics.de>
//
// This code is based on a detached fork of dump1090-fa.
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
// Declare ICAO registration address ranges and Country

const Nbsp = '\u00a0';
const Degrees = '\u00b0';
const UpTriangle = '\u25b2'; // U+25B2 BLACK UP-POINTING TRIANGLE
const DownTriangle = '\u25bc'; // U+25BC BLACK DOWN-POINTING TRIANGLE

const TrackDirections = [
  'North',
  'NE',
  'East',
  'SE',
  'South',
  'SW',
  'West',
  'NW',
];

const UnitLabels = {
  altitude: { metric: 'm', imperial: 'ft', nautical: 'ft' },
  speed: { metric: 'km/h', imperial: 'mph', nautical: 'kt' },
  distance: { metric: 'km', imperial: 'mi', nautical: 'NM' },
  verticalRate: { metric: 'm/s', imperial: 'ft/min', nautical: 'ft/min' },
  distanceShort: { metric: 'm', imperial: 'ft', nautical: 'm' },
};

// formatting helpers

export function GetUnitLabel(quantity, systemOfMeasurement) {
  const labels = UnitLabels[quantity];
  if (labels !== undefined && labels[systemOfMeasurement] !== undefined) {
    return labels[systemOfMeasurement];
  }
  return '';
}

// track in degrees (0..359)
export function FormatTrackBrief(track) {
  if (track === null) {
    return '';
  }

  return Math.round(track) + Degrees;
}

// track in degrees (0..359)
export function FormatTrackLong(track) {
  if (track === null) {
    return 'n/a';
  }

  const trackDir = Math.floor((360 + (track % 360) + 22.5) / 45) % 8;
  return `${Math.round(track) + Degrees + Nbsp}(${TrackDirections[trackDir]})`;
}

// alt in feet
export function ConvertAltitude(alt, displayUnits) {
  if (displayUnits === 'metric') {
    return alt / 3.2808; // feet to meters
  }

  return alt;
}

// alt in feet
export function FormatAltitudeBrief(alt, vr, displayUnits) {
  let altText;

  altText = Math.round(ConvertAltitude(alt, displayUnits)).toLocaleString() + Nbsp;

  altText = Math.round(ConvertAltitude(alt, displayUnits)) + Nbsp;

  // Vertical Rate Triangle
  let verticalRateTriangle = '<span class="verticalRateTriangle">';
  if (vr > 128) {
    verticalRateTriangle += UpTriangle;
  } else if (vr < -128) {
    verticalRateTriangle += DownTriangle;
  } else {
    verticalRateTriangle += Nbsp;
  }
  verticalRateTriangle += '</span>';

  return altText + verticalRateTriangle;
}

// alt in feet
export function FormatAltitudeLong(alt, vr, displayUnits) {
  let altText = '';

  altText = Math.round(ConvertAltitude(alt, displayUnits)).toLocaleString()
    + Nbsp
    + GetUnitLabel('altitude', displayUnits);

  altText = Math.round(ConvertAltitude(alt, displayUnits))
    + Nbsp
    + GetUnitLabel('altitude', displayUnits);

  if (vr > 128) {
    return UpTriangle + Nbsp + altText;
  }
  if (vr < -128) {
    return DownTriangle + Nbsp + altText;
  }
  return altText;
}

// speed in knots
export function ConvertSpeed(speed, displayUnits) {
  if (displayUnits === 'metric') {
    return speed * 1.852; // knots to kilometers per hour
  }
  if (displayUnits === 'imperial') {
    return speed * 1.151; // knots to miles per hour
  }

  return speed;
}

// speed in knots
export function FormatSpeedBrief(speed, displayUnits) {
  if (speed === null) {
    return '';
  }

  return Math.round(ConvertSpeed(speed, displayUnits));
}

// speed in knots
export function FormatSpeedLong(speed, displayUnits) {
  if (speed === null) {
    return 'n/a';
  }

  const speedText = Math.round(ConvertSpeed(speed, displayUnits))
    + Nbsp
    + GetUnitLabel('speed', displayUnits);

  return speedText;
}

// dist in meters
export function ConvertDistance(dist, displayUnits) {
  if (displayUnits === 'metric') {
    return dist / 1000; // meters to kilometers
  }
  if (displayUnits === 'imperial') {
    return dist / 1609; // meters to miles
  }
  return dist / 1852; // meters to nautical miles
}

// dist in meters
export function FormatDistanceBrief(dist, displayUnits) {
  if (dist === null) {
    return '';
  }

  return ConvertDistance(dist, displayUnits).toFixed(1);
}

// dist in meters
export function FormatDistanceLong(dist, displayUnits, fixed) {
  if (dist === null) {
    return 'n/a';
  }

  if (typeof fixed === 'undefined') {
    fixed = 1;
  }

  const distText = ConvertDistance(dist, displayUnits).toFixed(fixed)
    + Nbsp
    + GetUnitLabel('distance', displayUnits);

  return distText;
}

// dist in meters
// converts meters to feet or just returns meters
export function ConvertDistanceShort(dist, displayUnits) {
  if (displayUnits === 'imperial') {
    return dist / 0.3048; // meters to feet
  }
  return dist; // just meters
}

export function FormatDistanceShort(dist, displayUnits) {
  if (dist === null) {
    return 'n/a';
  }

  const distText = Math.round(ConvertDistanceShort(dist, displayUnits))
    + Nbsp
    + GetUnitLabel('distanceShort', displayUnits);

  return distText;
}

// rate in ft/min
export function ConvertVerticalRate(rate, displayUnits) {
  if (displayUnits === 'metric') {
    return rate / 196.85; // ft/min to m/s
  }

  return rate;
}

// rate in ft/min
export function FormatVerticalRateBrief(rate, displayUnits) {
  if (rate === null || rate === undefined) {
    return '';
  }

  return ConvertVerticalRate(rate, displayUnits).toFixed(
    displayUnits === 'metric' ? 1 : 0,
  );
}

// rate in ft/min
export function FormatVerticalRateLong(rate, displayUnits) {
  if (rate === null || rate === undefined) {
    return 'n/a';
  }

  const rateText = ConvertVerticalRate(rate, displayUnits).toFixed(
    displayUnits === 'metric' ? 1 : 0,
  )
    + Nbsp
    + GetUnitLabel('verticalRate', displayUnits);

  return rateText;
}

// p is a [lon, lat] coordinate
export function FormatLatLong(p) {
  return `${p[1].toFixed(3) + Degrees},${Nbsp}${p[0].toFixed(3)}${Degrees}`;
}

export function FormatDataSource(source) {
  switch (source) {
    case 'mlat':
      return 'MLAT';
    case 'adsb_icao':
    case 'adsb_other':
      return 'ADS-B';
    case 'adsb_icao_nt':
      return 'ADS-B (non transponder)';
    case 'adsr_icao':
    case 'adsr_other':
      return 'ADS-R';
    case 'tisb_icao':
    case 'tisb_trackfile':
    case 'tisb_other':
      return 'TIS-B';
    case 'mode_s':
      return 'Mode S';
    case 'mode_ac':
      return 'Mode A/C';
    default:
      return 'n/a';
  }
}

export function FormatNacP(value) {
  switch (value) {
    case 0:
      return 'EPU ≥ 18.52 km';
    case 1:
      return 'EPU < 18.52 km';
    case 2:
      return 'EPU < 7.408 km';
    case 3:
      return 'EPU < 3.704 km';
    case 4:
      return 'EPU < 1852 m';
    case 5:
      return 'EPU < 926 m';
    case 6:
      return 'EPU < 555.6 m';
    case 7:
      return 'EPU < 185.2 m';
    case 8:
      return 'EPU < 92.6 m';
    case 9:
      return 'EPU < 30 m';
    case 10:
      return 'EPU < 10 m';
    case 11:
      return 'EPU < 3 m';
    default:
      return 'n/a';
  }
}

export function FormatNacV(value) {
  switch (value) {
    case 0:
      return 'Unknown or  10 m/s';
    case 1:
      return '< 10 m/s';
    case 2:
      return '< 3 m/s';
    case 3:
      return '< 1 m/s';
    case 4:
      return '< 0.3 m/s';
    default:
      return 'n/a';
  }
}
