// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiMapAircraftMarker.ts: Class providing a single aircraft marker object.
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
    /**
     * AircraftMarker is used to display clickable aircraft icons on the map. Extends L.Marker.
     */
    class AircraftMarker extends L.Marker implements L.AircraftMarker {
        public options: L.AircraftMarkerOptions = {
            alt: "",
            autoPan: false,
            autoPanPadding: [50, 50],
            autoPanSpeed: 10,
            bubblingMouseEvents: false,
            draggable: false,
            icao: "",
            icon: new L.Icon.Default(),
            interactive: true,
            keyboard: true,
            opacity: 1,
            pane: "markerPane",
            riseOffset: 250,
            riseOnHover: false,
            rotateWithView: false,
            rotation: 0,
            scale: 1.0,
            shadowPane: "shadowPane",
            title: "",
            zIndexOffset: 0,
        };

        private latlng: L.LatLng;
        private icao: string;
        private icon: HTMLImageElement;
        private zIndex: number;
        private map: L.Map;
        private shadow: HTMLImageElement;
        private popup: L.Popup;
        private scale: number;
        private rotation: number;

        constructor(latlng: L.LatLngExpression, options?: L.AircraftMarkerOptions) {
            super(latlng, options);
            L.Util.setOptions(this, options);
            this.latlng = L.latLng(latlng);
            this.scale = options.scale;
            this.rotation = options.rotation;
            this.icao = options.icao;
        }

        /**
         * Callback when marker is added to map.
         * @param map Leaflet map object.
         */
        public onAdd(map: L.Map) {
            this.map = map;
            this.InitIcon();
            this.update();
            return this;
        }

        /**
         * Callback when marker is removed from map.
         * @param map Leaflet map object.
         */
        public onRemove(map: L.Map) {
            this.RemoveIcon();
            this.RemoveShadow();
            this.latlng = null;
            this.map = null;
            return this;
        }

        /**
         * Return marker events.
         */
        public getEvents() {
            return {
                viewreset: this.update,
                zoom: this.update,
            };
        }

        /**
         * Returns the current geographical position of the marker.
         */
        public getLatLng(): L.LatLng {
            return this.latlng;
        }

        /**
         * Changes the marker position to the given point.
         * @param latlng new geographical position.
         */
        public setLatLng(latlng: L.LatLng) {
            this.latlng = L.latLng(latlng);
            this.update();
            return this;
        }

        /**
         * Change the marker geographical position, its scale and rotation.
         * @param latlng New geographical position.
         * @param scale Scale value.
         * @param rotation Rotation value in degree.
         */
        public SetLatLngScaleRotation(latlng: L.LatLng, scale: number, rotation: number) {
            this.latlng = L.latLng(latlng);
            this.scale = scale;
            this.rotation = rotation;
            this.update();
            return this;
        }

        /**
         * Changes the zIndex offset of the marker.
         * @param offset New zIndex offset value.
         */
        public setZIndexOffset(offset: number) {
            this.options.zIndexOffset = offset;
            return this.update();
        }

        /**
         * Returns the current icon used by the marker.
         */
        public getIcon(): L.Icon<L.IconOptions> | L.DivIcon {
            return this.options.icon;
        }

        /**
         * Changes the marker icon.
         * @param icon New marker icon object.
         */
        public setIcon(icon: L.Icon | L.DivIcon) {
            this.options.icon = icon;

            if (this.map) {
                this.InitIcon();
                this.update();
            }

            if (this.popup) {
                this.bindPopup(this.popup, this.popup.options);
            }
            return this;
        }

        /**
         * Return actual marker icon object.
         */
        public getElement() {
            return this.icon;
        }

        /**
         * Update marker.
         */
        public update() {
            if (this.icon && this.map) {
                const pos = this.map.latLngToLayerPoint(this.latlng).round();
                this.SetPosition(pos);
            }
            return this;
        }

        /**
         * Set marker opacity.
         * @param opacity New opacity value.
         */
        public setOpacity(opacity: number) {
            this.options.opacity = opacity;
            if (this.map) {
                this.UpdateOpacity();
            }
            return this;
        }

        /**
         * Highlight aircraft marker on map depending on selection and alert/ident status.
         * @param selected True when aircraft is selected.
         * @param alert True when flight status alert bit is set.
         * @param ident Truen when flight status special position ident is set.
         */
        public SelectAlertIdent(selected: boolean, alert: boolean, ident: boolean) {
            if (selected && !alert && !ident) {
                this.icon.classList.add("aircraft-marker-selected");
            } else {
                this.icon.classList.remove("aircraft-marker-selected");
            }
            if (alert) {
                // Permanent or temporary alert condition
                this.icon.classList.add("aircraft-marker-selected", "alert-blink");
            } else if (ident) {
                // Special position identification
                this.icon.classList.add("aircraft-marker-selected", "ident-blink");
            } else {
                this.icon.classList.remove("alert-blink", "ident-blink");
            }
        }

        /**
         * Initialize marker icon object.
         */
        private InitIcon() {
            const options = this.options;

            const icon = options.icon.createIcon(this.icon) as HTMLImageElement;
            let addIcon = false;

            // if we're not reusing the icon, remove the old one and init new one
            if (icon !== this.icon) {
                if (this.icon) {
                    this.RemoveIcon();
                }
                addIcon = true;

                if (options.title) {
                    icon.title = options.title;
                }

                if (icon.tagName === "IMG") {
                    icon.alt = options.alt || "";
                }
            }

            if (options.keyboard) {
                icon.tabIndex = 0;
            }

            this.icon = icon;

            if (options.riseOnHover) {
                this.on({
                    mouseout: this.ResetZIndex,
                    mouseover: this.BringToFront,
                });
            }

            const newShadow = options.icon.createShadow(this.shadow) as HTMLImageElement;
            let addShadow = false;

            if (newShadow !== this.shadow) {
                this.RemoveShadow();
                addShadow = true;
            }

            if (newShadow) {
                newShadow.alt = "";
            }
            this.shadow = newShadow;

            if (options.opacity < 1) {
                this.UpdateOpacity();
            }

            if (addIcon) {
                this.getPane().appendChild(this.icon);
            }
            this.InitInteraction();
            if (newShadow && addShadow) {
                this.getPane(options.shadowPane).appendChild(this.shadow);
            }
        }

        /**
         * Remove icon from marker.
         */
        private RemoveIcon() {
            if (this.options.riseOnHover) {
                this.off({
                    mouseout: this.ResetZIndex,
                    mouseover: this.BringToFront,
                });
            }

            const p = this.icon.parentNode;
            if (p) {
                p.removeChild(this.icon);
            }
            this.icon.removeEventListener("mouseout", this.CloseToolTip);
            this.icon.removeEventListener("mouseover", this.OpenToolTip);
            this.icon.removeEventListener("click", this.OnClick);
            this.icon = null;
        }

        /**
         * Add event listeners to this marker.
         * These will show&hide the tooltip and handle click events.
         */
        private InitInteraction() {
            if (!this.options.interactive) { return; }
            this.icon.classList.add("leaflet-interactive");
            this.icon.addEventListener("mouseover", this.OpenToolTip.bind(this));
            this.icon.addEventListener("mouseout", this.CloseToolTip.bind(this));
            this.icon.addEventListener("click", this.OnClick.bind(this));
        }

        /**
         * Show marker tooltip.
         */
        private OpenToolTip() {
            this.openTooltip(this.latlng);
        }

        /**
         * Hide marker tooltip.
         */
        private CloseToolTip() {
            this.closeTooltip();
        }

        /**
         * Handle marker click events.
         * @param e Mouse click event
         */
        private OnClick(e: any) {
            e.stopImmediatePropagation();
            Body.SelectAircraftByHex(this.icao, false);
        }

        /**
         * Remove shadow from marker.
         */
        private RemoveShadow() {
            if (this.shadow) {
                const p = this.icon.parentNode;
                if (p) {
                    p.removeChild(this.shadow);
                }
            }
            this.shadow = null;
        }

        /**
         * Set marker position on map.
         * @param point New marker position.
         */
        private SetPosition(point: L.Point) {
            this.SetPos(this.icon, point);
            if (this.shadow) {
                this.SetPos(this.shadow, point);
            }
            this.zIndex = point.y + this.options.zIndexOffset;
            this.ResetZIndex();
        }

        /**
         * Use transform to place marker on map in reference to upper left corner of map.
         * @param el Marker icon object.
         * @param offset Marker offset in reference to upper left map corner.
         */
        private SetTransform(el: HTMLImageElement, offset: L.Point) {
            const pos = offset || new L.Point(0, 0);
            let transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

            if (this.scale) {
                transform += ` scale(${this.scale})`;
            }

            if (this.rotation) {
                transform += ` rotateZ(${this.rotation}deg)`;
            }

            if (L.Browser.ie3d) {
                transform = `translate(${pos.x}px, ${pos.y}px)`;
            }

            el.style.transform = transform;
        }

        /**
         * Set marker position on map.
         * @param el Marker icon object.
         * @param point New marker position.
         */
        private SetPos(el: HTMLImageElement, point: L.Point) {
            if (L.Browser.any3d) {
                this.SetTransform(el, point);
            } else {
                el.style.left = point.x + "px";
                el.style.top = point.y + "px";
            }
        }

        /**
         * Update marker zIndex.
         * @param offset zIndex offset value.
         */
        private UpdateZIndex(offset: number) {
            this.icon.style.zIndex = (this.zIndex + offset).toString();
        }

        /**
         * Update marker opacity.
         */
        private UpdateOpacity() {
            const opacity = this.options.opacity;

            if (this.icon) {
                this.icon.style.opacity = opacity.toString();
            }

            if (this.shadow) {
                this.shadow.style.opacity = opacity.toString();
            }
        }

        /**
         * Bring marker to front by rising its zIndex offset.
         */
        private BringToFront() {
            this.UpdateZIndex(this.options.riseOffset);
        }

        /**
         * Reset marker zIndex offset.
         */
        private ResetZIndex() {
            this.UpdateZIndex(0);
        }
    }

    L.aircraftMarker = (latlng, options?) => new AircraftMarker(latlng, options);
}
