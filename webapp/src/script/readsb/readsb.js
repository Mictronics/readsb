"use strict";
var READSB;
(function (READSB) {
    class Main {
        static Initialize() {
            READSB.Registration.Init();
            READSB.Body.Init();
            READSB.Body.InitEventHandler();
            READSB.Body.InitDropDown();
            READSB.Input.InitializeCheckboxes();
            READSB.Input.SetSiteCirclesDistancesInput();
            READSB.Filter.Initialize();
            this.SetLanguage(READSB.AppSettings.AppLanguage);
            READSB.AircraftCollection.RowTemplate = READSB.Body.GetAircraftListRowTemplate();
            READSB.Body.ShowFlags(READSB.AppSettings.ShowFlags);
            READSB.Body.ShowLoadProgress(true);
            READSB.Body.AircraftListSetColumnVisibility(false);
            if (typeof READSB.AppSettings.SiteLat === "number" && typeof READSB.AppSettings.SiteLon === "number") {
                READSB.Input.SetSiteCoordinates();
                READSB.AircraftCollection.SortByDistance();
            }
            else {
                READSB.AircraftCollection.RowTemplate.cells[10].classList.add("hidden");
                READSB.Body.AircraftListShowColumn("#aircraftListDistance", false);
                READSB.AircraftCollection.SortByAltitude();
            }
            fetch("data/receiver.json", {
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
                if (typeof data.lat !== "undefined") {
                    READSB.AppSettings.SiteLat = data.lat;
                    READSB.AppSettings.SiteLon = data.lon;
                    READSB.AppSettings.CenterLat = data.lat;
                    READSB.AppSettings.CenterLon = data.lon;
                }
                this.readsbVersion = data.version;
                this.dataRefreshInterval = data.refresh;
                this.positionHistorySize = data.history;
                READSB.Body.OnLoadProgress(this.positionHistorySize, 0);
                READSB.AircraftCollection.StartLoadHistory(this.positionHistorySize, READSB.Body.OnLoadProgress, this.OnEndLoad.bind(this));
            });
        }
        static SetLanguage(lng) {
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
                READSB.Strings.OnLanguageChange();
                if (!READSB.LMap.Initialized) {
                    READSB.LMap.Init();
                }
            });
        }
        static FetchData() {
            if (this.fetchPending) {
                return;
            }
            this.fetchPending = true;
            fetch("data/aircraft.json", {
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
                const now = data.now;
                if (this.messageCountHistory.length > 0 && this.messageCountHistory[this.messageCountHistory.length - 1].messages > data.messages) {
                    this.messageCountHistory = [{
                            messages: 0,
                            time: this.messageCountHistory[this.messageCountHistory.length - 1].time,
                        }];
                }
                this.messageCountHistory.push({ time: now, messages: data.messages });
                if ((now - this.messageCountHistory[0].time) > 30) {
                    this.messageCountHistory.shift();
                }
                READSB.AircraftCollection.Update(data, now, this.lastReceiverTimestamp);
                this.RefreshAircraftListTable();
                READSB.Body.RefreshInfoBlock(this.readsbVersion, this.GetMessageRate());
                READSB.Body.RefreshSelectedAircraft();
                if (this.lastReceiverTimestamp === now) {
                    this.staleReceiverCount++;
                    if (this.staleReceiverCount > 5) {
                        READSB.Body.UpdateErrorToast(i18next.t("error.dataTimeOut"), true);
                    }
                }
                else {
                    this.staleReceiverCount = 0;
                    this.lastReceiverTimestamp = now;
                    READSB.Body.UpdateErrorToast("", false);
                }
                this.fetchPending = false;
            })
                .catch((error) => {
                this.fetchPending = false;
                console.error(READSB.Body.UpdateErrorToast(i18next.t("error.fetchingData", { msg: error }), true));
            });
        }
        static get DataRefreshInterval() {
            return this.dataRefreshInterval;
        }
        static OnEndLoad() {
            READSB.Body.ShowLoadProgress(false);
            console.info("Completing init");
            this.RefreshAircraftListTable();
            READSB.Body.RefreshInfoBlock(this.readsbVersion, this.GetMessageRate());
            READSB.Body.RefreshSelectedAircraft();
            READSB.AircraftCollection.Clean();
            window.setInterval(Main.FetchData.bind(Main), Main.DataRefreshInterval);
            window.setInterval(READSB.AircraftCollection.Clean.bind(READSB.AircraftCollection), 60000);
            Main.FetchData();
        }
        static RefreshAircraftListTable() {
            READSB.AircraftCollection.TrackedAircrafts = 0;
            READSB.AircraftCollection.TrackedAircraftPositions = 0;
            READSB.AircraftCollection.TrackedAircraftUnknown = 0;
            READSB.AircraftCollection.TrackedHistorySize = 0;
            READSB.Body.UpdateAircraftListColumnUnits();
            READSB.AircraftCollection.Refresh();
            READSB.AircraftCollection.ResortList();
        }
        static GetMessageRate() {
            let messageRate = null;
            if (this.messageCountHistory.length > 1) {
                const messageTimeDelta = this.messageCountHistory[this.messageCountHistory.length - 1].time - this.messageCountHistory[0].time;
                const messageCountDelta = this.messageCountHistory[this.messageCountHistory.length - 1].messages - this.messageCountHistory[0].messages;
                if (messageTimeDelta > 0) {
                    messageRate = messageCountDelta / messageTimeDelta;
                }
            }
            else {
                messageRate = null;
            }
            return messageRate;
        }
    }
    Main.dataRefreshInterval = 0;
    Main.positionHistorySize = 0;
    Main.fetchPending = false;
    Main.staleReceiverCount = 0;
    Main.lastReceiverTimestamp = 0;
    Main.messageCountHistory = [];
    READSB.Main = Main;
})(READSB || (READSB = {}));
//# sourceMappingURL=readsb.js.map