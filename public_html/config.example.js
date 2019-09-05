// --------------------------------------------------------
// Rename to config.js prior first use.
//
// This file is to configure the configurable settings.
// Load this file before script.js.
//
// --------------------------------------------------------

// -- Title Settings --------------------------------------
// Show number of aircraft and/or messages per second in the page title
export const PlaneCountInTitle = true;
export const MessageRateInTitle = false;

// -- Output Settings -------------------------------------
// The DisplayUnits setting controls whether nautical (ft, NM, knots),
// metric (m, km, km/h) or imperial (ft, mi, mph) units are used in the
// plane table and in the detailed plane info. Valid values are
// "nautical", "metric", or "imperial".
export const DefaultDisplayUnits = 'nautical';

// -- Map settings ----------------------------------------
// These settings are overridden by any position information
// provided by readsb itself. All positions are in decimal
// degrees.

// Default center of the map.
export const DefaultCenterLat = 45.0;
export const DefaultCenterLon = 9.0;
// The google maps zoom level, 0 - 16, lower is further out
export const DefaultZoomLvl = 7;

// Center marker. If readsb provides a receiver location,
// that location is used and these settings are ignored.

export const SiteShow = false; // true to show a center marker
export const SiteLat = 45.0; // position of the marker
export const SiteLon = 9.0;
export const SiteName = 'My Radar Site'; // tooltip of the marker

// -- Online aircraft database source ---------------------
// Base URL from where the database version will be pulled on application
// startup. If a new database version is found the browsers indexed
// aircraft database will be updated.
// This is the base URL. Do not provide file names.

// Uncomment to pull online database from local readsb webserver.
export const DefaultOnlineDatabaseUrl = null;
// Uncomment to pull online database from Mictronics Github.
// Change URL in case you maintain your own aircraft database source.
// DefaultOnlineDatabaseUrl = "https://raw.githubusercontent.com/Mictronics/readsb/master/public_html/";

// -- Marker settings -------------------------------------

// These settings control the coloring of aircraft by altitude.
// All color values are given as Hue (0-359) / Saturation (0-100) / Lightness (0-100)
export const ColorByAlt = {
  // HSL for planes with unknown altitude:
  unknown: { h: 0, s: 0, l: 40 },

  // HSL for planes that are on the ground:
  ground: { h: 120, s: 100, l: 30 },

  air: {
    // These define altitude-to-hue mappings
    // at particular altitudes; the hue
    // for intermediate altitudes that lie
    // between the provided altitudes is linearly
    // interpolated.
    //
    // Mappings must be provided in increasing
    // order of altitude.
    //
    // Altitudes below the first entry use the
    // hue of the first entry; altitudes above
    // the last entry use the hue of the last
    // entry.
    h: [
      { alt: 2000, val: 20 }, // orange
      { alt: 10000, val: 140 }, // light green
      { alt: 40000, val: 300 },
    ], // magenta
    s: 85,
    l: 50,
  },

  // Changes added to the color of the currently selected plane
  selected: { h: 0, s: -10, l: +20 },

  // Changes added to the color of planes that have stale position info
  stale: { h: 0, s: -10, l: +30 },

  // Changes added to the color of planes that have positions from mlat
  mlat: { h: 0, s: -10, l: -10 },
};

// For a monochrome display try this:
// export const ColorByAlt = {
//         unknown :  { h: 0, s: 0, l: 40 },
//         ground  :  { h: 0, s: 0, l: 30 },
//         air :      { h: [ { alt: 0, val: 0 } ], s: 0, l: 50 },
//         selected : { h: 0, s: 0, l: +30 },
//         stale :    { h: 0, s: 0, l: +30 },
//         mlat :     { h: 0, s: 0, l: -10 }
// };

// Outline color for aircraft icons with an ADS-B position
export const OutlineADSBColor = '#000000';

// Outline color for aircraft icons with a mlat position
export const OutlineMlatColor = '#4040FF';

export const SiteCircles = true; // true to show circles (only shown if the center marker is shown)
// In miles, nautical miles, or km (depending settings value 'DisplayUnits')
export const SiteCirclesDistances = [100, 150, 200];

// Controls page title, righthand pane when nothing is selected
export const PageName = 'readsb radar';

// Show country flags by ICAO addresses?
export const ShowFlags = true;

// Path to country flags (can be a relative or absolute URL; include a trailing /)
export const FlagPath = 'flags-tiny/';

// Set to true to enable the ChartBundle base layers (US coverage only)
export const ChartBundleLayers = false;

// Provide a Bing Maps API key here to enable the Bing imagery layer.
// You can obtain a free key (with usage limits) at
// https://www.bingmapsportal.com/ (you need a "basic key")
//
// Be sure to quote your key:
//   BingMapsAPIKey = "your key here";
//
export const BingMapsAPIKey = null;

// Provide a SkyVector API key here to enable the SkyVector tile layer.
//
// Be sure to quote your key:
//   SkyVectorAPIKey = "your key here";
//
export const SkyVectorAPIKey = null;

// Enable/disable various map options
export const ShowMouseLatLong = true;
export const ShowAdditionalMaps = true;
export const ShowPermanentLabels = true;
export const ShowHoverOverLabels = true;
export const ShowUSLayers = false;
export const ShowEULayers = true;
export const ShowMyPreferences = true;
export const ShowAdditionalData = true;
export const ShowSimpleColours = true;
