"use strict";
var READSB;
(function (READSB) {
    class Body {
        static Init() {
            $(".toast").toast({ autohide: false, animation: false });
            $(".toast").toast("hide");
            document.getElementById("editIcao24").addEventListener("click", () => {
                $("#EditConfirmModal").modal("show");
            });
            document.getElementById("editAircraftButton").addEventListener("click", () => {
                this.GetEditAircraftData();
                $("#EditAircraftModal").modal("show");
                document.getElementById("editRegistration").focus();
            });
            document.getElementById("editAircraftSaveButton").addEventListener("click", () => {
                this.EditAircraftData();
            });
            document.title = READSB.AppSettings.PageName;
            document.getElementById("infoblockName").innerText = READSB.AppSettings.PageName;
            document.getElementById("inputPageName").value = READSB.AppSettings.PageName;
            if (READSB.AppSettings.ShowAltitudeChart) {
                document.getElementById("altitudeChart").classList.remove("hidden");
            }
            else {
                document.getElementById("altitudeChart").classList.add("hidden");
            }
            if (READSB.AppSettings.UseDarkTheme) {
                document.documentElement.setAttribute("data-theme", "dark");
            }
            else {
                document.documentElement.setAttribute("data-theme", "light");
            }
            const selectInfoBlockDrag = new READSB.Draggable(document.getElementById("selectedInfoblock"));
        }
        static InitEventHandler() {
            document.getElementById("aircraftListIcao").addEventListener("click", READSB.AircraftCollection.SortByICAO.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListFlag").addEventListener("click", READSB.AircraftCollection.SortByCountry.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListFlight").addEventListener("click", READSB.AircraftCollection.SortByFlight.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListRegistration").addEventListener("click", READSB.AircraftCollection.SortByRegistration.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListCivilMil").addEventListener("click", READSB.AircraftCollection.SortByCivilMil.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListType").addEventListener("click", READSB.AircraftCollection.SortByAircraftType.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListSquawk").addEventListener("click", READSB.AircraftCollection.SortBySquawk.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListAltitude").addEventListener("click", READSB.AircraftCollection.SortByAltitude.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListSpeed").addEventListener("click", READSB.AircraftCollection.SortBySpeed.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListVerticalRate").addEventListener("click", READSB.AircraftCollection.SortByVerticalRate.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListDistance").addEventListener("click", READSB.AircraftCollection.SortByDistance.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListTrack").addEventListener("click", READSB.AircraftCollection.SortByTrack.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListMessages").addEventListener("click", READSB.AircraftCollection.SortByMsgs.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListSeen").addEventListener("click", READSB.AircraftCollection.SortBySeen.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListRssi").addEventListener("click", READSB.AircraftCollection.SortByRssi.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListLat").addEventListener("click", READSB.AircraftCollection.SortByLatitude.bind(READSB.AircraftCollection));
            document.getElementById("aircraftListLon").addEventListener("click", READSB.AircraftCollection.SortByLongitude.bind(READSB.AircraftCollection));
            document.getElementById("exportDatabaseButton").addEventListener("click", READSB.Database.ExportDB.bind(READSB.Database));
            document.getElementById("importDatabaseButton").addEventListener("change", READSB.Database.ImportDB.bind(READSB.Database));
            document.getElementById("toggle-follow-icon").addEventListener("click", () => {
                READSB.AircraftCollection.FollowSelected = !READSB.AircraftCollection.FollowSelected;
                if (READSB.AircraftCollection.FollowSelected) {
                    if (READSB.LMap.ZoomLevel < 8) {
                        READSB.LMap.ZoomLevel = 8;
                    }
                    document.getElementById("toggle-follow-icon").classList.value = "follow-lock-icon";
                }
                else {
                    document.getElementById("toggle-follow-icon").classList.value = "follow-unlock-icon";
                }
                Body.RefreshSelectedAircraft();
            });
        }
        static InitDropDown() {
            if (READSB.AppSettings.DisplayUnits === null) {
                READSB.AppSettings.DisplayUnits = "nautical";
            }
            const unitsSelector = document.getElementById("unitsSelector");
            unitsSelector.value = READSB.AppSettings.DisplayUnits;
            unitsSelector.addEventListener("change", this.OnDisplayUnitsChanged.bind(this));
            if (READSB.AppSettings.DisplayUnits === "metric") {
                document.getElementById("altitudeChartButton").classList.add("altitudeMeters");
            }
            else {
                document.getElementById("altitudeChartButton").classList.remove("altitudeMeters");
            }
            const btns = document.getElementById("langDropdownItems").getElementsByTagName("button");
            for (const btn of btns) {
                btn.addEventListener("click", this.OnLanguageChange);
                if (btn.id === READSB.AppSettings.AppLanguage) {
                    btn.classList.add("active");
                }
            }
        }
        static AircraftListShowColumn(columnId, visible) {
            const table = document.getElementById("aircraftList");
            let index = 0;
            for (const c of table.rows.item(0).cells) {
                if (c.id === columnId) {
                    index = c.cellIndex;
                    break;
                }
            }
            for (const row of table.rows) {
                if (visible) {
                    row.cells.item(index).classList.remove("hidden");
                }
                else {
                    row.cells.item(index).classList.add("hidden");
                }
            }
        }
        static AircraftListSetColumnVisibility(visible) {
            this.AircraftListShowColumn("aircraftListRegistration", visible);
            this.AircraftListShowColumn("aircraftListType", visible);
            this.AircraftListShowColumn("aircraftListVerticalRate", visible);
            this.AircraftListShowColumn("aircraftListRssi", visible);
            this.AircraftListShowColumn("aircraftListLat", visible);
            this.AircraftListShowColumn("aircraftListLon", visible);
            this.AircraftListShowColumn("aircraftListMessages", visible);
            this.AircraftListShowColumn("aircraftListSeen", visible);
            this.AircraftListShowColumn("aircraftListTrack", visible);
            this.AircraftListShowColumn("aircraftListFlag", READSB.AppSettings.ShowFlags);
        }
        static GetAircraftListRowTemplate() {
            return document.getElementById("aircraftListRowTemplate");
        }
        static ShowLoadProgress(show) {
            if (show) {
                document.getElementById("loading").classList.remove("hidden");
            }
            else {
                document.getElementById("loading").classList.add("hidden");
            }
        }
        static OnLoadProgress(max, progress) {
            const lp = document.getElementById("loadingProgress");
            lp.setAttribute("aria-valuemax", max.toString());
            lp.setAttribute("aria-valuenow", progress.toString());
            lp.style.width = `${progress}%`;
        }
        static UpdateAircraftListColumnUnits() {
            document.getElementById("aircraftListAltitudeUnit").textContent = READSB.Strings.AltitudeUnit;
            document.getElementById("aircraftListSpeedUnit").textContent = READSB.Strings.SpeedUnit;
            document.getElementById("aircraftListDistanceUnit").textContent = READSB.Strings.DistanceUnit;
            document.getElementById("aircraftListVerticalRateUnit").textContent = READSB.Strings.VerticalRateUnit;
        }
        static UpdateErrorToast(text, show) {
            if (this.errorToastStatus === show) {
                return;
            }
            document.getElementsByClassName("toast-body").item(0).textContent = text;
            if (show) {
                $(".toast").toast("show");
            }
            else {
                $(".toast").toast("hide");
            }
            this.errorToastStatus = show;
        }
        static ShowFlags(show) {
            if (show) {
                READSB.AircraftCollection.RowTemplate.cells[1].classList.remove("hidden");
                document.getElementById("aircraftListFlag").classList.remove("hidden");
                document.getElementById("infoblockCountry").classList.remove("hidden");
            }
            else {
                READSB.AircraftCollection.RowTemplate.cells[1].classList.add("hidden");
                document.getElementById("aircraftListFlag").classList.add("hidden");
                document.getElementById("infoblockCountry").classList.add("hidden");
            }
            READSB.AircraftCollection.Refresh();
        }
        static RefreshInfoBlock(version, messageRate) {
            document.getElementById("infoblockVersion").innerText = version;
            document.getElementById("infoblockTotalAircraft").innerText = READSB.AircraftCollection.TrackedAircrafts + "/" + READSB.AircraftCollection.TrackedAircraftUnknown;
            document.getElementById("infoblockTotalAircraftPositions").innerText = READSB.AircraftCollection.TrackedAircraftPositions.toString();
            document.getElementById("infoblockTotalHistory").innerText = READSB.AircraftCollection.TrackedHistorySize.toString();
            if (messageRate !== null) {
                document.getElementById("infoblockMessageRate").innerText = messageRate.toFixed(1);
            }
            else {
                document.getElementById("infoblockMessageRate").innerText = READSB.Strings.NotApplicable;
            }
            this.RefreshPageTitle(READSB.AircraftCollection.TrackedAircrafts, READSB.AircraftCollection.TrackedAircraftPositions, messageRate);
        }
        static RefreshSelectedAircraft() {
            let selected = null;
            if (READSB.AircraftCollection.Selected !== "ICAO" && READSB.AircraftCollection.Selected !== null) {
                selected = READSB.AircraftCollection.Get();
            }
            this.SetSelectedInfoBlockVisibility();
            if (selected === null) {
                return;
            }
            selected.TableRow.scrollIntoView();
            if (selected.Flight !== null && selected.Flight !== "") {
                document.getElementById("selectedFlightId").innerHTML = selected.FlightAwareLink;
            }
            else {
                document.getElementById("selectedFlightId").innerText = READSB.Strings.NotApplicable;
            }
            if (selected.Operator !== null) {
                document.getElementById("selectedOperator").innerText = selected.Operator;
                document.getElementById("infoblockOperator").classList.remove("hidden");
            }
            else {
                document.getElementById("infoblockOperator").classList.add("hidden");
            }
            if (selected.Callsign !== null && selected.Callsign !== "") {
                document.getElementById("selectedCallsign").innerText = selected.Callsign;
                document.getElementById("infoblockCallsign").classList.remove("hidden");
            }
            else {
                document.getElementById("infoblockCallsign").classList.add("hidden");
            }
            if (selected.Registration !== null) {
                document.getElementById("selectedRegistration").innerText = selected.Registration;
            }
            else {
                document.getElementById("selectedRegistration").innerText = "";
            }
            if (selected.IcaoType !== null) {
                document.getElementById("selectedIcaoType").innerText = selected.IcaoType;
            }
            else {
                document.getElementById("selectedIcaoType").innerText = "";
            }
            if (selected.TypeDescription !== null) {
                document.getElementById("selectedDescription").innerText = selected.TypeDescription;
                document.getElementById("selectedIcaoType").innerText = "";
            }
            else {
                document.getElementById("selectedDescription").innerText = "";
            }
            const emerg = document.getElementById("selectedEmergency");
            const specSquawk = READSB.AircraftCollection.IsSpecialSquawk(selected.Squawk);
            if (specSquawk !== null) {
                emerg.className = specSquawk.CssClass;
                emerg.textContent = "\u00a0" + "Squawking: " + specSquawk.Text + "\u00a0";
            }
            else {
                emerg.className = "hidden";
            }
            document.getElementById("selectedAltitude").innerText = READSB.Format.AltitudeLong(selected.Altitude, selected.VertRate, READSB.AppSettings.DisplayUnits);
            if (selected.Squawk === null || selected.Squawk === "0000") {
                document.getElementById("selectedSquawk").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedSquawk").innerText = selected.Squawk;
            }
            document.getElementById("selectedIcao").innerText = selected.Icao.toUpperCase();
            document.getElementById("selectedIcao").href = "https://www.planespotters.net/search?q=" + selected.Icao;
            document.getElementById("selectedSpeedGs").innerText = READSB.Format.SpeedLong(selected.Gs, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedVerticalRate").innerText = READSB.Format.VerticalRateLong(selected.VertRate, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedTrack").innerText = READSB.Format.TrackLong(selected.Track);
            if (selected.Seen <= 1) {
                document.getElementById("selectedSeen").innerText = READSB.Strings.Now;
            }
            else {
                document.getElementById("selectedSeen").innerText = selected.Seen.toFixed(1) + READSB.Strings.TimeUnit;
            }
            if (selected.CivilMil !== null) {
                if (selected.CivilMil === true) {
                    document.getElementById("selectedCivilMil").innerText = READSB.Strings.Military;
                }
                else {
                    document.getElementById("selectedCivilMil").innerText = READSB.Strings.Civil;
                }
            }
            else {
                document.getElementById("selectedCivilMil").innerText = "Country of";
            }
            if ((selected.Interesting !== null && selected.Interesting === true) || selected.Highlight === true) {
                document.getElementById("infoblockHead").classList.add("interesting");
            }
            else {
                document.getElementById("infoblockHead").classList.remove("interesting");
            }
            document.getElementById("selectedCountry").innerText = selected.IcaoRange.Country;
            if (READSB.AppSettings.ShowFlags && selected.IcaoRange.FlagImage !== null) {
                const sf = document.getElementById("selectedFlag");
                sf.classList.remove("hidden");
                (sf.firstElementChild).src = READSB.AppSettings.FlagPath + selected.IcaoRange.FlagImage;
                (sf.firstElementChild).title = selected.IcaoRange.Country;
            }
            else {
                document.getElementById("selectedFlag").classList.add("hidden");
            }
            if (selected.Position === null) {
                document.getElementById("selectedPosition").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedPosition").innerText = READSB.Format.LatLong(selected.Position);
                if (READSB.AircraftCollection.FollowSelected) {
                    READSB.LMap.Center = selected.Position;
                }
            }
            document.getElementById("selectedSource").innerText = READSB.Format.DataSource(selected.DataSource);
            document.getElementById("selectedSiteDist").innerText = READSB.Format.DistanceLong(selected.SiteDist, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedRssi").innerText = selected.Rssi.toFixed(1) + " dBFS";
            document.getElementById("selectedMessageCount").innerText = selected.Messages.toString();
            document.getElementById("selectedAltitudeGeom").innerText = READSB.Format.AltitudeLong(selected.AltGeom, selected.GeomRate, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedHeadingMag").innerText = READSB.Format.TrackLong(selected.MagHeading);
            document.getElementById("selectedHeadingTrue").innerText = READSB.Format.TrackLong(selected.TrueHeading);
            document.getElementById("selectedSpeedIas").innerText = READSB.Format.SpeedLong(selected.Ias, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedSpeedTas").innerText = READSB.Format.SpeedLong(selected.Tas, READSB.AppSettings.DisplayUnits);
            if (selected.Mach === null) {
                document.getElementById("selectedSpeedMach").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedSpeedMach").innerText = selected.Mach.toFixed(3);
            }
            if (selected.TrackRate === null) {
                document.getElementById("selectedTrackRate").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedTrackRate").innerText = selected.TrackRate.toFixed(2);
            }
            document.getElementById("selectedGeomRate").innerText = READSB.Format.VerticalRateLong(selected.GeomRate, READSB.AppSettings.DisplayUnits);
            if (selected.NavQnh === null) {
                document.getElementById("selectedNavQnh").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedNavQnh").innerText = selected.NavQnh.toFixed(1) + READSB.Strings.PressureUnit;
            }
            document.getElementById("selectedNavAltitude").innerText = READSB.Format.AltitudeLong(selected.NavAltitude, 0, READSB.AppSettings.DisplayUnits);
            document.getElementById("selectedNavHeading").innerText = READSB.Format.TrackLong(selected.NavHeading);
            if (selected.NavModes === null) {
                document.getElementById("selectedNavModes").innerText = READSB.Strings.NotApplicable;
            }
            else {
                document.getElementById("selectedNavModes").innerText = selected.NavModes.join();
            }
            if (selected.NicBaro === null) {
                document.getElementById("selectedNicBaro").innerText = READSB.Strings.NotApplicable;
            }
            else {
                if (selected.NicBaro === 1) {
                    document.getElementById("selectedNicBaro").innerText = READSB.Strings.CrossChecked;
                }
                else {
                    document.getElementById("selectedNicBaro").innerText = READSB.Strings.NotCrossChecked;
                }
            }
            document.getElementById("selectedNacp").innerText = READSB.Format.NacP(selected.NacP);
            document.getElementById("selectedNacv").innerText = READSB.Format.NacV(selected.NacV);
            if (selected.Rc === null) {
                document.getElementById("selectedRc").innerText = READSB.Strings.NotApplicable;
            }
            else if (selected.Rc === 0) {
                document.getElementById("selectedRc").innerText = READSB.Strings.Unknown;
            }
            else {
                document.getElementById("selectedRc").innerText = READSB.Format.DistanceShort(selected.Rc, READSB.AppSettings.DisplayUnits);
            }
            if (selected.Sil === null || selected.SilType === null) {
                document.getElementById("selectedSil").innerText = READSB.Strings.NotApplicable;
            }
            else {
                let sampleRate = "";
                let silDesc = "";
                if (selected.SilType === "perhour") {
                    sampleRate = READSB.Strings.PerHour;
                }
                else if (selected.SilType === "persample") {
                    sampleRate = READSB.Strings.PerSample;
                }
                switch (selected.Sil) {
                    case 0:
                        silDesc = "&gt; 1×10<sup>-3</sup>";
                        break;
                    case 1:
                        silDesc = "≤ 1×10<sup>-3</sup>";
                        break;
                    case 2:
                        silDesc = "≤ 1×10<sup>-5</sup>";
                        break;
                    case 3:
                        silDesc = "≤ 1×10<sup>-7</sup>";
                        break;
                    default:
                        silDesc = READSB.Strings.NotApplicable;
                        sampleRate = "";
                        break;
                }
                document.getElementById("selectedSil").innerHTML = silDesc + sampleRate;
            }
            if (selected.Version === null) {
                document.getElementById("selectedAdsbVersion").innerText = READSB.Strings.None;
            }
            else if (selected.Version === 0) {
                document.getElementById("selectedAdsbVersion").innerText = "v0 (DO-260)";
            }
            else if (selected.Version === 1) {
                document.getElementById("selectedAdsbVersion").innerText = "v1 (DO-260A)";
            }
            else if (selected.Version === 2) {
                document.getElementById("selectedAdsbVersion").innerText = "v2 (DO-260B)";
            }
            else {
                document.getElementById("selectedAdsbVersion").innerText = "v" + selected.Version;
            }
            if (selected.Gs !== null && selected.Tas !== null && selected.Track !== null && selected.MagHeading !== null) {
                selected.Track = (selected.Track || 0) * 1 || 0;
                selected.MagHeading = (selected.MagHeading || 0) * 1 || 0;
                selected.Tas = (selected.Tas || 0) * 1 || 0;
                selected.Gs = (selected.Gs || 0) * 1 || 0;
                const trk = (Math.PI / 180) * selected.Track;
                const hdg = (Math.PI / 180) * selected.MagHeading;
                const ws = Math.round(Math.sqrt(Math.pow(selected.Tas - selected.Gs, 2) + 4 * selected.Tas * selected.Gs * Math.pow(Math.sin((hdg - trk) / 2), 2)));
                let wd = trk + Math.atan2(selected.Tas * Math.sin(hdg - trk), selected.Tas * Math.cos(hdg - trk) - selected.Gs);
                if (wd < 0) {
                    wd = wd + 2 * Math.PI;
                }
                if (wd > 2 * Math.PI) {
                    wd = wd - 2 * Math.PI;
                }
                wd = Math.round((180 / Math.PI) * wd);
                document.getElementById("selectedWindSpeed").innerText = READSB.Format.SpeedLong(ws, READSB.AppSettings.DisplayUnits);
                document.getElementById("selectedWindDirection").innerText = READSB.Format.TrackLong(wd);
                document.getElementById("windArrow").classList.remove("hidden");
                const C = Math.PI / 180;
                const arrowx1 = 20 - 12 * Math.sin(C * wd);
                const arrowx2 = 20 + 12 * Math.sin(C * wd);
                const arrowy1 = 20 + 12 * Math.cos(C * wd);
                const arrowy2 = 20 - 12 * Math.cos(C * wd);
                document.getElementById("windArrow").setAttribute("x1", arrowx1.toString());
                document.getElementById("windArrow").setAttribute("x2", arrowx2.toString());
                document.getElementById("windArrow").setAttribute("y1", arrowy1.toString());
                document.getElementById("windArrow").setAttribute("y2", arrowy2.toString());
            }
            else {
                document.getElementById("windArrow").classList.add("hidden");
                document.getElementById("selectedWindSpeed").innerText = READSB.Strings.NotApplicable;
                document.getElementById("selectedWindDirection").innerText = READSB.Strings.NotApplicable;
            }
        }
        static OnAircraftListRowClick(h, evt) {
            if (evt.srcElement instanceof HTMLAnchorElement) {
                evt.stopPropagation();
                return;
            }
            this.SelectAircraftByHex(h, false);
            evt.preventDefault();
        }
        static OnAircraftListRowDoubleClick(h, evt) {
            this.SelectAircraftByHex(h, true);
            evt.preventDefault();
        }
        static SelectAircraftByHex(hex, autofollow) {
            if (READSB.AircraftCollection.Selected === hex && !autofollow) {
                hex = null;
            }
            READSB.AircraftCollection.SelectAll = false;
            if (hex !== null) {
                READSB.AircraftCollection.Selected = hex;
            }
            else {
                READSB.AircraftCollection.Selected = null;
            }
            if (READSB.AircraftCollection.Selected !== null && autofollow) {
                READSB.AircraftCollection.FollowSelected = true;
            }
            else {
                READSB.AircraftCollection.FollowSelected = false;
            }
            this.RefreshSelectedAircraft();
        }
        static SetSelectedInfoBlockVisibility() {
            const isSelected = (READSB.AircraftCollection.Selected !== null && READSB.AircraftCollection.Selected !== "ICAO");
            if (isSelected) {
                document.getElementById("selectedInfoblock").classList.remove("hidden");
            }
            else {
                document.getElementById("selectedInfoblock").classList.add("hidden");
            }
        }
        static RefreshPageTitle(trackedAircraft, trackedPositions, messageRate) {
            if (!READSB.AppSettings.ShowAircraftCountInTitle && !READSB.AppSettings.ShowMessageRateInTitle) {
                document.title = READSB.AppSettings.PageName;
                return;
            }
            let subtitle = "";
            if (READSB.AppSettings.ShowAircraftCountInTitle) {
                subtitle += `${trackedAircraft}/${trackedPositions}`;
            }
            if (READSB.AppSettings.ShowMessageRateInTitle && messageRate !== null) {
                if (subtitle) {
                    subtitle += " | ";
                }
                subtitle += ` - ${messageRate.toFixed(1)}/s`;
            }
            document.title = `${READSB.AppSettings.PageName} - ${subtitle}`;
        }
        static OnDisplayUnitsChanged(e) {
            const displayUnits = e.target.value;
            READSB.AppSettings.DisplayUnits = displayUnits;
            if (READSB.AppSettings.DisplayUnits === "metric") {
                document.getElementById("altitudeChartButton").classList.add("altitudeMeters");
            }
            else {
                document.getElementById("altitudeChartButton").classList.remove("altitudeMeters");
            }
            READSB.Strings.OnLanguageChange();
            READSB.LMap.CreateSiteCircles();
            this.UpdateAircraftListColumnUnits();
            READSB.Filter.RefreshFilterList();
            READSB.AircraftCollection.Refresh();
            this.RefreshSelectedAircraft();
        }
        static GetEditAircraftData() {
            if (READSB.AircraftCollection.Selected === null || READSB.AircraftCollection.Selected === undefined) {
                return;
            }
            const selected = READSB.AircraftCollection.Get(READSB.AircraftCollection.Selected);
            document.getElementById("editIcao24").value = selected.Icao.toUpperCase();
            if (selected.Registration !== null) {
                if (selected.Registration.startsWith("#")) {
                    document.getElementById("editRegistration").value = selected.Registration.substr(2).toUpperCase();
                }
                else {
                    document.getElementById("editRegistration").value = selected.Registration.toUpperCase();
                }
            }
            if (selected.IcaoType !== null) {
                document.getElementById("editType").value = selected.IcaoType.toUpperCase();
            }
            if (selected.TypeDescription !== null) {
                document.getElementById("editDescription").value = selected.TypeDescription;
            }
            if (selected.Interesting !== null && selected.Interesting) {
                document.getElementById("editInterestingCheck").checked = true;
            }
            else {
                document.getElementById("editInterestingCheck").checked = false;
            }
            if (selected.CivilMil !== null && selected.CivilMil) {
                document.getElementById("editMilitaryCheck").checked = true;
            }
            else {
                document.getElementById("editMilitaryCheck").checked = false;
            }
        }
        static EditAircraftData() {
            const i24 = document.getElementById("editIcao24").value.trim().substr(0, 6).toUpperCase();
            const r = document.getElementById("editRegistration").value.trim().substr(0, 10).toUpperCase();
            const t = document.getElementById("editType").value.trim().substr(0, 4).toUpperCase();
            const d = document.getElementById("editDescription").value.trim().substr(0, 50);
            const civ = document.getElementById("editMilitaryCheck").checked;
            const int = document.getElementById("editInterestingCheck").checked;
            let f = "00";
            if (civ && !int) {
                f = "10";
            }
            if (!civ && int) {
                f = "01";
            }
            if (civ && int) {
                f = "11";
            }
            const entry = {
                desc: d,
                flags: f,
                icao24: i24,
                reg: r,
                type: t,
            };
            READSB.Database.PutAircraftData(entry);
            $("#EditAircraftModal").modal("hide");
            READSB.AircraftCollection.Refresh();
            this.RefreshSelectedAircraft();
        }
        static OnLanguageChange(e) {
            let button = e.target;
            if (button.tagName === "IMG") {
                button = e.target.parentElement;
            }
            const btns = button.parentElement.getElementsByTagName("button");
            for (const b of btns) {
                b.classList.remove("active");
            }
            button.classList.add("active");
            READSB.AppSettings.AppLanguage = button.id;
            READSB.Main.SetLanguage(button.id);
        }
    }
    Body.errorToastStatus = false;
    READSB.Body = Body;
})(READSB || (READSB = {}));
//# sourceMappingURL=uiBody.js.map