"use strict";
var READSB;
(function (READSB) {
    class AircraftCollection {
        static get Selected() {
            return this.selectedAircraft;
        }
        static set Selected(value) {
            if (this.selectedAircraft !== null) {
                this.aircraftCollection.get(this.selectedAircraft).Selected = false;
                this.aircraftCollection.get(this.selectedAircraft).ClearLines();
                this.aircraftCollection.get(this.selectedAircraft).UpdateMarker(false);
                this.aircraftCollection.get(this.selectedAircraft).TableRow.classList.remove("selected");
            }
            this.selectedAircraft = value;
            if (this.selectedAircraft !== null) {
                this.aircraftCollection.get(this.selectedAircraft).Selected = true;
                this.aircraftCollection.get(this.selectedAircraft).UpdateLines();
                this.aircraftCollection.get(this.selectedAircraft).UpdateMarker(false);
                this.aircraftCollection.get(this.selectedAircraft).TableRow.classList.add("selected");
            }
        }
        static get SelectAll() {
            return this.selectAll;
        }
        static set SelectAll(value) {
            this.selectAll = value;
            if (this.selectAll) {
                this.Selected = null;
                this.selectAll = true;
                this.aircraftCollection.forEach((ac) => {
                    if (ac.Visible && !ac.IsFiltered) {
                        ac.UpdateLines();
                        ac.UpdateMarker(false);
                        ac.Selected = true;
                    }
                });
                READSB.Body.RefreshSelectedAircraft();
            }
            else {
                this.aircraftCollection.forEach((ac) => {
                    ac.Selected = false;
                    ac.ClearLines();
                    ac.UpdateMarker(false);
                    if (ac.TableRow) {
                        ac.TableRow.classList.remove("selected");
                    }
                });
                this.selectedAircraft = null;
                this.selectAll = false;
                READSB.Body.RefreshSelectedAircraft();
            }
        }
        static Get(icao = this.selectedAircraft) {
            if (icao !== null) {
                return this.aircraftCollection.get(icao);
            }
            return null;
        }
        static IsSpecialSquawk(squawk) {
            if (squawk in this.specialSquawks) {
                return this.specialSquawks[squawk];
            }
            return null;
        }
        static StartLoadHistory(historySize, progressCallback, endLoadingCallback) {
            let loaded = 0;
            if (historySize > 0 && window.location.hash !== "#nohistory") {
                console.info("Starting to load history (" + historySize + " items)");
                for (let i = 0; i < historySize; i++) {
                    fetch(`data/history_${i}.json`, {
                        cache: "no-cache",
                        method: "GET",
                        mode: "cors",
                    })
                        .then((res) => {
                        if (res.status >= 200 && res.status < 300) {
                            return Promise.resolve(res);
                        }
                        else {
                            return Promise.reject(new Error(res.statusText));
                        }
                    })
                        .then((res) => {
                        return res.json();
                    })
                        .then((data) => {
                        if (loaded < 0) {
                            return;
                        }
                        this.positionHistoryBuffer.push(data);
                        loaded++;
                        console.info("Loaded " + loaded + " history chunks");
                        progressCallback(historySize, loaded);
                        if (loaded >= historySize) {
                            loaded = -1;
                            endLoadingCallback(this.DoneLoadHistory());
                        }
                    })
                        .catch((error) => {
                        if (loaded < 0) {
                            return;
                        }
                        console.error("Failed to load history chunk");
                        loaded = -1;
                        endLoadingCallback(this.DoneLoadHistory());
                    });
                }
            }
            else {
                endLoadingCallback(this.DoneLoadHistory());
            }
        }
        static Clean() {
            for (const [key, ac] of this.aircraftCollection) {
                if ((this.nowTimestamp - ac.LastMessageTime) > 300) {
                    ac.Destroy();
                    const i = this.aircraftIcaoList.indexOf(ac.Icao);
                    this.aircraftIcaoList.splice(i, 1);
                    this.aircraftCollection.delete(key);
                }
            }
        }
        static Update(data, nowTimestamp, lastReceiverTimestamp) {
            this.nowTimestamp = nowTimestamp;
            for (const ac of data.aircraft) {
                const hex = ac.hex;
                let entry = null;
                if (hex === "000000") {
                    continue;
                }
                if (this.aircraftIcaoList.includes(hex)) {
                    entry = this.aircraftCollection.get(hex);
                }
                else {
                    entry = new READSB.ReadsbAircraft(hex);
                    entry.TableRow = this.RowTemplate.cloneNode(true);
                    entry.TableRow.id = hex;
                    if (hex[0] === "~") {
                        entry.TableRow.cells[0].textContent = hex.substring(1).toUpperCase();
                        entry.TableRow.style.fontStyle = "italic";
                    }
                    else {
                        entry.TableRow.cells[0].textContent = hex.toUpperCase();
                    }
                    if (entry.IcaoRange.FlagImage !== null) {
                        entry.TableRow.cells[1].getElementsByTagName("img")[0].src = READSB.AppSettings.FlagPath + entry.IcaoRange.FlagImage;
                        entry.TableRow.cells[1].getElementsByTagName("img")[0].title = entry.IcaoRange.Country;
                    }
                    entry.TableRow.addEventListener("click", READSB.Body.OnAircraftListRowClick.bind(READSB.Body, hex));
                    entry.TableRow.addEventListener("dblclick", READSB.Body.OnAircraftListRowDoubleClick.bind(READSB.Body, hex));
                    this.aircraftCollection.set(hex, entry);
                    this.aircraftIcaoList.push(hex);
                }
                if (this.selectAll) {
                    if (!entry.Visible && entry.IsFiltered) {
                        entry.Selected = false;
                    }
                    else {
                        entry.Selected = true;
                    }
                }
                entry.UpdateData(data.now, ac);
                entry.UpdateTick(nowTimestamp, lastReceiverTimestamp);
            }
        }
        static Refresh() {
            this.TrackedAircrafts = this.aircraftIcaoList.length;
            for (const ac of this.aircraftCollection.values()) {
                this.TrackedHistorySize += ac.HistorySize;
                if (ac.CivilMil === null) {
                    this.TrackedAircraftUnknown++;
                }
                let classes = "aircraftListRow";
                if (ac.Position !== null && ac.SeenPos < 60) {
                    ++this.TrackedAircraftPositions;
                    if (ac.PositionFromMlat) {
                        classes += " mlat";
                    }
                    else {
                        classes += " vPosition";
                    }
                }
                if (!ac.TableRow.Visible) {
                    continue;
                }
                if (ac.Interesting === true || ac.Highlight === true) {
                    classes += " interesting";
                }
                if (ac.Icao === this.selectedAircraft) {
                    classes += " selected";
                }
                if (ac.Squawk in this.specialSquawks) {
                    classes = classes + " " + this.specialSquawks[ac.Squawk].CssClass;
                }
                if (READSB.AppSettings.ShowFlags) {
                    ac.TableRow.cells[1].style.removeProperty("display");
                }
                else {
                    ac.TableRow.cells[1].style.display = "none";
                }
                if (ac.Flight) {
                    ac.TableRow.cells[2].textContent = ac.Flight;
                    if (ac.Operator !== null) {
                        ac.TableRow.cells[2].title = ac.Operator;
                    }
                }
                else {
                    ac.TableRow.cells[2].textContent = "";
                }
                let v = "";
                if (ac.Version === 0) {
                    v = " v0 (DO-260)";
                }
                else if (ac.Version === 1) {
                    v = " v1 (DO-260A)";
                }
                else if (ac.Version === 2) {
                    v = " v2 (DO-260B)";
                }
                ac.TableRow.cells[3].textContent = (ac.Registration !== null ? ac.Registration : "");
                ac.TableRow.cells[4].textContent = (ac.CivilMil !== null ? (ac.CivilMil === true ? READSB.Strings.MilitaryShort : READSB.Strings.CivilShort) : "");
                ac.TableRow.cells[5].textContent = (ac.IcaoType !== null ? ac.IcaoType : "");
                ac.TableRow.cells[6].textContent = (ac.Squawk !== null ? ac.Squawk : "");
                ac.TableRow.cells[7].textContent = READSB.Format.AltitudeBrief(ac.Altitude, ac.VertRate, READSB.AppSettings.DisplayUnits);
                ac.TableRow.cells[8].textContent = READSB.Format.SpeedBrief(ac.Speed, READSB.AppSettings.DisplayUnits);
                ac.TableRow.cells[9].textContent = READSB.Format.VerticalRateBrief(ac.VertRate, READSB.AppSettings.DisplayUnits);
                ac.TableRow.cells[10].textContent = READSB.Format.DistanceBrief(ac.SiteDist, READSB.AppSettings.DisplayUnits);
                ac.TableRow.cells[11].textContent = READSB.Format.TrackBrief(ac.Track);
                ac.TableRow.cells[12].textContent = (ac.Messages !== null ? ac.Messages.toString() : "");
                ac.TableRow.cells[13].textContent = ac.Seen.toFixed(0);
                ac.TableRow.cells[14].textContent = (ac.Rssi !== null ? ac.Rssi.toString() : "");
                ac.TableRow.cells[15].textContent = (ac.Position !== null ? ac.Position.lat.toFixed(4) : "");
                ac.TableRow.cells[16].textContent = (ac.Position !== null ? ac.Position.lng.toFixed(4) : "");
                ac.TableRow.className = classes;
            }
        }
        static ResortList() {
            let i = 0;
            for (const icao of this.aircraftIcaoList) {
                const ac = this.aircraftCollection.get(icao);
                ac.SortPos = i;
                ac.SortValue = this.sortExtract(ac);
                i++;
            }
            this.aircraftIcaoList.sort(this.SortFunction.bind(this));
            const tbody = document.getElementById("aircraftList").tBodies[0];
            for (const [pos, icao] of this.aircraftIcaoList.entries()) {
                const c = tbody.children.namedItem(icao);
                const r = this.aircraftCollection.get(icao).TableRow;
                if (r.Visible && c === null) {
                    tbody.appendChild(r);
                }
                else if (r.Visible) {
                    tbody.insertBefore(r, tbody.rows[pos]);
                }
                else if (!r.Visible && c !== null) {
                    c.remove();
                }
            }
        }
        static SortByICAO() {
            this.SortBy(READSB.eSortBy.Icao, this.CompareAlpha, (x) => {
                return x.Icao;
            });
        }
        static SortByFlight() {
            this.SortBy(READSB.eSortBy.Flight, this.CompareAlpha, (x) => {
                return x.Flight;
            });
        }
        static SortByRegistration() {
            this.SortBy(READSB.eSortBy.Registration, this.CompareAlpha, (x) => {
                return x.Registration;
            });
        }
        static SortByAircraftType() {
            this.SortBy(READSB.eSortBy.Type, this.CompareAlpha, (x) => {
                return x.IcaoType;
            });
        }
        static SortBySquawk() {
            this.SortBy(READSB.eSortBy.Squawk, this.CompareAlpha, (x) => {
                return x.Squawk;
            });
        }
        static SortByAltitude() {
            this.SortBy(READSB.eSortBy.Altitude, this.CompareNumeric, (x) => {
                return (isNaN(x.Altitude) ? -1e9 : x.Altitude);
            });
        }
        static SortBySpeed() {
            this.SortBy(READSB.eSortBy.Speed, this.CompareNumeric, (x) => {
                return x.Speed;
            });
        }
        static SortByVerticalRate() {
            this.SortBy(READSB.eSortBy.VerticalRate, this.CompareNumeric, (x) => {
                return x.VertRate;
            });
        }
        static SortByDistance() {
            this.SortBy(READSB.eSortBy.Distance, this.CompareNumeric, (x) => {
                return x.SiteDist;
            });
        }
        static SortByTrack() {
            this.SortBy(READSB.eSortBy.Track, this.CompareNumeric, (x) => {
                return x.Track;
            });
        }
        static SortByMsgs() {
            this.SortBy(READSB.eSortBy.Messages, this.CompareNumeric, (x) => {
                return x.Messages;
            });
        }
        static SortBySeen() {
            this.SortBy(READSB.eSortBy.Seen, this.CompareNumeric, (x) => {
                return x.Seen;
            });
        }
        static SortByCountry() {
            this.SortBy(READSB.eSortBy.Country, this.CompareAlpha, (x) => {
                return x.IcaoRange.Country;
            });
        }
        static SortByRssi() {
            this.SortBy(READSB.eSortBy.Rssi, this.CompareNumeric, (x) => {
                return x.Rssi;
            });
        }
        static SortByLatitude() {
            this.SortBy(READSB.eSortBy.Latitude, this.CompareNumeric, (x) => {
                return (x.Position !== null ? x.Position.lat : null);
            });
        }
        static SortByLongitude() {
            this.SortBy(READSB.eSortBy.Longitude, this.CompareNumeric, (x) => {
                return (x.Position !== null ? x.Position.lng : null);
            });
        }
        static SortByCivilMil() {
            this.SortBy(READSB.eSortBy.CivilMil, this.CompareAlpha, (x) => {
                return x.CivilMil;
            });
        }
        static CompareAlpha(xa, ya) {
            if (xa === ya) {
                return 0;
            }
            if (xa < ya) {
                return -1;
            }
            return 1;
        }
        static CompareNumeric(xf, yf) {
            if (Math.abs(xf - yf) < 1e-9) {
                return 0;
            }
            return xf - yf;
        }
        static SortBy(sortby, sc, se) {
            if (sortby === this.sortCriteria) {
                this.sortAscending = !this.sortAscending;
                this.aircraftIcaoList.reverse();
            }
            else {
                this.sortAscending = true;
            }
            this.sortCriteria = sortby;
            this.sortCompare = sc;
            this.sortExtract = se;
            this.ResortList();
        }
        static SortFunction(xs, ys) {
            const x = this.aircraftCollection.get(xs);
            const y = this.aircraftCollection.get(ys);
            const xv = x.SortValue;
            const yv = y.SortValue;
            if (x.Interesting === true) {
                return -1;
            }
            if (y.Interesting === true) {
                return 1;
            }
            if (x.Squawk in this.specialSquawks) {
                return -1;
            }
            if (y.Squawk in this.specialSquawks) {
                return 1;
            }
            if (xv === null && yv === null) {
                return x.SortPos - y.SortPos;
            }
            if (xv === null) {
                return 1;
            }
            if (yv === null) {
                return -1;
            }
            const c = this.sortAscending ? this.sortCompare(xv, yv) : this.sortCompare(yv, xv);
            if (c !== 0) {
                return c;
            }
            return x.SortPos - y.SortPos;
        }
        static DoneLoadHistory() {
            console.info("Done loading history");
            let now;
            let last = 0;
            if (this.positionHistoryBuffer.length > 0) {
                console.info("Sorting history");
                this.positionHistoryBuffer.sort((x, y) => x.now - y.now);
                for (let h = 0; h < this.positionHistoryBuffer.length; h += 1) {
                    ({ now } = this.positionHistoryBuffer[h]);
                    console.info(`Applying history ${h}/${this.positionHistoryBuffer.length} at: ${now}`);
                    this.Update(this.positionHistoryBuffer[h], this.positionHistoryBuffer[h].now, last);
                    last = now;
                }
            }
            this.positionHistoryBuffer = null;
            return last;
        }
    }
    AircraftCollection.RowTemplate = null;
    AircraftCollection.TrackedAircrafts = 0;
    AircraftCollection.TrackedAircraftPositions = 0;
    AircraftCollection.TrackedAircraftUnknown = 0;
    AircraftCollection.TrackedHistorySize = 0;
    AircraftCollection.FollowSelected = false;
    AircraftCollection.aircraftIcaoList = [];
    AircraftCollection.aircraftCollection = new Map();
    AircraftCollection.specialSquawks = {
        "0020": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(227, 200, 0)", Text: "Rettungshubschrauber" },
        "0023": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(0, 80, 239)", Text: "Bundespolizei" },
        "0025": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(243, 156, 18)", Text: "Absetzluftfahrzeug" },
        "0027": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(243, 156, 18)", Text: "Kunstflug" },
        "0030": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(243, 156, 18)", Text: "Vermessung" },
        "0031": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(243, 156, 18)", Text: "Open Skies" },
        "0033": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(0, 138, 0)", Text: "VFR Militär 550ftAGL <FL100" },
        "0034": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(243, 156, 18)", Text: "SAR Einsatz" },
        "0036": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(0, 80, 239)", Text: "Polizei Einsatz" },
        "0037": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(0, 80, 239)", Text: "Polizei BIV" },
        "1600": { CssClass: "squawkSpecialDE", MarkerColor: "rgb(0, 138, 0)", Text: "Militär Tieflug <500ft" },
        "7500": { CssClass: "squawk7500", MarkerColor: "rgb(255, 85, 85)", Text: "Aircraft Hijacking" },
        "7600": { CssClass: "squawk7600", MarkerColor: "rgb(0, 255, 255)", Text: "Radio Failure" },
        "7700": { CssClass: "squawk7700", MarkerColor: "rgb(255, 255, 0)", Text: "General Emergency" },
    };
    AircraftCollection.positionHistoryBuffer = [];
    AircraftCollection.selectedAircraft = null;
    AircraftCollection.selectAll = false;
    AircraftCollection.sortCriteria = "";
    AircraftCollection.sortCompare = AircraftCollection.SortByAltitude;
    AircraftCollection.sortExtract = null;
    AircraftCollection.sortAscending = true;
    AircraftCollection.nowTimestamp = 0;
    READSB.AircraftCollection = AircraftCollection;
})(READSB || (READSB = {}));
//# sourceMappingURL=aircraftCollection.js.map