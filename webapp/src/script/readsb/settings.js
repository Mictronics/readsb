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
                this.ZoomLevel = 7;
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
                this.appSettings.FlagPath = "images/flags-tiny/";
                READSB.Database.PutSetting("MapSettings", this.appSettings);
            }
            return this.appSettings.FlagPath;
        }
        static get SkyVectorAPIKey() {
            return this.appSettings.SkyVectorAPIKey;
        }
        static get OnlineDatabaseUrl() {
            return this.appSettings.OnlineDatabaseUrl;
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
        static get HideAircraftsNotInView() {
            if (this.appSettings.HideAircraftsNotInView === undefined) {
                this.appSettings.HideAircraftsNotInView = false;
            }
            return this.appSettings.HideAircraftsNotInView;
        }
        static set HideAircraftsNotInView(value) {
            this.appSettings.HideAircraftsNotInView = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static get UseDarkTheme() {
            if (this.appSettings.UseDarkTheme === undefined) {
                this.appSettings.UseDarkTheme = false;
            }
            return this.appSettings.UseDarkTheme;
        }
        static set UseDarkTheme(value) {
            this.appSettings.UseDarkTheme = value;
            READSB.Database.PutSetting("MapSettings", this.appSettings);
        }
        static ReadSettings() {
            READSB.Database.GetSetting("MapSettings")
                .then((result) => {
                if (result !== null && result !== undefined) {
                    AppSettings.Settings = result;
                }
                READSB.Main.Initialize();
                console.info("MapSettings loaded.");
            })
                .catch((error) => {
                READSB.Main.Initialize();
            });
        }
        static ReadDefaultSettings() {
            fetch("script/readsb/defaults.json", {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res) => {
                if (res.status >= 200 && res.status < 300) {
                    return Promise.resolve(res);
                }
                else {
                    return Promise.reject(new Error(res.statusText));
                }
            })
                .then((res) => {
                return res.json();
            })
                .then((data) => {
                this.appSettings = {
                    AppLanguage: ("AppLanguage" in data) ? data.AppLanguage : "en",
                    BaseLayer: ("BaseLayer" in data) ? data.BaseLayer : "osm",
                    CenterLat: ("CenterLat" in data) ? data.CenterLat : 45.0,
                    CenterLon: ("CenterLon" in data) ? data.CenterLon : 9.0,
                    DisplayUnits: ("DisplayUnits" in data) ? data.DisplayUnits : "nautical",
                    EnableFilter: ("EnableFilter" in data) ? data.EnableFilter : false,
                    EnableHighlightFilter: ("EnableHighlightFilter" in data) ? data.EnableHighlightFilter : false,
                    FlagPath: ("FlagPath" in data) ? data.FlagPath : "images/flags-tiny/",
                    HideAircraftsNotInView: ("HideAircraftsNotInView" in data) ? data.HideAircraftsNotInView : true,
                    OnlineDatabaseUrl: ("OnlineDatabaseUrl" in data) ? data.OnlineDatabaseUrl : "",
                    OverlayLayers: [],
                    PageName: ("PageName" in data) ? data.PageName : "readsb radar",
                    ShowAdditionalData: ("ShowAdditionalData" in data) ? data.ShowAdditionalData : true,
                    ShowAdditionalMaps: ("ShowAdditionalMaps" in data) ? data.ShowAdditionalMaps : true,
                    ShowAircraftCountInTitle: ("ShowAircraftCountInTitle" in data) ? data.ShowAircraftCountInTitle : true,
                    ShowAltitudeChart: ("ShowAltitudeChart" in data) ? data.ShowAltitudeChart : true,
                    ShowChartBundleLayers: ("ShowChartBundleLayers" in data) ? data.ShowChartBundleLayers : true,
                    ShowEULayers: ("ShowEULayers" in data) ? data.ShowEULayers : true,
                    ShowFlags: ("ShowFlags" in data) ? data.ShowFlags : true,
                    ShowHoverOverLabels: ("ShowHoverOverLabels" in data) ? data.ShowHoverOverLabels : true,
                    ShowMessageRateInTitle: ("ShowMessageRateInTitle" in data) ? data.ShowMessageRateInTitle : true,
                    ShowSite: ("ShowSite" in data) ? data.ShowSite : true,
                    ShowSiteCircles: ("ShowSiteCircles" in data) ? data.ShowSiteCircles : true,
                    ShowUSLayers: ("ShowUSLayers" in data) ? data.ShowUSLayers : true,
                    SiteCirclesDistances: [],
                    SiteLat: ("SiteLat" in data) ? data.SiteLat : 45.0,
                    SiteLon: ("SiteLon" in data) ? data.SiteLon : 9.0,
                    SkyVectorAPIKey: ("SkyVectorAPIKey" in data) ? data.SkyVectorAPIKey : "",
                    UseDarkTheme: ("UseDarkTheme" in data) ? data.UseDarkTheme : false,
                    ZoomLevel: ("ZoomLevel" in data) ? data.ZoomLevel : 7,
                };
                if ("OverlayLayers" in data) {
                    this.appSettings.OverlayLayers = data.OverlayLayers.split(",");
                }
                else {
                    this.appSettings.OverlayLayers = ["site", "siteCircles"];
                }
                if ("SiteCirclesDistances" in data) {
                    this.appSettings.SiteCirclesDistances = data.SiteCirclesDistances.split(",").map((v) => {
                        return Number.parseInt(v, 10);
                    });
                }
                else {
                    this.appSettings.SiteCirclesDistances = [100, 150, 200];
                }
                console.info("Default settings loaded.");
                READSB.Database.Init();
            })
                .catch((error) => {
                console.error(error);
            });
        }
    }
    AppSettings.appSettings = null;
    READSB.AppSettings = AppSettings;
})(READSB || (READSB = {}));
//# sourceMappingURL=settings.js.map