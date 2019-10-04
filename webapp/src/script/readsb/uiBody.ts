// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// uiBody.ts: Functions to manipulate the body of index.html
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
    export class Body {
        public static Init() {
            // Initialize error toast
            $(".toast").toast({ autohide: false });
            $(".toast").toast("hide");

            // Assign confirmation modal to ICAO24 edit field in edit aircraft dialog.
            document.getElementById("editIcao24").addEventListener("click", () => {
                $("#EditConfirmModal").modal("show");
            });

            // Open edit aircaft dialog with button in selected infoblock
            document.getElementById("editAircraftButton").addEventListener("click", () => {
                this.GetEditAircraftData();
                $("#EditAircraftModal").modal("show");
                document.getElementById("editRegistration").focus();
            });

            // Save changes on button click in edit aircraft dialog.
            document.getElementById("editAircraftSaveButton").addEventListener("click", () => {
                this.EditAircraftData();
            });

            // Replace default page name from settings.
            document.title = AppSettings.PageName;
            document.getElementById("infoblockName").innerText = AppSettings.PageName;
            (document.getElementById("inputPageName") as HTMLInputElement).value = AppSettings.PageName;

            if (AppSettings.ShowAltitudeChart) {
                document.getElementById("altitudeChart").classList.remove("hidden");
            } else {
                document.getElementById("altitudeChart").classList.add("hidden");
            }

            // Make selected aircraft infoblock draggable.
            const selectInfoBlockDrag = new Draggable(document.getElementById("selectedInfoblock"));
        }

        public static InitEventHandler() {
            // Assign sort functions to aircraft list column header.
            document.getElementById("aircraftListIcao").addEventListener("click", AircraftCollection.SortByICAO.bind(AircraftCollection));
            document.getElementById("aircraftListFlag").addEventListener("click", AircraftCollection.SortByCountry.bind(AircraftCollection));
            document.getElementById("aircraftListFlight").addEventListener("click", AircraftCollection.SortByFlight.bind(AircraftCollection));
            document.getElementById("aircraftListRegistration").addEventListener("click", AircraftCollection.SortByRegistration.bind(AircraftCollection));
            document.getElementById("aircraftListCivilMil").addEventListener("click", AircraftCollection.SortByCivilMil.bind(AircraftCollection));
            document.getElementById("aircraftListType").addEventListener("click", AircraftCollection.SortByAircraftType.bind(AircraftCollection));
            document.getElementById("aircraftListSquawk").addEventListener("click", AircraftCollection.SortBySquawk.bind(AircraftCollection));
            document.getElementById("aircraftListAltitude").addEventListener("click", AircraftCollection.SortByAltitude.bind(AircraftCollection));
            document.getElementById("aircraftListSpeed").addEventListener("click", AircraftCollection.SortBySpeed.bind(AircraftCollection));
            document.getElementById("aircraftListVerticalRate").addEventListener("click", AircraftCollection.SortByVerticalRate.bind(AircraftCollection));
            document.getElementById("aircraftListDistance").addEventListener("click", AircraftCollection.SortByDistance.bind(AircraftCollection));
            document.getElementById("aircraftListTrack").addEventListener("click", AircraftCollection.SortByTrack.bind(AircraftCollection));
            document.getElementById("aircraftListMessages").addEventListener("click", AircraftCollection.SortByMsgs.bind(AircraftCollection));
            document.getElementById("aircraftListSeen").addEventListener("click", AircraftCollection.SortBySeen.bind(AircraftCollection));
            document.getElementById("aircraftListRssi").addEventListener("click", AircraftCollection.SortByRssi.bind(AircraftCollection));
            document.getElementById("aircraftListLat").addEventListener("click", AircraftCollection.SortByLatitude.bind(AircraftCollection));
            document.getElementById("aircraftListLon").addEventListener("click", AircraftCollection.SortByLongitude.bind(AircraftCollection));
            document.getElementById("exportDatabaseButton").addEventListener("click", Database.ExportDB.bind(Database));
            document.getElementById("importDatabaseButton").addEventListener("change", Database.ImportDB.bind(Database));

            document.getElementById("toggle-follow-icon").addEventListener("click", () => {
                AircraftCollection.FollowSelected = !AircraftCollection.FollowSelected;
                if (AircraftCollection.FollowSelected) {
                    if (LMap.ZoomLevel < 8) {
                        LMap.ZoomLevel = 8;
                    }
                    document.getElementById("toggle-follow-icon").style.transform = "rotateZ(90deg)";
                } else {
                    document.getElementById("toggle-follow-icon").style.transform = "";
                }

                Body.RefreshSelectedAircraft();
            });
        }

        public static InitDropDown() {
            // Set actual unit in selector drop-down
            if (AppSettings.DisplayUnits === null) {
                AppSettings.DisplayUnits = "nautical";
            }
            const unitsSelector = document.getElementById("unitsSelector") as HTMLSelectElement;
            unitsSelector.value = AppSettings.DisplayUnits;
            unitsSelector.addEventListener("change", this.OnDisplayUnitsChanged.bind(this));
            if (AppSettings.DisplayUnits === "metric") {
                document.getElementById("altitudeChartButton").classList.add("altitudeMeters");
            } else {
                document.getElementById("altitudeChartButton").classList.remove("altitudeMeters");
            }
        }

        public static AircraftListShowColumn(columnId: string, visible: boolean) {
            const table = document.getElementById("aircraftList") as HTMLTableElement;

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
                } else {
                    row.cells.item(index).classList.add("hidden");
                }
            }
        }

        /**
         * Set column visibility in aircraft list.
         */
        public static AircraftListSetColumnVisibility(visible: boolean) {
            this.AircraftListShowColumn("aircraftListRegistration", visible);
            this.AircraftListShowColumn("aircraftListType", visible);
            this.AircraftListShowColumn("aircraftListVerticalRate", visible);
            this.AircraftListShowColumn("aircraftListRssi", visible);
            this.AircraftListShowColumn("aircraftListLat", visible);
            this.AircraftListShowColumn("aircraftListLon", visible);
            this.AircraftListShowColumn("aircraftListMessages", visible);
            this.AircraftListShowColumn("aircraftListSeen", visible);
            this.AircraftListShowColumn("aircraftListTrack", visible);
            this.AircraftListShowColumn("aircraftListFlag", AppSettings.ShowFlags);
        }

        public static GetAircraftListRowTemplate(): HTMLTableRowElement {
            return (document.getElementById("aircraftListRowTemplate") as HTMLTableRowElement);
        }

        public static ShowLoadProgress(show: boolean) {
            if (show) {
                document.getElementById("loading").classList.remove("hidden");
            } else {
                document.getElementById("loading").classList.add("hidden");
            }
        }

        /**
         * Callback indicating percentage of history loading.
         * @param progress Percent of progress.
         */
        public static OnLoadProgress(max: number, progress: number) {
            const lp = document.getElementById("loadingProgress");
            lp.setAttribute("aria-valuemax", max.toString());
            lp.setAttribute("aria-valuenow", progress.toString());
            lp.style.width = `${progress}%`;
        }

        /**
         * Change units in aircraft lsit when global units change.
         */
        public static UpdateAircraftListColumnUnits() {
            document.getElementById("aircraftListAltitudeUnit").innerText = Format.GetUnitLabel("altitude", AppSettings.DisplayUnits);
            document.getElementById("aircraftListSpeedUnit").innerText = Format.GetUnitLabel("speed", AppSettings.DisplayUnits);
            document.getElementById("aircraftListDistanceUnit").innerText = Format.GetUnitLabel("distance", AppSettings.DisplayUnits);
            document.getElementById("aircraftListVerticalRateUnit").innerText = Format.GetUnitLabel("verticalRate", AppSettings.DisplayUnits);
        }

        /**
         * Show or hide error message toast.
         * @param text Error message.
         * @param show Show toast if true.
         */
        public static UpdateErrorToast(text: string, show: boolean) {
            document.getElementsByClassName("toast-body").item(0).innerHTML = text;
            if (show) {
                $(".toast").toast("show");
            } else {
                $(".toast").toast("hide");
            }
        }

        /**
         * Show or hide flags in aircraft list depending on user settings.
         * @param show Show flags if true.
         */
        public static ShowFlags(show: boolean) {
            if (show) {
                AircraftCollection.RowTemplate.cells[1].classList.remove("hidden"); // Show flag column
                document.getElementById("aircraftListFlag").classList.remove("hidden"); // Show flag header
                document.getElementById("infoblockCountry").classList.remove("hidden"); // Show country row
            } else {
                AircraftCollection.RowTemplate.cells[1].classList.add("hidden"); // Hide flag column
                document.getElementById("aircraftListFlag").classList.add("hidden"); // Hide flag header
                document.getElementById("infoblockCountry").classList.add("hidden"); // Hide country row
            }
            AircraftCollection.Refresh();
        }

        /**
         * Update info card (first one above aircraft list) and page title.
         * @param version Readsb version.
         * @param messageRate Actual incoming aircraft message rate.
         */
        public static RefreshInfoBlock(version: string, messageRate: number) {
            document.getElementById("infoblockVersion").innerText = version;
            document.getElementById("infoblockTotalAircraft").innerText = AircraftCollection.TrackedAircrafts + "/" + AircraftCollection.TrackedAircraftUnknown;
            document.getElementById("infoblockTotalAircraftPositions").innerText = AircraftCollection.TrackedAircraftPositions.toString();
            document.getElementById("infoblockTotalHistory").innerText = AircraftCollection.TrackedHistorySize.toString();

            if (messageRate !== null) {
                document.getElementById("infoblockMessageRate").innerText = messageRate.toFixed(1);
            } else {
                document.getElementById("infoblockMessageRate").innerText = "n/a";
            }

            this.RefreshPageTitle(AircraftCollection.TrackedAircrafts, AircraftCollection.TrackedAircraftPositions, messageRate);
        }

        /**
         * Refresh the detailed info block for selected aircraft.
         */
        public static RefreshSelectedAircraft() {
            let selected: IAircraft = null;
            if (AircraftCollection.Selected !== "ICAO" && AircraftCollection.Selected !== null) {
                selected = AircraftCollection.Get();
            }

            this.SetSelectedInfoBlockVisibility();

            if (selected === null) {
                return;
            }

            // Scroll aircraft list so selected is visible
            (selected.TableRow as HTMLElement).scrollIntoView();

            if (selected.Flight !== null && selected.Flight !== "") {
                document.getElementById("selectedFlightId").innerHTML = selected.FlightAwareLink;
            } else {
                document.getElementById("selectedFlightId").innerText = "n/a";
            }

            if (selected.Operator !== null) {
                document.getElementById("selectedOperator").innerText = selected.Operator;
                document.getElementById("infoblockOperator").classList.remove("hidden");
            } else {
                document.getElementById("infoblockOperator").classList.add("hidden");
            }

            if (selected.Callsign !== null && selected.Callsign !== "") {
                document.getElementById("selectedCallsign").innerText = selected.Callsign;
                document.getElementById("infoblockCallsign").classList.remove("hidden");
            } else {
                document.getElementById("infoblockCallsign").classList.add("hidden");
            }

            if (selected.Registration !== null) {
                document.getElementById("selectedRegistration").innerText = selected.Registration;
            } else {
                document.getElementById("selectedRegistration").innerText = "";
            }

            if (selected.IcaoType !== null) {
                document.getElementById("selectedIcaoType").innerText = selected.IcaoType;
            } else {
                document.getElementById("selectedIcaoType").innerText = "";
            }

            if (selected.TypeDescription !== null) {
                document.getElementById("selectedDescription").innerText = selected.TypeDescription;
                document.getElementById("selectedIcaoType").innerText = "";
            } else {
                document.getElementById("selectedDescription").innerText = "";
            }

            const emerg = document.getElementById("selectedEmergency");
            const specSquawk = AircraftCollection.IsSpecialSquawk(selected.Squawk);
            if (specSquawk !== null) {
                emerg.className = specSquawk.CssClass;
                emerg.textContent = "\u00a0" + "Squawking: " + specSquawk.Text + "\u00a0";
            } else {
                emerg.className = "hidden";
            }

            document.getElementById("selectedAltitude").innerText = Format.AltitudeLong(selected.Altitude, selected.VertRate, AppSettings.DisplayUnits);

            if (selected.Squawk === null || selected.Squawk === "0000") {
                document.getElementById("selectedSquawk").innerText = "n/a";
            } else {
                document.getElementById("selectedSquawk").innerText = selected.Squawk;
            }

            document.getElementById("selectedIcao").innerText = selected.Icao.toUpperCase();
            (document.getElementById("selectedIcao") as HTMLLinkElement).href = "https://www.planespotters.net/search?q=" + selected.Icao;

            document.getElementById("selectedSpeedGs").innerText = Format.SpeedLong(selected.Gs, AppSettings.DisplayUnits);
            document.getElementById("selectedVerticalRate").innerText = Format.VerticalRateLong(selected.VertRate, AppSettings.DisplayUnits);
            document.getElementById("selectedTrack").innerText = Format.TrackLong(selected.Track);

            if (selected.Seen <= 1) {
                document.getElementById("selectedSeen").innerText = "now";
            } else {
                document.getElementById("selectedSeen").innerText = selected.Seen.toFixed(1) + "s";
            }

            if (selected.CivilMil !== null) {
                if (selected.CivilMil === true) {
                    document.getElementById("selectedCivilMil").innerText = "Military";
                } else {
                    document.getElementById("selectedCivilMil").innerText = "Civil";
                }
            } else {
                document.getElementById("selectedCivilMil").innerText = "Country of";
            }

            if ((selected.Interesting !== null && selected.Interesting === true) || selected.Highlight === true) {
                document.getElementById("infoblockHead").classList.add("interesting");
            } else {
                document.getElementById("infoblockHead").classList.remove("interesting");
            }

            document.getElementById("selectedCountry").innerText = selected.IcaoRange.Country;
            if (AppSettings.ShowFlags && selected.IcaoRange.FlagImage !== null) {
                const sf = document.getElementById("selectedFlag");
                sf.classList.remove("hidden");
                ((sf.firstElementChild) as HTMLImageElement).src = AppSettings.FlagPath + selected.IcaoRange.FlagImage;
                ((sf.firstElementChild) as HTMLImageElement).title = selected.IcaoRange.Country;
            } else {
                document.getElementById("selectedFlag").classList.add("hidden");
            }

            if (selected.Position === null) {
                document.getElementById("selectedPosition").innerText = "n/a";
            } else {
                document.getElementById("selectedPosition").innerText = Format.LatLong(selected.Position);
                if (AircraftCollection.FollowSelected) {
                    LMap.Center = selected.Position;
                }
            }

            document.getElementById("selectedSource").innerText = Format.DataSource(selected.DataSource);

            document.getElementById("selectedSiteDist").innerText = Format.DistanceLong(selected.SiteDist, AppSettings.DisplayUnits);
            document.getElementById("selectedRssi").innerText = selected.Rssi.toFixed(1) + " dBFS";
            document.getElementById("selectedMessageCount").innerText = selected.Messages.toString();

            document.getElementById("selectedAltitudeGeom").innerText = Format.AltitudeLong(selected.AltGeom, selected.GeomRate, AppSettings.DisplayUnits);
            document.getElementById("selectedHeadingMag").innerText = Format.TrackLong(selected.MagHeading);
            document.getElementById("selectedHeadingTrue").innerText = Format.TrackLong(selected.TrueHeading);
            document.getElementById("selectedSpeedIas").innerText = Format.SpeedLong(selected.Ias, AppSettings.DisplayUnits);
            document.getElementById("selectedSpeedTas").innerText = Format.SpeedLong(selected.Tas, AppSettings.DisplayUnits);

            if (selected.Mach === null) {
                document.getElementById("selectedSpeedMach").innerText = "n/a";
            } else {
                document.getElementById("selectedSpeedMach").innerText = selected.Mach.toFixed(3);
            }

            /*
             * Not indicated in selected infoblock.
            if (selected.Roll === null) {
                document.getElementById("selectedRoll").innerText = "n/a";
            } else {
                document.getElementById("selectedRoll").innerText = selected.Roll.toFixed(1);
            }
            */
            if (selected.TrackRate === null) {
                document.getElementById("selectedTrackRate").innerText = "n/a";
            } else {
                document.getElementById("selectedTrackRate").innerText = selected.TrackRate.toFixed(2);
            }

            document.getElementById("selectedGeomRate").innerText = Format.VerticalRateLong(selected.GeomRate, AppSettings.DisplayUnits);

            if (selected.NavQnh === null) {
                document.getElementById("selectedNavQnh").innerText = "n/a";
            } else {
                document.getElementById("selectedNavQnh").innerText = selected.NavQnh.toFixed(1) + " hPa";
            }
            document.getElementById("selectedNavAltitude").innerText = Format.AltitudeLong(selected.NavAltitude, 0, AppSettings.DisplayUnits);
            document.getElementById("selectedNavHeading").innerText = Format.TrackLong(selected.NavHeading);
            if (selected.NavModes === null) {
                document.getElementById("selectedNavModes").innerText = "n/a";
            } else {
                document.getElementById("selectedNavModes").innerText = selected.NavModes.join();
            }
            if (selected.NicBaro === null) {
                document.getElementById("selectedNicBaro").innerText = "n/a";
            } else {
                if (selected.NicBaro === 1) {
                    document.getElementById("selectedNicBaro").innerText = "cross-checked";
                } else {
                    document.getElementById("selectedNicBaro").innerText = "not cross-checked";
                }
            }

            document.getElementById("selectedNacp").innerText = Format.NacP(selected.NacP);
            document.getElementById("selectedNacv").innerText = Format.NacV(selected.NacV);
            if (selected.Rc === null) {
                document.getElementById("selectedRc").innerText = "n/a";
            } else if (selected.Rc === 0) {
                document.getElementById("selectedRc").innerText = "Unknown";
            } else {
                document.getElementById("selectedRc").innerText = Format.DistanceShort(selected.Rc, AppSettings.DisplayUnits);
            }

            if (selected.Sil === null || selected.SilType === null) {
                document.getElementById("selectedSil").innerText = "n/a";
            } else {
                let sampleRate = "";
                let silDesc = "";
                if (selected.SilType === "perhour") {
                    sampleRate = " per flight hour";
                } else if (selected.SilType === "persample") {
                    sampleRate = " per sample";
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
                        silDesc = "n/a";
                        sampleRate = "";
                        break;
                }
                document.getElementById("selectedSil").innerHTML = silDesc + sampleRate;
            }

            if (selected.Version === null) {
                document.getElementById("selectedAdsbVersion").innerText = "none";
            } else if (selected.Version === 0) {
                document.getElementById("selectedAdsbVersion").innerText = "v0 (DO-260)";
            } else if (selected.Version === 1) {
                document.getElementById("selectedAdsbVersion").innerText = "v1 (DO-260A)";
            } else if (selected.Version === 2) {
                document.getElementById("selectedAdsbVersion").innerText = "v2 (DO-260B)";
            } else {
                document.getElementById("selectedAdsbVersion").innerText = "v" + selected.Version;
            }

            // Wind speed and direction
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
                document.getElementById("selectedWindSpeed").innerText = Format.SpeedLong(ws, AppSettings.DisplayUnits);
                document.getElementById("selectedWindDirection").innerText = Format.TrackLong(wd);

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
            } else {
                document.getElementById("windArrow").classList.add("hidden");
                document.getElementById("selectedWindSpeed").innerText = "n/a";
                document.getElementById("selectedWindDirection").innerText = "n/a";
            }
        }

        /**
         * Eventhandler when row in aircraft is clicked.
         * @param h
         * @param evt
         */
        public static OnAircraftListRowClick(h: any, evt: any) {
            if (evt.srcElement instanceof HTMLAnchorElement) {
                evt.stopPropagation();
                return;
            }
            this.SelectAircraftByHex(h, false);
            evt.preventDefault();
        }

        /**
         * Eventhandler when row in aircraft is double clicked.
         * @param h
         * @param evt
         */
        public static OnAircraftListRowDoubleClick(h: any, evt: any) {
            this.SelectAircraftByHex(h, true);
            evt.preventDefault();
        }

        public static SelectAircraftByHex(hex: string, autofollow: boolean) {
            // If we are clicking the same plane, we are deselecting it.
            // (unless it was a doubleclick..)
            if (AircraftCollection.Selected === hex && !autofollow) {
                hex = null;
            }

            // Deselect all other aircrafts if any.
            AircraftCollection.SelectAll = false;

            if (hex !== null) {
                AircraftCollection.Selected = hex;
            } else {
                AircraftCollection.Selected = null;
            }

            if (AircraftCollection.Selected !== null && autofollow) {
                AircraftCollection.FollowSelected = true;
            } else {
                AircraftCollection.FollowSelected = false;
            }
            this.RefreshSelectedAircraft();
        }

        /**
         * Show or hide aircraft info block depending on selection of aircraft.
         */
        private static SetSelectedInfoBlockVisibility() {
            // const mapIsVisible = document.getElementById("map_container").is(":visible");
            const isSelected = (AircraftCollection.Selected !== null && AircraftCollection.Selected !== "ICAO");

            if (isSelected) {
                document.getElementById("selectedInfoblock").classList.remove("hidden");
            } else {
                document.getElementById("selectedInfoblock").classList.add("hidden");
            }
        }

        /**
         * Update page title.
         * @param trackedAircraft Number of tracked aircrafts.
         * @param trackedPositions Number of tracked aircrafts with position.
         * @param messageRate Actual rate of incoming aircraft messages.
         */
        private static RefreshPageTitle(trackedAircraft: number, trackedPositions: number, messageRate: number) {
            if (!AppSettings.ShowAircraftCountInTitle && !AppSettings.ShowMessageRateInTitle) {
                document.title = AppSettings.PageName;
                return;
            }

            let subtitle = "";

            if (AppSettings.ShowAircraftCountInTitle) {
                subtitle += `${trackedPositions}/${trackedAircraft}`;
            }

            if (AppSettings.ShowMessageRateInTitle && messageRate !== null) {
                if (subtitle) {
                    subtitle += " | ";
                }
                subtitle += ` - ${messageRate.toFixed(1)}/s`;
            }

            document.title = `${AppSettings.PageName} - ${subtitle}`;
        }

        /**
         * Eventhandler when display unit was changed through GUI.
         * @param e
         */
        private static OnDisplayUnitsChanged(e: any) {
            const displayUnits = e.target.value;
            AppSettings.DisplayUnits = displayUnits;
            if (AppSettings.DisplayUnits === "metric") {
                document.getElementById("altitudeChartButton").classList.add("altitudeMeters");
            } else {
                document.getElementById("altitudeChartButton").classList.remove("altitudeMeters");
            }
            LMap.CreateSiteCircles();
            this.UpdateAircraftListColumnUnits();
            Filter.RefreshFilterList();
            AircraftCollection.Refresh();
            this.RefreshSelectedAircraft();
        }

        /**
         * Get aircraft data to edit from database.
         */
        private static GetEditAircraftData() {
            if (AircraftCollection.Selected === null || AircraftCollection.Selected === undefined) {
                return;
            }
            const selected = AircraftCollection.Get(AircraftCollection.Selected);
            (document.getElementById("editIcao24") as HTMLInputElement).value = selected.Icao.toUpperCase();

            if (selected.Registration !== null) {
                if (selected.Registration.startsWith("#")) {
                    (document.getElementById("editRegistration") as HTMLInputElement).value = selected.Registration.substr(2).toUpperCase();
                } else {
                    (document.getElementById("editRegistration") as HTMLInputElement).value = selected.Registration.toUpperCase();
                }
            }

            if (selected.IcaoType !== null) {
                (document.getElementById("editType") as HTMLInputElement).value = selected.IcaoType.toUpperCase();
            }
            if (selected.TypeDescription !== null) {
                (document.getElementById("editDescription") as HTMLInputElement).value = selected.TypeDescription;
            }

            if (selected.Interesting !== null && selected.Interesting) {
                (document.getElementById("editInterestingCheck") as HTMLInputElement).checked = true;
            } else {
                (document.getElementById("editInterestingCheck") as HTMLInputElement).checked = false;
            }

            if (selected.CivilMil !== null && selected.CivilMil) {
                (document.getElementById("editMilitaryCheck") as HTMLInputElement).checked = true;
            } else {
                (document.getElementById("editMilitaryCheck") as HTMLInputElement).checked = false;
            }
        }

        /**
         * Get aircraft data from UI edit inputs and save in indexed database.
         */
        private static EditAircraftData() {
            const i24 = (document.getElementById("editIcao24") as HTMLInputElement).value.trim().substr(0, 6).toUpperCase();
            const r = (document.getElementById("editRegistration") as HTMLInputElement).value.trim().substr(0, 10).toUpperCase();
            const t = (document.getElementById("editType") as HTMLInputElement).value.trim().substr(0, 4).toUpperCase();
            const d = (document.getElementById("editDescription") as HTMLInputElement).value.trim().substr(0, 50);
            const civ = (document.getElementById("editMilitaryCheck") as HTMLInputElement).checked;
            const int = (document.getElementById("editInterestingCheck") as HTMLInputElement).checked;

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
            Database.PutAircraftData(entry);
            $("#EditAircraftModal").modal("hide");
            AircraftCollection.Refresh();
            this.RefreshSelectedAircraft();
        }

    }
}
