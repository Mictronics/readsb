"use strict";
var READSB;
(function (READSB) {
    class Input {
        static InitializeCheckboxes() {
            document.getElementById("showFlagsCheck").addEventListener("change", this.OnSettingsCheckChanged);
            document.getElementById("showFlagsCheck").checked = READSB.AppSettings.ShowFlags;
            document.getElementById("showAircraftCountCheck").addEventListener("change", this.OnSettingsCheckChanged);
            document.getElementById("showAircraftCountCheck").checked = READSB.AppSettings.ShowAircraftCountInTitle;
            document.getElementById("showMessageRateCheck").addEventListener("change", this.OnSettingsCheckChanged);
            document.getElementById("showMessageRateCheck").checked = READSB.AppSettings.ShowMessageRateInTitle;
            document.getElementById("showAdditionalDataCheck").addEventListener("change", this.OnSettingsCheckChanged);
            document.getElementById("showAdditionalDataCheck").checked = READSB.AppSettings.ShowAdditionalData;
            document.getElementById("hideAircraftNotInViewCheck").addEventListener("change", this.OnSettingsCheckChanged);
            document.getElementById("hideAircraftNotInViewCheck").checked = READSB.AppSettings.HideAircraftsNotInView;
            document.getElementById("saveSettingsButton").addEventListener("click", this.OnSaveSettingsButtonClick);
        }
        static SetSiteCirclesDistancesInput() {
            if (READSB.AppSettings.SiteCirclesDistances.length !== 0) {
                let s = "";
                for (const c of READSB.AppSettings.SiteCirclesDistances) {
                    s += `${c},`;
                }
                s = s.substr(0, s.length - 1);
                document.getElementById("inputSiteCirclesDistance").value = s;
            }
        }
        static SetSiteCoordinates() {
            document.getElementById("inputSiteLat").value = READSB.AppSettings.SiteLat.toString();
            document.getElementById("inputSiteLon").value = READSB.AppSettings.SiteLon.toString();
        }
        static OnSettingsCheckChanged(e) {
            const id = e.target.id;
            const checked = e.target.checked;
            switch (id) {
                case "showFlagsCheck":
                    READSB.AppSettings.ShowFlags = checked;
                    READSB.Body.ShowFlags(checked);
                    break;
                case "showAircraftCountCheck":
                    READSB.AppSettings.ShowAircraftCountInTitle = checked;
                    break;
                case "showMessageRateCheck":
                    READSB.AppSettings.ShowMessageRateInTitle = checked;
                    break;
                case "showAdditionalDataCheck":
                    READSB.AppSettings.ShowAdditionalData = checked;
                    break;
                case "hideAircraftNotInViewCheck":
                    READSB.AppSettings.HideAircraftsNotInView = checked;
                    break;
                default:
                    break;
            }
        }
        static OnSaveSettingsButtonClick(e) {
            let input = document.getElementById("inputPageName");
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                const name = input.value.trim().substring(0, 30);
                READSB.AppSettings.PageName = name;
                document.title = name;
                document.getElementById("infoblockName").innerText = name;
                input.classList.add("is-valid");
            }
            let lat = READSB.DefaultSiteLat;
            let lon = READSB.DefaultSiteLon;
            input = document.getElementById("inputSiteLat");
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                lat = Number.parseFloat(input.value);
                if (lat !== Number.NaN && lat >= -90.0 && lat <= 90.0) {
                    READSB.AppSettings.SiteLat = lat;
                    input.classList.add("is-valid");
                }
                else {
                    input.classList.add("is-invalid");
                }
            }
            input = document.getElementById("inputSiteLon");
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                lon = Number.parseFloat(input.value);
                if (lon !== Number.NaN && lon >= -90.0 && lon <= 90.0) {
                    READSB.AppSettings.SiteLon = lon;
                    input.classList.add("is-valid");
                }
                else {
                    input.classList.add("is-invalid");
                }
            }
            input = document.getElementById("inputSiteCirclesDistance");
            input.classList.remove("is-invalid", "is-valid");
            if (input.value !== "") {
                const csvIn = input.value.trim().split(",", 100);
                const csvOut = [];
                let error = false;
                for (const s of csvIn) {
                    const n = Number.parseFloat(s);
                    if (!isNaN(n) && isFinite(n)) {
                        csvOut.push(n);
                    }
                    else {
                        error = true;
                    }
                }
                if (!error) {
                    READSB.AppSettings.SiteCirclesDistances = csvOut;
                    READSB.LMap.CreateSiteCircles();
                    input.classList.add("is-valid");
                }
                else {
                    input.classList.add("is-invalid");
                }
            }
        }
    }
    READSB.Input = Input;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiInput.js.map