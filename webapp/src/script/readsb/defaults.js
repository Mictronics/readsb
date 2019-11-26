"use strict";
var READSB;
(function (READSB) {
    READSB.DefaultShowAircraftCountInTitle = true;
    READSB.DefaultShowMessageRateInTitle = false;
    READSB.DefaultDisplayUnits = "nautical";
    READSB.DefaultCenterLat = 45.0;
    READSB.DefaultCenterLon = 9.0;
    READSB.DefaultZoomLevel = 7;
    READSB.DefaultShowSite = true;
    READSB.DefaultSiteLat = 45.0;
    READSB.DefaultSiteLon = 9.0;
    READSB.DefaultOnlineDatabaseUrl = null;
    READSB.DefaultColorByAlt = {
        Unknown: { h: 0, s: 0, l: 40 },
        Ground: { h: 120, s: 100, l: 30 },
        Air: {
            h: [
                { alt: 2000, val: 20 },
                { alt: 10000, val: 140 },
                { alt: 40000, val: 300 },
            ],
            l: 50,
            s: 85,
        },
        Selected: { h: 0, s: -10, l: +20 },
        Stale: { h: 0, s: -10, l: +30 },
        Mlat: { h: 0, s: -10, l: -10 },
        IsDefault: true,
    };
    READSB.DefaultOutlineADSBColor = "#000000";
    READSB.DefaultOutlineMlatColor = "#4040FF";
    READSB.DefaultShowSiteCircles = true;
    READSB.DefaultSiteCirclesDistances = [100, 150, 200];
    READSB.DefaultPageName = "readsb radar";
    READSB.DefaultShowFlags = true;
    READSB.DefaultFlagPath = "images/flags-tiny/";
    READSB.DefaultShowChartBundleLayers = true;
    READSB.DefaultBingMapsAPIKey = null;
    READSB.DefaultSkyVectorAPIKey = null;
    READSB.DefaultShowAdditionalMaps = true;
    READSB.DefaultShowHoverOverLabels = true;
    READSB.DefaultShowUSLayers = true;
    READSB.DefaultShowEULayers = true;
    READSB.DefaultShowAdditionalData = true;
})(READSB || (READSB = {}));
//# sourceMappingURL=defaults.js.map