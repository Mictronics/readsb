"use strict";
var READSB;
(function (READSB) {
    class AircraftMarker extends L.Marker {
        constructor(latlng, options) {
            super(latlng, options);
            this.options = {
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
            L.Util.setOptions(this, options);
            this.latlng = L.latLng(latlng);
            this.scale = options.scale;
            this.rotation = options.rotation;
            this.icao = options.icao;
        }
        onAdd(map) {
            this.map = map;
            this.InitIcon();
            this.update();
            return this;
        }
        onRemove(map) {
            this.RemoveIcon();
            this.RemoveShadow();
            this.latlng = null;
            this.map = null;
            return this;
        }
        getEvents() {
            return {
                viewreset: this.update,
                zoom: this.update,
            };
        }
        getLatLng() {
            return this.latlng;
        }
        setLatLng(latlng) {
            this.latlng = L.latLng(latlng);
            this.update();
            return this;
        }
        SetLatLngScaleRotation(latlng, scale, rotation) {
            this.latlng = L.latLng(latlng);
            this.scale = scale;
            this.rotation = rotation;
            this.update();
            return this;
        }
        setZIndexOffset(offset) {
            this.options.zIndexOffset = offset;
            return this.update();
        }
        getIcon() {
            return this.options.icon;
        }
        setIcon(icon) {
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
        getElement() {
            return this.icon;
        }
        update() {
            if (this.icon && this.map) {
                const pos = this.map.latLngToLayerPoint(this.latlng).round();
                this.SetPosition(pos);
            }
            return this;
        }
        setOpacity(opacity) {
            this.options.opacity = opacity;
            if (this.map) {
                this.UpdateOpacity();
            }
            return this;
        }
        SelectAlertIdent(selected, alert, ident) {
            if (selected && !alert && !ident) {
                this.icon.classList.add("aircraft-marker-selected");
            }
            else {
                this.icon.classList.remove("aircraft-marker-selected");
            }
            if (alert) {
                this.icon.classList.add("aircraft-marker-selected", "alert-blink");
            }
            else if (ident) {
                this.icon.classList.add("aircraft-marker-selected", "ident-blink");
            }
            else {
                this.icon.classList.remove("alert-blink", "ident-blink");
            }
        }
        InitIcon() {
            const options = this.options;
            const icon = options.icon.createIcon(this.icon);
            let addIcon = false;
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
            const newShadow = options.icon.createShadow(this.shadow);
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
        RemoveIcon() {
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
        InitInteraction() {
            if (!this.options.interactive) {
                return;
            }
            this.icon.classList.add("leaflet-interactive");
            this.icon.addEventListener("mouseover", this.OpenToolTip.bind(this));
            this.icon.addEventListener("mouseout", this.CloseToolTip.bind(this));
            this.icon.addEventListener("click", this.OnClick.bind(this));
        }
        OpenToolTip() {
            this.openTooltip(this.latlng);
        }
        CloseToolTip() {
            this.closeTooltip();
        }
        OnClick(e) {
            e.stopImmediatePropagation();
            READSB.Body.SelectAircraftByHex(this.icao, false);
        }
        RemoveShadow() {
            if (this.shadow) {
                const p = this.icon.parentNode;
                if (p) {
                    p.removeChild(this.shadow);
                }
            }
            this.shadow = null;
        }
        SetPosition(point) {
            this.SetPos(this.icon, point);
            if (this.shadow) {
                this.SetPos(this.shadow, point);
            }
            this.zIndex = point.y + this.options.zIndexOffset;
            this.ResetZIndex();
        }
        SetTransform(el, offset) {
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
        SetPos(el, point) {
            if (L.Browser.any3d) {
                this.SetTransform(el, point);
            }
            else {
                el.style.left = point.x + "px";
                el.style.top = point.y + "px";
            }
        }
        UpdateZIndex(offset) {
            this.icon.style.zIndex = (this.zIndex + offset).toString();
        }
        UpdateOpacity() {
            const opacity = this.options.opacity;
            if (this.icon) {
                this.icon.style.opacity = opacity.toString();
            }
            if (this.shadow) {
                this.shadow.style.opacity = opacity.toString();
            }
        }
        BringToFront() {
            this.UpdateZIndex(this.options.riseOffset);
        }
        ResetZIndex() {
            this.UpdateZIndex(0);
        }
    }
    L.aircraftMarker = (latlng, options) => new AircraftMarker(latlng, options);
})(READSB || (READSB = {}));
//# sourceMappingURL=uiMapAircraftMarker.js.map