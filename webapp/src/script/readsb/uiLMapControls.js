"use strict";
var READSB;
(function (READSB) {
    class Button extends L.Control {
        constructor(options) {
            super(options);
            this.options = options;
        }
        onAdd(map) {
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
                }
                else if (Array.isArray(this.options.classes)) {
                    this.options.classes.forEach((v) => {
                        btn.classList.add(v);
                    });
                }
            }
            return btn;
        }
        onRemove(map) {
        }
    }
    class GroupedLayers extends L.Control {
        constructor(layers, options) {
            super(options);
            this.options = {
                autoZIndex: true,
                collapsed: true,
                onClickCallback: null,
                position: "topright",
            };
            if (options !== null && options !== undefined) {
                this.options = options;
            }
            L.Util.setOptions(this, options);
            this.layers = layers;
            this.lastZIndex = 0;
            this.groupList = [];
            this.domGroups = [];
        }
        onAdd(map) {
            this.map = map;
            this.initLayout();
            this.update();
            map.on("layeradd", this.onLayerChange, this);
            map.on("layerremove", this.onLayerChange, this);
            return this.container;
        }
        onRemove(map) {
            map.off("layeradd", this.onLayerChange, this);
            map.off("layerremove", this.onLayerChange, this);
        }
        update() {
            if (!this.container) {
                return;
            }
            const range = document.createRange();
            range.selectNodeContents(this.layerListHtml);
            range.deleteContents();
            this.domGroups.length = 0;
            for (const [g, l] of Object.entries(this.layers)) {
                for (const layer of Object.values(l)) {
                    this.addLayerToGroup(layer, g);
                }
            }
        }
        onLayerChange(e) {
            if (e.layer === undefined || e.layer === null) {
                return;
            }
            const l = this.getLayer(L.Util.stamp(e.layer));
            let type;
            if (!l) {
                return;
            }
            if (l.options.type === "overlay") {
                type = e.type === "layeradd" ? "overlayadd" : "overlayremove";
            }
            else {
                type = e.type === "layeradd" ? "baselayerchange" : null;
            }
            if (type) {
                this.map.fire(type, l);
            }
        }
        getLayer(id) {
            for (const layers of Object.values(this.layers)) {
                for (const layer of Object.values(layers)) {
                    if (layer && L.Util.stamp(layer) === id) {
                        return layer;
                    }
                }
            }
        }
        initLayout() {
            const className = "leaflet-control-layers";
            const container = this.container = L.DomUtil.create("div", className);
            container.setAttribute("aria-haspopup", "true");
            if (L.Browser.touch) {
                L.DomEvent.on(container, "click", L.DomEvent.stopPropagation);
            }
            else {
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.on(container, "wheel", L.DomEvent.stopPropagation);
            }
            const form = L.DomUtil.create("form", className + "-list");
            form.id = "leaflet-control-layers-list";
            if (this.options.collapsed) {
                if (!L.Browser.android) {
                    L.DomEvent
                        .on(container, "mouseover", this.expand, this)
                        .on(container, "mouseout", this.collapse, this);
                }
                const link = L.DomUtil.create("a", className + "-toggle", container);
                link.href = "#";
                link.title = "Layers";
                if (L.Browser.touch) {
                    L.DomEvent
                        .on(link, "click", L.DomEvent.stop)
                        .on(link, "click", this.expand, this);
                }
                else {
                    L.DomEvent.on(link, "focus", this.expand, this);
                }
                this.map.on("click", this.collapse, this);
            }
            else {
                this.expand();
            }
            this.layerListHtml = L.DomUtil.create("div", className + "-groups", form);
            container.appendChild(form);
        }
        addLayerToGroup(layer, group) {
            group = group || "";
            let id = this.groupList.indexOf(group);
            if (id === -1) {
                id = this.groupList.push(group) - 1;
            }
            layer.options.group = {
                id,
                name: group,
            };
            if (this.options.autoZIndex && layer.setZIndex) {
                this.lastZIndex++;
                layer.setZIndex(this.lastZIndex);
            }
            this.addItem(layer);
        }
        createRadioElement(name, checked) {
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = name;
            radio.classList.add("leaflet-control-layers-radio");
            if (checked) {
                radio.checked = true;
            }
            return radio;
        }
        addItem(layer) {
            const label = document.createElement("label");
            let input;
            let container;
            const layOpt = layer.options;
            if (layOpt.isActive && !this.map.hasLayer(layer)) {
                this.map.addLayer(layer);
            }
            else if (!layOpt.isActive && this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
            const checked = this.map.hasLayer(layer);
            if (layOpt.type === "overlay") {
                input = document.createElement("input");
                input.type = "checkbox";
                input.className = "leaflet-control-layers-checkbox";
                input.defaultChecked = checked;
            }
            else {
                input = this.createRadioElement("leaflet-base-layers", checked);
            }
            input.setAttribute("layerId", L.Util.stamp(layer).toString());
            input.setAttribute("groupID", layOpt.group.id.toString());
            input.id = layOpt.name;
            L.DomEvent.on(input, "click", this.onInputClick, this);
            if (this.options.onClickCallback !== undefined && this.options.onClickCallback !== null) {
                L.DomEvent.on(input, "click", this.options.onClickCallback, layer);
            }
            const name = document.createElement("span");
            name.textContent = ` ${layOpt.title}`;
            label.appendChild(input);
            label.appendChild(name);
            container = this.layerListHtml;
            let groupContainer = this.domGroups[layOpt.group.id];
            if (!groupContainer) {
                groupContainer = document.createElement("div");
                groupContainer.classList.add("leaflet-control-layers-group");
                groupContainer.id = `leaflet-control-layers-group-${layOpt.group.id}`;
                const groupLabel = document.createElement("label");
                groupLabel.classList.add("leaflet-control-layers-group-label");
                const groupName = document.createElement("span");
                groupName.className = "leaflet-control-layers-group-name";
                groupName.textContent = layOpt.group.name;
                groupLabel.appendChild(groupName);
                groupContainer.appendChild(groupLabel);
                container.appendChild(groupContainer);
                this.domGroups[layOpt.group.id] = groupContainer;
            }
            container = groupContainer;
            container.appendChild(label);
            return label;
        }
        onInputClick(e) {
            const inputs = document.getElementById("leaflet-control-layers-list").getElementsByTagName("input");
            for (const i of inputs) {
                const layer = this.getLayer(Number.parseInt(i.getAttribute("layerid"), 10));
                if (i.checked && !this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                    layer.options.isActive = true;
                }
                else if (!i.checked && this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                    layer.options.isActive = false;
                }
            }
        }
        expand() {
            L.DomUtil.addClass(this.container, "leaflet-control-layers-expanded");
            const acceptableHeight = this.map.getSize().y - (this.container.offsetTop * 4);
            const e = document.getElementById("leaflet-control-layers-list");
            if (acceptableHeight < e.clientHeight) {
                e.classList.add("leaflet-control-layers-scrollbar");
                e.style.height = `${acceptableHeight}px`;
            }
        }
        collapse() {
            this.container.className = this.container.className.replace(" leaflet-control-layers-expanded", "");
        }
    }
    L.control.button = (...args) => new Button(...args);
    L.control.groupedLayers = (layers, options) => new GroupedLayers(layers, options);
})(READSB || (READSB = {}));
//# sourceMappingURL=uiLMapControls.js.map