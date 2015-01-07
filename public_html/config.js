// --------------------------------------------------------
//
// This file is to configure the configurable settings.
// Load this file before script.js file at gmap.html.
//
// --------------------------------------------------------

// -- Output Settings -------------------------------------
// Show metric values
// This controls the units used in the plane table,
// and whether metric or imperial units are shown first
// in the detailed plane info.
Metric = false; // true or false

// -- Map settings ----------------------------------------
// These settings are overridden by any position information
// provided by dump1090 itself
// The Latitude and Longitude in decimal format
CONST_CENTERLAT = 45.0;
CONST_CENTERLON = 9.0;
// The google maps zoom level, 0 - 16, lower is further out
CONST_ZOOMLVL   = 7;

// -- Marker settings -------------------------------------
// The default marker color
MarkerColor	  = "rgb(127, 127, 127)";
SelectedColor = "rgb(225, 225, 225)";
StaleColor = "rgb(190, 190, 190)";

// -- Site Settings ---------------------------------------
// These settings are overridden by any position information
// provided by dump1090 itself
SiteShow    = false; // true or false
// The Latitude and Longitude in decimal format
SiteLat     = 45.0;
SiteLon     = 9.0;

SiteCircles = true; // true or false (Only shown if SiteShow is true)
// In nautical miles or km (depending settings value 'Metric')
SiteCirclesDistances = new Array(100,150,200);


// You can disable the clocks if you want here:
ShowClocks = true;
