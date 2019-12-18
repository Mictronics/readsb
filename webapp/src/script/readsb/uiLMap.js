"use strict";
var READSB;
(function (READSB) {
    class LMap {
        static Init() {
            this.lMap = L.map("lMapCanvas", {
                doubleClickZoom: false,
            }).setView([READSB.AppSettings.CenterLat, READSB.AppSettings.CenterLon], READSB.AppSettings.ZoomLevel);
            L.control.button({
                callback: this.OnHideSidebarButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-hide-sidepanel"],
                position: "topright",
                title: i18next.t("map.hideSidePanel"),
            }).addTo(this.lMap);
            L.control.button({
                callback: this.OnExpandSidebarButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-expand-sidepanel"],
                position: "topright",
                title: i18next.t("map.expandSidePanel"),
            }).addTo(this.lMap);
            L.control.button({
                callback: this.OnSelectAllButtonClick,
                classes: ["leaflet-btn-control", "leaflet-btn-select-all"],
                position: "topright",
                title: i18next.t("map.selectAllAircraft"),
            }).addTo(this.lMap);
            L.control.button({
                callback: this.OnDeSelectAllButtonClick,
                classes: ["leaflet-btn-control", "leaflet-btn-deselect-all"],
                position: "topright",
                title: i18next.t("map.deselectAllAircraft"),
            }).addTo(this.lMap);
            L.control.button({
                callback: this.OnResetButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-reset-map"],
                position: "topright",
                title: i18next.t("map.resetMap"),
            }).addTo(this.lMap);
            const bl = READSB.LMapLayers.CreateBaseLayers();
            const sl = READSB.LMapLayers.CreateSiteCircleLayer();
            this.lMapLayers = Object.assign(Object.assign({}, bl), sl);
            for (const layers of Object.values(this.lMapLayers)) {
                layers.forEach((l) => {
                    const o = l.options;
                    if (o.name === READSB.AppSettings.BaseLayer) {
                        o.isActive = true;
                    }
                    if (READSB.AppSettings.OverlayLayers !== undefined) {
                        READSB.AppSettings.OverlayLayers.forEach((v) => {
                            if (o.name === v) {
                                o.isActive = true;
                            }
                        });
                    }
                });
            }
            this.groupedLayersControl = L.control.groupedLayers(this.lMapLayers, {
                autoZIndex: true,
                collapsed: true,
                onClickCallback: this.OnGroupedLayersControlClick,
                position: "topright",
            }).addTo(this.lMap);
            this.AircraftPositions.addTo(this.lMap);
            this.AircraftTrails.addTo(this.lMap);
            this.lMap.addEventListener("click dblclick", this.OnMapClick);
            this.lMap.addEventListener("moveend", this.OnMapMoveEnd);
            this.lMap.addEventListener("zoomend", this.OnMapZoomEnd);
            this.lMap.addEventListener("overlayadd overlayremove layeradd", this.OnMapLayerChange);
            this.mapViewBounds = this.lMap.getBounds();
            this.Initialized = true;
        }
        static CreateSiteCircles() {
            if (this.lMapLayers.hasOwnProperty("Features")) {
                this.lMapLayers["Features"].forEach((l, i) => {
                    if (this.lMap.hasLayer(l)) {
                        this.lMap.removeLayer(l);
                    }
                });
                delete this.lMapLayers["Features"];
            }
            const sl = READSB.LMapLayers.CreateSiteCircleLayer();
            if (sl.hasOwnProperty("Features")) {
                this.lMapLayers = Object.assign(this.lMapLayers, sl);
                this.lMapLayers["Features"].forEach((l) => {
                    const o = l.options;
                    if (READSB.AppSettings.ShowSite && o.name === "site") {
                        o.isActive = true;
                    }
                    if (READSB.AppSettings.ShowSiteCircles && o.name === "sitecircles") {
                        o.isActive = true;
                    }
                    if (READSB.AppSettings.ShowAltitudeChart && o.name === "altchart") {
                        o.isActive = true;
                    }
                });
            }
            this.groupedLayersControl.update();
        }
        static GetDistance(p1, p2) {
            if (this.lMap !== null && p1 !== null && p2 !== null) {
                return this.lMap.distance(p1, p2);
            }
            return Number.NaN;
        }
        static get ZoomLevel() {
            return this.lMap.getZoom();
        }
        static set ZoomLevel(value) {
            if (this.lMap !== null) {
                this.lMap.setZoom(value);
            }
        }
        static get Center() {
            return this.lMap.getCenter();
        }
        static set Center(value) {
            if (this.lMap !== null) {
                this.lMap.flyTo(value);
            }
        }
        static get MapViewBounds() {
            return this.mapViewBounds;
        }
        static OnResetButtonClick(e) {
            this.lMap.setView([READSB.AppSettings.SiteLat, READSB.AppSettings.SiteLon], READSB.AppSettings.ZoomLevel);
            e.stopImmediatePropagation();
        }
        static OnExpandSidebarButtonClick(e) {
            if (this.sideBarVisibility === READSB.eSideBarVisibility.Normal) {
                READSB.Body.AircraftListSetColumnVisibility(true);
                this.sideBarVisibility = READSB.eSideBarVisibility.Expanded;
            }
            else if (this.sideBarVisibility === READSB.eSideBarVisibility.Hidden) {
                document.getElementById("sidebarContainer").classList.remove("hidden");
                READSB.Body.AircraftListSetColumnVisibility(false);
                this.sideBarVisibility = READSB.eSideBarVisibility.Normal;
            }
            this.lMap.invalidateSize();
            e.stopImmediatePropagation();
        }
        static OnHideSidebarButtonClick(e) {
            if (this.sideBarVisibility === READSB.eSideBarVisibility.Normal) {
                document.getElementById("sidebarContainer").classList.add("hidden");
                this.sideBarVisibility = READSB.eSideBarVisibility.Hidden;
            }
            else if (this.sideBarVisibility === READSB.eSideBarVisibility.Expanded) {
                READSB.Body.AircraftListSetColumnVisibility(false);
                this.sideBarVisibility = READSB.eSideBarVisibility.Normal;
            }
            this.lMap.invalidateSize();
            e.stopImmediatePropagation();
        }
        static OnSelectAllButtonClick(e) {
            READSB.AircraftCollection.SelectAll = true;
            e.stopImmediatePropagation();
        }
        static OnDeSelectAllButtonClick(e) {
            READSB.AircraftCollection.SelectAll = false;
            e.stopImmediatePropagation();
        }
        static OnMapClick(e) {
            READSB.AircraftCollection.SelectAll = false;
            e.originalEvent.stopImmediatePropagation();
        }
        static OnMapMoveEnd(e) {
            const c = e.target.getCenter();
            READSB.AppSettings.CenterLat = c.lat;
            READSB.AppSettings.CenterLon = c.lng;
            this.mapViewBounds = this.lMap.getBounds();
        }
        static OnMapZoomEnd(e) {
            READSB.AppSettings.ZoomLevel = e.target.getZoom();
            this.mapViewBounds = this.lMap.getBounds();
        }
        static OnMapLayerChange(e) {
            const ol = READSB.AppSettings.OverlayLayers;
            switch (e.type) {
                case "layeradd":
                    if (e.layer.options.type === "base") {
                        READSB.AppSettings.BaseLayer = e.layer.options.name;
                    }
                    break;
                case "overlayadd":
                    ol.push(e.options.name);
                    READSB.AppSettings.OverlayLayers = ol;
                    break;
                case "overlayremove":
                    const i = READSB.AppSettings.OverlayLayers.indexOf(e.options.name);
                    if (i !== -1 && e.options.type === "overlay") {
                        ol.splice(i, 1);
                        READSB.AppSettings.OverlayLayers = ol;
                    }
                    break;
                default:
                    break;
            }
        }
        static OnGroupedLayersControlClick(e) {
            const input = e.target;
            if (input.id === "site") {
                READSB.AppSettings.ShowSite = input.checked;
            }
            else if (input.id === "sitecircles") {
                READSB.AppSettings.ShowSiteCircles = input.checked;
            }
            else if (input.id === "altchart") {
                let checked = input.checked;
                if (READSB.AppSettings.ColorsByAlt.IsDefault === false) {
                    checked = false;
                }
                READSB.AppSettings.ShowAltitudeChart = checked;
                if (checked) {
                    document.getElementById("altitudeChart").classList.remove("hidden");
                }
                else {
                    document.getElementById("altitudeChart").classList.add("hidden");
                }
            }
        }
    }
    LMap.AircraftPositions = new L.FeatureGroup();
    LMap.AircraftTrails = new L.FeatureGroup();
    LMap.Initialized = false;
    LMap.lMap = null;
    LMap.lMapLayers = {};
    LMap.sideBarVisibility = READSB.eSideBarVisibility.Normal;
    LMap.mapViewBounds = null;
    READSB.LMap = LMap;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiLMap.js.map