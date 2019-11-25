// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiLMap.ts: User interface map generation using leaflet.
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
     * Use LMap here because Map is already an existing class in Typescript
     */
    export class LMap {
        public static AircraftPositions = new L.FeatureGroup();
        public static AircraftTrails = new L.FeatureGroup();

        public static Init() {
            // Create map
            this.lMap = L.map("lMapCanvas", {
                doubleClickZoom: false,
            }).setView([AppSettings.CenterLat, AppSettings.CenterLon], AppSettings.ZoomLevel);

            // Add custom button controls to map.
            L.control.button({
                callback: this.OnHideSidebarButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-hide-sidepanel"],
                position: "topright",
                title: "Hide Sidepanel",
            }).addTo(this.lMap);

            L.control.button({
                callback: this.OnExpandSidebarButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-expand-sidepanel"],
                position: "topright",
                title: "Expand Sidepanel",
            }).addTo(this.lMap);

            L.control.button({
                callback: this.OnSelectAllButtonClick,
                classes: ["leaflet-btn-control", "leaflet-btn-select-all"],
                position: "topright",
                title: "Select All Aircraft",
            }).addTo(this.lMap);

            L.control.button({
                callback: this.OnDeSelectAllButtonClick,
                classes: ["leaflet-btn-control", "leaflet-btn-deselect-all"],
                position: "topright",
                title: "Deselect All Aircraft",
            }).addTo(this.lMap);

            L.control.button({
                callback: this.OnResetButtonClick.bind(this),
                classes: ["leaflet-btn-control", "leaflet-btn-reset-map"],
                position: "topright",
                title: "Reset Map",
            }).addTo(this.lMap);

            // Create base layers
            const bl = LMapLayers.CreateBaseLayers();
            // Create site and site circles layer
            const sl = LMapLayers.CreateSiteCircleLayer();
            // Merge all layers
            this.lMapLayers = { ...bl, ...sl };

            // Mark layers used in last session active.
            // Actives are added to map during grouped layers control processing.
            for (const layers of Object.values(this.lMapLayers)) {
                layers.forEach((l: L.TileLayer) => {
                    const o = l.options as L.ExtLayerOptions;
                    if (o.name === AppSettings.BaseLayer) {
                        o.isActive = true;
                    }
                    if (AppSettings.OverlayLayers !== undefined) {
                        AppSettings.OverlayLayers.forEach((v: string) => {
                            if (o.name === v) {
                                o.isActive = true;
                            }
                        });
                    }
                });
            }

            // Add layer control to map.
            this.groupedLayersControl = L.control.groupedLayers(this.lMapLayers, {
                autoZIndex: true,
                collapsed: true,
                onClickCallback: this.OnGroupedLayersControlClick,
                position: "topright",
            }).addTo(this.lMap);

            // Add aircraft positions and trails layers to map
            this.AircraftPositions.addTo(this.lMap);
            this.AircraftTrails.addTo(this.lMap);

            // Add event listeners to map.
            this.lMap.addEventListener("click dblclick", this.OnMapClick);
            this.lMap.addEventListener("moveend", this.OnMapMoveEnd);
            this.lMap.addEventListener("zoomend", this.OnMapZoomEnd);
            this.lMap.addEventListener("overlayadd overlayremove layeradd", this.OnMapLayerChange);
        }

        /**
         * Create site marker and site circles on external request.
         * Such as site position or circles distance change.
         */
        public static CreateSiteCircles() {
            // Remove old site circles layers
            if (this.lMapLayers.hasOwnProperty("Features")) {
                this.lMapLayers["Features"].forEach((l: L.TileLayer, i: number) => {
                    if (this.lMap.hasLayer(l)) {
                        this.lMap.removeLayer(l);
                    }
                });
                delete this.lMapLayers["Features"];
            }
            // Create new
            const sl = LMapLayers.CreateSiteCircleLayer();
            // and add to map
            if (sl.hasOwnProperty("Features")) {
                this.lMapLayers = Object.assign(this.lMapLayers, sl);
                this.lMapLayers["Features"].forEach((l: L.TileLayer) => {
                    const o = l.options as L.ExtLayerOptions;
                    // Activate altitude chart, site and site circles when they are selected by user
                    if (AppSettings.ShowSite && o.name === "site") {
                        o.isActive = true;
                    }
                    if (AppSettings.ShowSiteCircles && o.name === "sitecircles") {
                        o.isActive = true;
                    }
                    if (AppSettings.ShowAltitudeChart && o.name === "altchart") {
                        o.isActive = true;
                    }
                });
            }
            this.groupedLayersControl.update();
        }

        /**
         * Returns the distance between two geographical coordinates according to
         * the maps CRS. By default this measures distance in meters.
         * @param p1 Point 1
         * @param p2 Point 2
         */
        public static GetDistance(p1: L.LatLng, p2: L.LatLng): number {
            if (this.lMap !== null && p1 !== null && p2 !== null) {
                return this.lMap.distance(p1, p2);
            }
            return Number.NaN;
        }

        /**
         * Get or set map zoom level.
         */
        static get ZoomLevel(): number {
            return this.lMap.getZoom();
        }
        static set ZoomLevel(value: number) {
            if (this.lMap !== null) {
                this.lMap.setZoom(value);
            }
        }

        /**
         * Get or set map center.
         */
        static get Center(): L.LatLng {
            return this.lMap.getCenter();
        }
        static set Center(value: L.LatLng) {
            if (this.lMap !== null) {
                this.lMap.flyTo(value);
            }
        }

        private static lMap: L.Map = null; // Main map object.
        private static groupedLayersControl: L.Control.GroupedLayers;
        private static lMapLayers: L.GroupedLayersCollection = {};
        private static sideBarVisibility: eSideBarVisibility = eSideBarVisibility.Normal;

        /**
         * Handle reset button click on map.
         * @param e Mouse Event
         */
        private static OnResetButtonClick(e: MouseEvent) {
            this.lMap.setView([AppSettings.SiteLat, AppSettings.SiteLon], AppSettings.ZoomLevel);
            e.stopImmediatePropagation();
        }

        /**
         * Handle expand sidebar button click on map.
         * @param e Mouse Event
         */
        private static OnExpandSidebarButtonClick(e: MouseEvent) {
            if (this.sideBarVisibility === eSideBarVisibility.Normal) {
                Body.AircraftListSetColumnVisibility(true);
                this.sideBarVisibility = eSideBarVisibility.Expanded;
            } else if (this.sideBarVisibility === eSideBarVisibility.Hidden) {
                document.getElementById("sidebarContainer").classList.remove("hidden");
                Body.AircraftListSetColumnVisibility(false);
                this.sideBarVisibility = eSideBarVisibility.Normal;
            }
            this.lMap.invalidateSize();
            e.stopImmediatePropagation();
        }

        /**
         * Handle hide sidebar button click on map.
         * @param e Mouse Event
         */
        private static OnHideSidebarButtonClick(e: MouseEvent) {
            if (this.sideBarVisibility === eSideBarVisibility.Normal) {
                document.getElementById("sidebarContainer").classList.add("hidden");
                this.sideBarVisibility = eSideBarVisibility.Hidden;
            } else if (this.sideBarVisibility === eSideBarVisibility.Expanded) {
                Body.AircraftListSetColumnVisibility(false);
                this.sideBarVisibility = eSideBarVisibility.Normal;
            }
            this.lMap.invalidateSize();
            e.stopImmediatePropagation();
        }

        /**
         * Handle select all button click on map.
         * @param e Mouse Event
         */
        private static OnSelectAllButtonClick(e: MouseEvent) {
            AircraftCollection.SelectAll = true;
            e.stopImmediatePropagation();
        }

        /**
         * Handle deselect all button click on map.
         * @param e Mouse Event
         */
        private static OnDeSelectAllButtonClick(e: MouseEvent) {
            AircraftCollection.SelectAll = false;
            e.stopImmediatePropagation();
        }

        /**
         * Handle single and double click on map.
         * @param e LMap object
         */
        private static OnMapClick(e: L.LeafletMouseEvent) {
            AircraftCollection.SelectAll = false;
            e.originalEvent.stopImmediatePropagation();
        }

        /**
         * Handle when center of map has been changed.
         * @param e LMap object
         */
        private static OnMapMoveEnd(e: L.LeafletEvent) {
            const c = (e.target as L.Map).getCenter();
            AppSettings.CenterLat = c.lat;
            AppSettings.CenterLon = c.lng;
        }

        /**
         * Handle when map has been zoomed.
         * @param e LMap object
         */
        private static OnMapZoomEnd(e: L.LeafletEvent) {
            AppSettings.ZoomLevel = (e.target as L.Map).getZoom();
        }

        /**
         * Track map layer changes and save in app settings to restore on load.
         * @param e Layer event with layer that has been added or removed.
         */
        private static OnMapLayerChange(e: any) {
            // We cannot push and slice directly on AppSettings.OverlayLayers here because then the setter
            // will never be called and indexedDB never updated.
            const ol = AppSettings.OverlayLayers;
            switch (e.type) {
                case "layeradd":
                    if (((e.layer as L.ExtLayer).options as L.ExtLayerOptions).type === "base") {
                        AppSettings.BaseLayer = ((e.layer as L.ExtLayer).options as L.ExtLayerOptions).name;
                    }
                    break;
                case "overlayadd":
                    ol.push(((e as L.ExtLayer).options as L.ExtLayerOptions).name);
                    break;
                case "overlayremove":
                    const i = AppSettings.OverlayLayers.indexOf(((e as L.ExtLayer).options as L.ExtLayerOptions).name);
                    if (i !== -1 && ((e as L.ExtLayer).options as L.ExtLayerOptions).type === "overlay") {
                        ol.splice(i, 1);
                    }
                    break;
                default:
                    break;
            }
            // Save overlay layers to indexedDB by calling its setter.
            AppSettings.OverlayLayers = ol;
        }

        /**
         * Save features layer selection in app settings to restore on load.
         * @param e Mouse Event with clicked input target
         */
        private static OnGroupedLayersControlClick(e: any) {
            const input = e.target as HTMLInputElement;
            if (input.id === "site") {
                AppSettings.ShowSite = input.checked;
            } else if (input.id === "sitecircles") {
                AppSettings.ShowSiteCircles = input.checked;
            } else if (input.id === "altchart") {
                let checked = input.checked;
                // Don't show altitude chart when we use custom colors
                if (AppSettings.ColorsByAlt.IsDefault === false) {
                    checked = false;
                }
                AppSettings.ShowAltitudeChart = checked;
                if (checked) {
                    document.getElementById("altitudeChart").classList.remove("hidden");
                } else {
                    document.getElementById("altitudeChart").classList.add("hidden");
                }
            }
        }
    }
}
