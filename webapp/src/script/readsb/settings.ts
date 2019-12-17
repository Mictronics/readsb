// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// settings.ts: Web application settings class.
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

        static get ColorsByAlt(): IColorByAlt {
            if (this.appSettings.ColorsByAlt === undefined) {
                this.appSettings.ColorsByAlt = DefaultColorByAlt;
            }
            return this.appSettings.ColorsByAlt;
        }
        static set ColorsByAlt(value: IColorByAlt) {
            this.appSettings.ColorsByAlt = value;
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

        static get MapName(): string {
            return this.appSettings.MapName;
        }
        static set MapName(value: string) {
            this.appSettings.MapName = value;
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
                this.ZoomLevel = DefaultZoomLevel;
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
                this.appSettings.FlagPath = DefaultFlagPath;
                Database.PutSetting("MapSettings", this.appSettings);
            }
            return this.appSettings.FlagPath;
        }

        static get BingMapsAPIKey(): string {
            return this.appSettings.BingMapsAPIKey;
        }

        static get SkyVectorAPIKey(): string {
            return this.appSettings.SkyVectorAPIKey;
        }

        static get OnlineDatabaseUrl(): string {
            return this.appSettings.OnlineDatabaseUrl;
        }

        static get OutlineADSBColor(): string {
            return this.appSettings.OutlineADSBColor;
        }

        static get OutlineMlatColor(): string {
            return this.appSettings.OutlineMlatColor;
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

        static get AircraftPosition(): boolean {
            return this.appSettings.AircraftPosition;
        }
        static set AircraftPosition(value: boolean) {
            this.appSettings.AircraftPosition = value;
            Database.PutSetting("MapSettings", this.appSettings);
        }

        static get AircraftTrail(): boolean {
            return this.appSettings.AircraftTrail;
        }
        static set AircraftTrail(value: boolean) {
            this.appSettings.AircraftTrail = value;
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

        public static ReadSettings() {
            Database.GetSetting("MapSettings")
                .then((result: any) => {
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
                    // We read or initialized application static settings, now initialize app.
                    Main.Initialize();
                });
        }
        private static defaultSettings: IAppSettings = {
            AircraftPosition: true,
            AircraftTrail: true,
            AppLanguage: "en",
            BaseLayer: "osm",
            BingMapsAPIKey: DefaultBingMapsAPIKey,
            CenterLat: DefaultCenterLat,
            CenterLon: DefaultCenterLon,
            ColorsByAlt: DefaultColorByAlt,
            DisplayUnits: DefaultDisplayUnits,
            EnableFilter: false,
            EnableHighlightFilter: false,
            FlagPath: DefaultFlagPath,
            HideAircraftsNotInView: true,
            MapName: "osm",
            OnlineDatabaseUrl: DefaultOnlineDatabaseUrl,
            OutlineADSBColor: DefaultOutlineADSBColor,
            OutlineMlatColor: DefaultOutlineMlatColor,
            OverlayLayers: [],
            PageName: DefaultPageName,
            ShowAdditionalData: DefaultShowAdditionalData,
            ShowAdditionalMaps: DefaultShowAdditionalMaps,
            ShowAircraftCountInTitle: DefaultShowAircraftCountInTitle,
            ShowAltitudeChart: true,
            ShowChartBundleLayers: DefaultShowChartBundleLayers,
            ShowEULayers: DefaultShowEULayers,
            ShowFlags: DefaultShowFlags,
            ShowHoverOverLabels: DefaultShowHoverOverLabels,
            ShowMessageRateInTitle: DefaultShowMessageRateInTitle,
            ShowSite: DefaultShowSite,
            ShowSiteCircles: DefaultShowSiteCircles,
            ShowUSLayers: DefaultShowUSLayers,
            SiteCirclesDistances: DefaultSiteCirclesDistances,
            SiteLat: DefaultSiteLat,
            SiteLon: DefaultSiteLon,
            SkyVectorAPIKey: DefaultSkyVectorAPIKey,
            ZoomLevel: DefaultZoomLevel,
        };

        private static appSettings: IAppSettings = null;
    }
}
