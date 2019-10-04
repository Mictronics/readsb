// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiFilter.ts: Class handling aircraft filters in user interface.
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
    export class Filter {
        public static Initialize() {
            AircraftFilterCollection.forEach((value: AircraftFilter, index: number) => {
                (document.getElementById("filterSelector") as HTMLSelectElement).append(new Option(value.Label, index.toString()));
            });

            (document.getElementById("enableFilterCheck") as HTMLInputElement).checked = AppSettings.EnableFilter;
            document.getElementById("enableFilterCheck").addEventListener("change", (e: any) => {
                AppSettings.EnableFilter = e.target.checked;
                // Refresh screen
                AircraftCollection.Refresh();
                Body.RefreshSelectedAircraft();
            });

            (document.getElementById("highlightFilterCheck") as HTMLInputElement).checked = AppSettings.EnableHighlightFilter;
            document.getElementById("highlightFilterCheck").addEventListener("change", (e: any) => {
                AppSettings.EnableHighlightFilter = e.target.checked;
                // Refresh screen
                AircraftCollection.Refresh();
                Body.RefreshSelectedAircraft();
            });
            document.getElementById("addFilterButton").addEventListener("click", this.OnFilterAddClick.bind(this));
            document.getElementById("filterSelector").addEventListener("change", this.OnFilterSelectorChange);
        }

        /* Refresh filter list on display units change */
        public static RefreshFilterList() {
            const li = document.getElementById("filterList").childNodes;
            if (li.length === 0) {
                return;
            }
            const f: eAircraftFilterType = Number.parseInt((document.getElementById("filterList").lastChild as HTMLInputElement).value, 10);
            const filterHandler = AircraftFilterCollection[f];
            li.forEach((cn: ChildNode) => {
                cn.childNodes.forEach((ccn: ChildNode) => {
                    const e = ccn as HTMLInputElement;
                    if (e.id === "altUnit") {
                        e.innerText = Format.GetUnitLabel("altitude", AppSettings.DisplayUnits);
                    }

                    if (e.id === "distUnit") {
                        e.innerText = Format.GetUnitLabel("distance", AppSettings.DisplayUnits);
                    }
                    if (f === eAircraftFilterType.Altitude || f === eAircraftFilterType.Distance) {
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

        /* Restore filters from last session */
        public static RestoreSessionFilters() {
            for (const v of Object.values(eAircraftFilterType)) {
                Database.GetSetting(v)
                    .then((result: any) => {
                        const filterHandler = AircraftFilterCollection[result.key];
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

        /**
         * Add new filter event listener.
         */
        private static OnFilterAddClick() {
            const e = document.getElementById("filterSelector") as HTMLSelectElement;
            const v = e.options[e.selectedIndex].value;
            if (v === "" || v === null || v === undefined) {
                return;
            }
            this.AddFilterListEntry(Number.parseInt(v, 10), null, "", "");
        }

        /**
         * Add new filter to aircraft filter list.
         * @param key Type of aircraft filter.
         * @param condition Filter condition.
         * @param v1 Filter value 1.
         * @param v2 Filter value 2.
         */
        private static AddFilterListEntry(key: eAircraftFilterType, condition: eCondition, v1: any, v2: any) {
            let i;
            let l;
            let tb; // Textbox DOM element
            let sel; // Select DOM element

            if (typeof key === typeof eAircraftFilterType && key < 0) {
                return;
            }

            const filterHandler = AircraftFilterCollection[key];

            if (filterHandler.IsActive === true) {
                return;
            }

            /* Create parent list element */
            const li = document.createElement("li");
            li.className = "form-inline";
            let label = document.createElement("label");
            label.innerText = filterHandler.Label;
            label.className = "custom-control-label col-form-label-sm";
            li.appendChild(label);

            /* Create condition list*/
            l = filterHandler.FilterConditions.length;
            if (l > 0) {
                sel = document.createElement("select");
                sel.id = "filterCondition";
                sel.className = "custom-select custom-select-sm col-auto";
                for (i = 0; i < l; i++) {
                    const x = filterHandler.FilterConditions[i];
                    sel.append(new Option(ConditionList[x].Text, ConditionList[x].Value.toString()));
                }
                if (condition !== null) {
                    sel.value = condition.toString();
                } else {
                    sel.value = filterHandler.Condition.toString();
                }
                li.appendChild(sel);
            }

            /* Create input mask depending on filter type */
            switch (filterHandler.MatchType) {
                // Checkbox type filter
                case eFilterMatchType.OnOff:
                    li.className = "custom-control custom-checkbox";
                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.id = filterHandler.Label;
                    cb.className = "custom-control-input";
                    cb.checked = v1;
                    label.setAttribute("for", filterHandler.Label);
                    li.insertBefore(cb, label);
                    break;
                // Single textbox type filter
                case eFilterMatchType.TextMatch:
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue1";
                    tb.value = v1;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    break;
                // Dual textbox type filter
                case eFilterMatchType.NumberRange:
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue1";
                    tb.value = v1;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    li.append(" and ");
                    tb = document.createElement("input");
                    tb.type = "text";
                    tb.id = "inputValue2";
                    tb.value = v2;
                    tb.className = `form-control form-control-sm mx-sm-1 ${filterHandler.InputWidth}`;
                    li.appendChild(tb);
                    if (key === eAircraftFilterType.Distance) {
                        label = document.createElement("label");
                        label.innerText = Format.GetUnitLabel("distance", AppSettings.DisplayUnits);
                        label.id = "distUnit";
                        label.className = "unit";
                        li.appendChild(label);
                    } else if (key === eAircraftFilterType.Altitude) {
                        label = document.createElement("label");
                        label.innerText = Format.GetUnitLabel("altitude", AppSettings.DisplayUnits);
                        label.id = "altUnit";
                        label.className = "unit";
                        li.appendChild(label);
                    }
                    break;
                // Select drop-down type filter
                case eFilterMatchType.EnumMatch:
                    sel = document.createElement("select");
                    sel.id = "inputValue1";
                    sel.className = "custom-select custom-select-sm col-auto";
                    l = filterHandler.EnumValues.length;
                    for (i = 0; i < l; i++) {
                        const x = filterHandler.FilterConditions[i];
                        sel.append(new Option(filterHandler.EnumValues[i].Text, filterHandler.EnumValues[i].Value.toString()));
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
            btn.className = "btn btn-danger btn-sm mx-sm-3 btn-trash";
            btn.addEventListener("click", this.OnFilterRemove);
            li.appendChild(btn);
            document.getElementById("filterList").appendChild(li);
            filterHandler.IsActive = true;
            document.getElementById("addFilterButton").setAttribute("disabled", "disabled");
            // Add change event listener to all elements in this list entry.
            for (const e of li.getElementsByTagName("*")) {
                (e as HTMLInputElement).addEventListener("change", this.OnFilterChange);
            }
        }

        /* Prevent adding a filter that is already in the list */
        private static OnFilterSelectorChange(e: any) {
            /* Each filter can be added only once */
            const filterHandler = AircraftFilterCollection[e.target.value];
            if (filterHandler.IsActive === true) {
                document.getElementById("addFilterButton").setAttribute("disabled", "disabled");
            } else {
                document.getElementById("addFilterButton").removeAttribute("disabled");
            }
        }

        /* Remove filter from list */
        private static OnFilterRemove(e: any) {
            /* Enable filter again when removed from list */
            const v = e.target.value;
            AircraftFilterCollection[v].IsActive = false;
            AircraftFilterCollection[v].Value1 = undefined;
            AircraftFilterCollection[v].Value2 = undefined;
            if ((document.getElementById("filterSelector") as HTMLSelectElement).value === v) {
                document.getElementById("addFilterButton").removeAttribute("disabled");
            }
            e.target.parentNode.remove();
            Database.DeleteSetting(`Filter${v}`);
            // Refresh screen
            AircraftCollection.Refresh();
            Body.RefreshSelectedAircraft();
        }

        /* Validate inputs and update filter list on user input */
        private static OnFilterChange(e: any) {
            /* Check validity of filter Values and save them */
            const id = (e.target.id as string);
            const type = (e.target.type as string);
            const filterHandler = AircraftFilterCollection[e.target.parentNode.lastChild.value];

            if (type === "checkbox") {
                filterHandler.Value1 = e.target.checked;
                filterHandler.Validate();
                e.target.checked = filterHandler.Value1;
            } else if (type === "text" || type === "select-one") {
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

            /* Save filter settings to indexedDB */
            if (filterHandler !== undefined) {
                const f = {
                    condition: filterHandler.Condition,
                    isActive: filterHandler.IsActive,
                    key: filterHandler.Type,
                    Value1: filterHandler.Value1,
                    Value2: filterHandler.Value2,
                };
                Database.PutSetting(`Filter${filterHandler.Type}`, f);

            }
            // Refresh screen
            AircraftCollection.Refresh();
            Body.RefreshSelectedAircraft();
        }
    }
}
