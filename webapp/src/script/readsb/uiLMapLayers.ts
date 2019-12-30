// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiLMapLayers.ts: Layer definition for leaflet map.
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
    export class LMapLayers {
        /**
         * Create base layers and overlay layers.
         */
        public static CreateBaseLayers(): L.GroupedLayersCollection {
            const eu: L.TileLayer[] = [];
            const us: L.TileLayer[] = [];
            const world: L.TileLayer[] = [];
            const layers: L.GroupedLayersCollection = {};

            if (AppSettings.ShowAdditionalMaps && typeof AppSettings.SkyVectorAPIKey !== "undefined" && AppSettings.SkyVectorAPIKey !== null) {
                const d = this.svDate();

                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/hi/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 9,
                    minZoom: 1,
                    name: "world_hi",
                    title: i18next.t("map.layer.worldHi"),
                    type: "base",
                } as L.ExtLayerOptions));

                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/lo/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 10,
                    minZoom: 1,
                    name: "world_lo",
                    title: i18next.t("map.layer.worldLo"),
                    type: "base",
                } as L.ExtLayerOptions));

                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/vfr/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 11,
                    minZoom: 1,
                    name: "world_vfr",
                    title: i18next.t("map.layer.worldVfr"),
                    type: "base",
                } as L.ExtLayerOptions));
            }

            if (AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    isActive: false,
                    maxZoom: 19,
                    minZoom: 1,
                    name: "osm light",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.osmLight"),
                    type: "base",
                } as L.ExtLayerOptions));
            }

            if (AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    isActive: false,
                    maxZoom: 19,
                    minZoom: 1,
                    name: "osm dark",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.osmDark"),
                    type: "base",
                } as L.ExtLayerOptions));
            }

            world.push(L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                name: "osm",
                title: i18next.t("map.layer.osm"),
                type: "base",
            } as L.ExtLayerOptions));

            if (AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png", {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
                        + 'Data by <a _href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    isActive: false,
                    name: "terrain_roads",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.terrainRoads"),
                    type: "base",
                } as L.ExtLayerOptions));

                world.push(L.tileLayer("http://{s}.tile.stamen.com/terrain-background/{z}/{x}/{y}.png", {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
                        + 'Data by <a _href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    isActive: false,
                    name: "terrain",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.terrain"),
                    type: "base",
                } as L.ExtLayerOptions));
            }

            if (AppSettings.ShowUSLayers) {
                if (AppSettings.ShowChartBundleLayers) {
                    const chartbundleTypes: { [key: string]: any } = {
                        enra: i18next.t("map.layer.enra"),
                        enrh: i18next.t("map.layer.enrh"),
                        enrl: i18next.t("map.layer.enrl"),
                        sec: i18next.t("map.layer.sec"),
                        tac: i18next.t("map.layer.tac"),
                        wac: i18next.t("map.layer.wac"),
                    };
                    for (const type in chartbundleTypes) {
                        if (chartbundleTypes.hasOwnProperty(type)) {
                            us.push(L.tileLayer.wms("http://wms.chartbundle.com/wms", {
                                attribution: 'Tiles courtesy of <a href="http://www.chartbundle.com/">ChartBundle</a>',
                                crs: L.CRS.EPSG3857,
                                isActive: false,
                                layers: type,
                                name: "chartbundle_" + type,
                                title: chartbundleTypes[type],
                                type: "base",
                                uppercase: true,
                            } as L.ExtLayerOptions));
                        }
                    }
                }

                const nexrad = L.tileLayer("", {
                    attribution: 'NEXRAD courtesy of <a href="http://mesonet.agron.iastate.edu/">IEM</a>',
                    isActive: false,
                    name: "nexrad",
                    opacity: 0.5,
                    subdomains: "123",
                    title: i18next.t("map.layer.nexrad"),
                    type: "overlay",
                } as L.ExtLayerOptions);
                us.push(nexrad);

                const refreshNexrad = () => {
                    // re-build the source to force a refresh of the nexrad tiles
                    const now = new Date().getTime();
                    nexrad.setUrl(`http://mesonet{s}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${now}`);
                    nexrad.redraw();
                };
                refreshNexrad();
                window.setInterval(refreshNexrad, 5 * 60000);
            }

            if (AppSettings.ShowEULayers) {
                eu.push(L.tileLayer("https://snapshots.openflightmaps.org/live/1808/tiles/world/noninteractive/epsg3857/merged/512/latest/{z}/{x}/{y}.png", {
                    isActive: false,
                    maxZoom: 11,
                    minZoom: 4,
                    name: "ofm",
                    opacity: 0.75,
                    title: i18next.t("map.layer.ofm"),
                    type: "base",
                } as L.ExtLayerOptions));

                const dwd = L.tileLayer.wms("https://maps.dwd.de/geoserver/wms", {
                    attribution: "Deutscher Wetterdienst (DWD)",
                    crs: L.CRS.EPSG3857,
                    isActive: false,
                    layers: "dwd:RX-Produkt",
                    name: "radolan",
                    opacity: 0.3,
                    title: i18next.t("map.layer.radolan"),
                    transparent: true,
                    type: "overlay",
                    uppercase: true,
                } as L.ExtLayerOptions);
                eu.push(dwd);

                const refreshDwd = () => {
                    dwd.setParams({
                        format: "image/png",
                        height: 256,
                        layers: "dwd:RX-Produkt",
                        request: "GetMap",
                        service: "WMS",
                        styles: "",
                        transparent: true,
                        validTime: (new Date()).getTime(),
                        version: "1.3.0",
                        width: 256,
                    } as L.ExtWMSParams, false);
                };
                refreshDwd();
                window.setInterval(refreshDwd, 5 * 60000);
            }

            if (world.length > 0) {
                layers[i18next.t("map.layer.world")] = world;
            }

            if (us.length > 0) {
                layers[i18next.t("map.layer.us")] = us;
            }

            if (eu.length > 0) {
                layers[i18next.t("map.layer.eu")] = eu;
            }
            return layers;
        }

        /**
         * Create site and site circles layers.
         * A separate function is used for this since site layer can change with user settings.
         */
        public static CreateSiteCircleLayer(): L.GroupedLayersCollection {
            const site: L.Layer[] = [];
            const layers: L.GroupedLayersCollection = {};
            const siteCirclesGroup: L.LayerGroup = L.layerGroup(null, {
                isActive: false,
                name: "sitecircles",
                title: i18next.t("map.layer.siteCircles"),
                type: "overlay",
            } as L.ExtLayerOptions);
            let conversionFactor = 1000.0;

            if (AppSettings.SiteLat !== undefined && AppSettings.SiteLon !== undefined) {
                let color = "black";
                if (AppSettings.UseDarkTheme) {
                    color = "#606060";
                }

                if (AppSettings.ShowSite) {
                    site.push(L.circleMarker(L.latLng(AppSettings.SiteLat, AppSettings.SiteLon), {
                        color,
                        fill: true,
                        fillColor: color,
                        fillOpacity: 0.7,
                        isActive: false,
                        name: "site",
                        opacity: 0.7,
                        radius: 5,
                        stroke: true,
                        title: i18next.t("map.layer.site"),
                        type: "overlay",
                        weight: 1,
                    } as L.ExtLayerOptions));
                }

                if (AppSettings.DisplayUnits === "nautical") {
                    conversionFactor = 1852.0;
                } else if (AppSettings.DisplayUnits === "imperial") {
                    conversionFactor = 1609.0;
                }

                if (AppSettings.ShowSiteCircles) {
                    for (const dist of AppSettings.SiteCirclesDistances) {
                        const distance = dist * conversionFactor;

                        const circle = this.MakeGeodesicCircle(L.latLng(AppSettings.SiteLat, AppSettings.SiteLon), distance, 360);
                        siteCirclesGroup.addLayer(L.polyline(circle, {
                            color,
                            fill: false,
                            opacity: 0.7,
                            smoothFactor: 0.7,
                            weight: 1,
                        }));
                    }
                    site.push(siteCirclesGroup);
                }
            }

            // Create an empty layer group to create an
            // altitude chart checkbox in grouped layers control.
            site.push(L.layerGroup(null, {
                isActive: false,
                name: "altchart",
                title: i18next.t("map.layer.altitudeChart"),
                type: "overlay",
            } as L.ExtLayerOptions));

            if (site.length > 0) {
                layers[i18next.t("map.layer.features")] = site;
            }
            return layers;
        }

        /**
         * Make a polyline with number points
         * that is a closed circle on the sphere such that the
         * great circle distance from center to each point is.
         * @param center Center position
         * @param radius Radius in meter
         * @param points Number of points along circle line
         */
        private static MakeGeodesicCircle(center: L.LatLng, radius: number, points: number): L.LatLngExpression[] {
            if (center === null) {
                center = L.latLng(AppSettings.SiteLat, AppSettings.SiteLon);
            }
            const angularDistance = radius / 6378137.0;
            const lon1 = center.lng * Math.PI / 180.0;
            const lat1 = center.lat * Math.PI / 180.0;
            const locGeom: L.LatLngExpression[] = [];
            for (let i = 0; i <= points; ++i) {
                const bearing = i * 2 * Math.PI / points;

                let lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
                    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing));
                let lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
                    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));

                lat2 = lat2 * 180.0 / Math.PI;
                lon2 = lon2 * 180.0 / Math.PI;
                locGeom.push([lat2, lon2]);
            }
            return locGeom;
        }

        /**
         * Encode time and date for SkyVector layer requests.
         */
        private static svDate(): string {
            const e = new Date();
            const t = Math.round(e.getTime() / 1e3);
            const a = Math.floor((t - 1263459660) / 2419200);
            const r = new Date(e.getFullYear(), 0, 1);
            const i = Math.round(r.getTime() / 1e3);
            const n = Math.floor((i - 1263459660) / 2419200);
            let o = a - n;
            let s = e.getFullYear() - 2e3;

            if (o === 0) {
                o = 13;
                s -= 1;
            }

            let l = o.toFixed(0);

            if (l.length === 1) {
                l = "0".concat(l);
            }

            return s.toFixed(0) + l;
        }
    }
}
