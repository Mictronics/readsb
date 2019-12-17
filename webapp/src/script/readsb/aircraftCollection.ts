// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// aircraftCollection.ts: Collection of aircraft objects.
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
    export class AircraftCollection {
        public static RowTemplate: HTMLTableRowElement = null;
        public static TrackedAircrafts: number = 0;
        public static TrackedAircraftPositions: number = 0;
        public static TrackedAircraftUnknown: number = 0;
        public static TrackedHistorySize: number = 0;
        public static FollowSelected: boolean = false;

        /**
         * Get ICAO24 address of selected aircraft.
         */
        static get Selected(): string {
            return this.selectedAircraft;
        }
        /**
         * Select specific aircraft in collection by ICAO24 address.
         */
        static set Selected(value: string) {
            // Deselect previous aircraft if any.
            if (this.selectedAircraft !== null) {
                this.aircraftCollection.get(this.selectedAircraft).Selected = false;
                // Immediately remove track when selected
                this.aircraftCollection.get(this.selectedAircraft).ClearLines();
                this.aircraftCollection.get(this.selectedAircraft).UpdateMarker(false);
                (this.aircraftCollection.get(this.selectedAircraft).TableRow as HTMLTableRowElement).classList.remove("selected");
            }
            // Select new aircraft.
            this.selectedAircraft = value;
            if (this.selectedAircraft !== null) {
                this.aircraftCollection.get(this.selectedAircraft).Selected = true;
                // Immediately show track when selected
                this.aircraftCollection.get(this.selectedAircraft).UpdateLines();
                this.aircraftCollection.get(this.selectedAircraft).UpdateMarker(false);
                (this.aircraftCollection.get(this.selectedAircraft).TableRow as HTMLTableRowElement).classList.add("selected");
            }
        }

        /**
         * Select all aircrafts in collection.
         * Loop through and mark them as selected to show the paths for all planes.
         */
        static get SelectAll(): boolean {
            return this.selectAll;
        }

        static set SelectAll(value: boolean) {
            this.selectAll = value;
            // if all planes are already selected, deselect them all
            if (this.selectAll) {
                this.Selected = null;
                this.selectAll = true;
                this.aircraftCollection.forEach((ac: IAircraft) => {
                    if (ac.Visible && !ac.IsFiltered) {
                        ac.Selected = true;
                    }
                });
            } else {
                this.aircraftCollection.forEach((ac: IAircraft) => {
                    ac.Selected = false;
                    ac.ClearLines();
                    if (ac.TableRow) {
                        (ac.TableRow as HTMLTableRowElement).classList.remove("selected");
                    }
                });
                this.selectedAircraft = null;
                this.selectAll = false;
            }
        }

        /**
         * Get specific plane from collection or selected if no address is given in parameter.
         * @param icao ICAO24 aircraft address. Selected aircraft be default.
         */
        public static Get(icao: string = this.selectedAircraft): IAircraft {
            if (icao !== null) {
                return this.aircraftCollection.get(icao);
            }
            return null;
        }

        /**
         * Check if given squawk is a special one, return details if true. False otherwise.
         * @param squawk Squawk to check.
         * @returns Special squawk object if found or false otherwise.
         */
        public static IsSpecialSquawk(squawk: string): ISpecialSquawk {
            if (squawk in this.specialSquawks) {
                return this.specialSquawks[squawk];
            }
            return null;
        }

        /**
         * Start loading aircraft history from readsb backend.
         * @param historySize Size of aircraft history.
         * @param progressCallback Callback to update loading progress in GUI.
         * @param endLoadingCallback Call back when loading history was finalized.
         */
        public static StartLoadHistory(historySize: number, progressCallback: (max: number, progress: number) => void, endLoadingCallback: (lastTimestamp: number) => void) {
            let loaded = 0;
            if (historySize > 0 && window.location.hash !== "#nohistory") {
                console.info("Starting to load history (" + historySize + " items)");
                for (let i = 0; i < historySize; i++) {
                    fetch(`data/history_${i}.json`, {
                        cache: "no-cache",
                        method: "GET",
                        mode: "cors",
                    })
                        .then((res: Response) => {
                            if (res.status >= 200 && res.status < 300) {
                                return Promise.resolve(res);
                            } else {
                                return Promise.reject(new Error(res.statusText));
                            }
                        })
                        .then((res: Response) => {
                            return res.json();
                        })
                        .then((data: IHistoryData) => {
                            if (loaded < 0) {
                                return;
                            }
                            this.positionHistoryBuffer.push(data); // don't care for order, will sort later
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
            } else {
                endLoadingCallback(this.DoneLoadHistory());
            }
        }

        /**
         * Clean aircraft list periodical. Remove aircrafts not seen for more than 300 seconds.
         */
        public static Clean() {
            // Look for aircrafts where we have seen no messages for >300 seconds
            for (const [key, ac] of this.aircraftCollection) {
                if (ac.Seen > 300) {
                    // Delete it.
                    ac.Destroy();
                    const i = this.aircraftIcaoList.indexOf(ac.Icao);
                    this.aircraftIcaoList.splice(i, 1);
                    this.aircraftCollection.delete(key);
                }
            }
        }

        /**
         * Update aircraft list. Add new if not existing.
         * @param data JSON data fetched from readsb backend.
         */
        public static Update(data: IAircraftData, nowTimestamp: number, lastReceiverTimestamp: number) {
            for (const ac of data.aircraft) {
                const hex = ac.hex;
                let entry = null;

                if (hex === "000000") {
                    continue;
                } // Skip invalid ICAO24

                // Do we already have this aircraft object in queue?
                // If not make it.
                if (this.aircraftIcaoList.includes(hex)) {
                    entry = this.aircraftCollection.get(hex);
                } else {
                    entry = new ReadsbAircraft(hex);
                    entry.TableRow = this.RowTemplate.cloneNode(true) as HTMLTableRowElement;
                    entry.TableRow.id = hex;
                    if (hex[0] === "~") {
                        // Non-ICAO address
                        entry.TableRow.cells[0].textContent = hex.substring(1).toUpperCase();
                        entry.TableRow.style.fontStyle = "italic";
                    } else {
                        entry.TableRow.cells[0].textContent = hex.toUpperCase();
                    }

                    // set flag image if available
                    if (entry.IcaoRange.FlagImage !== null) {
                        entry.TableRow.cells[1].getElementsByTagName("img")[0].src = AppSettings.FlagPath + entry.IcaoRange.FlagImage;
                        entry.TableRow.cells[1].getElementsByTagName("img")[0].title = entry.IcaoRange.Country;
                    }

                    entry.TableRow.addEventListener("click", Body.OnAircraftListRowClick.bind(Body, hex));
                    entry.TableRow.addEventListener("dblclick", Body.OnAircraftListRowDoubleClick.bind(Body, hex));

                    this.aircraftCollection.set(hex, entry);
                    this.aircraftIcaoList.push(hex);
                }

                // Select new new aircraft in case all are selected.
                if (this.selectAll) {
                    if (!entry.Visible && entry.IsFiltered) {
                        entry.Selected = false;
                    } else {
                        entry.Selected = true;
                    }
                }

                // Call the function update.
                entry.UpdateData(data.now, ac);
                // Update timestamps, visibility, history track for aircraft entry.
                entry.UpdateTick(nowTimestamp, lastReceiverTimestamp);
            }
        }

        /**
         * Refresh aircraft list.
         */
        public static Refresh() {
            for (const ac of this.aircraftCollection.values()) {
                if (!ac.TableRow.Visible) {
                    continue;
                }

                this.TrackedHistorySize += ac.HistorySize;

                this.TrackedAircrafts++;
                if (ac.CivilMil === null) {
                    this.TrackedAircraftUnknown++;
                }
                let classes = "aircraftListRow";

                if (ac.Position !== null && ac.SeenPos < 60) {
                    ++this.TrackedAircraftPositions;
                    if (ac.PositionFromMlat) {
                        classes += " mlat";
                    } else {
                        classes += " vPosition";
                    }
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

                if (AppSettings.ShowFlags) {
                    ac.TableRow.cells[1].style.removeProperty("display");
                } else {
                    ac.TableRow.cells[1].style.display = "none";
                }

                // ICAO doesn't change
                if (ac.Flight) {
                    ac.TableRow.cells[2].textContent = ac.Flight;
                    if (ac.Operator !== null) {
                        ac.TableRow.cells[2].title = ac.Operator;
                    }
                } else {
                    ac.TableRow.cells[2].textContent = "";
                }

                let v = "";
                if (ac.Version === 0) {
                    v = " v0 (DO-260)";
                } else if (ac.Version === 1) {
                    v = " v1 (DO-260A)";
                } else if (ac.Version === 2) {
                    v = " v2 (DO-260B)";
                }

                ac.TableRow.cells[3].textContent = (ac.Registration !== null ? ac.Registration : "");
                ac.TableRow.cells[4].textContent = (ac.CivilMil !== null ? (ac.CivilMil === true ? Strings.MilitaryShort : Strings.CivilShort) : "");
                ac.TableRow.cells[5].textContent = (ac.IcaoType !== null ? ac.IcaoType : "");
                ac.TableRow.cells[6].textContent = (ac.Squawk !== null ? ac.Squawk : "");
                ac.TableRow.cells[7].textContent = Format.AltitudeBrief(ac.Altitude, ac.VertRate, AppSettings.DisplayUnits);
                ac.TableRow.cells[8].textContent = Format.SpeedBrief(ac.Speed, AppSettings.DisplayUnits);
                ac.TableRow.cells[9].textContent = Format.VerticalRateBrief(ac.VertRate, AppSettings.DisplayUnits);
                ac.TableRow.cells[10].textContent = Format.DistanceBrief(ac.SiteDist, AppSettings.DisplayUnits);
                ac.TableRow.cells[11].textContent = Format.TrackBrief(ac.Track);
                ac.TableRow.cells[12].textContent = (ac.Messages !== null ? ac.Messages.toString() : "");
                ac.TableRow.cells[13].textContent = ac.Seen.toFixed(0);
                ac.TableRow.cells[14].textContent = (ac.Rssi !== null ? ac.Rssi.toString() : "");
                ac.TableRow.cells[15].textContent = (ac.Position !== null ? ac.Position.lat.toFixed(4) : "");
                ac.TableRow.cells[16].textContent = (ac.Position !== null ? ac.Position.lng.toFixed(4) : "");
                ac.TableRow.className = classes;
            }
        }

        public static ResortList() {
            // Number the existing rows so we can do a stable sort
            // regardless of whether sort() is stable or not.
            // Also extract the sort comparison value.
            let i = 0;
            for (const icao of this.aircraftIcaoList) {
                const ac = this.aircraftCollection.get(icao);
                ac.SortPos = i;
                ac.SortValue = this.sortExtract(ac);
                i++;
            }

            this.aircraftIcaoList.sort(this.SortFunction.bind(this));

            const tbody = (document.getElementById("aircraftList") as HTMLTableElement).tBodies[0];
            for (const [pos, icao] of this.aircraftIcaoList.entries()) {
                const c = tbody.children.namedItem(icao);
                const r = this.aircraftCollection.get(icao).TableRow;
                if (r.Visible && c === null) {
                    // Aircraft/Row is visible but not in list - add.
                    tbody.appendChild(r);
                } else if (r.Visible) {
                    // Aircraft/Row is visible and in list - sort.
                    tbody.insertBefore(r, tbody.rows[pos]);
                } else if (!r.Visible && c !== null) {
                    // Aircraft/Row is not visible but in list - remove.
                    c.remove();
                }
                // Do nothing if aircraft/row is not visible and not in list.
            }
        }

        public static SortByICAO() {
            this.SortBy(eSortBy.Icao, this.CompareAlpha, (x: IAircraft) => {
                return x.Icao;
            });
        }
        public static SortByFlight() {
            this.SortBy(eSortBy.Flight, this.CompareAlpha, (x: IAircraft) => {
                return x.Flight;
            });
        }
        public static SortByRegistration() {
            this.SortBy(eSortBy.Registration, this.CompareAlpha, (x: IAircraft) => {
                return x.Registration;
            });
        }
        public static SortByAircraftType() {
            this.SortBy(eSortBy.Type, this.CompareAlpha, (x: IAircraft) => {
                return x.IcaoType;
            });
        }
        public static SortBySquawk() {
            this.SortBy(eSortBy.Squawk, this.CompareAlpha, (x: IAircraft) => {
                return x.Squawk;
            });
        }
        public static SortByAltitude() {
            this.SortBy(eSortBy.Altitude, this.CompareNumeric, (x: IAircraft) => {
                return (isNaN(x.Altitude) ? -1e9 : x.Altitude);
            });
        }
        public static SortBySpeed() {
            this.SortBy(eSortBy.Speed, this.CompareNumeric, (x: IAircraft) => {
                return x.Speed;
            });
        }
        public static SortByVerticalRate() {
            this.SortBy(eSortBy.VerticalRate, this.CompareNumeric, (x: IAircraft) => {
                return x.VertRate;
            });
        }
        public static SortByDistance() {
            this.SortBy(eSortBy.Distance, this.CompareNumeric, (x: IAircraft) => {
                return x.SiteDist;
            });
        }
        public static SortByTrack() {
            this.SortBy(eSortBy.Track, this.CompareNumeric, (x: IAircraft) => {
                return x.Track;
            });
        }
        public static SortByMsgs() {
            this.SortBy(eSortBy.Messages, this.CompareNumeric, (x: IAircraft) => {
                return x.Messages;
            });
        }
        public static SortBySeen() {
            this.SortBy(eSortBy.Seen, this.CompareNumeric, (x: IAircraft) => {
                return x.Seen;
            });
        }
        public static SortByCountry() {
            this.SortBy(eSortBy.Country, this.CompareAlpha, (x: IAircraft) => {
                return x.IcaoRange.Country;
            });
        }
        public static SortByRssi() {
            this.SortBy(eSortBy.Rssi, this.CompareNumeric, (x: IAircraft) => {
                return x.Rssi;
            });
        }
        public static SortByLatitude() {
            this.SortBy(eSortBy.Latitude, this.CompareNumeric, (x: IAircraft) => {
                return (x.Position !== null ? x.Position.lat : null);
            });
        }
        public static SortByLongitude() {
            this.SortBy(eSortBy.Longitude, this.CompareNumeric, (x: IAircraft) => {
                return (x.Position !== null ? x.Position.lng : null);
            });
        }
        public static SortByCivilMil() {
            this.SortBy(eSortBy.CivilMil, this.CompareAlpha, (x: IAircraft) => {
                return x.CivilMil;
            });
        }

        /**
         * Holds the sorted order of ICAO24 addresses from aircraftCollection.
         */
        private static aircraftIcaoList: string[] = [];
        /**
         * Aircraft collection in (unsorted) order of addition.
         */
        private static aircraftCollection = new Map<string, IAircraft>();

        /**
         * Special allocated squawks by ICAO, rest mainly in Germany.
         */
        private static specialSquawks: { [key: string]: ISpecialSquawk } = {
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

        private static positionHistoryBuffer: IHistoryData[] = [];
        private static selectedAircraft: string = null;
        private static selectAll: boolean = false;
        private static sortCriteria: string = "";
        private static sortCompare: any = AircraftCollection.SortByAltitude;
        private static sortExtract: any = null;
        private static sortAscending = true;

        private static CompareAlpha(xa: any, ya: any) {
            if (xa === ya) {
                return 0;
            }
            if (xa < ya) {
                return -1;
            }
            return 1;
        }

        private static CompareNumeric(xf: number, yf: number) {
            if (Math.abs(xf - yf) < 1e-9) {
                return 0;
            }

            return xf - yf;
        }

        private static SortBy(sortby: eSortBy, sc: any, se: any) {
            if (sortby === this.sortCriteria) {
                this.sortAscending = !this.sortAscending;
                // This correctly flips the order of rows that compare equal.
                this.aircraftIcaoList.reverse();
            } else {
                this.sortAscending = true;
            }

            this.sortCriteria = sortby;
            this.sortCompare = sc;
            this.sortExtract = se;

            this.ResortList();
        }

        private static SortFunction(xs: string, ys: string) {
            const x = this.aircraftCollection.get(xs);
            const y = this.aircraftCollection.get(ys);
            const xv = x.SortValue;
            const yv = y.SortValue;

            // Put aircrafts marked interesting always on top of the list
            if (x.Interesting === true) {
                return -1;
            }
            if (y.Interesting === true) {
                return 1;
            }

            // Put aircrafts with special squawks on to of the list
            if (x.Squawk in this.specialSquawks) {
                return -1;
            }
            if (y.Squawk in this.specialSquawks) {
                return 1;
            }

            // always sort missing values at the end, regardless of
            // ascending/descending sort
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

        /**
         * Finalize loading of aircraft history.
         */
        private static DoneLoadHistory(): number {
            console.info("Done loading history");
            let now;
            let last = 0;
            if (this.positionHistoryBuffer.length > 0) {
                // Sort history by timestamp
                console.info("Sorting history");
                this.positionHistoryBuffer.sort((x, y) => x.now - y.now);

                // Process history
                for (let h = 0; h < this.positionHistoryBuffer.length; h += 1) {
                    ({ now } = this.positionHistoryBuffer[h]);
                    console.info(
                        `Applying history ${h}/${this.positionHistoryBuffer.length} at: ${now}`,
                    );
                    this.Update(this.positionHistoryBuffer[h], this.positionHistoryBuffer[h].now, last);
                    last = now;
                }
            }

            this.positionHistoryBuffer = null;
            return last;
        }
    }
}
