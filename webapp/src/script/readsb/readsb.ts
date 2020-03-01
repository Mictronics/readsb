// Part of readsb, a Mode-S/ADSB/TIS message decoder.
//
// readsb.ts: Main class for readsb web application.
//
// Copyright (c) 2020 Michael Wolf <michael@mictronics.de>
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
    export class Main {
        /**
         * Initialize web application.
         */
        public static Initialize() {
            Registration.Init();
            Body.Init();
            Body.InitEventHandler();
            Body.InitDropDown();
            Input.InitializeCheckboxes();
            Input.SetSiteCirclesDistancesInput();
            Filter.Initialize();
            this.SetLanguage(AppSettings.AppLanguage);

            // Get the aircraft list row template from HTML.
            AircraftCollection.RowTemplate = Body.GetAircraftListRowTemplate();

            // Maybe hide flag info
            Body.ShowFlags(AppSettings.ShowFlags);

            // Hide some aircraft list columns when table is not expanded.
            Body.AircraftListSetColumnVisibility(false);

            // Sort aircraft list first time depending on site status.
            if (typeof AppSettings.SiteLat === "number" && typeof AppSettings.SiteLon === "number") {
                Input.SetSiteCoordinates();
                AircraftCollection.SortByDistance();
            } else {
                AircraftCollection.RowTemplate.cells[10].classList.add("hidden"); // hide distance column
                Body.AircraftListShowColumn("#aircraftListDistance", false); // hide distance header
                AircraftCollection.SortByAltitude();
            }

            // Get receiver metadata, reconfigure using it, then continue
            // with initialization
            fetch("data/receiver.json", {
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
                .then((data: IReceiverJson) => {
                    if (typeof data.lat !== "undefined") {
                        AppSettings.SiteLat = data.lat;
                        AppSettings.SiteLon = data.lon;
                        AppSettings.CenterLat = data.lat;
                        AppSettings.CenterLon = data.lon;
                    }

                    this.readsbVersion = data.version;

                    this.dataRefreshInterval = data.refresh;
                    // Start loading history
                    AircraftCollection.Init(data.history);

                    // RestoreSessionFilters();

                    this.RefreshAircraftListTable();
                    Body.RefreshInfoBlock(this.readsbVersion, this.GetMessageRate());
                    Body.RefreshSelectedAircraft();
                    AircraftCollection.Clean();
                    console.info("Completing init");

                    // Setup our timer to poll from the server.
                    window.setInterval(Main.FetchData.bind(Main), Main.DataRefreshInterval);
                    window.setInterval(AircraftCollection.Clean.bind(AircraftCollection), 60000);

                    // And kick off one refresh immediately.
                    Main.FetchData();
                });
        }

        /**
         * Set application language.
         * @param lng Language to set (ISO-639-1 code)
         */
        public static SetLanguage(lng: string) {
            // Make english the default language in failure cases
            if (lng === "" || lng === null || lng === undefined) {
                lng = "en";
            }

            i18next.use(i18nextXHRBackend).init({
                backend: {
                    loadPath: `./locales/${lng}.json`,
                },
                debug: false,
                fallbackLng: "en",
                lng,
            }, (err, t) => {
                const localize = LocI18next.Init(i18next);
                localize(".localized");
                Strings.OnLanguageChange();
                Body.UpdateAircraftListColumnUnits();
                // Init map when i18next is initialized to translate its strings.
                // No initialization when language changes.
                if (!LMap.Initialized) {
                    LMap.Init();
                }
            });
        }

        /**
         * Fetch data from readsb backend service.
         * Periodical called.
         */
        public static FetchData() {
            if (this.fetchPending) {
                // don't double up on fetches, let the last one resolve
                return;
            }

            this.fetchPending = true;
            fetch("data/aircraft.json", {
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
                .then((data: IAircraftData) => {
                    const now = data.now;
                    // Detect stats reset
                    if (this.messageCountHistory.length > 0 && this.messageCountHistory[this.messageCountHistory.length - 1].messages > data.messages) {
                        this.messageCountHistory = [{
                            messages: 0,
                            time: this.messageCountHistory[this.messageCountHistory.length - 1].time,
                        }];
                    }

                    // Note the message count in the history
                    this.messageCountHistory.push({ time: now, messages: data.messages });
                    // and clean up any old values
                    if ((now - this.messageCountHistory[0].time) > 30) {
                        this.messageCountHistory.shift();
                    }

                    // Update aircraft data, timestamps, visibility, history track for all aircrafts.
                    AircraftCollection.Update(data, now, this.lastReceiverTimestamp);

                    this.RefreshAircraftListTable();
                    Body.RefreshInfoBlock(this.readsbVersion, this.GetMessageRate());
                    Body.RefreshSelectedAircraft();

                    // Check for stale receiver data
                    if (this.lastReceiverTimestamp === now) {
                        this.staleReceiverCount++;
                        if (this.staleReceiverCount > 5) {
                            Body.UpdateErrorToast(i18next.t("error.dataTimeOut"), true);
                        }
                    } else {
                        this.staleReceiverCount = 0;
                        this.lastReceiverTimestamp = now;
                        Body.UpdateErrorToast("", false);
                    }
                    this.fetchPending = false;
                })
                .catch((error) => {
                    this.fetchPending = false;
                    Body.UpdateErrorToast(i18next.t("error.fetchingData", { msg: error }), true);
                    console.error(error);
                });
        }

        private static dataRefreshInterval: number = 0;
        static get DataRefreshInterval(): number {
            return this.dataRefreshInterval;
        }
        private static readsbVersion: string;
        private static fetchPending: boolean = false;
        private static staleReceiverCount: number = 0;
        private static lastReceiverTimestamp: number = 0;
        private static messageCountHistory: IMessageCountHistory[] = [];

        /**
         * Refreshes the aircraft list table in GUI.
         */
        private static RefreshAircraftListTable() {
            AircraftCollection.TrackedAircrafts = 0;
            AircraftCollection.TrackedAircraftPositions = 0;
            AircraftCollection.TrackedAircraftUnknown = 0;
            AircraftCollection.TrackedHistorySize = 0;
            AircraftCollection.Refresh();
            AircraftCollection.ResortList();
        }

        private static GetMessageRate(): number {
            let messageRate: number = null;
            if (this.messageCountHistory.length > 1) {
                const messageTimeDelta = this.messageCountHistory[this.messageCountHistory.length - 1].time - this.messageCountHistory[0].time;
                const messageCountDelta = this.messageCountHistory[this.messageCountHistory.length - 1].messages - this.messageCountHistory[0].messages;
                if (messageTimeDelta > 0) {
                    messageRate = messageCountDelta / messageTimeDelta;
                }
            } else {
                messageRate = null;
            }
            return messageRate;
        }
    }
}
