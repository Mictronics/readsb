"use strict";
var READSB;
(function (READSB) {
    class AppSettings {
        static get Settings() {
            return this.appSettings;
        }
        static set Settings(value) {
            this.appSettings = value;
        }
        static get ShowAltitudeChart() {
            return this.appSettings.ShowAltitudeChart;
        }
        static set ShowAltitudeChart(value) {
            this.appSettings.ShowAltitudeChart = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get CenterLat() {
            return this.appSettings.CenterLat;
        }
        static set CenterLat(value) {
            this.appSettings.CenterLat = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get CenterLon() {
            return this.appSettings.CenterLon;
        }
        static set CenterLon(value) {
            this.appSettings.CenterLon = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ColorsByAlt() {
            if (this.appSettings.ColorsByAlt === undefined) {
                this.appSettings.ColorsByAlt = READSB.DefaultColorByAlt;
            }
            return this.appSettings.ColorsByAlt;
        }
        static set ColorsByAlt(value) {
            this.appSettings.ColorsByAlt = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowSite() {
            return this.appSettings.ShowSite;
        }
        static set ShowSite(value) {
            this.appSettings.ShowSite = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get SiteLat() {
            return this.appSettings.SiteLat;
        }
        static set SiteLat(value) {
            this.appSettings.SiteLat = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get SiteLon() {
            return this.appSettings.SiteLon;
        }
        static set SiteLon(value) {
            this.appSettings.SiteLon = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get DisplayUnits() {
            return this.appSettings.DisplayUnits;
        }
        static set DisplayUnits(value) {
            this.appSettings.DisplayUnits = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get MapName() {
            return this.appSettings.MapName;
        }
        static set MapName(value) {
            this.appSettings.MapName = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get PageName() {
            return this.appSettings.PageName;
        }
        static set PageName(value) {
            this.appSettings.PageName = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowAdditionalData() {
            return this.appSettings.ShowAdditionalData;
        }
        static set ShowAdditionalData(value) {
            this.appSettings.ShowAdditionalData = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowFlags() {
            return this.appSettings.ShowFlags;
        }
        static set ShowFlags(value) {
            this.appSettings.ShowFlags = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowSiteCircles() {
            return this.appSettings.ShowSiteCircles;
        }
        static set ShowSiteCircles(value) {
            this.appSettings.ShowSiteCircles = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ZoomLevel() {
            if (this.appSettings.ZoomLevel === undefined) {
                this.ZoomLevel = READSB.DefaultZoomLevel;
            }
            return this.appSettings.ZoomLevel;
        }
        static set ZoomLevel(value) {
            this.appSettings.ZoomLevel = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get SiteCirclesDistances() {
            return this.appSettings.SiteCirclesDistances;
        }
        static set SiteCirclesDistances(value) {
            this.appSettings.SiteCirclesDistances = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get FlagPath() {
            if (this.appSettings.FlagPath === undefined || this.appSettings.FlagPath === null) {
                this.appSettings.FlagPath = READSB.DefaultFlagPath;
                READSB.Database.PutSetting("MapSettings", this.appSettings);
            }
            return this.appSettings.FlagPath;
        }
        static get BingMapsAPIKey() {
            return this.appSettings.BingMapsAPIKey;
        }
        static get SkyVectorAPIKey() {
            return this.appSettings.SkyVectorAPIKey;
        }
        static get OnlineDatabaseUrl() {
            return this.appSettings.OnlineDatabaseUrl;
        }
        static get OutlineADSBColor() {
            return this.appSettings.OutlineADSBColor;
        }
        static get OutlineMlatColor() {
            return this.appSettings.OutlineMlatColor;
        }
        static get ShowChartBundleLayers() {
            return this.appSettings.ShowChartBundleLayers;
        }
        static set ShowChartBundleLayers(value) {
            this.appSettings.ShowChartBundleLayers = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowAdditionalMaps() {
            return this.appSettings.ShowAdditionalMaps;
        }
        static set ShowAdditionalMaps(value) {
            this.appSettings.ShowAdditionalMaps = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowMessageRateInTitle() {
            return this.appSettings.ShowMessageRateInTitle;
        }
        static set ShowMessageRateInTitle(value) {
            this.appSettings.ShowMessageRateInTitle = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowAircraftCountInTitle() {
            return this.appSettings.ShowAircraftCountInTitle;
        }
        static set ShowAircraftCountInTitle(value) {
            this.appSettings.ShowAircraftCountInTitle = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowEULayers() {
            return this.appSettings.ShowEULayers;
        }
        static set ShowEULayers(value) {
            this.appSettings.ShowEULayers = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowUSLayers() {
            return this.appSettings.ShowUSLayers;
        }
        static set ShowUSLayers(value) {
            this.appSettings.ShowUSLayers = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get ShowHoverOverLabels() {
            return this.appSettings.ShowHoverOverLabels;
        }
        static set ShowHoverOverLabels(value) {
            this.appSettings.ShowHoverOverLabels = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get EnableFilter() {
            return this.appSettings.EnableFilter;
        }
        static set EnableFilter(value) {
            this.appSettings.EnableFilter = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get EnableHighlightFilter() {
            return this.appSettings.EnableHighlightFilter;
        }
        static set EnableHighlightFilter(value) {
            this.appSettings.EnableHighlightFilter = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get AircraftPosition() {
            return this.appSettings.AircraftPosition;
        }
        static set AircraftPosition(value) {
            this.appSettings.AircraftPosition = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get AircraftTrail() {
            return this.appSettings.AircraftTrail;
        }
        static set AircraftTrail(value) {
            this.appSettings.AircraftTrail = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get BaseLayer() {
            return this.appSettings.BaseLayer;
        }
        static set BaseLayer(value) {
            this.appSettings.BaseLayer = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get OverlayLayers() {
            if (this.appSettings.OverlayLayers === undefined) {
                this.appSettings.OverlayLayers = [];
            }
            return this.appSettings.OverlayLayers;
        }
        static set OverlayLayers(value) {
            this.appSettings.OverlayLayers = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get AppLanguage() {
            if (this.appSettings.AppLanguage === undefined) {
                this.appSettings.AppLanguage = "en";
            }
            return this.appSettings.AppLanguage;
        }
        static set AppLanguage(value) {
            this.appSettings.AppLanguage = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static ReadSettings() {
            READSB.Database.GetSetting("MapSettings")
                .then((result) => {
                if (result !== null && result !== undefined) {
                    AppSettings.Settings = result;
                }
                console.info("MapSettings loaded.");
            })
                .catch(() => {
                AppSettings.appSettings = AppSettings.defaultSettings;
                console.info("MapSettings initialized.");
            })
                .finally(() => {
                READSB.Main.Initialize();
            });
        }
    }
    AppSettings.defaultSettings = {
        AircraftPosition: true,
        AircraftTrail: true,
        AppLanguage: "en",
        BaseLayer: "osm",
        BingMapsAPIKey: READSB.DefaultBingMapsAPIKey,
        CenterLat: READSB.DefaultCenterLat,
        CenterLon: READSB.DefaultCenterLon,
        ColorsByAlt: READSB.DefaultColorByAlt,
        DisplayUnits: READSB.DefaultDisplayUnits,
        EnableFilter: false,
        EnableHighlightFilter: false,
        FlagPath: READSB.DefaultFlagPath,
        MapName: "osm",
        OnlineDatabaseUrl: READSB.DefaultOnlineDatabaseUrl,
        OutlineADSBColor: READSB.DefaultOutlineADSBColor,
        OutlineMlatColor: READSB.DefaultOutlineMlatColor,
        OverlayLayers: [],
        PageName: READSB.DefaultPageName,
        ShowAdditionalData: READSB.DefaultShowAdditionalData,
        ShowAdditionalMaps: READSB.DefaultShowAdditionalMaps,
        ShowAircraftCountInTitle: READSB.DefaultShowAircraftCountInTitle,
        ShowAltitudeChart: true,
        ShowChartBundleLayers: READSB.DefaultShowChartBundleLayers,
        ShowEULayers: READSB.DefaultShowEULayers,
        ShowFlags: READSB.DefaultShowFlags,
        ShowHoverOverLabels: READSB.DefaultShowHoverOverLabels,
        ShowMessageRateInTitle: READSB.DefaultShowMessageRateInTitle,
        ShowSite: READSB.DefaultShowSite,
        ShowSiteCircles: READSB.DefaultShowSiteCircles,
        ShowUSLayers: READSB.DefaultShowUSLayers,
        SiteCirclesDistances: READSB.DefaultSiteCirclesDistances,
        SiteLat: READSB.DefaultSiteLat,
        SiteLon: READSB.DefaultSiteLon,
        SkyVectorAPIKey: READSB.DefaultSkyVectorAPIKey,
        ZoomLevel: READSB.DefaultZoomLevel,
    };
    AppSettings.appSettings = null;
    READSB.AppSettings = AppSettings;
})(READSB || (READSB = {}));
//# sourceMappingURL=settings.js.map