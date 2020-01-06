// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiInput.ts: Class handling input elements in user interface.
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
    export class Input {
        /**
         * Initialize all setting checkboxes in GUI.
         */
        public static InitializeCheckboxes() {
            document.getElementById("showFlagsCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("showFlagsCheck") as HTMLInputElement).checked = AppSettings.ShowFlags;
            document.getElementById("showAircraftCountCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("showAircraftCountCheck") as HTMLInputElement).checked = AppSettings.ShowAircraftCountInTitle;
            document.getElementById("showMessageRateCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("showMessageRateCheck") as HTMLInputElement).checked = AppSettings.ShowMessageRateInTitle;
            document.getElementById("showAdditionalDataCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("showAdditionalDataCheck") as HTMLInputElement).checked = AppSettings.ShowAdditionalData;
            document.getElementById("hideAircraftNotInViewCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("hideAircraftNotInViewCheck") as HTMLInputElement).checked = AppSettings.HideAircraftsNotInView;
            document.getElementById("useDarkThemeCheck").addEventListener("change", this.OnSettingsCheckChanged);
            (document.getElementById("useDarkThemeCheck") as HTMLInputElement).checked = AppSettings.UseDarkTheme;
            document.getElementById("saveSettingsButton").addEventListener("click", this.OnSaveSettingsButtonClick);
        }

        /**
         * Fill site circles distances into settings input form field.
         */
        public static SetSiteCirclesDistancesInput() {
            if (AppSettings.SiteCirclesDistances.length !== 0) {
                let s = "";
                for (const c of AppSettings.SiteCirclesDistances) {
                    s += `${c},`;
                }
                s = s.substr(0, s.length - 1);
                (document.getElementById("inputSiteCirclesDistance") as HTMLInputElement).value = s;
            }
        }

        /**
         * Fill site coordinates into settings input form field.
         */
        public static SetSiteCoordinates() {
            (document.getElementById("inputSiteLat") as HTMLInputElement).value = AppSettings.SiteLat.toString();
            (document.getElementById("inputSiteLon") as HTMLInputElement).value = AppSettings.SiteLon.toString();
        }

        /**
         * Callback when settings checkbox changed.
         * @param e Event object
         */
        private static OnSettingsCheckChanged(e: any) {
            const id = (e.target as HTMLInputElement).id;
            const checked = (e.target as HTMLInputElement).checked;
            switch (id) {
                case "showFlagsCheck":
                    AppSettings.ShowFlags = checked;
                    Body.ShowFlags(checked);
                    break;

                case "showAircraftCountCheck":
                    AppSettings.ShowAircraftCountInTitle = checked;
                    break;

                case "showMessageRateCheck":
                    AppSettings.ShowMessageRateInTitle = checked;
                    break;

                case "showAdditionalDataCheck":
                    AppSettings.ShowAdditionalData = checked;
                    break;

                case "hideAircraftNotInViewCheck":
                    AppSettings.HideAircraftsNotInView = checked;
                    break;

                case "useDarkThemeCheck":
                    AppSettings.UseDarkTheme = checked;
                    if (checked) {
                        document.documentElement.setAttribute("data-theme", "dark");
                        // Select OSM dark map if available layer.
                        const radio = (document.getElementById("osm dark") as HTMLInputElement);
                        if (radio) {
                            radio.click();
                        }
                    } else {
                        document.documentElement.setAttribute("data-theme", "light");
                    }
                    LMap.CreateSiteCircles();
                    break;

                default:
                    break;
            }
        }

        /**
         * Save and apply inputs from settings textbox fields.
         * @param e Button click event
         */
        private static OnSaveSettingsButtonClick(e: any) {
            let input = (document.getElementById("inputPageName") as HTMLInputElement);
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                const name = input.value.trim().substring(0, 30);
                AppSettings.PageName = name;
                document.title = name;
                document.getElementById("infoblockName").innerText = name;
                input.classList.add("is-valid");
            }
            let lat = AppSettings.SiteLat;
            let lon = AppSettings.SiteLon;
            input = (document.getElementById("inputSiteLat") as HTMLInputElement);
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                lat = Number.parseFloat(input.value);
                if (lat !== Number.NaN && lat >= -90.0 && lat <= 90.0) {
                    AppSettings.SiteLat = lat;
                    input.classList.add("is-valid");
                } else {
                    input.classList.add("is-invalid");
                }
            }
            input = (document.getElementById("inputSiteLon") as HTMLInputElement);
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                lon = Number.parseFloat(input.value);
                if (lon !== Number.NaN && lon >= -180.0 && lon <= 180.0) {
                    AppSettings.SiteLon = lon;
                    input.classList.add("is-valid");
                } else {
                    input.classList.add("is-invalid");
                }
            }
            input = (document.getElementById("inputSiteCirclesDistance") as HTMLInputElement);
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                const csvIn = input.value.trim().split(",", 100);
                const csvOut = [];
                let error = false;
                for (const s of csvIn) {
                    const n = Number.parseFloat(s);
                    if (!isNaN(n) && isFinite(n)) {
                        csvOut.push(n);
                    } else {
                        error = true;
                    }
                }
                if (!error) {
                    AppSettings.SiteCirclesDistances = csvOut;
                    LMap.CreateSiteCircles();
                    input.classList.add("is-valid");
                } else {
                    input.classList.add("is-invalid");
                }
            }
        }
    }
}
