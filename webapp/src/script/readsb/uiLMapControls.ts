// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiLMapControls.ts: Custom controls for leaflet map.
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
     * Create a leaflet map button control.
     */
    class Button extends L.Control implements L.Control.Button {
        public options: L.ButtonOptions;
        constructor(options?: L.ButtonOptions) {
            super(options);
            this.options = options;
        }

        /**
         * Add button control to given map.
         * @param map object
         */
        public onAdd(map: L.Map): HTMLElement {
            const btn = L.DomUtil.create("button");
            if (this.options.text !== null && this.options.text !== undefined) {
                btn.innerText = this.options.text;
            }

            if (this.options.title !== null && this.options.title !== undefined) {
                btn.title = this.options.title;
            }

            if (this.options.callback !== null && this.options.callback !== undefined) {
                L.DomEvent.on(btn, "click", this.options.callback);
            }

            if (this.options.classes !== null && this.options.classes !== undefined) {
                if (typeof this.options.classes === "string") {
                    btn.classList.add(this.options.classes);
                } else if (Array.isArray(this.options.classes)) {
                    this.options.classes.forEach((v: string) => {
                        btn.classList.add(v);
                    });
                }
            }
            return btn;
        }

        public onRemove(map: L.Map) {
            // Nothing to do here
        }
    }

    /**
     * Create grouped layers selector control.
     * Based on leaflet.groupedlayerscontrols.js by Ishmael Smyrnow
     * https://github.com/ismyrnow/leaflet-groupedlayercontrol
     *
     * Ported to Typescript and modified to group both, base and overlay layers.
     * Simplified and with support for input click event.
     */
    class GroupedLayers extends L.Control implements L.Control.GroupedLayers {
        public options: L.GroupedLayersOptions = {
            autoZIndex: true,
            collapsed: true,
            onClickCallback: null,
            position: "topright",
        };

        private layers: L.GroupedLayersCollection;
        private lastZIndex: number;
        private groupList: string[];
        private domGroups: HTMLElement[];
        private container: HTMLElement;
        private layerListHtml: HTMLElement;
        private map: L.Map;

        constructor(layers: L.GroupedLayersCollection, options?: L.GroupedLayersOptions) {
            super(options);
            if (options !== null && options !== undefined) {
                this.options = options;
            }

            L.Util.setOptions(this, options);

            this.layers = layers;
            this.lastZIndex = 0;
            this.groupList = [];
            this.domGroups = [];
        }

        /**
         * Add grouped layers control to given map.
         * @param map object
         */
        public onAdd(map: L.Map): HTMLElement {
            this.map = map;
            this.initLayout();
            this.update();

            map.on("layeradd", this.onLayerChange, this);
            map.on("layerremove", this.onLayerChange, this);

            return this.container;
        }

        /**
         * Remove grouped layers control from given map.
         * @param map object
         */
        public onRemove(map: L.Map) {
            map.off("layeradd", this.onLayerChange, this);
            map.off("layerremove", this.onLayerChange, this);
        }

        /**
         * Update grouped layers control depending on content of layers object.
         */
        public update() {
            if (!this.container) {
                return;
            }

            this.layerListHtml.innerHTML = "";
            this.domGroups.length = 0;

            for (const [g, l] of Object.entries(this.layers)) {
                for (const layer of Object.values(l)) {
                    this.addLayerToGroup(layer as L.TileLayer, g);
                }
            }
        }

        /**
         * Layer change event handler.
         * @param e Layer event
         */
        private onLayerChange(e: any) {
            if (e.layer === undefined || e.layer === null) {
                return;
            }

            const l = this.getLayer(L.Util.stamp(e.layer));
            let type;

            if (!l) {
                return;
            }

            if ((l.options as L.ExtLayerOptions).type === "overlay") {
                type = e.type === "layeradd" ? "overlayadd" : "overlayremove";
            } else {
                type = e.type === "layeradd" ? "baselayerchange" : null;
            }

            if (type) {
                this.map.fire(type, l);
            }
        }

        /**
         * Get layer by given id.
         * @param id
         */
        private getLayer(id: number) {
            for (const layers of Object.values(this.layers)) {
                for (const layer of Object.values(layers)) {
                    if (layer && L.Util.stamp(layer) === id) {
                        return layer as L.ExtLayer;
                    }
                }
            }
        }

        /**
         * Initialize grouped layers control layout.
         */
        private initLayout() {
            const className = "leaflet-control-layers";
            const container = this.container = L.DomUtil.create("div", className);

            // Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
            container.setAttribute("aria-haspopup", "true");

            if (L.Browser.touch) {
                L.DomEvent.on(container, "click", L.DomEvent.stopPropagation);
            } else {
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.on(container, "wheel", L.DomEvent.stopPropagation);
            }

            const form = L.DomUtil.create("form", className + "-list") as HTMLFormElement;
            form.id = "leaflet-control-layers-list";

            if (this.options.collapsed) {
                if (!L.Browser.android) {
                    L.DomEvent
                        .on(container, "mouseover", this.expand, this)
                        .on(container, "mouseout", this.collapse, this);
                }
                const link = L.DomUtil.create("a", className + "-toggle", container) as HTMLLinkElement;
                link.href = "#";
                link.title = "Layers";

                if (L.Browser.touch) {
                    L.DomEvent
                        .on(link, "click", L.DomEvent.stop)
                        .on(link, "click", this.expand, this);
                } else {
                    L.DomEvent.on(link, "focus", this.expand, this);
                }

                this.map.on("click", this.collapse, this);
            } else {
                this.expand();
            }

            this.layerListHtml = L.DomUtil.create("div", className + "-groups", form);
            container.appendChild(form);
        }

        /**
         * Add layer to group with given name.
         * @param layer
         * @param group Group name
         */
        private addLayerToGroup(layer: L.TileLayer, group: string) {
            group = group || "";
            let id = this.groupList.indexOf(group);

            if (id === -1) {
                id = this.groupList.push(group) - 1;
            }

            (layer.options as L.ExtLayerOptions).group = {
                id,
                name: group,
            };

            if (this.options.autoZIndex && layer.setZIndex) {
                this.lastZIndex++;
                layer.setZIndex(this.lastZIndex);
            }
            this.addItem(layer);
        }

        /**
         * Create radio type element.
         * @param name Element name
         * @param checked Checked status
         */
        private createRadioElement(name: string, checked: boolean): HTMLInputElement {
            const radio = document.createElement("input") as HTMLInputElement;
            radio.type = "radio";
            radio.name = name;
            radio.classList.add("leaflet-control-layers-radio");
            if (checked) {
                radio.checked = true;
            }
            return radio;
        }

        /**
         * Add item to grouped layers list.
         * @param map The Map object
         * @param layer A layer
         */
        private addItem(layer: L.TileLayer) {
            const label = document.createElement("label") as HTMLLabelElement;
            let input;
            let container;
            const layOpt = layer.options as L.ExtLayerOptions;

            if (layOpt.isActive && !this.map.hasLayer(layer)) {
                this.map.addLayer(layer);
            } else if (!layOpt.isActive && this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }

            const checked = this.map.hasLayer(layer);

            if (layOpt.type === "overlay") {
                input = document.createElement("input") as HTMLInputElement;
                input.type = "checkbox";
                input.className = "leaflet-control-layers-checkbox";
                input.defaultChecked = checked;
            } else {
                input = this.createRadioElement("leaflet-base-layers", checked);
            }

            input.setAttribute("layerId", L.Util.stamp(layer).toString());
            input.setAttribute("groupID", layOpt.group.id.toString());
            input.id = layOpt.name;
            L.DomEvent.on(input, "click", this.onInputClick, this);
            if (this.options.onClickCallback !== undefined && this.options.onClickCallback !== null) {
                L.DomEvent.on(input, "click", this.options.onClickCallback, layer);
            }

            const name = document.createElement("span") as HTMLSpanElement;
            name.innerHTML = " " + layOpt.title;

            label.appendChild(input);
            label.appendChild(name);

            container = this.layerListHtml;

            let groupContainer = this.domGroups[layOpt.group.id];

            // Create the group container if it doesn't exist
            if (!groupContainer) {
                groupContainer = document.createElement("div") as HTMLDivElement;
                groupContainer.classList.add("leaflet-control-layers-group");
                groupContainer.id = `leaflet-control-layers-group-${layOpt.group.id}`;

                const groupLabel = document.createElement("label") as HTMLLabelElement;
                groupLabel.classList.add("leaflet-control-layers-group-label");

                const groupName = document.createElement("span") as HTMLSpanElement;
                groupName.className = "leaflet-control-layers-group-name";
                groupName.innerHTML = layOpt.group.name;
                groupLabel.appendChild(groupName);

                groupContainer.appendChild(groupLabel);
                container.appendChild(groupContainer);

                this.domGroups[layOpt.group.id] = groupContainer;
            }

            container = groupContainer;
            container.appendChild(label);
            return label;
        }

        /**
         * Select new layer on click of grouped layers radio or checkbox elements.
         * @param e Mouse event
         */
        private onInputClick(e: Event) {
            const inputs = document.getElementById("leaflet-control-layers-list").getElementsByTagName("input");
            for (const i of inputs) {
                const layer = this.getLayer(Number.parseInt(i.getAttribute("layerid"), 10));
                if (i.checked && !this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                } else if (!i.checked && this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                }
            }
        }

        /**
         * Expand grouped layers control.
         */
        private expand() {
            L.DomUtil.addClass(this.container, "leaflet-control-layers-expanded");
            // permits to have a scrollbar if overlays heighter than the map.
            const acceptableHeight = this.map.getSize().y - (this.container.offsetTop * 4);
            const e = document.getElementById("leaflet-control-layers-list") as HTMLFormElement;

            if (acceptableHeight < e.clientHeight) {
                e.classList.add("leaflet-control-layers-scrollbar");
                e.style.height = `${acceptableHeight}px`;
            }
        }

        /**
         * Collapse grouped layers control.
         */
        private collapse() {
            this.container.className = this.container.className.replace(" leaflet-control-layers-expanded", "");
        }
    }

    // Add controls to leaflet control namespace.
    L.control.button = (...args: any[]) => new Button(...args);
    L.control.groupedLayers = (layers, options?) => new GroupedLayers(layers, options);
}
