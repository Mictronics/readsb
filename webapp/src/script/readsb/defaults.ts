// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// default.ts: Default settings for web application on new install.
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
    /**
     * Show number of aircraft per second in page title.
     */
    export const DefaultShowAircraftCountInTitle: boolean = true;
    /**
     * Show message rate in page title.
     */
    export const DefaultShowMessageRateInTitle: boolean = false;

    /**
     * The DisplayUnits setting controls whether nautical (ft, NM, knots),
     * metric (m, km, km/h) or imperial (ft, mi, mph) units are used in the
     * plane table and in the detailed plane info. Valid values are
     * "nautical", "metric", or "imperial".
     */
    export const DefaultDisplayUnits: string = "nautical";

    /*
     * These settings are overridden by any position information
     * provided by readsb itself. All positions are in decimal
     * degrees.
     */

    /**
     * Default center of the map. Latitude.
     */
    export const DefaultCenterLat: number = 45.0;
    /**
     * Default center of the map. Longitude.
     */
    export const DefaultCenterLon: number = 9.0;
    /**
     * Map zoom level, 0 - 16, lower is further out.
     */
    export const DefaultZoomLevel: number = 7;

    /*
     * Site marker. If readsb provides a receiver location,
     * that location is used and these settings are ignored.
     */

    /**
     * Show site location.
     */
    export let DefaultShowSite: boolean = true;
    /**
     * Default site location. Latitude.
     */
    export let DefaultSiteLat: number = 45.0;
    /**
     * Default site location. Longitude.
     */
    export let DefaultSiteLon: number = 9.0;

    /* Base URL from where the database version will be pulled on application
     * startup. If a new database version is found the browsers indexed
     * aircraft database will be updated.
     * This is the base URL. Do not provide file names.
     */

    /**
     * Default URL to pull online database from webserver.
     * Set to null to pull from local webserver.
     */
    export const DefaultOnlineDatabaseUrl: string = null;
    /**
     * Uncomment to pull online database from Mictronics Github.
     * Change URL in case you maintain your own aircraft database source.
     */
    // export const DefaultOnlineDatabaseUrl: string = "https://raw.githubusercontent.com/Mictronics/readsb/master/webapp/src/";

    /**
     * Default coloring of aircraft by altitude.
     * All color values are given as Hue (0-359) / Saturation (0-100) / Lightness (0-100)
     */
    export const DefaultColorByAlt: IColorByAlt = {
        /**
         * HSL for planes with unknown altitude:
         */
        Unknown: { h: 0, s: 0, l: 40 },

        /**
         * HSL for planes that are on the ground:
         */
        Ground: { h: 120, s: 100, l: 30 },

        Air: {
            /*
             * These define altitude-to-hue mappings
             * at particular altitudes; the hue
             * for intermediate altitudes that lie
             * between the provided altitudes is linearly
             * interpolated.
             *
             * Mappings must be provided in increasing
             * order of altitude.
             *
             * Altitudes below the first entry use the
             * hue of the first entry; altitudes above
             * the last entry use the hue of the last
             * entry.
             */
            h: [
                { alt: 2000, val: 20 }, // orange
                { alt: 10000, val: 140 }, // light green
                { alt: 40000, val: 300 },
            ], // magenta
            l: 50,
            s: 85,
        },

        /**
         * Changes added to the color of the currently selected plane.
         */
        Selected: { h: 0, s: -10, l: +20 },

        /**
         * Changes added to the color of planes that have stale position info.
         */
        Stale: { h: 0, s: -10, l: +30 },

        /**
         * Changes added to the color of planes that have positions from mlat.
         */
        Mlat: { h: 0, s: -10, l: -10 },

        /**
         * Indicate that these colors are defined by default.
         */
        IsDefault: true,
    };

    /**
     * Default coloring of aircraft by altitude for a monochrome display.
     */
    // export const ColorByAlt: IColorByAlt ColorByAlt = {
    //         unknown :  { h: 0, s: 0, l: 40 },
    //         ground  :  { h: 0, s: 0, l: 30 },
    //         air :      { h: [ { alt: 0, val: 0 } ], s: 0, l: 50 },
    //         selected : { h: 0, s: 0, l: +30 },
    //         stale :    { h: 0, s: 0, l: +30 },
    //         mlat :     { h: 0, s: 0, l: -10 }
    // };

    /**
     * Outline color for aircraft icons with an ADS-B position.
     */
    export const DefaultOutlineADSBColor: string = "#000000";

    /**
     * Outline color for aircraft icons with a mlat position.
     */
    export const DefaultOutlineMlatColor: string = "#4040FF";

    /**
     * Show site circles. Only when site location is shown also.
     */
    export const DefaultShowSiteCircles: boolean = true;

    /**
     * Site circles distances.
     * In miles, nautical miles, or km (depending settings value 'DisplayUnits')
     */
    export const DefaultSiteCirclesDistances: number[] = [100, 150, 200];

    /**
     * Controls page title, righthand pane when nothing is selected
     */
    export const DefaultPageName: string = "readsb radar";

    /**
     * Show country flags depending on ICAO addresses.
     */
    export const DefaultShowFlags: boolean = true;

    /**
     * Path to country flags (can be a relative or absolute URL; include a trailing /)
     */
    export const DefaultFlagPath: string = "images/flags-tiny/";

    /**
     * Set to true to enable the ChartBundle base layers (US coverage only)
     */
    export const DefaultShowChartBundleLayers: boolean = true;

    /**
     * Provide a Bing Maps API key here to enable the Bing imagery layer.
     * You can obtain a free key (with usage limits) at
     * https://www.bingmapsportal.com/ (you need a "basic key")
     */
    export const DefaultBingMapsAPIKey: string = null;

    /**
     * Provide a SkyVector API key here to enable the SkyVector tile layer.
     */
    export const DefaultSkyVectorAPIKey: string = null;

    /**
     * Show additional map layers.
     */
    export const DefaultShowAdditionalMaps: boolean = true;
    /**
     * Show hover labels on aircraft marker.
     */
    export const DefaultShowHoverOverLabels: boolean = true;
    /**
     * Show US map layers.
     */
    export const DefaultShowUSLayers: boolean = true;
    /**
     * Show European map layers.
     */
    export const DefaultShowEULayers: boolean = true;
    /**
     * Show additional data in aircraft hower label.
     */
    export const DefaultShowAdditionalData: boolean = true;
}
