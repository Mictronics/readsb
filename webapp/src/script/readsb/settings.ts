// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// settings.ts: Web application settings class.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
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
    export class AppSettings {

        static get Settings(): IAppSettings {
            return this.appSettings;
        }
        static set Settings(value: IAppSettings) {
            this.appSettings = value;
        }

        static get ShowAltitudeChart(): boolean {
            return this.appSettings.ShowAltitudeChart;
        }
        static set ShowAltitudeChart(value: boolean) {
            this.appSettings.ShowAltitudeChart = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get CenterLat(): number {
            return this.appSettings.CenterLat;
        }
        static set CenterLat(value: number) {
            this.appSettings.CenterLat = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get CenterLon(): number {
            return this.appSettings.CenterLon;
        }
        static set CenterLon(value: number) {
            this.appSettings.CenterLon = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowSite(): boolean {
            return this.appSettings.ShowSite;
        }
        static set ShowSite(value: boolean) {
            this.appSettings.ShowSite = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get SiteLat(): number {
            return this.appSettings.SiteLat;
        }
        static set SiteLat(value: number) {
            this.appSettings.SiteLat = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get SiteLon(): number {
            return this.appSettings.SiteLon;
        }
        static set SiteLon(value: number) {
            this.appSettings.SiteLon = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get DisplayUnits(): string {
            return this.appSettings.DisplayUnits;
        }
        static set DisplayUnits(value: string) {
            this.appSettings.DisplayUnits = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get PageName(): string {
            return this.appSettings.PageName;
        }
        static set PageName(value: string) {
            this.appSettings.PageName = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowAdditionalData(): boolean {
            return this.appSettings.ShowAdditionalData;
        }
        static set ShowAdditionalData(value: boolean) {
            this.appSettings.ShowAdditionalData = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowFlags(): boolean {
            return this.appSettings.ShowFlags;
        }
        static set ShowFlags(value: boolean) {
            this.appSettings.ShowFlags = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowSiteCircles(): boolean {
            return this.appSettings.ShowSiteCircles;
        }
        static set ShowSiteCircles(value: boolean) {
            this.appSettings.ShowSiteCircles = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ZoomLevel(): number {
            if (this.appSettings.ZoomLevel === undefined) {
                this.ZoomLevel = 7;
            }
            return this.appSettings.ZoomLevel;
        }
        static set ZoomLevel(value: number) {
            this.appSettings.ZoomLevel = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get SiteCirclesDistances(): number[] {
            return this.appSettings.SiteCirclesDistances;
        }
        static set SiteCirclesDistances(value: number[]) {
            this.appSettings.SiteCirclesDistances = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get FlagPath(): string {
            if (this.appSettings.FlagPath === undefined || this.appSettings.FlagPath === null) {
                this.appSettings.FlagPath = "images/flags-tiny/";
                Database.PutSetting("MapSettings", this.appSettings);
            }
            return this.appSettings.FlagPath;
        }

        static get SkyVectorAPIKey(): string {
            return this.appSettings.SkyVectorAPIKey;
        }

        static get OnlineDatabaseUrl(): string {
            return this.appSettings.OnlineDatabaseUrl;
        }

        static get ShowChartBundleLayers(): boolean {
            return this.appSettings.ShowChartBundleLayers;
        }
        static set ShowChartBundleLayers(value: boolean) {
            this.appSettings.ShowChartBundleLayers = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowAdditionalMaps(): boolean {
            return this.appSettings.ShowAdditionalMaps;
        }
        static set ShowAdditionalMaps(value: boolean) {
            this.appSettings.ShowAdditionalMaps = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowMessageRateInTitle(): boolean {
            return this.appSettings.ShowMessageRateInTitle;
        }
        static set ShowMessageRateInTitle(value: boolean) {
            this.appSettings.ShowMessageRateInTitle = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowAircraftCountInTitle(): boolean {
            return this.appSettings.ShowAircraftCountInTitle;
        }
        static set ShowAircraftCountInTitle(value: boolean) {
            this.appSettings.ShowAircraftCountInTitle = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowEULayers(): boolean {
            return this.appSettings.ShowEULayers;
        }
        static set ShowEULayers(value: boolean) {
            this.appSettings.ShowEULayers = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowUSLayers(): boolean {
            return this.appSettings.ShowUSLayers;
        }
        static set ShowUSLayers(value: boolean) {
            this.appSettings.ShowUSLayers = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get ShowHoverOverLabels(): boolean {
            return this.appSettings.ShowHoverOverLabels;
        }
        static set ShowHoverOverLabels(value: boolean) {
            this.appSettings.ShowHoverOverLabels = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get EnableFilter(): boolean {
            return this.appSettings.EnableFilter;
        }
        static set EnableFilter(value: boolean) {
            this.appSettings.EnableFilter = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get EnableHighlightFilter(): boolean {
            return this.appSettings.EnableHighlightFilter;
        }
        static set EnableHighlightFilter(value: boolean) {
            this.appSettings.EnableHighlightFilter = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get BaseLayer(): string {
            return this.appSettings.BaseLayer;
        }
        static set BaseLayer(value: string) {
            this.appSettings.BaseLayer = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get OverlayLayers(): string[] {
            if (this.appSettings.OverlayLayers === undefined) {
                this.appSettings.OverlayLayers = [];
            }
            return this.appSettings.OverlayLayers;
        }
        static set OverlayLayers(value: string[]) {
            this.appSettings.OverlayLayers = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get AppLanguage(): string {
            if (this.appSettings.AppLanguage === undefined) {
                this.appSettings.AppLanguage = "en";
            }
            return this.appSettings.AppLanguage;
        }
        static set AppLanguage(value: string) {
            this.appSettings.AppLanguage = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get HideAircraftsNotInView(): boolean {
            if (this.appSettings.HideAircraftsNotInView === undefined) {
                this.appSettings.HideAircraftsNotInView = false;
            }
            return this.appSettings.HideAircraftsNotInView;
        }
        static set HideAircraftsNotInView(value: boolean) {
            this.appSettings.HideAircraftsNotInView = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get UseDarkTheme(): boolean {
            if (this.appSettings.UseDarkTheme === undefined) {
                this.appSettings.UseDarkTheme = false;
            }
            return this.appSettings.UseDarkTheme;
        }
        static set UseDarkTheme(value: boolean) {
            this.appSettings.UseDarkTheme = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        public static ReadSettings() {
            Database.GetSetting("MapSettings")
                .then((result: any) => {
                    if (result !== null && result !== undefined) {
                        AppSettings.Settings = result;
                    }
                    // We read application static settings, now initialize app.
                    Main.Initialize();
                    console.info("MapSettings loaded.");
                })
                .catch((error) => {
                    Main.Initialize();
                });
        }

        public static ReadDefaultSettings() {
            fetch("script/readsb/defaults.json", {
                cache: "no-cache",
                method: "GET",
                mode: "cors",
            })
                .then((res: Response) => {
                    if (res.status >= 200 && res.status < 300) {
                        return Promise.resolve(res);
                    } else {
                        return Promise.reject(new Error(res.statusText));
                    }
                })
                .then((res: Response) => {
                    return res.json();
                })
                .then((data: IDefaultSettings) => {
                    // Create application settings from external defaults.
                    // Or hard coded if partly.
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
                        OnlineDatabaseUrl: ("OnlineDatabaseUrl" in data) ? data.OnlineDatabaseUrl : ".",
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
                    } else {
                        this.appSettings.OverlayLayers = ["site", "siteCircles"];
                    }

                    if ("SiteCirclesDistances" in data) {
                        this.appSettings.SiteCirclesDistances = data.SiteCirclesDistances.split(",").map((v: string) => {
                            return Number.parseInt(v, 10);
                        });
                    } else {
                        this.appSettings.SiteCirclesDistances = [100, 150, 200];
                    }

                    console.info("Default settings loaded.");
                })
                .catch((error) => {
                    console.error(error);
                    // Use hard coded defaults in case loading of externals fails.
                    this.appSettings = {
                        AppLanguage: "en",
                        BaseLayer: "osm",
                        CenterLat: 45.0,
                        CenterLon: 9.0,
                        DisplayUnits: "nautical",
                        EnableFilter: false,
                        EnableHighlightFilter: false,
                        FlagPath: "images/flags-tiny/",
                        HideAircraftsNotInView: true,
                        OnlineDatabaseUrl: ".",
                        OverlayLayers: [],
                        PageName: "readsb radar",
                        ShowAdditionalData: true,
                        ShowAdditionalMaps: true,
                        ShowAircraftCountInTitle: true,
                        ShowAltitudeChart: true,
                        ShowChartBundleLayers: true,
                        ShowEULayers: true,
                        ShowFlags: true,
                        ShowHoverOverLabels: true,
                        ShowMessageRateInTitle: true,
                        ShowSite: true,
                        ShowSiteCircles: true,
                        ShowUSLayers: true,
                        SiteCirclesDistances: [100, 150, 200],
                        SiteLat: 45.0,
                        SiteLon: 9.0,
                        SkyVectorAPIKey: "",
                        UseDarkTheme: false,
                        ZoomLevel: 7,
                    };
                })
                .finally(() => {
                    Database.Init();
                });
        }

        private static appSettings: IAppSettings = null;
    }
}
