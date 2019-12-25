"use strict";
var READSB;
(function (READSB) {
    class Filter {
        static Initialize() {
            READSB.AircraftFilterCollection.forEach((value, index) => {
                const opt = new Option();
                opt.value = index.toString();
                opt.setAttribute("data-i18n", value.I18n);
                document.getElementById("filterSelector").append(opt);
            });
            document.getElementById("enableFilterCheck").checked = READSB.AppSettings.EnableFilter;
            document.getElementById("enableFilterCheck").addEventListener("change", (e) => {
                READSB.AppSettings.EnableFilter = e.target.checked;
                READSB.AircraftCollection.Refresh();
                READSB.Body.RefreshSelectedAircraft();
            });
            document.getElementById("highlightFilterCheck").checked = READSB.AppSettings.EnableHighlightFilter;
            document.getElementById("highlightFilterCheck").addEventListener("change", (e) => {
                READSB.AppSettings.EnableHighlightFilter = e.target.checked;
                READSB.AircraftCollection.Refresh();
                READSB.Body.RefreshSelectedAircraft();
            });
            document.getElementById("addFilterButton").addEventListener("click", this.OnFilterAddClick.bind(this));
            document.getElementById("filterSelector").addEventListener("change", this.OnFilterSelectorChange);
        }
        static RefreshFilterList() {
            const li = document.getElementById("filterList").childNodes;
            if (li.length === 0) {
                return;
            }
            const f = Number.parseInt(document.getElementById("filterList").lastChild.value, 10);
            const filterHandler = READSB.AircraftFilterCollection[f];
            li.forEach((cn) => {
                cn.childNodes.forEach((ccn) => {
                    const e = ccn;
                    if (e.id === "altUnit") {
                        e.innerText = READSB.Strings.AltitudeUnit;
                    }
                    if (e.id === "distUnit") {
                        e.innerText = READSB.Strings.DistanceUnit;
                    }
                    if (f === READSB.eAircraftFilterType.Altitude || f === READSB.eAircraftFilterType.Distance) {
                        if (e.id === "inputValue1" && filterHandler.Value1 !== undefined) {
                            e.value = filterHandler.Value1.toFixed(filterHandler.DecimalPlaces);
                        }
                        if (e.id === "inputValue2" && filterHandler.Value2 !== undefined) {
                            e.value = filterHandler.Value2.toFixed(filterHandler.DecimalPlaces);
                        }
                    }
                });
            });
        }
        static RestoreSessionFilters() {
            for (const v of Object.values(READSB.eAircraftFilterType)) {
                READSB.Database.GetSetting(v)
                    .then((result) => {
                    const filterHandler = READSB.AircraftFilterCollection[result.key];
                    if (result.condition !== undefined) {
                        filterHandler.Condition = result.condition;
                    }
                    if (result.isActive !== undefined) {
                        filterHandler.IsActive = result.isActive;
                    }
                    if (result.Value1 !== undefined) {
                        filterHandler.Value1 = result.Value1;
                    }
                    if (result.Value2 !== undefined) {
                        filterHandler.Value2 = result.Value2;
                    }
                    this.AddFilterListEntry(result.key, filterHandler.Condition, filterHandler.Value1, filterHandler.Value2);
                });
            }
        }
        static OnFilterAddClick() {
            const e = document.getElementById("filterSelector");
            const v = e.options[e.selectedIndex].value;
            if (v === "" || v === null || v === undefined) {
                return;
            }
            this.AddFilterListEntry(Number.parseInt(v, 10), null, "", "");
        }
        static AddFilterListEntry(key, condition, v1, v2) {
            let i;
            let l;
            let tb;
            let sel;
            if (typeof key === typeof READSB.eAircraftFilterType && key < 0) {
                return;
            }
            const filterHandler = READSB.AircraftFilterCollection[key];
            if (filterHandler.IsActive === true) {
                return;
            }
            const li = document.createElement("li");
            li.className = "form-inline";
            let label = document.createElement("label");
            label.innerText = i18next.t(filterHandler.I18n);
            label.setAttribute("data-i18n", filterHandler.I18n);
            label.className = "custom-control-label col-form-label-sm";
            li.appendChild(label);
            l = filterHandler.FilterConditions.length;
            if (l > 0) {
                sel = document.createElement("select");
                sel.id = "filterCondition";
                sel.className = "custom-select custom-select-sm col-auto";
                for (i = 0; i < l; i++) {
                    const x = filterHandler.FilterConditions[i];
                    const opt = new Option();
                    opt.value = READSB.ConditionList[x].Value.toString();
                    opt.text = i18next.t(READSB.ConditionList[x].I18n);
                    opt.setAttribute("data-i18n", READSB.ConditionList[x].I18n);
                    sel.append(opt);
                }
                if (condition !== null) {
                    sel.value = condition.toString();
                }
                else {
                    sel.value = filterHandler.Condition.toString();
                }
                li.appendChild(sel);
            }
            switch (filterHandler.MatchType) {
                case READSB.eFilterMatchType.OnOff:
                    li.className = "custom-control custom-checkbox";
                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.id = filterHandler.Label;
                    cb.className = "custom-control-input";
                    cb.checked = v1;
                    label.setAttribute("for", filterHandler.Label);
                    li.insertBefore(cb, label);
                    break;
                case READSB.eFilterMatchType.TextMatch:
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue1";
                    tb.value = v1;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    break;
                case READSB.eFilterMatchType.NumberRange:
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue1";
                    tb.value = v1;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    li.append(` ${i18next.t("filter.and")} `);
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue2";
                    tb.value = v2;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    if (key === READSB.eAircraftFilterType.Distance) {
                        label = document.createElement("label");
                        label.innerText = READSB.Strings.DistanceUnit;
                        label.id = "distUnit";
                        label.className = "unit";
                        li.appendChild(label);
                    }
                    else if (key === READSB.eAircraftFilterType.Altitude) {
                        label = document.createElement("label");
                        label.innerText = READSB.Strings.AltitudeUnit;
                        label.id = "altUnit";
                        label.className = "unit";
                        li.appendChild(label);
                    }
                    break;
                case READSB.eFilterMatchType.EnumMatch:
                    sel = document.createElement("select");
                    sel.id = "inputValue1";
                    sel.className = "custom-select custom-select-sm col-auto";
                    l = filterHandler.EnumValues.length;
                    for (i = 0; i < l; i++) {
                        const x = filterHandler.FilterConditions[i];
                        const opt = new Option();
                        opt.value = filterHandler.EnumValues[i].Value.toString();
                        opt.text = i18next.t(filterHandler.EnumValues[i].I18n);
                        opt.setAttribute("data-i18n", filterHandler.EnumValues[i].I18n);
                        sel.append(opt);
                    }
                    if (v1 !== null && condition !== null) {
                        sel.value = condition.toString();
                    }
                    li.appendChild(sel);
                    break;
                default:
                    break;
            }
            const btn = document.createElement("button");
            btn.type = "button";
            btn.value = key.toString();
            btn.className = "btn btn-danger btn-sm mx-sm-1 btn-trash";
            btn.addEventListener("click", this.OnFilterRemove);
            li.appendChild(btn);
            document.getElementById("filterList").appendChild(li);
            filterHandler.IsActive = true;
            document.getElementById("addFilterButton").setAttribute("disabled", "disabled");
            for (const e of li.getElementsByTagName("*")) {
                e.addEventListener("change", this.OnFilterChange);
            }
        }
        static OnFilterSelectorChange(e) {
            const filterHandler = READSB.AircraftFilterCollection[e.target.value];
            if (filterHandler.IsActive === true) {
                document.getElementById("addFilterButton").setAttribute("disabled", "disabled");
            }
            else {
                document.getElementById("addFilterButton").removeAttribute("disabled");
            }
        }
        static OnFilterRemove(e) {
            const v = e.target.value;
            READSB.AircraftFilterCollection[v].IsActive = false;
            READSB.AircraftFilterCollection[v].Value1 = undefined;
            READSB.AircraftFilterCollection[v].Value2 = undefined;
            if (document.getElementById("filterSelector").value === v) {
                document.getElementById("addFilterButton").removeAttribute("disabled");
            }
            e.target.parentNode.remove();
            READSB.Database.DeleteSetting(`Filter${v}`);
            READSB.AircraftCollection.Refresh();
            READSB.Body.RefreshSelectedAircraft();
        }
        static OnFilterChange(e) {
            const id = e.target.id;
            const type = e.target.type;
            const filterHandler = READSB.AircraftFilterCollection[e.target.parentNode.lastChild.value];
            if (type === "checkbox") {
                filterHandler.Value1 = e.target.checked;
                filterHandler.Validate();
                e.target.checked = filterHandler.Value1;
            }
            else if (type === "text" || type === "select-one") {
                switch (id) {
                    case "inputValue1":
                        filterHandler.Value1 = e.target.value;
                        filterHandler.Validate();
                        e.target.value = filterHandler.Value1;
                        break;
                    case "inputValue2":
                        filterHandler.Value2 = e.target.value;
                        filterHandler.Validate();
                        e.target.value = filterHandler.Value2;
                        break;
                    case "filterCondition":
                        filterHandler.Condition = Number(e.target.value);
                        break;
                    default:
                        break;
                }
            }
            if (filterHandler !== undefined) {
                const f = {
                    condition: filterHandler.Condition,
                    isActive: filterHandler.IsActive,
                    key: filterHandler.Type,
                    Value1: filterHandler.Value1,
                    Value2: filterHandler.Value2,
                };
                READSB.Database.PutSetting(`Filter${filterHandler.Type}`, f);
            }
            READSB.AircraftCollection.Refresh();
            READSB.Body.RefreshSelectedAircraft();
        }
    }
    READSB.Filter = Filter;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiFilter.js.map