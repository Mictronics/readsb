"use strict";
var READSB;
(function (READSB) {
    class LMapLayers {
        static CreateBaseLayers() {
            const eu = [];
            const us = [];
            const world = [];
            const layers = {};
            if (READSB.AppSettings.ShowAdditionalMaps && typeof READSB.AppSettings.SkyVectorAPIKey !== "undefined" && READSB.AppSettings.SkyVectorAPIKey !== null) {
                const d = this.svDate();
                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/hi/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: READSB.AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 9,
                    minZoom: 1,
                    name: "world_hi",
                    title: i18next.t("map.layer.worldHi"),
                    type: "base",
                }));
                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/lo/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: READSB.AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 10,
                    minZoom: 1,
                    name: "world_lo",
                    title: i18next.t("map.layer.worldLo"),
                    type: "base",
                }));
                world.push(L.tileLayer(`//t.skyvector.com/{apiKey}/vfr/{dateTime}/{z}/{x}/{y}.jpg`, {
                    apiKey: READSB.AppSettings.SkyVectorAPIKey,
                    attribution: 'Tiles courtesy of <a href="https://www.skyvector.com/">SkyVector</a>',
                    dateTime: d,
                    isActive: false,
                    maxZoom: 11,
                    minZoom: 1,
                    name: "world_vfr",
                    title: i18next.t("map.layer.worldVfr"),
                    type: "base",
                }));
            }
            if (READSB.AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    isActive: false,
                    maxZoom: 19,
                    minZoom: 1,
                    name: "osm light",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.osmLight"),
                    type: "base",
                }));
            }
            if (READSB.AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                    isActive: false,
                    maxZoom: 19,
                    minZoom: 1,
                    name: "osm dark",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.osmDark"),
                    type: "base",
                }));
            }
            world.push(L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                name: "osm",
                title: i18next.t("map.layer.osm"),
                type: "base",
            }));
            if (READSB.AppSettings.ShowAdditionalMaps) {
                world.push(L.tileLayer("http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png", {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
                        + 'Data by <a _href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    isActive: false,
                    name: "terrain_roads",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.terrainRoads"),
                    type: "base",
                }));
                world.push(L.tileLayer("http://{s}.tile.stamen.com/terrain-background/{z}/{x}/{y}.png", {
                    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
                        + 'Data by <a _href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                    isActive: false,
                    name: "terrain",
                    subdomains: "abcd",
                    title: i18next.t("map.layer.terrain"),
                    type: "base",
                }));
            }
            if (READSB.AppSettings.ShowUSLayers) {
                if (READSB.AppSettings.ShowChartBundleLayers) {
                    const chartbundleTypes = {
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
                            }));
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
                });
                us.push(nexrad);
                const refreshNexrad = () => {
                    const now = new Date().getTime();
                    nexrad.setUrl(`http://mesonet{s}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?_=${now}`);
                    nexrad.redraw();
                };
                refreshNexrad();
                window.setInterval(refreshNexrad, 5 * 60000);
            }
            if (READSB.AppSettings.ShowEULayers) {
                eu.push(L.tileLayer("https://snapshots.openflightmaps.org/live/1808/tiles/world/noninteractive/epsg3857/merged/512/latest/{z}/{x}/{y}.png", {
                    isActive: false,
                    maxZoom: 11,
                    minZoom: 4,
                    name: "ofm",
                    opacity: 0.75,
                    title: i18next.t("map.layer.ofm"),
                    type: "base",
                }));
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
                });
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
                    }, false);
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
        static CreateSiteCircleLayer() {
            const site = [];
            const layers = {};
            const siteCirclesGroup = L.layerGroup(null, {
                isActive: false,
                name: "sitecircles",
                title: i18next.t("map.layer.siteCircles"),
                type: "overlay",
            });
            let conversionFactor = 1000.0;
            if (READSB.AppSettings.SiteLat !== undefined && READSB.AppSettings.SiteLon !== undefined) {
                let color = "black";
                if (READSB.AppSettings.UseDarkTheme) {
                    color = "#606060";
                }
                if (READSB.DefaultShowSite) {
                    site.push(L.circleMarker(L.latLng(READSB.AppSettings.SiteLat, READSB.AppSettings.SiteLon), {
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
                    }));
                }
                if (READSB.AppSettings.DisplayUnits === "nautical") {
                    conversionFactor = 1852.0;
                }
                else if (READSB.AppSettings.DisplayUnits === "imperial") {
                    conversionFactor = 1609.0;
                }
                if (READSB.DefaultShowSiteCircles) {
                    for (const dist of READSB.AppSettings.SiteCirclesDistances) {
                        const distance = dist * conversionFactor;
                        const circle = this.MakeGeodesicCircle(L.latLng(READSB.AppSettings.SiteLat, READSB.AppSettings.SiteLon), distance, 360);
                        siteCirclesGroup.addLayer(L.polyline(circle, {
                            color: color,
                            fill: false,
                            opacity: 0.7,
                            smoothFactor: 0.7,
                            weight: 1,
                        }));
                    }
                    site.push(siteCirclesGroup);
                }
            }
            site.push(L.layerGroup(null, {
                isActive: false,
                name: "altchart",
                title: i18next.t("map.layer.altitudeChart"),
                type: "overlay",
            }));
            if (site.length > 0) {
                layers[i18next.t("map.layer.features")] = site;
            }
            return layers;
        }
        static MakeGeodesicCircle(center, radius, points) {
            if (center === null) {
                center = L.latLng(READSB.DefaultSiteLat, READSB.DefaultSiteLon);
            }
            const angularDistance = radius / 6378137.0;
            const lon1 = center.lng * Math.PI / 180.0;
            const lat1 = center.lat * Math.PI / 180.0;
            const locGeom = [];
            for (let i = 0; i <= points; ++i) {
                const bearing = i * 2 * Math.PI / points;
                let lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
                    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing));
                let lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1), Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));
                lat2 = lat2 * 180.0 / Math.PI;
                lon2 = lon2 * 180.0 / Math.PI;
                locGeom.push([lat2, lon2]);
            }
            return locGeom;
        }
        static svDate() {
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
    READSB.LMapLayers = LMapLayers;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiLMapLayers.js.map